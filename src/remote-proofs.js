const async = require('neo-async')
const validUrl = require('valid-url')
const parse = require('url-parse')

try {
  var ghToken = require('./auth').githubToken
} catch (ex) {
  throw new Error('Github read-only API token is required to get remote proofs')
}
const GistClient = require("gist-client")
const gistClient = new GistClient()
gistClient.setToken(ghToken)

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, NUMBER, BOOL, FUNCTION } = require('./utils')
const { log, error } = require('./log')

class RemoteProofs {

  constructor (proof) {
    this.proofApi = proof
    this.gistClient = gistClient
  }

  handleRemoteProofs (proofsArr) {

  }

  async getGist (id) {
    if (!id) {
      throw new Error('Gist ID required')
    }
    try {
      let gist = await gistClient.getOneById(id)

      return gist
    } catch (ex) {
      return {
        error: ex,
        body: {
          files: {
            error: {
              content: {
                error: ex
              }
            }
          }
        }
      }
    }
  }

  extractProofFromGist (response) {
    if (!response) {
      throw new Error('gist is required')
    }

    // JSON = gist -> files -> first key -> content
    let files = response.files
    let keys = Object.keys(response.files)

    try {
      // TODO: for now assume there is only one document to deal with
      //       We may need to loop & get all
      return JSON.parse(files[keys[0]].content)
    } catch (ex) {
      return null
    }
  }

  formatRedditUrl (url) {
    if (!validUrl.isUri(url)) {
      throw new Error('Valid url is required')
    }

    let parsed = parse(url)
    if (!parsed.hostname === 'www.reddit.com') {
      throw new Error('Url has to use www.reddit.com as host')
    }

    if (url.endsWith('.json')) {
      return url
    } else if (url.endsWith('/')) {
      let urlArr = url.split('/')
      urlArr.pop() // removes the enpty
      return `${urlArr.join('/')}.json`
    } else {
      throw new Error('Url is not correct format for a Reddit proof')
    }
  }

  async getRedditData (url) {
    let rUrl = this.formatRedditUrl(url)

    if (!validUrl.isUri(rUrl)) {
      throw new Error('Valid url is required')
    }
    try {
      return await fetch(rUrl)
        .then((response) => {
          return response.json();
        })
    } catch (ex) {
      console.error(ex)
      return null
    }
  }

  extractRedditProof (json) {
    // The Raw content text is in this path:
    // json[0].data.children[0].data.selftext
    try {
      return JSON.parse(`${json[0].data.children[0].data.selftext}`)
    } catch (ex) {
      return null
    }
  }

  // validate the proof format
  // TODO: formalize this format & use jsonschema & format versioning
  validateProof (proofWrapper, username, service) {
    if (proofWrapper === null || typeof proofWrapper !== OBJECT) {
      // proofWrapper might be null as github has a rate limiter
      // TODO: do not call gists function too often
      return false
    }

    let validKeysProof = {
      message: OBJECT,
      timestamp: NUMBER,
      expires: NUMBER,
      ipfsId: STRING,
      handle: STRING
    }
    let validKeysProofWrapper = {
      handle: STRING,
      ipfsId: STRING,
      proof: OBJECT,
      signature: STRING,
      timestamp: NUMBER,
      publicKey: STRING,
      _hash: STRING, // TODO: change to ipfsContentHash
      ipfsContentHash: STRING,
      id: STRING,
      createdTs: NUMBER,
      updatedTs: NUMBER,
      url: STRING
    }

    let validKeysMessage = {
      statement: STRING,
      username: STRING,
      service: STRING
    }

    let valid = true
    let keys = Object.keys(proofWrapper)
    keys.forEach((key) => {
      if (typeof proofWrapper[key] !== validKeysProofWrapper[key]) {
        valid = false
      }
    })

    keys = Object.keys(proofWrapper.proof)
    keys.forEach((key) => {
      if (typeof proofWrapper.proof[key] !== validKeysProof[key]) {
        if (!(key === 'expires')) { // TODO: test expires!
          valid = false
        }
      }
    })

    keys = Object.keys(proofWrapper.proof.message)
    keys.forEach((key) => {
      if (typeof proofWrapper.proof.message[key] !== validKeysMessage[key]) {
        valid = false
      }
    })

    if (proofWrapper.proof.message.username !== username) {
      valid = false
    }

    if (proofWrapper.proof.message.service !== service) {
      valid = false
    }

    // TODO: validate the host we fetched the proof from agains the service domain
    return valid
  }

  getGistIdFromUrl (url) {
    let parsed = parse(url)
    if (!parsed.hostname === 'gist.github.com') {
      throw new Error('Url has to use gist.github.com as host')
    }

    let arr = url.split('/')
    let gistId
    arr.some((item) => {
      if (item.length === 32) {
        gistId = item
        return gistId
      }
    })
    return gistId
  }

  async processGist (url, username, service, item, callback) {
    const that = this;
    // extract gist ID from url
    let gistId = this.getGistIdFromUrl(url)
    // get gist
    return await this.getGist(gistId).then((res) => {
      if (res.error) {
        console.error(res.error)
        callback(res.error, { valid: false, url: url, doc: {} })
      }
      // extract proof
      var proofDoc = that.extractProofFromGist(res)
      // validate proof
      let valid = that.validateProof(proofDoc, username, service)

      if (!valid) {
        return callback(ex, { valid: false,
                              url: url,
                              doc: item,
                              username: username,
                              service: service
                            })
      }
      // verify Proof
      that.proofApi.verifyProof(proofDoc, (err, valid) => {
        if (typeof callback === FUNCTION) {
          callback(err, { valid: valid, url: url, doc: proofDoc })
        }
      })
    }).catch((ex) => {
      error(ex)
      callback(ex, { valid: false, url: url, doc: proofDoc })
    })
  }

  verifyMultipleGists (gistArray, callback) {
    const that = this

    if (!Array.isArray(gistArray) || !gistArray.length) {
      throw new Error('gistArray is a required argument')
    }

    function process (item, callback) {
      setTimeout(() => {
        // FIXED?? Github API Rate Limit may flag IP
        return that.processGist(item.url,
                                item.username,
                                item.service,
                                item,
                                callback)
      }, 250)
    }

    async.mapSeries(gistArray, process, (err, results) => {
      if (err) {
        console.error(err)
        return callback(err, results)
      }
      return callback(null, results)
    })
  }

  // TODO: make processProofUrl() & verifyMultipleProofs() handle each type pf remote proof: gist, reddit, etc, etc

  async processProofUrl (url, username, service, item, callback) {
    const that = this
    const VALID_HOSTNAMES = ['www.reddit.com', 'gist.github.com']
    const REDDIT = VALID_HOSTNAMES[0]
    const GIST = VALID_HOSTNAMES[1]
    let valid = validUrl.isUri(url)

    if (!valid) {
      throw new Error('url is not valid')
    }

    let hostname = parse(url).hostname

    if (!VALID_HOSTNAMES.includes(hostname)) {
      throw new Error('url does not include valid hostname')
    }
    switch (hostname) {
    case REDDIT:
      this.getRedditData(url)
        .then((json) => {
          // extract Proof
          let proofDoc = that.extractRedditProof(json)
          let valid = that.validateProof(proofDoc, username, service)

          if (!valid) {
            return callback('Invalid proof',
                            { valid: false,
                              url: url,
                              doc: item,
                              username: username,
                              service: service
                            })
          }
          // verify Proof
          that.proofApi.verifyProof(proofDoc, (err, valid) => {
            if (typeof callback === FUNCTION) {
              console.log('REDDIT Verified Proof:', valid, url, proofDoc)
              callback(err, { valid: valid, url: url, doc: proofDoc })
            }
          })
        })
        .catch((ex) => {
          error(ex)
          callback(ex, { valid: false, url: url, doc: proofDoc })
        })
      break
    case GIST:
      let gistId = this.getGistIdFromUrl(url)
      // get gist
      return this.getGist(gistId).then((res) => {
        if (res.error) {
          console.error(res.error)
          callback(res.error, { valid: false, url: url, doc: {} })
        }
        // extract proof
        var proofDoc = that.extractProofFromGist(res)
        // validate proof
        let valid = that.validateProof(proofDoc, username, service)

        if (!valid) {
          return callback('Invalid proof',
                          { valid: false,
                            url: url,
                            doc: item,
                            username: username,
                            service: service
                          })
        }
        // verify Proof
        that.proofApi.verifyProof(proofDoc, (err, valid) => {
          if (typeof callback === FUNCTION) {
            console.log('GIST Verified Proof:', valid, url, proofDoc)
            callback(err, { valid: valid, url: url, doc: proofDoc })
          }
        })
      }).catch((ex) => {
        error(ex)
        callback(ex, { valid: false, url: url, doc: proofDoc })
      })
    }
  }

  verifyMultipleRemoteProofs (proofArray, callback) {
    const that = this

    if (!Array.isArray(proofArray) || !proofArray.length) {
      throw new Error('proofArray is a required argument')
    }

    function process (item, callback) {
      setTimeout(() => {
        // slow this down due to aret limits?
        return that.processProofUrl(item.url,
                                    item.username,
                                    item.service,
                                    item,
                                    callback)
      }, 250)
    }

    async.mapSeries(proofArray, process, (err, results) => {
      if (err) {
        console.error(err)
        return callback(err, results)
      }
      return callback(null, results)
    })
  }
}

module.exports = RemoteProofs

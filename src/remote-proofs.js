const async = require('neo-async')
const Gists = require('gists')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, NUMBER, BOOL, FUNCTION } = require('./utils')
const { log, error } = require('./log')

class RemoteProofs {

  constructor (proof) {
    this.proofApi = proof
  }

  async getGist (id) {
    if (!id) { throw new Error(ERR.ARG_REQ_ID) }

    const gists = new Gists()

    return await gists.get(id)
  }

  extractProofFromGist (response) {
    if (!response) {
      throw new Error('gist is required')
    }

    // JSON = gist -> body -> files -> first key -> content
    let files = response.body.files
    let keys = Object.keys(response.body.files)

    try {
      // TODO: for now assume there is only one document to deal with
      //       We may need to loop & get all
      return JSON.parse(files[keys[0]].content)
    } catch (ex) {
      return null
    }
  }

  // validate the proof format
  // TODO: formalize this format & use jsonschema & format versioning
  validateProof (proofWrapper, username, service) {
    if (typeof proofWrapper !== OBJECT) {
      throw new Error('proofWrapper arg must be object')
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
      _hash: STRING // TODO: change to ipfsContentHash
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

  async processGist (url, username, service, callback) { //  callback??
    const that = this;
    // extract gist ID from url
    let gistId = this.getGistIdFromUrl(url)
    // get gist
    return await this.getGist(gistId).then((res) => {
      // extract proof
      let proofDoc = that.extractProofFromGist(res)
      // validate proof
      let valid = that.validateProof(proofDoc, username, service)

      if (!valid) {
        throw new Error('Proof document is not valid')
      }
      // verify Proof
      that.proofApi.verifyProof(proofDoc, (err, valid) => {
        if (typeof callback === FUNCTION) {
          callback(err, {valid: valid, url: url, doc: proofDoc })
        }
      })
    }).catch((ex) => {
      error(ex)
    })
  }

  verifyMultipleGists (gistArray, callback) {
    const that = this

    if (!Array.isArray(gistArray) || !gistArray.length) {
      throw new Error('gistArray is a required argument')
    }

    function process (item, callback) {
      return that.processGist(item.url,
                              item.username,
                              item.service,
                              callback)
    }

    async.mapSeries(gistArray, process, (err, results) => {
      if (err) {
        return callback(err, null)
      }
      return callback(null, results)
    })
  }
}

module.exports = RemoteProofs

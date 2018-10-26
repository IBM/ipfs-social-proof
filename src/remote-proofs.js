const Gists = require('gists')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL, FUNCTION } = require('./utils')
const { log, error } = require('./log')

class RemoteProofs {

  constructor (proof) {
    this.proofAPI = proof
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
    let jsonDocs = []
    keys.forEach((key) => {
      jsonDocs.push(response.body.files[key])
    })

    let firstValidDoc
    jsonDocs.forEach((doc) => {
      // make sure the proof has proper keys
      let valid = this.validateProof(doc)
      if (valid) {
        firstValidDoc = doc
        return
      }
    })
    // Owner data = body -> owner -> login
  }

  // validate the proof format
  // TODO: formalize this format & use jsonschema & format versioning
  validateProof (assertion, username, service) {
    if (typeof assertion !== OBJECT) {
      throw new Error('assertion arg must be object')
    }

    let validKeysProof = {
      message: OBJECT,
      timestamp: INTEGER,
      expires: INTEGER,
      ipfsId: STRING,
      handle: STRING
    }
    let validKeysAssertion = {
      handle: STRING,
      ipfsId: STRING,
      proof: OBJECT,
      signature: STRING,
      timestamp: INTEGER,
      publicKey: STRING
    }

    let validKeysMessage = {
      statement: STRING,
      username: STRING,
      service: STRING
    }

    let valid = true
    let keys = Object.keys(assertion)
    keys.forEach((key) => {
      if (typeof assertion.proof[key] !== validKeysProof[key]) {
        valid = false
      }
    })

    keys = Object.keys(validKeysAssertion)
    keys.forEach((key) => {
      if (typeof assertion[key] !== validKeysAssertion[key]) {
        valid = false
      }
    })

    keys = Object.keys(assertion.proof.message)
    keys.forEach((key) => {
      if (typeof assertion.proof.message[key] !== validKeysMessage[key]) {
        valid = false
      }
    })

    if (assertion.proof.message.username !== username) {
      valid = false
    }

    if (assertion.proof.message.service !== service) {
      valid = false
    }

    return valid
  }

  async processGist (url, callback) { //  callback??
    const that = this;
    // extract gist ID from url
    let arr = url.split('/')
    let gistId
    arr.some((item) => {
      if (item.length === 32) {
        gistId = item
        return true
      }
    })
    // get gist
    return await this.getGist(gistId).then((res) => {
      // extract proof
      let proofDoc = that.extractProofFromGist(res)
      log('proof', proofDoc)
      // validate proof
      let valid = that.validateProof(proofDoc)

      if (!valid) {
        throw new Error('Proof document is not valid')
      }
      // verify Proof
      this.proofApi.verifyProof(proofDoc, (err, valid) => {

        if (valid) {
          log('proof is valid!')
        } else {
          error('proof is NOT valid')
        }
        if (typeof callback === FUNCTION) {
          callback(err, valid)
        }
      })
    }).catch((ex) => {
      error(ex)
    })
  }
}

module.exports = RemoteProofs

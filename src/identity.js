const { log, error } = require('./log')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL, FUNCTION } = require('./utils')

DEFAULT_HANDLE = 'DWeb Enthusiast'
DEFAULT_BIO = 'Decentralized Technology and Tacos Twenty-four/seven'

const PROFILE_KEYS = {
  surName: STRING,
  givenName: STRING,
  handle: STRING,
  bio: STRING,
  ipfsId: STRING,
  peerId: STRING,
  validityDocs: ARRAY
}

class Identity {

  constructor (profile, crypto, db, firstRun=false) {
    if (typeof profile !== OBJECT) { throw new Error('profile is required') }
    this._profile = profile // <-- will either be default ID data or account from db

    // TODO: Get validityDocs from db

    if (typeof crypto !== OBJECT) {
      throw new Error('crypto object is required')
    } // TODO: use instanceof??
    this.crypto = crypto

    if (typeof db !== OBJECT) { throw new Error('db is required') }
    this.db = db

    let keys = Object.keys(profile)
    keys.forEach((key) => {
      if (PROFILE_KEYS[key]) {
        // call setter for each profile property
        this[key] = profile[key]
      }
    })

    if (firstRun) {
      this.save()
    }
  }

  set validityDocs (docs) {
    this._validityDocs = docs
  }

  get validityDocs () {
    if (this._validityDocs) {
      return this._validityDocs
    }
    return []
  }

  set handle (handle) {
    this._handle = handle
  }

  get handle () {
    if (this._handle) {
      return this._handle
    }
    return DEFAULT_HANDLE
  }

  set givenName (givenName) {
    this._givenName = givenName
  }

  get givenName () {
    if (this._givenName) {
      return this._givenName
    }
    return ''
  }

  set surName (surName) {
    this._surName = surName
  }

  get surName () {
    if (this._surName) {
      return this._surName
    }
    return ''
  }

  set bio (bio) {
    this._bio = bio
  }

  get bio () {
    if (this._bio) {
      return this._bio
    }
    return DEFAULT_BIO
  }

  set peerId (peerId) {
    if (!peerId) { throw new Error('peerId cannot be null') }
    this._peerId = peerId
  }

  get peerId () {
    if (this._peerId) {
      return this._peerId
    }
    throw new Error('peerId is null')
  }

  // TODO: just use peerId after this refactor
  set ipfsId (ipfsId) {
    if (!ipfsId) { throw new Error('ipfsId cannot be null') }
    this._ipfsId = ipfsId
  }

  get ipfsId () {
    if (this._ipfsId) {
      return this._ipfsId
    }
    throw new Error('ipfsId is null')
  }

  get publicKey () {
    return this.crypto.pubKeyPem
  }

  async getProofs () { // TODO: "proofs" or "validityDocs"??
    return this.validityDocs || []
  }

  get profile () {
    return {
      publicKey: this.crypto.pubKeyDehydrated,
      pubKeyBase64: this.crypto.pubKeyBase64,
      ipfsId: this.ipfsId,
      peerId: this.peerId,
      validityDocs: this.validityDocs,
      surName: this.surName,
      givenName: this.givenName,
      handle: this.handle,
      bio: this.bio
    }
  }

  async save (updatedData=null) {
    // save the current state of the idData
    if (updatedData) {
      if (updatedData.bio) {
        this.bio = updatedData.bio
      }
      if (updatedData.surName) {
        this.surName = updatedData.surName
      }
      if (updatedData.givenName) {
        this.givenName = updatedData.givenName
      }
      if (updatedData.handle) {
        this.handle = updatedData.handle
      }
    }

    this.db.put(
      DB_ACCOUNT_KEY,
      JSON.stringify(this.profile), (err) => {
        if (err) {
          error(err)
        }
        log('Account Saved!')
      })
    // TODO: update state to tell UI consumers
  }
}

module.exports = Identity

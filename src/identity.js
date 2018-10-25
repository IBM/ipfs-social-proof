const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL, FUNCTION } = require('./utils')

DEFAULT_HANDLE = 'DWeb Enthusiast'
DEFAULT_BIO = 'Decentralized Technology and Tacos Twenty-four/seven'

class Identity {

  constructor (profile, crypto) {
    if (typeof profile !== OBJECT) { throw new Error('profile is required') }
    this.profile = profile

    if (typeof crypto !== OBJECT) { throw new Error('crypto object is required') } // TODO: use instanceof??
    this.crypto = crypto
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

  get publicKey () {
    return this.crypto.pubKeyPem
  }

  async getProofs () { // TODO: "proofs" or "validityDocs"??

  }

  saveIdData (updatedData=null) {
    // save the current state of the idData
    this._idData.publicKey = this.pubKeyDehydrated
    this._idData.pubKeyBase64 = this.pubKeyArmored
    this._idData.ipfsId = this.peerId

    if (updatedData) {
      if (updatedData.bio) {
        this._idData.bio = updatedData.bio
      }
      if (updatedData.surName) {
        this._idData.surName = updatedData.surName
      }
      if (updatedData.givenName) {
        this._idData.givenName = updatedData.givenName
      }
      if (updatedData.handle) {
        this._idData.handle = updatedData.handle
      }
    }

    this._storageDB.put(
      DB_ACCOUNT_KEY,
      JSON.stringify(this._idData), (err) => {
        if (err) {
          error(err)
        }
        console.info('Account Saved!')
      })
    // TODO: update state to tell UI consumers
  }
}

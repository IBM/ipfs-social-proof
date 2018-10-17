const level = require('level-browserify')
const { t2a, a2t } = require('./utils')
const { log, error } = require('./log')

const DEFAULT_DB_NAME = 'ISP_CONTACTS'


STRING = 'string'
INTEGER = 'integer'
OBJECT = 'object'
ARRAY = 'array'
BOOL = 'boolean'

const ERR = {
  ARG_REQ: `argument(s) required`,
  ARG_REQ_PEER_ID: `peerId ${this.ARG_REQ}`
}

class Contacts {
  constructor (dbName=null) {
    this.dbName = dbName || DEFAULT_DB_NAME

    this.contactRequiredFields = {
      peerId: STRING,
      createdTs: INTEGER,
      updatedTs: INTEGER
    }

    this.contactOptionalFields = {
      handle: STRING,
      publicKey: STRING,
      surname: STRING,
      givenName: STRING,
      bio: STRING,
      url: STRING
    }

    this.init()
  }

  async getContact (peerId) {
    return await this.db.get(peerId)
  }

  get allContacts () {
    var that = this
    let ids = Object.keys(this._data)
    let results = []
    hashes.forEach((id, idx) => {
      results.push(
        { peerId: id,
          contact: JSON.parse(a2t(that._data[id]))
        })
    })

    return results
  }

  init () {
    const that = this
    this._data = {}
    // update??
    this.db.on('put', (k, v) => {
      that._data[k] = v
    })
    this.db.on('del', (k) => {
      delete that._data[k]
    })

    // get data into cache
    that.db.createReadStream()
      .on('data', function (data) {
        log(data.key, '=', data.value)
        that._data[data.key] = data.value
      }).on('error', function (err) {
        error('Cannot read db stream: ', err)
      })
      .on('close', function () {
        log('db stream closed')
      })
      .on('end', function () {
        log('db stream ended')
      })
  }

  async getContactByPeerId (peerId) {
    let result
    return await this.db.get(peerId)
  }

  async getOrCreateContact (contactObj) {
    let result
    result = await this.db.get(contactObj.peerId)
    if (!result) {
      // need to create this contact
      result = await this.createContact(contactObj)
    }

    return result
  }

  async createContact (contactObj) {
    // TODO: validate peerId as a real IPFS b58 multihash
    if (!contactObj.peerId) {
      throw new Error(ERR.ARG_REQ_PEER_ID)
    }
    let optional = Object.keys(this.contactOptionalFields)
    let contact = {
      peerId: contactObj.peerId,
      createdTs: Date.now(),
      updatedTs: Date.now()
    }
    // filter out any non-required or approved properties
    optional.forEach((prop) => {
      contact[prop] = contactObj[prop] || null
    })
    let result = await this.db.put(contact.peerId,
                                   t2a(JSON.stringify(contact)))

    return result
  }

  async updateContact (contactObj) {
    if (!contactObj.peerId) {
      throw new Error(ERR.ARG_REQ_PEER_ID)
    }
    let optional = Object.keys(this.contactOptionalFields)
    let contact = { peerId: contactObj.peerId }
    // filter out any non-required or approved properties
    optional.forEach((prop) => {
      contact[prop] = contactObj[prop] || null
    })
    let bin = t2a(JSON.stringify(contact))
    let result = await this.db.put(contact.peerId, bin)

    return result
  }

  async deleteContact (peerId) {
    return await this.db.del(peerId)
  }

  get db () {
    return level(`./${DEFAULT_DB_NAME}`)
  }
}

module.exports = Contacts

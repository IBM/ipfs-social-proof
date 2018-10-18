const { t2a, a2t } = require('./utils')
const { log, error } = require('./log')
const { Buffer } = require('buffer')
var PouchDB = require('pouchdb');

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
  constructor (dbName=null, requiredFields={}, optionalFields={}) {
    this.dbName = dbName || DEFAULT_DB_NAME

    this.requiredFields = {
      peerId: STRING,
      createdTs: INTEGER,
      updatedTs: INTEGER
    }

    this.optionalFields = {
      handle: STRING,
      publicKey: STRING,
      surname: STRING,
      givenName: STRING,
      bio: STRING,
      url: STRING
    }

    this.init()
  }

  async get (peerId) {
    try {
      return await this.db.get(peerId)
    } catch (ex) {
      error(ex)
      return null
    }
  }

  async getall () {
    try {
      var result = await this.db.allDocs({
        include_docs: true,
        attachments: true
      });

      return result
    } catch (err) {
      console.log(err);
    }
    return null
  }

  init () {
    this.db // initialize the db
  }

  async getById (peerId) {
    try {
      var doc = await this.db.get(peerId);
    } catch (ex) {
      console.log(ex);
    }

    return doc
  }

  async getOrCreate (contactObj) {
    try {

      var result = await this.db.get(contactObj.peerId)
    } catch (ex) {
      log(ex)
    }
    if (!result) {
      // need to create this contact
      result = await this.create(contactObj)
    }

    return result
  }

  async create (contactObj) {
    // TODO: validate peerId as a real IPFS b58 multihash
    if (!contactObj.peerId) {
      throw new Error(ERR.ARG_REQ_PEER_ID)
    }
    let optional = Object.keys(this.optionalFields)
    let contact = {
      peerId: contactObj.peerId,
      _id: contactObj.peerId,
      createdTs: Date.now(),
      updatedTs: Date.now()
    }
    // filter out any non-required or approved properties
    optional.forEach((prop) => {
      contact[prop] = contactObj[prop] || null
    })

    try {
      var result = await this.db.put(contact);
    } catch (ex) {
      console.log(ex);
    }

    return result
  }

  async update (contactObj) {
    if (!contactObj.peerId) {
      throw new Error(ERR.ARG_REQ_PEER_ID)
    }
    let optional = Object.keys(this.contactOptionalFields)
    let contact = { peerId: contactObj.peerId }
    // filter out any non-required or approved properties
    optional.forEach((prop) => {
      contact[prop] = contactObj[prop] || null
    })

    contact._rev =  contactObj._rev

    try {
      var result = await this.db.put(contact);
    } catch (ex) {
      console.log(ex);
    }

    return result
  }

  async delete (peerId) {
    try {
      var doc = await this.db.get(peerId);
      var response = await this.db.remove(doc);
    } catch (err) {
      console.log(err);
    }
  }

  get db () {
    if (this._db) {
      return this._db
    }
    this._db = new PouchDB(DEFAULT_DB_NAME)

    return this._db
  }
}

module.exports = Contacts

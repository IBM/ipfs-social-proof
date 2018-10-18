const { t2a, a2t } = require('./utils')
const { log, error } = require('./log')
const { Buffer } = require('buffer')
var PouchDB = require('pouchdb');

const DEFAULT_DB_NAME = 'DOCUMENTS'

const ERR = {
  ARG_REQ: `argument(s) required`,
  ARG_REQ_ID: `id ${this.ARG_REQ}`
}

class DB {
  constructor (dbName=null, requiredFields={}, optionalFields={}) {
    this.dbName = dbName || DEFAULT_DB_NAME

    this.requiredFields = requiredFields
    this.optionalFields = optionalFields

    this.init()
  }

  async get (id) {
    try {
      return await this.db.get(id)
    } catch (ex) {
      error(ex)
      return null
    }
  }

  async getAll () {
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

  async getById (id) {
    try {
      var doc = await this.db.get(id);
    } catch (ex) {
      console.log(ex);
    }

    return doc
  }

  async getOrCreate (obj) {
    try {
      var result = await this.db.get(obj.id)

    } catch (ex) {
      log(ex)
    }
    if (!result) {
      result = await this.create(obj)
    }

    return result
  }

  async create (obj) {
    // TODO: validate id as a real IPFS b58 multihash
    if (!obj.id) {
      throw new Error(ERR.ARG_REQ_ID)
    }
    let optional = Object.keys(this.optionalFields)
    let doc = {
      id: obj.id,
      _id: obj.id,
      createdTs: Date.now(),
      updatedTs: Date.now()
    }
    // filter out any non-required or approved properties
    optional.forEach((prop) => {
      doc[prop] = obj[prop] || null
    })

    try {
      var result = await this.db.put(doc);
    } catch (ex) {
      console.log(ex);
    }

    return result
  }

  async update (obj) {
    if (!obj.id) {
      throw new Error(ERR.ARG_REQ_ID)
    }

    let required = Object.keys(this.requiredFields)
    let optional = Object.keys(this.optionalFields)
    let doc = {}

    // make sure we have required props
    required.forEach((prop) => {
      doc[prop] = obj[prop] ||
        (() => {throw new Error(`required field ${prop} missing`)})()
    })
    // filter out any non-required or approved properties
    optional.forEach((prop) => {
      doc[prop] = obj[prop] || null
    })

    doc.updatedTs = Date.now() // maybe pouchdb handles this??
    doc.id = obj.id
    doc._rev = obj._rev
    doc._id = obj._id

    try {
      var result = await this.db.put(doc);
    } catch (ex) {
      console.log(ex);
    }

    return result
  }

  async delete (id) {
    try {
      var doc = await this.db.get(id);
      var response = await this.db.remove(doc);
    } catch (err) {
      console.log(err);
    }
  }

  get db () {
    if (this._db) {
      return this._db
    }
    this._db = new PouchDB(this.dbName)

    return this._db
  }
}

module.exports = {
  DB: DB
}

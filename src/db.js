const { log, error } = require('./log')
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
PouchDB.plugin(require('pouchdb-upsert'));

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL } = require('./utils')

const DEFAULT_DB_NAME = 'DOCUMENTS'
const INDEXED_DB = 'idb'

const ERR = {
  ARG_REQ: `argument(s) required`,
  ARG_REQ_ID: `id ${this.ARG_REQ}`
}

class DB {
  constructor (dbName=null, requiredFields={}, optionalFields={}) {
    this.dbName = dbName || DEFAULT_DB_NAME

    this.requiredFields = requiredFields
    this.optionalFields = optionalFields

  }

  async get (id) {
    try {
      return await this.db.get(id)
    } catch (ex) {
      console.error(ex)
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
      console.error(err);
    }
    return null
  }

  async getById (id) {
    try {
      var doc = await this.db.get(id);
    } catch (ex) {
      return null
    }

    return doc
  }

  async getOrCreate (obj) {
    let created = false
    try {
      var result = await this.db.get(obj.id)
    } catch (ex) {
      // error(ex)
    }
    if (!result) {
      try {
        result = await this.create(obj)
      } catch (ex) {
        console.error(ex)
        throw new Error(ex)
      }
      result = await this.db.get(obj.id)
      created = true
    }

    return { result: result, created: created }
  }

  async create (obj) {
    // TODO: validate id as a real IPFS b58 multihash
    if (!obj.id) {
      throw new Error(ERR.ARG_REQ_ID)
    }

    let doc = {
      _id: obj.id,
      createdTs: Date.now(),
      updatedTs: Date.now()
    }

    let keys = Object.keys(obj)
    keys.forEach((prop) => {
      doc[prop] = obj[prop]
    })

    try {
      var result = await this.db.put(doc);
    } catch (ex) {
      console.error(ex);
    }

    return result
  }

  async update (obj) {
    if (!obj.id) {
      throw new Error(ERR.ARG_REQ_ID)
    }

    let doc = obj
    doc._id = obj.id

    try {
      var result = await this.db.put(doc);
    } catch (ex) {
      console.error(ex);
      throw new Error(ex)
    }

    return result
  }

  async delete (id) {
    try {
      var doc = await this.db.get(id);
      var response = await this.db.remove(doc);

      return response
    } catch (err) {
      console.error(err)
      throw new Error(err)
    }
  }

  get db () {
    if (this._db) {

      return this._db
    }

    var adapter = undefined

    if (typeof window === OBJECT) {
      adapter = { adapter: INDEXED_DB }
    }

    this._db = new PouchDB(this.dbName, adapter)

    return this._db
  }
}

module.exports = DB

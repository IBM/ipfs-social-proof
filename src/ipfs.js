// TODO: Use Buffer in ipfs.whatever.types ???
const { Buffer } = require('buffer')
const { log, error } = require('./log')

class Ipfs {
  constructor (node, roomApi, identity) {
    if (!node) {
      throw new Error('node is required')
    }
    this._node = node

    if (!roomApi) {
      throw new Error('roomAPI is required')
    }
    this._roomApi = roomApi

    if (!identity) {
      throw new Error('identity is required')
    }
    this._identity = identity
  }

  get roomApi () {
    return this._roomApi
  }

  get identity () {
    return this._identity
  }

  async saveProofToIpfs (content) {
    try {
      let result = await this.store(JSON.stringify(content))
      return result
    } catch (ex) {
      throw new Error(ex)
    }
  }

  async store (data) {
    // store data in IPFS
    if (typeof data !== 'string') {
      throw new TypeError('ipfs.store expects data to be instance of String')
    }

    try {
      let res = await this._node.files.add(Buffer.from(data))
      let results = []
      res.forEach(file => {
        if (file && file.hash) {
          results.push(file)
          return file
        }
      })
      return results
    } catch (err) {
      throw new Error(err.message)
    }
  }

  getFile (hash, callback) {
    // buffer: true results in the returned result being a buffer rather than a stream
    this._node.files.cat(hash, (err, data) => {
      if (err) {
        callback(err, null)
      }

      let response = {
        hash: hash,
        content: data
      }

      if (callback) {
        callback(null, response)
      }
    })
  }

  storeFiles (files) {
    // store a collection of files [that appear as a directory of files]
    // files argumanr is an array of file "objects"
    // [ { path: '/proof-github.com.json',
    //     content: JSON.stringify(contentObject)
    //   },
    //   { path: '/proof-twitter.json',
    //     content: 'JSON.stringify(contentObject2)'
    //   } ]
  }

  broadcastProfile () {
    let id = this.identity.profile
    id.updated = Date.now()
    this.roomApi.broadcast(id)
  }
}

module.exports = Ipfs

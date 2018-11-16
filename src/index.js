/*
 * ipfs-social-proof main library
 * @author David Dahl ddahl@nulltxt.se daviddahl
 *
 * Copyright 2018, IBM
 * Licensed under MIT license
 */

'use strict'

const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const TextDecoder = require('text-encoding').TextDecoder
const TextEncoder = require('text-encoding').TextEncoder
const level = require('level-browserify')
const { encode, decode } = require('base64-arraybuffer')
const { Buffer } = require('buffer')
const { pem, pki } = require('node-forge')

const DB = require('./db')
const ProofsDB = require('./proofs-db')
const { Crypto, a2c } = require('./crypto')
const Identity = require('./identity')
const Ipfs = require('./ipfs')
const Proof = require('./proof')

const DEFAULT_HANDLE = 'InterPlanetaryPsuedoAnonymite'

var DEFAULT_IDENTITY_DATA = {
  surName: null,
  givenName: null,
  handle: DEFAULT_HANDLE,
  bio: 'Web 3.0 Enthusiast',
  ipfsId: null
}

const DEFAULT_REPO_NAME = 'IPFS_IDENTITY_SOCIAL_PROOF'
const DEFAULT_ROOM_NAME = DEFAULT_REPO_NAME
const DEFAULT_STORAGE_DB_NAME = 'SOCIAL_PROOF_DATA'
const DB_ACCOUNT_KEY = 'ACCOUNT'
// TODO?: setInterval to broadcast profile
const BROADCAST_INTERVAL_MS = 5000;

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL } = require('./utils')

const SHA_256 = 'sha2-256'

var log = function log () {}
var error = function error () {}

const LOG_ENABLED = true

const ERROR_ENABLED = true

if (LOG_ENABLED) {
  var log = function log () {
    for (let i=0; i < arguments.length; i++) {
      console.log(arguments[i])
    }
  }
}
if (ERROR_ENABLED) {
  var error = function error () {
    for (let i=0; i < arguments.length; i++) {
      console.error(arguments[i])
    }
  }
}

var config = {
  EXPERIMENTAL: {
    pubsub: true
  },
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    },
    Bootstrap: [
      '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
      '/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
      '/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
      '/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
      '/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
      '/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64',
      '/dns4/node0.preload.ipfs.io/tcp/443/wss/ipfs/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
      '/dns4/node1.preload.ipfs.io/tcp/443/wss/ipfs/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6'
    ],
    pass: ''
  },
  repo: DEFAULT_REPO_NAME
}

const ERR = {
  ARG_REQ: `argument(s) required`,
  ARG_REQ_REPO_NAME: `repoName ${this.ARG_REQ}`,
  ARG_REQ_ID_DATA: `idData ${this.ARG_REQ}`,
  ARG_REQ_HANDLE: `handle ${this.ARG_REQ}`,
  ARG_REQ_USERNAME_SERVICE: `username & service ${this.ARG_REQ}`,
  ARG_REQ_BASE64_STR: `base64Str and format ${this.ARG_REQ}`,
  ARG_REQ_PROOF: `peerId, publicKey and proof ${this.ARG_REQ}`,
  ARG_REQ_PROOFS: `Peer profile is missing proofs property`,
  ARG_REQ_ID: `id ${this.ARG_REQ}`
}

class IpfsIdentity {
  setRepoName (repoName) {
    if (!repoName) { throw new Error(ERR.ARG_REQ_REPO_NAME) }
    this._repoName = repoName
    config.repo = this._repoName
  }

  get defaultTopic () {
    return DEFAULT_REPO_NAME
  }

  get contactsDB () {
    // contactsDB will be lazily loaded on first access
    if (this._contactsDB) {
      return this._contactsDB
    } else {
      this._contactsDB = new DB(
      'contacts',
        { id: STRING,
          peerId: STRING,
          createdTs: INTEGER,
          updatedTs: INTEGER
        },
        { handle: STRING,
          publicKey: STRING,
          surname: STRING,
          givenName: STRING,
          bio: STRING,
          url: STRING,
          following: BOOL,
          followTs: INTEGER,
          validityDocs: OBJECT
        })

      return this._contactsDB
    }
  }

  get proofsDB () {
    // DB will be lazily loaded on first access
    if (this._proofsDB) {
      return this._proofsDB
    } else {
      this._proofsDB = new ProofsDB(
      'proofs',
        { id: STRING,
          createdTs: INTEGER,
          updatedTs: INTEGER
        }, {
          proof: OBJECT,
          peerId: STRING,
          url: STRING,
          ipfsContentHash: STRING,
          ipnsHash: STRING,
          pinned: INTEGER, // Date.now()
          signature: STRING,
          publicKey: STRING
        })

      return this._proofsDB
    }
  }

  broadcastProfile () {
    let profile = this.identity.profile
    profile.updated = Date.now()
    this.roomApi.broadcast(profile)
  }

  constructor (handle=null, repoName, eventHandlers=null) {
    const that = this

    if (!handle) { throw new Error(ERR.ARG_REQ_HANDLE) }

    this._node = new IPFS(config)

    this._firstRun = false

    this.setRepoName(repoName)

    this._uiEventHandlers = eventHandlers || {}

    this._accountHandle = handle

    this.setEventHandlers()
  }

  get room () {
    return this._room
  }

  get roomApi () {
    // Wrap the pubsub API in our own API object to handle
    // data conversion / signatures / encryption
    if (this._roomApi) {
      return this._roomApi
    }
    const DIRECT = 'direct-message'
    const room = this.room
    const that = this
    this._roomApi = {
      broadcast: (message) => {
        if (typeof message === OBJECT) {

          return room.broadcast(JSON.stringify(message))

        }
        room.broadcast(message)
      },

      processMessage: (from, data) => {
        // from is peerId string
        // data is uInt8Array
        let textData = a2c(data)
        if (that._uiEventHandlers['msgRcvd']) {
          that._uiEventHandlers['msgRcvd'](from, data)
        }
      },

      sendTo: (peerId, message) => {
        message.messageType = DIRECT // mark as direct
        let msg = coerceMessage(message)

        room.sendTo(peerId, msg)
      },

      getPeers: () => {
        return that._room.getPeers()
      },

      hasPeer: (peerId) => {
        return that._room.hasPeer(peerId)
      },
      // NOTE: need an eventHandler for when a peer asks for 'credentials'
      reqCredentials: (peerId) => {
        // ask a peer for their credentials
        that._roomAPI.sendTo(peerId, { command: 'request:credentials' })
      },

      resCredentials: (peerId) => {
        // send a peer your credentials
        that._roomAPI(peerId, {
          command: 'response:credentials',
          credentials: that.identity.profile
        })
      }
    }

    function coerceMessage (message) {
      if (typeof message === OBJECT && !Array.isArray(message)) {
        return Buffer.from(JSON.stringify(message))
      } else if (typeof message === STRING || Array.isArray(message)) {
        return message
      }
    }

    return this._roomApi
  }

  initStorage (callback) {
    const that = this
    // TODO: Replace storageDB with a new account / identity db class
    this._storageDB = level(`./${DEFAULT_STORAGE_DB_NAME}`)

    this._storageDB.get(DB_ACCOUNT_KEY, (err, value) => {
      if (err) {
        if (err.notFound)  {
          console.warn('First run - no account')
          that._firstRun = true
        }
      }

      log('Account found')

      if (callback) {
        // Account will be written now on first run
        let account = null
        if (value) {
          account = JSON.parse(value)
        } else {
          account = DEFAULT_IDENTITY_DATA
          account.handle = that._accountHandle
          account.ipfsId = that._node._peerInfo.id._idB58String
          account.peerId = that._node._peerInfo.id._idB58String
        }
        callback(that._firstRun, account)
      }
    })

    if (typeof window === OBJECT) {
      window.IpfsID = this
    }
  }

  get peerId () {
    return this._node._peerInfo.id._idB58String
  }

  // TODO: move to pubsub module
  triggerRoomEvent (event, message) {
    if (!this._uiEventHandlers) {
      return
    }
    if (this._uiEventHandlers[event]) {
      return this._uiEventHandlers[event](message)
    }

    if (message.command) {
      if (message.command === 'request:credentials') {
        // a peer has asked for our public key and handle, etc
        return this.roomApi.resCredentials(message.peerId)
      }
    }

    if (message.command === 'response:credentials') {
      // a peer has sent their public key and handle to us
      if (this._uiEventHandlers['updatePeerProfile']) {
        this._uiEventHandlers['updatePeerProfile'](message.credentials)
      }
    }

    if (event === 'peer joined') {
      // return this.roomApi.reqCredentials(message.peerId)
      this.broadcastProfile()
    }

    if (event === 'subscribed') {
      // lets broadcast our idData to the room to update all peers with more than just an IPPS hash
      this.broadcastProfile()
    }
  }

  setEventHandlers () {
    const that = this

    this._node.on('error', (e) => {
      error(e)
    })

    this._node.on('ready', () => {
      log('IPFS node is ready')
      that._room = Room(that._node, DEFAULT_ROOM_NAME)

      that.initStorage((firstRun, account) => {
        log('...storage initialized...')
        that.crypto = new Crypto(that._node)

        that.identity = new Identity(
          account,
          that.crypto,
          that._storageDB,
          that._firstRun
        )

        that.ipfs = new Ipfs(
          that._node,
          that.roomApi,
          that.identity
        )

        that.proof = new Proof(
          that.proofsDB,
          that.identity,
          that.ipfs,
          that.crypto
        )

        this._room.on('peer joined', (peer) => {
          log('Peer joined the room', peer)
          that.triggerRoomEvent('peer joined', { peerId: peer, ipfsId: that })
          this.broadcastProfile()
        })

        this._room.on('peer left', (peer) => {
          log('Peer left...', peer)
          that.triggerRoomEvent('peer left', { peerId: peer, ipfsId: that })
        })

        // now started to listen to room
        this._room.on('subscribed', () => {
          log('Now connected!')
          this.broadcastProfile()
          // that.triggerRoomEvent('subscribed', { ipfsId: that })
        })

        this._room.on('message', (message) => {
          // log(message.from, message.data)
          let data = a2c(message.data)
          that.triggerRoomEvent('message', { from: message.from,
                                             data: data,
                                             ipfsId: that })
        })

        try {
          that._uiEventHandlers['startComplete'](that)
        } catch (ex) {
          error(ex)
        }
      }) // end initStorage
    }) // end on('ready')
  }
}

async function start (handle, eventHandlers=null, repoName=DEFAULT_REPO_NAME) {
  const ID = await new IpfsIdentity(handle, repoName, eventHandlers)
  return ID
}

function checkForAccount (callback, eventHandlers=null) {
  const tmpStorageDB = level(`./${DEFAULT_STORAGE_DB_NAME}`)

  tmpStorageDB.get(DB_ACCOUNT_KEY, (err, value) => {
    let account = false
    if (err) {
      if (err.notFound)  {
        console.warn('No account found')
        return callback(err, null)
      }
    } else {
      log('Account found')
    }
    if (callback) {
      let account = JSON.parse(value)
      return callback(null, account)
    }
  })
}

// tmp / testing in browser
if (typeof process === 'undefined') {
  window._iidStart = {
    start: start,
    checkForAccount: checkForAccount
  }
}

module.exports = {
  IpfsIdentity: IpfsIdentity,
  start: start,
  checkForAccount: checkForAccount
}

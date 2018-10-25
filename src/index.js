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
const libp2pCrypto = require('libp2p-crypto')
const TextDecoder = require('text-encoding').TextDecoder
const TextEncoder = require('text-encoding').TextEncoder
const level = require('level-browserify')
const { encode, decode } = require('base64-arraybuffer')
const { Buffer } = require('buffer')
const multihashing = require('multihashing-async')
const { pem, pki } = require('node-forge')
const peerId = require('peer-id')

const DB = require('./db')
const ProofsDB = require('./proofs-db')

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

  setIdentityData (idData) {
    if (!idData) { throw new Error(ERR.ARG_REQ_ID_DATA) }
    if (!idData.handle) { throw new Error(ERR.ARG_REQ_HANDLE) }

    const that = this
    this._idData = idData
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
          ipfsHash: STRING,
          ipnsHash: STRING,
          pinned: INTEGER // Date.now()
        })

      return this._proofsDB
    }
  }

  get idData () {
    let profile = this._idData
    profile.peerId = this.peerId
    profile.publicKey = this.pubKeyDehydrated
    profile.pubKeyBase64 = this.pubKeyBase64

    return profile
  }

  broadcastProfile () {
    let idData = this.idData
    idData.updated = Date.now()
    this.roomApi.broadcast(idData)
    log('Broadcast: ', idData)
  }

  constructor (handle=null, repoName, eventHandlers=null) {
    const that = this
    let accountHandle = null
    this._firstRun = false
    this._uiEventHandlers = eventHandlers || {}

    if (!handle) { throw new Error(ERR.ARG_REQ_HANDLE) }

    if (!accountHandle) {
      accountHandle = handle
    }
    let idData = DEFAULT_IDENTITY_DATA
    idData.handle = accountHandle

    this.setIdentityData(idData)

    if (repoName) {
      this.setRepoName(repoName)
    }

    this._node = new IPFS(config)
    this._room = null

    this.setEventHandlers(this._node, this._room)
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
        // data is uInt8Array
        // from is peerId string
        log("processMessage: ", from, data)
        let textData = a2c(data)
        log("a2c: ", textData)
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
          credentials: that.idData
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

  updateLocalValidityDocs () {
    // `validityDocs` are prrofs that the peer profile carries
    // around and broadcasts to peers as p2p discovery happens
    // get all local client proofs and add them to the in-memory _idData
    // fire and forget as needed
    const that = this

    this.proofsDB.getValidityDocs().then((res) => {
      if (res) {
        that._idData.validityDocs = res
      }
    }).catch((ex) => {
      console.error(ex)
    })
  }

  // Move to an 'ipfs' property / module
  async saveProof (content) {
    try {
      var proofData = content
      if (typeof content === OBJECT) {
        proofData = JSON.stringify(content)
      }
      var results = await this.saveProofToIpfs(proofData)
      log('results', results)
    } catch (ex) {
      throw new Error(ex)
    }
    var saveData
    if (typeof proofData === STRING) {
      saveData = JSON.parse(proofData)
    }

    let hash = results[0].hash
    saveData.ipfsHash = hash
    saveData.id = hash

    try {
      const success = await this.proofsDB.create(saveData)
      // TODO: re-generate validityDocs property on the idData object
      this.updateLocalValidityDocs()
      return success
    } catch (ex) {
      console.error(ex)
      throw new Error(ex)
    }
  }

  // TODO: move to 'ipfs' property
  async saveProofToIpfs (content) {
    try {
      let result = await this.store(JSON.stringify(content))
      return result
    } catch (ex) {
      throw new Error(ex)
    }
  }

  // TODO move to a 'crypto' property
  verifyProof (proof, callback) {
    // make sure the proof signature was generated by the private half of publicKey
    // XXX: had to remove all references to this as it was undefined!!!??
    let _proof
    if (typeof proof == STRING) {
      _proof = JSON.parse(proof)
    } else {
      _proof = proof
    }
    if (proof.doc) {
      _proof = proof.doc
    }
    // TODO: revert to using helper functions and test
    //       `this` was undefined here being called from PublicKeyCard
    //        which, BTW, was called from a DOM eventHandler
    const signedProofText = JSON.stringify(_proof.proof) // JSON -> string
    // const bufferSig = this.rehydrate(_proof.signature) //  string -> encode to arraybuffer
    const obj = JSON.parse(_proof.signature)
    // Get the Uint8Array version of the stringified data (key or signature)
    const bufferSig = Buffer.from(obj.data)
    // const publicKey = this.unmarshalPubKey(_proof.publicKey) // Instanciate RsaPubKey
    const objKey = JSON.parse(_proof.publicKey)
    // Get the Uint8Array version of the stringified key
    const bufferKey = Buffer.from(objKey)
    // unmarshal pub key (any pub key)
    const publicKey = libp2pCrypto.keys.unmarshalPublicKey(bufferKey)

    const textArr = t2a(signedProofText) // encode text to array
    // check the signature in the proof
    return publicKey.verify(textArr, bufferSig, callback)
  }

  // TODO: move to a 'crypto' property
  async verifyPeer (peerProfile, saveContact=false) {
    const that = this
    let proofs = []
    if (peerProfile.peerId === this.idData.peerId) {
      // verifying self
      let _proofs = await this.idData.getProofs()
      proofs = _proofs.rows || []
    } else {
      if (!peerProfile.proofs) {
        return
      }
      if (!peerProfile.proofs.length) {
        return
      }
      proofs = peerProfile.proofs
    }

    let proofDocs = []
    proofs.forEach((proof, idx) => {
      that.verifyProof(proof.proof, (err, valid) => {
        var valid = false
        if (err) {
          valid = false
        } else {
          valid = true
        }
        proofDocs.push({proof: proof.proof, valid: valid, ts: Date.now()})
      })
    })
    if (saveContact) {
      let contact = peerProfile
      contact.validityDocs = proofDocs
      that.contactsDB.upsert(peerProfile.peerId, contact).
        then((res) => {
          console.log('contact saved')
          // TODO: set state in a notify component that will give feedback
        }).catch((ex) => {
          console.error(ex)
        })
    }
  }

  initStorage (callback) {
    const that = this
    // TODO: Replace storageDB with a new db class
    this._storageDB = level(`./${DEFAULT_STORAGE_DB_NAME}`)

    this._storageDB.get(DB_ACCOUNT_KEY, (err, value) => {
      if (err) {
        if (err.notFound)  {
          console.warn('First run - no account')
          that._firstRun = true
          that.saveIdData()
        }
      }
      log('Account found', value)
      if (callback) {
        // Account will be written now on first run
        callback()
      }
    })

    if (typeof window === OBJECT) {
      window.IpfsID = this
    }
  }

  // Move to crypto module
  sign (stringToSign, callback) {
    let array = t2a(stringToSign) // make an array buffer from string to sign the arrayBuffer

    this._node._peerInfo.id._privKey.sign(array, (err, signature) => {
      log(err, signature)
      callback(err, signature)
    })
  }

  // Move to crypto module
  verify (signedString, signature, callback) {
    let array = t2a(signedString) // signed string must be raw characters, not base64!

    this._node._peerInfo.id._pubKey.verify(array, signature, (err, verified) => {
      log(err, verified)
      if (err) { throw new Error(err) }
      callback(err, verified)
    })
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

  // TODO: move to proofs property?
  createProof (username, service, callback, expires=null) {
    // Sign message, returning an Object with
    // service, username, message, handle and signature
    const that = this
    if (!username || !service) {
      throw new Error(ERR.ARG_REQ_USERNAME_SERVICE)
    }
    const ts = Date.now()

    let message = {
      statement: `I am ${username} on ${service}`, // add URL here
      username: username,
      service: service
    }

    let proof = JSON.stringify({
      message: message,
      timestamp: ts,
      expires: expires,
      ipfsId: this.peerId,
      handle: this._idData.handle
    })

    this.sign(proof, (err, signature) => {
      if (err) { throw new Error(err) }

      let assertion = {
        handle: that._idData.handle,
        ipfsId: that.peerId,
        proof: proof,
        signature: that.dehydrate(signature),
        timestamp: ts,
        publicKey: that.pubKeyDehydrated
      }
      if (callback) {
        callback(err, assertion)
      }
    })
  }

  // TODO: move to crypto module
  get pubKeyDehydrated () {
    // get a base64 encoded marshaled pub key
    const pub = this._node._peerInfo.id._privKey.public
    const mk = this.utils.crypto.keys.marshalPublicKey(pub)
    return this.dehydrate(mk)
  }

  unmarshalPubKey (stringifiedKey) {
    const obj = JSON.parse(stringifiedKey)
    // Get the Uint8Array version of the stringified key
    const bufferKey = this.utils.Buffer.from(obj.data)
    // unmarshal pub key (any pub key)
    const umpk = this.utils.crypto.keys.unmarshalPublicKey(bufferKey)
    return umpk // now, one can use this pub key to verify signatures
  }

  dehydrate (buff) {
    return JSON.stringify(buff)
  }

  rehydrate (jsonStr) {
    // re-hydrate a json string back into an Uint8Array
    // expecting a string like so: '{"data": [0,2,5,7,12,34,122...]}'
    const obj = JSON.parse(jsonStr)
    // Get the Uint8Array version of the stringified data (key or signature)
    const buff = this.utils.Buffer.from(obj.data)
    return buff
  }

  get pubKeyBase64 () {
    return this.pubKeyPem
  }

  get pubKeyPem () {
    let pk = this._node._peerInfo.id._privKey.public._key
    return pki.publicKeyToPem(pk)
  }

  convertRsaPubKeyToPem (rsaPubKey) {
    let rpk
    if (rsaPubKey._key) {
      rpk = rsaPubKey._key
    } else {
      rpk = rsaPubKey
    }
    return pki.publicKeyToPem(rpk)
  }

  convertPemPubKeyToRsa (pemPubKey) {
    return pki.publicKeyFromPem(pemPubKey);
  }

  armor (base64Str, format='pk') {
    // pk = public key
    // sig = signature
    if (!base64Str || !format) {
      throw new Error(ERR.ARG_REQ_BASE64_STR)
    }

    const formats = {
      pk: {
        head: '-----BEGIN PUBLIC KEY-----\r\n',
        tail: '\r\n-----END PUBLIC KEY-----'
      },
      sig: {
        head: '-----BEGIN PGP MESSAGE-----\r\n',
        tail: '\r\n-----END PGP MESSAGE-----'
      }
    }

    let key = ''

    for (var i = 0; i < base64Str.length; i++) {
      if ((i % 64) === 0) {
        key += '\n';
      }
      key += base64Str.charAt(i);
    }

    if (!/\\n$/.test(key)) {
      key += '\r\n';
    }

    return `${formats[format].head}${key}${formats[format].tail}`.trim();
  }

  get peerId () {
    return this._node._peerInfo.id._idB58String
  }

  armorSignature (signature, native=true) {
    if (native) {
      return this.armor(a2t(signature), 'sig')
    } else {
      // already base64'd
      return this.armor(signature, 'sig')
    }
  }

  // move to ipfs module
  async store (data) {
    // store data in IPFS
    let res = await this._node.files.add(Buffer.from(data))
    let results = []

    res.forEach((file) => {
      if (file && file.hash) {
        log('successfully stored', file)
        results.push(file)
        return file
      }
    })
    return results
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
    this._node.on('error', (e) => error(e))

    this._node.on('ready', () => {
      log('IPFS node is ready')
      this._room = Room(this._node, DEFAULT_ROOM_NAME)

      that.initStorage(() => {
        log('...storage initialized...')
      })

      try {
        that._uiEventHandlers['startComplete'](that)
      } catch (ex) {
        error(ex)
      }

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
        log('_room.on...')
        log(message.from, message.data)
        let data = a2c(message.data)
        that.triggerRoomEvent('message', { from: message.from,
                                           data: data,
                                           ipfsId: that })
      })
    })
  }

  getMultihashForStringContent (stringContent, callback) {
    // pass in content you need a multihash for in order to
    // see if the file exists on IPFS
    //  NOTE: this will not work - it will just timeout
    const that = this;
    let buf = Buffer.from(stringContent)

    multihashing(buf, SHA_256, (err, mh) => {
      if (err) {
        return callback(err, null)
      }
      let b58Str = that._node.types.multihash.toB58String(mh)
      callback(null, b58Str)
    })
  }

  get utils () {
    // Utilities to call in console
    return {
      getAccount: () => {
        checkForAccount()
      },
      strings: {
        encode: encode,
        decode: decode,
        t2a: t2a,
        a2t: a2t
      },
      crypto: libp2pCrypto,
      Buffer: Buffer,
      pem: pem,
      pki: pki,
      getGist: getGist
    }
  }
}

function t2a (text) {
  return new TextEncoder("utf-8").encode(text)
}

function a2t (arrayBuffer) {
  return new TextDecoder("utf-8").decode(arrayBuffer)
}

function a2c (arrayBuffer) {
  let text = []
  arrayBuffer.forEach((el) => {
    text.push(String.fromCharCode(el))
  })
  log('text array inside a2c', text)
  return text.join('')
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
      log('Account found', value)
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
  checkForAccount: checkForAccount,
  utils: {
    a2t: a2t,
    t2a: t2a
  }
}

const html = require('choo/html')
const { start, checkForAccount } = require('../../src/')
const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL, FUNCTION } = require('../../src/utils')

module.exports = store

function stripNode (message) {
  if (typeof message === OBJECT) {
    let _msg = {}
    if (message.ipfsId) {
      let keys = Object.keys(message)
      keys.forEach((key, idx) => {
        if (key !== 'ipfsId') {
          _msg[key] = message[key]
        }
      })
    }
    return _msg
  }
  return message
}

function logMessage (message) {
  let msg = stripNode(message)
  let _msg
  let ts = new Date().toISOString()
  if (typeof msg === STRING) {
    _msg = `${ts}: ${msg}`
  } else if (typeof message === OBJECT) {
    msg.ts = ts
    _msg = JSON.stringify(msg, null, 2)
  } else {
    return
  }

  return _msg
}

function includesProfile(profiles, profile) {
  return profiles.filter(p => p.peerId === profile.peerId).length > 0
}

function store (state, emitter) {
  // initial state
  state.proofsList = {
    rows: []
  }
  state.logs = []
  state.peerProfiles = []

  emitter.on('DOMContentLoaded', function () {
    //Default
    let HANDLE = `DWeb Enthusiast`

    checkForAccount((err, account) => {
      console.log('got account', account)
      if (err) {
        // no account
        console.error(err)
      }
      if (account) {
        console.log('account', account)
        HANDLE = account.handle
      }
      start(HANDLE, {
        startComplete: (ipfsId) => {
          state.IpfsID = ipfsId

          // updateFavicon(ipfsId.peerId)
          // animate.endAnimation()
          // document.querySelector('#nav-links').style.opacity='1'
          emitter.emit('updatePeerProfile', {
            peerId: ipfsId.identity.profile.peerId,
            clientPeerId: ipfsId.identity.profile.peerId,
            name: ipfsId.identity.profile.handle, // TODO: givenName, surName
            handle: ipfsId.identity.profile.handle,
            canFollow: true,
            self: true
          })
          emitter.emit('updateProofsList')
          emitter.emit(state.events.RENDER)
        },

        'proof-deleted': () => {
          emitter.emit('updateProofsList')
        },

        'peer joined': (message) => {
          message.event = 'Peer Joined'
          logMessage(message, emitter.emit)
          // TODO: remove / gray out peers on `peer left`
          let profile = {
            peerId: message.peerId,
            clientPeerId: message.ipfsId.peerId,
            name: message.name || null,
            handle: message.handle || null,
            canFollow: true,
            connected: true,
            proofs: message.proofs || []
          }

          emitter.emit('updatePeerProfile', profile)
        },

        'peer left': (message) => {
          message.event = 'Peer Left'
          emitter.emit('logMessage', logMessage(message))
          // TODO: update the UI to reflect disconnection
        },

        'subscribed': (message) => {
          message.event = 'Subscribed to Room'
          emitter.emit('logMessage', logMessage(message))
        },

        'message': (message) => {
          message.event = 'Message Rcvd'
          let _msg = JSON.parse(message.data)
          if (_msg.updated) {
            emitter.emit('updatePeerProfile', _msg)
          }

          emitter.emit('logMessage', logMessage(message))
        },
        'updatePeerProfile': (profile) => {
          let _profile = {
            peerId: profile.peerId,
            clientPeerId: null, // need this in this closure
            name: null,
            handle: profile.handle,
            bio: profile.bio,
            canFollow: true
          }
          emitter.emit('updatePeerProfile', _profile)
        }
      })
    })

    emitter.on('changeContent', function (content) {
      state.currentContent = content
      emitter.emit(state.events.RENDER)
    })

    emitter.on('updateProofContent', function (content) {
      state.currentProofContent = content
      emitter.emit(state.events.RENDER)
    })

    emitter.on('updateProofsList', async function() {
      // get all proofs in db
      try {
        list = await state.IpfsID.proofsDB.getAll()
        state.proofsList = list
        emitter.emit(state.events.RENDER)
      } catch (ex) {
        console.error(ex)
      }
    })

    emitter.on('updatePeerProfile', async function(peerProfile) {
      if (!peerProfile || !peerProfile.peerId) {
        return
      }

      if (includesProfile(state.peerProfiles, peerProfile)) {
        return
      }

      peerProfile.updated = Date.now()
      state.peerProfiles.unshift(peerProfile)
      emitter.emit(state.events.RENDER)
    })

    emitter.on('logMessage', async function(msg) {
      state.logs.unshift(msg)
      emitter.emit(state.events.RENDER)
    })
  })
}

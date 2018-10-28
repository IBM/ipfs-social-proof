const html = require('choo/html')
const notify = require('../components/notify')
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

function indexOfProfile(profiles, target) {
  return profiles.reduce((acc, profile, index) => {
    return profile.peerId === target.peerId ? index : acc
  }, -1)
}

function store (state, emitter) {
  // initial state
  state.proofsList = {
    rows: []
  }
  state.logs = []
  state.peerProfiles = []
  state.publicKeyCard = {}

  emitter.on('DOMContentLoaded', function () {
    //Default
    let HANDLE = `DWeb Enthusiast`

    window.setTimeout(() => {
      checkForAccount((err, account) => {
        if (err) {
          // no account
          console.error(err)
        }
        if (account) {
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
    }, 4000) // setTimeout

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
      peerProfile.updated = Date.now()
      const index = indexOfProfile(state.peerProfiles, peerProfile)
      if (index >= 0) {
        // update existing profile
        state.peerProfiles[index] = peerProfile
      } else {
        // add new profile
        state.peerProfiles.unshift(peerProfile)
      }
      emitter.emit(state.events.RENDER)
    })

    emitter.on('logMessage', async function(msg) {
      state.logs.unshift(msg)
      emitter.emit(state.events.RENDER)
    })

    emitter.on('loadPeer', async function(profile) {
      const { peerId } = profile
      state.publicKeyCard.profile = profile
      if (profile.peerId === state.IpfsID.identity.profile.peerId) {
        emitter.emit('loadValidityDocs', state.IpfsID.identity.profile)
      } else {
        state.IpfsID.contactsDB.get(peerId).
          then((res) => {
            console.log(res)
            if (res && res.validityDocs && res.validityDocs.length) {
              emitter.emit('validateProofs', res.validityDocs)
            } else {
              emitter.emit('showPublicKeyCard')
            }
          }).catch((ex) => {
            console.error(ex)
            emitter.emit('showPublicKeyCard')
          })
      }
    })

    emitter.on('loadValidityDocs', async function(profile) {
      state.IpfsID.proofsDB.getValidityDocs().then((res) => {
        if (res && res.length) {
          state.publicKeyCard.validityDocs = res
          emitter.emit('validateProofs', state.publicKeyCard.validityDocs)
        } else {
          emitter.emit('showPublicKeyCard')
        }
      }).catch((ex) => {
        console.log(ex)
        emitter.emit('showPublicKeyCard')
      })
    })

    emitter.on('validateProofs', async function(proofs) {
      state.publicKeyCard.invalidDocs = []
      state.publicKeyCard.validDocs = []

      if (!proofs) {
        console.error('Proofs is null')
        return
      }
      if (!proofs.length) {
        console.error('Proofs array has a length of 0')
        return
      }

      let proofCount = 0
      await Promise.all(proofs.map((row) => {
        return new Promise((resolve) => {
          state.IpfsID.crypto.verifyProof(row, (err, valid) => {
            if (valid) {
              state.publicKeyCard.validDocs.push({
                proof: row,
                valid: valid
              })
            } else {
              state.publicKeyCard.invalidDocs.push({
                proof: row,
                valid: valid
              })
            }
            proofCount++
            resolve()
          })
        })
      }))
      emitter.emit('showPublicKeyCard')
    })

    emitter.on('followPeer', async function() {
      const { IpfsID, publicKeyCard: { profile } } = state
      IpfsID.contactsDB.db.upsert(profile.peerId, (contact) => {
        if (!contact._id) {
          contact = profile
        }
        contact.following = true
        contact.followTs = Date.now()
        state.publicKeyCard.profile = contact
        return contact
      }).then((res) => {
        console.log('contact saved')
        notify.success(`Success`, `You are now following ${profile.handle}`)
        emitter.emit(state.events.RENDER)
      }).catch((ex) => {
        console.error(ex)
        notify.error(`Error`, `Could not follow ${profile.handle}`)
        emitter.emit(state.events.RENDER)
      })
    })

    emitter.on('unfollowPeer', async function() {
      const { IpfsID, publicKeyCard: { profile } } = state
      IpfsID.contactsDB.db.upsert(profile.peerId, (contact) => {
        contact.following = false
        contact.followTs = Date.now()
        state.publicKeyCard.profile = contact
        return contact
      }).then((res) => {
        console.log('contact saved')
        // TODO: set state in a notify component that will give feedback
        notify.success(`Success`, `You have unfollowed ${profile.handle}`)
        console.log('unfollow', res)
        emitter.emit(state.events.RENDER)
      }).catch((ex) => {
        console.error(ex)
        notify.error(`Error`, `Could not unfollow ${profile.handle}`)
        emitter.emit(state.events.RENDER)
      })
    })

    emitter.on('openPublicKeyCard', async function(profile) {
      emitter.emit('loadPeer', profile)
    })

    emitter.on('showPublicKeyCard', async function() {
      state.publicKeyCard.show = true
      console.log('card', state.publicKeyCard)
      emitter.emit(state.events.RENDER)
    })

    emitter.on('closePublicKeyCard', async function() {
      state.publicKeyCard = {}
      emitter.emit(state.events.RENDER)
    })
  })
}

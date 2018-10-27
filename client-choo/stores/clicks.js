const { start, checkForAccount } = require('../../src/')

module.exports = store

function store (state, emitter) {
  state.totalClicks = 0

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
          // let qrCode = makeQrCode(ipfsId.peerId)
          // document.querySelector('#qr-code').innerHTML = qrCode

          // peerProfile({
          //   peerId: ipfsId.peerId,
          //   clientPeerId: ipfsId.peerId,
          //   name: ipfsId.idData.handle,
          //   handle: ipfsId.idData.handle,
          //   canFollow: true,
          //   self: true
          // })

          // updateFavicon(ipfsId.peerId)
          // animate.endAnimation()
          // document.querySelector('#nav-links').style.opacity='1'
          emitter.emit(state.events.RENDER)
        },

        // 'proof-deleted': () => {
        //   // reload the proofUI
        //   let nodeId = 'proof-list'
        //   let existing = document.querySelector(`#${nodeId}`)
        //   proofList().then((newUi) => {
        //     html.update(existing, newUi)
        //   })
        // },
        //
        // 'peer joined': (message) => {
        //   message.event = 'Peer Joined'
        //   logMessage(message)
        //   // TODO: remove / gray out peers on `peer left`
        //   let profile = {
        //     peerId: message.peerId,
        //     clientPeerId: message.ipfsId.peerId,
        //     name: message.name || null,
        //     handle: message.handle || null,
        //     canFollow: true,
        //     connected: true,
        //     proofs: message.proofs || []
        //   }
        //
        //   updatePeerProfile(profile)
        // },
        //
        // 'peer left': (message) => {
        //   message.event = 'Peer Left'
        //   logMessage(message)
        //   // TODO: update the UI to reflect disconnection
        // },
        //
        // 'subscribed': (message) => {
        //   message.event = 'Subscribed to Room'
        //   logMessage(message)
        // },
        //
        // 'message': (message) => {
        //   message.event = 'Message Rcvd'
        //   let _msg = JSON.parse(message.data)
        //   if (_msg.updated) {
        //     // store the peer in IpfsID._knownPeers
        //     // IpfsID._knownPeers[_msg.peerId] = _msg
        //     updatePeerProfile(_msg)
        //     // IpfsID.verifyPeer(_msg)
        //   }
        //
        //   logMessage(_msg)
        // },
        // 'updatePeerProfile': (profile) => {
        //   let _profile = {
        //     peerId: profile.peerId,
        //     clientPeerId: null, // need this in this closure
        //     name: null,
        //     handle: profile.handle,
        //     bio: profile.bio,
        //     canFollow: true
        //   }
        //   updatePeerProfile(_profile)
        // }
      })
    })

    emitter.on('clicks:add', function (count) {
      state.totalClicks += count
      emitter.emit(state.events.RENDER)
    })

    emitter.on('changeContent', function (content) {
      state.currentContent = content
      emitter.emit(state.events.RENDER)
    })
  })
}

'use strict'

const { IpfsIdentity, start, checkForAccount } = require('../src/index')

const html = require('yo-yo')
const qrcode = require('qrcode-generator')
const Clipboard = require('./node_modules/clipboard/dist/clipboard.min')
const createIcon = require('blockies-npm');

const APP_NAME = 'Autonomica'
const VIEW_IDENT = 'identity-app'
const VIEW_SPLASH = 'splash'
const VIEW_PROOF = 'proof'
const VIEW_LISTEN = 'listen'
const VIEW_LOG = 'log-ui'

function view (id) {
  const views = document.querySelectorAll(`._view_`)
  for (let i = 0; i < views.length; i++) {
    if (views[i].id === id) {
      continue
    }
    views[i].style.display = 'none'
  }
  document.querySelector(`#${id}`).style.display = 'block'
  switch (id) {
  case VIEW_PROOF:
    let nodeId = 'username'
    focusNode(nodeId, 2000)
    break
  default:
    return
  }
}

function focusNode (id, timeout) {
  setTimeout (() => {
    document.querySelector(`#${id}`).focus()
  }, timeout || 0)
}

function makeQrCode(data) {
  const typeNumber = 0;
  const errorCorrectionLevel = 'L';
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(data);
  qr.make();
  let svgTag = qr.createSvgTag()

  return html`${svgTag}`
}

function hide (node) {
  node.style = 'display: none;'
}

function show (node, inline=false) {
  let mode = 'block'
  if (inline) {
    mode = 'inline'
  }
  node.style = `display: ${mode};`
}

function idUI (ipfsID, handle) {
  console.log('idUI', handle)

  const icon = avatar(ipfsID.peerId)

  function evtEditHandle (event) {
    const input = document.querySelector('#handle-edit')
    // edit the handle name
    console.log('edit handle')
    input.disabled = false;
    input.style = 'border-color: red;'
    input.focus()
    hide(document.querySelector('#handle-edit-btn'))
    show(document.querySelector('#handle-save-btn'), true)
  }

  function evtSaveHandle () {
    const input = document.querySelector('#handle-edit')
    let updatedData = { handle: input.value }
    window.IpfsID.saveIdData(updatedData)
    input.style = 'border-color: green;'
    input.disabled = true;
    // notification !
    notify.success('Success', 'Handle changed was saved.')
    hide(document.querySelector('#handle-save-btn'))
    show(document.querySelector('#handle-edit-btn'), true)
    // triggger broadcast to peers that idData is updated
    ipfsID.broadcastProfile()
  }

  function broadcastId () {
    ipfsID.broadcastProfile()
  }

  return html`
    <article id="identity-app" class="_view_ center mw7 br3 ba b--black-10 mv4">
      <div class="w-100 pt4 pl4">
        <span id="identity-blocky"
              title="IPFS Peer ID as Blocky Avatar">${icon}</span>
        <span id="qr-code" class="fr pr4"
              title="IPFS Peer ID as QR Code"></span>
      </div>
      <div id="identity-peer-id"
           class="code w-100 pt4 pl4 f5"
           onclick=${broadcastId}
           title="IPFS Peer ID">${ipfsID.peerId}
      </div>
      <div title="Account Handle"
           class="w-100 f3 bg-near-white br3 br--top black-80 mv0 pa4">
        <input disabled
               class="code pv1 pa2 input-reset ba bg-transparent w-60 mr2"
               name="handle-edit-input"
               id="handle-edit"
               value="${handle}" />
        <span id="edit-save-btns">
          <a href="#"
             id="handle-edit-btn"
             class="f6 link dim br3 ph3 pv2 mb2 dib white bg-black"
             onclick=${evtEditHandle}>
            Edit Handle
          </a>
          <a href="#"
             id="handle-save-btn"
             class="f6 link dim br3 ph3 pv2 mb2 dib white bg-black"
             style="display: none;"
             onclick=${evtSaveHandle}>
            Save Handle
          </a>
        </span>
      </div>
      <div class="pa3 bt b--black-10 bg-near-white center">
        <h3>IPFS RSA Public Key (dehydrated) [signing only]</h3>
        <p class="f6 f5-ns lh-copy">
        <textarea disabled
                  class="f7 ma3 bg-white br3 ph3 pv2 mb2 overflow-auto"
                  title="IPFS Public Key [Signing Only]">${ipfsID.pubKeyDehydrated}</textarea>
      </p>
    </div>
  </article>`
}

function splash () {
  return html`
    <div>
      <article id="splash-wrapper" style="text-align: center;"
               class="_view_ center mw7-ns br3 ba b--black-10 mv4 mb20 pa4">
        <img src="img/autonomica.jpg" class="splash-img" />
      </article>
      <article id="splash" class="_view_ center mw7-ns br3 ba b--black-10 mv4">
        <h1 class="f4 bg-near-white br3 br--top black-60 mv0 pv2 ph3">
          ${APP_NAME} is an experiment
        </h1>
        <div class="pa3 bt b--black-10 bg-near-white">
          <p class="f6 f5-ns lh-copy">
            ... in decentralized identity. Through the magic of IPFS and modern web browsers we can organize our online identity outside of any walled gardens and without any official authorities other than ourselves.
          </p>
          <p class="f6 f5-ns lh-copy">
            Through ${APP_NAME}, your cryptogrphic identity is established via the IPFS node running here.
          </p>
          <p class="f6 f5-ns lh-copy">
            In order to prove your identity, one creates a Proof using ${APP_NAME} - click 'Proof' above to begin.
          </p>
          <p class="f6 f5-ns lh-copy">
            The Proof can be posted to a Github Gist in order to prove ownership of a Github account, tying the Github ID to this ${APP_NAME} ID.
          </p>
          <p class="f6 f5-ns lh-copy">
            The same can be done for a website, blog, social media, DNS record, etc
          </p>
          <p class="f6 f5-ns lh-copy">
            Once an Identity is proven and tied to other systems, it becomes more familiar and trustworthy to use with IPFS, its APIs and systems that are being built upon it.
          </p>
        </div>
      </article>
    </div>`
}

function proof (proofData) {
  function evtProofCreateLink (event) {
    let username = document.querySelector('#username').value
    let service = document.querySelector('#service').value
    if (!username || !service) {
      return notify.error('Username @ Service is required')
    }
    window.IpfsID.createProof(username, service, (err, proof) => {
      proof.proof = JSON.parse(proof.proof)
      document.querySelector('#proof-preview-display').innerText =
        JSON.stringify(proof, null, 2)
    })
  }

  function evtProofSave () {
    // Save to local indexDB: save { 'proof:username:service': { ipfsUrl: <url>, ipnsUrl: <url>, timestamp: <ts> }
    let proof = document.querySelector('#proof-preview-display').value.trim()
    if (!proof) {
      return notify.error('Error', 'Cannot save non-existent proof')
    }
    // Save to IPFS, pin & create IPNS URL
    IpfsID.saveProof(proof).
      then((res) => {
        notify.success('Proof stored successfully')
      }).
      catch((err) => {
        notify.error(err)
      })
  }

  function evtShowProofs () {
    notify.info('Not implemented')
  }

  function evtProofHelp () {
    notify.info('Not implemented')
  }

  function evtCreateProof () {
    notify.info('Not implemented')
  }

  return html`
    <article id="proof" class="_view_ center mw7 mw7-ns br3 ba b--black-10 mv4">
      <div class="mw7 mw7-ns overflow-hidden">
        <div id="proof-tabs" data-current="create-proof"
             class="f6 bb bw1 b--black-10 flex">
          <a class="ttu dib link dim pa3 black"
             href="#" id="show-proofs" onclick=${evtShowProofs}>Proofs</a>
          <a class="ttu dib link dim pa3 black b--blue b bb bw2"
             href="#" id="create-proof" onclick=${evtCreateProof}>Create</a>
          <a class="ttu dib link dim pa3 black"
             href="#" id="proof-help" onclick=${evtProofHelp}>Help</a>
        </div>
        <div id="proof-form" class="w-90 pv2 center pa3 bg-near-white">
          <fieldset class="cf bn ma0 pa0">
            <legend class="pa0 f5 f4-ns mb3 black-80">
              Create Identity Proof
            </legend>
            <div class="cf">
              <label class="clip" for="username">Username</label>
              <input class="f6 f5-l input-reset ba b--black-10 fl black-80 bg-white pa3 lh-solid w-100 w-75-m w-80-l br2-ns br--left-ns"
                     placeholder="@username"
                     autocomplete="off"
                     type="text"
                     name="username"
                     id="username"
                     title="Enter a username you use for an online service: Github, Twitter, etc..." />
              <label class="clip" for="service">Service</label>
              <input class="f6 f5-l input-reset ba b--black-10 fl black-80 bg-white pa3 lh-solid w-100 w-75-m w-80-l br2-ns br--left-ns"
                     placeholder="service: github.com, twitter.com, etc"
                     type="text"
                     name="service"
                     id="service">
              <a class="f6 f5-l fl pv3 tc bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--right-ns"
                 onclick=${evtProofCreateLink}>Create Proof</a>
            </div>
          </fieldset>
        </div>
      </div>

      <div id="proof-preview" class="w-90 center">
        <a href="#"
           title="Copy proof to clipboard"
           class="link dim br3 ph3 pv2 mb2 dib white"
           data-clipboard-target="#proof-preview-display"
           id="proof-copy">
          <img class="h2" src="./img/clippy.svg"/>
        </a>
        <textarea disabled id="proof-preview-display"
             class="f7 ma3 bg-white br3 ph3 pv2 mb2 overflow-auto">
        </textarea>
        <div class="lh-copy mt3 ph3">
          <a class="f6 link dim br3 ph3 pv2 mb2 dib white bg-black"
             href="https://gist.github.com/"
             title="Create Proof, then copy to clipboard, then click here to publish"
             target="_new">Post proof to Gist</a>
          <a class="f6 link dim br3 ph3 pv2 mb2 dib white bg-black"
             href="#"
             onclick=${evtProofSave}>Save proof to IPFS</a>
        </div>
    </article>`
}

function nav () {
  function evtAutoLink (event) {
    view(VIEW_SPLASH)
  }

  function evtIDLink (event) {
    view(VIEW_IDENT)
  }

  function evtProofLink (event) {
    view(VIEW_PROOF)
  }

  function evtListenLink (event) {
    view(VIEW_LISTEN)
  }

  function evtLogLink (event) {
    view(VIEW_LOG)
  }

  return html`
    <div id="nav" data-name="component">
      <header class="bg-black-90 fixed w-100 ph3 pv3 pv4-ns ph4-m ph5-l">
        <nav class="f6 fw6 ttu tracked w-80 center">
          <div class="center" style="text-align: center;">
            <a id="autonomica-link"
               class="link dim white dib mr3"
               href="#"
               title="Autonomica"
               onclick=${evtAutoLink}>
               Autonomica
            </a>
            <a id="identity-link"
               class="link dim white dib mr3"
               href="#"
               title="Identity"
               onclick=${evtIDLink}>
               Identity
            </a>
            <a id="proof-link"
               class="link dim white dib mr3"
               href="#"
               title="Proof"
               onclick=${evtProofLink}>
               Proof
            </a>
            <a id="listen-link"
               class="link dim white dib mr3"
               href="#"
               title="Listen to the network for peers"
               onclick=${evtListenLink}>
               Peers
            </a>
            <a id="log-link"
               class="link dim white dib mr3"
               href="#"
               title="Raw log of pubsub message"
               onclick=${evtLogLink}>
               Log
            </a>
          </div>
        </nav>
      </header>
    </div>`
}

function avatar (peerId) {
  let icon = createIcon({ // All options are optional
    seed: peerId, // seed used to generate icon data, default: random
    // color: '#dfe', // to manually specify the icon color, default: random
    // bgcolor: '#aaa', // choose a different background color, default: white
    // size: 15, // width/height of the icon in blocks, default: 10
    // scale: 3 // width/height of each block in pixels, default: 5
  })
  let list = 'w3-ns h3-ns'.split(' ');
  list.forEach((klass) => {
    icon.classList.add(klass)
  })

  return icon
}

function listen () {
  // display UI that shows broadcasts to our pubsub topic where the broadcast is a JSON string that describes a fellow user's peerId, handle and proof
  // Toggle that allows current user to broadcast handle, peerId and proof

  return html`
    <article id="listen"
             class="_view_ center mw7 mw7-ns br3 ba b--black-10 mv4">
    </article>`
}

function logUi () {
  //  raw log of messages coming in via topic subscription - or DMs
  return html`
    <article id="log-ui"
             style=""
             class="hidden _view_ bg-black-90 w-90 center mw7 mw7-ns br3 ba b--black-10 mv4">
      <div id="log-output"
           class="f7 bg-black-90 green code overflow-auto lh-copy overflow-scroll"
           style="word-break: break-word; min-height: 300px; max-height: 500px;">
      </div>
    </article>`
}

const STRING = 'string'
const OBJECT = 'object'

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

  const msgNode = html`
    <div
      class="f7 bg-black-90 green code"
      style="word-break: break-word">
      ${_msg}
    </div>`

  document.querySelector('#log-output').prepend(msgNode)
}

function updatePeerProfile (profileObj) {
  if (!profileObj) {
    return
  }
  if (!profileObj.peerId) {
    return
  }

  const id = `#peer-profile-${profileObj.peerId}`
  const existingNode = document.querySelector(id)
  if (!existingNode) {
    // NOTE: we should run peerProfile() here as we did not know about this peer
    peerProfile(profileObj)
    return
  }

  // Need to cache each profile in an array memory
  // in order to perform an `update`
  // has the profile changed?
  let handle = existingNode.querySelector('#profile-handle').textContent
  if (handle != profileObj.handle) {

    // update peer info by removal and prepend as the peer could be sending new metadata
    existingNode.parentNode.removeChild(existingNode)
    // re-display updated peer profile
    peerProfile(profileObj)
  }
}

function peerProfile (profile) {
  const icon = avatar(profile.peerId)
  var name, handle, canFollow = true
  const DEFAULT_PROFILE_NAME = 'Another Noob'

  if (!profile.handle) {
    handle = profile.peerId
  } else {
    handle = profile.handle
  }
  if (profile.canFollow) {
    canFollow = profile.canFollow
  }

  name = handle //  temp hack

  function cantFollow (event) {
    notify.info('You cannot follow yourself')
  }

  function follow (event) {
    console.log(`follow! ${profile.handle || profile.peerId}`)
    notify.info('Following...', `${profile.handle || profile.peerId}`)
  }

  function evtExaminePubKey (event) {
    // display overlay that shows public key
    let keyCard = publicKeyCard(profile)
    document.querySelector('#modal').appendChild(keyCard)
  }

  function btn (profile) {
    if (profile.peerId === profile.clientPeerId) {
      return html`
        <button class="f6 button-reset bg-white ba b--black-10 dim pointer pv1 black-60" onclick=${cantFollow}>(You)</button>`
    } else {
      return html`
        <button class="f6 button-reset bg-white ba b--black-10 dim pointer pv1 black-60" onclick=${follow}>+ Follow</button>`
    }
  }

  let profileHtml = html`
    <article id="peer-profile-${profile.peerId}"
             class="pa3 dt w-100 bb b--black-05 pb2 mt2" href="#0">
      <div id="avatar-${profile.peerId}" class="dtc w2 w3-ns v-mid">
        ${icon}
      </div>
      <div class="dtc v-mid pl3">
        <h1 id="profile-name" class="f6 f5-ns fw6 lh-title black mv0">${name} </h1>
        <h2 id="profile-handle" class="f7 pt1 fw4 mt0 mb0 black-60">${handle}</h2>
        <h3 class="f7 code pt1 fw4 mt0 mb0 black-60">${profile.peerId}</h3>
      </div>
      <div class="dtc v-mid">
        <div class="w-100 tr">
          ${btn(profile)}
        </div>
        <div class="tr w-100 pr3">
          <img title="Examine Public Key"
               class="pt1 dim pointer h2"
               src="./img/key.svg"
               onclick=${evtExaminePubKey} />
        </div>
      </div>
    </article>`

  document.querySelector('#listen').prepend(profileHtml)
}

function publicKeyCard (profile) {
  const icon = avatar(profile.peerId)

  function close (event) {
    let card = document.querySelector('#public-key-card')
    card.parentNode.removeChild(card)
  }

  return html`
    <article id="public-key-card"
             class="center bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
      <div><img class="h1" onclick=${close} src="./img/close.svg" /></div>
      <div class="tc">
        <div>${icon}</div>
        <h1 class="f5 code">
          ${profile.handle || profile.peerId}
        </h1>
        <hr class="mw5 bb bw1 b--black-10" />
      </div>
      <p class="code lh-copy measure center f7 pa2 black-70 h3 overflow-auto ba b--black-20">
        ${profile.bio || 'No bio available'}
      </p>
      <textarea disabled class="code lh-copy measure center f7 pa2 black-70 h5 overflow-auto ba b--black-20">
        ${profile.publicKey || 'No shared public key available'}
      </textarea>
    </article>`
}

function updateFavicon (peerId) {
  // get ref to your blocky
  let blockyCanvas
  let canvasParentNode = document.querySelector(`#avatar-${peerId}`)
  // get the png as base64
  if (canvasParentNode) {
    blockyCanvas = canvasParentNode.querySelector('canvas')
    // set href of favicon
    let base64 = blockyCanvas.toDataURL('image/jpeg')
    console.log(base64)
    document.querySelector('#favicon').href = base64
  }
}

const notify = {
  get notifyNode () {
    return document.querySelector('#notifications')
  },
  display: (uiNode) => {
    notify.notifyNode.appendChild(uiNode)
    window.setTimeout(() => {
      notify.notifyNode.removeChild(uiNode)
    }, 2500)
  },
  modes: {
    success: 'green',
    info: 'blue',
    warn: 'yellow',
    error: 'red'
  },
  notifyUI: (headline, message, mode) => {
    return html`
      <p class="_notification_ f7 w-90 ba br2 pa3 ma2 ${notify.modes[mode]} bg-washed-${notify.modes[mode]}"
         role="alert">
        <strong>${headline}</strong> ${message}
      </p>`
  },
  success: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'success'))
  },
  info: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'info'))
  },
  warn: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'warn'))
  },
  error: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'error'))
  }
}

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

function handleDirectMessage (message) {
  // process DMs coming in

}

window.notify = notify

document.addEventListener('DOMContentLoaded', () => {
  const _nav = document.querySelector('#nav')
  html.update(_nav, nav())

  const _proof = document.querySelector('#proof')
  html.update(_proof, proof())

  const splashNode = document.querySelector('#splash')
  html.update(splashNode, splash())
  document.querySelector('#splash-wrapper img').classList.add('splash-visible')
  document.querySelector('#splash-wrapper img').classList.remove('splash-img')


  const listenView = document.querySelector('#listen')
  html.update(listenView, listen())

  const logView = document.querySelector('#log-ui')
  html.update(logView, logUi())

  //Default
  let HANDLE = `DWeb Enthusiast`

  checkForAccount((err, account) => {
    if (err) {
      // no account
      console.log(err)
    }
    if (account) {
      HANDLE = account.handle
    }
    start(HANDLE, {
      startComplete: (ipfsId) => {
        console.log(ipfsId.idData)
        const ui = idUI(ipfsId, ipfsId.idData.handle)
        html.update(document.querySelector(`#${VIEW_IDENT}`), ui)

        var clip = new Clipboard('#proof-copy');

        clip.on("success", () => {
          // Notifications !
          notify.info('Copied to clipboard')
        });
        clip.on("error", () => {
          console.info('error copying to clipboard')
        });

        let qrCode = makeQrCode(ipfsId.peerId)
        document.querySelector('#qr-code').innerHTML = qrCode
        view(VIEW_IDENT)

        peerProfile({
          peerId: ipfsId.peerId,
          clientPeerId: ipfsId.peerId,
          name: ipfsId.idData.handle,
          handle: ipfsId.idData.handle,
          canFollow: true,
          self: true
        })

        updateFavicon(ipfsId.peerId)
      },

      'peer joined': (message) => {
        console.log('UI peer joined', message)
        message.event = 'Peer Joined'
        logMessage(message)
        // Display peer profile card
        // We want to replace the peers on `peer join`
        // TODO: remove peers on `peer left`
        updatePeerProfile({
          peerId: message.peerId,
          clientPeerId: message.ipfsId.peerId,
          name: message.name || null,
          handle: message.handle || null,
          canFollow: true
        })
      },

      'peer left': (message) => {
        console.log('UI peer left', message)
        message.event = 'Peer Left'
        logMessage(message)
      },

      'subscribed': (message) => {
        console.log('UI subscribed', message)
        message.event = 'Subscribed to Room'
        logMessage(message)
      },

      'message': (message) => {
        const DIRECT = 'direct-message'
        console.log('UI message', message)
        message.event = 'Message Rcvd'
        let _msg = JSON.parse(message.data)
        if (_msg.profileUpdated) {
          updatePeerProfile(_msg)
        }
        if (_msg.messageTtype) {
          if (_msg.messageTtype === DIRECT) {
            handleDirectMessage(_msg)
          }
        }
        logMessage(_msg)
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
        updatePeerProfile(_profile)
      }
    })
  })
})

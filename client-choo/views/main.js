const html = require('choo/html')
const raw = require('choo/html/raw')

const avatar = require('../../client/utils/avatar')

const Splash = require('../components/splash')
const IdentityUI = require('../components/identity')
const Proof = require('../components/proof')
const Peers = require('../components/peers')
const Log = require('../components/log')
const PublicKeyCard = require('../components/public-key-card')

const TITLE = 'client-choo - main'
const APP_NAME = 'Autonomica'
const VIEW_IDENT = 'identity-app'
const VIEW_SPLASH = 'splash'
const VIEW_PROOF = 'proof'
const VIEW_LISTEN = 'listen'
const VIEW_LOG = 'log-ui'

const notificationModes = {
  success: 'green',
  info: 'blue',
  warn: 'yellow',
  error: 'red'
}

module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) emit(state.events.DOMTITLECHANGE, TITLE)

  let content
  if (state.currentContent === VIEW_IDENT) {
    content = state.cache(IdentityUI, 'content:identity-ui').render(state)
  } else if (state.currentContent === VIEW_SPLASH) {
    content = state.cache(Splash, 'content:splash').render(state, APP_NAME)
  } else if (state.currentContent === VIEW_PROOF) {
    content = state.cache(Proof, 'content:proof').render(state)
  } else if (state.currentContent === VIEW_LISTEN) {
    content = state.cache(Peers, 'content:peers').render(state)
  } else if (state.currentContent === VIEW_LOG) {
    content = state.cache(Log, 'content:log').render(state)
  }

  const publicKeyCard = state.publicKeyCard.show
    ? state.cache(PublicKeyCard, 'content:public-key-card').render(state)
    : null

  function handleClick () {
    emit('clicks:add', 1)
  }

  let baseClass = `_view_`
  function evtAutoLink (event) {
    emit('changeContent', VIEW_SPLASH)
  }

  function evtIDLink (event) {
    emit('changeContent', VIEW_IDENT)
  }

  function evtProofLink (event) {
    emit('changeContent', VIEW_PROOF)
  }

  function evtListenLink (event) {
    emit('changeContent', VIEW_LISTEN)
  }

  function evtLogLink (event) {
    emit('changeContent', VIEW_LOG)
  }

  let peerId, icon
  if (state.IpfsID) {
    peerId = state.IpfsID.identity.profile.peerId
    icon = avatar(peerId)
  }

  const navAnimation = state.navAnimation
    ? '<span id="nav-animation" class="f2 code link dim blue dib mr3"></span>'
    : null
  const navOpacity = state.navAnimation ? 'opacity: 0;' : 'opacity: 1;'
  const introImage = state.navAnimation
    ? `
      <article id="fade-in" style="text-align: center;"
               class="_view_ center mw7-ns br3 ba b--black-10 mv4 mb20 pa4">
        <img src="img/ocean-rock.png" />
      </article>
    `
    : null

  return html`
    <div>
      <div id="favicon-${peerId}" style="display:none">
        ${icon}
      </div>
      <div id="nav-parent" class="fl w-100">
        <div id="nav" data-name="component">
          <header class="bg-black-90 fixed w-100 ph3 pv3 pv4-ns ph4-m ph5-l">
            <nav class="f6 fw6 ttu tracked w-80 center">
              ${raw(navAnimation)}
              <div id="nav-links" class="center" style="text-align: center; ${navOpacity}">
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
        </div>
      </div>
      <div id="modal" class="w-50"></div>
      <div id="confirmation-modal" class="w-40"></div>
      <div id="notifications" class="w-60">
        ${Object.keys(state.notifications).map(key => {
          const { mode, headline, message } = state.notifications[key]
          return html`
            <p class="_notification_ f7 w-50 ba br2 pa3 ma2 ${notificationModes[mode]} bg-washed-${notificationModes[mode]}"
               role="alert">
              <strong>${headline}</strong> ${message}
            </p>
          `
        })}
      </div>
      <div id="proof-detail" class="w-80"></div>
      <div id="public-key-card" class="w-80">
        ${publicKeyCard}
      </div>
      <div id="main" class="fl w-100 pt3">
        ${raw(introImage)}
        ${content}
      </div>
    </div>
  `
}

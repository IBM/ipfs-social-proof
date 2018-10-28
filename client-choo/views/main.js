const html = require('choo/html')

const styles = require('../styles')

const Splash = require('../components/splash')
const IdentityUI = require('../components/identity')
const Proof = require('../components/proof')
const Peers = require('../components/peers')
const Log = require('../components/log')

const TITLE = 'client-choo - main'
const APP_NAME = 'Autonomica'
const VIEW_IDENT = 'identity-app'
const VIEW_SPLASH = 'splash'
const VIEW_PROOF = 'proof'
const VIEW_LISTEN = 'listen'
const VIEW_LOG = 'log-ui'

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

  return html`
    <body onload="document.body.style.opacity='1'"
          class=${styles.body}>
      <div id="nav-parent" class="fl w-100">
        <div id="nav" data-name="component">
          <header class="bg-black-90 fixed w-100 ph3 pv3 pv4-ns ph4-m ph5-l">
            <nav class="f6 fw6 ttu tracked w-80 center">
              <span id="nav-animation" class="f2 code link dim blue dib mr3"></span>
              <div class="center ${styles.navLinks}" style="text-align: center;">
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
      <div class="${styles.modal}" class="w-50"></div>
      <div class="${styles.confirmationModal}" class="w-40"></div>
      <div class="${styles.notifications}" id="notifications" class="w-60"></div>
      <div class="${styles.proofDetail}" class="w-80"></div>
      <div class="${styles.publicKeyCard}" class="w-80"></div>
      <div class="${styles.main} fl w-100 pt3">
      ${content}
    </body>
  `
}
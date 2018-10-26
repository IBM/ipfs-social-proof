const html = require('choo/html')

const styles = require('../styles')

var TITLE = 'client-choo - main'

module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) emit(state.events.DOMTITLECHANGE, TITLE)

  return html`
    <body onload="document.body.style.opacity='1'"
          class=${styles.body}>
      <div id="nav-parent" class="fl w-100">
        <div id="nav"></div>
      </div>
      <div class="${styles.modal}" class="w-50"></div>
      <div class="${styles.confirmationModal}" class="w-40"></div>
      <div class="${styles.notifications}" class="w-60"></div>
      <div class="${styles.proofDetail}" class="w-80"></div>
      <div class="${styles.publicKeyCard}" class="w-80"></div>
      <div class="${styles.main}" class="fl w-100 pt3">
        <article id="fade-in" style="text-align: center;"
                 class="_view_ center mw7-ns br3 ba b--black-10 mv4 mb20 pa4">
          <img src="img/ocean-rock.png" />
        </article>
        <article id="splash"
                 class="_view_ w-80"
                 style="display:none;">
        </article>
        <article id="identity-app"
                 class="_view_ w-80"
                 style="display:none;"></article>
        <article id="proof"
                 class="_view_ w-80"
                 style="display:none;"></article>
        <article id="listen"
                 class="_view_ w-80"
                 style="display:none;"></article>
        <article id="log-ui"
                 class="_view_ w-80"
                 style="display:none;"></article>
      </div>
      <script type="application/javascript" src="bundle.js"></script>
    </body>
  `

  function handleClick () {
    emit('clicks:add', 1)
  }
}

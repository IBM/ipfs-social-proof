var html = require('choo/html')
var Component = require('choo/component')

module.exports = class Splash extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
  }

  load (element) {
    //
  }

  update (state) {
    this.state = state
    return false
  }

  createElement (state, APP_NAME) {
    return html`
      <article id="splash" class="_view_ center mw7-ns br3 ba b--black-10 mv4">
        <h1 class="f4 bg-near-white br3 br--top black-60 mv0 pv2 ph3">
          ${APP_NAME} is an experiment
        </h1>
        <div class="pa3 bt b--black-10 bg-near-white">
          <p class="f6 f5-ns lh-copy">
            ... in decentralized identity. Through the magic of IPFS and modern web browsers we can organize our online identity outside of any walled gardens and without any official authorities other than ourselves.
          </p>
          <p class="f6 f5-ns lh-copy">
            Through ${APP_NAME}, your cryptographic identity is established via the IPFS node running here.
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
    `
  }
}

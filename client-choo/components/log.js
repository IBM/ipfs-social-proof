var html = require('choo/html')
var Component = require('choo/component')

module.exports = class Log extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.emit = emit
  }

  load (element) {
    //
  }

  update (newState) {
    this.state = newState
    return true
  }

  createElement (state) {
    return html`
      <article id="log-ui"
               style=""
               class="hidden _view_ bg-black-90 w-80 center mw7 mw7-ns br3 ba b--black-10 mv4">
        <div id="log-output"
             class="f7 pa3 green code overflow-auto lh-copy overflow-scroll"
             style="word-break: break-word; min-height: 300px; max-height: 500px;">
          ${state.logs.map((msg) => {
            return html`
              <div
                class="f7 green code"
                style="word-break: break-word">
                ${msg}
              </div>
            `
          })}
        </div>
      </article>
    `
  }
}

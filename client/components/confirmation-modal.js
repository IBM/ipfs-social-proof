var html = require('choo/html')
var Component = require('choo/component')

module.exports = class ConfirmationModal extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.emit = emit
  }

  update (newState) {
    this.state = newState
    return true
  }

  closeConfModal () {
    this.emit('closeConfirmationModal')
  }

  createElement (state) {
    // state.confirmationModal.config: { id: an ID to use in the callback, optional
    //                headline: 'are you sure?',
    //                details: 'if you confirm...'
    //                proceedLabel: 'Delete and stuff',
    //                proceedFunc: operational function to proceed }

    const { config } = state.confirmationModal

    const proceedAndClose = () => {
      config.proceedFunc(config.id, () => { this.closeConfModal() })
    }

    return html`
      <div id="confirmation-modal" class="w-60">
         <article class="w-80 shadow-1 center bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
           <div>
             <img title="Close" class="h1" onclick=${this.closeConfModal.bind(this)} src="./img/close.svg" />
           </div>
           <div class="tc">
              <h1 class="f7 code">${config.headline}</h1>
              <div>
               <p class="mv4">${config.details || ''}</p>
                <a title="Close"
                   class="no-underline f6 ph3 pv3 bn bg-animate bg-dark-red hover-bg-light-red white pointer w-100 w-25-m w-20-l br2-ns br--all-ns f5-l"
                   onclick=${proceedAndClose}>${config.proceedLabel}</a>
                </div>
           </div>
         </article>
       </div>
    `
  }
}

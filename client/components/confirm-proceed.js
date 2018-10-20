'use strict'

const html = require('yo-yo')
const notify = require('./notify')

function confirmProceed (detailsConf, proceedFunc) {
  // detailsConf: { headline: 'are you sure?',
  //                details: 'if you confirm...'
  //                proceedLabel: 'Delete and stuff' }
  // proceedFunc: operational function to proceed

  function closeConfModal (err, result) {
    if (err && !err.target) {
      return notify.error(err)
    }

    let origNode = document.querySelector('#confirmation-modal')
    let modal = html`<div id="confirmation-modal" class="w-60"></div>`
    html.update(origNode, modal)
    origNode = document.querySelector('#modal')
    modal = html`<div id="modal" class="w-80"></div>`
    html.update(origNode, modal)
  }

  function proceedAndClose () {
    proceedFunc(closeConfModal)
  }

  const newNode = html
    `<div id="confirmation-modal" class="w-60">
       <article class="w-80 shadow-1 center bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
         <div>
           <img title="Close" class="h1" onclick=${closeConfModal} src="./img/close.svg" />
         </div>
         <div class="tc">
            <h1 class="f7 code">${detailsConf.headline}</h1>
            <div>
             <p class="mv4">${detailsConf.details || ''}</p>
              <a title="Close"
                 class="no-underline f6 ph3 pv3 bn bg-animate bg-dark-red hover-bg-light-red white pointer w-100 w-25-m w-20-l br2-ns br--all-ns f5-l"
                 onclick=${proceedAndClose}>${detailsConf.proceedLabel}</a>
              </div>
         </div>
       </article>
     </div>`
  html.update(document.querySelector('#confirmation-modal'), newNode)
}

module.exports = confirmProceed

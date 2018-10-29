const html = require('choo/html')
const Component = require('choo/component')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL } = require('../../src/utils')

module.exports = class ProofDetail extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.emit = emit
  }

  update (newState) {
    this.state = newState
    return true
  }

  updateUrl (evt) {
    this.emit('updateProofDetailUrl', evt.target.value)
  }

  closeModal () {
    this.emit('closeProofDetail')
  }

  saveProofUrl () {
    this.emit('saveProofUrl')
  }

  deleteProof (proofHash, callback, IpfsID) {
    IpfsID.proofsDB.delete(proofHash).
      then((res) => {
        this.emit('notify:success', 'Proof deleted')
        callback(null, res)
      }).catch((ex) => {
        console.error(ex)
        this.emit('notify:error', 'Proof delete failed')
      })
  }

  confirmProceed (proof, IpfsID) {
    this.emit('openConfirmationModal', {
      id: proof.id,
      headline: 'Are you sure you want to delete this proof?',
      details: 'You can easily create this proof again later',
      proceedLabel: 'Delete',
      proceedFunc: (proofHash, callback) => { this.deleteProof(proofHash, callback, IpfsID) }
    })
  }

  createElement (state) {
    const { proofDetail: { proof, form }, IpfsID } = state
    return html`
      <div id="proof-detail" class="w-80">
       <article id="proof-card"
                class="w-70 shadow-1 center bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
       <div><img data-parent="proof-detail" title="Close" class="h1" onclick=${this.closeModal.bind(this)} src="./img/close.svg" /></div>
       <div class="tc mv3">
           <div class="flex-justify-between f7 code mv2">
             <span id="proof-hash">${proof.ipfsContentHash}</span>
             <span class="mr2">
               <img class="h1 ml4" title="Delete this Proof"
                    onclick=${() => { this.confirmProceed(proof, IpfsID) }}
                    src="./img/trash.svg" />
             </span>
           </div>
           <div class="flex-justify-between f7 code mv2">
             <input class="f7 pa2 code w-70"
                    title="Enter a published proof URL"
                    id="save-proof-url"
                    oninput=${this.updateUrl.bind(this)}
                    name="save-proof-url" value=${form.url || ''} />
             <img title="Save published proof URL"
                  class="h1 mh2"
                  src="img/save.svg"
                  onclick=${this.saveProofUrl.bind(this)} />
           </div>

         </div>
         <textarea disabled
                   class="flex w-100 h4 code lh-copy center f7 pa2 black-70 h5 overflow-auto ba b--black-20">${JSON.stringify(proof, null, 2)}</textarea>
        </article>
      </div>
    `
  }
}

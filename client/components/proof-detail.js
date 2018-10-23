'use strict'

const html = require('yo-yo')
const validUrl = require('valid-url')

const notify = require('./notify')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL } = require('../../src/utils')

const confirmProceed = require('./confirm-proceed')

class ProofDetail {

  constructor (domId, config={}) {
    this.cleanup()
    this.selector = `${ config.prefix || '#' }${ domId }`
    this.config = config
    this.doWork()
  }

  async doWork () {
    let proofId = this.config.proofId

    await IpfsID.proofsDB.getByIpfsHash(proofId).then((res) => {
      this.setState({proof: res})
    }).catch((ex) => {
      console.error(ex)
      notify.error('Cannot get proof from local database')
    })
  }

  // get the state async
  setState (state=null) {
    this.state = state
    this.state.confirmConfig = {
      id: this.config.proofId,
      headline: 'Are you sure you want to delete this proof?',
      details: 'You can easily create this proof again later',
      proceedLabel: 'Delete',
      proceedFunc: this.deleteProof
    }

    this.render()
  }

  currentNode () {
    return document.querySelector(this.selector)
  }

  render () {
    let state = this.state
    // create HTML template with the state and render it
    let newNode = html`
      <div id="proof-detail" class="w-80">
       <article id="proof-card"
                class="w-60 shadow-1 center bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
       <div><img data-parent="${this.selector}" title="Close" class="h1" onclick=${this.closeModal} src="./img/close.svg" /></div>
       <div class="tc mv3">
           <div class="flex-justify-between f7 code mv2">
             <span id="proof-hash">${state.proof.ipfsHash}</span>
             <span class="mr2">
               <img class="h1 ml4" title="Delete this Proof"
                    onclick=${function (event) { confirmProceed(state.confirmConfig) } }
                    src="./img/trash.svg" />
             </span>
           </div>
           <div class="flex-justify-between f7 code mv2">
             <input class="f7 pa2 code w-70"
                    title="Enter a published proof URL"
                    id="save-proof-url"
                    name="save-proof-url" value=${state.proof.url || ''} />
             <img title="Save published proof URL"
                  class="h1 mh2"
                  src="img/save.svg"
                  onclick=${this.saveProofUrl} />
           </div>

         </div>
         <textarea disabled
                   class="flex w-100 h4 code lh-copy center f7 pa2 black-70 h5 overflow-auto ba b--black-20">${JSON.stringify(state.proof, null, 2)}</textarea>
          </article>
        </div>`
    let existingNode = document.querySelector('#proof-detail')
    if (!existingNode) {
      // W T F, seems like yo-yo is changing the dom node id to `undefined`
      existingNode = html`<div id="proof-detail" class="w-80"></div>`
      document.querySelector('body').prepend(existingNode)
    }
    html.update(existingNode, newNode)
  }

  cleanup () {
    let undefinedNodes = document.querySelectorAll('#undefined')
    undefinedNodes.forEach((node) => {
      node.parentNode.removeChild(node) // TODO: is this a yo-yo bug??
    })
  }

  closeModal (event) {
    let currentNode = document.
        querySelector(event.target.dataset.parent)
    let defaultNode = html`<div id="${this.domId}" class="w-80"></div>`
    html.update(currentNode, defaultNode)
  }

  saveProofUrl () {
    let url = document.querySelector('#save-proof-url').value
    let hash = document.querySelector('#proof-hash').innerText
    // npm install valid-url
    if (!validUrl.isUri(url)) {
      return notify.error('Please enter a URL')
    }
    if (!hash) {
      return notify.error('IPFS Hash required')
    }

    IpfsID.proofsDB.saveProofUrl(hash, url).
        then((res) => {
          return notify.success('Url saved')
        }).catch((ex) => {
          console.error(ex)
          return notify.error('Url save failed')
        })
  }

  deleteProof (proofHash, callback) {
    const that = this
    window.IpfsID.proofsDB.delete(proofHash).
      then((res) => {
        notify.success('Proof deleted')
        callback(null, res)
        // that.closeModal({ target: { dataset: { parent: that.selector }}})
        let currentNode = document.
            querySelector('#proof-detail')
        let defaultNode = html`<div id="#proof-detail" class="w-80"></div>`
        html.update(currentNode, defaultNode)
      }).catch((ex) => {
        console.error(ex)
        notify.error('Proof delete failed')
      })
  }
}

module.exports = ProofDetail

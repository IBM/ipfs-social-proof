var html = require('choo/html')
var Component = require('choo/component')
const uuid = require('uuid/v1')

const CONTENT_PROOFS = 'show-proofs'
const CONTENT_HELP = 'help-proof'
const CONTENT_CREATE = 'create-proof'

module.exports = class Proof extends Component {
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

  evtProofCreateLink (event) {
    const { IpfsID } = this.state
    let username = document.querySelector('#username').value
    let service = document.querySelector('#service').value
    if (!username || !service) {
      this.emit('notify:error', 'Error', 'Username @ Service is required')
      return
    }
    IpfsID.proof.createProof(username, service, (err, proof) => {
      proof.proof = JSON.parse(proof.proof)
      document.querySelector('#proof-preview-display').innerText =
        JSON.stringify(proof, null, 2)
    })
  }

  evtProofSave () {
    const { IpfsID } = this.state
    // Save to local indexDB: save { 'proof:username:service': { ipfsUrl: <url>, ipnsUrl: <url>, timestamp: <ts> }
    let proof = JSON.parse(
      document.querySelector('#proof-preview-display').value.trim()
    )
    if (!proof) {
      this.emit('notify:error', 'Error', 'Cannot save non-existent proof')
    }
    proof.id = uuid() //  TODO: do this inside library/API
    IpfsID.proof.saveProof(proof).then((res) => {
      this.emit('notify:success', 'Proof stored successfully')
      this.emit('updateProofsList')
    }).catch((ex) => {
      console.error(ex)
      this.emit('notify:error', 'Error: Cannot save proof')
    })
  }

  evtShowProofs () {
    this.emit('updateProofContent', CONTENT_PROOFS)
    this.highlightTab('proof-tabs', '_tab_', 'show-proofs')
  }

  evtProofHelp () {
    this.emit('updateProofContent', CONTENT_HELP)
    this.highlightTab('proof-tabs', '_tab_', 'help-proof-tab')
  }

  evtCreateProof () {
    this.emit('updateProofContent', CONTENT_CREATE)
    this.highlightTab('proof-tabs', '_tab_', 'create-proof')
  }

  highlightTab (compId, tabClass, tabId) {
    let classes = 'b--blue b bb bw2'.split(' ')
    let tabs = document.querySelector(`#${compId}`).
        querySelectorAll(`.${tabClass}`)
    tabs.forEach((tab) => {
      if (tab.id !== tabId) {
        classes.forEach((klass) => {
          tab.classList.remove(klass)
        })
      } else {
        classes.forEach((klass) => {
          tab.classList.add(klass)
        })
      }
      console.log('highlight', tab.classList)
    })
  }

  viewProof (event) {
    var hash = event.target.dataset.hash
    // new ProofDetail('proof-detail', { proofId: hash })
  }

  proofList () {
    const { proofsList } = this.state
    // default view
    if (!proofsList.rows.length) {
      return html`
        <div id="proof-list"
             class="_proof_tab_ w-90 center pv4 bg-near-white">
          <h3>0 Proofs</h3>
        </div>
      `
    }
    return html`
      <div id="proof-list"
           class="_proof_tab_ w-90 center pv4 bg-near-white">
        <table class="w-100 collapse pl4 mt0 ba b--black-10">
          ${proofsList.rows.map((item) => {
            return html`
              <tr class="pv2 striped--light-gray">
                <td><img src="img/eye.svg"
                         onclick=${this.viewProof.bind(this)}
                         data-hash="${item.doc.ipfsContentHash}"
                         class="h1 ph2" /></td>
      <td class="f6">${item.doc.proof.message.username}@${item.doc.proof.message.service}</td><td class="ipfs-url fw1 f7 code"><a href="${item.doc.url}" target="_new">${item.doc.url}</a></td><td class="ipfs-url fw1 f7 code"><a target="_new" href="https://ipfs.io/ipfs/${item.doc.ipfsContentHash}" title="${item.doc.ipfsContentHash}">/ipfs/${item.doc.ipfsContentHash}</a></td>
              </tr>`
            })}
          </table>
       </div>
    `
  }

  createElement (state) {
    const currentProofContent = state.currentProofContent || CONTENT_CREATE
    const unselectedTab = '_tab_ ttu dib link dim pa3 black'
    const selectedTab = '_tab_ ttu dib link dim pa3 black b--blue b bb bw2'
    let proofListTab = unselectedTab
    let proofHelpTab = unselectedTab
    let proofCreateTab = unselectedTab
    let proofContent
    if (currentProofContent === CONTENT_PROOFS) {
      proofListTab = selectedTab
      proofContent = this.proofList()
    } else if (currentProofContent === CONTENT_HELP) {
      proofHelpTab = selectedTab
      proofContent = html`
        <div id="proof-help"
             class="_proof_tab_ w-90 center pa4 bg-near-white">
          <h2 class="f7">What is a 'Proof'?</h2>
          <p class="code f7">
            A 'Proof' is a cryptographic signature that verifies a statement like <i>'I am foo@twitter.com' - which links your Twitter identity to your IPFS node / identity. The proof document contains the statement, the cryptographic signature and the public key of the attestor of the staement.</i>
          </p>
          <p class="code f7">
            The proof document is then published online with a service that requires authentication. A good place to publish proofs is via a github "gist". This document can be linked to from a twitter or Facebook post - the more proofs published or linked to the better an identity in IPFS can be proven.
          </p>
          <p class="code f7">
            When IPFS peers engage with you, your proof list can be checked out, remote proofs downloaded and all signtaures verified to ensure you are the holder of the corresponding IPFS private key.
          </p>
        </div>
      `
    } else if (currentProofContent === CONTENT_CREATE) {
      proofCreateTab = selectedTab
      proofContent = html`
        <div id="proof-create" class="_proof_tab_ w-90 center pa4 bg-near-white">
          <fieldset class="cf bn ma0 pa0">
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
                 onclick=${this.evtProofCreateLink.bind(this)}>Create Proof</a>
            </div>
          </fieldset>
          <div id="proof-preview" class="w-100 center pa0">
            <textarea id="proof-preview-display"
                      class="flex h5 w-80 code lh-copy f7 bg-white br2 w-100"></textarea>
            <div class="lh-copy mt3 ph3">
              <a href="#"
                 title="Copy proof to clipboard"
                 class="link dim"
                 data-clipboard-target="#proof-preview-display"
                 id="proof-copy">
                <img class="h1 pr2" src="./img/copy.svg"/>
              </a>

              <a class="no-underline f6 ph3 pv3 bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--all-ns f5-l"
                 href="https://gist.github.com/"
                 title="Create Proof, then copy to clipboard, then click here to publish"
                 target="_new">Post proof to Gist</a>
              <a class="no-underline f6 ph3 pv3 bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--all-ns f5-l"
                 href="#"
                 onclick=${this.evtProofSave.bind(this)}>Save proof to IPFS</a>
          </div>
        </div>
      `
    }
    return html`
      <article id="proof" class="w-80 _view_ center mw7 mw7-ns br3 ba b--black-10 mv4">
        <div class="mw7 mw7-ns overflow-hidden">
          <div id="proof-tabs" data-current="create-proof"
               class="f6 bb bw1 b--black-10 flex">
            <a class=${proofListTab}
               href="#" id="show-proofs" onclick=${this.evtShowProofs.bind(this)}>Proofs</a>
            <a class=${proofCreateTab}
               href="#" id="create-proof" onclick=${this.evtCreateProof.bind(this)}>Create</a>
            <a class=${proofHelpTab}
               href="#" id="help-proof-tab" onclick=${this.evtProofHelp.bind(this)}>Help</a>
          </div>
          ${proofContent}
        </div>

      </article>
    `
  }
}

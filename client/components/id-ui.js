const html = require('yo-yo')
const avatar = require('../utils/avatar')

function hide (node) {
  node.style = 'display: none;'
}

function show (node, inline=false) {
  let mode = 'block'
  if (inline) {
    mode = 'inline'
  }
  node.style = `display: ${mode};`
}

class IdUI {

  constructor (IpfsID, domId, config={}) {
    const selector = `${ config.prefix || '#' }${ domId }`
    const icon = avatar(IpfsID.peerId)
    this.setState({
      icon,
      IpfsID,
      config,
      selector
    })
  }

  setState (state=null) {
    this.state = state

    this.render()
  }

  evtEditHandle (event) {
    const input = document.querySelector('#handle-edit')
    // edit the handle name
    input.disabled = false;
    input.style = 'border-color: red;'
    input.focus()
    hide(document.querySelector('#handle-edit-btn'))
    show(document.querySelector('#handle-save-btn'), true)
  }

  evtSaveHandle () {
    const { IpfsID } = this.state
    const input = document.querySelector('#handle-edit')
    let updatedData = { handle: input.value }
    window.IpfsID.saveIdData(updatedData)
    input.style = 'border-color: green;'
    input.disabled = true;
    // notification !
    notify.success('Success', 'Handle changed was saved.')
    hide(document.querySelector('#handle-save-btn'))
    show(document.querySelector('#handle-edit-btn'), true)
    // triggger broadcast to peers that idData is updated
    IpfsID.broadcastProfile()
  }

  broadcastId () {
    const { IpfsID } = this.state
    IpfsID.broadcastProfile()
  }

  render () {
    const { icon, config: { handle }, IpfsID , selector } = this.state
    const newElement = html`
      <article id="identity-app" class="_view_ w-80 center mw7 br3 ba b--black-10 mv4">
        <div class="mh4 mt4 w-100 flex">
          <span id="identity-blocky"
                class="flex"
                title="IPFS Peer ID as Blocky Avatar">${icon}</span>
          <span id="identity-peer-id"
               class="flex code f5 mt3"
               onclick=${this.broadcastId.bind(this)}
               title="IPFS Peer ID">
            <div class="mh4">${IpfsID.peerId}</div>
          </span>
          <span id="qr-code" class="flex"
                title="IPFS Peer ID as QR Code"></span>
        </div>
        <div title="Account Handle"
             class="w-100 f3 bg-near-white br3 br--top black-80 mv0 pa4">
          <input disabled
                 class="f6 f5-l input-reset ba b--black-10 fl black-80 bg-white pa3 lh-solid w-100 w-50-m w-60-l br2-ns br--left-ns code"
                 name="handle-edit-input"
                 id="handle-edit"
                 value="${handle}" />
          <span id="edit-save-btns">
            <a href="#"
               id="handle-edit-btn"
               class="no-underline f6 f5-l fl pv3 tc bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--right-ns"
               onclick=${this.evtEditHandle.bind(this)}>
              Edit Handle
            </a>
            <a href="#"
               id="handle-save-btn"
               class="no-underline f6 f5-l fl pv3 tc bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--right-ns"
               style="display: none;"
               onclick=${this.evtSaveHandle.bind(this)}>
              Save Handle
            </a>
          </span>
        </div>
        <div class="w-100 pa3 center">
          <p class="f6 f5-ns lh-copy">
            <div class="w-100 mr3 ml3 f6 code">IPFS RSA Public Key [signing only]</div>
            <textarea disabled
                      class="h5 flex w-80 lh-copy code f7 ma3 bg-white br3 ph3 pv2 mb2 overflow-auto"
                      title="IPFS Public Key [Signing Only]">${IpfsID.pubKeyBase64}</textarea>
          </p>
        </div>
      </article>`
      const existingElement = document.querySelector(selector)
      html.update(existingElement, newElement)
  }
}

module.exports = IdUI

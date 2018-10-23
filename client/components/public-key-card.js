'use strict'

const html = require('yo-yo')
const validUrl = require('valid-url')
const createIcon = require('blockies-npm')

const notify = require('./notify')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL } = require('../../src/utils')

class PublicKeyCard {

  constructor (IpfsID, domId, config={}) {
    // config is like: { peerId: 'mQfoobarbaz'}
    // this.cleanup()
    this.icon = this.avatar(config.profile.peerId)
    console.log(config.profile.peerId)
    this.selector = `${ config.prefix || '#' }${ domId }`
    this.config = config
    this.profile = this.config.profile
    this.IpfsID = IpfsID
    this.doWork()
  }

  avatar (peerId) {
    let icon = createIcon({
      seed: peerId
    })
    let list = 'w3-ns h3-ns'.split(' ');
    list.forEach((klass) => {
      icon.classList.add(klass)
    })

    return icon
  }

  doWork () {
    // Get the contact data or local peer profile
    // Note: need to check validityDocs and separate them into 2 camps:
    //       profile.invalidDocs & profile.validDocs, each bing an array
    // So we need to get all validityDocs and verify them and split them up
    const that = this;
    let profile
    if (this.config.profile.peerId === this.IpfsID.idData.peerId) {
      // self
      profile = this.IpfsID.idData
      this.config.followBtn = {
        disabled: 'disabled',
        label: '(You)'
      }
      // get current validity docs if peer is local user (proofs)
      this.IpfsID.proofsDB.getValidityDocs().then((res) => {
        if (res) {
          that.config.profile.validityDocs = res
        } else {
          that.config.profile.validityDocs = []
        }
        return that.validateProofs(true, that.config.profile.validityDocs)
      }).catch((ex) => {
        console.log(ex)
        return that.validateProofs(true)
      })
    } else {
      this.IpfsID.contactsDB.get(this.config.profile.peerId).
        then((res) => {
          let disabled = undefined
          let label = 'Follow'
          let saveContact = false
          let proofs = that.config.profile.validityDocs || []
          let _validityDocs = []
          if (!res) {
            // NOTE: may not have a peer record
            saveContact = true
          } else {
            if (res.following) {
              label = 'Unfollow'
            }
            if (res.validityDocs) {
              that.config.profile.cachedValidityDocs = res.validityDocs
              _validityDocs = res.validityDocs
            }
          }
          that.config.followBtn = {
            disabled: disabled,
            label: label
          }
          // validateProofs will set state and call render
          that.validateProofs(saveContact, _validityDocs)
        }).catch((ex) => {
          console.error(ex)
          notify.error('Cannot display Public Key Card')
        })
    }
  }

  async validateProofs (validateLocal=false, proofs=null) {
    let that = this
    this.config.profile.invalidDocs = []
    this.config.profile.validDocs = []

    if (proofs) {
      let proofCount = 0
      if (proofs.length) {
        proofs.map((row) => {
          IpfsID.verifyProof(row.doc, (err, valid) => {
            if (valid) {
              that.config.profile.validDocs.push({
                proof: row.doc,
                valid: valid
              })
            } else {
              that.config.profile.invalidDocs.push({
                proof: row.doc,
                valid: valid
              })
            }
            proofCount++
            if (proofCount === proofs.length) {
              return that.setState({
                profile: that.profile,
                config: that.config
              })
            }
          })
        })

        // let promises = proofs.map(IpfsID.verifyProof)
        // Promise.all(promises).
        //   then((results) => {
        //     results.forEach((valid, idx) => {
        //       if (valid) {
        //         that.config.profile.validDocs.push({
        //           proof: proofs[idx].doc,
        //           valid: valid
        //         })
        //       } else {
        //         that.config.profile.invalidDocs.push({
        //           proof: proofs[idx].doc,
        //           valid: valid
        //         })
        //       }
        //     })
        //     return that.setState({
        //       profile: that.profile,
        //       config: that.config
        //     })
        //   }).catch((ex) => {
        //     console.error(ex)
        //     notify.error('Cannot verify all proofs')
        //     that.setState({ profile: that.profile, config: that.config })
        //   })
      }
    } else {
      console.error('Proofs array has a length of 0')
      this.setState({ profile: that.profile, config: that.config })
    }
  }

  // get the state async
  setState (state=null) {
    this.state = state
    this.render()
  }

  currentNode () {
    return document.querySelector(this.selector)
  }

  render () {
    let state = this.state
    // create HTML template with the state and render it
    let profile = state.profile
    let newNode = html`
      <div id="public-key-card" class="w-80">
      <article id="public-key-card-data"
               class="center w-80 shadow-1 bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
         <div><img class="h1" onclick=${this.close} src="./img/close.svg" /></div>
         <div class="tc">
           <div>${this.icon}</div>
           <h1 class="f7 code">
             ${profile.handle || profile.peerId}
           </h1>
           <div class="flex-justify-between">

             <div id="verify-ui" class="flex-justify-between">
               <span id="verify-animation"></span>
               <div id="verify-results" class="flex-justify-around">
                 ${profile.validDocs.map((proof) => {
                   return html`<a target="_blank" href="${proof.proof.url}" class="mr2 pointer"><img class="h1" title="Peer proof is verified: ${proof.proof.url}" src="img/check-circle-green.svg" /></a>`
               })}
                 ${profile.invalidDocs.map((proof) => {
                   return html`<a target="_blank" href="${proof.proof.url}" class="mr2 pointer"><img class="h1" title="Peer proof is un-verified: ${proof.proof.url}" src="img/times-circle.svg" /></a>`
                 })}
               </div>
             </div>
           </div>
           <div id="follow-btn" class="mv2">
             <button ${state.config.followBtn.disabled}
                     class="f6 button-reset bg-white ba b--black-10 dim pointer pv1 black-60"
                     data-peerId="${profile.peerId}"
                     onclick=${this.follow}>
               ${state.config.followBtn.label}
             </button>
           </div>
         </div>
         <div class="mv2 code lh-copy measure center f7 pa2 black-70 h3 overflow-auto ba b--black-20">
           ${profile.bio || 'No bio available'}
         </div>
         <textarea disabled class="flex w-100 code lh-copy measure center f7 pa2 black-70 h4 overflow-auto ba b--black-20">${profile.pubKeyBase64 || 'No shared public key available'}</textarea>
        </article></div>`

    let existingNode = document.querySelector('#public-key-card')
    if (!existingNode) {
      // W T F, seems like yo-yo is changing the dom node id to `undefined`
      existingNode = html`<div id="public-key-card" class="w-80"></div>`
      document.querySelector('body').prepend(existingNode)
    }
    html.update(existingNode, newNode)
  }

  close () {
    let card = document.querySelector('#public-key-card')
    let closedNode = html`<div id="public-key-card" class="w-80"></div>`
    html.update(card, closedNode)
  }

  follow () {
    // add the follow flag and ts to the current peer contact

    // update state so it re-renders
  }

  unfollow () {
    // remove the follow flag and ts from the current peer contact

    // update state so it re-renders :)
  }

  cleanup () {
    let undefinedNodes = document.querySelectorAll('#undefined')
    undefinedNodes.forEach((node) => {
      node.parentNode.removeChild(node) // TODO: is this a yo-yo bug??
    })
  }
}

module.exports = PublicKeyCard

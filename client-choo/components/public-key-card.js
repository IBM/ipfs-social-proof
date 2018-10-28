var html = require('choo/html')
var Component = require('choo/component')
const validUrl = require('valid-url')
const createIcon = require('blockies-npm')

const avatar = require('../../client/utils/avatar')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL } = require('../../src/utils')

const OP_UNFOLLOW = 'Unfollow'
const OP_FOLLOW = 'Follow'

module.exports = class PublicKeyCard extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.emit = emit
  }

  update (newState) {
    this.state = newState
    return true
  }

  close () {
    this.emit('closePublicKeyCard')
  }

  follow (event) {
    const that = this
    if (event.target.dataset.operation) {
      if (event.target.dataset.operation === OP_UNFOLLOW) {
        this.unfollow()
        return
      }
    }
    this.emit('followPeer')
  }

  unfollow () {
    this.emit('unfollowPeer')
  }

  createElement (state) {
    const { IpfsID, publicKeyCard: { profile, validityDocs, invalidDocs } } = state
    const icon = avatar(profile.peerId)
    let followBtn
    if (profile.peerId === IpfsID.identity.profile.peerId) {
      followBtn = { disabled: 'disabled', label: '(You)' }
    } else {
      followBtn = { disabled: '', label: 'Follow' }
    }
    // had to do this because of a really weird bug in the bundler, where it was lower-casing the `followBtn` var to `followbtn`
    const disabled = followBtn.disabled

    return html`
      <div id="public-key-card" class="w-80">
      <article id="public-key-card-data"
               class="center w-80 shadow-1 bg-white br3 pa2 pa4-ns mv1 ba b--black-10">
         <div><img class="h1" onclick=${this.close.bind(this)} src="./img/close.svg" /></div>
         <div class="tc">
           <div>${icon}</div>
           <h1 class="f7 code">
             ${profile.handle || profile.peerId}
           </h1>
           <div class="flex-justify-between">

             <div id="verify-ui" class="flex-justify-between">
               <span id="verify-animation"></span>
               <div id="verify-results" class="flex-justify-around">
                 ${(validityDocs || []).map((proof) => {
                   return html`<a target="_blank" href="${proof.proof.url || '#'}" class="mr2 pointer"><img class="h1" title="Peer proof is verified: ${proof.proof.url || '#'}" src="img/check-circle-green.svg" /></a>`
               })}
                 ${(invalidDocs || []).map((proof) => {
                   return html`<a target="_blank" href="${proof.proof.url || '#'}" class="mr2 pointer"><img class="h1" title="Peer proof is un-verified: ${proof.proof.url || '#'}" src="img/times-circle.svg" /></a>`
                 })}
               </div>
             </div>
           </div>
           <div id="follow-btn" class="mv2">
             <button ${disabled}
                     class="f6 button-reset bg-white ba b--black-10 dim pointer pv1 black-60"
                     data-operation="${followBtn.label}"
                     data-peerId="${profile.peerId}"
                     onclick=${this.follow.bind(this)}>
               ${followBtn.label}
             </button>
           </div>
         </div>
         <div class="mv2 code lh-copy measure center f7 pa2 black-70 h3 overflow-auto ba b--black-20">
           ${profile.bio || 'No bio available'}
         </div>
         <textarea disabled class="flex w-100 code lh-copy measure center f7 pa2 black-70 h4 overflow-auto ba b--black-20">${profile.pubKeyBase64 || 'No shared public key available'}</textarea>
        </article>
      </div>
    `
  }
}

var html = require('choo/html')
var Component = require('choo/component')

const avatar = require('../../client/utils/avatar')

module.exports = class Peers extends Component {
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

  evtExaminePubKey (event) {
    // new PublicKeyCard(IpfsID, 'public-key-card', { profile: profile })
  }

  createElement (state) {
    const { peerProfiles, IpfsID } = state
    return html`
      <article id="listen"
         class="w-80 _view_ center mw7 mw7-ns br3 ba b--black-10 mv4">
         ${peerProfiles.map(profile => {
           const icon = avatar(profile.peerId)
           let name, handle, canFollow = true

           if (!profile.handle) {
             handle = profile.peerId
           } else {
             handle = profile.handle
           }
           if (profile.canFollow) {
             canFollow = profile.canFollow
           }

           name = handle //  temp hack

           if (profile.peerId === profile.clientPeerId) {
             // This is your profile, pull in the pub key, latest proofs etc
             profile = IpfsID.identity.profile
           }
           return html`
             <article id="peer-profile-${profile.peerId}"
                      class="pa3 dt w-100 bb b--black-05 pb2 mt2" href="#0">
               <div id="avatar-${profile.peerId}" class="dtc w2 w3-ns v-mid">
                 ${icon}
               </div>
               <div class="dtc v-mid pl3">
                 <h1 id="profile-name" class="f6 f5-ns fw6 lh-title black mv0">${name} </h1>
                 <h2 id="profile-handle" class="f7 pt1 fw4 mt0 mb0 black-60">${handle}</h2>
                 <h3 class="f7 code pt1 fw4 mt0 mb0 black-60">${profile.peerId}</h3>
               </div>
               <div class="dtc v-mid flex">
                 <div class="tr w-100 pr3">
                   <img title="Examine Public Key"
                        class="pt1 dim pointer h1"
                        src="./img/key-alt.svg"
                        onclick=${this.evtExaminePubKey.bind(this)} />
                 </div>
               </div>
             </article>
           `
         })}
      </article>
    `
  }
}

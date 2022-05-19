const { isNode } = require('../../src/utils')
module.exports = class AudioMachine {
  constructor () {
    // enviornment check, currently node isn't supported
    // TODO: make this work with node
    if (isNode()){
      throw new Error('Can not instantiate AudioMachine in node env. Currently unsupported.')
    }

    this.playlist = {}
  }

  addSound (name, src) {
    const newSound = {}
    const soundElement = document.createElement('audio')

    soundElement.setAttribute('src', src);
    newSound[name] = soundElement

    this.playlist = Object.assign(
      newSound,
      this.playlist
    )
  }

  playSound (name) {
    if (typeof name !== 'string') {
      throw new TypeError('AudioMachine.playSound type of name is not string.')
    }

    if (!this.playlist.hasOwnProperty(name)) {
      throw new ReferenceError(`AudioMachine.playlist does not have sound ${name}`)
    }

    this.playlist[name].play()
  }
}

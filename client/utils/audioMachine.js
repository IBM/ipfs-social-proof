module.exports = class AudioMachine {
  constructor () {
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

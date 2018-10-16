'use strict'

// TODO: have this module return a class or stand-alone object

// Braille patterns from:
// http://symbolcodes.tlt.psu.edu/bylanguage/braillechart.html
const PATTERNS = {
  small: [
    '⠟',
    '⠯',
    '⠷',
    '⠾',
    '⠽',
    '⠻'
  ],
  large: [
    '⡿',
    '⣟',
    '⣯',
    '⣷',
    '⣾',
    '⣽',
    '⣻',
    '⢿'
  ]
}

var frame = 0
var node
var iid

function startAnimation (domId, interval=120, pattern='large') {

  node = document.querySelector(`#${domId}`)

  node.style = 'display:inline;' // assume span

  if (!node) {
    return console.error('startAnimation: Node not found')
  }

  iid = setInterval(() => {
    node.innerText = PATTERNS[pattern][frame]
    if (frame === (PATTERNS[pattern].length - 1)) {
      frame = 0
    } else {
      frame++
    }
  }, interval)
}

function endAnimation () {
  node.style = 'display:none;' // assume span
  clearInterval(iid)
}

const _module = {
  startAnimation: startAnimation,
  endAnimation: endAnimation
}

window._animate = _module

module.exports = _module

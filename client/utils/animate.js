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
    '⢿',
    '⠟',
    '⠯',
    '⠷',
    '⠾',
    '⠽',
    '⠻'
  ]
}

var frame = 0
var node
var iid

function shuffle (array) {
  // Copyright, https://github.com/Daplie/knuth-shuffle - Apache License
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function startAnimation (domId, interval=80, pattern='large') {

  node = document.querySelector(`#${domId}`)

  node.style = 'display:inline;' // assume span

  if (!node) {
    return console.error('startAnimation: Node not found')
  }

  let arr = shuffle(PATTERNS[pattern])

  iid = setInterval(() => {
    node.innerText = arr[frame]
    if (frame === (arr.length - 1)) {
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

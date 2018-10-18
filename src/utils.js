const TextDecoder = require('text-encoding').TextDecoder
const TextEncoder = require('text-encoding').TextEncoder

function t2a (text) {
  return new TextEncoder("utf-8").encode(text)
}

function a2t (arrayBuffer) {
  return new TextDecoder("utf-8").decode(arrayBuffer)
}

module.exports = {
  a2t: a2t,
  t2a: t2a
}

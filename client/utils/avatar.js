const createIcon = require('blockies-npm')

function avatar (peerId) {
  let icon = createIcon({ // All options are optional
    seed: peerId, // seed used to generate icon data, default: random
    // color: '#dfe', // to manually specify the icon color, default: random
    // bgcolor: '#aaa', // choose a different background color, default: white
    // size: 15, // width/height of the icon in blocks, default: 10
    // scale: 3 // width/height of each block in pixels, default: 5
  })
  let list = 'w3-ns h3-ns'.split(' ');
  list.forEach((klass) => {
    icon.classList.add(klass)
  })

  return icon
}

module.exports = avatar

'use strict'

const html = require('yo-yo')

const notify = {
  get notifyNode () {
    return document.querySelector('#notifications')
  },
  display: (uiNode) => {
    notify.notifyNode.appendChild(uiNode)
    window.setTimeout(() => {
      notify.notifyNode.removeChild(uiNode)
    }, 2500)
  },
  modes: {
    success: 'green',
    info: 'blue',
    warn: 'yellow',
    error: 'red'
  },
  notifyUI: (headline, message, mode) => {
    return html`
      <p class="_notification_ f7 w-50 ba br2 pa3 ma2 ${notify.modes[mode]} bg-washed-${notify.modes[mode]}"
         role="alert">
        <strong>${headline}</strong> ${message}
      </p>`
  },
  success: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'success'))
  },
  info: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'info'))
  },
  warn: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'warn'))
  },
  error: (headline, message) => {
    notify.display(notify.notifyUI(headline, message, 'error'))
  }
}

module.exports = notify

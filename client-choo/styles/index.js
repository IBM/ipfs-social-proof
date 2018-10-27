const css = require('sheetify')

const body = css`
  :host {
    /* opacity:0; */
    transition: opacity 4s;
    -webkit-transition: opacity 4s; /* Safari */
  }
`

const td = css`
  :host {
    padding: 0.5em
  }
`

const ipfsUrl = css`
  :host {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const main = css`
  :host {
    margin-top: 4rem;
  }
`

const notifications = css`
  :host {
    position: absolute;
    top: 4rem;
    right: 1rem;
    z-index: 100;
  }
`

const notification = css`
  :host {
    min-width: inherit;
  }
`

const modal = css`
  :host {
    position: absolute;
    top: 4rem;
    right: 3rem;
    z-index: 80;
  }
`

const proofDetail = css`
  :host {
    position: absolute;
    top: 5rem;
    right: 3rem;
    z-index: 70;
  }
`

const publicKeyCard = css`
  :host {
    position: absolute;
    top: 5rem;
    right: 3rem;
    z-index: 80;
  }
`

const confirmationModal = css`
  :host {
    position: absolute;
    top: 6rem;
    right: 7rem;
    z-index: 90;
  }
`

const navLinks = css`
  :host {
    /* opacity:0; */
    transition: opacity 2s;
  }
`

module.exports = {
  body,
  td,
  ipfsUrl,
  main,
  notification,
  notifications,
  modal,
  proofDetail,
  publicKeyCard,
  confirmationModal,
  navLinks
}

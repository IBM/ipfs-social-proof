'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { IpfsIdentity, start } = require('../src/')
let handle = 'Chachito'
let tmpRepoName = `repo-${Math.random()}`

describe("A test suite", function () {
  this.timeout(10000)
  beforeEach(function () {
  });

  afterEach(() => {})

  context('a context', () => {
    it('Test basics', (done) => {
      const eventHandlers = {
        startComplete: (identity) => {
          // run all tests in here or other internal eventHandlers
          console.log('Test suite started ... startComplete()')
          expect(identity).to.exist()
          console.log('idData', identity.idData)
          expect(typeof identity === 'object').to.be.true()


          // kill ipfs node
          identity._node.stop().then(() => {
            setTimeout(done, 1000)
          })
        }
      }
      start(handle, eventHandlers, tmpRepoName).then((res) => {
        res
      })

    }) // it

  }) // context
})

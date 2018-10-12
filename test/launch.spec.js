'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { IpfsIdentity, start } = require('../src/')
let handle = 'Chachito'

describe("A test suite", () => {

  beforeEach(() => {
  });

  afterEach(() => {})

  context('a context', () => {
    it('Test basics', (done) => {

      const eventHandlers = {
        startComplete: (identity) => {
          console.log('startComplete()')
          expect(identity).to.exist()
          console.log('idData', identity.idData)
          expect(typeof identity === 'object').to.be.true()
          done()
        }
      }
      start(handle, eventHandlers).then((res) => {
        res
      })

    }) // it

  }) // context
})

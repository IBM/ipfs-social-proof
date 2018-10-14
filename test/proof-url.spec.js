'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const fixtures = require('./fixtures')

const { IpfsIdentity, start } = require('../src/')
let handle = 'Chachito'
let tmpRepoName = `repo-${Math.random()}`

describe("A test suite", function () {
  this.timeout(10000)
  beforeEach(function () {
  });

  afterEach(() => {})

  context('a context', () => {
    it('test the proof / proof url suite', (done) => {
      const eventHandlers = {
        startComplete: (identity) => {
          // run all tests in here or other internal eventHandlers
          expect(identity).to.exist()
          expect(typeof identity === 'object').to.be.true()

          // save proof
          let proof = fixtures.proof
          let hash = 'QmRc9nyRLjjGHaGmR8UuU63BPmKEazuDDCLhsRoayYQbf8'
          let result = identity.saveProofToDb(hash, proof)
          expect(result).to.exist()
          expect(typeof result === 'object')
          expect(identity.proofData[hash] === proof)


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

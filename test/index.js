const { describe, mocha, it } = require('mocha');
const  { assert } = require('chai');

const { IpfsIdentity, start, checkForAccount } = require('../src/index')

const log = console.log
const err = console.error

function begin (ipfsId) {
  // start testing here
  console.info('Tests starting...............')

//   describe('a suite of tests', function () {
//     this.timeout(5000);
//    it('should take less than 5000ms', function (done) {
  let pubKeyStr = ipfsId.pubKeyBase64
  log(pubKeyStr, 'pubKeyStr')
  log(Boolean(pubKeyStr), 'stringified Pubkey exists')
  let keyObj = JSON.parse(pubKeyStr)
  log(keyObj, 'keyObj')
  log(Array.isArray(keyObj.data), 'keyObj.data is an array')
  log(keyObj.data[0] > -1, 'keyObj.data[0] is > -1')
  let umKey = ipfsId.unmarshalPubKey(pubKeyStr)
  log(umKey, 'umKey')
  assert.exists(umKey, 'umKkey exists')
  let strToSign = "this is a message"
  ipfsId.sign(strToSign, (err, signature) => {
    log(err == null, 'Error is null')
    log(Boolean(signature), 'signature exists')
    log(JSON.stringify(signature), 'dehydrated sig')
    ipfsId.verify(strToSign, signature, (err, valid) => {
      log(err == null, 'no error during verify')
      log(Boolean(valid), 'signature is valid')
      // done();
    })
  })
//    })
//  })

  // mocha.setup('bdd');
  // mocha.checkLeaks();
  // mocha.run();

}

document.addEventListener('DOMContentLoaded', (event) => {
  const eventHandlers = {
    // know when the node is ready
    startComplete: (ipfsId) => {
      // The node is ready start testing!
      begin(ipfsId)
    }
  }

  const repoName = `__repo_${Math.random()}`
  const IpfsID = new IpfsIdentity('MyHandle', repoName, eventHandlers)
})




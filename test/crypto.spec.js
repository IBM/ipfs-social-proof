'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
chai.use(require('chai-string'));

const { Buffer } = require('buffer')
const libp2pCrypto = require('libp2p-crypto')
const { Crypto } = require('../src/crypto')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL, FUNCTION, NUMBER } = require('../src/utils')
const { log, error } = require('../src/log')

const PUB_KEY_OBJ = {
  "type":"Buffer",
  "data":[8,0,18,166,2,48,130,1,34,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,1,15,0,48,130,1,10,2,130,1,1,0,173,244,215,240,15,114,246,213,7,138,123,122,16,252,172,1,130,23,252,15,72,71,193,118,32,154,54,227,77,242,26,237,23,118,163,39,216,51,131,118,47,208,202,237,42,205,115,249,209,32,4,175,160,245,14,71,5,75,14,171,91,229,194,175,238,14,117,191,71,173,42,181,89,82,166,14,140,26,152,101,212,40,223,149,155,171,238,222,156,224,225,124,42,117,237,38,134,215,226,94,181,30,226,149,147,215,161,24,190,69,158,188,180,118,132,74,6,137,137,219,2,232,58,227,253,185,50,221,13,71,63,95,157,206,30,187,52,127,163,214,83,245,59,203,79,90,70,75,146,207,204,42,92,117,85,220,117,162,65,79,40,77,8,113,70,65,232,16,134,72,206,252,115,24,215,203,55,143,35,25,62,205,117,7,166,154,111,166,98,120,231,179,177,154,180,21,104,233,134,27,247,103,85,105,212,120,76,182,230,226,200,21,73,28,99,50,226,136,35,242,86,159,249,54,139,51,166,90,25,16,17,12,114,99,160,217,8,110,184,150,113,187,144,119,7,142,229,166,196,226,229,39,72,234,38,181,2,3,1,0,1]
}
const PUB_KEY_STR = JSON.stringify(PUB_KEY_OBJ.data)
const PUB_KEY_BYTES = Buffer.from(PUB_KEY_OBJ.data);

const MOCK_SIG_STRING = 'THIS IS A MOCK SIGNATURE'
const MOCK_SIG = Buffer.from(MOCK_SIG_STRING)
const mockIpfsNode = {
  // mock the IPFS node to make this test focus only on the API & pem & pki usage
  _peerInfo: {
    id: {
      _pubKey: {
        verify: (array, sig, callback) => {
          callback(null, true)
        }
      },
      _privKey: {
        sign: (plainTextArray, callback) => {
          callback(null, MOCK_SIG)
        },
        public: {
          _key: {
            alg: 'RS256',
            e: 'AQAB',
            ext: true,
            key_ops: ['verify'],
            kty: 'RSA',
            n: 'rfTX8A9y9tUHint6EPysAYIX_A9IR8F2IJo2403yGu0XdqMn2DODdi_Qyu0qzXP50SAEr6D1DkcFSw6rW'
          },
          get bytes() {
            return PUB_KEY_BYTES
          }
        }
      }
    }
  },
  util: {
    crypto: libp2pCrypto
  }
}

describe("crypto test suite", function () {
  this.timeout(3000)
  const crypto = new Crypto(mockIpfsNode)

  beforeEach(() => {});

  afterEach(() => {})

  context('crypto context', () => {

    it('signs data', (done) => {
      expect(crypto).to.exist()
      expect(typeof crypto === OBJECT).to.be.true()

      crypto.sign(MOCK_SIG_STRING, (err, sig) => {
        expect(sig).to.equal(MOCK_SIG)
        done();
      })

    })

    it('verifies data', (done) => {
      crypto.verify(MOCK_SIG, MOCK_SIG_STRING, (err, valid) => {
        expect(valid).to.be.true()
        done()
      })
    })

    it('gets a "deyhdrated" pub key from node', (done) => {
      expect(crypto.pubKeyDehydrated).to.equal(PUB_KEY_STR)
      done()
    })

    it('"deyhdrates" a pub key', (done) => {
      let buffer = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      let dhk = crypto.dehydrate(buffer)
      expect(typeof dhk).to.equal(STRING)
      expect(dhk.length).to.equal(21)
      done()
    })

    it('"reyhdrates" a pub key', (done) => {
      let k = '[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]'
      let rhk = crypto.rehydrate(k)
      expect(typeof rhk).to.equal(OBJECT)
      expect(rhk.length).to.equal(10)
      expect(rhk[1]).to.equal(1)
      done()
    })

    it('gets a pub PEM encoded pub key', (done) => {
      let pem = crypto.pubKeyPem
      expect(typeof pem).to.equal(STRING)
      expect(pem).to.startsWith('-----BEGIN PUBLIC KEY')
      console.log(pem)
      done()
    })

    // need to test && understand conversion of PEM pk back to rsaPublicKey

    it('converts a pub PEM encoded pub key back to rsaPublicKey', (done) => {
      let pem = crypto.pubKeyPem
      let rsa = crypto.convertPemPubKeyToRsa(pem)

      console.log(rsa)

      expect(typeof rsa).to.equal(OBJECT)
      // TODO: ue this key to verify signature
      done()
    })

  }) //context

})

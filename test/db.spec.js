'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { DB } = require('../src/db')
const ProofsDB = require('../src/proofs-db')

const STRING = 'string'
const OBJECT = 'object'
const UNDEFINED = 'undefined'
const INTEGER = 'integer'
const ARRAY = 'array'
const BOOL = 'boolean'

describe("A test suite", function () {
  this.timeout(5000)
  const db = new DB(`test-db-${Math.random()}`, {
    id: 'string'
  }, {
    name: 'string',
    baz: 'string',
    biff: 'object',
    foo: 'string',
    bar: 'string'
  })

  let _id

  beforeEach(() => {});

  afterEach(() => {})

  context('db context', () => {

    it('db create', (done) => {
      expect(db).to.exist()
      expect(typeof db === 'object').to.be.true()

      // create
      db.create({id: '1', name: 'Chachito', foo: 'a', bar: 'b', baz: 'c'}).
        then((doc) => {
          _id = doc._id
          expect(doc.id).to.exist()
          expect(doc.id).to.equal('1')
          db.get('1').then((doc) => {
            expect(doc.name).to.equal('Chachito')
            expect(doc.foo).to.equal('a')
            expect(doc.bar).to.equal('b')
            expect(doc.baz).to.equal('c')
            done()
          })
        }).
        catch((ex) => {
          console.error(ex)
        })
    })

    it('db getOrCreate', (done) => {
      // getOrCreate
      db.getOrCreate({id: '2', name: 'Nacho', foo: 'b', bar: 'c', baz: 'd'}).
        then((doc) => {
          expect(doc.result.name).to.equal('Nacho')
          expect(doc.result.id).to.equal('2')
          expect(doc.result.foo).to.equal('b')
          expect(doc.created).to.equal(true)
          done()
        })
    })

    it('db getById', (done) => {
      db.getById('2').
        then((doc) => {
          expect(doc.name).to.equal('Nacho')
          done()
        }).catch((ex) => {
          console.error(ex)
        })
    })

    it('db getAll', (done) => {
      db.getAll().then((docs) => {
        expect(docs.rows.length).to.equal(2)
        expect(docs.rows[0].doc.name).to.equal('Chachito')
        done()
      }).catch((ex) => {
        console.error(ex)
      })
    })

    // it('db update', (done) => {
    //   let id = `${Math.random()}`
    //   db.create({id: id, name: 'Chachito', foo: 'a', bar: 'b', baz: 'c'}).
    //     then((res) => {
    //       db.get(id).then((doc) => {
    //         db.update({id: '1', _id: doc._id,
    //                    name: 'Chachito', foo: 'a',
    //                    bar: '17', baz: 'c'}).
    //           then((doc) => {
    //             console.log(doc)
    //             db.get(id).then((doc) => {
    //               console.log(doc)
    //               expect(doc.bar).to.equal('17')
    //               expect(doc.name).to.equal('Chachito')
    //               expect(doc.foo).to.equal('a')
    //               expect(doc.baz).to.equal('c')
    //               done()
    //             }).catch((ex) => {
    //               console.error(ex)
    //             })
    //           }).catch((ex) => {
    //             console.error(ex)
    //           })
    //       }).catch((ex) => {
    //         console.error(ex)
    //       })
    //     })
    // })

  }) // context
})

describe("ProofsDB test suite", function () {
  this.timeout(5000)
  const db = new ProofsDB(
      'proofs',
        { id: STRING,
          createdTs: INTEGER,
          updatedTs: INTEGER
        }, {
          proof: OBJECT,
          peerId: STRING,
          url: STRING,
          ipfsHash: STRING,
          ipnsHash: STRING,
          pinned: INTEGER // Date.now()
        })

  beforeEach(() => {});

  afterEach(() => {})

  context('proofs db context', () => {

    it('db create && getByIpfsHash', (done) => {
      expect(db).to.exist()
      expect(typeof db === 'object').to.be.true()

      // create
      let id = `${Math.random()}`
      db.create(
        { id: id,
          createdTs: Date.now(),
          updatedTs: Date.now(),
          peerId: 'mQChachito',
          proof: { handle: 'Escaleto',
                   peerId: 'mqEscaleto' },
          url: 'https://gist.github.com/escaleto/mQfoobarbaz',
          ipfsHash: 'mQgetThatCornOuttaMyFace',
          ipnsHash: null,
          pinned: Date.now()
        }).then((doc) => {
          expect(doc.id).to.exist()
          expect(doc.id).to.equal(id)
          db.get(id).then((doc) => {
            expect(doc.peerId).to.equal('mQChachito')
            expect(doc.proof).to.exist()
            expect(doc.proof.handle).to.equal('Escaleto')

            db.getByIpfsHash(doc.ipfsHash).then((doc) => {
              expect(doc.ipfsHash).to.equal('mQgetThatCornOuttaMyFace')
              expect(doc.url).to.equal('https://gist.github.com/escaleto/mQfoobarbaz')
              done()
            })

          }).catch((ex) => {
            console.error(ex)
          })
        }).catch((ex) => {
          console.error(ex)
        })
    })

    it('db saveProofUrl', (done) => {
      // TODO
      done()
    })

  }) // context
})

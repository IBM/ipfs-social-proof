'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { DB } = require('../src/db')

describe("A test suite", function () {
  this.timeout(3000)
  const db = new DB(`test-db-${Math.random()}`, {
    id: 'string'
  }, {
    name: 'string',
    baz: 'string',
    biff: 'object',
    foo: 'string',
    bar: 'string'
  })

  beforeEach(() => {});

  afterEach(() => {})

  context('db context', () => {

    it('db create', (done) => {
      expect(db).to.exist()
      expect(typeof db === 'object').to.be.true()

      // create
      db.create({id: '1', name: 'Chachito', foo: 'a', bar: 'b', baz: 'c'}).
        then((doc) => {
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

    // Error: {"status":409,"name":"conflict","message":"Document update conflict"}

    // it('db update', (done) => {
    //   db.update({_id: '1', id: '1',
    //              name: 'Chachito', foo: 'a',
    //              bar: '17', baz: 'c'}).
    //     then((doc) => {
    //       console.log(doc)
    //       db.get('1').then((doc) => {
    //         console.log(doc)
    //         expect(doc.bar).to.equal('17')
    //         expect(doc.name).to.equal('Chachito')
    //         expect(doc.foo).to.equal('a')
    //         expect(doc.baz).to.equal('c')
    //         done()
    //       })
    //     })
    // })

  }) // context
})

'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { DB } = require('../src/db')

describe("A test suite", function () {
  this.timeout(10000)
  const db = new DB('test-db', {
    foo: 'string',
    bar: 'string'
  }, {
    baz: 'string',
    biff: 'object'
  })
  beforeEach(function () {

  });

  afterEach(() => {})

  context('db context', () => {

    it('db basics', (done) => {
      expect(db).to.exist()
      expect(typeof db === 'object').to.be.true()

      db.create({id: 1, name: 'Chachito', foo: 'a', bar: 'b', baz: 'c'}).
        then((doc) => {
          expect(doc._id).to.exist()
        })

    }) // it

  }) // context
})

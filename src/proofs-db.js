const DB = require('./db')

class ProofsDB extends DB {

  constructor (dbName=null, requiredFields={}, optionalFields={}) {
    super(dbName, requiredFields, optionalFields)
  }

  async getValidityDocs () {
    return this.db.allDocs({
      include_docs: true,
      attachments: true
    }).then((res) => {
      let docs = []
      res.rows.forEach((row) => {
        docs.push(row.doc)
      })
      return docs
    }).catch((ex) => {
      return null
    })
  }

  async filter (filterObj) {} // TODO

  async getByIpfsHash (ipfsContentHash) {
    let fields = Object.keys(this.requiredFields).
        concat(Object.keys(this.optionalFields))

    try {
      var result = await this.db.find({
        selector: { ipfsContentHash: ipfsContentHash },
        fields: fields
      });
    } catch (err) {
      console.log(err)

      var result = null
    }
    return result.docs[0]
  }

  async saveProofUrl (ipfsHash, url) {

    // get the original proof record first...
    var proof
    try {
      proof = await this.getByIpfsHash(ipfsHash)
    } catch (ex) {
      throw new Error(ex)
    }

    let saved = await this.db.upsert(proof.id, (doc) => {
      doc.url = url
      return doc
    })
    return saved
  }
}

module.exports = ProofsDB

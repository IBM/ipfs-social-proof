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
        docs.push(row)
      })
      return docs
    }).catch((ex) => {
      return null
    })
  }

  async filter (filterObj) {} // TODO

  async getByIpfsHash (ipfsHash) {
    let fields = Object.keys(this.requiredFields).
        concat(Object.keys(this.optionalFields))

    try {
      var result = await this.db.find({
        selector: { ipfsHash: ipfsHash },
        fields: fields
      });
    } catch (err) {
      console.log(err)

      var result = null
    }
    return result.docs[0]
  }

  async saveProofUrl (ipfsHash, url) {

    return this.db.upsert(ipfsHash, (doc) => {
      doc.url = url
      return doc
    }).then((res) => {
      return res
    }).catch((err) => {
      throw new Error(err)
    });
  }
}

module.exports = ProofsDB

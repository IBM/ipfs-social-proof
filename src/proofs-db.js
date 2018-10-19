const { DB } = require('./db')

class ProofsDB extends DB {

  async getValidityDocs (peerId) {
    // get all and filter? TODO: use find() API
    // TODO: query for all proofs with peerId of x
    try {
      var result = await this.db.allDocs({
        include_docs: true,
        attachments: true
      });

      let docs = []

      result.forEach((doc) => {
        if (doc.peerId === peerId) {
          docs.push(doc)
        }
      })

      return docs
    } catch (err) {
      console.log(err);
    }
    return null
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
}

module.exports = ProofsDB

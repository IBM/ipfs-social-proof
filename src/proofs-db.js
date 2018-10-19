const { DB } = require('./db')

class ProofsDB extends DB {

  async getValidityDocs (peerId) {
    // get all and filter?
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
}

module.exports = {
  ProofDBs: ProofsDB
}

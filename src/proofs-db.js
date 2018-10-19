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

  async saveProofUrl (ipfsHash, url) {
    try {
      var proofObj = await this.getByIpfsHash(ipfsHash)
    } catch (ex) {
      console.error(ex)
      throw new Error(ex)
    }
    proofObj.url = url
    try {
      let result = await this.db.update(proofObj)
      return result
    } catch (ex) {
      console.error(ex)
      throw new Error(ex)
    }
  }
}

module.exports = ProofsDB

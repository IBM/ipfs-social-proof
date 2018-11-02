"use strict";
const chai = require("chai");
const dirtyChai = require("dirty-chai");
const expect = chai.expect;
chai.use(dirtyChai);

const Ipfs = require("../src/ipfs");

const nodeMock = {
  files: {
    add: () => {
      return Promise.resolve([
        {
          hash: "sneaky peaches"
        }
      ]);
    }
  }
};
const nodeMockAddError = {
  files: {
    add: () => {
      throw new Error("get rekt");
    }
  }
};
const roomApiMock = {};
const identityMock = {};

describe("ipfs initialization", () => {
  it("should fail without node argument", () => {
    expect(() => {
      new Ipfs();
    }).to.throw("node is required");
  });

  it("should fail without roomApi argument", () => {
    expect(() => {
      new Ipfs(nodeMock);
    }).to.throw("roomAPI is required");
  });

  it("should fail without identity argument", () => {
    expect(() => {
      new Ipfs(nodeMock, roomApiMock);
    }).to.throw("identity is required");
  });

  it("should create a new instance of ipfs", () => {
    const ipfs = new Ipfs(nodeMock, roomApiMock, identityMock);
    expect(ipfs).to.be.an.instanceof(Ipfs);
  });
});

describe("ipfs getters", () => {
  const ipfs = new Ipfs(nodeMock, roomApiMock, identityMock);
  it("should get roomApi", () => {
    expect(ipfs.roomApi).to.equal(roomApiMock);
  });

  it("should get identity", () => {
    expect(ipfs.identity).to.equal(identityMock);
  });
});

describe("ipfs methods", () => {
  const ipfs = new Ipfs(nodeMock, roomApiMock, identityMock);

  it("should store data", async () => {
    try {
      const res = await ipfs.store("peaches");
      expect(res)
        .to.be.an.instanceOf(Array)
        .that.has.same.deep.members([{ hash: "sneaky peaches" }]);
    } catch (err) {
      expect(err).to.not.exist();
    }
  });

  it("should throw if ipfs.store data argument is not string", async () => {
    try {
      let dummy = await ipfs.store(1337);
      expect(dummy).to.not.exist();
    } catch (err) {
      expect(err)
        .to.be.an.instanceOf(TypeError)
        .that.has.property(
          "message",
          "ipfs.store expects data to be instance of String"
        );
    }
  });

  it("should save proof with saveProofToIpfs", async () => {
    try {
      const res = await ipfs.saveProofToIpfs("peaches");
      expect(res)
        .to.be.an.instanceOf(Array)
        .that.has.same.deep.members([{ hash: "sneaky peaches" }]);
    } catch (err) {
      expect(err).to.not.exist();
    }
  });

  it("should throw error if add fails", async () => {
    const ipfsThrow = new Ipfs(nodeMockAddError, roomApiMock, identityMock);
    try {
      let dummy = await ipfsThrow.saveProofToIpfs("peaches");
    } catch (err) {
      expect(err)
        .to.be.an.instanceOf(Error)
        .that.has.property("message", "Error: get rekt");
    }
  });
});

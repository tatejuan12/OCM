const { log } = require("console");
const res = require("express/lib/response");
const { resolve } = require("path");

const mongoClient = require("mongodb").MongoClient;

//async reference https://stackoverflow.com/questions/47370487/node-js-mongodb-driver-async-await-queries
var mongoUri =
  "mongodb+srv://ocw:9T6YNSUEh61zgCB6@ocw-test.jgpcr.mongodb.net/NFT-Devnet?retryWrites=true&w=majority";

var methods = {
  getNft: async function (id) {
    var result;
    const client = await mongoClient
      .connect(mongoUri, {
        useNewUrlParser: true,
      })
      .catch((err) => {
        console.log(err);
      });
    if (!client) return;
    try {
      const db = client.db("NFT-Devnet");

      let collection = db.collection("NFT-Details");

      let query = {
        tokenID: id,
      };

      let res = await collection.findOne(query);

      return res;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      client.close();
    }
  },
  getOwnerNfts: async function (owner) {
    var result;
    const client = await mongoClient
      .connect(mongoUri, {
        useNewUrlParser: true,
      })
      .catch((err) => {
        console.log(err);
      });
    if (!client) return;
    try {
      const db = client.db("NFT-Devnet");

      let collection = db.collection("NFT-Details");

      let query = {
        currentOwner: owner,
      };

      const cursor = await collection.find(query);

      return await cursor.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      client.close();
    }
  },
  getNfts: async function () {
    const client = await mongoClient
      .connect(mongoUri, {
        useNewUrlParser: true,
      })
      .catch((err) => {
        console.log(err);
      });
    if (!client) return;
    try {
      const db = client.db("NFT-Devnet");

      let collection = db.collection("NFT-Details");

      let query = {};

      const cursor = await collection.find(query).limit(10);

      return await cursor.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      client.close();
    }
  },
  addLike: async function (body, wallet) {
    const id = body;
    const userWallet = wallet;
    var res;
    const client = await mongoClient
      .connect(mongoUri, {
        useNewUrlParser: true,
      })
      .catch((err) => {
        console.log(err);
      });
    if (!client) return;
    try {
      const db = client.db("NFT-Devnet");

      let collection = db.collection("NFT-Details");

      const liked = await alreadyLiked(collection, id, userWallet);
      if (!liked) {
        let filter = {
          tokenID: id,
        };
        let query = {
          $push: {
            likes: userWallet,
          },
        };
        const result = await collection.updateOne(filter, query);
        result.modifiedCount > 0 ? (res = true) : (res = false);
      } else res = false;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      client.close();
      return res;
    }
  },
  removeLike: async function (body, wallet) {
    const id = body;
    const userWallet = wallet;
    var res;
    const client = await mongoClient
      .connect(mongoUri, {
        useNewUrlParser: true,
      })
      .catch((err) => {
        console.log(err);
      });
    if (!client) return;
    try {
      const db = client.db("NFT-Devnet");

      let collection = db.collection("NFT-Details");

      const liked = await alreadyLiked(collection, id, userWallet);
      if (liked) {
        let filter = {
          tokenID: id,
        };
        let query = {
          $pull: {
            likes: userWallet,
          },
        };
        const result = await collection.updateOne(filter, query);
        result.modifiedCount > 0 ? (res = true) : (res = false);
      } else res = false;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      client.close();
      return res;
    }
  },
};

async function alreadyLiked(collection, id, wallet) {
  var checker = false;
  let filter = {
    tokenID: id,
  };
  const result = await collection.findOne(filter);
  result.likes.forEach((likes) => {
    if (likes == wallet) {
      checker = true;
    }
  });
  return checker;
}

exports.query = methods;

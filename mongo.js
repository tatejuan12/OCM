const mongoClient = require("mongodb").MongoClient;
console.log("nice!");

//async reference https://stackoverflow.com/questions/47370487/node-js-mongodb-driver-async-await-queries
var mongoUri =
  "mongodb+srv://ocw:9T6YNSUEh61zgCB6@ocw-test.jgpcr.mongodb.net/NFT-Devnet?retryWrites=true&w=majority";

var methods = {
  getNFT: async function (id) {
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
      console.log(err);
    } finally {
      client.close();
    }
  },
};

exports.query = methods;

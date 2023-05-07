const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const options = { useNewUrlParser: true, useUnifiedTopology: true };

let client;
let clientPromise;

// if (process.env.EXPRESS_ENV === 'development') {
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri, options);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   client = new MongoClient(uri, options);
//   clientPromise = client.connect();
// }

// exports.getDb = async (dbName) => {
//   const client = await clientPromise;
//   return client.db(dbName);
// };

MongoClient.connect(uri, options, function (err, db) {
  assert.equal(null, err);
  mongobd=db;
})
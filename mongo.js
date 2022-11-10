const { watchFile } = require("fs");
const { MongoDBNamespace, GridFSBucketReadStream } = require("mongodb");
const { resolve } = require("path");
const { resourceLimits } = require("worker_threads");
const { XummSdk } = require("xumm-sdk");

const mongoClient = require("mongodb").MongoClient;

var methods = {
  signinHandler: async function (id) {
    const exists = userExistsChecker(id);
    if (!exists) {
    }
  },
  updateMailingList: async function (wallet, email) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Accounts");

      let collection = db.collection("Mailing-List");

      let query = {
        wallet: wallet,
        email: email,
      };

      let res = await collection.insertOne(query);

      return res.modifiedCount > 0 ? true : false;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  updateUser: async function (wallet, project, email, bio, website) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Accounts");

      let collection = db.collection("Elegible-Accounts");

      let filter = {
        wallet: wallet,
      };
      let query = { $set: {} };
      if (project) query.$set["project"] = project;
      if (email) query.$set["email"] = email;
      if (bio) query.$set["bio"] = bio;
      if (website) query.$set["website"] = website;

      let res = await collection.updateOne(filter, query);

      return res.modifiedCount > 0 ? true : false;
      //   return res > 0 ? true : false;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  createCollection: async function (displayName, family, name, brand, url, issuer, description) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Additional-Traits");

      let collection = db.collection("Collections");
      var issuerArray = issuer.split(",");

      let query = {};
      if (displayName) query.displayName = displayName;
      if (family) query.family = family;
      if (name) query.name = name;
      if (brand) query.brand = brand;
      if (url) query.url = url;
      if (issuer) query.issuer = issuerArray;
      if (description) query.description = description;

      let res = await collection.insertOne(query);

      return res.modifiedCount > 0 ? true : false;
      //   return res > 0 ? true : false;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  initiateUser: async function (wallet) {
    var checker = false;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Accounts");

      let collection = db.collection("Elegible-Accounts");
      const exists = await userExistsChecker(wallet);
      if (!exists) {
        let query = {
          wallet: wallet,
        };

        let res = await collection.insertOne(query);

        return;
      }
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  logRecentSale: async function (details) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Recently-Sold");
      let query = {
        details: details,
      };

      let res = await collection.insertOne(query);
      return res;
    } catch (err) {
    } finally {
      await client.close();
    }
  },
  getUser: async function (wallet) {
    var result;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Accounts");

      let collection = db.collection("Elegible-Accounts");

      let query = {
        wallet: wallet,
      };

      let res = await collection.findOne(query);

      return res;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  checkQueue: async function (id) {
    var result;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Queued-Listings");
      let query = {
        NFTokenID: id,
      };
      let res = await collection.findOne(query);
      return res;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  checkBulkQueue: async function (id, client) {
    var result;
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Queued-Listings");
      let query = {
        NFTokenID: id,
      };
      let res = await collection.findOne(query);
      return res;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      //await client.close();
    }
  },
  getNft: async function (id) {
    var result;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");

      let collection = db.collection("Eligible-Listings");

      let query = {
        tokenID: id,
      };

      let res = await collection.findOne(query);

      return res;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getBulkNft: async function (id, client) {
    var result;
    if (!client) return;
    try {
      const db = client.db("NFTokens");

      let collection = db.collection("Eligible-Listings");

      let query = {
        tokenID: id,
      };

      let res = await collection.findOne(query);

      return res;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      //await client.close();
    }
  },
  getOwnerNfts: async function (owner, nfts, numberOfNfts) {
    if (nfts) {
      var tokenIds = [];
      nfts.forEach((nft) => {
        tokenIds.push(nft.NFTokenID);
      });
      var result;
      const client = await getClient();
      if (!client) return;
      try {
        const db = client.db("NFTokens");

        let collection = db.collection("Eligible-Listings");

        let query = {
          $or: [{ tokenID: { $in: tokenIds } }],
        };
        const cursor = collection.find(query).limit(numberOfNfts);
        return await cursor.toArray();
      } catch (err) {
        console.log("Database error" + err);
      } finally {
        await client.close();
      }
    } else return [];
  },
  matchXrplNftsWithMongoDB: async function (owner, nfts) {
    if (nfts) {
      var tokenIds = [];
      nfts[0].forEach((nft) => {
        tokenIds.push(nft.NFTokenID);
      });
      var result;
      const client = await getClient();
      if (!client) return;
      try {
        const db = client.db("NFTokens");

        let collection = db.collection("Eligible-Listings");

        let query = {
          $or: [{ tokenID: { $in: tokenIds } }],
        };
        const cursor = await collection.find(query);
        return await cursor.toArray();
      } catch (err) {
        console.log("Database error" + err);
      } finally {
        await client.close();
      }
    } else return [];
  },
  relatedNfts: async function (issuer, nftsToReturn, nftID) {
    const client = await getClient();
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      var query = [
        {
          $match: { $and: [{ issuer: issuer }, { tokenID: { $ne: nftID } }] },
        },
        { $sample: { size: nftsToReturn } },
      ];
      var aggregate = await collection.aggregate(query).toArray();

      if (aggregate.length < nftsToReturn) {
        var missingNFTs = nftsToReturn - aggregate.length;

        var query = [
          {
            $match: { tokenID: { $ne: nftID } },
          },
          { $sample: { size: missingNFTs } },
        ];

        var aggregate = aggregate.concat(
          await collection.aggregate(query).toArray()
        );
      }

      return aggregate;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getNfts: async function (NFTSPERPAGE, page, filters) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      var aggregateQuery = [{ $addFields: {} }, { $sort: { views: -1 } }];
      if (filters) {
        if (filters.sortLikes) {
          aggregateQuery[0].$addFields.likesLength = { $size: "$likes" };
          aggregateQuery.push({
            $sort: { likesLength: parseInt(filters.sortLikes) },
          });
        }
        if (filters.sortPrice) {
          aggregateQuery.push({
            $sort: { "sellOffers.xrpValue": parseInt(filters.sortPrice) },
          });
        }
        if (filters.filterExtras == "Verified") {
          aggregateQuery.push({
            $match: { "verified.status": true },
          });
        } else if (filters.filterExtras == "Staykable") {
          aggregateQuery.push({
            $match: { "stakable.status": true },
          });
        }
        if (filters.filterBrands) {
          aggregateQuery.push({
            $match: { issuer: { $in: filters.filterBrands.split(",") } }, //look for issuer of collection
          });
        }
        if (filters.filterFamilies) {
          aggregateQuery.push({
            $match: { "uriMetadata.collection.family": filters.filterFamilies },
          });
        }
        if (filters.filterCollections) {
          console.log(filters.filterCollections);
          aggregateQuery.push({
            $match: {
              "uriMetadata.collection.name": filters.filterCollections,
            },
          });
        }
        if (filters.filterPriceMin || filters.priceMax) {
          aggregateQuery[0].$addFields.recentSell = {
            $first: "$sellOffers.xrpValue",
          };
          aggregateQuery.push({
            $match: {
              recentSell: {
                $lte: parseInt(filters.filterPriceMax),
                $gte: parseInt(filters.filterPriceMin),
              },
            },
          });
        }
        const aggregate = collection
          .aggregate(aggregateQuery)
          .skip(NFTSPERPAGE * page)
          .limit(NFTSPERPAGE);
        return await aggregate.toArray();
      } else {
        const aggregate = collection
          .find()
          .skip(NFTSPERPAGE * page)
          .limit(NFTSPERPAGE);
        return await aggregate.toArray();
      }

      // const cursor = await collection
      //   .find(query)
      //   .skip(NFTSPERPAGE * page)
      //   .sort(sort)
      //   .limit(NFTSPERPAGE);
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getNftsCollection: async function (collectionName, issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Additional-Traits");
      let collection = db.collection("Collections");
      var issuerArray = issuer.split(",");
      console.log(collectionName);
      var query = {
        name: collectionName,
        issuer: { $in: issuerArray },
      };
      const results = collection.findOne(query);
      return await results;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  verifiedChecker: async function (wallet) {
    const client = await getClient();
    if (!client) return;
    try{
      const db = client.db('Additional-Traits')
      let collection = db.collection('Verified-Issuers');
      var query = {
        issuingAccounts: {$eq: wallet}
      }
      const res = await collection.find(query).toArray()
      var found = false;
      if (res.length == 1){
        found = true
      }
      return found;
    }catch (err) {

    } finally {
      await client.close()
    }
  },
  getUnlistedCollectionNfts: async function (
    collectionName,
    issuer,
    NFTSPERPAGE,
    page
  ) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Expired-Listings");
      var issuerArray = issuer.split(",");
      var returnedName = collectionName.split(",");
      var query = [
        {
          $match: {
            $or: [
              { "uriMetadata.collection.name": new RegExp(returnedName, "i") },
              { "uriMetadata.collection.name": null },
            ],
            issuer: { $in: issuerArray },
          },
        },
        {
          $sort: { "uriMetadata.name": 1 },
        },
      ];
      const aggregate = collection
        .aggregate(query, {
          collation: { locale: "en_US", numericOrdering: true },
        })
        .skip(NFTSPERPAGE * page)
        .limit(NFTSPERPAGE);
      return await aggregate.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getNftsByCollection: async function (
    collectionName,
    issuer,
    NFTSPERPAGE,
    page
  ) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      var returnedName = collectionName.replace(/_/g, " ");
      var issuerArray = issuer.split(",");
      var query = [
        {
          $match: {
            $or: [
              { "uriMetadata.collection.name": new RegExp(returnedName, "i") },
              { "uriMetadata.collection.name": null },
            ],
            issuer: { $in: issuerArray },
          },
        },
        {
          $sort: { "uriMetadata.name": 1 },
        },
      ];
      const aggregate = collection
        .aggregate(query, {
          collation: { locale: "en_US", numericOrdering: true },
        })
        .skip(NFTSPERPAGE * page)
        .limit(NFTSPERPAGE);
      return await aggregate.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getAccountLikedNfts: async function (wallet) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      const query = { likes: new RegExp(`.*${wallet}.*`, "i") };
      const result = await collection.find(query);
      return await result.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  incrementView: async function (nftId) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      await collection.updateOne(
        {
          tokenID: nftId,
        },
        {
          $inc: {
            views: 1,
          },
        }
      );
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  incrementViewCollection: async function (collectionName) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Additional-Traits");
      let collection = db.collection("Collections");
      await collection.updateOne(
        {
          name: collectionName,
        },
        {
          $inc: {
            views: 1,
          },
        }
      );
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  addLike: async function (body, wallet) {
    const id = body;
    const userWallet = wallet;
    var res;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");

      let collection = db.collection("Eligible-Listings");

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
      await client.close();
      return res;
    }
  },
  removeLike: async function (body, wallet) {
    const id = body;
    const userWallet = wallet;
    var res;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");

      let collection = db.collection("Eligible-Listings");

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
      console.error("Database error" + err);
    } finally {
      await client.close();
      return res;
    }
  },
  totalCollectionItems: async function (collectionName, issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      var returnedName = collectionName.replace("_", " ");
      let query = {
        $or: [
          { "uriMetadata.collection.name": new RegExp(returnedName, "i") },
          { "uriMetadata.collection.name": null },
        ],
        issuer: { $in: issuer },
      };
      const result = await collection.count(query);
      return result;
    } catch (err) {
      console.error("Database error " + err);
    } finally {
      await client.close();
    }
  },
  unlistedCollectionItems: async function (collectionName, issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Expired-Listings");
      var returnedName = collectionName.replace("_", " ");
      let query = {
        $or: [
          { "uriMetadata.collection.name": new RegExp(returnedName, "i") },
          { "uriMetadata.collection.name": null },
        ],
        issuer: { $in: issuer },
      };
      const result = await collection.count(query);
      return result;
    } catch (err) {
      console.error("Database error " + err);
    } finally {
      await client.close();
    }
  },
  reportNft: async function (id, message, login, wallet) {
    var res = false;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");

      let collection = db.collection("Eligible-Listings");

      if (login) {
        let queryAlreadyReported = {
          $and: [
            { "reports.wallet": wallet },
            {
              tokenID: id,
            },
          ],
        };
        const alreadyReported = await collection.count(queryAlreadyReported);
        if (alreadyReported == 0) {
          let filterTwo = {
            tokenID: id,
          };
          let queryTwo = {
            $push: {
              reports: { wallet: wallet, message: message },
            },
          };
          const result = await collection.updateOne(filterTwo, queryTwo);
          result.modifiedCount > 0 ? (res = true) : (res = false);
        } else res = false;
      } else res = false;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();

      return res;
    }
  },
  getSearchResultsJSON: async function (searchQuery) {
    var res = {
      nfts: {},
      users: {},
      collections: {},
    };
    const client = await getClient();
    if (!client) return;
    try {
      const dbNfts = client.db("NFTokens");
      const dbAccounts = client.db("Accounts");
      const dbCollections = client.db("Additional-Traits");

      let nftDetailsCol = dbNfts.collection("Eligible-Listings");
      let usersCol = dbAccounts.collection("Elegible-Accounts");
      let verifiedCol = dbCollections.collection("Collections");
      let queryNftDetails = [
        {
          $search: {
            index: "NFT_Search",
            text: {
              query: searchQuery,
              path: {
                wildcard: "*",
              },
            },
          },
        },
      ];
      let queryUsers = [
        {
          $search: {
            index: "Account_Search",
            text: {
              query: searchQuery,
              path: {
                wildcard: "*",
              },
            },
          },
        },
      ];
      let queryVerifiedCol = [
        {
          $search: {
            index: "Collections_Search",
            text: {
              query: searchQuery,
              path: {
                wildcard: "*",
              }
            },
          },
        },
      ];
      promiseNfts = new Promise(function (resolve, reject) {
        const nftCursor = nftDetailsCol.aggregate(queryNftDetails).limit(10);
        const result = nftCursor.toArray();
        resolve(result);
      });
      promiseUsers = new Promise(function (resolve, reject) {
        const userCursor = usersCol.aggregate(queryUsers).limit(10);
        const result = userCursor.toArray();
        resolve(result);
      });
      promiseVerified = new Promise(function (resolve, reject) {
        const verifiedCursor = verifiedCol.aggregate(queryVerifiedCol).limit(10);
        const result = verifiedCursor.toArray();
        resolve(result);
      });

      const promise = await Promise.all([
        promiseNfts,
        promiseUsers,
        promiseVerified,
      ]);
      res.nfts = promise[0];
      res.users = promise[1];
      res.collections = promise[2];
      return res;
    } catch (err) {
      console.log("Database error: " + err);
    } finally {
      await client.close();

      return res;
    }
  },
  getCollections: async function (limit) {
    var result;
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Additional-Traits");

      let collection = db.collection("Collections");

      let res = collection.find().limit(limit);
      const array = await res.toArray();

      return array;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getCollectionImageTaste: async function (issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      let query = {
        issuer: issuer,
      };
      let res = await collection.find(query).limit(3).toArray();
      return res;
    } catch (err) {
      console.log("Database error: " + err);
    } finally {
      await client.close();
    }
  },
  addNftToQueried: async function (
    NFTokenID,
    wallet,
    permanent,
    issuer,
    sessionWallet
  ) {
    var checker = false;
    const client = await getClient();
    var payholder = sessionWallet;
    if (!client) return;
    try {
      const db = client.db("NFTokens");

      let collection = db.collection("Queued-Listings");
      const exists = await listQueryExistsChecker(NFTokenID);
      if (!exists) {
        let query = {
          NFTokenID: NFTokenID,
          knownHolder: wallet,
          dateAdded: new Date(),
          issuer: issuer,
          duration: {
            permanent: permanent,
            paidHolder: payholder,
          },
        };

        let res = await collection.insertOne(query);

        return;
      }
    } catch (err) {
      console.log("Database error: " + err);
    } finally {
      await client.close();
    }
  },
  bulkNFTList: async function (nftArray, wallet, permanent) {
    var checker = false;
    const client = await getClient();
    var payholder = wallet;
    if (!client) return;
    try {
      var bulkArray = [];
      for (a in nftArray) {
        var data = {
          updateOne: {
            filter: {
              NFTokenID: nftArray[a].NFTokenID,
            },
            update: {
              $setOnInsert: {
                NFTokenID: nftArray[a].NFTokenID,
                knownHolder: wallet,
                dateAdded: new Date(),
                issuer: nftArray[a].Issuer,
                duration: {
                  permanent: permanent,
                  paidHolder: payholder,
                },
              },
            },
            upsert: true,
          },
        };
        bulkArray.push(data);
      }

      const db = client.db("NFTokens");

      let collection = db.collection("Queued-Listings");

      let res = await collection.bulkWrite(bulkArray, { ordered: false });
      return "success";
    } catch (err) {
      console.log("Database error: " + err);
    } finally {
      await client.close();
    }
  },
  getVerifiedIssuers: async function () {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Additional-Traits");

      let collection = db.collection("Verified-Issuers");

      let query = {};

      const cursor = collection.find();

      return await cursor.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  redeemAssets: async function () {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Redeem");
      let collection = db.collection("Assets");
      const res = collection.find();
      return await res.toArray();
    } catch (err) {
    } finally {
      await client.close();
    }
  },
  getMostViewed: async function () {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      let sort = {
        views: -1,
      };
      const res = collection.find().sort(sort).limit(10);
      return await res.toArray();
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getCollectionFloorPrice: async function (collectionName, issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      var returnedName = collectionName.replace("_", " ");
      let query01 = {
        "sellOffers.0.xrpValue": {
          $gt: 0,
        },
        $or: [
          { "uriMetadata.collection.name": new RegExp(returnedName, "i") },
          { "uriMetadata.collection.name": null },
        ],
        issuer: { $in: issuer },
      };
      let query02 = {
        projection: {
          _id: 0,
          sellOffers: 1,
        },
      };
      let sort = {
        "sellOffers.0.xrpValue": 1,
      };
      const result = (
        await collection.find(query01, query02).sort(sort).limit(1).toArray()
      )[0].sellOffers[0].xrpValue;
      return result;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  getRandomCollectionImages: async function (collectionName, issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      var returnedName = collectionName.replace(/_/g, " ");
      var query = [
        {
          $match: { issuer: { $in: issuer } },
        },
        {
          $match: {
            $or: [
              { "uriMetadata.collection.name": new RegExp(returnedName, "i") },
              { "uriMetadata.collection.name": null },
            ],
          },
        },
        { $sample: { size: 3 } },
        { $project: { pinkynail: 1 } },
        { $unset: "_id" },
      ];
      const aggregate = await collection.aggregate(query).toArray();
      return aggregate;
    } catch (err) {
      console.log("Database error" + err);
    } finally {
      await client.close();
    }
  },
  filterOptions: async function () {
    var client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");

      var searchOptions = await collection
        .aggregate([
          {
            $match: {
              "verified.status": true,
            },
          },
          {
            $group: {
              _id: "$verified.projectName",
              familyFilters: {
                $addToSet: "$uriMetadata.collection.family",
              },
              issuers: {
                $addToSet: "$issuer",
              },
              nameFilters: {
                $addToSet: "$uriMetadata.collection.name",
              },
            },
          },
        ])
        .toArray();

      return searchOptions;
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.close();
    }
  },
  listingStats: async function () {
    var client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");

      var output = await collection
        .aggregate([
          {
            $group: {
              _id: {},
              listed: {
                $sum: 1,
              },
              issuers: { $addToSet: "$issuer" },
              holders: { $addToSet: "$currentOwner" },
              listings: {
                $addToSet: {
                  $cond: {
                    if: { $gt: ["$listingDate", Date.now() - 86400000] },
                    then: "$listingDate",
                    else: null,
                  },
                },
              },
            },
          },
          {
            $project: {
              listed: 1,
              uniqueIssuers: { $size: "$issuers" },
              uniqueHolders: { $size: "$holders" },
              listings24hrs: { $size: "$listings" },
            },
          },
          {
            $unset: ["_id"],
          },
        ])
        .toArray();

      return output[0];
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.close();
    }
  },
  verified: async function (wallet) {
    var client = await getClient();
    if (!client) return;
    try {
      const db = client.db("Additional-Traits");
      let collection = db.collection("Verified-Issuers");
      let query = {
        issuingAccounts: wallet,
      };
      const aggregate = await collection.find(query).limit(1).toArray();
      const res = aggregate.length > 0;
      return res;
    } catch (error) {
      console.log(error);
    } finally {
      await client.close();
    }
  },
  connectToMongo: async function () {
    var client = await mongoClient
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
      })
      .catch((err) => {
        console.log(err);
      });
    return client;
  },
  recentlyRedeemed: async function (NFTokenID, wallet, permanent, issuer, sessionWallet) {
    var client = await getClient()
    if (!client) return;
    var payholder = sessionWallet;
    try{
      const db = client.db("NFTokens")
      let collection = db.collection("Queued-Listings")
      const exists = await listQueryExistsChecker(NFTokenID);
      if (!exists) {
        let query = {
          NFTokenID: NFTokenID,
          knownHolder: wallet,
          dateAdded: new Date(),
          issuer: issuer,
          duration: {
            permanent: permanent,
            paidHolder: payholder,
          },
        };
        let res = await collection.insertOne(query);
        return;
      }
    } catch (error) {
      console.log(error)
    } finally {
      await client.close()
    }
  },
  queuedItemsCount: async function (address) {
    const client = await getClient()
    if (!client) return;
    try {
      const db = client.db('NFTokens');
      let collection = db.collection('Queued-Listings');
      let query = {
        knownHolder: address,
      };
      let res = await collection.count(query);
      return res;
    } catch (err) {
      console.log('queuedItemsCount: '+err)
    } finally {
      await client.close()
    }
  },
  findRedemptionAccountByToken: async function (token) {
    const client = await getClient();
    if (!client) return;
    try{
      const db = client.db('Redeem')
      let collection = db.collection('Assets')
      query = {
        token: token
      }
      let res = await collection.find(query).toArray()
      return res;
    } catch(err){
      console.log('findRedemptionAccountByIP: '+err)
    }finally{
      await client.close()
    }
  }
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
async function getClient() {
  var client = await mongoClient
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
    })
    .catch((err) => {
      console.log(err);
    });
  return client;
}
async function userExistsChecker(wallet) {
  var checker = false;
  const client = await getClient();
  if (!client) return;
  try {
    const db = client.db("Accounts");

    let collection = db.collection("Elegible-Accounts");
    //Make a check later on for inelegible-accounts
    let query = {
      wallet: wallet,
    };

    let res = await collection.count(query);

    return res > 0 ? true : false;
  } catch (err) {
    console.log("Database error" + err);
  } finally {
    await client.close();
  }
}
async function listQueryExistsChecker(NFTokenID) {
  var checker = false;
  const client = await getClient();
  if (!client) return;
  try {
    const db = client.db("NFTokens");

    let collection = db.collection("Queued-Listings");

    let query = {
      NFTokenID: NFTokenID,
    };

    let res = await collection.count(query);

    return res > 0 ? true : false;
  } catch (err) {
    console.log("Database error" + err);
  } finally {
    await client.close();
  }
}
exports.query = methods;

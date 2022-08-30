getCollectionFloorPrice: async function (collectionName, issuer) {
    const client = await getClient();
    if (!client) return;
    try {
      const db = client.db("NFTokens");
      let collection = db.collection("Eligible-Listings");
      let query = {
        $match: { "uriMetadata.collection.name": collectionName },
        $match: { issuer: issuer },
        $min: {"buyOffers[0].xrpValue": 0},
      }
      let sort = {
        "buyOffers[0].xrpValue": 1
      }
      const res = await collection.find(query).sort(sort)
      console.log(res)
      return await res.toArray();

    } catch (err) {
      console.log("Database error" + err);
    }
  },
getCollectionFloorPrice: async function (collectionName, issuer) {
  const client = await getClient();
  if (!client) return;
  try{
    const db = client.db("NFTokens");
    let collection = db.collection("Eligible-Listings");
    let query01 = {
      "sellHistory.0.xrpValue": {
        $gt: 0
    },
    "uriMetadata.collection.name": collectionName
    }
    let query02 = {
      projection: {
        _id: 0,
        "sellHistory": 1
      }
    }
    let sort = {
      "sellHistory.0.xrpValue": 1
    }
    const result = (await collection.find(query01,query02).sort(sort).limit(1).toArray())[0].sellHistory[0].xrpValue
    return result;
  } catch (err) {
    console.log("Database error" + err);
  }
},
  var result = (await mongoClientOCW.db(mongoDB.OCWMarketPlace.NFTs.db).collection(mongoDB.OCWMarketPlace.NFTs.colListed).find({
    "sellHistory.0.xrpValue": {
        $gt: 0
    },
    "uriMetadata.collection.name": collectionName
}, {
    projection: {
        _id: 0,
        "sellHistory": 1
    }
}).sort({
    "sellHistory.0.xrpValue": 1
}).limit(1).toArray())[0].sellHistory[0].xrpValue


  //IIP Blocking
  
  if (
    req.path != "/node" &&
    !authorizedIps.includes(req.header("x-forwarded-for"))
  ) {
    defaultLocals(req, res);
    next();
    // res.status(404).render("views/404.ejs");
  } else next();
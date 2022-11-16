//* Main serverlication, run this to run the serverlication
//! ---------------------Imports modules/packages--------------------------------//
require("dotenv").config();
const express = require("express");
const compression = require("compression");
const https = require("https");
const proxiedHttps = require("proxywrap").proxy(https);
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");
const logger = require("express-logger");
const { TxData } = require("xrpl-txdata");
const useragent = require("express-useragent");
const verifySignature = new TxData();
const cors = require("cors");
const digitalOcean = require("./digitalOceanFunctions");
//Imports the mongo queries and code
const mongoClient = require("./mongo");
//Imports xumm code with queries and checks
const xumm = require("./xummFunctions");
const { log, error } = require("console");
const multer = require("multer");
const upload = multer({ limits: { fieldSize: "16mb" } }); //used to get multipart-formdata doesn't get. used for user data changing!
const csurf = require("csurf");
const helmet = require("helmet");
const minifyHtml = require("express-minify-html");
const slowDown = require("express-slow-down");
const { send } = require("express/lib/response");
const { rejects } = require("assert");
const { resourceLimits } = require("worker_threads");
const mongoStore = new MongoDBStore({
  uri: process.env.MONGO_URI,
  databaseName: "Sessions",
  collection: "Sessions",
});
const speedLimiter = slowDown({
  windowMs: 10 * 60 * 1000, // 10 minutes
  delayAfter: 100,
  delayMs: 500,
});
const NFTSPERPAGE = 25;
//! ---------------------Imported middleware--------------------------------//
const server = express();

server.use(compression());
server.use(bodyParser.json({ limit: "10mb" })); // for parsing serverlication/json
server.use(
  bodyParser.urlencoded({
    extended: true,
    parameterLimit: 100000,
    limit: "10mb",
  })
); // for parsing serverlication/x-www-form-urlencoded
server.set("view engine", "ejs"); // Setting rendering agent to ejs
server.use(helmet({ contentSecurityPolicy: false }));
server.set("views", path.join(__dirname, "/public")); // Makes views for rendering the public dir
server.use(express.static(__dirname + "/public", { dotfiles: "allow" })); // Essential so JS and CSS is acccessible by requests
//server.use(logger({ path: __dirname + "/logs/logs.log" })); // Logs data, every connection will log browser info and request url
server.use(cookieParser());
server.use(
  session({
    secret: process.env.COOKIES_PASSPHRASE,
    resave: false,
    saveUninitialized: false,
    //! change to secure true once hosting
    store: mongoStore,
  })
);
const csrfProtection = csurf({ cookie: { secure: true } });
server.use(useragent.express()); // For browser data, like if it is mobile or not
server.use(
  minifyHtml({
    override: true,
    exception_url: false,
    htmlMinifier: {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
    },
  })
);
server.use(cors("*"));
server.use(csrfProtection);
const blacklist = ["rpbqNk6VuqNygatSCkxEkxRA7FHAhLpZR3"];
const authorizedIps = [];
const authorizedAccounts = [
  "rGNw4iFGRNyRnyMmWVw1jjGbk91jgL33DR",
  "rNsbajT8qaLJ5WiPHR92uATzybkcSSA3h4",
  "rGLwwwwwwqzCrqS7YxgsvgcpqdjvQBo86C",
];
//! ---------------------Custom middleware--------------------------------//
server.use((req, res, next) => {
  checkViews(req, next); // Increments session.views by one every time user interacts with website
});
server.get("*", speedLimiter, (req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://onchainmarketplace.net"
  );
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://www.onchainmarketplace.net"
  );
  res.setHeader("Cross-Origin-Embedder-Policy", "same-origin");
  if (
    req.path != "/node" &&
    !authorizedIps.includes(req.header("x-forwarded-for"))
  ) {
    defaultLocals(req, res);
    next();
    // res.status(404).render("views/404.ejs");
  } else next();
});
//! ---------------------Browser endpoints--------------------------------//
// if (blacklist.includes(req.session.wallet)){
//   server.get("/kick", speedLimiter, async (req,res) => {
//     defaultLocals(req,res);
//     res.render("views/kick")
//   })
// } else {
server.get("/", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  const mostViewedNFTs = await mongoClient.query.getMostViewed();
  res.render("views/", {
    mostViewedNFTs: mostViewedNFTs,
  });
});
server.get("/profile", speedLimiter, async (req, res) => {
  var wallet;
  const page = parseInt(req.query.page);
  const parametersToSet = [];
  if (req.query.wallet) {
    parametersToSet.push({ key: "wallet", value: req.query.wallet });
  }
  if (!isNaN(page)) {
    if (req.query.wallet) {
      wallet = req.query.wallet;
      parametersToSet.push({ key: "wallet", value: wallet });
    } else {
      if (!req.session.login) {
        res.status(401).redirect("/");
        return;
      } else {
        wallet = req.session.wallet;
      }
    }

    defaultLocals(req, res);
    const profile_pic = digitalOcean.functions.getProfileLink(wallet);
    verificationPromise = new Promise(function (resolve, reject) {
      var isVerified = mongoClient.query.verified(wallet);
      resolve(isVerified);
    });
    nftsPromise = new Promise(function (resolve, reject) {
      const nfts = xumm.xrpl.getAccountsNfts(wallet, NFTSPERPAGE);
      resolve(nfts);
    });
    userPromise = new Promise(function (resolve, reject) {
      const ownerInfo = mongoClient.query.getUser(wallet);
      resolve(ownerInfo);
    });
    offersPromise = new Promise(function (resolve, reject) {
      const offers = xumm.xrpl.getAccountOffers(wallet);
      resolve(offers);
    });
    likedNftsPromise = new Promise(function (resolve, reject) {
      const nfts = mongoClient.query.getAccountLikedNfts(wallet);
      resolve(nfts);
    });
    queueCountPromise = new Promise(function (resolve, reject) {
      const queueCount = mongoClient.query.queuedItemsCount(wallet);
      resolve(queueCount);
    });
    const promises = await Promise.all([
      nftsPromise,
      userPromise,
      offersPromise,
      likedNftsPromise,
      verificationPromise,
      queueCountPromise,
    ]);

    const isOwner = promises[1].wallet == req.session.wallet ? true : false;
    var marker = promises[0][1];
    var isMarker = promises[0][1] == undefined ? false : true;
    listedNftsPromise = new Promise(function (resolve, reject) {
      const ownerNfts = mongoClient.query.getOwnerNfts(
        wallet,
        promises[0][0],
        NFTSPERPAGE
      );
      resolve(ownerNfts);
    });
    const listedPromise = await listedNftsPromise;
    res.render("views/profile", {
      isVerified: promises[4],
      isOwner: isOwner,
      marker: marker,
      nfts: listedPromise,
      user: promises[1],
      profile_pic: profile_pic,
      buyOffers: promises[2][1],
      sellOffers: promises[2][0],
      likedNfts: promises[3],
      page: page,
      queries: req.query,
      isMarker: isMarker,
      queueCount: promises[5],
    });
  } else {
    parametersToSet.push({ key: "page", value: 0 });
    appendToUrl(req.query, parametersToSet, req.path);
    res.redirect(appendToUrl(req.query, parametersToSet, req.path));
  }
});
server.get("/explore", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  var nfts;
  const page = parseInt(req.query.page);
  var parametersToSet = [];

  const filter = {
    sortLikes: req.query.sortLikes,
    sortPrice: req.query.sortPrice,
    filterExtras: req.query.filterExtras,
    filterBrands: req.query.filterBrands,
    filterFamilies: req.query.filterFamilies,
    filterCollections: req.query.filterCollections,
    filterPriceMin: req.query.filterPriceMin,
    filterPriceMax: req.query.filterPriceMax,
  };
  if (parseInt(filter.filterPriceMin) > parseInt(filter.filterPriceMax)) {
    filter.filterPriceMax = undefined;
    filter.filterPriceMin = undefined;
  }
  if (!isNaN(page)) {
    promiseNfts = new Promise(function (resolve, reject) {
      resolve(mongoClient.query.getNfts(NFTSPERPAGE, page, filter));
    });
    promiseVerifiedIssuers = new Promise(function (resolve, reject) {
      resolve(mongoClient.query.getVerifiedIssuers());
    }); //remove when server occupancy is low
    const promises = await Promise.all([promiseNfts, promiseVerifiedIssuers]);
    const filterOptions = await mongoClient.query.filterOptions();
    res.render("views/explore", {
      nfts: promises[0],
      page: page,
      verifiedIssuers: promises[1],
      queries: req.query,
      filterOptions: filterOptions,
    });
  } else {
    parametersToSet.push({ key: "page", value: "0" });
    res.redirect(appendToUrl(req.query, parametersToSet, req.path));
  }
});
server.get("/about", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/about");
});
server.get("/verified", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/verified");
});
server.get("/partners", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/partners");
});
server.get("/devnet", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/devnet");
});
server.get("/redeem-setup", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/redeem-info");
});
server.get("/collection", speedLimiter, async (req, res) => {
  const page = parseInt(req.query.page);
  const wallet = req.session.wallet;
  try{
    if (!isNaN(page)) {
      const collectionFamily = req.query.family;
      const issuer = req.query.issuer;
      var promisesArray = [];

      nftsPromise = new Promise(function (resolve, reject) {
        const nfts = mongoClient.query.getNftsByCollection(
          collectionFamily,
          issuer,
          NFTSPERPAGE,
          page
        );
        resolve(nfts);
      });
      unlistedNftsPromise = new Promise(function (resolve, reject) {
        const unlistedNfts = mongoClient.query.getUnlistedCollectionNfts(
          collectionFamily,
          issuer,
          NFTSPERPAGE,
          page
        );
        resolve(unlistedNfts);
      });
      collectionDetailsPromise = new Promise(function (resolve, reject) {
        const collectionDetails = mongoClient.query.getNftsCollection(
          collectionFamily,
          issuer
        );
        resolve(collectionDetails);
      });
      floorPricePromise = new Promise(function (resolve, reject) {
        const floorPrice = mongoClient.query.getCollectionFloorPrice(
          collectionFamily,
          issuer.split(",")
        );
        resolve(floorPrice);
      });
      listedItemsPromise = new Promise(function (resolve, reject) {
        const listedItems = mongoClient.query.totalCollectionItems(
          collectionFamily,
          issuer.split(",")
        );
        resolve(listedItems);
      });
      unlistedItemsPromise = new Promise(function (resolve, reject) {
        const unlistedItems = mongoClient.query.unlistedCollectionItems(
          collectionFamily,
          issuer.split(",")
        );
        resolve(unlistedItems);
      });
      //put into promise
      promisesArray.push(nftsPromise);
      promisesArray.push(unlistedNftsPromise);
      promisesArray.push(collectionDetailsPromise);
      promisesArray.push(floorPricePromise);
      promisesArray.push(listedItemsPromise);
      promisesArray.push(unlistedItemsPromise);
      //get results from all the above promises
      var collectionResults = await Promise.all(promisesArray);
      //assign promises to Variables
      var nfts = collectionResults[0];
      var unlistedNfts = collectionResults[1];
      var collectionStuff = collectionResults[2];
      var floorPrice = collectionResults[3];
      var listedItems = collectionResults[4];
      var unlistedItems = collectionResults[5];

      if (wallet !== collectionStuff.issuer) {
        mongoClient.query.incrementViewCollection(collectionFamily);
      }
      var collections = appendCollectionImages(collectionStuff);
      var collection_logo = collections.logo_url
      var collection_banner = collections.banner_url

      if (req.session.wallet != undefined) {
        var login = true;
      } else {
        var login = false;
      }
      defaultLocals(req, res);
      res.render("views/collection", {
        nfts: nfts,
        unlistedNfts: unlistedNfts,
        collectionDetails: collectionStuff,
        collection_logo: collection_logo,
        collection_banner: collection_banner,
        floor: floorPrice,
        items: listedItems + unlistedItems,
        wallet: wallet,
        login: login,
      });
    } else res.redirect("collections?page=0");
  } catch (err) {
    res.redirect("/collections")
  }
});
server.get("/collections", speedLimiter, async (req, res) => {
  // add limit to amount of collections fetched
  var collections = await mongoClient.query.getCollections(NFTSPERPAGE);
  var promisesArray = [];
  for (var i = 0; i < collections.length; i++) {
    var collectionsImagesPromise = new Promise(function (resolve, reject) {
      var randomImages = mongoClient.query.getRandomCollectionImages(
        collections[i].family,
        collections[i].issuer
      );
      resolve(randomImages);
    });
    var collectionsTotalItemsListedPromise = new Promise(function (
      resolve,
      reject
    ) {
      var totalItemsListed = mongoClient.query.totalCollectionItems(
        collections[i].family,
        collections[i].issuer
      );
      resolve(totalItemsListed);
    });
    var collectionsTotalItemsUnlistedPromise = new Promise(function (
      resolve,
      reject
    ) {
      var totalItemsUnlisted = mongoClient.query.unlistedCollectionItems(
        collections[i].family,
        collections[i].issuer
      );
      resolve(totalItemsUnlisted);
    });
    promisesArray.push(collectionsImagesPromise);
    promisesArray.push(collectionsTotalItemsListedPromise);
    promisesArray.push(collectionsTotalItemsUnlistedPromise);
  }
  var collectionResults = await Promise.all(promisesArray);
  for (var i = 0; i < collections.length; i++) {
    collections[i].sampleImages = collectionResults[Number(i) * 3];
    collections[i].numberOfNFTs =
      Number(collectionResults[Number(i) * 3 + 1]) +
      Number(collectionResults[Number(i) * 3 + 2]); //add the listed and unlisted values together
  }
  collections = appendColletionsImagesUrls(collections);
  defaultLocals(req, res);
  res.render("views/collections", {
    collections: collections,
  });
});
server.get("/create-collection", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  if (req.session.login) {
    const checkAccount = await mongoClient.query.verifiedChecker(
      req.session.wallet
    );
    if (checkAccount) {
      res.render("views/create-collection");
    } else {
      res.render("views/404");
    }
  } else res.status(401).redirect("/");
});
server.get("/logout", speedLimiter, (req, res) => {
  req.session.destroy();
  defaultLocals(req, res);
  res.redirect("/");
});
server.get("/connect", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/connect");
});
server.get("/metadata", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/metadata");
});
server.get("/minting-help", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/minting-help");
});
server.get("/kick", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  res.render("views/kick");
});
server.get("/redeem", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  if (req.session.login) {
    if (blacklist.includes(req.session.wallet)) {
      res.status(403).redirect("/kick");
    } else {
      const dateNow = Date.now();
      const memo =
        "Redeemed through OnChain Markeplace! \nhttps://onchainmarketplace.net";
      const historyArray = await xumm.xrpl.accountRedemptionHistory(
        req.session.wallet,
        memo
      );
      const getAssets = await mongoClient.query.redeemAssets();
      res.render("views/redeem", {
        tokens: getAssets,
        currTime: dateNow,
        history: historyArray,
      });
    }
  } else res.status(401).redirect("/");
});
server.get("/redeem-admin", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  if (req.session.login) {
    if (authorizedAccounts.includes(req.session.wallet)) {
      const dateNow = Date.now();
      const memo =
        "Redeemed through OnChain Markeplace! \nhttps://onchainmarketplace.net";
      const historyArray = await xumm.xrpl.accountRedemptionHistory(
        req.session.wallet,
        memo
      );
      const getAssets = await mongoClient.query.redeemAssets();
      res.render("views/redeem-admin", {
        tokens: getAssets,
        currTime: dateNow,
        history: historyArray,
      });
    } else res.status(401).redirect("/");
  } else res.status(401).redirect("/");
});
server.get("/edit-profile", speedLimiter, async (req, res) => {
  if (req.session.login) {
    defaultLocals(req, res);
    const profile_pic = digitalOcean.functions.getProfileLink(
      req.session.wallet
    );
    const account_info = await mongoClient.query.getUser(req.session.wallet);
    res.render("views/edit-profile", {
      profile_pic: profile_pic,
      account_info: account_info,
    });
  } else res.status(401).redirect("/");
});
server.get("/product-details", speedLimiter, async (req, res, next) => {
  defaultLocals(req, res);
  let wallet = req.session.wallet;
  let nftId = req.query.id;
  nftPromise = new Promise(function (resolve, reject) {
    const nft = mongoClient.query.getNft(nftId);
    resolve(nft);
  });
  const promises = await Promise.all([nftPromise]);
  nftsPromise = new Promise(function (resolve, reject) {
    const nfts = mongoClient.query.relatedNfts(
      promises[0].issuer,
      5,
      promises[0].tokenID
    );
    resolve(nfts);
  });
  const promiseNfts = await Promise.all([nftsPromise]);
  if (promises[0] !== null) {
    if (promises[0].uriMetadata.collection.family !== null) {
      var nftCollection = promises[0].uriMetadata.collection.family
        .toLowerCase()
        .replace(" ", "_");
      console.log(nftCollection)
    } else {
      var nftCollection = "no collection";
    }
    const isOwner = wallet == promises[0].currentOwner;
    if (nftCollection !== "no collection") {
      var collection_logo =
        digitalOcean.functions.getProductCollectionLogoLink(nftCollection);
    } else {
      var collection_logo = null;
    }
    //increment views on the NFT if it is not the owner, issuer or they aren't logged in
    if (
      wallet != promises[0].currentOwner &&
      wallet != promises[0].issuer &&
      wallet != undefined
    ) {
      mongoClient.query.incrementView(nftId);
    }
    if (promises[0]) {
      res.render("views/product-details", {
        wallet: wallet,
        isOwner: isOwner,
        nft: promises[0],
        nfts: promiseNfts[0],
        collection_logo: collection_logo,
      });
    } else next();
  } else {
    res.render("views/no-product");
  }
});
// server.get("/mint", speedLimiter, (req, res) => {
//   defaultLocals(req, res);
//   res.render("views/mint");
// });
server.get("/search", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  const searchResults = await mongoClient.query.getSearchResultsJSON(
    req.query.q
  );
  var promisesArray = [];
  var collections = searchResults.collections;
  for (var i = 0; i < collections.length; i++) {
    var collectionsImagesPromise = new Promise(function (resolve, reject) {
      var randomImages = mongoClient.query.getRandomCollectionImages(
        collections[i].family,
        collections[i].issuer
      );
      resolve(randomImages);
    });
    var collectionsTotalItemsListedPromise = new Promise(function (
      resolve,
      reject
    ) {
      var totalItemsListed = mongoClient.query.totalCollectionItems(
        collections[i].family,
        collections[i].issuer
      );
      resolve(totalItemsListed);
    });
    var collectionsTotalItemsUnlistedPromise = new Promise(function (
      resolve,
      reject
    ) {
      var totalItemsUnlisted = mongoClient.query.unlistedCollectionItems(
        collections[i].family,
        collections[i].issuer
      );
      resolve(totalItemsUnlisted);
    });
    promisesArray.push(collectionsImagesPromise);
    promisesArray.push(collectionsTotalItemsListedPromise);
    promisesArray.push(collectionsTotalItemsUnlistedPromise);
  }
  var collectionResults = await Promise.all(promisesArray);
  for (var i = 0; i < collections.length; i++) {
    collections[i].sampleImages = collectionResults[Number(i) * 3];
    collections[i].numberOfNFTs =
      Number(collectionResults[Number(i) * 3 + 1]) +
      Number(collectionResults[Number(i) * 3 + 2]); //add the listed and unlisted values together
  }
  collections = appendColletionsImagesUrls(collections);
  const searchedItem = req.query.q;
  res.render("views/search", {
    res: searchResults,
    collection: collections,
    searchedItem: searchedItem,
  });
});

//! ---------------------OCW API--------------------------------//
server.post("/get-profile-info", speedLimiter, async (req, res, next) => {
  try {
    const nftId = req.query.id;
    offersPromise = new Promise(function (resolve, reject) {
      const offers = xumm.xrpl.getnftOffers(nftId);
      resolve(offers);
    });
    ownerPromise = new Promise(function (resolve, reject) {
      const owner = xumm.xrpl.getcurrentNftHolder(nftId);
      resolve(owner);
    });
    const promises = await Promise.all([offersPromise, ownerPromise]);
    var returnHtml = [];
    defaultLocals(req, res);
    const currUser = req.session.wallet;
    const isOwner = promises[1] == req.session.wallet ? true : false;
    const profile_img = digitalOcean.functions.getProfileLink(promises[1]);
    console.log(promises[0][0])
    console.log(promises[1])
    res.render(
      "views/models/product-details/buy-offers-container.ejs",
      {
        buyOffers: promises[0][1],
        owner: promises[1],
        isOwner: isOwner,
        NFToken: nftId,
      },
      function (err, html) {
        if (err) throw "Couldn't get buy offers\n" + err;
        returnHtml.push(html);
      }
    );
    res.render(
      "views/models/product-details/sell-offers-container.ejs",
      {
        sellOffers: promises[0][0],
        owner: promises[1],
        isOwner: isOwner,
        NFToken: nftId,
        currUser: currUser,
      },
      function (err, html) {
        if (err) throw "Couldn't get sell offers\n" + err;
        returnHtml.push(html);
      }
    );
    returnHtml.push(promises[1]);
    returnHtml.push(profile_img);
    returnHtml.push(isOwner);
    res.send(returnHtml);
  } catch (err) {
    return next(err);
  }
});
server.post("/payload", speedLimiter, async (req, res) => {
  const payload = await getPayload(req.body);

  res.send(payload);
});
server.post("/nftoken-create-offer", speedLimiter, async (req, res) => {
  const NFToken = req.body.NFToken;
  const value = req.body.value;
  const destination = req.body.destination;
  const expiry = req.body.expiry;
  const flags = req.body.flags;
  var parseExp = parseInt(expiry);
  const payload = await xumm.payloads.NFTokenCreateOffer(
    NFToken,
    value,
    destination,
    parseExp,
    req.useragent.isMobile,
    req.body.return_url,
    flags
  );
  console.log(payload);
  res.status(200).send(payload);
});
server.post("/subscription-transaction", speedLimiter, async (req, res) => {
  xumm.subscriptions.transactionSubscription(req, res);
});
server.post("/NFTokenAcceptOffer", speedLimiter, async (req, res) => {
  const offerId = req.body.index;
  const flags = req.body.flags;
  console.log(req.body.return_url);
  const payload = await xumm.payloads.NFTokenAcceptOffer(
    offerId,
    req.useragent.isMobile,
    req.body.return_url,
    flags
  );
  res.status(200).send({ payload: payload, NFTokenID: req.body.NFToken });
  //else res.sendStatus(400);
});
server.post("/NFTokenAcceptOfferSubscription", async (req, res, next) => {
  const NFTokenID = req.body.NFTokenID;
  const result = await xumm.subscriptions.NFTokenAcceptSubscription(req, res);
  if (result) {
    const NFTOfferDetails = {
      NFTokenID: NFTokenID,
      Date: new Date(),
    };
    mongoClient.query.logRecentSale(NFTOfferDetails);
    return;
  }
});
server.post("/NFTokenCancelOffer", speedLimiter, async (req, res) => {
  if (req.session.login) {
    const payload = await xumm.payloads.NFTokenCancelOffer(
      req.body.index,
      req.useragent.isMobile,
      req.body.return_url
    );
    res.status(200).send(payload);
  } else res.status(400).send("Not logged in");
});
server.post("/sign-in-payload", speedLimiter, async (req, res) => {
  const payload = await xumm.payloads.signInPayload(
    req.useragent.isMobile,
    req.body.return_url
  );
  res.send(payload);
});
server.post("/sign-in-subscription", speedLimiter, async (req, res) => {
  const result = await xumm.subscriptions.signInSubscription(req, res);
  if (result) {
    mongoClient.query.initiateUser(req.session.wallet);
  }
});
server.post("/XUMM-sign-subscription", speedLimiter, async (req, res) => {
  const result = await xumm.subscriptions.watchSubscripion(req, res);
});
server.post("/redeem-nft-payload", speedLimiter, async (req, res) => {
  const apiInfo = await mongoClient.query.findRedemptionAccountByProject(
    req.body.project
  );
  const clientAddy = apiInfo[0].account;
  const ipAddress = apiInfo[0].ip;
  const acctAge = await xumm.xrpl.checkAccountActivation(req.session.wallet, 1);
  if (!acctAge) {
    res.status(403).send("Error #1004"); //account too young
    return;
  } else {
    const accountBal = await xumm.xrpl.getTokenBalance(
      req.session.wallet,
      apiInfo[0].issuer,
      apiInfo[0].hex
    );
    if (accountBal < apiInfo[0].minimum || accountBal == undefined) {
      res.status(403).send("Error #1003"); //insuf funds
      return;
    } else {
      const encUUID = await xumm.xrpl.encodeXummID(req.session.user_token);
      const payload = await xumm.payloads.redeemNftPayload(
        req.session.wallet,
        req.useragent.isMobile,
        req.body.return_url,
        ipAddress,
        encUUID
      );
      try {
        if (payload instanceof Error) throw payload;
        res.status(200).send(payload);
      } catch (err) {
        console.log(err.toString());
        res.status(500).send(err.toString());
      }
    }
  }}
);
server.post("/redeem-nft-subscription", speedLimiter, async (req, res) => {
  var dataBody = JSON.parse(req.body.payload);
  const result = await xumm.subscriptions.watchSubscripion(dataBody[0]);
  console.log(result);
  //const payload = await xumm.subscriptions.redeemNftSubscription(req, res);
  if (result[0] == "signed") {
    console.log("sending off redemption NFT info");
    var walletFromPayload = result[1];
    var NFTokenID = dataBody[1];
    var wallet = walletFromPayload;
    var permanent = false;
    var issuer = undefined;
    var sessionWallet = wallet;
    await mongoClient.query.recentlyRedeemed(
      NFTokenID,
      wallet,
      permanent,
      issuer,
      sessionWallet
    );
  }
});
server.post("/increment-like", speedLimiter, async (req, res) => {
  var success;
  if (req.session.login) {
    const nftId = req.body.id;
    const userId = req.session.wallet;
    await mongoClient.query.addLike(nftId, userId).then((result) => {
      success = result;
    });
  } else success = false;
  success ? res.status(200).end() : res.status(406).end();
});
server.post("/decrement-like", speedLimiter, async (req, res) => {
  var success;
  if (req.session.login) {
    const nftId = req.body.id;
    const userId = req.session.wallet;
    await mongoClient.query.removeLike(nftId, userId).then((result) => {
      success = result;
    });
  } else success = false;
  success ? res.status(200).end() : res.status(406).end();
});
server.post(
  "/create-collection",
  upload.fields([
    { name: "collection-logo", maxCount: 1 },
    { name: "cover-img", maxCount: 1 },
  ]),
  speedLimiter,
  async (req, res) => {
    const formDataBody = req.body;
    const formDataFiles = req.files;
    var result = false;
    if (formDataFiles) {
      if (formDataFiles["collection-logo"]) {
        if (
          (result = await digitalOcean.functions.uploadCollectionLogo(
            req,
            formDataFiles["collection-logo"][0]
          ))
        )
          result = true;
        console.log("uploaded logo");
      }
      if (formDataFiles["cover-img"]) {
        if (
          (result = await digitalOcean.functions.uploadCollectionBanner(
            req,
            formDataFiles["cover-img"][0]
          ))
        )
          result = true;
        console.log("uploaded banner");
      }
    }
    console.log(formDataBody);
    if (
      await mongoClient.query.createCollection(
        formDataBody["displayName"],
        formDataBody["family"],
        formDataBody["name"],
        formDataBody["brand"],
        formDataBody["url"],
        formDataBody["issuer"],
        formDataBody["description"]
      )
    )
      console.log("done");
    result = true;
    result ? res.status(200).send("Modified") : res.status(500).send("Failed");
  }
);
server.post(
  "/mint-no-IPFS-payload",
  upload.any(),
  speedLimiter,
  async (req, res) => {
    if (req.body.size <= 10000000) {
      if (req.session.login) {
        const payload = await xumm.payloads.mintNftPayload(
          process.env.XRPL_ISSUER_PAYMENT_ADDRESS,
          req.session.wallet,
          req.session.user_token,
          process.env.MINTING_PRICE,
          req.useragent.isMobile,
          req.body.return_url
        );
        if (payload) {
          const response = {
            payload: payload,
          };
          res.status(200).send(response);
        } else res.status(400).send("Error getting Payload");
      } else res.status(401).send("Please sign in.");
    } else res.status(400).send("File is too large");
  }
);
server.post(
  "/mint-no-IPFS-subscription",
  upload.any(),
  speedLimiter,
  async (req, res) => {
    const dataBody = req.body;
    var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
    try {
      dataBody.jsonData = JSON.parse(dataBody.jsonData);
      dataBody.payload = JSON.parse(dataBody.payload);
    } catch (err) {
      console.error("Couldn't parse jsonData");
      console.error(err);
    }
    //Wrap the code below with a check to see if user has signed the transaction. See other subscription functions as reference
    const result = await xumm.subscriptions.mintNftSubscription(
      dataBody.payload,
      res
    );
    if (result) {
      const epoch = new Date().getTime();
      dataBody.jsonData[
        "image"
      ] = `https://ocw-space.sgp1.digitaloceanspaces.com/nft-images/${req.session.wallet}${epoch}.png`;
      dataBody[
        "jsonLink"
      ] = `https://ocw-space.sgp1.digitaloceanspaces.com/nft-jsons/${req.session.wallet}${epoch}.json`;

      if (!allowedExtensions.exec(req.files[0].originalname)) {
        res.status(415).send("Failed");
      } else {
        digitalOcean.functions.uploadNFTImage(req, req.files[0], epoch);
        digitalOcean.functions.uploadNFTJson(req, dataBody.jsonData, epoch);
        if (dataBody) {
          const mintPload = await xumm.payloads.mintObject(
            dataBody.jsonLink,
            dataBody.taxon,
            dataBody.transferFee,
            "OnChain Marketplace website minted NFT",
            dataBody.burnable,
            dataBody.onlyXRP,
            dataBody.trustline,
            dataBody.transferable,
            req.session.user_token
          );
          res.status(200).send(mintPload);
        }
      }
    } else res.status(402).send("Payment not valid");
  }
);
server.post(
  "/minting-confirmation",
  upload.any(),
  speedLimiter,
  async (req, res) => {
    const mintPload = req.body.payload;
    console.log("mint-confrirmations");
    const txID = await xumm.subscriptions.xummTransInfo(mintPload, res);
    const NFTokenId = await xumm.xrpl.nftIDFromTxID(txID);
    console.log(NFTokenId);
    if (NFTokenId == false) {
      res.status(418).send("Minting transaction not signed correctly");
    } else {
      await mongoClient.query.addNftToQueried(
        NFTokenId[0],
        NFTokenId[1],
        false,
        NFTokenId[1]
      );
      res.status(200).send("NFT minted");
    }
  }
);
server.post(
  "/update-user",
  upload.fields([{ name: "profile-img", maxCount: 1 }, { name: "cover-img" }]),
  speedLimiter,
  async (req, res) => {
    console.log(req.body);
    const formDataBody = req.body;
    const formDataFiles = req.files;
    var result = false;
    if (formDataFiles) {
      if (formDataFiles["profile-img"]) {
        if (
          (result = await digitalOcean.functions.uploadProfile(
            req,
            formDataFiles["profile-img"][0]
          ))
        )
          result = true;
      }

      if (formDataFiles["cover-img"])
        if (
          await digitalOcean.functions.uploadCover(
            req,
            formDataFiles["cover-img"][0]
          )
        )
          result = true;
    }
    if (
      await mongoClient.query.updateUser(
        req.session.wallet,
        formDataBody["project"],
        formDataBody["email"],
        formDataBody["description"],
        formDataBody["website"]
      )
    )
      result = true;
    result ? res.status(200).send("Modified") : res.status(500).send("Failed");
  }
);
server.post(
  "/subscribe-email",
  upload.fields([{ name: "email" }]),
  speedLimiter,
  async (req, res) => {
    const formDataBody = req.body;
    console.log(formDataBody);

    var result = false;
    if (
      await mongoClient.query.updateMailingList(
        req.session.wallet,
        formDataBody["email"]
      )
    )
      result = true;
    res.status(200).send("Modified");
  }
);
server.post("/report-nft", upload.any(), speedLimiter, async (req, res) => {
  const formData = req.body;
  const result = await mongoClient.query.reportNft(
    formData["token-id"],
    formData["message"],
    req.session.login,
    req.session.wallet
  );
  result ? res.status(200).send("Modified") : res.status(500).send("Failed");
});
server.post("/list-free", async (req, res) => {
  if (req.session.login) {
    var permanent = false;
    await mongoClient.query.addNftToQueried(
      req.body.NFTokenID,
      req.session.wallet,
      permanent,
      req.body.issuer
    );
    res.status(200).send("NFT successfully listed");
  }
});
server.post("/list-nft-payload", async (req, res, next) => {
  if (req.session.login) {
    const payload = await xumm.payloads.listNftPayload(
      process.env.XRPL_ISSUER_PAYMENT_ADDRESS,
      req.session.wallet,
      process.env.LISTING_PRICE,
      req.useragent.isMobile,
      req.body.return_url
    );
    const response = {
      payload: payload,
      NFTokenID: req.body.NFTokenID,
      issuer: req.body.issuer,
      fee: req.body.fee,
    };
    res.send(response);
  } else res.sendStatus(400);
});
server.post("/list-nft-payload-collection", async (req, res, next) => {
  if (req.session.login) {
    const payload = await xumm.payloads.listNftPayload(
      process.env.XRPL_ISSUER_PAYMENT_ADDRESS,
      req.body.holder,
      process.env.LISTING_PRICE,
      req.useragent.isMobile,
      req.body.return_url
    );
    const response = {
      payload: payload,
      NFTokenID: req.body.NFTokenID,
      holder: req.body.holder,
      issuer: req.body.issuer,
      fee: req.body.fee,
    };
    res.send(response);
  } else res.sendStatus(400);
});
server.post("/list-nft-subscription", async (req, res, next) => {
  const result = await xumm.subscriptions.listNftSubscription(req, res);
  var permanent = false;
  if (req.body.fee == "1") permanent = true;
  if (result) {
    await mongoClient.query.addNftToQueried(
      req.body.NFTokenID,
      req.session.wallet,
      permanent,
      req.body.issuer
    );
  }
});
server.post("/list-nft-subscription-collection", async (req, res, next) => {
  const result = await xumm.subscriptions.listNftSubscription(req, res);
  var permanent = false;
  var currentWallet = req.session.wallet;
  if (req.body.fee == "1") permanent = true;
  if (result) {
    mongoClient.query.addNftToQueried(
      req.body.NFTokenID,
      req.body.holder,
      permanent,
      req.body.issuer,
      currentWallet
    );
  }
});
server.post(
  "/list-bulk-array-free",
  upload.any(),
  speedLimiter,
  async (req, res) => {
    if (req.session.login) {
      const dataBody = req.body;
      const nftArray = JSON.parse(dataBody.nfts);
      var permanent = false;
      var wallet = req.session.wallet;
      await mongoClient.query.bulkNFTList(nftArray, wallet, permanent);
      res.status(200).send("Free Bulk List Success");
    }
  }
);
server.post(
  "/list-bulk-array",
  upload.any(),
  speedLimiter,
  async (req, res, next) => {
    const dataBody = req.body;
    const nfts = JSON.parse(dataBody.nfts);
    if (nfts.length > 0) {
      const price = nfts.length * 0.98;
      const payload = await xumm.payloads.mintNftPayload(
        process.env.XRPL_ISSUER_PAYMENT_ADDRESS,
        req.session.wallet,
        req.session.user_token,
        price,
        req.useragent.isMobile,
        dataBody.returnUrl
      );
      const response = {
        payload: payload,
      };
      if (payload) {
        res.send(response).status(200);
      } else {
        res.status(400);
      }
    } else {
      res.status(400).send("no NFTs to list");
    }
  }
);
server.post(
  "/list-bulk-subscription",
  upload.any(),
  speedLimiter,
  async (req, res, next) => {
    const dataBody = req.body;
    const nftArray = JSON.parse(dataBody.nfts);
    const payload = JSON.parse(dataBody.payload);
    const result = await xumm.subscriptions.bulkListNftSubscription(
      payload,
      res
    );
    var permanent = false;
    var wallet = req.session.wallet;
    if (result) {
      await mongoClient.query.bulkNFTList(nftArray, wallet, permanent);
    }
  }
);
server.get("/get-account-unlisted-nfts", speedLimiter, async (req, res) => {
  var wallet;
  var unlistedNfts = [];
  var unlistedNftsToReturn = [];
  try {
    if (req.query.wallet) wallet = req.query.wallet;
    else wallet = req.session.wallet;
    const marker = req.query.marker;
    const nfts = await xumm.xrpl.getAccountsNfts(wallet, NFTSPERPAGE, marker);
    //find out what ones are listed
    var checkListingPromises = [];
    if (!nfts) throw "No nfts found";
    for (let nft of nfts[0]) {
      var checkNftStatusPromise = new Promise(function (resolve, reject) {
        var returnedNft = mongoClient.query.getNft(nft.NFTokenID);
        resolve(returnedNft);
      });

      checkListingPromises.push(checkNftStatusPromise);
    }

    var listingStatusResults = await Promise.all(checkListingPromises); //wait to get listing status on returned NFTS

    for (var i = 0; i < nfts[0].length; i++) {
      if (listingStatusResults[i] == null) unlistedNfts.push(nfts[0][i]);
    }

    //get unlisted NFT promises
    var unlistedNftDetailsPromises = [];
    for (var i = 0; i < unlistedNfts.length; i++) {
      var queuedStatusPromise = new Promise(function (resolve, reject) {
        var queuedStatus = mongoClient.query.checkQueue(
          unlistedNfts[i].NFTokenID
        );
        resolve(queuedStatus);
      });

      var nftDataPromise = new Promise(function (resolve, reject) {
        var nftData = xumm.xrpl.getNftImage(unlistedNfts[i].URI);
        resolve(nftData);
      });

      unlistedNftDetailsPromises.push(queuedStatusPromise);
      unlistedNftDetailsPromises.push(nftDataPromise);
    }

    var listingStatusResults = await Promise.all(unlistedNftDetailsPromises); //wait for promises to resolve
    //transform data
    for (var i = 0; i < unlistedNfts.length; i++) {
      var queuedStatus = listingStatusResults[i * 2];
      var nftData = listingStatusResults[i * 2 + 1];
      if (queuedStatus == null) {
        //check to see if the NFT isn't in the queue for listing with !==.
        if (nftData) {
          unlistedNftsToReturn[i] = nftData;
          unlistedNftsToReturn[i].taxon = unlistedNfts[i].NFTokenTaxon;
          unlistedNftsToReturn[i].issuer = unlistedNfts[i].Issuer;
          unlistedNftsToReturn[i].currentHolder = wallet;
          unlistedNftsToReturn[i].NFTokenID = unlistedNfts[i].NFTokenID;
          unlistedNftsToReturn[i].fileType = unlistedNftsToReturn[
            i
          ].http_image.substring(
            unlistedNftsToReturn[i].http_image.lastIndexOf(".") + 1
          );
        } else {
          unlistedNftsToReturn[i] = {
            name: "Broken NFT",
            description: "No NFT data found",
            image: "",
            edition: 0,
            date: 0,
            external_url: "",
            attributes: [],
            http_image: "assets/images/icons/link-error.png",
            http_uri: "",
          };
          unlistedNftsToReturn[i].taxon = unlistedNfts[i].NFTokenTaxon;
          unlistedNftsToReturn[i].issuer = unlistedNfts[i].Issuer;
          unlistedNftsToReturn[i].currentHolder = wallet;
          unlistedNftsToReturn[i].NFTokenID = unlistedNfts[i].NFTokenID;
          unlistedNftsToReturn[i].fileType = "png";
        }
      }
    }
    res.render("views/models/unlisted-nft-rows.ejs", {
      wallet: wallet,
      rawData: unlistedNfts,
      nfts: unlistedNftsToReturn,
    });
  } catch (error) {
    console.error(error);
  }
});
server.get("/get-additional-unlisted-nfts", speedLimiter, async (req, res) => {
  var wallet = req.query.wallet;
  var unlistedNfts = [];
  var unlistedNftsToReturn = [];
  const marker = req.query.marker;
  const markerIteration = req.query.markerIteration;
  var returnData = [];
  if (wallet && marker && markerIteration) {
    const nfts = await xumm.xrpl.getAccountsNfts(wallet, NFTSPERPAGE, marker);
    var checkListingPromises = [];

    for (let nft of nfts[0]) {
      var checkNftStatusPromise = new Promise(function (resolve, reject) {
        var returnedNft = mongoClient.query.getNft(nft.NFTokenID);
        resolve(returnedNft);
      });

      checkListingPromises.push(checkNftStatusPromise);
    }

    var listingStatusResults = await Promise.all(checkListingPromises);

    for (var i = 0; i < nfts[0].length; i++) {
      if (listingStatusResults[i] == null) unlistedNfts.push(nfts[0][i]);
    }

    var unlistedNftDetailsPromises = [];
    for (var i = 0; i < unlistedNfts.length; i++) {
      var queuedStatusPromise = new Promise(function (resolve, reject) {
        var queuedIDFinder = mongoClient.query.checkQueue(
          unlistedNfts[i].NFTokenID
        );
        resolve(queuedIDFinder);
      });

      var nftDataPromise = new Promise(function (resolve, reject) {
        var data = xumm.xrpl.getNftImage(unlistedNfts[i].URI);
        resolve(data);
      });

      unlistedNftDetailsPromises.push(queuedStatusPromise);
      unlistedNftDetailsPromises.push(nftDataPromise);
    }

    var listingStatusResults = await Promise.all(unlistedNftDetailsPromises);
    for (var i = 0; i < unlistedNfts.length; i++) {
      var queuedStatus = listingStatusResults[i * 2];
      var nftData = listingStatusResults[i * 2 + 1];
      if (queuedStatus == null) {
        if (nftData) {
          unlistedNftsToReturn[i] = nftData;
          unlistedNftsToReturn[i].taxon = unlistedNfts[i].NFTokenTaxon;
          unlistedNftsToReturn[i].issuer = unlistedNfts[i].Issuer;
          unlistedNftsToReturn[i].currentHolder = wallet;
          unlistedNftsToReturn[i].NFTokenID = unlistedNfts[i].NFTokenID;
          unlistedNftsToReturn[i].fileType = unlistedNftsToReturn[
            i
          ].http_image.substring(
            unlistedNftsToReturn[i].http_image.lastIndexOf(".") + 1
          );
        } else {
          unlistedNftsToReturn[i] = {
            name: "Broken NFT",
            description: "No NFT data found",
            image: "",
            edition: 0,
            date: 0,
            external_url: "",
            attributes: [],
            http_image: "assets/images/icons/link-error.png",
            http_uri: "",
          };
          unlistedNftsToReturn[i].taxon = unlistedNfts[i].NFTokenTaxon;
          unlistedNftsToReturn[i].issuer = unlistedNfts[i].Issuer;
          unlistedNftsToReturn[i].currentHolder = wallet;
          unlistedNftsToReturn[i].NFTokenID = unlistedNfts[i].NFTokenID;
          unlistedNftsToReturn[i].fileType = "png";
        }
      }
    }
    res.render(
      "views/models/unlisted-nft-rows-load.ejs",
      {
        wallet: wallet,
        rawData: unlistedNfts,
        nfts: unlistedNftsToReturn,
      },
      async function (err, html) {
        if (err) throw "Couldn't get NFTS\n" + err;
        returnData.push(html);
      }
    );
    returnData.push(nfts[1]); //pushes the marker
    res.send(returnData);
  } else res.sendStatus(400);
});
server.get(
  "/bulk-list-account-unlisted-nfts",
  speedLimiter,
  async (req, res) => {
    var wallet = req.session.wallet;
    var returnData = [];
    const nfts = await xumm.xrpl.getAllAccountNFTs(wallet);
    //find out what ones are listed
    const clientMongo = await mongoClient.query.connectToMongo();
    var checkListingPromises = [];
    for (a in nfts) {
      var checkNftStatusPromise = new Promise(function (resolve, reject) {
        var returnedNft = mongoClient.query.getBulkNft(
          nfts[a].NFTokenID,
          clientMongo
        );
        resolve(returnedNft);
      });

      var queuedStatusPromise = new Promise(function (resolve, reject) {
        var queuedStatus = mongoClient.query.checkBulkQueue(
          nfts[a].NFTokenID,
          clientMongo
        );
        resolve(queuedStatus);
      });

      checkListingPromises.push(checkNftStatusPromise);
      checkListingPromises.push(queuedStatusPromise);
    }

    var listingStatusResults = await Promise.all(checkListingPromises); //wait to get listing status on returned NFTS
    await clientMongo.close();
    //get all unlisted && not-queued
    var unlistedNfts = [];
    for (var i = 0; i < nfts.length; i++) {
      if (
        listingStatusResults[i * 2] == null &&
        listingStatusResults[i * 2 + 1] == null
      )
        unlistedNfts.push(nfts[i]);
    }

    // //IF IMAGES IS TOO SLOW
    // //COMMENT OUT FROM HERE!!!

    // //get unlisted NFT promises
    // var unlistedNftDetailsPromises = [];
    // for (var i = 0; i < unlistedNfts.length; i++) {
    //   var nftDataPromise = new Promise(function (resolve, reject) {
    //       var nftData = xumm.xrpl.getNftImage(unlistedNfts[i].URI);
    //       resolve(nftData);
    //   });

    //   unlistedNftDetailsPromises.push(nftDataPromise);
    // }

    // var listingStatusResults = await Promise.all(unlistedNftDetailsPromises); //wait for promises to resolve

    // //transform data
    // for (var i = 0; i < unlistedNfts.length; i++) {
    //   unlistedNfts[i].data = listingStatusResults[i];
    // }

    // //IF IMAGES IS TOO SLOW
    // //COMMENT OUT TO HERE!!!

    //DO WHAT YOU NEED FROM HERE
    res.render(
      "views/models/bulk-list-modal.ejs",
      {
        nft: unlistedNfts,
      },
      async function (err, html) {
        if (err) throw "Couldn't get NFTS\n" + err;
        returnData.push(html);
      }
    );
    res.send(returnData);
  }
);
server.get("/get-additional-listed-nfts", speedLimiter, async (req, res) => {
  var wallet = req.query.wallet;
  var marker = req.query.marker;
  var markerIteration = req.query.markerIteration;
  var returnData = [];
  if (wallet && marker && markerIteration) {
    const xrplNfts = await xumm.xrpl.getAccountsNfts(
      wallet,
      NFTSPERPAGE,
      marker
    );
    const nfts = await mongoClient.query.matchXrplNftsWithMongoDB(
      null,
      xrplNfts
    );
    var updateNfts = [];
    for (var i = markerIteration * NFTSPERPAGE; i < nfts.length; i++) {
      updateNfts.push(nfts[i]);
    }
    res.render(
      "views/models/nft-rows-load.ejs",
      {
        nfts: nfts,
      },
      async function (err, html) {
        if (err) throw "Couldn't get NFTS\n" + err;
        returnData.push(html);
      }
    );
    returnData.push(xrplNfts[1]);
    res.send(returnData);
  } else res.sendStatus(400);
});
server.get(
  "/get-additional-collection-nfts",
  speedLimiter,
  async (req, res, next) => {
    var wallet = req.session.wallet;
    var login = req.session.login;
    var collectionFamily = req.query.family;
    const issuer = req.query.issuer;
    var marker = req.query.marker;
    var iteration = req.query.markerIteration;
    var returnData = [];
    if (marker && iteration) {
      const nfts = await mongoClient.query.getNftsByCollection(
        collectionFamily,
        issuer,
        NFTSPERPAGE,
        iteration
      );
      var updateNfts = [];
      for (var i = iteration * NFTSPERPAGE; i < nfts.length; i++) {
        updateNfts.push(nfts[i]);
      }
      res.render(
        "views/models/nft-rows-load.ejs",
        {
          nfts: nfts,
          wallet: wallet,
          login: login,
        },
        async function (err, html) {
          if (err) console.error("Could not get NFTS\n" + err);
          returnData.push(html);
        }
      );
      res.send(returnData);
    } else res.sendStatus(400);
  }
);
server.get(
  "/get-additional-explore-nfts",
  speedLimiter,
  async (req, res, next) => {
    const markerIteration = req.query.markerIteration;
    const filter = {
      sortLikes: req.query.sortLikes,
      sortPrice: req.query.sortPrice,
      filterExtras: req.query.filterExtras,
      filterBrands: req.query.filterBrands,
      filterFamilies: req.query.filterFamilies,
      filterCollections: req.query.filterCollections,
      filterPriceMin: req.query.filterPriceMin,
      filterPriceMax: req.query.filterPriceMax,
    };
    if (parseInt(filter.filterPriceMin) > parseInt(filter.filterPriceMax)) {
      filter.filterPriceMax = undefined;
      filter.filterPriceMin = undefined;
    }
    if (!isNaN(markerIteration)) {
      promiseNfts = new Promise(function (resolve, reject) {
        resolve(
          mongoClient.query.getNfts(NFTSPERPAGE, markerIteration, filter)
        );
      });
      if ((await promiseNfts).length == 0) {
        res.status(200).send("empty");
      } else {
        res.render("views/models/nft-rows-load", { nfts: await promiseNfts });
      }
    }
    res.status(400).send();
  }
);
server.get("/get-token-balance", speedLimiter, async (req, res) => {
  const formatter = Intl.NumberFormat("en", { notation: "compact" });
  const hex = req.query.hex;
  const issuer = req.query.issuer;
  const token = req.query.token;
  var balance = await xumm.xrpl.getTokenBalance(
    req.session.wallet,
    issuer,
    hex
  );
  balance = parseFloat(balance);
  if (isNaN(balance)) balance = 0;
  if (balance.length > 3) {
    balance = formatter.format(balance);
  } else {
    balance = balance.toFixed(2);
  }
  res.send(balance + " " + token);
});

//! ---------------------Server Essentials--------------------------------//
server.get("/node", (req, res) => {
  res.send();
});
// Renders 404                                                     page if the request is send to undeclared location
server.use((req, res, next) => {
  defaultLocals(req, res);
  res.status(404).render("views/404.ejs");
  next();
});
server.use(function (err, req, res, next) {
  if (err.code !== "EBADCSRFTOKEN") return next(err);

  // handle CSRF token errors here
  console.log(err);
  res.status(403).render("views/500.ejs");
  next();
});
server.use((err, req, res, next) => {
  console.error(err);
  defaultLocals(req, res);
  res.status(500).render("views/500.ejs");
  next();
});

server.listen(process.env.PORT, () => {
  console.log("Server Listening on Port 80");
});

//! ---------------------Custom functions--------------------------------//
function checkViews(req, next) {
  try {
    if (req.session && (!req.session.views || req.session.views == undefined))
      req.session.views = 1;
    else req.session.views += 1;
  } catch (err) {
    console.error("Error settings views:" + err);
  } finally {
    next();
  }
}

function defaultLocals(req, res) {
  try {
    var login =
      req.session.login != undefined && req.session ? req.session.login : false;
    var wallet = req.session.wallet != null ? req.session.wallet : false;
    var mobile =
      req.useragent.isMobile != undefined && req.useragent.isMobile
        ? req.useragent.isMobile
        : false;
    res.locals.serverUrl = process.env.SERVER_URL;
    req.session.login = login;
    res.locals.login = login;
    res.locals.wallet = wallet;
    res.locals.mobile = mobile;
    res.locals.url = process.env.SERVER_URL;
    res.locals.path = req.path;
    // console.log(res.locals.fulUrl);
    if (typeof req.csrfToken === "function") {
      res.locals.csrfToken = req.csrfToken();
    }
  } catch (err) {
    console.error("Error settings locals: " + err);
  } finally {
    return;
  }
}
function getPayload(request) {
  const payload = sdk.payload.create(request);

  return payload;
}

function appendColletionsImagesUrls(collections) {
  collections.forEach((collection) => {
    const collection_logo = digitalOcean.functions.getCollectionLogoLink(
      collection.family.replace(/\s/g, "_").toLowerCase()
    );
    const collection_banner = digitalOcean.functions.getCollectionBannerLink(
      collection.family.replace(/\s/g, "_").toLowerCase()
    );
    collection["banner_url"] = collection_banner;
    collection["logo_url"] = collection_logo;
  });
  return collections;
}
function appendCollectionImages(collection) {
  const collection_logo = digitalOcean.functions.getCollectionLogoLink(
    collection.family.replace(/\s/g, "_").toLowerCase()
  );
  const collection_banner = digitalOcean.functions.getCollectionBannerLink(
    collection.family.replace(/\s/g, "_").toLowerCase()
  );
  collection["banner_url"] = collection_banner;
  collection["logo_url"] = collection_logo;
  return collection;
}

function appendToUrl(url, parameters, path) {
  const parsedUrl = new URLSearchParams(url);
  console.log();
  parameters.forEach((parameter) => {
    parsedUrl.set(parameter.key, parameter.value);
  });
  return path + "?" + parsedUrl.toString();
}

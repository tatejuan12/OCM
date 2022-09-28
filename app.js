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
const { log } = require("console");
const multer = require("multer");
const upload = multer({ limits: { fieldSize: "16mb" } }); //used to get multipart-formdata doesn't get. used for user data changing!
const csurf = require("csurf");
const helmet = require("helmet");
const minifyHtml = require("express-minify-html");
const slowDown = require("express-slow-down");
const { send } = require("express/lib/response");
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
server.use(bodyParser.json()); // for parsing serverlication/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing serverlication/x-www-form-urlencoded
server.set("view engine", "ejs"); // Setting rendering agent to ejs
server.use(helmet({ contentSecurityPolicy: false }));
server.set("views", path.join(__dirname, "/public")); // Makes views for rendering the public dir
server.use(express.static(__dirname + "/public", { dotfiles: "allow" })); // Essential so JS and CSS is acccessible by requests
server.use(logger({ path: __dirname + "/logs/logs.log" })); // Logs data, every connection will log browser info and request url
server.use(
  session({
    secret: "some secret",
    resave: false,
    saveUninitialized: false,
    //! change to secure true once hosting
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 30 }, // ms/s, s/m, m/h, h/d, d/mnth
    store: mongoStore,
  })
);
const csrfProtection = csurf({});
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
const authorizedIps = [
  "14.201.212.126",
  undefined,
  "1.145.188.214",
  "103.231.88.10",
  "27.99.115.205",
  "220.235.196.107",
  "1.132.108.195", //Liam
  "27.99.115.205",
  "116.206.228.203",
  "139.218.13.37", //Juanito
  "175.176.36.102", //Kuro OCW mod
  "180.232.74.234", // Kuro office
  "136.158.11.167", //B OCW mod
  "136.158.2.105", //kazu OCW mod
  "174.118.238.12", //Razzle OCW mod
  "14.201.212.126",
  "122.171.23.129", //Ron
  "99.228.46.244", // crypto survivor
  "36.71.36.93", //Dejavus
  "110.54.195.57", //BINCE
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
    var isVerified = await mongoClient.query.verified(wallet)
    const profile_pic = digitalOcean.functions.getProfileLink(wallet);
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
    const promises = await Promise.all([
      nftsPromise,
      userPromise,
      offersPromise,
      likedNftsPromise,
    ]);

    const isOwner = promises[1].wallet == req.session.wallet ? true : false;
    var marker = promises[0][1];
    var isMarker = promises[0][1] == undefined ? false : true;
    const ownerNfts = await mongoClient.query.getOwnerNfts(
      wallet,
      promises[0][0]
    );
    res.render("views/profile", {
      isVerified: isVerified,
      isOwner: isOwner,
      marker: marker,
      nfts: ownerNfts,
      user: promises[1],
      profile_pic: profile_pic,
      buyOffers: promises[2][1],
      sellOffers: promises[2][0],
      likedNfts: promises[3],
      page: page,
      queries: req.query,
      isMarker: isMarker,
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
    });
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
server.get("/redeem-setup", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/redeem-info");
});
server.get("/collection", speedLimiter, async (req, res) => {
  const page = parseInt(req.query.page);
  const wallet = req.session.wallet;
  if (!isNaN(page)) {
    const collectionName = req.query.name;
    const issuer = req.query.issuer;
    const nfts = await mongoClient.query.getNftsByCollection(
      collectionName,
      issuer,
      NFTSPERPAGE,
      page
    );
    const unlistedNfts = await mongoClient.query.getUnlistedCollectionNfts(
      collectionName,
      issuer,
      NFTSPERPAGE,
      page
    );
    const collectionDetails = await mongoClient.query.getNftsCollection(
      collectionName,
      issuer
    );
    const collection_logo = digitalOcean.functions.getCollectionLogoLink(
      collectionDetails.name
    );
    const collection_banner = digitalOcean.functions.getCollectionBannerLink(
      collectionDetails.name
    );
    const floorPrice = await mongoClient.query.getCollectionFloorPrice(
      collectionName,
      issuer.split(",")
    );
    const items = await mongoClient.query.totalCollectionItems(
      collectionName,
      issuer.split(",")
    );
    if (wallet !== collectionDetails.issuer) {
      await mongoClient.query.incrementViewCollection(collectionName);
    }
    if (req.session.wallet != undefined) {
      var login = true;
    } else {
      var login = false;
    }
    defaultLocals(req, res);
    res.render("views/collection", {
      nfts: nfts,
      unlistedNfts: unlistedNfts,
      collectionDetails: collectionDetails,
      collection_logo: collection_logo,
      collection_banner: collection_banner,
      floor: floorPrice,
      items: items,
      wallet: wallet,
      login: login,
    });
  } else res.redirect("collection?page=0");
});
server.get("/collections", speedLimiter, async (req, res) => {
  var collections = await mongoClient.query.getCollections();
  //make script to fetch 3 images from the collection to display on the collection page using the issuer address.
  for (var i = 0; i < collections.length; i++) {
    collections[i].sampleImages =
      await mongoClient.query.getRandomCollectionImages(
        collections[i].name,
        collections[i].issuer
      );
  }
  collections = appendColletionsImagesUrls(collections);
  for (var i = 0; i < collections.length; i++) {
    collections[i].numberOfNFTs = await mongoClient.query.totalCollectionItems(
      collections[i].name,
      collections[i].issuer
    );
  }
  defaultLocals(req, res);
  res.render("views/collections", {
    collections: collections,
  });
});
server.get("/create-collection", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/create-collection");
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
server.get("/redeem", speedLimiter, async (req, res) => {
  if (req.session.login) {
    defaultLocals(req, res);
    const getAssets = await mongoClient.query.redeemAssets();
    const ocwBalance = await xumm.xrpl.getOcwBalance(
      req.session.wallet,
      req.useragent.isMobile
    );
    ocwBalance
      ? res.render("views/redeem", {
          ocwBalance: ocwBalance[0],
          obtainableNfts: ocwBalance[1],
          tokens: getAssets,
        })
      : res.render("views/redeem", {
          ocwBalance: 0,
          obtainableNfts: 0,
          tokens: getAssets,
        });
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
  nftsPromise = new Promise(function (resolve, reject) {
    const nfts = mongoClient.query.getNfts(5);
    resolve(nfts);
  });
  const promises = await Promise.all([nftPromise, nftsPromise]);
  if (promises[0].uriMetadata.collection.name !== null) {
    var nftCollection = promises[0].uriMetadata.collection.name
      .toLowerCase()
      .replace(" ", "_");
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
      isOwner: isOwner,
      nft: promises[0],
      nfts: promises[1],
      collection_logo: collection_logo,
    });
  } else next();
});
server.get("/mint", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/mint");
});
server.get("/search", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  const searchResults = await mongoClient.query.getSearchResultsJSON(
    req.query.q
  );
  const searchedItem = req.query.q;
  res.render("views/search", {
    res: searchResults,
    searchedItem: searchedItem,
  });
});
server.get("/create-collection", speedLimiter, async (req, res) => {
  var isVerified = await mongoClient.query.verified(req.query.wallet)
  if (isVerified) {
    defaultLocals(req, res);
    res.render("views/create-collection");
  }
})

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
server.post("/redeem-nft-payload", speedLimiter, async (req, res) => {
  const payload = await xumm.payloads.redeemNftPayload(
    req.session.wallet,
    req.useragent.isMobile,
    req.body.return_url,
    req.body.ipAddress
  );
  res.status(200).send(payload);
  const result = await xumm.subscriptions.watchSubscripion(payload);
});
server.post("/redeem-nft-subscription", speedLimiter, async (req, res) => {
  const payload = await xumm.subscriptions.redeemNftSubscription(req, res);
  // console.log(payload);
  // const result = await xumm.subscriptions.watchSubscripion(payload);
  // console.log(result);
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
server.post("/create-collection",
  upload.fields([{name: "collection-logo", maxCount: 1}, {name: "cover-img", maxCount: 1}]),
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
      console.log('uploaded logo')
      }
      if (formDataFiles["cover-img"]) {
        if (
          (result = await digitalOcean.functions.uploadCollectionBanner(
            req,
            formDataFiles["cover-img"][0]
          ))
        )
      result = true;
      console.log('uploaded banner')
      }
    }
    if (
      await mongoClient.query.createCollection(
        formDataBody["name"],
        formDataBody["brand"],
        formDataBody["url"],
        formDataBody["issuer"],
        formDataBody["description"],
      )
    )
    console.log('done')
    result = true;
    result ? res.status(200).send("Modified") : res.status(500).send("Failed");
  }
)
server.post(
  "/update-user",
  upload.fields([{ name: "profile-img", maxCount: 1 }, { name: "cover-img" }]),
  speedLimiter,
  async (req, res) => {
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
server.post("/list-nft-payload", async (req, res, next) => {
  if (req.session.login) {
    console.log(req.body);
    const payload = await xumm.payloads.listNftPayload(
      process.env.XRPL_ISSUER_PAYMENT_ADDRESS,
      req.session.wallet,
      process.env.LISTING_PRICE,
      req.useragent.isMobile,
      req.body.return_url
    );
    console.log(payload);
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
server.post("/mint-NFToken", async (req, res, next) => {
  console.log(req.body);
});

server.get("/get-account-unlisted-nfts", speedLimiter, async (req, res) => {
  var wallet;
  var unlistedNfts = [];
  var unlistedNftsToReturn = [];
  if (req.query.wallet) wallet = req.query.wallet;
  else wallet = req.session.wallet;
  const marker = req.query.marker;
  const nfts = await xumm.xrpl.getAccountsNfts(wallet, NFTSPERPAGE, marker);
  for (let nft of nfts[0]) {
    const returnedNft = await mongoClient.query.getNft(nft.NFTokenID);
    if (returnedNft == null) unlistedNfts.push(nft);
  }
  for (var i = 0; i < unlistedNfts.length; i++) {
    var queuedIDFinder = await mongoClient.query.checkQueue(
      unlistedNfts[i].NFTokenID
    );
    var theNFT = unlistedNfts[i].NFTokenID;
    if (queuedIDFinder == null) {
      //check to see if the NFT isn't in the queue for listing with !==.
      const data = await xumm.xrpl.getNftImage(unlistedNfts[i].URI);
      if (data) {
        unlistedNftsToReturn[i] = data;
        unlistedNftsToReturn[i].taxon = unlistedNfts[i].NFTokenTaxon;
        unlistedNftsToReturn[i].issuer = unlistedNfts[i].Issuer;
        unlistedNftsToReturn[i].currentHolder = wallet;
        unlistedNftsToReturn[i].NFTokenID = unlistedNfts[i].NFTokenID;
      }
    }
    var rawData = unlistedNfts[i];
  }
  res.render("views/models/unlisted-nft-rows.ejs", {
    wallet: wallet,
    rawData: rawData,
    nfts: unlistedNftsToReturn,
  });
});
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
server.get("/get-additional-unlisted-nfts", speedLimiter, async (req, res) => {
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
    var collectionName = req.query.name;
    const issuer = req.query.issuer;
    var marker = req.query.marker;
    var iteration = req.query.markerIteration;
    var returnData = [];
    if (marker && iteration) {
      const nfts = await mongoClient.query.getNftsByCollection(
        collectionName,
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
      res.render("views/models/nft-rows-load", { nfts: await promiseNfts });
    }
    res.status(400).send();
  }
);
server.get("/get-token-balance", speedLimiter, async (req, res) => {
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
  balance = balance.toFixed(2);
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
});
server.use(function (err, req, res, next) {
  if (err.code !== "EBADCSRFTOKEN") return next(err);

  // handle CSRF token errors here
  console.log(err);
  res.status(403).render("views/500.ejs");
});
server.use((err, req, res, next) => {
  console.error(err);
  defaultLocals(req, res);
  res.status(500).render("views/500.ejs");
});
// try {
//   serverSecure = proxiedHttps.createServer(
//     {
//       key: fs.readFileSync(
//         `${process.env.SSL_CERTIFICATE_PATH}priv.key`,
//         "utf8"
//       ),
//       cert: fs.readFileSync(
//         `${process.env.SSL_CERTIFICATE_PATH}chain.pem`,
//         "utf8"
//       ),
//       ca: fs.readFileSync(`/opt/OCM/root.pem`, "utf8"),
//     },
//     server
//   );
//   serverSecure.listen(443, () => {
//     console.log("Server Listening on Port 443");
//   });
// } catch (err) {
//   console.warn("SSL not found");
// }
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

function defaultLocals (req, res) {
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
      collection.name
    );
    const collection_banner = digitalOcean.functions.getCollectionBannerLink(
      collection.name
    );
    collection["banner_url"] = collection_banner;
    collection["logo_url"] = collection_logo;
  });
  return collections;
}

function appendToUrl(url, parameters, path) {
  const parsedUrl = new URLSearchParams(url);
  console.log();
  parameters.forEach((parameter) => {
    parsedUrl.set(parameter.key, parameter.value);
  });
  return path + "?" + parsedUrl.toString();
}

//* Main serverlication, run this to run the serverlication
//! ---------------------Imports modules/packages--------------------------------//
require("dotenv").config();
const express = require("express");
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
const mongoStore = new MongoDBStore({
  uri: process.env.MONGO_URI,
  databaseName: "Sessions",
  collection: "Sessions",
});
const csrfProtection = csurf({});
const speedLimiter = slowDown({
  windowMs: 10 * 60 * 1000, // 10 minutes
  delayAfter: 100,
  delayMs: 500,
});
const NFTSPERPAGE = 25;
//! ---------------------Imported middleware--------------------------------//
const server = express();

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
    cookie: { secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 }, // ms/s, s/m, m/h, h/d, d/mnth
    store: mongoStore,
  })
);
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
  "220.253.105.253",  //Liam
  "116.206.228.204",
];
//! ---------------------Custom middleware--------------------------------//
server.use((req, res, next) => {
  checkViews(req, next); // Increments session.views by one every time user interacts with website
});
server.get("*", speedLimiter, (req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://onchainmarketplace.net/"
  );
  res.setHeader("Cross-Origin-Embedder-Policy", "same-origin");
  if (
    req.path != "/node" &&
    !authorizedIps.includes(req.header("x-forwarded-for"))
  ) {
    defaultLocals(req, res);
    res.status(404).render("views/404.ejs");
  } else next();
});

//! ---------------------Browser endpoints--------------------------------//
server.get("/", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  res.render("views/");
});
server.get("/explore", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  var nfts;
  const page = parseInt(req.query.page);
  const filter = {
    likesSort: req.query.likesSort,
    issuerNameFilter: req.issuerNameFilter,
    extrasFilter: req.query.extrasFilter,
    collectionsFilter: req.query.collectionsFilter,
    minPriceFilter: req.query.minPriceFilter,
    maxPriceFilter: req.query.maxPriceFilter,
  };
  if (!isNaN(page)) {
    promiseNfts = new Promise(function (resolve, reject) {
      resolve(mongoClient.query.getNfts(NFTSPERPAGE, page));
    });
    promiseVerifiedIssuers = new Promise(function (resolve, reject) {
      resolve(mongoClient.query.getVerifiedIssuers());
    });
    const promises = await Promise.all([promiseNfts, promiseVerifiedIssuers]);
    res.render("views/explore", {
      nfts: promises[0],
      page: page,
      verifiedIssuers: promises[1],
    });
  } else res.redirect("explore?page=0");
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
server.get("/collection", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/collection");
});
server.get("/collections", speedLimiter, async (req, res) => {
  var collections = await mongoClient.query.getCollections();
  collections = appendColletionsImagesUrls(collections);

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
    const ocwBalance = await xumm.xrpl.getOcwBalance(
      req.session.wallet,
      req.useragent.isMobile
    );
    ocwBalance
      ? res.render("views/redeem", {
          ocwBalance: ocwBalance[0],
          obtainableNfts: ocwBalance[1],
        })
      : res.render("views/redeem", {
          ocwBalance: 0,
          obtainableNfts: 0,
        });
  } else res.status(401).redirect("/");
});
server.get("/profile", speedLimiter, async (req, res) => {
  var wallet;
  if (req.query.wallet) wallet = req.query.wallet;
  else {
    if (!req.session.login) res.status(401).redirect("/");
    else {
      wallet = req.session.wallet;
    }
  }
  defaultLocals(req, res);
  const profile_pic = digitalOcean.functions.getProfileLink(wallet);
  nftsPromise = new Promise(function (resolve, reject) {
    const nfts = xumm.xrpl.getAccountsNfts(wallet);
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
  const ownerNfts = await mongoClient.query.getOwnerNfts(wallet, promises[0]);
  res.render("views/profile", {
    nfts: ownerNfts,
    user: promises[1],
    profile_pic: profile_pic,
    buyOffers: promises[2][1],
    sellOffers: promises[2][0],
    likedNfts: promises[3],
  });
});
server.get("/edit-profile", speedLimiter, async (req, res) => {
  if (req.session.login) {
    defaultLocals(req, res);
    const profile_pic = digitalOcean.functions.getProfileLink(
      req.session.wallet
    );
    res.render("views/edit-profile", { profile_pic: profile_pic });
  } else res.status(401).redirect("/");
});
server.get("/product-details", speedLimiter, async (req, res, next) => {
  defaultLocals(req, res);
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
  const nftCollection = promises[0].uriMetadata.collection.name.toLowerCase().replace(' ', '_');
  const collection_logo = digitalOcean.functions.getProductCollectionLogoLink(nftCollection);
  if (promises[0]) {
    res.render("views/product-details", {
      nft: promises[0],
      nfts: promises[1],
      collection_logo: collection_logo
    });
  } else next();
});
server.get("/create-listing", speedLimiter, (req, res) => {
  defaultLocals(req, res);
  res.render("views/create-listing");
});
server.get("/search", speedLimiter, async (req, res) => {
  defaultLocals(req, res);
  const searchResults = await mongoClient.query.getSearchResultsJSON(
    req.query.q
  );
  res.render("views/search", { res: searchResults });
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
  const payload = await xumm.payloads.NFTokenCreateOffer(
    NFToken,
    value,
    req.useragent.isMobile,
    req.body.return_url
  );
  res.status(200).send(payload);
});
server.post("/subscription-transaction", speedLimiter, async (req, res) => {
  xumm.subscriptions.transactionSubscription(req, res);
});
server.post("/NFTokenAcceptOffer", speedLimiter, async (req, res) => {
  const owner = await xumm.xrpl.getcurrentNftHolder(req.body.NFToken);
  if (owner == req.session.wallet) {
    const payload = await xumm.payloads.NFTokenAcceptOffer(
      req.body.index,
      req.useragent.isMobile,
      req.body.return_url
    );
    res.status(200).send(payload);
  } else res.sendStatus(400);
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
      req.body.fee,
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
server.post("/list-nft-subscription", async (req, res, next) => {
  const result = await xumm.subscriptions.listNftSubscription(req, res);
  var permanent = false;
  if (req.body.fee == "1") permanent = true;
  if (result) {
    mongoClient.query.addNftToQueried(
      req.body.NFTokenID,
      req.session.wallet,
      permanent,
      req.body.issuer
    );
  }
});
server.get("/get-account-unlisted-nfts", speedLimiter, async (req, res) => {
  var wallet;
  var unlistedNfts = [];
  var unlistedNftsToReturn = [];
  if (req.query.wallet) wallet = req.query.wallet;
  else wallet = req.session.wallet;
  const nfts = await xumm.xrpl.getAccountsNfts(wallet);
  for (let nft of nfts) {
    const returnedNft = await mongoClient.query.getNft(nft.NFTokenID);
    if (returnedNft == null) unlistedNfts.push(nft);
  }
  for (var i = 0; i < unlistedNfts.length; i++) {
    const data = await xumm.xrpl.getNftImage(unlistedNfts[i].URI);
    unlistedNftsToReturn[i] = data;
    unlistedNftsToReturn[i].taxon = unlistedNfts[i].NFTokenTaxon;
    unlistedNftsToReturn[i].issuer = unlistedNfts[i].Issuer;
    unlistedNftsToReturn[i].currentHolder = wallet;
    unlistedNftsToReturn[i].NFTokenID = unlistedNfts[i].NFTokenID;
  }
  res.render("views/models/unlisted-nft-rows.ejs", {
    nfts: unlistedNftsToReturn,
  });
});
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
  res.status(403).render("views/500.ejs");
});
server.use((err, req, res, next) => {
  console.error(err);
  defaultLocals(req, res);
  res.status(500).render("views/500.ejs");
});
try {
  serverSecure = proxiedHttps.createServer(
    {
      key: fs.readFileSync(
        `${process.env.SSL_CERTIFICATE_PATH}privkey.pem`,
        "utf8"
      ),
      cert: fs.readFileSync(
        `${process.env.SSL_CERTIFICATE_PATH}fullchain.pem`,
        "utf8"
      ),
    },
    server
  );
  serverSecure.listen(443, () => {
    console.log("Server Listening on Port 443");
  });
} catch (err) {
  console.warn("SSL not found");
}
server.listen(80, () => {
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
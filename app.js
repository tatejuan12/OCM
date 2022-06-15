//* Main serverlication, run this to run the serverlication
//! ---------------------Imports modules/packages--------------------------------//
require("dotenv").config();
const express = require("express");
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
const upload = multer({ limits: { fieldSize: "16mb" } }); //used to get form data which for some reason bodyParser doesn't get. used for user data changing!
const minifyHtml = require("express-minify-html");
const mongoStore = new MongoDBStore({
  uri: process.env.MONGO_URI,
  databaseName: "Sessions",
  collection: "Sessions",
});
const NFTSPERPAGE = 10;
//! ---------------------Imported middleware--------------------------------//
const server = express();
server.use(
  cors({
    origin: "*",
  })
);
server.use(bodyParser.json()); // for parsing serverlication/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing serverlication/x-www-form-urlencoded
server.set("view engine", "ejs"); // Setting rendering agent to ejs
server.set("views", path.join(__dirname, "/public")); // Makes views for rendering the public dir
server.use(express.static(__dirname + "/public")); // Essential so JS and CSS is acccessible by requests
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
); // Sets the use of cookies
server.use(useragent.express()); // For browser data, like if it is mobile or not
// server.use(
//   minifyHtml({
//     override: true,
//     exception_url: false,
//     htmlMinifier: {
//       removeComments: true,
//       collapseWhitespace: true,
//       collapseBooleanAttributes: true,
//       removeAttributeQuotes: true,
//       removeEmptyAttributes: true,
//       minifyJS: true,
//     },
//   })
// );
//! ---------------------Custom middleware--------------------------------//
// server.use(defaultLocals); //Custom made middleware, sends locals to ejs without having to send it manually
server.use((req, res, next) => {
  checkViews(req, next); // Increments session.views by one every time user interacts with website
});
//! ---------------------Browser endpoints--------------------------------//

server.get("/", async (req, res) => {
  defaultLocals(req, res);
  res.render("views/");
});
server.get("/explore", async (req, res) => {
  var nfts;
  const page = parseInt(req.query.page);
  if (!isNaN(page)) {
    await mongoClient.query.getNfts(NFTSPERPAGE, page).then((result) => {
      nfts = result;
    });
    defaultLocals(req, res);
    res.render("views/explore", { nfts: nfts, page: page });
  } else res.redirect("explore?page=0");
});
server.get("/about", (req, res) => {
  defaultLocals(req, res);
  res.render("views/about");
});
server.get("/verified", (req, res) => {
  defaultLocals(req, res);
  res.render("views/verified");
});
server.get("/partners", (req, res) => {
  defaultLocals(req, res);
  res.render("views/partners");
});
server.get("/collection", (req, res) => {
  defaultLocals(req, res);
  res.render("views/collection");
});
server.get("/logout", (req, res) => {
  req.session.destroy();
  defaultLocals(req, res);
  res.redirect("/");
});
server.get("/connect", (req, res) => {
  defaultLocals(req, res);
  res.render("views/connect");
});
server.get("/metadata", (req, res) => {
  defaultLocals(req, res);
  res.render("views/metadata");
});
server.get("/minting-help", (req, res) => {
  defaultLocals(req, res);
  res.render("views/minting-help");
});
server.get("/redeem", async (req, res) => {
  if (req.session.login) {
    const ocwBalance = await xumm.xrpl.getOcwBalance(
      req.session.wallet,
      req.useragent.isMobile
    );
    defaultLocals(req, res);
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
server.get("/profile", async (req, res) => {
  var wallet;
  if (req.query.wallet) wallet = req.query.wallet;
  else {
    if (!req.session.login) res.status(401).redirect("/");
    else {
      wallet = req.session.wallet;
    }
  }
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
  defaultLocals(req, res);
  res.render("views/profile", {
    nfts: ownerNfts,
    user: promises[1],
    profile_pic: profile_pic,
    buyOffers: promises[2][1],
    sellOffers: promises[2][0],
    likedNfts: promises[3],
  });
});
server.get("/edit-profile", async (req, res) => {
  if (req.session.login) {
    const profile_pic = digitalOcean.functions.getProfileLink(
      req.session.wallet
    );
    defaultLocals(req, res);
    res.render("views/edit-profile", { profile_pic: profile_pic });
  } else res.status(401).redirect("/");
});
server.get("/product-details", async (req, res, next) => {
  let nftId = req.query.id;
  nftPromise = new Promise(function (resolve, reject) {
    const nft = mongoClient.query.getNft(nftId);
    resolve(nft);
  });
  nftsPromise = new Promise(function (resolve, reject) {
    const nfts = mongoClient.query.getNfts(NFTSPERPAGE / 2, 0);
    resolve(nfts);
  });
  offersPromise = new Promise(function (resolve, reject) {
    const offers = xumm.xrpl.getnftOffers(nftId);
    resolve(offers);
  });
  ownerPromise = new Promise(function (resolve, reject) {
    const owner = xumm.xrpl.getcurrentNftHolder(nftId);
    console.log(owner);
    resolve(owner);
  });
  console.time();
  const promises = await Promise.all([
    nftPromise,
    nftsPromise,
    offersPromise,
    ownerPromise,
  ]);
  console.timeEnd();
  defaultLocals(req, res);
  res.render("views/product-details", {
    nft: promises[0],
    nfts: promises[1],
    buyOffers: promises[2][1],
    sellOffers: promises[2][0],
    owner: promises[3],
    owner_pic: digitalOcean.functions.getProfileLink(promises[3]),
  });
});
server.get("/create-listing", (req, res) => {
  defaultLocals(req, res);
  res.render("views/create-listing");
});
server.get("/search", async (req, res) => {
  const searchResults = await mongoClient.query.getSearchResultsJSON(
    req.query.q
  );
  defaultLocals(req, res);
  res.render("views/search", { res: searchResults });
});

//! ---------------------OCW API--------------------------------//
server.post("/payload", async (req, res) => {
  const payload = await getPayload(req.body);

  res.send(payload);
});
server.post("/transaction-payload", async (req, res) => {
  const NFToken = req.body.NFToken;
  const value = req.body.value;
  const payload = await xumm.payloads.transactionPayload(
    NFToken,
    value,
    req.useragent.isMobile,
    req.body.return_url
  );
  res.status(200).send(payload);
});
server.post("/subscription-transaction", async (req, res) => {
  xumm.subscriptions.transactionSubscription(req, res);
});
server.post("/accept-buy-offer", async (req, res) => {
  const owner = await xumm.xrpl.getcurrentNftHolder(req.body.NFToken);
  if (owner == req.session.wallet) {
    const payload = await xumm.payloads.acceptBuyOfferPayload(
      req.body.index,
      req.useragent.isMobile,
      req.body.return_url
    );
    res.status(200).send(payload);
  } else res.sendStatus(400);
});

server.post("/sign-in-payload", async (req, res) => {
  const payload = await xumm.payloads.signInPayload(
    req.useragent.isMobile,
    req.body.return_url
  );
  res.send(payload);
});
server.post("/sign-in-subscription", async (req, res) => {
  const result = await xumm.subscriptions.signInSubscription(req, res);
  if (result) {
    mongoClient.query.initiateUser(req.session.wallet);
  }
});
server.post("/redeem-nft-payload", async (req, res) => {
  const payload = await xumm.payloads.redeemNftPayload(
    req.session.wallet,
    req.useragent.isMobile,
    req.body.return_url
  );
  res.status(200).send(payload);
  console.log(payload);
  const result = await xumm.subscriptions.watchSubscripion(payload);
});
server.post("/redeem-nft-subscription", async (req, res) => {
  const payload = await xumm.subscriptions.redeemNftSubscription(req, res);
  // console.log(payload);
  // const result = await xumm.subscriptions.watchSubscripion(payload);
  // console.log(result);
});
server.post("/increment-like", async (req, res) => {
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
server.post("/decrement-like", async (req, res) => {
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
server.post("/report-nft", upload.any(), async (req, res) => {
  const formData = req.body;
  const result = await mongoClient.query.reportNft(
    formData["token-id"],
    formData["message"],
    req.session.login,
    req.session.wallet
  );
  result ? res.status(200).send("Modified") : res.status(500).send("Failed");
});
server.get("/get-account-unlisted-nfts", async (req, res) => {
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

//! ---------------------Server Essentials--------------------------------//
// Renders 404                                                     page if the request is send to undeclared location
server.use((req, res, next) => {
  res.status(404).render("views/404.ejs");
});
server.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("views/500.ejs");
});
server.listen(80, () => {
  console.log("Server Listening");
});

//! ---------------------Custom functions--------------------------------//
function checkViews(req, next) {
  try {
    if (!req.session.views || req.session.views == undefined)
      req.session.views = 1;
    else req.session.views += 1;
  } catch (err) {
    console.error("Error settings views:\n" + err);
  } finally {
    next();
  }
}

function defaultLocals(req, res) {
  try {
    var login =
      req.session.login != undefined && req.session ? req.session.login : false;
    var wallet = req.session.wallet != null ? req.session.wallet : false;
    var mobile = req.useragent.isMobile;
    req.session.login = login;
    res.locals.login = login;
    res.locals.wallet = wallet;
    res.locals.mobile = mobile;
    res.locals.url = req.path;
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

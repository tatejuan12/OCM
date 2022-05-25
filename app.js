//* Main application, run this to run the application
//! ---------------------Imports modules/packages--------------------------------//
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const logger = require("express-logger");
const { TxData } = require("xrpl-txdata");
const useragent = require("express-useragent");
const verifySignature = new TxData();
const { XummSdk } = require("xumm-sdk");
const cors = require("cors");
const sdk = new XummSdk(
  "b58d7023-14f2-4b64-a804-1c5d50215d6a",
  "aeb73f38-4288-46dd-9c03-2a8c13635d09"
);
const digitalOcean = require("./digitalOceanFunctions");
//Imports the mongo queries and code
const mongoClient = require("./mongo");
//Imports xumm code with queries and checks
const xumm = require("./xummFunctions");
const { log } = require("console");
let multer = require("multer");
let upload = multer({ limits: { fieldSize: "2mb" } }); //used to get form data which for some reason bodyParser doesn't get. used for user data changing!
const mongoStore = new MongoDBStore({
  uri: "mongodb+srv://ocw:9T6YNSUEh61zgCB6@ocw-test.jgpcr.mongodb.net/NFT-Devnet?retryWrites=true&w=majority",
  collection: "Sessions",
});
const NFTSPERPAGE = 10;
//! ---------------------Imported middleware--------------------------------//
const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set("view engine", "ejs"); // Setting rendering agent to ejs
app.set("views", path.join(__dirname, "/public")); // Makes views for rendering the public dir
app.use(express.static(__dirname + "/public")); // Essential so JS and CSS is acccessible by requests
app.use(logger({ path: __dirname + "/logs/logs.log" })); // Logs data, every connection will log browser info and request url
app.use(
  session({
    secret: "some secret",
    resave: true,
    saveUninitialized: true,
    //! change to secure true once hosting
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 30 }, // ms/s, s/m, m/h, h/p, d/mnth
    store: mongoStore,
  })
); // Sets the use of cookies
app.use(useragent.express()); // For browser data, like if it is mobile or not
//! ---------------------Custom middleware--------------------------------//
app.use(defaultLocals); //Custom made middleware, sends locals to ejs without having to send it manually
app.use((req, res, next) => {
  checkViews(req, next); // Increments session.views by one every time user interacts with website
});
//! ---------------------Browser endpoints--------------------------------//
app.get("/", (req, res) => {
  res.render("views/");
});
app.get("/explore", async (req, res) => {
  var nfts;
  const page = parseInt(req.query.page);
  if (!isNaN(page)) {
    await mongoClient.query.getNfts(NFTSPERPAGE, page).then((result) => {
      nfts = result;
    });
    res.render("views/explore", { nfts: nfts, page: page });
  } else res.redirect("explore?page=0");
});
app.get("/about", (req, res) => {
  res.render("views/about");
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
app.get("/connect", (req, res) => {
  res.render("views/connect");
});
app.get("/redeem", async (req, res) => {
  const ocwBalance = await xumm.xrpl.getOcwBalance(req.session.wallet);
  ocwBalance
    ? res.render("views/redeem", {
        ocwBalance: ocwBalance[0],
        obtainableNfts: ocwBalance[1],
      })
    : res.render("views/redeem", {
        ocwBalance: 0,
        obtainableNfts: 0,
      });
});
app.get("/profile", async (req, res) => {
  var ownerNfts;
  var userInfo;
  nftsPromise = new Promise(function (resolve, reject) {
    const ownerNfts = mongoClient.query.getOwnerNfts(req.session.wallet);
    resolve(ownerNfts);
  });
  userPromise = new Promise(function (resolve, reject) {
    console.time();
    const ownerInfo = mongoClient.query.getUser(req.session.wallet);
    resolve(ownerInfo);
  });
  const promises = await Promise.all([nftsPromise, userPromise]);
  //   var obj = {
  //     name: promises[0][0].originalname,
  //     img: {
  //         data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
  //         contentType: 'image/png'
  //     }
  // }
  // var thumb = new Buffer.is(promises[1].profile_img.buffer);
  // console.log(promises[1].profile_img.buffer);
  res.render("views/profile", { nfts: promises[0], user: promises[1] });
  console.timeEnd();
});
app.get("/edit-profile", (req, res) => {
  res.render("views/edit-profile");
});
app.get("/product-details", async (req, res) => {
  let nftId = req.query.id;
  var nft;
  nftPromise = new Promise(function (resolve, reject) {
    const nft = mongoClient.query.getNft(nftId);
    resolve(nft);
  });
  nftsPromise = new Promise(function (resolve, reject) {
    const nfts = mongoClient.query.getNfts(NFTSPERPAGE / 2, 0);
    resolve(nfts);
  });

  const promises = await Promise.all([nftPromise, nftsPromise]);
  res.render("views/product-details", {
    nft: promises[0],
    nfts: promises[1],
  });
});
app.get("/create-listing", (req, res) => {
  res.render("views/create-listing");
});
//! ---------------------OCW API--------------------------------//
app.post("/payload", async (req, res) => {
  const payload = await getPayload(req.body);

  res.send(payload);
});
app.post("/subscription-transaction", async (req, res) => {
  xumm.subscriptions.transactionSubscription(req, res);
});

app.post("/sign-in-payload", async (req, res) => {
  const payload = await xumm.payloads.signInPayload(
    req.originalUrl,
    req.useragent.isMobile
  );
  res.send(payload);
});
app.post("/sign-in-subscription", async (req, res) => {
  const result = await xumm.subscriptions.signInSubscription(req, res);
  if (result) {
    mongoClient.query.initiateUser(req.session.wallet);
  }
});
app.post("/redeem-nft-payload", async (req, res) => {
  const payload = await xumm.payloads.redeemNftPayload(
    req,
    res,
    res.locals.wallet
  );
  res.status(200).send(payload);
});
app.post("/redeem-nft-subscription", async (req, res) => {
  xumm.subscriptions.redeemNftSubscription(req, res);
});
app.post("/increment-like", async (req, res) => {
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
app.post("/decrement-like", async (req, res) => {
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
app.post(
  "/update-user",
  upload.fields([{ name: "profile-img", maxCount: 1 }, { name: "cover-img" }]),
  async (req, res) => {
    const formDataBody = req.body;
    const formDataFiles = req.files;
    var result = false;
    if (formDataFiles) {
      console.log("run!");
      if (formDataFiles["profile-img"])
        result = digitalOcean.functions.uploadProfile(
          req,
          formDataFiles["profile-img"][0]
        );
      if (formDataFiles["cover-img"])
        result = digitalOcean.functions.uploadCover(
          req,
          formDataFiles["cover-img"][0]
        );
    }
    result ? res.status(200).send("Modified") : res.status(500).send("Failed");
  }
);
// Renders 404 page if the request is send to undeclared location
app.use((req, res, next) => {
  res.status(404).render("views/404.ejs");
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("views/500.ejs");
});
app.listen(80, () => {
  console.log("Server Listening");
});

//! ---------------------Custom functions--------------------------------//
function checkViews(req, next) {
  try {
    if (!req.session.views) req.session.views = 1;
    else req.session.views += 1;
  } catch (err) {
    console.error("Error settings views:\n" + err);
  } finally {
    next();
  }
}
function defaultLocals(req, res, next) {
  try {
    var login = req.session.login != null ? req.session.login : false;
    var wallet = req.session.wallet != null ? req.session.wallet : false;
    var mobile = req.useragent.isMobile;
    res.locals.login = login;
    res.locals.wallet = wallet;
    res.locals.mobile = mobile;
    res.locals.url = req.path;
  } catch (err) {
    console.error("Error settings locals: " + err);
  } finally {
    next();
  }
}
function getPayload(request) {
  const payload = sdk.payload.create(request);

  return payload;
}

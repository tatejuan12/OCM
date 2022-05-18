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
  "621ce94c-d791-48ec-aa47-eeaf510b8d55",
  "5a809cea-021f-4bc9-aec5-9286508dd44d"
);
//Imports the mongo queries and code
const mongoClient = require("./mongo.js");
//Imports xumm code with queries and checks
const xumm = require("./xummFunctions");

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
app.get("/profile-bak", (req, res) => {
  res.render("views/profilebak");
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
app.get("/redeem", (req, res) => {
  res.render("views/redeem");
});
app.get("/profile", async (req, res) => {
  var ownerNfts;
  await mongoClient.query.getOwnerNfts(req.session.wallet).then((result) => {
    ownerNfts = result;
  });
  res.render("views/profile", { nfts: ownerNfts });
});
app.get("/edit-profile", (req, res) => {
  res.render("views/edit-profile");
});
app.get("/product-details", async (req, res) => {
  let nftId = req.query.id;
  var nft;
  await mongoClient.query.getNft(nftId).then((result) => {
    nft = result;
  });
  res.render("views/product-details", { nft: nft });
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
  const payload = await xumm.payloads.signInPayload();
  res.send(payload);
});
app.post("/sign-in-subscription", async (req, res) => {
  xumm.subscriptions.signInSubscription(req, res);
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
// Renders 404 page if the request is send to undeclared location
app.use((req, res, next) => {
  res.status(404).render("views/404.ejs");
});
app.listen(80, () => {
  console.log("Server2 listening successfuly");
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

const express = require("express");
const res = require("express/lib/response");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const fs = require("fs");
const MongoDBStore = require("connect-mongodb-session")(session);
const logger = require("express-logger");
// const verifySignature = require("verify-xrpl-signature").verifySignature;
const { TxData } = require("xrpl-txdata");
const useragent = require("express-useragent");
const mongoClient = require("./mongo.js");

const verifySignature = new TxData();
// const wildcardExpress = require("@wildcard-api/server/express");
// import "./endpoints.js";

const { XummSdk } = require("xumm-sdk");
const cors = require("cors");
const sdk = new XummSdk(
  "621ce94c-d791-48ec-aa47-eeaf510b8d55",
  "5a809cea-021f-4bc9-aec5-9286508dd44d"
);
mongoClient.query.getNFT().then((data) => {
  console.log(data);
});
const mongoStore = new MongoDBStore({
  uri: "mongodb+srv://ocw:9T6YNSUEh61zgCB6@ocw-test.jgpcr.mongodb.net/NFT-Devnet?retryWrites=true&w=majority",
  collection: "Sessions",
});
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
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 1 },
    store: mongoStore,
  })
); // Sets the use of cookies
app.use(useragent.express()); // For browser data, like if it is mobile or not
app.use(defaultLocals); //Custom made middleware, sends locals to ejs without having to send it manually
app.post("/payload", async (req, res) => {
  const payload = await getPayload(req.body);

  res.send(payload);
});
app.post("/subscription-transaction", async (req, res) => {
  const subscription = false;
  try {
    subscription = await sdk.payload.subscribe(req.body, (event) => {
      console.log(event.data);
      if (event.data.signed) {
        verifySignature.getOne(event.data.txid).then((data) => {
          console.log("Transaction verification:" + data.result);
          res.send(data);
          console.log("TXID: " + event.data.txid);
          return true;
        });
        event.resolve();
      } else if (event.data.signed == false) {
        res.send("Transaction was cancelled or expired!");
        return true;
      }
    });
  } catch (error) {
    console.error("There was an error with the payload: \n" + error);
  }
  console.log(subscription);
});

app.post("/sign-in-subscription", async (req, res) => {
  var subscription = false;
  try {
    subscription = await sdk.payload.subscribe(req.body, (event) => {
      if (event.data.signed) {
        console.log("User signed in: " + event.data.payload_uuidv4);
        sdk.payload.get(event.data.payload_uuidv4).then((data) => {
          req.session.login = true;
          req.session.wallet = data.response.account;
          req.session.user_token = data.application.issued_user_token;
          res.status(200).send(true);
          event.resolve;
          return true;
        });
      } else if (event.data.signed == false) {
        res.status(401).send(false);
        return true;
      }
    });
  } catch (error) {
    console.error("There was an error with the payload: \n" + error);
  }
});
app.post("/sign-in-payload", async (req, res) => {
  const request = {
    options: {
      submit: false,
      expire: 240,
      return_url: {
        app: "http://172.105.169.145",
      },
    },
    txjson: {
      TransactionType: "SignIn",
    },
  };
  const payload = await getPayload(request);
  console.log(payload);
  res.send(payload);
});
function getPayload(request) {
  const payload = sdk.payload.create(request);

  return payload;
}

app.get("/", (req, res) => {
  console.log(req.url);
  checkViews(req);
  res.render("views/index");
});
app.get("/explore", (req, res) => {
  res.render("views/explore");
});
app.get("/about", (req, res) => {
  res.render("views/about");
});
app.get("/contact", (req, res) => {
  res.render("views/contact");
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
app.listen(80, () => {
  console.log("Server2 listening successfuly");
});

function checkViews(req) {
  if (!req.session.views) req.session.views = 1;
  else req.session.views += 1;
}
function defaultLocals(req, res, next) {
  res.locals.login = req.session.login;
  res.locals.wallet = req.session.wallet;
  res.locals.mobile = req.useragent.isMobile;
  next();
}

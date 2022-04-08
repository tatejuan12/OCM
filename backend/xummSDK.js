const express = require("express");
const res = require("express/lib/response");
const bodyParser = require("body-parser");
const http = require("http");
var path = require("path");
var session = require("express-session");

// const verifySignature = require("verify-xrpl-signature").verifySignature;
const { TxData } = require("xrpl-txdata");

const verifySignature = new TxData();
// const wildcardExpress = require("@wildcard-api/server/express");
// import "./endpoints.js";

const { XummSdk } = require("xumm-sdk");
const cors = require("cors");
const { cookie } = require("express/lib/response");
const sdk = new XummSdk(
  "621ce94c-d791-48ec-aa47-eeaf510b8d55",
  "5a809cea-021f-4bc9-aec5-9286508dd44d"
);
const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(
  session({
    secret: "some secret",
    resave: false,
    saveUninitialized: true,
    //! change to secure true once hosting
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 1 },
  })
);
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
      console.log(event.data);
      if (event.data.signed) {
        console.log("User signed in: " + event.data.payload_uuidv4);
        sdk.payload.get(event.data.payload_uuidv4).then((data) => {
          console.log("The data is");
          console.log(data);
          return true;
        });
        res.send(event.data);
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
app.post("/sign-in-payload", async (req, res) => {
  const request = {
    TransactionType: "SignIn",
  };
  const payload = await getPayload(request);
  res.send(payload);
});
app.get("/", (req, res) => {
  res.redirect("http://172.105.169.145:3001/");
});
app.listen(80, () => {
  console.log("Server listening ");
});

function getPayload(request) {
  const payload = sdk.payload.create(request);

  return payload;
}

const express = require("express");
const res = require("express/lib/response");
const bodyParser = require("body-parser");
const verifySignature = require("verify-xrpl-signature").verifySignature;
// const wildcardExpress = require("@wildcard-api/server/express");
// import "./endpoints.js";

const { XummSdk } = require("xumm-sdk");
const cors = require("cors");
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

app.post("/payload", async (req, res) => {
  const payload = await getTransaction(req.body);
  res.send(payload);
});
app.post("/subscription", async (req, res) => {
  await sdk.payload.subscribe(req.body, (event) => {
    console.log(event.data.signed);
    if (event.data.signed) {
      res.send(event);
      event.resolve();
    } else if (event.data.signed == false) {
      res.send("Transaction was cancelled or expired!");
      event.resolve();
    }
  });
});

app.post("/sign-in-payload", async (req, res) => {
  const request = {
    TransactionType: "SignIn",
  };
  const payload = await getPayload(request);
  res.send(payload);
});

app.listen(3001, () => {
  console.log("Listening");
});
function getPayload(request) {
  const payload = sdk.payload.create(request);

  return payload;
}

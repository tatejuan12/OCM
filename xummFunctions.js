//* Contains the Xumm functions and xrpl interactions
const { TxData } = require("xrpl-txdata");
const verifySignature = new TxData();
const { XummSdk } = require("xumm-sdk");
const sdk = new XummSdk(
  "b58d7023-14f2-4b64-a804-1c5d50215d6a",
  "aeb73f38-4288-46dd-9c03-2a8c13635d09"
);
const xrpl = require("xrpl");
const { json } = require("express/lib/response");
const issuerSeed = "sanmTNafTvtjEDNhPnsGWJWkCnVwU";

var payloads = {
  transactionPayload: async function () {},
  signInPayload: async function (path, mobile) {
    const request = {
      options: {
        submit: false,
        expire: 240,
      },
      txjson: {
        TransactionType: "SignIn",
      },
    };
    if (mobile) request.options["return_url"] = { app: "http://localhost" };
    else request.options["return_url"] = { web: "http://localhost" };
    const payload = await getPayload(request);
    return payload;
  },
  redeemNftPayload: async function (req, res, address, mobile) {
    const client = await getXrplClient();
    try {
      //wallet of issuer
      var nftWallet = xrpl.Wallet.fromSeed(issuerSeed);

      //console.log(`\nScanning NFTs held by ${nftWallet.classicAddress}`)
      //Try Select an NFT up to 5 times
      var count = 0;
      while (count < 5) {
        try {
          var accountNFTs = await client.request({
            method: "account_nfts",
            ledger_index: "validated",
            account: nftWallet.classicAddress,
            limit: 400,
          });

          var nftSelection = accountNFTs.result.account_nfts;
          var nftID =
            nftSelection[
              Math.floor(Math.random() * (nftSelection.length - 1 - 0 + 1) + 0)
            ].NFTokenID;
          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      //If could no select NFT in 5 attempts
      if (nftID == undefined) {
        //console.log('Could Not Select NFT')
        return;
      }

      //console.log(`\tRandom NFT selected -> NFTokenID: ${nftID}`);
      //set expiry of offer 5 minutes from now
      var expiry = +(Date.now() / 1000 - 946684800 + 300)
        .toString()
        .split(".")[0];

      //mint NFT
      //Try Place mint up to 5 times
      //console.log(`\nSetting Sell Or or Chosen NFT`);
      var count = 0;
      while (count < 5) {
        try {
          var nftSellPrep = await client.autofill({
            TransactionType: "NFTokenCreateOffer",
            Account: nftWallet.classicAddress,
            NFTokenID: nftID,
            Amount: "10000000",
            Flags: 1,
            Destination: address,
            Expiration: expiry,
          });
          nftSellPrep.LastLedgerSequence -= 15;
          var nftSellSigned = nftWallet.sign(nftSellPrep);
          var nftSellResult = await client.submitAndWait(nftSellSigned.tx_blob);

          if (nftSellResult.result.meta.TransactionResult == "tesSUCCESS") {
            for (a in nftSellResult.result.meta.AffectedNodes) {
              if ("CreatedNode" in nftSellResult.result.meta.AffectedNodes[a]) {
                if (
                  nftSellResult.result.meta.AffectedNodes[a].CreatedNode
                    .LedgerEntryType == "NFTokenOffer"
                ) {
                  var nftOfferIndex =
                    nftSellResult.result.meta.AffectedNodes[a].CreatedNode
                      .LedgerIndex;
                }
              }
            }
          } else {
            throw "Error wth acc";
          }
          break;
        } catch (err) {
          console.log(err);
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      //if could not sell NFT
      if (nftOfferIndex == undefined) {
        //console.log('Could Not Place order')
        return;
      }

      //console.log(`\tOffer Index: ${nftOfferIndex}`)

      //this object will be used in the Xumm object
      //this allows to generate a relevant Xumm qrCode
      const request = {
        options: {
          submit: false,
          expire: 240,
        },
        txjson: {
          TransactionType: "NFTokenAcceptOffer",
          NFTokenSellOffer: nftOfferIndex,
        },
      };
      if (mobile) request.options["return_url"] = { app: "http://localhost" };
      else request.options["return_url"] = { web: "http://localhost" };
      const payload = await getPayload(request);
      return payload;
    } catch (error) {
      return;
    } finally {
      await client.disconnect();
    }
  },
};
var subscriptions = {
  transactionSubscription: async function () {
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
  },
  signInSubscription: async function (req, res) {
    var subscription = false;
    var promise = new Promise(function (resolve) {
      subscription = sdk.payload.subscribe(req.body, (event) => {
        if (event.data.signed) {
          sdk.payload.get(event.data.payload_uuidv4).then((data) => {
            req.session.login = true;
            req.session.wallet = data.response.account;
            req.session.user_token = data.application.issued_user_token;
            console.log(
              "User signed in: " + data.application.issued_user_token
            );
            res.status(200).send(true);
            resolve(true);
          });
        } else if (event.data.signed == false) {
          res.status(401).send(false);
          resolve(false);
        }
      });
    });
    try {
      await promise;
      return promise;
    } catch (error) {
      console.error("There was an error with the payload: \n" + error);
    }
  },
  redeemNftSubscription: async function (req, res) {
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
  },
};
var xrpls = {
  getnftOffers: async function (tokenId) {
    const client = await getXrplClient();
    try {
      //get all buy and sell offers
      var offers = [];
      var methodTypes = ["nft_sell_offers", "nft_buy_offers"];
      for (a in methodTypes) {
        var allOffers = [];
        var marker = "begin";
        while (marker != null) {
          try {
            if (marker == "begin") {
              var nftOffers = await client.request({
                method: methodTypes[a],
                ledger_index: "validated",
                nft_id: tokenId,
                limit: 400,
              });
            } else {
              var nftOffers = await client.request({
                method: methodTypes[a],
                ledger_index: "validated",
                nft_id: tokenId,
                marker: marker,
                limit: 400,
              });
            }
            var allOffers = allOffers.concat(nftOffers.result.offers);
            var marker = nftOffers.result.marker;
          } catch {
            var marker = null;
          }
        }

        offers.push(allOffers);
      }

      //filter sell offers into readable data for website
      var sellOffers = [];
      for (b in offers[0]) {
        //check if offer is expired
        if (offers[0][b].expiration + 946684800 <= Date.now() / 1000) continue;

        var index = offers[0][b].nft_offer_index;

        if (isNaN(offers[0][b].amount)) {
          var price = offers[0][b].amount.value;
          if (offers[0][b].amount.currency.length > 3) {
            var token = xrpl.convertHexToString(offers[0][b].amount.currency);
          } else {
            var token = offers[0][b].amount.currency;
          }
        } else {
          var price = Number(offers[0][b].amount) / 1000000;
          var token = "XRP";
        }

        var destination = offers[0][b].destination;

        var data = {
          price: price,
          token: token,
          index: index,
          destination: destination,
        };

        sellOffers.push(data);
      }

      sellOffers.sort(function (a, b) {
        return a.price - b.price;
      });

      //filter buy offers into readable data for website
      var buyOffers = [];
      for (b in offers[1]) {
        //check if offer is expired
        if (offers[1][b].expiration + 946684800 <= Date.now() / 1000) continue;

        var index = offers[1][b].nft_offer_index;

        if (isNaN(offers[1][b].amount)) {
          var price = offers[1][b].amount.value;
          if (offers[1][b].amount.currency.length > 3) {
            var token = xrpl.convertHexToString(offers[1][b].amount.currency);
          } else {
            var token = offers[1][b].amount.currency;
          }
        } else {
          var price = Number(offers[1][b].amount) / 1000000;
          var token = "XRP";
        }

        var destination = offers[1][b].destination;

        var data = {
          price: price,
          token: token,
          index: index,
          destination: destination,
        };

        buyOffers.push(data);
      }

      buyOffers.sort(function (a, b) {
        return b.price - a.price;
      });

      //return findings
      console.log(sellOffers);
      console.log(buyOffers);
      return [sellOffers, buyOffers];
    } catch (error) {
      return;
    } finally {
      await client.disconnect();
    }
  },

  getcurrentNftHolder: async function (NFTokenID, lastKnownHolder) {
    const client = await getXrplClient();
    try {
      //attempt 5 times if necessary
      var count = 0;
      while (count < 6) {
        try {
          //while the NFT location is not confirm, repeat these functions
          var account = lastKnownHolder;
          var held = false;
          var neverHeld = false;
          var burnt = false;
          while (!held && !neverHeld && !burnt) {
            //console.log(`\nChecking if ${account} Holds the NFT Currently`)

            //scan account to see if it holds the NFT
            var allNFTs = [];
            var marker = "begin";
            var held = false;
            while (marker != null && !held) {
              if (marker == "begin") {
                var accountNFTs = await client.request({
                  method: "account_nfts",
                  ledger_index: "validated",
                  account: account,
                  limit: 400,
                });
              } else {
                var accountNFTs = await client.request({
                  method: "account_nfts",
                  ledger_index: "validated",
                  account: account,
                  marker: marker,
                  limit: 400,
                });
              }

              var allNFTs = allNFTs.concat(accountNFTs.result.account_nfts);
              var marker = accountNFTs.result.marker;

              //check if account holds NFT
              for (c in allNFTs) {
                if (allNFTs[c].NFTokenID == NFTokenID) {
                  var held = true;
                  var nftData = allNFTs[c];
                }
              }
            }

            //console.log(`Retrieved ${allNFTs.length} NFTs`)

            //if this account holds the NFT, end loop here
            if (held) {
              break;
            }

            //console.log(`Does NOT Currently Hold NFT`)

            //console.log(`Checking For Transfer`)

            //scan account transaction history to find evidence of tranfer
            var PlaceMarker = "begin";
            var foundTransfer = false;
            var repeatCount = 0;
            var txCheckedCount = 0;
            while (!foundTransfer && !burnt) {
              if (PlaceMarker == "begin") {
                var history = await client.request({
                  command: "account_tx",
                  account: account,
                  limit: 400,
                  ledger_index_max: -1,
                  ledger_index_min: -1,
                });
              } else if (PlaceMarker == null) {
                var neverHeld = true;
                break;
              } else {
                var history = await client.request({
                  command: "account_tx",
                  account: account,
                  limit: 400,
                  ledger_index_max: -1,
                  ledger_index_min: -1,
                  marker: PlaceMarker,
                });
              }

              var transactions = history.result.transactions;
              var PlaceMarker = history.result.marker;

              /*
                      repeatCount += 1
                      txCheckedCount += transactions.length
                      console.log(`${repeatCount} Checking Most Recent ${txCheckedCount} transactions`)
                      */

              //loop through collected transactions
              for (a in transactions) {
                //if transaction was a fail, or if the transaction wasn't NFT related
                if (transactions[a].meta.TransactionResult != "tesSUCCESS")
                  continue;
                if (
                  transactions[a].tx.TransactionType != "NFTokenAcceptOffer" &&
                  transactions[a].tx.TransactionType != "NFTokenBurn"
                )
                  continue;

                //if the NFT was burnt
                if (transactions[a].tx.TransactionType == "NFTokenBurn") {
                  if (transactions[a].tx.NFTokenID != NFTokenID) continue;
                  var burnt = true;
                  break;
                }

                //scan the XRPL Objects for any evidence of changes
                for (b in transactions[a].meta.AffectedNodes) {
                  //check if the node is a deleted node, i.e. an XRPL object that has been deleted
                  if (
                    !transactions[a].meta.AffectedNodes[b].hasOwnProperty(
                      "DeletedNode"
                    )
                  )
                    continue;

                  //check the deleted Objec is an offer and not an NFTokenPage
                  if (
                    transactions[a].meta.AffectedNodes[b].DeletedNode
                      .LedgerEntryType != "NFTokenOffer"
                  )
                    continue;

                  //find which account retrieved the nft, dependant on whether the order was a buy or sell
                  if (
                    transactions[a].meta.AffectedNodes[b].DeletedNode
                      .FinalFields.Flags == 1
                  ) {
                    var newAccount = transactions[a].tx.Account;
                  } else {
                    var newAccount =
                      transactions[a].meta.AffectedNodes[b].DeletedNode
                        .FinalFields.Owner;
                  }

                  //double check this isn't an old order
                  if (newAccount == account) continue;

                  //triple check NFTokenID's match
                  if (
                    transactions[a].meta.AffectedNodes[b].DeletedNode
                      .FinalFields.NFTokenID != NFTokenID
                  )
                    continue;

                  var account = newAccount;
                  var foundTransfer = true;
                  break;
                }
                if (foundTransfer || burnt) break;
              }
            }
          }
          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      if (neverHeld) {
        return;
      } else if (burnt) {
        return;
      } else {
        console.log(account);
        return account;
      }
    } catch (error) {
      //console.log(error)
      return;
    } finally {
      await client.disconnect();
    }
  },
  getAccountsNfts: async function (address) {
    const client = await getXrplClient();
    try {
      //try 5 times to get an array of all account NFTs
      var count = 0;
      while (count < 5) {
        try {
          var allNFTs = [];
          var marker = "begin";
          while (marker != null) {
            //console.log("Retrieving")
            if (marker == "begin") {
              var accountNFTs = await client.request({
                method: "account_nfts",
                ledger_index: "validated",
                account: address,
                limit: 400,
              });
            } else {
              var accountNFTs = await client.request({
                method: "account_nfts",
                ledger_index: "validated",
                account: address,
                marker: marker,
                limit: 400,
              });
            }

            for (a in accountNFTs.result.account_nfts) {
              allNFTs.push(accountNFTs.result.account_nfts[a].NFTokenID);
            }
            var marker = accountNFTs.result.marker;
          }
          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }
      return allNFTs;
    } catch (error) {
      return;
    } finally {
      client.disconnect();
    }
  },
  getAccountOffers: async function (address) {
    const client = await getXrplClient();
    try {
      //try 5 times to get all account objects
      var count = 0;
      while (count < 5) {
        try {
          var allNFTokenOffers = [];
          var marker = "begin";
          while (marker != null) {
            //console.log("Retrieving")
            if (marker == "begin") {
              var accountObjects = await client.request({
                command: "account_objects",
                ledger_index: "validated",
                account: address,
                limit: 400,
              });
            } else {
              var accountObjects = await client.request({
                command: "account_objects",
                ledger_index: "validated",
                account: address,
                marker: marker,
                limit: 400,
              });
            }

            //filter out NFTokenOffer Objects
            for (a in accountObjects.result.account_objects) {
              if (
                accountObjects.result.account_objects[a].LedgerEntryType !=
                "NFTokenOffer"
              )
                continue;
              allNFTokenOffers.push(accountObjects.result.account_objects[a]);
            }
            var marker = accountObjects.result.marker;
          }
          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      //filter and narrow buy and sell offers
      var sellOffers = [];
      var buyOffers = [];

      for (a in allNFTokenOffers) {
        var index = allNFTokenOffers[a].index;
        var destination = allNFTokenOffers[a].Destination;
        var nftID = allNFTokenOffers[a].NFTokenID;

        if (isNaN(allNFTokenOffers[a].Amount)) {
          var price = allNFTokenOffers[a].Amount.value;
          if (allNFTokenOffers[a].Amount.currency.length > 3) {
            var token = xrpl.convertHexToString(
              allNFTokenOffers[a].Amount.currency
            );
          } else {
            var token = allNFTokenOffers[a].Amount.currency;
          }
        } else {
          var price = Number(allNFTokenOffers[a].Amount) / 1000000;
          var token = "XRP";
        }

        if (allNFTokenOffers[a].Expiration + 946684800 <= Date.now() / 1000) {
          var expired = true;
        } else {
          var expired = false;
        }

        var data = {
          nftID: nftID,
          price: price,
          token: token,
          index: index,
          destination: destination,
          expired: expired,
        };

        if (allNFTokenOffers[a].Flags == 1) {
          sellOffers.push(data);
        } else {
          buyOffers.push(data);
        }
      }
      return [sellOffers, buyOffers];
    } catch (error) {
      console.log(error);
      return;
    } finally {
      await client.disconnect();
    }
  },
  getOcwBalance: async function (address) {
    const client = await getXrplClientMain();
    try {
      //try to request XRPL for balances of OCW
      //the try{}catch{}, is if the address is not active on the mainnet, it returns an error
      //Try Get balance up to 5 times
      var count = 0;
      while (count < 5) {
        try {
          var xrplResponse = await client.request({
            command: "account_lines",
            account: address,
            limit: 400,
            peer: "rK9DrarGKnVEo2nYp5MfVRXRYf5yRX3mwD",
            ledger_index: "validated",
          });
          for (a in xrplResponse.result.lines) {
            if (xrplResponse.result.lines[a].currency == "OCW") {
              if (
                xrplResponse.result.lines[a].account ==
                "rK9DrarGKnVEo2nYp5MfVRXRYf5yRX3mwD"
              ) {
                var ocwHoldings = xrplResponse.result.lines[a].balance;
              }
            }
          }
          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      if (ocwHoldings == undefined) {
        return;
      }

      var ocwHoldings = sigRound(ocwHoldings, 2);

      //filter to find how many NFTs they are eligible for
      if (ocwHoldings.includes(".")) {
        var eligibleNFTs = ocwHoldings.split(".")[0];
      } else {
        var eligibleNFTs = ocwHoldings;
      }
      return [ocwHoldings, eligibleNFTs];
    } catch (error) {
      return;
    } finally {
      await client.disconnect();
    }
  },
};

function getPayload(request) {
  const payload = sdk.payload.create(request);

  return payload;
}
async function getXrplClientMain() {
  //define
  var client = new xrpl.Client("wss://s1.ripple.com/");

  //console.log("Connecting to XRPL")
  //Try Connect to XRPL
  var count = 0;
  while (count < 6) {
    if (count >= 3) {
      var client = new xrpl.Client("wss://s2.ripple.com/");
    }

    try {
      await client.connect();
      console.log(`\tConnected`);
      break;
    } catch (err) {
      //console.log(`                    Failed ${count}`)
      count += 1;
    }
  }
  return client;
}
async function getXrplClient() {
  //define
  var client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233");

  //console.log("Connecting to XRPL")
  //Try Connect to XRPL
  var count = 0;
  while (count < 6) {
    if (count >= 3) {
      var client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233");
    }

    try {
      await client.connect();
      console.log(`\tConnected`);
      break;
    } catch (err) {
      //console.log(`                    Failed ${count}`)
      count += 1;
    }
  }
  return client;
}
function sigRound(value, sigdecimals) {
  var value = value.toString();
  if (!value.includes(".")) return value;
  var split = value.split(".");
  var whole = split[0];
  var dp = split[1];

  for (var a = 0; a < dp.length; a++) {
    if (dp.charAt(a) == "0") continue;

    var number = whole + "." + "0".repeat(a) + dp.charAt(a);
    for (var b = 1; b < sigdecimals; b++) {
      if (dp.charAt(a + b) != null) {
        var num = dp.charAt(a + b);
      } else {
        var num = "0";
      }
      number += num;
    }
    break;
  }

  return number.replace(/([0-9]+(.[0-9]+[1-9])?)(.?0+$)/, "$1");
}

exports.payloads = payloads;
exports.subscriptions = subscriptions;
exports.xrpl = xrpls;

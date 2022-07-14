//* Imports getNft function to return nft from mongodb to use for getCurrentNftHolder() function
const { getNft } = require("./mongo.js").query;
//* Contains the Xumm functions and xrpl interactions
const { TxData } = require("xrpl-txdata");
const verifySignature = new TxData();
const { XummSdk } = require("xumm-sdk");
const sdk = new XummSdk(process.env.XUMM_ACCESS, process.env.XUMM_SECRET);
const xrpl = require("xrpl");
const { json } = require("express/lib/response");
const https = require("https");
const http = require("http");
var payloads = {
  NFTokenCreateOffer: async function (NFToken, value, mobile, return_url) {
    const nftOwner = await xrpls.getcurrentNftHolder(NFToken);
    try {
      value = parseInt(value);
      value = value * 1000000;
      value = value.toString();
    } catch (err) {
      console.error("Error parsing Value: " + err);
      return false;
    }
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "NFTokenCreateOffer",
        NFTokenID: NFToken,
        Owner: nftOwner,
        Amount: value,
      },
    };
    if (mobile)
      request.options["return_url"] = {
        app: return_url,
      };
    else
      request.options["return_url"] = {
        web: return_url,
      };

    const payload = await getPayload(request);
    return payload;
  },
  NFTokenAcceptOffer: async function (NFToken, value, mobile, return_url) {
    const nftOwner = await xrpls.getcurrentNftHolder(NFToken);
    try {
      value = parseInt(value);
      value = value * 1000000;
      value = value.toString();
    } catch (err) {
      console.error("Error parsing Value: " + err);
      return false;
    }
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "NFTokenCreateOffer",
        NFTokenID: NFToken,
        Owner: nftOwner,
        Amount: value,
      },
    };
    if (mobile)
      request.options["return_url"] = {
        app: return_url,
      };
    else
      request.options["return_url"] = {
        web: return_url,
      };

    const payload = await getPayload(request);
    return payload;
  },
  signInPayload: async function (mobile, return_url) {
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "SignIn",
      },
    };
    if (mobile)
      request.options["return_url"] = {
        app: return_url,
      };
    else
      request.options["return_url"] = {
        web: return_url,
      };
    const payload = await getPayload(request);
    return payload;
  },
  NFTokenAcceptOffer: async function (index, mobile, return_url) {
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "NFTokenAcceptOffer",
        NFTokenBuyOffer: index,
      },
    };
    if (mobile)
      request.options["return_url"] = {
        app: return_url,
      };
    else
      request.options["return_url"] = {
        web: return_url,
      };
    const payload = await getPayload(request);
    return payload;
  },
  NFTokenCancelOffer: async function (index, mobile, return_url) {
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "NFTokenCancelOffer",
        NFTokenOffers: [index],
      },
    };
    if (mobile)
      request.options["return_url"] = {
        app: return_url,
      };
    else
      request.options["return_url"] = {
        web: return_url,
      };
    const payload = await getPayload(request);
    return payload;
  },
  redeemNftPayload: async function (address, mobile, return_url, ipAddress) {
    var request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "NFTokenAcceptOffer",
      },
    };
    if (mobile) {
      request.options["return_url"] = {
        app: return_url,
      };
    } else
      request.options["return_url"] = {
        web: return_url,
      };
    const client = await getXrplClient();
    try {
      if (ipAddress == "OCW") {
        //wallet of issuer
        var nftWallet = xrpl.Wallet.fromSeed(process.env.XRPL_ISSUER_SEED);

        //console.log(`\nScanning NFTs held by ${nftWallet.classicAddress}`)
        //Try Select an NFT up to 5 times
        var count = 0;
        var payload = false;
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
                Math.floor(
                  Math.random() * (nftSelection.length - 1 - 0 + 1) + 0
                )
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
            var nftSellResult = await client.submitAndWait(
              nftSellSigned.tx_blob
            );

            if (nftSellResult.result.meta.TransactionResult == "tesSUCCESS") {
              for (a in nftSellResult.result.meta.AffectedNodes) {
                if (
                  "CreatedNode" in nftSellResult.result.meta.AffectedNodes[a]
                ) {
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
        request.txjson["NFTokenSellOffer"] = nftOfferIndex;
        payload = await getPayload(request);
      } else {
        const obj = await sendRequestRedeem(ipAddress, address);

        request.txjson["NFTokenSellOffer"] = obj[0].NFTokenSellOffer;
        payload = await getPayload(request);
      }
      if (payload) {
        return payload;
      } else throw "Couldn't get payload";
    } catch (error) {
      return;
    } finally {
      await client.disconnect();
    }
  },
  listNftPayload: async function (
    address,
    ownAddress,
    fee,
    mobile,
    return_url
  ) {
    const reserve = await getXrplReserve();
    const paymentAmount = (fee * reserve * 1000000).toString();
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      txjson: {
        TransactionType: "Payment",
        Account: ownAddress,
        Destination: address,
        Amount: paymentAmount,
      },
    };
    if (mobile)
      request.options["return_url"] = {
        app: return_url,
      };
    else
      request.options["return_url"] = {
        web: return_url,
      };
    const payload = await getPayload(request);
    return payload;
  },
};
var subscriptions = {
  transactionSubscription: async function () {
    const subscription = false;
    try {
      subscription = await sdk.payload.subscribe(req.body, (event) => {
        if (event.data.signed) {
          verifySignature.getOne(event.data.txid).then((data) => {
            res.send(data);
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
  watchSubscripion: async function (payload) {
    var subscription = false;
    var promise = new Promise(function (resolve, reject) {
      subscription = sdk.payload.subscribe(payload, (event) => {
        if (event.data.signed) {
          sdk.payload.get(event.data.payload_uuidv4).then((data) => {
            // res.status(200).send(true);
            resolve("Signed subscription");
          });
        } else if (event.data.signed == false) {
          // res.status(401).send(false);
          console.log("nope");
          reject("User did not sign subscription");
        }
      });
    });
    try {
      return await promise;
    } catch (error) {
      return false;
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
  listNftSubscription: async function (req, res) {
    var subscription = false;
    var promise = new Promise(function (resolve) {
      subscription = sdk.payload.subscribe(req.body.payload, (event) => {
        if (event.data.signed) {
          console.log("signed");
          resolve("signed");
        } else if (event.data.signed == false) {
          res.status(401).send(false);
          resolve(false);
        }
      });
    });
    try {
      return await promise;
    } catch (error) {
      console.error("There was an error with the payload: \n" + error);
    }
  },
};
var xrpls = {
  getNftImage: async function (nftURI, retryCount = 0) {
    var json = {};
    async function httpAPI(url, retryCount = 0) {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let body = "";
          res.on("data", (d) => {
            body += d;
          });
          res.on("end", () => {
            if (res.statusCode == 200) {
              json = JSON.parse(body);
              resolve(json);
            } else {
              reject(null);
            }
          });
        });
      });
    }
    try {
      var nftURI = xrpl.convertHexToString(nftURI);

      if (nftURI.startsWith("ipfs://")) {
        var httpURI = nftURI.replace(
          "ipfs://",
          "https://ipfs.onchainwhales.net/ipfs/"
        );
      } else if (nftURI.startsWith("https://")) {
        var httpURI = nftURI;
      } else {
        randomFunctionToThrowError();
      }

      //get metadata
      var uriMetadata = await httpAPI(httpURI);

      //find image
      if (uriMetadata.constructor != Object) {
        return httpURI;
      } else {
        if ("image" in uriMetadata) {
          var imagePointer = uriMetadata.image;

          if (imagePointer.startsWith("ipfs://")) {
            var httpImage = imagePointer.replace(
              "ipfs://",
              "https://ipfs.onchainwhales.net/ipfs/"
            );
          } else if (imagePointer.startsWith("https://")) {
            var httpImage = imagePointer;
          } else {
            randomFunctionToThrowError();
          }
        } else {
          randomFunctionToThrowError();
        }
      }
      json["http_image"] = httpImage;
      json["http_uri"] = httpURI;
      return json;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
  getnftOffers: async function (tokenId) {
    const client = await getXrplClient();
    try {
      let tokenXRPValue = async function(client, ledgerindex, hex, issuer, totalTokens) {

        var totalTokens = Math.abs(Number(totalTokens))
        var drops = 0

        await new Promise(resolve => setTimeout(resolve, 300));

        var orders = await client.request({
            "command": "book_offers",
            "ledger_index": ledgerindex,
            "taker_gets": {
                "currency": "XRP"
            },
            "taker_pays": {
                "currency": hex,
                "issuer": issuer
            },
            "limit": 400
        })

        var markerme = orders.result.marker

        for (a in orders.result.offers) {

            if (totalTokens == 0) break

            if (totalTokens >= orders.result.offers[a].TakerPays.value) {

                drops += Number(orders.result.offers[a].TakerGets)
                totalTokens -= Number(orders.result.offers[a].TakerPays.value)
            } else {

                var ratio = totalTokens / Number(orders.result.offers[a].TakerPays.value)
                drops += ratio * Number(orders.result.offers[a].TakerGets)
                totalTokens -= totalTokens
            }
        }

        while (markerme != null && totalTokens > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));

            var orders = await client.request({
                "command": "book_offers",
                "ledger_index": ledgerindex,
                "taker_gets": {
                    "currency": "XRP"
                },
                "taker_pays": {
                    "currency": hex,
                    "issuer": issuer
                },
                "limit": 400,
                "marker": markerme
            })

            var markerme = orders.result.marker

            for (a in orders.result.offers) {

                if (totalTokens == 0) break

                if (totalTokens >= orders.result.offers[a].TakerPays.value) {

                    drops += Number(orders.result.offers[a].TakerGets)
                    totalTokens -= Number(orders.result.offers[a].TakerPays.value)
                } else {

                    var ratio = totalTokens / Number(orders.result.offers[a].TakerPays.value)
                    drops += ratio * Number(orders.result.offers[a].TakerGets)
                    totalTokens -= totalTokens
                }
            }
        }

        var totalXRP = drops / 1000000

        return totalXRP
    }

        var listOfOffers = []
        var methodTypes = ["nft_sell_offers", "nft_buy_offers"]

        for (a in methodTypes) {
            if (methodTypes[a] == "nft_sell_offers") {
                var type = "SELL"
            } else {
                var type = "BUY"
            }

            var allOffers = []
            var marker = "begin"
            while (marker != null) {

                try {
                    if (marker == 'begin') {
                        var nftOffers = await client.request({
                            "command": methodTypes[a],
                            "ledger_index": "validated",
                            "nft_id": tokenId,
                            "limit": 400
                        })
                    } else {
                        var nftOffers = await client.request({
                            "command": methodTypes[a],
                            "ledger_index": "validated",
                            "nft_id": tokenId,
                            "marker": marker,
                            "limit": 400
                        })
                    }
                    var allOffers = allOffers.concat(nftOffers.result.offers)
                    var marker = nftOffers.result.marker

                } catch {
                    var marker = null
                }
            }

            var allFilteredOffers = []
            for (a in allOffers) {

                var index = allOffers[a].nft_offer_index
                var destination = allOffers[a].destination

                if (isNaN(allOffers[a].amount)) {

                    var price = allOffers[a].amount.value
                    if ((allOffers[a].amount.currency).length > 3) {
                        var token = xrpl.convertHexToString(allOffers[a].amount.currency).replace(/\0/g, '')
                    } else {
                        var token = allOffers[a].amount.currency
                    }

                    var xrpValue = await tokenXRPValue(client, "validated", allOffers[a].amount.currency, allOffers[a].amount.issuer, allOffers[a].amount.value)
                } else {
                    var price = allOffers[a].amount / 1000000
                    var token = "XRP"
                    var xrpValue = price
                }


                var data = {
                    price: price,
                    token: token,
                    xrpValue: xrpValue,
                    index: index,
                    destination: destination,
                    expiration: (Number(allOffers[a].expiration) + 946684800) * 1000,
                    type: type,
                    account: allOffers[a].owner
                }

                allFilteredOffers.push(data)
            }

            allFilteredOffers.sort(function(a, b) {
                return b.xrpValue - a.xrpValue;
            });

            listOfOffers.push(allFilteredOffers)
        }
        return listOfOffers
    } catch (error) {
        console.log(error)
        return null
    } finally {
        await client.disconnect()
    }

  },
  getcurrentNftHolder: async function (NFTokenID) {
    const lastKnownHolder = await getNft(NFTokenID).then((nft) => {
      return nft.currentOwner;
    });
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
        // console.log("Account is: " + account);
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
              allNFTs.push(accountNFTs.result.account_nfts[a]);
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
    //FUNCTION TO GET THE XRP VALUE OF A TOKE TRADE
    let tokenXRPValue = async function (
      client,
      ledgerindex,
      hex,
      issuer,
      totalTokens
    ) {
      var totalTokens = Math.abs(Number(totalTokens));
      var drops = 0;

      await new Promise((resolve) => setTimeout(resolve, 300));

      var orders = await client.request({
        command: "book_offers",
        ledger_index: ledgerindex,
        taker_gets: {
          currency: "XRP",
        },
        taker_pays: {
          currency: hex,
          issuer: issuer,
        },
        limit: 400,
      });

      var markerme = orders.result.marker;

      for (a in orders.result.offers) {
        if (totalTokens == 0) break;

        if (totalTokens >= orders.result.offers[a].TakerPays.value) {
          drops += Number(orders.result.offers[a].TakerGets);
          totalTokens -= Number(orders.result.offers[a].TakerPays.value);
        } else {
          var ratio =
            totalTokens / Number(orders.result.offers[a].TakerPays.value);
          drops += ratio * Number(orders.result.offers[a].TakerGets);
          totalTokens -= totalTokens;
        }
      }

      while (markerme != null && totalTokens > 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        var orders = await client.request({
          command: "book_offers",
          ledger_index: ledgerindex,
          taker_gets: {
            currency: "XRP",
          },
          taker_pays: {
            currency: hex,
            issuer: issuer,
          },
          limit: 400,
          marker: markerme,
        });

        var markerme = orders.result.marker;

        for (a in orders.result.offers) {
          if (totalTokens == 0) break;

          if (totalTokens >= orders.result.offers[a].TakerPays.value) {
            drops += Number(orders.result.offers[a].TakerGets);
            totalTokens -= Number(orders.result.offers[a].TakerPays.value);
          } else {
            var ratio =
              totalTokens / Number(orders.result.offers[a].TakerPays.value);
            drops += ratio * Number(orders.result.offers[a].TakerGets);
            totalTokens -= totalTokens;
          }
        }
      }

      var totalXRP = drops / 1000000;

      return totalXRP;
    };

    //CONNECT
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

      //FILTER AND CLEAN OFFERS
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

          var xrpValue = await tokenXRPValue(
            client,
            "validated",
            allNFTokenOffers[a].Amount.currency,
            allNFTokenOffers[a].Amount.issuer,
            allNFTokenOffers[a].Amount.value
          );
        } else {
          var price = Number(allNFTokenOffers[a].Amount) / 1000000;
          var token = "XRP";
          var xrpValue = price;
        }

        if (allNFTokenOffers[a].Expiration + 946684800 <= Date.now() / 1000) {
          var expired = true;
        } else {
          var expired = false;
        }

        if (allNFTokenOffers[a].Flags == 1) {
          var type = "SELL";
        } else {
          var type = "BUY";
        }

        var data = {
          nftID: nftID,
          price: price,
          token: token,
          index: index,
          destination: destination,
          expiration:
            (Number(allNFTokenOffers[a].Expiration) + 946684800) * 1000,
          expired: expired,
          xrpValue: xrpValue,
          type: type,
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
      return null;
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
            peer: process.env.XRPL_ISSUER_ADDRESS,
            ledger_index: "validated",
          });
          for (a in xrplResponse.result.lines) {
            if (xrplResponse.result.lines[a].currency == "OCW") {
              if (
                xrplResponse.result.lines[a].account ==
                process.env.XRPL_ISSUER_ADDRESS
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
  getXrpBalance: async function (address) {
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
            peer: process.env.XRPL_ISSUER_ADDRESS,
            ledger_index: "validated",
          });
          for (a in xrplResponse.result.lines) {
            if (xrplResponse.result.lines[a].currency == "OCW") {
              if (
                xrplResponse.result.lines[a].account ==
                process.env.XRPL_ISSUER_ADDRESS
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
  getTokenBalance: async function (address, issuer, tokenHex) {
    const client = await getXrplClientMain();
    try {
      //try to request XRPL for balances of token, attempt up to 5 times
      var count = 0;
      while (count < 5) {
        try {
          if (
            issuer.toLowerCase() == "xrp" &&
            tokenHex.toLowerCase() == "xrp"
          ) {
            //XRP
            var serverstate = await client.request({
              command: "server_state",
              ledger_index: "validated",
            });

            var ownerReserve = Number(
              serverstate.result.state.validated_ledger.reserve_inc
            );
            var accountReserve = Number(
              serverstate.result.state.validated_ledger.reserve_base
            );

            var accountInfo = await client.request({
              command: "account_info",
              ledger_index: "validated",
              account: address,
            });

            var accountDrops = Number(accountInfo.result.account_data.Balance);
            var ownerCount = Number(accountInfo.result.account_data.OwnerCount);

            var holdings =
              (accountDrops - ownerCount * ownerReserve - accountReserve) /
              1000000;
          } else {
            //TOKEN
            var xrplResponse = await client.request({
              command: "account_lines",
              account: address,
              limit: 400,
              peer: issuer,
              ledger_index: "validated",
            });
            for (a in xrplResponse.result.lines) {
              if (xrplResponse.result.lines[a].currency == tokenHex) {
                if (xrplResponse.result.lines[a].account == issuer) {
                  var holdings = xrplResponse.result.lines[a].balance;
                }
              }
            }
          }

          break;
        } catch (err) {
          count += 1;
        }
      }

      if (holdings == undefined) {
        return;
      } else {
        return holdings;
      }
    } catch (error) {
      console.log(error);
      return;
    } finally {
      await client.disconnect();
    }
  },
};
async function getPayload(request) {
  const payload = await sdk.payload.create(request);
  return payload;
}
async function getXrplClientMain() {
  //define
  var client = new xrpl.Client("wss://xrplcluster.com/");

  //Try Connect to XRPL
  var count = 0;
  while (count < 6) {
    if (count >= 3) {
      var client = new xrpl.Client("wss://s2.ripple.com/");
    }

    try {
      await client.connect();
      break;
    } catch (err) {
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
      // console.log(`\tConnected`);
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
async function sendRequestRedeem(ipAddress, address) {
  const postData = "address=" + address;
  const options = {
    hostname: ipAddress,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": postData.length,
    },
  };
  const promiseRequest = new Promise(function (resolve, reject) {
    var payload = "";
    const req = http.request(options, (res) => {
      res
        .on("data", (d) => {
          payload += d;
        })
        .on("end", () => {
          payload = JSON.parse(payload);
          //If payload is successful it returns resolves promise, if not, it rejects. If error, rejects.
          try {
            if (payload) {
              resolve(payload);
            } else {
              reject();
            }
          } catch (err) {
            console.error("Failed Retrieving Payload:\t" + err);
            reject();
          }
        });
    });

    req.on("error", (e) => {
      console.error(e);
    });
    req.write(postData);
    req.end();
  });
  console.log(await promiseRequest);
  return promiseRequest;
}
async function getXrplReserve() {
  const client = await getXrplClient();
  try {
    //GET LEDGER RESERVE
    var serverstate = await client.request({
      command: "server_state",
      ledger_index: "validated",
    });

    var reserve =
      Number(serverstate.result.state.validated_ledger.reserve_inc) / 1000000;

    return reserve;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await client.disconnect();
  }
}
exports.payloads = payloads;
exports.subscriptions = subscriptions;
exports.xrpl = xrpls;

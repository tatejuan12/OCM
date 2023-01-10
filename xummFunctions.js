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
const { resolve } = require("path");
var payloads = {
  NFTokenCreateOffer: async function (
    NFToken,
    value,
    destination,
    expiry,
    mobile,
    return_url,
    flags
  ) {
    const nftOwner = await xrpls.getcurrentNftHolder(NFToken);
    try {
      value = parseFloat(value);
      value = value * 1000000;
      value = value.toString();
    } catch (err) {
      console.error("Error parsing Value: " + err);
      return false;
    }
    if (flags == 0) {
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
    } else {
      request = {
        options: {
          submit: true,
          expire: 240,
        },
        txjson: {
          TransactionType: "NFTokenCreateOffer",
          NFTokenID: NFToken,
          Expiration: expiry,
          Destination: destination,
          Amount: value,
          Flags: 1,
        },
        custom_meta: {
          Instruction: `Sign this transaction to make a sell offer of ${value} on TokenID - ${NFToken}`,
        },
      };

      if (destination.length < 1) {
        delete request.txjson.Destination;
      }
      if (expiry == 0) {
        delete request.txjson.Expiration;
      }
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
    }
  },
  NFTokenAcceptOffer: async function (offerId, mobile, return_url, flags) {
    if (flags == 0) {
      const request = {
        options: {
          submit: true,
          expire: 240,
        },
        txjson: {
          TransactionType: "NFTokenAcceptOffer",
          NFTokenBuyOffer: offerId,
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
    } else {
      const request = {
        options: {
          submit: true,
          expire: 240,
        },
        txjson: {
          TransactionType: "NFTokenAcceptOffer",
          NFTokenSellOffer: offerId,
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
    }
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
  redeemNftPayload: async function (
    address,
    mobile,
    return_url,
    ipAddress,
    UUID,
    DID
  ) {
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
      const obj = await sendRequestRedeem(ipAddress, address, UUID, DID);
      request.txjson["NFTokenSellOffer"] = obj[0].NFTokenSellOffer;
      request.txjson.Memos = [
        {
          Memo: {
            MemoData: xrpl.convertStringToHex(
              "Redeemed through OnChain Markeplace! \nhttps://onchainmarketplace.net"
            ),
          },
        },
      ];
      tokenID = obj[1];
      payload = await getPayload(request);
      if (payload) {
        return [payload, tokenID];
      } else throw "Couldn't get payload";
    } catch (error) {
      return new Error(error);
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
  mintNftPayload: async function (
    address,
    ownAddress,
    userToken,
    fee,
    mobile,
    return_url
  ) {
    const paymentAmount = (fee * 1000000).toString();
    const request = {
      options: {
        submit: true,
        expire: 240,
      },
      user_token: userToken,
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
  mintObject: async function (
    uri,
    taxon,
    transferFee,
    memo,
    burnable,
    onlyXRP,
    trustline,
    transferable,
    userToken
  ) {
    try {
      //CONDUCT CHECKS
      if (memo != undefined && memo != "") {
        var memoHex = xrpl.convertStringToHex(memo);
      }

      if (isNaN(taxon) || Number(taxon) % 1 != 0) {
        console.log(
          `DEFINED TAXON IS NOT A WHOLE NUMBER, AND HENCE IS INVALID`
        );
        return;
      } else {
        var taxon = Number(taxon);
      }

      if (
        isNaN(transferFee) ||
        transferFee < 0 ||
        transferFee > 50 ||
        (Number(transferFee) * 1000) % 1 != 0
      ) {
        console.log(
          `DEFINED TRANSFER FEE IS NOT A NUMBER BETWEEN 0 AND 50 WITH 3 OR LESS DECIMAL PLACES`
        );
        return;
      } else {
        var transferFee = Number(transferFee) * 1000;
      }

      if (!transferable && transferFee != 0) {
        console.log(`TRANSFERABLE FLAG MUST BE TRUE TO INCLUDE A TRANSFER FEE`);
        return;
      }

      //CALCULATE THE FLAGS
      var flags = 0;
      if (burnable == "true") flags += 1;
      if (onlyXRP == "true") flags += 2;
      if (trustline == "true") flags += 4;
      if (transferable == "true") flags += 8;

      var mintObject = {
        user_token: userToken,
        txjson: {
          TransactionType: "NFTokenMint",
          NFTokenTaxon: taxon,
        },
      };

      if (memoHex != undefined) {
        mintObject.txjson.Memos = [
          {
            Memo: {
              MemoData: memoHex,
            },
          },
        ];
      }

      if (uri != undefined && uri != "") {
        mintObject.txjson.URI = xrpl.convertStringToHex(uri);
      }

      if (transferFee != 0) {
        mintObject.txjson.TransferFee = transferFee;
      }

      if (flags != 0) {
        mintObject.txjson.Flags = flags;
      }
      const payload = await getPayload(mintObject);
      return payload;
    } catch (err) {
      console.log("Minting error " + err);
    }
  },
};
var subscriptions = {
  transactionSubscription: async function (req, res) {
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
  payloadSigner: async function (payload) {
    try {
      var subscription = false;
      console.log("checking payload");
      var promise = new Promise(function (resolve, reject) {
        subscription = sdk.payload.subscribe(payload, (event) => {
          if (event.data.signed) {
            console.log("trans was signed promise is running");
            sdk.payload.get(event.data.payload_uuidv4).then((data) => {
              console.log(data);
              var wallet = data.response.account;
              resolve(wallet);
            });
          } else if (event.data.signed == false) {
            console.log("false redeem payload not signed");
            reject(false);
          }
        });
      });
      return await promise;
    } catch (err) {
      console.log("error checking payload for wallet: " + err);
    }
  },
  watchSubscripion: async function (payload) {
    try {
      var subscription = false;
      var promise = new Promise(function (resolve, reject) {
        subscription = sdk.payload.subscribe(payload, (event) => {
          if (event.data.signed) {
            sdk.payload.get(event.data.payload_uuidv4).then((data) => {
              // res.status(200).send(true);
              var txID = event.data.txid;
              var wallet = data.response.signer;
              resolve([txID, wallet]);
            });
          } else if (event.data.signed == false) {
            // res.status(401).send(false);
            console.log("nope");
            reject("User did not sign subscription");
          }
        });
      });

      var txID = await promise;
      var verify = await verifyTransactionAndAccount(txID[0]);
      if (verify[0] === true) {
        verify[0] = "signed";
        return verify;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
    }
  },
  listNftSubscription: async function (req, res) {
    try {
      var subscription = false;
      var promise = new Promise(function (resolve) {
        subscription = sdk.payload.subscribe(req.body.payload, (event) => {
          if (event.data.signed) {
            resolve(event.data.txid);
          } else if (event.data.signed == false) {
            resolve(false);
          }
        });
      });

      var txID = await promise;

      var verify = await verifyTransaction(txID);
      if (verify === true) {
        console.log("signed");
        return "signed";
      } else {
        res.status(401).send(false);
        return false;
      }
    } catch (error) {
      console.error("There was an error with the payload: \n" + error);
    }
  },
  bulkListNftSubscription: async function (payload, res) {
    try {
      var subscription = false;
      var promise = new Promise(function (resolve) {
        subscription = sdk.payload.subscribe(payload, (event) => {
          if (event.data.signed) {
            resolve(event.data.txid);
          } else if (event.data.signed == false) {
            resolve(false);
          }
        });
      });

      var txID = await promise;

      var verify = await verifyTransaction(txID);
      if (verify === true) {
        console.log("signed");
        return "signed";
      } else {
        res.status(401).send(false);
        return false;
      }
    } catch (error) {
      console.error("There was an error with the payload: \n" + error);
    }
  },
  xummTransInfo: async function (payload, res) {
    var subscription = false;
    var promise = new Promise(function (resolve) {
      subscription = sdk.payload.subscribe(payload, (event) => {
        if (event.data.signed) {
          resolve(event.data.txid);
        } else if (event.data.signed == false) {
          resolve(false);
        }
      });
    });
    var txInfo = await promise;

    return txInfo;
  },
  xummSignCheck: async function (payload, res) {
    var subscription = false;
    var promise = new Promise(function (resolve) {
      subscription = sdk.payload.subscribe(payload, (event) => {
        if (event.data.signed) {
          resolve(true);
        } else if (event.data.signed == false) {
          resolve(false);
        }
      });
    });
    var txInfo = await promise;

    return txInfo;
  },
  mintNftSubscription: async function (payload, res) {
    try {
      var subscription = false;
      var promise = new Promise(function (resolve) {
        subscription = sdk.payload.subscribe(payload, (event) => {
          if (event.data.signed) {
            resolve(event.data.txid);
          } else if (event.data.signed == false) {
            resolve(false);
          }
        });
      });

      var txID = await promise;

      var verify = await verifyTransaction(txID);
      if (verify === true) {
        return "signed";
      } else {
        res.status(401).send(false);
        return false;
      }
    } catch (error) {
      console.error("There was an error with the payload: \n" + error);
    }
  },
  NFTokenAcceptSubscription: async function (req, res) {
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
  getAccountTokens: async function (address) {
    try {
      //define
      var client = await getXrplClient();

      //try 5 times to get an array of all account NFTs
      var count = 0;
      while (count < 5) {
        try {
          var allTokens = [];
          var marker = "begin";
          while (marker != null) {
            //console.log("Retrieving")
            if (marker == "begin") {
              var accountTokens = await client.request({
                command: "account_lines",
                ledger_index: "validated",
                account: address,
                limit: 400,
              });
            } else {
              var accountTokens = await client.request({
                command: "account_lines",
                ledger_index: "validated",
                account: address,
                marker: marker,
                limit: 400,
              });
            }

            var allTokens = allTokens.concat(accountTokens.result.lines);
            var marker = accountTokens.result.marker;
          }
          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      var tokensHeld = [];
      for (a in allTokens) {
        if (allTokens[a].balance <= `0`) continue;

        if (allTokens[a].currency.length > 3) {
          var name = xrpl
            .convertHexToString(allTokens[a].currency)
            .replace(/\0/g, "");
        } else {
          var name = allTokens[a].currency;
        }

        tokensHeld.push({
          issuer: allTokens[a].account,
          hex: allTokens[a].currency,
          balance: allTokens[a].balance,
          name: name,
        });
      }

      return tokensHeld;
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.disconnect();
    }
  },
  getNftImage: async function (nftURI, retryCount = 0) {
    var json = {};

    var httpsIPFSGateway = "https://cloudflare-ipfs.com/ipfs/";

    async function httpAPI(url, retryCount = 0) {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let body = "";
          res.on("data", (d) => {
            body += d;
          });
          res.on("end", () => {
            if (res.statusCode == 200) {
              try {
                json = JSON.parse(body);
                // console.log(body);
              } catch (error) {
                resolve(body);
              }
              resolve(json);
            } else {
              reject(new Error("Could not contact server to get NFT info"));
            }
          });
        });
      });
    }

    function resolveIPFS(ipfsLink, gateway) {
      if (ipfsLink.startsWith("ipfs://ipfs/")) {
        var httpsURI = ipfsLink.replace("ipfs://ipfs/", gateway);
      } else if (ipfsLink.startsWith("ipfs://")) {
        var httpsURI = ipfsLink.replace("ipfs://", gateway);
      } else if (ipfsLink.startsWith("http")) {
        var httpsURI = ipfsLink;
      } else {
        var httpsURI = `${gateway}${ipfsLink}`;
      }
      return httpsURI;
    }

    try {
      var nftURI = xrpl.convertHexToString(nftURI);

      var httpURI = resolveIPFS(nftURI, httpsIPFSGateway);

      //get metadata
      var count = 0;
      while (count < 3) {
        try {
          var uriMetadata = await httpAPI(httpURI);
          break;
        } catch (error) {
          count++;
        }
      }

      if (count >= 3) {
        var data = {
          name: "Un-named NFT",
          description: "",
          image: "assets/images/icons/link-error.png",
          edition: 0,
          date: 0,
          external_url: "",
          attributes: [],
          http_image: "assets/images/icons/link-error.png",
          http_uri: "assets/images/icons/link-error.png",
        };
        return data;
      }

      //find image
      if (uriMetadata.constructor != Object) {
        var data = {
          name: "Un-named NFT",
          description: "",
          image: httpURI,
          edition: 0,
          date: 0,
          external_url: "",
          attributes: [],
          http_image: httpURI,
          http_uri: httpURI,
        };
        return data;
      } else {
        if ("image" in uriMetadata && uriMetadata.image != "") {
          uriMetadata.image = uriMetadata.image;
        } else if ("animation" in uriMetadata && uriMetadata.animation != "") {
          uriMetadata.image = uriMetadata.animation;
        } else if ("video" in uriMetadata && uriMetadata.video != "") {
          uriMetadata.image = uriMetadata.video;
        } else if (
          "image_url" in uriMetadata &&
          uriMetadata["image_url"] != ""
        ) {
          uriMetadata.image = uriMetadata["image_url"];
        } else if (
          "animation_url" in uriMetadata &&
          uriMetadata["animation_url"] != ""
        ) {
          uriMetadata.image = uriMetadata["animation_url"];
        } else if (
          "video_url" in uriMetadata &&
          uriMetadata["video_url"] != ""
        ) {
          uriMetadata.image = uriMetadata["video_url"];
        } else {
          uriMetadata.image =
            "https://onchainmarketplace.net/assets/images/icons/link-error.png"; //THIS NEEDS TO BE HTTPS
        }
        var httpImage = resolveIPFS(uriMetadata.image, httpsIPFSGateway);
      }

      json["http_image"] = httpImage;
      json["http_uri"] = httpURI;
      return json;
    } catch (error) {
      var data = {
        name: "Un-named NFT",
        description: "",
        image: "assets/images/icons/link-error.png",
        edition: 0,
        date: 0,
        external_url: "",
        attributes: [],
        http_image: "assets/images/icons/link-error.png",
        http_uri: "assets/images/icons/link-error.png",
      };
      return data;
    }
  },
  getnftOffers: async function(tokenId, filterOverpricedOffers) {
    const client = await getXrplClient();
    try {
        let tokenXRPValue = async function(
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

            for (c in orders.result.offers) {
                if (totalTokens == 0) break;

                if (totalTokens >= orders.result.offers[c].TakerPays.value) {
                    drops += Number(orders.result.offers[c].TakerGets);
                    totalTokens -= Number(orders.result.offers[c].TakerPays.value);
                } else {
                    var ratio =
                        totalTokens / Number(orders.result.offers[c].TakerPays.value);
                    drops += ratio * Number(orders.result.offers[c].TakerGets);
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

                for (d in orders.result.offers) {
                    if (totalTokens == 0) break;

                    if (totalTokens >= orders.result.offers[d].TakerPays.value) {
                        drops += Number(orders.result.offers[d].TakerGets);
                        totalTokens -= Number(orders.result.offers[d].TakerPays.value);
                    } else {
                        var ratio =
                            totalTokens / Number(orders.result.offers[d].TakerPays.value);
                        drops += ratio * Number(orders.result.offers[d].TakerGets);
                        totalTokens -= totalTokens;
                    }
                }
            }

            var totalXRP = drops / 1000000;

            return totalXRP;
        };

        //get reserves
        if (filterOverpricedOffers) {
            var serverstate = await client.request({
                "command": "server_state",
                "ledger_index": "current"
            })

            var reserves = [((serverstate.result.state.validated_ledger.reserve_inc) / 1000000), ((serverstate.result.state.validated_ledger.reserve_base) / 1000000)]
        }


        var listOfOffers = [];
        var methodTypes = ["nft_sell_offers", "nft_buy_offers"];

        for (z in methodTypes) {
            if (methodTypes[z] == "nft_sell_offers") {
                var type = "SELL";
            } else {
                var type = "BUY";
            }

            var allOffers = [];
            var marker = "begin";
            while (marker != null) {
                try {
                    if (marker == "begin") {
                        var nftOffers = await client.request({
                            command: methodTypes[z],
                            ledger_index: "validated",
                            nft_id: tokenId,
                            limit: 400,
                        });
                    } else {
                        var nftOffers = await client.request({
                            command: methodTypes[z],
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

            var allFilteredOffers = [];
            for (a in allOffers) {
                if ((Number(allOffers[a].expiration) + 946684800) * 1000 < Date.now())
                    continue;
                var index = allOffers[a].nft_offer_index;
                var destination = allOffers[a].destination;

                if (isNaN(allOffers[a].amount)) {
                    var price = allOffers[a].amount.value;
                    if (allOffers[a].amount.currency.length > 3) {
                        var token = xrpl
                            .convertHexToString(allOffers[a].amount.currency)
                            .replace(/\0/g, "");
                    } else {
                        var token = allOffers[a].amount.currency;
                    }

                    var xrpValue = await tokenXRPValue(
                        client,
                        "validated",
                        allOffers[a].amount.currency,
                        allOffers[a].amount.issuer,
                        allOffers[a].amount.value
                    );
                } else {
                    var price = allOffers[a].amount / 1000000;
                    var token = "XRP";
                    var xrpValue = price;
                }

                var data = {
                    price: price,
                    token: token,
                    xrpValue: xrpValue,
                    index: index,
                    destination: destination,
                    expiration: (Number(allOffers[a].expiration) + 946684800) * 1000,
                    type: type,
                    account: allOffers[a].owner,
                };

                //filter out bullshit attempts
                if (filterOverpricedOffers && data.token == "XRP" && data.type == "BUY") {
                    var result = await client.request({
                        "command": "account_info",
                        "account": data.account,
                        "ledger_index": "validated"
                    })

                    var totalXRP = +result.result.account_data.Balance / 1000000
                    var reservedXRp = reserves[1] + (reserves[0] * +result.result.account_data.OwnerCount)
                    var availableXRP = totalXRP - reservedXRp

                    if (data.price > availableXRP) continue
                }

                allFilteredOffers.push(data);
            }

            allFilteredOffers.sort(function(a, b) {
                return b.xrpValue - a.xrpValue;
            });

            listOfOffers.push(allFilteredOffers);
        }
        return listOfOffers;
    } catch (error) {
        console.log(error);
        return null;
    } finally {
        await client.disconnect();
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
  getAccountsNfts: async function (address, numberOfNFTs, marker) {
    try {
      //define
      var client = await getXrplClient();
      var cname = "marker";
      //try 5 times to get an array of all account NFTs
      var count = 0;
      while (count < 5) {
        try {
          if (marker == null) {
            var accountNFTs = await client.request({
              command: "account_nfts",
              ledger_index: "validated",
              account: address,
              limit: numberOfNFTs,
            });
          } else {
            var accountNFTs = await client.request({
              command: "account_nfts",
              ledger_index: "validated",
              account: address,
              marker: marker,
              limit: numberOfNFTs,
            });
          }

          var allNFTs = accountNFTs.result.account_nfts;
          var marker = accountNFTs.result.marker;

          break;
        } catch (err) {
          //console.log(`                    Failed ${count}`)
          count += 1;
        }
      }

      return [allNFTs, marker];
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.disconnect();
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
  getTokenBalance: async function(address, issuer, tokenHex) {
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
                      var marker = "begin"
                      while (marker != null && holdings == undefined) {
                          var query = {
                              command: "account_lines",
                              account: address,
                              limit: 400,
                              ledger_index: "validated"
                          }

                          if (marker != "begin") query.marker = marker

                          var xrplResponse = await client.request(query);

                          var marker = xrplResponse.result.marker

                          for (a in xrplResponse.result.lines) {
                              if (xrplResponse.result.lines[a].currency == tokenHex) {
                                  if (xrplResponse.result.lines[a].account == issuer) {
                                      var holdings = xrplResponse.result.lines[a].balance;
                                  }
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
  checkAccountActivation: async function (account, daysSinceActivation) {
    try {
      //define
      var client = await getXrplClient();

      //REQUEST TRANSACTIONS
      var result = await client.request({
        command: "account_tx",
        account: account,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 1,
        forward: true,
      });

      //CHECK ACCOUNT IS ACTIVATED
      if (result.result.transactions.length == 0) {
        console.log(`Account NOT ACTIVATED -> ${account}`);
        return false;
      }

      //SORT THEM TO ENSURE THE OLDEST IS FIRST (RIPPLED DOESN'T GUARANTEE ONLY RETURNING 1 TRANSACTION)
      result.result.transactions.sort(function (a, b) {
        return a.tx.date - b.tx.date;
      });

      //CHECK ACTIVATION DATE
      var activationDate =
        (result.result.transactions[0].tx.date + 946684800) * 1000;

      if (activationDate + daysSinceActivation * 86400000 < Date.now()) {
        //IF ACTIVATION DATE WAS LONGER AGO THAN DEFINED PERIOD
        var validAccount = true;
      } else {
        console.log(
          `Account Only Activated ${(
            (Date.now() - activationDate) /
            86400000
          ).toFixed(2)} Days Ago -> ${account}`
        );
        var validAccount = false;
      }

      //true == Account is valid, and was activated longer ago than the defined period
      //true == ACCOUNT CAN CONTINUE AND IS VALID

      //false == Account is either not activated, or was recently activated
      //false == ACCOUNT CAN NOT CONTINUE AND IS INVALID
      return validAccount;
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      await client.disconnect();
    }
  },
  verifyTransaction: async function (txID) {
    const client = await getXrplClientMain();
    try {
      try {
        var result = await client.request({
          command: "tx",
          transaction: txID,
        });

        if (result.result.meta.TransactionResult == "tesSUCCESS") {
          var executed = true;
        } else {
          var executed = false;
        }
      } catch (error) {
        var executed = false;
      }

      return executed;
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.disconnect();
    }
  },
  nftIDFromTxID: async function (txID) {
    try {
      var client = await getXrplClient();

      //CHECK AND VERIFY NFT
      try {
        var result = await client.request({
          command: "tx",
          transaction: txID,
        });
      } catch (error) {
        console.log(`TRANSACTION DOES NOT EXIST ON THE GIVEN NETWORK`);
        return false;
      }

      var account = result.result.Account;
      //check it was a successful transaction

      if (result.result.meta.TransactionResult != "tesSUCCESS") {
        console.log(`MINTING FAILED`);
        return false;
      }

      //check it was a minting transaction
      if (result.result.TransactionType != "NFTokenMint") {
        console.log(`NOT A MINTING TRANSACTION`);
        return false;
      }

      //find all mentioned NFTIds
      var nfts = {};
      for (a in result.result.meta.AffectedNodes) {
        if ("ModifiedNode" in result.result.meta.AffectedNodes[a]) {
          if (
            result.result.meta.AffectedNodes[a].ModifiedNode.LedgerEntryType !=
            "NFTokenPage"
          )
            continue;

          if (
            result.result.meta.AffectedNodes[a].ModifiedNode.PreviousFields
              .NFTokens == undefined
          )
            continue;

          var combined = result.result.meta.AffectedNodes[
            a
          ].ModifiedNode.FinalFields.NFTokens.concat(
            result.result.meta.AffectedNodes[a].ModifiedNode.PreviousFields
              .NFTokens
          );
        } else if ("CreatedNode" in result.result.meta.AffectedNodes[a]) {
          if (
            result.result.meta.AffectedNodes[a].CreatedNode.LedgerEntryType !=
            "NFTokenPage"
          )
            continue;

          var combined =
            result.result.meta.AffectedNodes[a].CreatedNode.NewFields.NFTokens;
        } else {
          var combined = [];
        }

        for (b in combined) {
          if (!(combined[b].NFToken.NFTokenID in nfts)) {
            nfts[combined[b].NFToken.NFTokenID] = 0;
          }

          nfts[combined[b].NFToken.NFTokenID] += 1;
        }
      }

      //calculate outcomes
      var keys = Object.keys(nfts);
      var total = 0;
      for (a in keys) {
        if (nfts[keys[a]] % 2 != 0) {
          var nftID = keys[a];
          total += 1;
        }
      }

      //only return if 1 result
      if (total != 1) {
        console.log(`FUNCTION FAILED TO FIND NEW NFTID -> FOUND ${total}`);
        return null;
      }

      return [nftID, account];
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.disconnect();
    }
  },
  getAllAccountNFTs: async function (address) {
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
                command: "account_nfts",
                ledger_index: "validated",
                account: address,
                limit: 400,
              });
            } else {
              var accountNFTs = await client.request({
                command: "account_nfts",
                ledger_index: "validated",
                account: address,
                marker: marker,
                limit: 400,
              });
            }

            var allNFTs = allNFTs.concat(accountNFTs.result.account_nfts);
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
      console.log(error);
      return null;
    } finally {
      await client.disconnect();
    }
  },
  accountRedemptionHistory: async function (account, memoToFilterFor) {
    const client = await getXrplClient();
    try {
      //CHECK AND VERIFY NFT
      var result = await client.request({
        command: "account_tx",
        account: account,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 400,
      });

      var transactions = result.result.transactions;

      //filter transactions
      var nftRedemptions = [];
      for (a in transactions) {
        if (transactions[a].tx.TransactionType != "NFTokenAcceptOffer")
          continue; //if not an "Accept Offer" transaction
        if (transactions[a].tx.Account != account) continue; //if not executed by this account
        if (
          !("NFTokenSellOffer" in transactions[a].tx) ||
          "NFTokenBuyOffer" in transactions[a].tx
        )
          continue; //if not accepting a sell offer or if it includes accepting a buy offer
        if (transactions[a].meta.TransactionResult != "tesSUCCESS") continue; //if not a successful transaction

        //check the memo matches
        var memoMatches = false;
        for (b in transactions[a].tx.Memos) {
          if (
            memoToFilterFor ==
            xrpl.convertHexToString(transactions[a].tx.Memos[b].Memo.MemoData)
          ) {
            //if the memomatches
            var memoMatches = true;
          }
        }
        if (!memoMatches) continue; //if the memo doesn't match

        //find the details of the traded NFT
        for (b in transactions[a].meta.AffectedNodes) {
          if (!("DeletedNode" in transactions[a].meta.AffectedNodes[b]))
            continue; //if not a deleted ledger node
          if (
            transactions[a].meta.AffectedNodes[b].DeletedNode.LedgerEntryType !=
            "NFTokenOffer"
          )
            continue; //if not a deleted NFT offer
          if (
            transactions[a].meta.AffectedNodes[b].DeletedNode.LedgerIndex !=
            transactions[a].tx.NFTokenSellOffer
          )
            continue; //if not referring to the sell offer that was accepted
          if (
            transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
              .Flags != 1
          )
            continue; //second check that its a sell offer that was accepted

          var NFTokenID =
            transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
              .NFTokenID;
          var date = (transactions[a].tx.date + 946684800) * 1000;
          var txID = transactions[a].tx.hash;

          //get currency details
          if (
            isNaN(
              transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
                .Amount
            )
          ) {
            var amount =
              transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
                .Amount.value;
            if (
              transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
                .Amount.currency.length != 3
            ) {
              var token = xrpl.convertHexToString(
                transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
                  .Amount.currency
              ); //.replaceAll('\x00', '')
            } else {
              var token =
                transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
                  .Amount.currency;
            }
          } else {
            var token = "XRP";
            var amount =
              Number(
                transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields
                  .Amount
              ) / 1000000;
          }
        }

        var data = {
          imageLink: `https://onchainmarketplace.net/cdn-cgi/imagedelivery/0M8G_YiW8Hfkd_Ze5eWOXA/${NFTokenID}/100`,
          NFTokenID: NFTokenID,
          date: date,
          txID: txID,
          amount: amount,
          token: token,
        };
        nftRedemptions.push(data);
      }

      nftRedemptions.sort(function (a, b) {
        return b.date - a.date;
      });

      return nftRedemptions;
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      await client.disconnect();
    }
  },
  encodeXummID: async function (id) {
    var id = id.split("-").slice(1).concat(id.split("-")[0]).join("-"); //rearrange ID so the first section is at the end
    var id = id.replace(/-/g, ""); //remove all "-"
    var id = id.replace(new RegExp(id[0], "g"), id[2]); //replace all the 1st letter with the 3rd letter of the ID
    var id = id.split("").reverse().join(""); //reverse string
    var id = xrpl.convertStringToHex(id); //convert to Hex
    return id;
  },
  accountActivity: async function (address, earliestFirst, dateStartSeconds, dateEndSeconds, marker) {
    const client = await getXrplClient();
    try {
      //define functions 
      let currentLedger = async function(client, ledger_index) {
          var ledgerindex = await client.request({
              "command": "ledger",
              "ledger_index": ledger_index
          })
      
          var current = ledgerindex.result.ledger_index
          var ledgertime = ledgerindex.result.ledger.close_time
          return [current, ledgertime]
      }
      
      let ledgerFromEpoch = async function(client, EpochSeconds) {
      
          var EpochSeconds = Number(EpochSeconds)
          var rippletime = EpochSeconds - 946684800
          var oldledgertime = rippletime + 7
      
          var LedgerToCheck = "validated"
          var first = true
          var all = []
          while ((oldledgertime - rippletime) > 6) { //while there is more than a 6 second gap between the ledger found and the ledger wanted
              var LedgerQuery = await currentLedger(client, LedgerToCheck)
      
              var oldledgerindex = LedgerQuery[0]
              var oldledgertime = LedgerQuery[1]
      
              if (all.includes(LedgerQuery[0])) break
      
              if (oldledgertime >= rippletime || !first) {
                  if (oldledgertime - rippletime < 0) {
                      var LedgerToCheck = oldledgerindex + 1
                      var oldledgertime = rippletime + 7
                  } else {
                      var LedgerToCheck = oldledgerindex - Number(((oldledgertime - rippletime) / 5).toFixed(0))
                  }
              } else {
                  return -1
              }
              all.push(LedgerQuery[0])
      
              var first = false
          }
      
          if (oldledgertime < rippletime) {
              while (oldledgertime < rippletime) {
                  oldledgerindex += 1
                  var LedgerQuery = await currentLedger(client, oldledgerindex)
      
                  var oldledgerindex = LedgerQuery[0]
                  var oldledgertime = LedgerQuery[1]
              }
          }
      
          var more = true
          while (more) {
              var LedgerQuery = await currentLedger(client, oldledgerindex - 1)
      
              var oldledgerindex = LedgerQuery[0]
              var oldledgertime = LedgerQuery[1]
      
              if (oldledgertime < rippletime) {
                  oldledgerindex += 1
                  break
              }
          }
      
          return oldledgerindex
      
      }
      
      let convertHex = function(hexadecimal) {
          if (hexadecimal.length == 3) {
              return hexadecimal
          } else {
              return xrpl.convertHexToString(hexadecimal).replace(/\0/g, '').replace(/[^a-zA-Z0-9?!@#$%&*]/g, '')
          }
      }

      //get ledger dates to scan from
      if (dateStartSeconds != -1) {
          var dateStartLedger = await ledgerFromEpoch(client, dateStartSeconds)
      } else {
          var dateStartLedger = dateStartSeconds
      }
      if (dateStartLedger < 75443458) var dateStartLedger = 75443458 //first ledger of nfts

      if (dateEndSeconds != -1) {
          var dateEndLedger = await ledgerFromEpoch(client, dateEndSeconds)

          if (dateEndLedger < dateStartLedger) return [
              [], null
          ] //if the supplied date is before NFTs existed, don't even query
      } else {
          var dateEndLedger = dateEndSeconds
      }

      //try 5 times to get an array of all account NFTs
      var count = 0
      var transactions = []
      while (count < 5) {
          try {
              var query = {
                  "command": "account_tx",
                  "account": address,
                  "ledger_index_min": dateStartLedger,
                  "ledger_index_max": dateEndLedger,
                  "limit": 400,
                  "forward": earliestFirst
              }
              if (marker != null) query.marker = marker

              var response = await client.request(query)

              var transactions = response.result.transactions
              var marker = response.result.marker
              break
          } catch (err) {
              console.log(err)
              count++
          }
      }

      //filter transactions
      var transactionsNFT = []
      for (a in transactions) {

          if (transactions[a].tx.Account != address && transactions[a].tx.TransactionType != "NFTokenAcceptOffer") continue //remove transactions if not executed by them, or not accepting their nft/offer

          if (transactions[a].tx.TransactionType == "NFTokenCancelOffer") {
              for (b in transactions[a].meta.AffectedNodes) {

                  //Check if affected node data if a DeletedNode, remove others
                  if (!(transactions[a].meta.AffectedNodes[b].hasOwnProperty('DeletedNode'))) continue

                  //checked if DeletedNode is a NFTokenOffer
                  if (!(transactions[a].meta.AffectedNodes[b].DeletedNode.LedgerEntryType == "NFTokenOffer")) continue


                  if (transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Flags == 1) { //if sell offer
                      var transactionType = "Cancel Sell Offer"
                  } else {
                      var transactionType = "Cancel Buy Offer"
                  }

                  var NFTokenID = transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.NFTokenID
                  var recipient = undefined

                  if (isNaN(transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount)) {
                      var amount = transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount.value
                      var currency = convertHex(transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount.currency)
                  } else {
                      var amount = +transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount / 1000000
                      var currency = "XRP"
                  }

                  var data = {
                      date: (transactions[a].tx.date + 946684800) * 1000,
                      txID: transactions[a].tx.hash,
                      result: transactions[a].meta.TransactionResult,
                      NFTokenID: NFTokenID,
                      transactionType: transactionType,
                      recipient: recipient,
                      amount: amount,
                      currency: currency
                  }
                  transactionsNFT.push(data)
              }
          } else if (transactions[a].tx.TransactionType.includes("NFToken")) {

              if (transactions[a].tx.TransactionType == "NFTokenMint") {
                  var transactionType = "Mint NFToken"
                  var recipient = transactions[a].tx.Account
                  var amount = 0
                  var currency = "XRP"

                  //find nft that was minted
                  var nfts = {}
                  for (b in transactions[a].meta.AffectedNodes) {
                      if ("ModifiedNode" in transactions[a].meta.AffectedNodes[b]) {
                          if (transactions[a].meta.AffectedNodes[b].ModifiedNode.LedgerEntryType != "NFTokenPage") continue

                          if (transactions[a].meta.AffectedNodes[b].ModifiedNode.PreviousFields.NFTokens == undefined) continue

                          var combined = transactions[a].meta.AffectedNodes[b].ModifiedNode.FinalFields.NFTokens.concat(transactions[a].meta.AffectedNodes[b].ModifiedNode.PreviousFields.NFTokens)
                      } else if ("CreatedNode" in transactions[a].meta.AffectedNodes[b]) {
                          if (transactions[a].meta.AffectedNodes[b].CreatedNode.LedgerEntryType != "NFTokenPage") continue

                          var combined = transactions[a].meta.AffectedNodes[b].CreatedNode.NewFields.NFTokens
                      } else {
                          var combined = []
                      }

                      for (c in combined) {
                          if (!(combined[c].NFToken.NFTokenID in nfts)) {
                              nfts[combined[c].NFToken.NFTokenID] = 0
                          }

                          nfts[combined[c].NFToken.NFTokenID] += 1
                      }
                  }

                  //calculate outcomes 
                  var keys = Object.keys(nfts)
                  for (b in keys) {
                      if (nfts[keys[b]] % 2 != 0) {
                          var NFTokenID = keys[b]
                      }
                  }
              }

              if (transactions[a].tx.TransactionType == "NFTokenBurn") {
                  var transactionType = "Burn NFToken"
                  var recipient = transactions[a].tx.Account
                  var amount = 0
                  var currency = "XRP"
                  var NFTokenID = transactions[a].tx.NFTokenID
              }

              if (transactions[a].tx.TransactionType == "NFTokenCreateOffer") {
                  var recipient = transactions[a].tx.Destination
                  var NFTokenID = transactions[a].tx.NFTokenID

                  if (isNaN(transactions[a].tx.Amount)) {
                      var amount = transactions[a].tx.Amount.value
                      var currency = convertHex(transactions[a].tx.Amount.currency)
                  } else {
                      var amount = +transactions[a].tx.Amount / 1000000
                      var currency = "XRP"
                  }

                  if (transactions[a].tx.Flags == 1) {
                      var transactionType = "Create Sell Offer"
                  } else {
                      var transactionType = "Create Buy Offer"
                  }
              }

              if (transactions[a].tx.TransactionType == "NFTokenAcceptOffer") {

                  for (b in transactions[a].meta.AffectedNodes) {

                      //Check if affected node data if a DeletedNode, remove others
                      if (!(transactions[a].meta.AffectedNodes[b].hasOwnProperty('DeletedNode'))) continue

                      //checked if DeletedNode is a NFTokenOffer
                      if (!(transactions[a].meta.AffectedNodes[b].DeletedNode.LedgerEntryType == "NFTokenOffer")) continue


                      if (("NFTokenSellOffer" in transactions[a].tx) && ("NFTokenBuyOffer" in transactions[a].tx)) {
                          if (transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Flags == 1) continue
                          var transactionType = "NFToken Brokerage"
                          var recipient = transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Owner
                      } else {
                          if (transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Flags == 1) { //if sell offer
                              var transactionType = "Accept Sell Offer"
                              var recipient = transactions[a].tx.Account
                          } else {
                              var transactionType = "Accept Buy Offer"
                              var recipient = transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Owner
                          }
                      }

                      var NFTokenID = transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.NFTokenID

                      if (isNaN(transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount)) {
                          var amount = transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount.value
                          var currency = convertHex(transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount.currency)
                      } else {
                          var amount = +transactions[a].meta.AffectedNodes[b].DeletedNode.FinalFields.Amount / 1000000
                          var currency = "XRP"
                      }
                  }

                  if (transactions[a].tx.Memos != undefined) {
                      var memo = convertHex(transactions[a].tx.Memos[0].Memo.MemoData)
                      if (memo.includes("RedeemedthroughOnChainMarkeplace!")) var transactionType = "NFT Redemption"
                  }
              }


              var data = {
                  date: (transactions[a].tx.date + 946684800) * 1000,
                  txID: transactions[a].tx.hash,
                  result: transactions[a].meta.TransactionResult,
                  NFTokenID: NFTokenID,
                  transactionType: transactionType,
                  recipient: recipient,
                  amount: amount,
                  currency: currency
              }
              transactionsNFT.push(data)
          }
      }

      if(earliestFirst){
          transactionsNFT.sort(function(a, b) {
              return a.date - b.date;
          });
      } else {
          transactionsNFT.sort(function(a, b) {
              return b.date - a.date;
          });
      }

      return [transactionsNFT, marker]
  } catch (error) {
      console.log(error)
      return null
  } finally {
      await client.disconnect()
  }
  },
};
// ******************
// END XRPL FUNCTIONS
// ******************
async function verifyTransaction(txID) {
  const client = await getXrplClient();
  console.log("checking transaction: " + txID);
  try {
    try {
      var result = await client.request({
        command: "tx",
        transaction: txID,
      });

      if (result.result.meta.TransactionResult == "tesSUCCESS") {
        var executed = true;
        console.log("txid verified true");
      } else {
        var executed = false;
        console.log("txid verified false");
      }
    } catch (error) {
      var executed = false;
      console.log("error validating");
    }

    return executed;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await client.disconnect();
  }
}
async function verifyTransactionAndAccount(txID) {
  const client = await getXrplClient();
  console.log("checking transaction: " + txID);
  try {
    try {
      var result = await client.request({
        command: "tx",
        transaction: txID,
      });

      var account = result.result.Account;

      if (result.result.meta.TransactionResult == "tesSUCCESS") {
        var executed = true;
        console.log("txid verified true");
      } else {
        var executed = false;
        console.log("txid verified false");
      }
    } catch (error) {
      var executed = false;
      console.log("error validating");
    }

    return [executed, account];
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await client.disconnect();
  }
}
async function getPayload(request) {
  if (request.txjson.Memos == undefined) {
    memo = "OnChain Markeplace - https://onchainmarketplace.net";
    var memoHex = xrpl.convertStringToHex(memo);
    request.txjson.Memos = [
      {
        Memo: {
          MemoData: memoHex,
        },
      },
    ];
  }
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
  var client = new xrpl.Client("wss://xrplcluster.com/");

  //console.log("Connecting to XRPL")
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
async function sendRequestRedeem(ipAddress, address, UUID, DID) {
  const postData = "address=" + address + "&UUID=" + UUID + "&DID=" + DID;
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
          try {
            console.log("here");
            console.log(JSON.parse(payload));
            payload = JSON.parse(payload);
          } catch (err) {
            reject(payload);
          }
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
  return await promiseRequest;
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

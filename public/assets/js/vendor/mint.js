const xrpl = require(`xrpl`)
const fs = require(`fs`)

//websocket = XRPl websocket 
//issuerAddress = XRPL address of the issuer (if it is not the same as the minterSeed, must ensure that the address has preapproved this seed to mint on it's behalf)
//minterSeed = seed of address that is minting 
//uris = string of URIs to mint
//taxon = number of the taxon for the NFTs
//transferFee = number between 0 and 50000
//memo = string of the memo for transactions
//checkForExisting = boolean, check if NFT with this URI exists
//burnable = boolean, check if NFT is always burnable by issuer
//onlyXRP = boolean, NFT can only be traded for XRP
//trustline = boolean, autoset trustline in issuer for royalty fees
//transferable = boolean, allow NFT to be transferred between parties NOT inlcuding the issuer

async function mint(websocket, issuerAddress, minterSeed, uris, taxon, transferFee, memo, checkForExisting, burnable, onlyXRP, trustline, transferable) {
    var websocket = "wss://xls20-sandbox.rippletest.net:51233"
    var taxon = "0"
    var transferFee = "0"
    var memo = "Minted on OnChain Marketplace"
    var checkForExisting = true
    var burnable = false
    var onlyXRP = false
    var trustline = true
    var transferable = true

    try {
        //DEFINE XRPL CLIENT AND MINTING WALLET
        var xrplClient = new xrpl.Client(websocket)
        var mintingWallet = xrpl.Wallet.fromSeed(minterSeed)
        var resultArray = []


        //CONDUCT CHECKS
        if (memo != undefined) {
            var memoHex = xrpl.convertStringToHex(memo)
        }

        if (mintingWallet.classicAddress == issuerAddress) {
            var checkIssuer = false
        } else {
            var checkIssuer = true
        }

        var uris = uris.replace(/\s/g, ``).split(`,`)

        if (isNaN(taxon) || Number(taxon) % 1 != 0) {
            console.log(`DEFINED TAXON IS NOT A WHOLE NUMBER, AND HENCE IS INVALID`)
            return
        } else {
            var taxon = Number(taxon)
        }

        if (isNaN(transferFee) || (transferFee < 0 || transferFee > 50) || (Number(transferFee) * 1000) % 1 != 0) {
            console.log(`DEFINED TRANSFER FEE IS NOT A NUMBER BETWEEN 0 AND 50 WITH 3 OR LESS DECIMAL PLACES`)
            return
        } else {
            var transferFee = Number(transferFee) * 1000
        }

        if (!transferable && transferFee != 0) {
            console.log(`TRANSFERABLE FLAG MUST BE TRUE TO INCLUDE A TRANSFER FEE`)
            return
        }


        //INITIATE PROCESSES
        console.log(`\n\nThe Minting Process Has Launched\nUpon completion, please review your XRPL account and the Outputted Documents, and make any necessary adjustments\n\n\nVisit https://onchainmarketplace.net/ to list, trade, and control your new NFTokens in a decentralised manner!\n\nThis Tool Was Provided For Free Use By OnChain Marketplace`)


        //CONNECT TO XRPL
        await xrplClient.connect()
        console.log(`\n\n\nSuccessfully Connected to ${xrplClient.connection.ws._url}`)


        //IF RELEVANT, CHECK THE ISSUER HAS PERMITTED THE MINTER TO MINT ON THEIR BEHALF
        if (checkIssuer) {
            var accountResult = await xrplClient.request({
                "command": "account_info",
                "account": issuerAddress,
                "ledger_index": "validated",
                "strict": true
            })

            if (accountResult.result.account_data.NFTokenMinter != mintingWallet.classicAddress) {
                console.log(`THE SUPPLIED ISSUING ADDRESS HAS NOT PERMITTED THE SUPPLIED SEED TO MINT ON IT'S BEHALF`)
                return
            }
        }


        //IF RELEVANT, CHECK THE NFTS HELD BY THE ACCOUNT
        var accountNFTs = []
        if (checkForExisting) {
            console.log(`\n\n__ Collecting Account NFTs __`)

            var marker = "first"
            while (marker != undefined) {

                var queryBody = {
                    "command": "account_nfts",
                    "account": mintingWallet.classicAddress,
                    "ledger_index": "validated"
                }

                if (marker != "first") {
                    queryBody.marker = marker
                }

                var nftResult = await xrplClient.request(queryBody)

                var accountNFTs = accountNFTs.concat(nftResult.result.account_nfts)
                var marker = nftResult.result.marker
            }
            console.log(`\tCollected`)
        }

        
        //CALCULATE THE FLAGS
        var flags = 0
        if (burnable) flags += 1
        if (onlyXRP) flags += 2
        if (trustline) flags += 4
        if (transferable) flags += 8


        //ANNOUNCE START OF MINTING
        console.log(`\n\nMinting ${uris.length} NFTokens On The XRPl\n\tMinting Account: ${mintingWallet.classicAddress}\n\tIssuing Account: ${issuerAddress}\n\tTaxon: ${taxon}\n\tTransfer Fee: ${transferFee/1000}%\n\tFlags:\n\t\tBurnable: ${burnable}\n\t\tOnly $XRP: ${onlyXRP}\n\t\tTrustline: ${trustline}\n\t\tTransferable: ${transferable}\n\n\tMinting Memo: ${memo}\n\tCheck For Existing NFTokens: ${checkForExisting}\n\n\n** You Have 30 Seconds To Confirm These Details Are Correct **`)
        await new Promise(resolve => setTimeout(resolve, 30000));


        //BEGIN MINTING
        console.log(`\n\n__ Minting ${uris.length} NFTokens __`)
        for (a in uris) {

            //CHECK RECORDS FOR PRE-MINTED NFT
            var nftExists = false
            if (uris[a] != "") {
                var uriHex = xrpl.convertStringToHex(uris[a])

                for (b in accountNFTs) {
                    if (uriHex == accountNFTs[b].URI) {
                        var nftExists = true
                    }
                }
            } else {
                var uriHex = undefined
            }

            if (nftExists) {
                console.log(`\tNFToken #${a} of ${uris.length}\t-> EXISTS\t-> ${uris[a]}`)

                resultArray.push({
                    order: a,
                    URI: uriHex,
                    mintHash: undefined
                })
                continue
            }


            //DEFINE THE MINTING OBJECT
            var mintObject = {
                "TransactionType": "NFTokenMint",
                "Account": mintingWallet.classicAddress,
                "NFTokenTaxon": taxon
            }

            if (memoHex != undefined) {
                mintObject.Memos = [{
                    "Memo": {
                        "MemoData": memoHex
                    }
                }]
            }

            if (uriHex != undefined) {
                mintObject.URI = uriHex
            }

            if (checkIssuer) {
                mintObject.Issuer = issuerAddress
            }

            if (transferFee != 0) {
                mintObject.TransferFee = transferFee
            }

            if (flags != 0) {
                mintObject.Flags = flags
            }


            //SIGN AND SUBMIT THE MINTING TRANSACTION
            var preparedMintObject = await xrplClient.autofill(mintObject)
            var signedMintObject = mintingWallet.sign(preparedMintObject)
            var mintResult = await xrplClient.submit(signedMintObject.tx_blob)

            console.log(`\tNFToken #${a} of ${uris.length}\t-> MINTING\t-> ${uris[a]}\t-> TxID: ${signedMintObject.hash}`)

            resultArray.push({
                order: a,
                URI: uriHex,
                mintHash: signedMintObject.hash
            })
        }
        console.log(`\n\n__ Completed Minting __\n\tChecking XRPL Queue Before Confirming Results`)


        //WAIT UNTIL ACCOUNT'S QUEUE IS EMPTY TO CHECK NFTs
        //WAIT UNTIL CURRENT OPEN LEDGER HAS BEEN VALIDATED BEFORE CHECKING QUEUE
        var oldOpenLedgerResult = await xrplClient.request({
            "command": "ledger",
            "ledger_index": "current"
        })
        var oldOpenLedger = oldOpenLedgerResult.result.ledger_current_index

        var newOpenLedger = 0
        while (newOpenLedger < oldOpenLedger) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            var newOpenLedgerResult = await xrplClient.request({
                "command": "ledger",
                "ledger_index": "current"
            })
            var newOpenLedger = newOpenLedgerResult.result.ledger_current_index
        }

        var validatedLedger = 0
        while (validatedLedger < newOpenLedger) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            var validatedLedgerResult = await xrplClient.request({
                "command": "ledger",
                "ledger_index": "validated"
            })
            var validatedLedger = validatedLedgerResult.result.ledger_index
        }

        var queuedTransactions = 1
        while (queuedTransactions > 0) {

            await new Promise(resolve => setTimeout(resolve, 1000));

            var accountResult = await xrplClient.request({
                "command": "account_info",
                "account": mintingWallet.classicAddress,
                "queue": true
            })

            var queuedTransactions = accountResult.result.queue_data.txn_count

            console.log(`\tQueued Transactions: ${queuedTransactions}`)
        }


        //COLLECT/CHECK ACCOUNT NFTS
        console.log(`\n\n__ Collecting Account NFTs __`)
        var accountNFTs = []
        var marker = "first"
        while (marker != undefined) {

            var queryBody = {
                "command": "account_nfts",
                "account": mintingWallet.classicAddress,
                "ledger_index": "validated"
            }

            if (marker != "first") {
                queryBody.marker = marker
            }

            var nftResult = await xrplClient.request(queryBody)

            var accountNFTs = accountNFTs.concat(nftResult.result.account_nfts)
            var marker = nftResult.result.marker
        }
        console.log(`\tCollected`)


        //RECORD RESULTS
        for (a in resultArray) {

            for (b in accountNFTs) {

                if (accountNFTs[b].confirmed) continue

                if (resultArray[a].URI == accountNFTs[b].URI) {

                    resultArray[a].NFTokenID = accountNFTs[b].NFTokenID
                    resultArray[a].Flags = accountNFTs[b].Flags
                    resultArray[a].Issuer = accountNFTs[b].Issuer
                    resultArray[a].NFTokenTaxon = accountNFTs[b].NFTokenTaxon
                    resultArray[a].nft_serial = accountNFTs[b].nft_serial
                    resultArray[a].TransferFee = accountNFTs[b].TransferFee

                    accountNFTs[b].confirmed = true
                    break
                }
            }
        }

        var resultCSV = `Minting Order, NFTokenID, URI, Serial, Taxon, Transfer Fees, Flags, Issuer, Minting Hash`
        for (a in resultArray) {
            if (resultArray[a].URI != undefined) {
                var uri = xrpl.convertHexToString(resultArray[a].URI)
            } else {
                var uri = undefined
            }

            resultCSV += `\n${resultArray[a].order}, ${resultArray[a].NFTokenID}, ${uri}, ${resultArray[a].nft_serial}, ${resultArray[a].NFTokenTaxon}, ${resultArray[a].TransferFee / 1000}, ${resultArray[a].Flags}, ${resultArray[a].Issuer}, ${resultArray[a].mintHash}`
        }

        var uploadDocumentOCM = []
        for (a in resultArray) {
            if (resultArray[a].NFTokenID == undefined) continue

            uploadDocumentOCM.push({
                NFTokenID: resultArray[a].NFTokenID,
                issuer: resultArray[a].Issuer,
                knownHolder: mintingWallet.classicAddress
            })
        }


        //SAVE OUTPUT FILES
        if(!(fs.existsSync(`./outputs`))){
            fs.mkdirSync(`./outputs`)
        }
        fs.writeFileSync(`./outputs/NFToken_Minting_Result.csv`, resultCSV)
        fs.writeFileSync(`./outputs/OCM_Listing_File.json`, JSON.stringify(uploadDocumentOCM, null, 1))


        console.log(`\n\nMinting Has Successfully Completed\nPlease review your XRPL account and the Outputted Documents, and make any necessary adjustments\n\n\nVisit https://onchainmarketplace.net/ to list, trade, and control your new NFTokens in a decentralised manner!\n\nThis Tool Was Provided For Free Use By OnChain Marketplace`)
    } catch (error) {
        console.log(`ERROR THROWN\n${error}`)
        return
    } finally {
        await xrplClient.disconnect()
    }
}


//Details for testing


mint(websocket, issuerAddress, minterSeed, uris, taxon, transferFee, memo, checkForExisting, burnable, onlyXRP, trustline, transferable)
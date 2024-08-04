const web3  = require('@solana/web3.js');
const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const crypto = require('crypto');
// const nacl = require('tweetnacl');
const generateClaimTransaction = require('../lib/generateClaimTransaction');

const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

exports.claim = async (req, res) => {

    try {

        const userWalletPubkey = req.params.wallet.trim();

        let data = await dbQuery('SELECT * FROM `holders` WHERE wallet = ?', [userWalletPubkey]);

        if (
            (typeof data !== 'undefined')
            && (typeof data[0] !== 'undefined')
            && (typeof data[0].tokens_to_claim !== 'undefined')
        ) {
            
            // user
            const user = data[0];
            
            // calculate tokens_to_claim
            let tokens_to_claim = parseFloat(user.tokens_to_claim);

            // get list of already staked
            let dbNfts = await dbQuery('SELECT * FROM `staked` WHERE wallet = ?', [userWalletPubkey]);

            console.log('dbNfts', dbNfts);

            let now = DateTime.local().toFormat(config.luxonFormat);

            if (
                (typeof dbNfts[0] !== 'undefined')
            ) {
                for (let nft of dbNfts) {
                    // ==================================================================================================================================
                    // calculate tokens_to_claim amount, from timestamp last_claimed_on and until now
                    let seconds_until_now;
                    console.log("user.last_claimed_on", typeof user.last_claimed_on, user.last_claimed_on)
                    if (
                        (user.last_claimed_on === null)
                        || (user.last_claimed_on <= nft.staked_on)
                    ) {
                        seconds_until_now = config.toTimestamp(now) - config.toTimestamp(nft.staked_on);
                    } else {
                        seconds_until_now = config.toTimestamp(now) - config.toTimestamp(user.last_claimed_on);
                    }

                    tokens_to_claim += config.toDecimal(seconds_until_now * config.hashlist[nft.mint].yield_per_second);

                    // ===================================================================================================================================
                }

                console.log('tokens_to_claim', tokens_to_claim)
                tokens_to_claim = config.toDecimal(tokens_to_claim);
            }
            //

            //

            const fromWallet = web3.Keypair.fromSecretKey(
                new Uint8Array(
                    JSON.parse(process.env[config.PREFIX + 'TOKEN_WALLET'])
                )
            );

            let transaction = await generateClaimTransaction(fromWallet, userWalletPubkey, tokens_to_claim);	
            
            /*const signature = nacl.sign.detached(transaction.serializeMessage(), fromWallet.secretKey);
            transaction.addSignature(fromWallet.publicKey, signature);
            
            let isVerifiedSignature = transaction.verifySignatures();
            console.log(`The signatures were verifed: ${isVerifiedSignature}`)*/
        
            //
            let endcodedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });
        
            // endcodedTransaction = endcodedTransaction.toJSON()
            //
        
            //   await sleep(1000);

            const id = crypto.randomBytes(16).toString("hex");
            console.log(id); // => f9b327e70bbcf42494ccb28b2d98e00e

            // let insertPrepared = { id: id, wallet: userWalletPubkey, tokens_to_claim: tokens_to_claim, last_claimed_on: now, transaction: JSON.stringify(endcodedTransaction), type: 'claim' };
            let insertPrepared = [ id, userWalletPubkey, tokens_to_claim, now, JSON.stringify(endcodedTransaction), 'claim' ];
            let dbResultInsertPrepared = await dbQuery("INSERT INTO `prepared` (id, wallet, tokens_to_claim, last_claimed_on, transaction, type) VALUES (?, ?, ?, ?, ?, ?)", insertPrepared);

            // invalidate other pending transactions
            let invalidate = await dbQuery("UPDATE `prepared` SET `status` = 'invalidated' where `wallet` = ? AND `status` = 'pending' AND id != ?", [userWalletPubkey, id]);

            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).jsonp({
                success: true,
                sig: id,
                tx: endcodedTransaction
            });
        
            //

        } else {
            let message = 'claim error'
            console.log(message)
            let response = { success: false, data: message };
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).jsonp(response);
        }

    } catch (error) {
        let message = 'transaction error'
        console.log(message, error, req.params, req.body)
        res.status(500).jsonp({ success: false, message: message });
        return;
    }


}
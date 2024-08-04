const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');

const web3  = require('@solana/web3.js');
const crypto = require('crypto');
const nacl = require('tweetnacl');
const requestWithRetry = require('../lib/requestWithRetry');
const verifyBothTransactions = require('../lib/verifyBothTransactions');
const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

exports.unstakeMintsVerify = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

		// const config = req.config
		// const dbQuery = req.dbQuery

		config.log(['========== UNSTAKE MINTS VERIFY ============='])
    
        let transaction = req.body.tx;
        const id = req.body.sig.trim();

        let signedTransaction = web3.Transaction.from(Buffer.from(transaction, 'base64'));

        console.log("Signatures", signedTransaction.signatures)

        let parsedTransaction = JSON.parse(JSON.stringify(signedTransaction));

        console.log('parsedTransaction', parsedTransaction)

        console.log('signedTransaction', JSON.stringify(signedTransaction));

        let dbResultGet = await dbQuery("SELECT * FROM `prepared` WHERE `id` = ? AND `status` = 'pending' AND `type` = 'unstake'", [id]);

        let data = dbResultGet;

        if (
            (typeof data[0] === 'undefined')
            || (typeof data[0].wallet === 'undefined')
            || (typeof data[0].mints === 'undefined')
            || (data[0].mints.length <= 0)
            || (typeof data[0].transaction === 'undefined')
            || (data[0].transaction.length <= 0)
        ) {
            let message = 'could not find sig'
            console.log(message, data, req.params)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        // invalidate other pending transactions
        let invalidate = await dbQuery("UPDATE `prepared` SET `status` = 'invalidated' where `wallet` = ? AND `status` = 'pending' AND id != ?", [data[0].wallet, id]);

        config.USER.WALLET = data[0].wallet;

        if (typeof process.env.DEV_ENVIRONMENT !== 'undefined' && process.env.DEV_ENVIRONMENT) {
            // different version of DB on local
            data[0].mints = data[0].mints;
        } else {
            data[0].mints = JSON.parse(data[0].mints);
        }

        console.log('DB Data wallet', data[0].wallet, 'mints', data[0].mints, 'transaction', data[0].transaction);
        //

        // rebuild the transaction from what we have saved in the db initially
        // and just add the users's signature

        let rebuiltDbTransaction = web3.Transaction.from(Buffer.from(JSON.parse(data[0].transaction), 'base64'));
        rebuiltDbTransaction.signatures = signedTransaction.signatures;

        // grab phantom wallet's instructions added for ComputeBudget
        // and add it to the rebuilt db transaction
        for (let instruction of signedTransaction.instructions) {
            if (instruction.programId == 'ComputeBudget111111111111111111111111111111') {
                rebuiltDbTransaction.instructions.push(instruction)
            }
        }

        console.log('DBTransaction', rebuiltDbTransaction);
        //

        // sign with authorityWallet
        const authorityWallet = web3.Keypair.fromSecretKey(
			new Uint8Array(
				JSON.parse(process.env[config.PREFIX + 'FREEZE_WALLET'])
			)
		);
        // rebuiltDbTransaction = signedTransaction;
        // rebuiltDbTransaction.sign(authorityWallet)
        const signature = nacl.sign.detached(rebuiltDbTransaction.serializeMessage(), authorityWallet.secretKey);
        console.log("Signature", signature)
		rebuiltDbTransaction.addSignature(authorityWallet.publicKey, signature);

        console.log('rebuiltDbTransaction 2', rebuiltDbTransaction);

        // verify signature
        const isVerifiedSignature = rebuiltDbTransaction.verifySignatures();

        console.log("IS VERIFIED ? ======\n", isVerifiedSignature);
        if (!isVerifiedSignature) {
            let message = 'could not verify sig'
            console.log(message, isVerifiedSignature, req.params)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        // // verify received_tx vs db_tx
        // let verifyBoth = verifyBothTransactions(parsedTransaction, JSON.parse(data[0].transaction));// receivedTransaction, dbTransaction
        // if (!verifyBoth) {
        //     let message = 'could not verify txn'
        //     console.log(message)
        //     res.status(500).jsonp({ success: false, message: message });
        //     return;
        // }

        // check user, and retrieve tokens_to_claim, will be needed to update them after unstake has been done
        let userData = await dbQuery('SELECT * FROM `holders` WHERE wallet = ?', [data[0].wallet]);

        if (
            (typeof userData !== 'undefined')
            && (typeof userData[0] !== 'undefined')
            && (typeof userData[0].tokens_to_claim !== 'undefined')
        ) {

            
            // user
            const user = userData[0];
            
            // calculate tokens_to_claim
            let tokens_to_claim = parseFloat(user.tokens_to_claim);
        
            //
            let txn_id;

            try {

                const rawTransaction = rebuiltDbTransaction.serialize();

                const connection = new web3.Connection(process.env.RPC, config.commitment);

                console.log('sending unstake nfts transaction...');
                txn_id = await requestWithRetry (connection, rawTransaction)

                config.log(['txn_id', txn_id]);

            } catch (error) {
                let message = 'transaction error'
                console.log(message, '-', typeof error, '-', error, req.body)
                // update error in db
                let dbResultUpdateFailed = await dbQuery("UPDATE `prepared` SET `status` = 'failed', `error` = ? WHERE id = ?", [JSON.stringify(error), id]);
                console.log('Error updated for: ', id);
                //
                res.status(500).jsonp({ success: false, message: message });
                return;
            }

            // date
            let now = DateTime.local().toFormat(config.luxonFormat);

            let dels = [];
            let db_mints = data[0].mints;
            
            let mintsData = await dbQuery('SELECT * FROM `staked` WHERE mint IN (?)', [db_mints]);
            
            console.log('tokens_to_claim ======= entry', tokens_to_claim)
            config.log(['mintsData', mintsData])
            
            for (let nft of mintsData) {

                let m = nft['mint'];                

                dels.push(m);
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

                config.log(['config.hashlist[nft.mint]', config.hashlist[nft.mint]]);
                config.log(['seconds_until_now', seconds_until_now]);

                if (seconds_until_now > 0) {

                    tokens_to_claim += config.toDecimal(seconds_until_now * config.hashlist[nft.mint].yield_per_second);

                    console.log('tokens_to_claim individual', tokens_to_claim)

                } else {
                    config.log(['Seconds until now is negative']);
                }
                // ===================================================================================================================================
            }

            console.log('tokens_to_claim', tokens_to_claim)
            tokens_to_claim = config.toDecimal(tokens_to_claim);
            console.log('tokens_to_claim decimal', tokens_to_claim)

            let dbResultDeleteStaked = await dbQuery("DELETE FROM `staked` WHERE wallet = ? AND mint IN (?)", [data[0].wallet, dels]);

            let dbResultUpdateHoldersTokensToClaim = await dbQuery("UPDATE holders SET tokens_to_claim = " + tokens_to_claim + " WHERE wallet = ? ", [data[0].wallet]);

            let dbResultUpdateSuccess = await dbQuery("UPDATE `prepared` SET `status` = 'completed', `txn_id` = ? WHERE id = ?", [txn_id, id]);

            console.log('UNSTAKE NFTs SUCCESS');

            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).jsonp({
                success: true,
                data: {message: 'OK'}
            });
            return;

        }  else {
            let message = 'unstake error'
            console.log(message)
            let response = { success: false, data: message };
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.status(200).jsonp(response);
        }

    } catch (error) {
        let message = 'verify error'
        console.log(message, error, req.params)
        res.status(500).jsonp({ success: false, message: message });
        return;
    }

}

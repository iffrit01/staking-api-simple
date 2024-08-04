const web3  = require('@solana/web3.js');
const crypto = require('crypto');
const requestWithRetry = require('../lib/requestWithRetry');
const verifyBothTransactions = require('../lib/verifyBothTransactions');
const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

const stakeMintsVerifyGlobal = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

		const config = req.config
		const dbQuery = req.dbQuery
        const dbQueryBatch = req.dbQueryBatch

		config.log(['========== STAKE MINTS VERIFY GLOBAL ============='])
    
        let transaction = req.body.tx;
        const id = req.body.sig.trim();

        let signedTransaction = web3.Transaction.from(Buffer.from(transaction, 'base64'));

        let parsedTransaction = JSON.parse(JSON.stringify(signedTransaction));

        console.log('parsedTransaction', parsedTransaction)

        console.log('signedTransaction', JSON.stringify(signedTransaction));

        let dbResultGet = await dbQuery("SELECT * FROM `prepared` WHERE `id` = ? AND `status` = 'pending' AND `type` = 'stake'", [id]);

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

        config.USER.WALLET = data[0].wallet;

        if (typeof process.env.DEV_ENVIRONMENT !== 'undefined' && process.env.DEV_ENVIRONMENT) {
            // different version of DB on local
            data[0].mints = data[0].mints;
        } else {
            data[0].mints = JSON.parse(data[0].mints);
        }

        console.log('DB Data wallet', data[0].wallet, 'mints', data[0].mints, 'transaction', data[0].transaction);
        
        // verify signature
        const isVerifiedSignature = signedTransaction.verifySignatures();

        console.log("IS VERIFIED ? ======\n", isVerifiedSignature);
        if (!isVerifiedSignature) {
            let message = 'could not verify sig'
            console.log(message, error, req.params)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        // verify received_tx vs db_tx
        let verifyBoth = verifyBothTransactions(parsedTransaction, JSON.parse(data[0].transaction));// receivedTransaction, dbTransaction
        if (!verifyBoth) {
            let message = 'could not verify txn'
            console.log(message)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        let txn_id;

        try {

            const rawTransaction = signedTransaction.serialize();

            const connection = new web3.Connection(process.env.RPC, config.commitment);

            console.log('sending stake nfts transaction...');
            txn_id = await requestWithRetry (connection, rawTransaction)

            console.log('txn_id', txn_id);

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
        let now = DateTime.local();
        // let today = now.toISODate();//YYYY-MM-DD
        let today = now.toFormat(config.luxonFormat);

        let ins = [];

        let db_mints = data[0].mints;
config.log(['db mints', db_mints]);
        // delete old entries (if someone transferred the nft to another wallet)
        let mints_to_delete = [];

        for (m of db_mints) {
            // ins.push({wallet: data[0].wallet, mint: m, txn_id: txn_id, staked_on: today });
            ins.push([data[0].wallet, m, txn_id, today]);
            mints_to_delete.push(m);
        }
        // delete if staked on some other wallet

        let dbResultDeleteStaked = await dbQuery("DELETE FROM `staked` WHERE mint IN (?)", [mints_to_delete]);
config.log(['INSERT', ins]);
        let dbResultInsertStaked = await dbQueryBatch("INSERT INTO `staked` (wallet, mint, txn_id, staked_on) VALUES (?, ?, ?, ?)", ins);

        let dbResultUpdateSuccess = await dbQuery("UPDATE `prepared` SET `status` = 'completed', `txn_id` = ? WHERE id = ?", [txn_id, id]);

        console.log('STAKE NFTs SUCCESS');

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).jsonp({
            success: true,
            data: {message: 'OK'}
        });
        return;

    } catch (error) {
        let message = 'verify error'
        console.log(message, error, req.params)
        res.status(500).jsonp({ success: false, message: message });
        return;
    }

}

module.exports = stakeMintsVerifyGlobal

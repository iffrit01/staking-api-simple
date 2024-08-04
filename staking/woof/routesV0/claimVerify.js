const web3  = require('@solana/web3.js');
const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const nacl = require('tweetnacl');
const requestWithRetry = require('../lib/requestWithRetry');
const verifyBothTransactions = require('../lib/verifyBothTransactions');

exports.claimVerify = async (req, res) => {

    try {

        let transaction = req.body.tx;
        const id = req.body.sig.trim();

        let signedTransaction = web3.Transaction.from(Buffer.from(transaction, 'base64'));

        let parsedTransaction = JSON.parse(JSON.stringify(signedTransaction));

        let userWallet = parsedTransaction.feePayer;

        console.log('userWallet', userWallet);

        // console.log('parsedTransaction', parsedTransaction.signatures)

        console.log('signedTransaction', JSON.stringify(signedTransaction));

        let dbResultGet = await dbQuery("SELECT * FROM `prepared` WHERE `id` = ? AND `status` = 'pending' AND `type` = 'claim' AND `ctime` BETWEEN (DATE_SUB(NOW(),INTERVAL 1 MINUTE)) AND NOW()", [id]);

        let data = dbResultGet;    

        if (
            (typeof data[0] === 'undefined')
            || (typeof data[0].wallet === 'undefined')
            || (typeof data[0].tokens_to_claim === 'undefined')
            || (typeof data[0].transaction === 'undefined')
            || (data[0].transaction.length <= 0)
        ) {
            let message = 'could not find sig'
            console.log(message, data, req.params, req.body)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        // invalidate other pending transactions
        let invalidate = await dbQuery("UPDATE `prepared` SET `status` = 'invalidated' where `wallet` = ? AND `status` = 'pending' AND id != ?", [data[0].wallet, id]);

        // rebuild the transaction from what we have saved in the db initially
        // and just add the users's signature

        let rebuiltDbTransaction = web3.Transaction.from(Buffer.from(JSON.parse(data[0].transaction), 'base64'));
        rebuiltDbTransaction.signatures = signedTransaction.signatures;

        console.log('DBTransaction', rebuiltDbTransaction);

        console.log('DB Data wallet', data[0].wallet, 'transaction', typeof data[0].transaction, data[0].transaction);

        // to check if we have enough
        let tokensToClaim = parseFloat(data[0].tokens_to_claim);
        
        // get old values (to revert to them if needed)
        let userData = await dbQuery('SELECT * FROM `holders` WHERE wallet = ?', [data[0].wallet]);
        console.log('Old userData', userData);
        let user = userData[0];

        let oldTokensToClaim = parseFloat(user.tokens_to_claim);
        let oldDateClaimed = user.last_claimed_on;
        //
        
        // verify signature
        // const isVerifiedSignature = signedTransaction.verifySignatures();

        // sign and verify signature
        const fromWallet = web3.Keypair.fromSecretKey(
			new Uint8Array(
				JSON.parse(process.env[config.PREFIX + 'TOKEN_WALLET'])
			)
		);

        // const signature = nacl.sign.detached(transaction.serializeMessage(), fromWallet.secretKey);
        const signature = nacl.sign.detached(rebuiltDbTransaction.serializeMessage(), fromWallet.secretKey);
		rebuiltDbTransaction.addSignature(fromWallet.publicKey, signature);

        const isVerifiedSignature = rebuiltDbTransaction.verifySignatures();

        console.log("IS VERIFIED ? ======\n", isVerifiedSignature);
        if (!isVerifiedSignature) {
            let message = 'could not verify sig'
            console.log(message, req.params, req.body)
            res.status(500).jsonp({ success: false, message: message });
            return;
        } else {
            console.log("\n\n...........signature verification passed..............\n\n");
        }

        // verify received_tx vs db_tx
        let verifyBoth = verifyBothTransactions(parsedTransaction, JSON.parse(JSON.stringify(rebuiltDbTransaction)));
        if (!verifyBoth) {
            let message = 'could not verify txn'
            console.log(message)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        // let now = DateTime.local();
        // let dateClaimed = now.toISODate();
        // let dateClaimed = now.toFormat('yyyy-LL-dd hh:mm:ss');
        let dateClaimed = data[0].last_claimed_on;
        console.log('DT dateClaimed', dateClaimed);

        let txn_id;

        try {

            const rawTransaction = rebuiltDbTransaction.serialize();

            const connection = new web3.Connection(process.env.RPC, config.commitment);

            
            
            
            console.log('setting holders tokens_to_claim to 0, before sending txn');
            // set holder's tokens_to_claim to 0 (in case of a refresh in a middle of transaction)

            let dbResultUpdateToZero = await dbQuery("UPDATE `holders` SET `tokens_to_claim` = '0', `last_claimed_on` = ? WHERE `wallet` = ?", [dateClaimed, userWallet]);

            console.log('sending claim transaction...');
            txn_id = await requestWithRetry (connection, rawTransaction)

            console.log('txn_id', txn_id);

        } catch (error) {

            let err = error.message;

            console.log('TRANSACTION ERROR', '|' + err + '|');

            // return tokens_to_claim in case of an error
            let dbResultUpdateToOldValue = await dbQuery("UPDATE `holders` SET `tokens_to_claim` = ?, `last_claimed_on` = ? WHERE `wallet` = ?", [oldTokensToClaim, oldDateClaimed, userWallet]);

            // set prepared as completed
            let dbResultUpdateFailed = await dbQuery("UPDATE `prepared` SET `status` = 'failed', `error` = ? WHERE id = ?", [JSON.stringify(error), id]);
            console.log('Error updated for: ', id);


            let message = 'transaction error'
            console.log(message, error)
            res.status(500).jsonp({ success: false, message: message });
            return;
        }

        // insert into withdrawals
        // let ins = { wallet: userWallet, withdrawn_on: dateClaimed, tokens_withdrawn: tokensToClaim };
        let ins = [ userWallet, dateClaimed, tokensToClaim ];
        let dbResultInsertWithdraws = await dbQuery("INSERT INTO `withdraws` (wallet, withdrawn_on, tokens_withdrawn) VALUES (?, ?, ?)", ins);

        // set prepared as completed
        let dbResultUpdateSuccess = await dbQuery("UPDATE `prepared` SET `status` = 'completed', `txn_id` = ? WHERE id = ?", [txn_id, id]);

        console.log('CLAIM SUCCESS !!!');

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).jsonp({
            success: true,
            data: {
                message: 'OK',
                txnId: txn_id
            }
        });

    } catch (error) {
        let message = 'transaction error'
        console.log(message, error, req.params, req.body)
        res.status(500).jsonp({ success: false, message: message });
        return;
    }

}
    
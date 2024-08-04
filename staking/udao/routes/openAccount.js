const web3  = require('@solana/web3.js');
const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const crypto = require('crypto');

exports.openAccount = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {
	
		const receivedFromWalletPublicKey = req.body.userWalletPublicKey.trim();

		const paymentReceivingWalletPublicKey = new web3.PublicKey(process.env[config.PREFIX + 'PAYMENT_RECEIVING_WALLET_PUBLIC_KEY']);

		const connection = new web3.Connection(process.env.RPC, config.commitment);

		if (
			!receivedFromWalletPublicKey
		) {
			console.log(receivedFromWalletPublicKey);
			res.status(400).jsonp({ success: false, message: 'Incorrect params' });
			return;
		}

		const fromWalletPublicKey = new web3.PublicKey(receivedFromWalletPublicKey);		

		// preparing instructions
		let instructions = [];

        // payment instruction
        if (config.walletsExcludedFromPayment.includes(fromWalletPublicKey.toBase58())) {
            console.log('Wallet in list', web3.LAMPORTS_PER_SOL * config.priceForKnowners);
			instructions.push(
                web3.SystemProgram.transfer({
                    fromPubkey: fromWalletPublicKey,
                    toPubkey: paymentReceivingWalletPublicKey,
                    lamports: web3.LAMPORTS_PER_SOL * config.priceForKnowners,
                })
            )
        } else {
			console.log('Wallet NOT in list', web3.LAMPORTS_PER_SOL, config.priceForYabanjiesOpeningAccount, web3.LAMPORTS_PER_SOL * config.priceForYabanjiesOpeningAccount);
			instructions.push(
                web3.SystemProgram.transfer({
                    fromPubkey: fromWalletPublicKey,
                    toPubkey: paymentReceivingWalletPublicKey,
                    lamports: web3.LAMPORTS_PER_SOL * config.priceForYabanjiesOpeningAccount,
                })
            )
		}

		

		// console.log('INSTRUCTIONS', JSON.stringify(instructions))

		const transaction = new web3.Transaction().add(...instructions);

		transaction.feePayer = fromWalletPublicKey;

		transaction.recentBlockhash = (await connection.getLatestBlockhash(config.commitment)).blockhash;

		const rawTransaction = transaction.serialize({
			requireAllSignatures: false,
			verifySignatures: false,
		});

		const id = crypto.randomBytes(16).toString("hex");
		console.log(id); // => f9b327e70bbcf42494ccb28b2d98e00e

        // let insertPrepared = { id: id, wallet: receivedFromWalletPublicKey, mints: JSON.stringify([]), transaction: JSON.stringify(transaction) };
		let insertPrepared = [ id, receivedFromWalletPublicKey, JSON.stringify([]), JSON.stringify(transaction) ];
        let dbResultInsertPrepared = await dbQuery("INSERT INTO `prepared_holders` (id, wallet, mints, transaction) VALUES (?, ?, ?, ?)", insertPrepared);

        console.log(dbResultInsertPrepared);//.insertId);

		res.setHeader('Access-Control-Allow-Origin', '*')
		res.status(200).jsonp({
			success: true,
			sig: id,
			tx: rawTransaction,
			transaction: transaction
		});

	} catch (error) {
		let message = 'stake error'
		console.log(message, error, req.params)
		res.status(500).jsonp({ success: false, message: message });
		return;
	}

}
const web3  = require('@solana/web3.js');
const crypto = require('crypto');

const {
	resolveToWalletAddress,
	getParsedNftAccountsByOwner,
} = require('@nfteyez/sol-rayz');

const unstakeMintsGlobal = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

		const config = req.config
		const dbQuery = req.dbQuery

		config.log(['========== UNSTAKE MINTS GLOBAL ============='])
	
		const receivedFromWalletPublicKey = req.body.userWalletPublicKey.trim();
		const receivedMints = req.body.mints;

		const paymentReceivingWalletPublicKey = new web3.PublicKey(process.env[config.PREFIX + 'PAYMENT_RECEIVING_WALLET_PUBLIC_KEY']);
		const emptyWalletPublicKey = new web3.PublicKey(process.env[config.PREFIX + 'EMPTY_WALLET_PUBLIC_KEY']);

		const connection = new web3.Connection(process.env.RPC, config.commitment);

		if (
			!receivedFromWalletPublicKey
			|| (typeof receivedMints !== 'object')
			|| (receivedMints.length <= 0)
		) {
			console.log(receivedFromWalletPublicKey, typeof receivedMints, receivedMints.length);
			res.status(400).jsonp({ success: false, message: 'Incorrect params' });
			return;
		}

		config.USER.WALLET = receivedFromWalletPublicKey;

		const fromWalletPublicKey = new web3.PublicKey(receivedFromWalletPublicKey);
		const mints = receivedMints;

		//////////////////// check if sent mints are in the DB
        let dbResultGet = await dbQuery("SELECT * FROM `staked` WHERE `wallet` = ? AND `mint` IN (?)", [receivedFromWalletPublicKey, mints]);

        let data = dbResultGet;
        
        for (let m of mints) {
			let inWallet = false;
			for (let nft of data) {
				if (
					(typeof nft.mint !== 'undefined')
					&& (nft.mint == m)
				) {
					inWallet = true;
				}
			}
			if (!inWallet) {
				console.log('Sent mint not in the DB', m, fromWalletPublicKey.toBase58());
				res.status(400).jsonp({ success: false, message: 'Wrong params' });
				return;
			}
		}
		//////////////////// end check

		// preparing instructions
		let instructions = [];

        // payment instruction
        // if (config.walletsExcludedFromPayment.includes(fromWalletPublicKey.toBase58())) {
        //     console.log('Wallet in list');
			instructions.push(
                web3.SystemProgram.transfer({
                    fromPubkey: fromWalletPublicKey,
                    toPubkey: emptyWalletPublicKey,
                    lamports: web3.LAMPORTS_PER_SOL * 0.000000001,
                })
            )
        // } else {
		// 	console.log('Wallet NOT in list', web3.LAMPORTS_PER_SOL);
		// 	instructions.push(
        //         web3.SystemProgram.transfer({
        //             fromPubkey: fromWalletPublicKey,
        //             toPubkey: paymentReceivingWalletPublicKey,
        //             lamports: web3.LAMPORTS_PER_SOL * 0.015,//web3.LAMPORTS_PER_SOL / 1250,
        //         })
        //     )
		// }		

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

		let insertPrepared = [ id, receivedFromWalletPublicKey, JSON.stringify(mints), JSON.stringify(transaction), 'unstake' ];
        let dbResultInsertPrepared = await dbQuery("INSERT INTO `prepared` (id, wallet, mints, transaction, type) VALUES (?, ?, ?, ?, ?)", insertPrepared);

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

module.exports = unstakeMintsGlobal

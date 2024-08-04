const web3  = require('@solana/web3.js');
const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const crypto = require('crypto');

const {
	resolveToWalletAddress,
	getParsedNftAccountsByOwner,
} = require('@nfteyez/sol-rayz');

exports.stakeMints = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

        // res.status(400).jsonp({ success: false, message: 'Cannot stake' });
        // return;
	
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

		const fromWalletPublicKey = new web3.PublicKey(receivedFromWalletPublicKey);
		const mints = receivedMints;

		//////////////////// check if sent mints are in this wallet
		const publicAddress = await resolveToWalletAddress({
            text: receivedFromWalletPublicKey
        });
        // get user's nfts
        const nftArray = await getParsedNftAccountsByOwner({
            publicAddress,
            connection
        });
		for (let m of mints) {
			let inWallet = false;
			for (let nft of nftArray) {
				if (
					(typeof nft.mint !== 'undefined')
					&& (nft.mint == m)
				){
					inWallet = true;
				}
			}
			if (!inWallet) {
				console.log('Sent mint not from this wallet', m, fromWalletPublicKey.toBase58());
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

        let insertPrepared = { id: id, wallet: receivedFromWalletPublicKey, mints: JSON.stringify(mints), transaction: JSON.stringify(transaction), type: 'stake' };
        let dbResultInsertPrepared = await dbQuery("INSERT INTO `prepared` SET ?", insertPrepared);

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

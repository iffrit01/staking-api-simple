const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const web3  = require('@solana/web3.js');
const crypto = require('crypto');

const {
	resolveToWalletAddress,
	getParsedNftAccountsByOwner,
} = require('@nfteyez/sol-rayz');

const fs = require('fs')
const { PublicKey, Transaction, Keypair, clusterApiUrl, Connection } = require('@solana/web3.js')
const { createApproveInstruction, TOKEN_PROGRAM_ADDRESS, getAssociatedTokenAddress } = require('@solana/spl-token')
const { createFreezeDelegatedAccountInstruction, PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata')

exports.stakeMints = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

		// const config = req.config
		// const dbQuery = req.dbQuery

		config.log(['========== STAKE MINTS ============='])
	
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

		// freeze params
		const USER_WALLET_ADDRESS = receivedFromWalletPublicKey;
		const walletSecretKey = web3.Keypair.fromSecretKey(
			new Uint8Array(
				JSON.parse(process.env[config.PREFIX + 'FREEZE_WALLET'])
			)
		);

		const userWalletAddress = new PublicKey(USER_WALLET_ADDRESS)
		const authorityWallet = walletSecretKey;//Keypair.fromSecretKey(walletSecretKey)
		//

		config.USER.WALLET = receivedFromWalletPublicKey;

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
		// let instructions = [];

        // payment instruction
        // if (config.walletsExcludedFromPayment.includes(fromWalletPublicKey.toBase58())) {
        //     console.log('Wallet in list');
			// instructions.push(
            //     web3.SystemProgram.transfer({
            //         fromPubkey: fromWalletPublicKey,
            //         toPubkey: emptyWalletPublicKey,
            //         lamports: web3.LAMPORTS_PER_SOL * 0.000000001,
            //     })
            // )
        // } else {
		// 	console.log('Wallet NOT in list', web3.LAMPORTS_PER_SOL);
			// instructions.push(
            //     web3.SystemProgram.transfer({
            //         fromPubkey: fromWalletPublicKey,
            //         toPubkey: paymentReceivingWalletPublicKey,
            //         lamports: web3.LAMPORTS_PER_SOL * 0.00005,//web3.LAMPORTS_PER_SOL / 1250,
            //     })
            // )
		// }

		// // freeze instructions
		// for (let m of mints) {
		// 	const NFT_MINT_ID = new PublicKey(m)

		// 	const accountAddress = await getAssociatedTokenAddress(NFT_MINT_ID, userWalletAddress)

		// 	instructions.push(
		// 		createApproveInstruction(
		// 			accountAddress,
		// 			authorityWallet.publicKey,
		// 			userWalletAddress,
		// 			1
		// 		)
		// 	)

		// 	const [edition] = PublicKey.findProgramAddressSync(
		// 		[
		// 			Buffer.from("metadata"),
		// 			PROGRAM_ID.toBuffer(),
		// 			NFT_MINT_ID.toBuffer(),
		// 			Buffer.from("edition"),
		// 		],
		// 		PROGRAM_ID
		// 	);

		// 	instructions.push(
		// 		createFreezeDelegatedAccountInstruction(
		// 			{
		// 				delegate: authorityWallet.publicKey,
		// 				tokenAccount: accountAddress,
		// 				edition,
		// 				mint: NFT_MINT_ID,
		// 				// Import TOKEN_PROGRAM_ADDRESS from @solana/spl-token and add it here
		// 				tokenProgram: TOKEN_PROGRAM_ADDRESS,
		// 			},
		// 			PROGRAM_ID
		// 		)
		// 	)
		// }
		//

		

		// config.log(['INSTRUCTIONS', JSON.stringify(instructions)])

		// const transaction = new web3.Transaction().add(...instructions);

		const transaction = new web3.Transaction();

		transaction.feePayer = userWalletAddress;

		transaction.recentBlockhash = (await connection.getLatestBlockhash(config.commitment)).blockhash;

		// transaction.add(
		// 	web3.SystemProgram.transfer({
		// 		fromPubkey: fromWalletPublicKey,
		// 		toPubkey: paymentReceivingWalletPublicKey,
		// 		lamports: web3.LAMPORTS_PER_SOL * 0.00005,//web3.LAMPORTS_PER_SOL / 1250,
		// 	})
		// )

		// freeze instructions
		for (let m of mints) {

			const NFT_MINT_ID = new PublicKey(m)

			const accountAddress = await getAssociatedTokenAddress(NFT_MINT_ID, userWalletAddress)

			transaction.add(
				createApproveInstruction(
					accountAddress,
					authorityWallet.publicKey,
					userWalletAddress,
					1
				)
			)

			const [edition] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("metadata"),
					PROGRAM_ID.toBuffer(),
					NFT_MINT_ID.toBuffer(),
					Buffer.from("edition"),
				],
				PROGRAM_ID
			);

			transaction.add(
				createFreezeDelegatedAccountInstruction(
					{
						delegate: authorityWallet.publicKey,
						tokenAccount: accountAddress,
						edition,
						mint: NFT_MINT_ID,
						// Import TOKEN_PROGRAM_ADDRESS from @solana/spl-token and add it here
						tokenProgram: TOKEN_PROGRAM_ADDRESS,
					},
					PROGRAM_ID
				)
			)
		}

		// transaction.sign(authorityWallet)

		const rawTransaction = transaction.serialize({
			requireAllSignatures: false,
			verifySignatures: false,
		});

		const id = crypto.randomBytes(16).toString("hex");
		console.log(id); // => f9b327e70bbcf42494ccb28b2d98e00e

		let insertPrepared = [ id, receivedFromWalletPublicKey, JSON.stringify(mints), JSON.stringify(rawTransaction), 'stake' ];
        console.log('insertPrepared', insertPrepared)
		let dbResultInsertPrepared = await dbQuery("INSERT INTO `prepared` (id, wallet, mints, transaction, type) VALUES (?, ?, ?, ?, ?)", insertPrepared);

        console.log(dbResultInsertPrepared);//.insertId);

		res.setHeader('Access-Control-Allow-Origin', '*')
		res.status(200).jsonp({
			success: true,
			sig: id,
			tx: rawTransaction,
			// transaction: transaction
		});

	} catch (error) {
		let message = 'stake error'
		console.log(message, error, req.params)
		res.status(500).jsonp({ success: false, message: message });
		return;
	}

}


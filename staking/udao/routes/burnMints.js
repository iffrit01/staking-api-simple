const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');

const web3  = require('@solana/web3.js');
const crypto = require('crypto');

const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

const {
	resolveToWalletAddress,
	getParsedNftAccountsByOwner,
} = require('@nfteyez/sol-rayz');

const fs = require('fs')
const { PublicKey, Transaction, Keypair, clusterApiUrl, Connection } = require('@solana/web3.js')
const { createApproveInstruction, TOKEN_PROGRAM_ADDRESS, getAssociatedTokenAddress, createBurnCheckedInstruction, createCloseAccountInstruction } = require('@solana/spl-token')
const { createThawDelegatedAccountInstruction, PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata')

exports.burnMints = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

		// const config = req.config
		// const dbQuery = req.dbQuery

		config.log(['========== BURN MINTS ============='])
	
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

		// unfreeze params
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

		//////////////////// check if sent mints are in the DB
        let dbResultGet = await dbQuery("SELECT * FROM `staked` WHERE `wallet` = ? AND `mint` IN (?)", [receivedFromWalletPublicKey, mints]);

        let data = dbResultGet;
        
        for (let m of mints) {
			let inWallet = false;
			//
			let canUnstake = true;
			for (let nft of data) {
				if (
					(typeof nft.mint !== 'undefined')
					&& (nft.mint == m)
				) {
					inWallet = true;
					// check if ready to unstake
					const lock_end = DateTime.fromFormat(nft.staked_on, config.luxonFormat).plus({days: config.LOCKUP_PERIOD});
					// console.log('lock_end', lock_end)
					// console.log('Local', DateTime.local());
					const canUnstakeMillis = DateTime.local().diff(lock_end).milliseconds;
					// console.log('canUnstakeMillis', canUnstakeMillis)
					// -- TODO HERE canUnstake = canUnstakeMillis > 0;
					console.log('canUnstake', canUnstake)
					//
				}
			}
			if (!inWallet) {
				console.log('Sent mint not in the DB', m, fromWalletPublicKey.toBase58());
				res.status(400).jsonp({ success: false, message: 'Wrong params' });
				return;
			}
			if (!canUnstake) {
				console.log('Mint not out of lockup period (cannot unstake)', m, fromWalletPublicKey.toBase58());
				res.status(400).jsonp({ success: false, message: 'Cannot unstake mint (locked): ' + m});
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
		// 	instructions.push(
        //         web3.SystemProgram.transfer({
        //             fromPubkey: fromWalletPublicKey,
        //             toPubkey: paymentReceivingWalletPublicKey,
        //             lamports: web3.LAMPORTS_PER_SOL * 0.015,//web3.LAMPORTS_PER_SOL / 1250,
        //         })
        //     )
		// }		

		// console.log('INSTRUCTIONS', JSON.stringify(instructions))

		const transaction = new web3.Transaction();

		transaction.feePayer = userWalletAddress;

		transaction.recentBlockhash = (await connection.getLatestBlockhash(config.commitment)).blockhash;

		// transaction.add(
		// 	web3.SystemProgram.transfer({
		// 		fromPubkey: userWalletAddress,
		// 		toPubkey: paymentReceivingWalletPublicKey,
		// 		lamports: web3.LAMPORTS_PER_SOL * 0.00001,//web3.LAMPORTS_PER_SOL / 1250,
		// 	})
		// )

		// unfreeze instructions
		for (let m of mints) {

			const NFT_MINT_ID = new PublicKey(m)

			const accountAddress = await getAssociatedTokenAddress(NFT_MINT_ID, userWalletAddress)

			// transaction.add(
			// 	createApproveInstruction(
			// 		accountAddress,
			// 		authorityWallet.publicKey,
			// 		userWalletAddress,
			// 		1
			// 	)
			// )

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
				createThawDelegatedAccountInstruction(
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

			// burn token / nft
			transaction.add(
				createBurnCheckedInstruction(
					accountAddress,// tokenAccountPubkey, // token account
					NFT_MINT_ID,// mintPubkey, // mint
					userWalletAddress,// alice.publicKey, // owner of token account
					1e0,// 1e8, // amount, if your deciamls is 8, 10^8 for 1 token
					0// 8 // decimals
				)
			)

			// close account
			transaction.add(
				createCloseAccountInstruction(
					accountAddress,// tokenAccountPubkey, // token account which you want to close
					userWalletAddress,// alice.publicKey, // destination
					userWalletAddress,// alice.publicKey // owner of token account
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

		let insertPrepared = [ id, receivedFromWalletPublicKey, JSON.stringify(mints), JSON.stringify(rawTransaction), 'burn' ];
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

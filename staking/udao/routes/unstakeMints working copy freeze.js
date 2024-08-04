const fs = require('fs')
const { PublicKey, Transaction, Keypair, clusterApiUrl, Connection } = require('@solana/web3.js')
const { TOKEN_PROGRAM_ADDRESS, getAssociatedTokenAddress } = require('@solana/spl-token')
const { createThawDelegatedAccountInstruction, PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata')

const walletSecretKey = Uint8Array.from(
  JSON.parse(
    fs.readFileSync('/home/ilir/.config/solana/mainnet-wallets/pALzJmZqL4nkmXr77C9HfBMPHjuJaaxGUABSdVCT9kH.json', 'utf8')
  )
)

exports.unstakeMints = async (req, res) => {
	// res.status(500).jsonp({ success: false, message: 'suspended' });
	// return;

	try {

        // res.status(400).jsonp({ success: false, message: 'Cannot stake' });
        // return;
	
		const receivedFromWalletPublicKey = req.body.userWalletPublicKey.trim();
		const receivedMints = req.body.mints;

		const USER_WALLET_ADDRESS = req.body.userWalletPublicKey.trim()//'RANDOM_WALLET_ADDRESS'
		const NFT_MINT_ID = new PublicKey(req.body.mints[0])//new PublicKey('RANDOM_NFT_ID')


		const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed")
		const userWalletAddress = new PublicKey(USER_WALLET_ADDRESS)
		const authorityWallet = Keypair.fromSecretKey(walletSecretKey)

		// Get block hash
		const blockhashObj = await connection.getLatestBlockhash()
		const blockhash = blockhashObj.blockhash

		// create transaction
		const transaction = new Transaction()
		transaction.feePayer = userWalletAddress
		transaction.recentBlockhash = blockhash

		const accountAddress = await getAssociatedTokenAddress(NFT_MINT_ID, userWalletAddress)

		/*transaction.add(
			createApproveInstruction(
				accountAddress,
				authorityWallet.publicKey,
				userWalletAddress,
				1
			)
		)*/

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
			// createFreezeDelegatedAccountInstruction(
			// 	{
			// 	delegate: authorityWallet.publicKey,
			// 	tokenAccount: accountAddress,
			// 	edition,
			// 	mint: NFT_MINT_ID,
			// 	tokenProgram: PROGRAM_ID,
			// 	},
			// 	PROGRAM_ID
			// )
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

		// sign transaction
		transaction.sign(authorityWallet)

		// serialize and return
		const serializedTransaction = transaction.serialize({
		requireAllSignatures: false,
		});
		const transactionBase64 = serializedTransaction.toString("base64");
		console.log(transactionBase64)

		res.setHeader('Access-Control-Allow-Origin', '*')
		res.status(200).jsonp({
			success: true,
			sig: 33,//id,
			tx: transactionBase64,//rawTransaction,
			transaction: transaction
		});

	} catch (error) {
		let message = 'stake error'
		console.log(message, error, req.params)
		res.status(500).jsonp({ success: false, message: message });
		return;
	}

}

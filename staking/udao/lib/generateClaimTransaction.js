const web3 = require('@solana/web3.js');
const { 
	Token, 
	TOKEN_PROGRAM_ID, 
	getOrCreateAssociatedAccountInfo, 
	decodeTransferInstruction, 
	getMint, 
	getAssociatedTokenAddress, 
	getAccount, 
	getOrCreateAssociatedTokenAccount, 
	createCloseAccountInstruction, 
	createTransferCheckedInstruction, 
	createAssociatedTokenAccountInstruction 
} = require('@solana/spl-token');
const config = require('./config');

async function generateClaimTransaction(fromWallet, toWallet, tokensToClaim) {

    const connection = new web3.Connection(process.env.RPC, config.commitment);
    const userWallet = new web3.PublicKey(toWallet);
    const paymentReceivingWalletPublicKey = new web3.PublicKey(process.env[config.PREFIX + 'PAYMENT_RECEIVING_WALLET_PUBLIC_KEY']);
    const customTokenMint = new web3.PublicKey(process.env[config.PREFIX + 'TOKEN_PUBLIC_KEY']);

    //
    const receivedFromWalletPublicKey = fromWallet.publicKey// new

    const cmint = new web3.PublicKey(process.env[config.PREFIX + 'TOKEN_PUBLIC_KEY']);
    // console.log('cmint', cmint.toBase58());
    // let cmintAccount = await getMint(connection, cmint);
    // console.log('cmintAccount', cmintAccount);
    let cfromATA = await getAssociatedTokenAddress(
        cmint, // mint
        receivedFromWalletPublicKey // owner
    );
    // console.log(`cfromATA`,cfromATA);
    // console.log(`cfromATA: ${cfromATA.toBase58()}`);

    const csenderAccount = await connection.getAccountInfo(cfromATA);
    console.log('csenderAccount', csenderAccount);

    // if (csenderAccount === null) {
    //     console.log('Sender $CITRUS account not found. No $CITRUS account');
    //     res.status(400).jsonp({ success: false, message: 'Sender $CITRUS account not found' });
    //     return;
    // }


    let ctoATA = await getAssociatedTokenAddress(
        cmint, // mint
        userWallet // owner
    );
    console.log(`ctoATA: ${ctoATA.toBase58()}`);

    const creceiverAccount = await connection.getAccountInfo(ctoATA);
        
    console.log('creceiverAccount', creceiverAccount);

    // * Construct an AssociatedTokenAccount instruction
    // *
    // * @param payer                    Payer of the initialization fees
    // * @param associatedToken          New associated token account
    // * @param owner                    Owner of the new account
    // * @param mint                     Token mint account
    // * @param programId                SPL Token program account
    // * @param associatedTokenProgramId SPL Associated Token program account

    const instructions = [];

    if (creceiverAccount === null) {
        instructions.push(
            createAssociatedTokenAccountInstruction(
                userWallet,//receivedFromWalletPublicKey, // payer
                ctoATA, // ata
                userWallet,//paymentReceivingWalletPublicKey, // owner
                cmint // mint
            )
        )
    }
    instructions.push(
        createTransferCheckedInstruction(
            cfromATA, // from (should be a token account)
            cmint, // mint
            ctoATA, // to (should be a token account)
            receivedFromWalletPublicKey, // from's owner
            tokensToClaim * 10**process.env[config.PREFIX + 'TOKEN_DECIMALS'], // amount, if your decimals are 8, send 10^8 for 1 token
            process.env[config.PREFIX + 'TOKEN_DECIMALS'] // decimals
        )
    );
    //

    // const tokenDecimals = Math.pow(10, parseInt(process.env.TOKEN_DECIMALS));

    // const customToken = new Token(
    //     connection,
    //     customTokenMint,
    //     TOKEN_PROGRAM_ID,
    //     userWallet
    // );

    // const fromTokenAccount = await customToken.getOrCreateAssociatedAccountInfo(fromWallet.publicKey)

    // const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
    //     customToken.associatedProgramId,
    //     customToken.programId,
    //     customTokenMint,
    //     userWallet
    // );

    // console.log('associatedDestinationTokenAddr', associatedDestinationTokenAddr);

    // const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr);

    // console.log('receiverAccount', receiverAccount);

    // const instructions = [];

    // if (receiverAccount === null) {
    //     instructions.push(
    //         Token.createAssociatedTokenAccountInstruction(
    //             customToken.associatedProgramId,
    //             customToken.programId,
    //             customTokenMint,
    //             associatedDestinationTokenAddr,
    //             userWallet,
    //             userWallet
    //         )
    //     )
    // }

    // console.log('TOKENS TO CLAIM', tokensToClaim, tokenDecimals);
    
    // instructions.push(
    //     Token.createTransferInstruction(
    //         TOKEN_PROGRAM_ID,
    //         fromTokenAccount.address,
    //         associatedDestinationTokenAddr,
    //         fromWallet.publicKey,
    //         [],
    //         tokensToClaim * tokenDecimals
    //     )
    // );

    // payment instruction
    // if (!config.walletsExcludedFromPayment.includes(userWallet.toBase58())) {
    //     instructions.push(
    //         web3.SystemProgram.transfer({
    //             fromPubkey: userWallet,
    //             toPubkey: paymentReceivingWalletPublicKey,
    //             lamports: web3.LAMPORTS_PER_SOL * config.priceForYabanjiesClaimingFee,
    //         })
    //     )
    // }

    const transaction = new web3.Transaction().add(...instructions);
    transaction.feePayer = userWallet;

    transaction.recentBlockhash = (await connection.getLatestBlockhash(config.commitment)).blockhash;
    
    return transaction;
}

module.exports = generateClaimTransaction;
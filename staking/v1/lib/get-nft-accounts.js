// const web3 = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
async function getNftAccounts(wallet, solanaConnection) {
  // const solanaConnection = new web3.Connection(process.env.RPC);
    const filters = [
        {
          dataSize: 165,    //size of account (bytes)
        },
        {
          memcmp: {
            offset: 32,     //location of our query in the account (bytes)
            bytes: wallet,  //our search criteria, a base58 encoded string
          },            
        }];
    const accounts = await solanaConnection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID, //new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {filters: filters}
    );
    // console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
    let mints = [];
    accounts.forEach((account, i) => {
      
        //Parse the account data
        const parsedAccountInfo = account.account.data;
        const mintAddress = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      if (tokenBalance === 1) {
        //Log results
        // console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
        // console.log(`--Token Mint: ${mintAddress}`);
        // console.log(`--Token Balance: ${tokenBalance}`);
        // console.log(`--Token Balance: ` + JSON.stringify(tokenBalance), tokenBalance === 1, tokenBalance === "1");
        mints.push({mint: mintAddress});// to be compatible with the rest of the code
      }
    });
    return mints;
}

module.exports.getNftAccounts = getNftAccounts;
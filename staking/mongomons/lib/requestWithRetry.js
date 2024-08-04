const web3 = require('@solana/web3.js');
const sleep = require('./sleep');

async function requestWithRetry (connection, rawTransaction) {
	const MAX_RETRIES = 10;
	let erro;
	for (let i = 0; i <= MAX_RETRIES; i++) {
	  try {
		  	console.log('Sending ...', i);
			return await web3.sendAndConfirmRawTransaction(connection, rawTransaction)
	  } catch (err) {
		  erro = err
		  let error_message = err.message;
		  console.log('Error', err.message);
		  if(error_message.indexOf("has already been processed") !== -1){
			return "has already been processed";
		  }
		const timeout = Math.pow(2, i);
		console.log('Waiting', timeout, 'ms');
		await sleep(timeout);
		console.log('Retrying', err.message, i);
	  }
	}
	throw Error (erro)
}

module.exports = requestWithRetry;
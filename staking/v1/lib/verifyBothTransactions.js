function verifyBothTransactions(parsedTransaction, dbTransaction) {

    console.log('..... VERIFY BOTH TRANSACTIONS GLOBAL .....')

    if (
        (typeof parsedTransaction.feePayer === 'undefined')
        || (typeof dbTransaction.feePayer === 'undefined')
        || (parsedTransaction.feePayer !== dbTransaction.feePayer)
    ) {
        console.log('feePayer error')
        return false;
    }

    console.log('feePayer OK')

    // if (
    //     (typeof parsedTransaction.instructions === 'undefined')
    //     || (typeof dbTransaction.instructions === 'undefined')
    //     || (parsedTransaction.instructions.length !== dbTransaction.instructions.length)
    // ) {
    //     console.log('instructions length error')
    //     return false;
    // }

    // console.log('instructions length OK')
    console.log('instructions length NOT being checked = OK')

    // let signerSameAsFeePayerFound = 0;
    // for (let instructions of parsedTransaction.instructions) {
    //     for (let key of instructions.keys) {
    //         if (key.isSigner && (key.pubkey === parsedTransaction.feePayer)) {
    //             signerSameAsFeePayerFound++;
    //         }
    //     }
    // }
    // if (
    //     (signerSameAsFeePayerFound === 0)// no signers
    //     || (signerSameAsFeePayerFound !== parsedTransaction.instructions.length)// signers less than instructions (or more)
    // ) {
    //     console.log('signers error')
    //     return false;
    // }

    // console.log('signers OK', signerSameAsFeePayerFound)
    console.log('signers NOT being checked = OK')

    console.log('All checks OK')

    return true;

}
module.exports = verifyBothTransactions;
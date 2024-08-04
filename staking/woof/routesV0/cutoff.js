/*
database mods for cutoff

update value of now (set to 1st of Feb, 2023)

alter table holders add column last_cutoff_on datetime default null after last_snapshot_on;

before every new cutoff
update holders set last_cutoff_on = null;
*/

require('dotenv').config({path: '/home/iffrit/projects/staking-api/.env'});
// require('dotenv').config({path: '/media/ilir/storage/aa_solana/staking-api/.env'});
const web3  = require('@solana/web3.js');
const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');

const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

const timeout = 1000;// sleep after each user

const init = async () => {
    let hasUsers = true;
    let userNr = 1;
console.log("\nHi\n");
	try {
do {
        const data = await dbQuery('SELECT * FROM `holders` WHERE last_cutoff_on IS NULL LIMIT 1', []);
console.log("\nNr: ", userNr, "\n", data);
        if (
            (typeof data[0] === 'undefined')
            || (typeof data[0].wallet === 'undefined')
         ) {
            console.log("\nNo more holders\n");// {"success":true,"data":[]}
            // process.exit(0);
            hasUsers = data.length > 0;
        } else {

            userNr++;

        // user
        const user = data[0];

        let userWalletPubkey = user['wallet'];

        // account found, get nft data

        console.log('USER WALLET PUBKEY', userWalletPubkey);
    
        // get list of already staked
        let dbNfts = await dbQuery('SELECT * FROM `staked` WHERE wallet = ?', [userWalletPubkey]);
console.log('DB NFTS', dbNfts);
        // calculate earned

        let earned = 0;
        if (
            (typeof user.tokens_to_claim !== 'undefined')
        ) {
            earned = parseFloat(user.tokens_to_claim);
        }
        // end earned
        console.log('earnedInitial', earned)

        let now = DateTime.local().toFormat(config.luxonFormat);
        now = '2023-02-01 00:00:00'
console.log("\nNOW\n", now);

        if (
            (typeof dbNfts[0] !== 'undefined')
        ) {
            for (let nft of dbNfts) {
                
                // ==================================================================================================================================
                // calculate earned amount, from timestamp last_claimed_on and until now
                let seconds_until_now;
                console.log("user.last_claimed_on", typeof user.last_claimed_on, user.last_claimed_on)
                console.log("nft.staked_on", typeof nft.staked_on, nft.staked_on)
                console.log("now", typeof now, now)
                if (
                    (user.last_claimed_on === null)
                    || (user.last_claimed_on <= nft.staked_on)
                ) {
                    seconds_until_now = config.toTimestamp(now) - config.toTimestamp(nft.staked_on);
                    console.log('first, last_claimed_on is null')
                } else {
                    seconds_until_now = config.toTimestamp(now) - config.toTimestamp(user.last_claimed_on);
                    console.log('second, last_claimed_on is ', user.last_claimed_on)
                }
                console.log('seconds_until_now', seconds_until_now)

                if (seconds_until_now < 0) {
                    console.log('seconds unti now is negative === no earnings for this nft', seconds_until_now)
                } else {

                    let earnedSingle = config.toDecimal(seconds_until_now * config.hashlist[nft.mint].yield_per_second);

                    console.log('earnedSingle', earnedSingle)

                    earned += earnedSingle
                }
                // ===================================================================================================================================
            }

            earned = config.toDecimal(earned);
//            console.log('Earned  after all NFTS', earned)

        }
        //
        console.log('Earned  after all NFTS', earned)

        const updData = await dbQuery('UPDATE `holders` SET tokens_to_claim = ?, last_claimed_on = ?, last_cutoff_on = ? WHERE wallet = ?', [earned, now, now, user['wallet']]);
        console.log("\nUpdate RESULT\n", updData);
        await sleep(timeout);
        }// else

} while (hasUsers);


        console.log({
            success: true,
            userNr: userNr
        });
        process.exit(0);

	} catch (error) {
		console.log({ success: false, error: error });
        process.exit(0);
	}

};

function sleep(time) {
	return new Promise((resolve, reject) => {
	  setTimeout(() => {
		resolve()
	  }, time);
	})
}

init();


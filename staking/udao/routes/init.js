const web3  = require('@solana/web3.js');
const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const getTokenBalance = require('../lib/get-token-balance');
const getNftAccounts = require('../../v1/lib/get-nft-accounts');

const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

const TOTAL_ITEMS = Object.keys(config.hashlist).length;

const {
	resolveToWalletAddress,
	getParsedNftAccountsByOwner,
} = require('@nfteyez/sol-rayz');

exports.init = async (req, res) => {

	try {

        // return res.status(500).jsonp({ success: false, message: 'Maintenance' });

        if (!onlyLettersAndNumbers(req.params.wallet)) {
            console.log('Invalid Wallet', req.params.wallet)
            return res.status(500).jsonp({ success: false, message: 'Invalid format' });
        }

        let userWalletPubkey = req.params.wallet;

        const data = await dbQuery('SELECT * FROM `holders` WHERE `wallet` = ?', [userWalletPubkey]);

        if (
            (typeof data[0] === 'undefined')
            || (typeof data[0].wallet === 'undefined')
         ) {
            // {"success":true,"data":[]}
            // return 200 but with flag, no account found
            res.setHeader('Access-Control-Allow-Origin', '*')
            return res.status(200).jsonp({
                success: true,
                data: data,
                account_not_found: true
            });
        }

        // user
        const user = data[0];

        // account found, get nft data

        console.log('USER WALLET PUBKEY', userWalletPubkey);

        const connection = new web3.Connection(process.env.RPC, config.commitment);
    
        const publicAddress = await resolveToWalletAddress({
            text: userWalletPubkey
        });
    
        // // get user's nfts
        // const nftArray = await getParsedNftAccountsByOwner({
        //     publicAddress,
        //     connection
        // });

        const nftArray = await getNftAccounts.getNftAccounts(publicAddress, connection);

        // count all staked mints
        let dbResultGetCountAll = await dbQuery('SELECT COUNT(*) AS total FROM `staked`', []);
        // console.log('COUNt All', dbResultGetCountAll);

        let totalStaked = 0;

        if (typeof dbResultGetCountAll[0] !== 'undefined') {
            totalStaked = (parseFloat(parseInt(dbResultGetCountAll[0].total) / TOTAL_ITEMS) * 100).toFixed(2);
        }

        // get list of already staked
        let dbNfts = await dbQuery('SELECT * FROM `staked` WHERE wallet = ?', [userWalletPubkey]);

        // calculate earned

        let earned = 0;
        if (
            (typeof user.tokens_to_claim !== 'undefined')
        ) {
            earned = parseFloat(user.tokens_to_claim);
        }
        // end earned

        // get balance
        const balance = 0;// await getTokenBalance.getTokenBalance(userWalletPubkey, process.env[config.PREFIX + 'TOKEN_PUBLIC_KEY']);
        // end get balance

        let stakedNfts = [];

        let mintsOfStakedNfts = [];// used to remove from myNfts (because of network latency)

        let now = DateTime.local().toFormat(config.luxonFormat);

        let yps = 0;
        let ypd = 0;

        if (
            (typeof dbNfts[0] !== 'undefined')
        ) {
            for (let nft of dbNfts) {
                // check if ready to unstake
                const lock_end = DateTime.fromFormat(nft.staked_on, config.luxonFormat).plus({days: config.LOCKUP_PERIOD});
                // console.log('lock_end', lock_end)
                // console.log('Local', DateTime.local());
                const canUnstakeMillis = DateTime.local().diff(lock_end).milliseconds;
                // console.log('canUnstakeMillis', canUnstakeMillis)
                const canUnstake = canUnstakeMillis > 0;
                console.log('canUnstake', canUnstake)
                stakedNfts.push({
                    mint: nft.mint,
                    image: config.hashlist[nft.mint].image,
                    name: config.hashlist[nft.mint].name,
                    yield: config.hashlist[nft.mint].daily_yield,
                    lockEnd: lock_end.toFormat(config.luxonFormatDays),
                    unstakeTimestamp: lock_end,
                    // "unstakeTimestamp": "2023-08-24T07:02:00.000Z",
                    canUnstake: true,// canUnstake,
                    selected: false
                });

                mintsOfStakedNfts.push(nft.mint);
                
                // ==================================================================================================================================
                // calculate earned amount, from timestamp last_claimed_on and until now
                let seconds_until_now;
                // console.log("user.last_claimed_on", typeof user.last_claimed_on, user.last_claimed_on)
                // console.log("nft.staked_on", typeof nft.staked_on, nft.staked_on)
                // console.log("now", typeof now, now)
                if (
                    (user.last_claimed_on === null)
                    || (user.last_claimed_on <= nft.staked_on)
                ) {
                    seconds_until_now = config.toTimestamp(now) - config.toTimestamp(nft.staked_on);
                    // console.log('first')
                } else {
                    seconds_until_now = config.toTimestamp(now) - config.toTimestamp(user.last_claimed_on);
                    // console.log('second')
                }
                // console.log('seconds_until_now', seconds_until_now)

                earned += config.toDecimal(seconds_until_now * config.hashlist[nft.mint].yield_per_second);
                yps += config.hashlist[nft.mint].yield_per_second;
                ypd += config.hashlist[nft.mint].daily_yield;

                // console.log('Earned', earned)
                // ===================================================================================================================================
            }

            earned = config.toDecimal(earned);
            // console.log('Earned', earned)

        }
        //

        // get list of burned nfts
        let burnedDbNfts = await dbQuery('SELECT * FROM `burned` WHERE wallet = ?', [userWalletPubkey]);
        let burnedNfts = [];
        let mintsOfBurnedNfts = [];// used to remove from myNfts (because of network latency)

        if (
            (typeof burnedDbNfts[0] !== 'undefined')
        ) {
            for (let nft of burnedDbNfts) {
                burnedNfts.push({
                    mint: nft.mint,
                    image: config.hashlist[nft.mint].image,
                    name: config.hashlist[nft.mint].name,
                    // yield: config.hashlist[nft.mint].daily_yield,
                    // lockEnd: lock_end.toFormat(config.luxonFormatDays),
                    // unstakeTimestamp: lock_end,
                    // "unstakeTimestamp": "2023-08-24T07:02:00.000Z",
                    // canUnstake: canUnstake,
                    selected: false
                });

                mintsOfBurnedNfts.push(nft.mint);

            }

            earned = config.toDecimal(earned);
            // console.log('Earned', earned)

        }

        
        // fajnlli
        let myNfts = [];

        for (let nft of nftArray) {
            if (
                (typeof nft.mint !== 'undefined')
                && (typeof config.hashlist[nft.mint] !== 'undefined')// exists in the list of mints (nftEyez pulls all nfts from every collection)
                && (!mintsOfStakedNfts.includes(nft.mint))
                && (!mintsOfBurnedNfts.includes(nft.mint))
            ){
                myNfts.push({
                    mint: nft.mint,
                    image: config.hashlist[nft.mint].image,
                    name: config.hashlist[nft.mint].name,
                    yield: config.hashlist[nft.mint].daily_yield,
                    selected: false});
            }
        }

        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(200).jsonp({
            success: true,
            totalStaked: totalStaked,
            myStaked: stakedNfts.length,
            balance: balance,
            earned: earned,
            yps: yps,
            ypd: ypd,
            myNfts: myNfts,
            stakedNfts: stakedNfts,
            burnedNfts: burnedNfts
        });

	} catch (error) {
		let message = 'init error'
		console.log(message, error, req.params)
		return res.status(500).jsonp({ success: false, message: message });
	}

};

function onlyLettersAndNumbers(str) {
    return /^[A-Za-z0-9]*$/.test(str);
}


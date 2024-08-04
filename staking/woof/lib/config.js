const PROJECT = 'WOOF'
module.exports.PROJECT = PROJECT;

var USER = {
    WALLET: '-'
}
module.exports.USER = USER;

const log = (data = []) => {
    if (0 && data.length === 1) {
        console.log(PROJECT, USER.WALLET, data[0])
    } else {
        console.log(PROJECT, USER.WALLET)
        for (let d of data) {
            console.log(d)
        }
    }
    // console.log('=================');
    return true
}
module.exports.log = log;

//

const PREFIX = PROJECT + '_'
module.exports.PREFIX = PREFIX;

let hashlist = require('../mints/woof/mints-parsed-light.json');
let default_mints = require('../mints/default/mints.json');
let ii = 0;
for (let h in hashlist) {
    let data = hashlist[h]
    let mint = default_mints[ii];
    hashlist[mint] = data;
    ii++;
}
module.exports.hashlist = hashlist;

const commitment = 'confirmed';//'finalized';
module.exports.commitment = commitment;

const walletsExcludedFromPayment = [
//  '7N5fsGqkBCEdzD9mjqBPQ9V1W7bAzhAJ4492rZAdcymc',
//	'F3iKJj9jTLBaQDZXQbrr8oqCACM9gSoK3KE6dCEqjbZU',
	'8Nxu5AaEGpXLmKWka1V8R5RtWta7w93mr9jVvxwX38fa',
	'6CC4RBvpCQT9KLCUxRE7FpGR7Z44AT7DgjkRy88aKuw1'
];
module.exports.walletsExcludedFromPayment = walletsExcludedFromPayment;

const priceForYabanjies = 0.02;
module.exports.priceForYabanjies = priceForYabanjies;

const priceForYabanjiesOpeningAccount = 0.02;
module.exports.priceForYabanjiesOpeningAccount = priceForYabanjiesOpeningAccount;

const priceForYabanjiesClaimingFee = 0.01;
module.exports.priceForYabanjiesClaimingFee = priceForYabanjiesClaimingFee;

const priceForKnowners = 0.000000001;
module.exports.priceForKnowners = priceForKnowners;

const objHasKeys = (obj) => {
    return !!Object.keys(obj).length > 0;
}
module.exports.objHasKeys = objHasKeys;

////// Luxon

const { Settings, Interval, DateTime } = require("luxon");
Settings.defaultZone = process.env.DEFAULT_TIMEZONE;

const luxonFormat = 'yyyy-LL-dd HH:mm:ss';
module.exports.luxonFormat = luxonFormat;

const toTimestamp = (datetime) => {
	console.log("datetime", datetime)
    let timestamp = DateTime.fromFormat(datetime, luxonFormat).toUnixInteger();
    return timestamp;
}
module.exports.toTimestamp = toTimestamp;

const toDecimal = (d) => {
    return parseFloat((d).toFixed(process.env[PREFIX + 'TOKEN_DECIMALS']))
}
module.exports.toDecimal = toDecimal;

const ParseFloat = (str, val = process.env[PREFIX + 'TOKEN_DECIMALS']) => {
    str = str.toString();
    str = str.slice(0, (str.indexOf(".")) + val + 1); 
    return Number(str);   
}
module.exports.ParseFloat = ParseFloat;

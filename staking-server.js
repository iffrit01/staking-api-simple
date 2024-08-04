require('dotenv').config();
var express = require('express');
var cors = require('cors')
var app = express();
var bodyParser  = require('body-parser');
const router = express.Router();
var host = '127.0.0.1';//localhost
var port = process.env.PORT || 8081;

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Simple Usage (Enable All CORS Requests)
app.use(cors())
// Apply the rate limiting middleware to all requests
app.use(limiter)

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Start server and listen on http://localhost:8081/
var server = app.listen(port, function () {
    var host1 = host;//server.address().address
    var port1 = port

    console.log("app listening at http://%s:%s", host1, port1)
});

// =======================
// routes ================
// =======================

// add router in express app
app.use("/",router);

//////// variable names need to be mapped per prefix

let init = {}
let openAccount = {}
let openAccountVerify = {}
let stakeMints = {}
let stakeMintsVerify = {}
let unstakeMints = {}
let unstakeMintsVerify = {}
let burnMints = {}
let burnMintsVerify = {}
let claim = {}
let claimVerify = {}
let reloadMeta = {}
let reloadMetaAll = {}
let delete_time_devices = {}
let signIn = {}
let signInVerify = {}
let validateToken = {}
let admins = {}
let items = {}
let collections = {}
let hashlistUpdate = {}
let itemDelete = {}
let itemsDelete = {}
let traits = {}
let baseEarningsModify = {}
let baseMultiplierModify = {}
let traitsEarningsModify = {}
let traitsEarningsAdd = {}
let traitsEarningsDelete = {}

// api
// let monthly = {}
// let daily = {}
// let walletNft = {}

let stakingInfo = {}

//////// MONGOMONS STAKING /////////////////////////////////////

prefix = 'mongomons';

init[prefix] = require('./staking/'+prefix+'/routes/init');
router.get('/'+prefix+'/v1/init/:wallet', init[prefix].init);

openAccount[prefix] = require('./staking/'+prefix+'/routes/openAccount');
openAccountVerify[prefix] = require('./staking/'+prefix+'/routes/openAccountVerify');
router.post('/'+prefix+'/v1/open-account', openAccount[prefix].openAccount);
router.post('/'+prefix+'/v1/open-account-verify', openAccountVerify[prefix].openAccountVerify);

stakeMints[prefix] = require('./staking/'+prefix+'/routes/stakeMints');
stakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/stakeMintsVerify');
router.post('/'+prefix+'/v1/stake-mints', stakeMints[prefix].stakeMints);
router.post('/'+prefix+'/v1/stake-mints-verify', stakeMintsVerify[prefix].stakeMintsVerify);

unstakeMints[prefix] = require('./staking/'+prefix+'/routes/unstakeMints');
unstakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/unstakeMintsVerify');
router.post('/'+prefix+'/v1/unstake-mints', unstakeMints[prefix].unstakeMints);
router.post('/'+prefix+'/v1/unstake-mints-verify', unstakeMintsVerify[prefix].unstakeMintsVerify);

claim[prefix] = require('./staking/'+prefix+'/routes/claim');
claimVerify[prefix] = require('./staking/'+prefix+'/routes/claimVerify');
router.get('/'+prefix+'/v1/:wallet/claim', claim[prefix].claim);
router.post('/'+prefix+'/v1/:wallet/claim-verify', claimVerify[prefix].claimVerify);

//////// END MONGOMONS STAKING ///////////////////////////////////


//////// WOOFERS STAKING /////////////////////////////////////

prefix = 'woof';

init[prefix] = require('./staking/'+prefix+'/routes/init');
router.get('/'+prefix+'/v1/init/:wallet', init[prefix].init);

openAccount[prefix] = require('./staking/'+prefix+'/routes/openAccount');
openAccountVerify[prefix] = require('./staking/'+prefix+'/routes/openAccountVerify');
router.post('/'+prefix+'/v1/open-account', openAccount[prefix].openAccount);
router.post('/'+prefix+'/v1/open-account-verify', openAccountVerify[prefix].openAccountVerify);

stakeMints[prefix] = require('./staking/'+prefix+'/routes/stakeMints');
stakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/stakeMintsVerify');
router.post('/'+prefix+'/v1/stake-mints', stakeMints[prefix].stakeMints);
router.post('/'+prefix+'/v1/stake-mints-verify', stakeMintsVerify[prefix].stakeMintsVerify);

unstakeMints[prefix] = require('./staking/'+prefix+'/routes/unstakeMints');
unstakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/unstakeMintsVerify');
router.post('/'+prefix+'/v1/unstake-mints', unstakeMints[prefix].unstakeMints);
router.post('/'+prefix+'/v1/unstake-mints-verify', unstakeMintsVerify[prefix].unstakeMintsVerify);

claim[prefix] = require('./staking/'+prefix+'/routes/claim');
claimVerify[prefix] = require('./staking/'+prefix+'/routes/claimVerify');
router.get('/'+prefix+'/v1/:wallet/claim', claim[prefix].claim);
router.post('/'+prefix+'/v1/:wallet/claim-verify', claimVerify[prefix].claimVerify);

//////// END WOOFERS STAKING ///////////////////////////////////



//////// UNDERGROUND DAO STAKING /////////////////////////////////////

prefix = 'udao';

init[prefix] = require('./staking/'+prefix+'/routes/init');
router.get('/'+prefix+'/v1/init/:wallet', init[prefix].init);

openAccount[prefix] = require('./staking/'+prefix+'/routes/openAccount');
openAccountVerify[prefix] = require('./staking/'+prefix+'/routes/openAccountVerify');
router.post('/'+prefix+'/v1/open-account', openAccount[prefix].openAccount);
router.post('/'+prefix+'/v1/open-account-verify', openAccountVerify[prefix].openAccountVerify);

stakeMints[prefix] = require('./staking/'+prefix+'/routes/stakeMints');
stakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/stakeMintsVerify');
router.post('/'+prefix+'/v1/stake-mints', stakeMints[prefix].stakeMints);
router.post('/'+prefix+'/v1/stake-mints-verify', stakeMintsVerify[prefix].stakeMintsVerify);

unstakeMints[prefix] = require('./staking/'+prefix+'/routes/unstakeMints');
unstakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/unstakeMintsVerify');
router.post('/'+prefix+'/v1/unstake-mints', unstakeMints[prefix].unstakeMints);
router.post('/'+prefix+'/v1/unstake-mints-verify', unstakeMintsVerify[prefix].unstakeMintsVerify);

burnMints[prefix] = require('./staking/'+prefix+'/routes/burnMints');
burnMintsVerify[prefix] = require('./staking/'+prefix+'/routes/burnMintsVerify');
router.post('/'+prefix+'/v1/burn-mints', burnMints[prefix].burnMints);
router.post('/'+prefix+'/v1/burn-mints-verify', burnMintsVerify[prefix].burnMintsVerify);

// claim[prefix] = require('./staking/'+prefix+'/routes/claim');
// claimVerify[prefix] = require('./staking/'+prefix+'/routes/claimVerify');
// router.get('/'+prefix+'/v1/:wallet/claim', claim[prefix].claim);
// router.post('/'+prefix+'/v1/:wallet/claim-verify', claimVerify[prefix].claimVerify);

//////// END UNDERGROUND DAO STAKING /////////////////////////////////////

//////// UNDERGROUND DAO STAKING (for testing) /////////////////////////////////////

/*prefix = 'udao-dev';

init[prefix] = require('./staking/'+prefix+'/routes/init');
router.get('/'+prefix+'/v1/init/:wallet', init[prefix].init);

openAccount[prefix] = require('./staking/'+prefix+'/routes/openAccount');
openAccountVerify[prefix] = require('./staking/'+prefix+'/routes/openAccountVerify');
router.post('/'+prefix+'/v1/open-account', openAccount[prefix].openAccount);
router.post('/'+prefix+'/v1/open-account-verify', openAccountVerify[prefix].openAccountVerify);

stakeMints[prefix] = require('./staking/'+prefix+'/routes/stakeMints');
stakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/stakeMintsVerify');
router.post('/'+prefix+'/v1/stake-mints', stakeMints[prefix].stakeMints);
router.post('/'+prefix+'/v1/stake-mints-verify', stakeMintsVerify[prefix].stakeMintsVerify);

unstakeMints[prefix] = require('./staking/'+prefix+'/routes/unstakeMints');
unstakeMintsVerify[prefix] = require('./staking/'+prefix+'/routes/unstakeMintsVerify');
router.post('/'+prefix+'/v1/unstake-mints', unstakeMints[prefix].unstakeMints);
router.post('/'+prefix+'/v1/unstake-mints-verify', unstakeMintsVerify[prefix].unstakeMintsVerify);

burnMints[prefix] = require('./staking/'+prefix+'/routes/burnMints');
burnMintsVerify[prefix] = require('./staking/'+prefix+'/routes/burnMintsVerify');
router.post('/'+prefix+'/v1/burn-mints', burnMints[prefix].burnMints);
router.post('/'+prefix+'/v1/burn-mints-verify', burnMintsVerify[prefix].burnMintsVerify);

// claim[prefix] = require('./staking/'+prefix+'/routes/claim');
// claimVerify[prefix] = require('./staking/'+prefix+'/routes/claimVerify');
// router.get('/'+prefix+'/v1/:wallet/claim', claim[prefix].claim);
// router.post('/'+prefix+'/v1/:wallet/claim-verify', claimVerify[prefix].claimVerify);
*/
//////// END UNDERGROUND DAO STAKING /////////////////////////////////////



// handles 400 error
app.use((err, req, res, next) => {
    if (!err) return next();
    return res.status(400).json({
      status: 400,
      error: 'OOps! Bad request',
    });
  });

// LIB

// one db method
const dbQuerySample = (query, params) => {
    return new Promise((resolve, reject)=>{
        pool.query(query, params,  (error, elements)=>{
            if(error){
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

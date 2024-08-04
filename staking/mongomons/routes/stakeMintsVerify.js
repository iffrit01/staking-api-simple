const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const dbQueryBatch = require('../lib/dbQueryBatch');
const stakeMintsVerifyGlobal = require('../../v1/routes/stakeMintsVerifyGlobal');

exports.stakeMintsVerify = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
    req.dbQueryBatch = dbQueryBatch
	return await stakeMintsVerifyGlobal(req, res);
}

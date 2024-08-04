const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const unstakeMintsVerifyGlobal = require('../../v1/routes/unstakeMintsVerifyGlobal');

exports.unstakeMintsVerify = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await unstakeMintsVerifyGlobal(req, res);
}

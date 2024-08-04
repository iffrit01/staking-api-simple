const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const claimVerifyGlobal = require('../../v1/routes/claimVerifyGlobal')

exports.claimVerify = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await claimVerifyGlobal(req, res);
}

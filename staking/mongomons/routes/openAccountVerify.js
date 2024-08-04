const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const openAccountVerifyGlobal = require('../../v1/routes/openAccountVerifyGlobal')

exports.openAccountVerify = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await openAccountVerifyGlobal(req, res);
}

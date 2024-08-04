const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const stakeMintsGlobal = require('../../v1/routes/stakeMintsGlobal')

exports.stakeMints = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await stakeMintsGlobal(req, res);
}

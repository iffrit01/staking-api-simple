const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const unstakeMintsGlobal = require('../../v1/routes/unstakeMintsGlobal')

exports.unstakeMints = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await unstakeMintsGlobal(req, res);
}

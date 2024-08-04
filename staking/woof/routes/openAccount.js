const config = require('../lib/config');
const dbQuery = require('../lib/dbQuery');
const openAccountGlobal = require('../../v1/routes/openAccountGlobal')

exports.openAccount = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await openAccountGlobal(req, res);
}

const config = require('../lib/config')
const dbQuery = require('../lib/dbQuery')
const claimGlobal = require('../../v1/routes/claimGlobal')

exports.claim = async (req, res) => {
	req.config = config
	req.dbQuery = dbQuery
	return await claimGlobal(req, res)
}

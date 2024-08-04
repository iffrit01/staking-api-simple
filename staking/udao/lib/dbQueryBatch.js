require('dotenv').config();

const fs = require('fs');
const mariadb = require('mariadb/callback');

const config = require('./config');

const pool = mariadb.createPool({
    connectionLimit : 5, //important
    host     : process.env.MARIADB_HOST,
    user     : process.env.MARIADB_USER,
    password : process.env.MARIADB_PASS,
    // port     : process.env.DB_PORT,
    database : process.env[config.PREFIX + 'STAKING_DB'],
    timezone : 'Z',
    dateStrings : true,
    // debug    :  false,
    // ssl      : {
    //     ca : fs.readFileSync(process.env.DB_CERT_PATH)
    // }
});

// one db method

const dbQueryBatch = (query, params) => {
    return new Promise((resolve, reject)=>{
        pool.batch(query, params,  (error, elements)=>{
            if(error){
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

module.exports = dbQueryBatch;

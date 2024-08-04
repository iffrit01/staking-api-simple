require('dotenv').config();

const fs = require('fs');
const mysql = require('mysql2');

const config = require('./config');

const pool = mysql.createPool({
    connectionLimit : 100, //important
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    port     : process.env.DB_PORT,
    database : process.env[config.PREFIX + 'STAKING_DB'],
    dateStrings: true,
    debug    :  false,
    ssl      : {
        ca : fs.readFileSync(process.env.DB_CERT_PATH)
    }
});

// one db method
const dbQuery = (query, params) => {
    return new Promise((resolve, reject)=>{
        pool.query(query, params,  (error, elements)=>{
            if(error){
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

module.exports = dbQuery;

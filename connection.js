const mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: process.env.MAXCON,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    multipleStatements: true
});

const getConnection = (callback) => {
    pool.getConnection((err, connection) => {
        if (err)
            callback(err);
        else
            callback(false, connection);
    });
} 

module.exports = getConnection;
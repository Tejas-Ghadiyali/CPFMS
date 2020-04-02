require('dotenv').config();
const mysql = require('mysql');
const db = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS
})

db.connect((err) => {
    if (err)
    {
        console.log("Error while connecting database!!!");
        throw err;
    }
    console.log("Database connected...");
    const createdb = "DROP DATABASE " + process.env.DBNAME;
    db.query(createdb, (err, result) => {
        if (err)
        {
            console.log("Error while deleting database!!!");
            throw err;
        }
        console.log("Database Removed...");
        db.end();
    });
});
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
    const createdb = "CREATE DATABASE IF NOT EXISTS " + process.env.DBNAME;
    db.query(createdb, (err, result) => {
        if (err)
        {
            console.log("Error while creating database!!!");
            throw err;
        }
        db.query("USE " + process.env.DBNAME, (err) => {
            if (err)
            {
                console.log("Database not found!!!");
                throw err;
            }
            require('./models/Account_Head')(db);
            require('./models/Sub_Account')(db);
            db.end();
        });
    });
});
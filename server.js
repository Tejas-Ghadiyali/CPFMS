require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to Database...');
});

app.get('/', (req, res) => {
    res.send("<h1 align='center'>Express App</h1>");
});

app.listen(PORT, () => {
    console.log("Server is running on port : ", PORT);
});
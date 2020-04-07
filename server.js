require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// EJS Engine Setting
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Database connection
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

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/accounthead',require('./controllers/account_head'));

app.listen(PORT, () => {
    console.log("Server is running on port : ", PORT);
});
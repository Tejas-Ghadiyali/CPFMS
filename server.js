require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('flash');
const passport = require('passport');
const minifyHTML = require('express-minify-html');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session Declaration
app.use(session({
    secret: process.env.SESSIONPASS,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 12 * 3600 * 1000
    }
}));
// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

// Flash messages package
app.use(flash());

// Minify HTML
app.use(minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyJS: true
    }
}));

// EJS Engine Setting
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Database connection Test
const db = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to Database...');
    db.end();
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Auth passport configuration
require('./controllers/auth/auth_passport');

// Auth Routes
app.use('/auth', require('./controllers/auth/auth_routes'));
app.use('/', require('./controllers/auth/auth_view'));

// Masters Routes
app.use('/accounthead', require('./controllers/masters/account_head'));
app.use('/user', require('./controllers/masters/user'));
app.use('/district', require('./controllers/masters/district'));
app.use('/taluka', require('./controllers/masters/taluka'));
app.use('/village', require('./controllers/masters/village'));
app.use('/organization', require('./controllers/masters/organization'));
app.use('/cowcast', require('./controllers/masters/cow_cast'));
app.use('/subaccount', require('./controllers/masters/sub_account'));
app.use('/resourceperson', require('./controllers/masters/resource_person'));
app.use('/accountbalance', require('./controllers/masters/account_balance'));

// API Routes
app.use('/api/master', require('./controllers/api/master-api'));
app.use('/api/transaction', require('./controllers/api/transaction-api'));
app.use('/api/reportmaster', require('./controllers/api/report-api/report_master_api'));

// Transaction Routes
app.use('/receipt', require('./controllers/transactions/receipt'));
app.use('/payment', require('./controllers/transactions/payment'));
app.use('/jv', require('./controllers/transactions/jv'));

// Reports Routes
app.use('/report', require('./controllers/reports/report_master'));

app.listen(PORT, () => {
    console.log("Server is running on port : ", PORT);
});
const express = require('express');
const router = express.Router();
//const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

router.get('/accounthead', middleware.loggedin_as_superuser, (req, res) => {
   res.render('reports/account_head_report');
});

router.get('/talukalistsummary', middleware.loggedin_as_superuser, (req, res) => {
   res.render('reports/taluka_list_summary');
});

router.get('/districtlistsummary', middleware.loggedin_as_superuser, (req, res) => {
   res.render('reports/district_list_summary');
});

router.get('/receiptlistsummary', middleware.loggedin_as_superuser, (req, res) => {
   res.render('reports/receipt_list_summary');
});

router.get('/paymentlistsummary', middleware.loggedin_as_superuser, (req, res) => {
   res.render('reports/payment_list_summary');
});

module.exports = router;
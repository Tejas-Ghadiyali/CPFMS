const express = require('express');
const router = express.Router();
const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

// List Report View

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


// Detail Report View

router.get('/accountheaddetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/account_head_details', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/account_head_details', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/cowcastdetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data for report!"
			);
			res.render('reports/cow_cast_details', {
				cow_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Cow_Cast.cow_cast_id AS id FROM Cow_Cast`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var cowcast_id = [];
				for(item of results) {
					cowcast_id.push(item.id);
				}
				res.render('reports/cow_cast_details', {
					cowcast_id_list: cowcast_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/organizationdetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data for report!"
			);
			res.render('reports/organization_details', {
				org_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Organization.organization_id AS id FROM Organization`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var org_id = [];
				for(item of results) {
					org_id.push(item.id);
				}
				res.render('reports/organization_details', {
					org_id_list: org_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

module.exports = router;
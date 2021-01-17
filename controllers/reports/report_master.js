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

router.get('/rpsummary', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data for report!"
			);
			res.render('reports/rp_summary', {
				rp_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Resource_Person.resource_person_id AS id FROM Resource_Person`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var rp_id = [];
				for(item of results) {
					rp_id.push(item.id);
				}
				res.render('reports/rp_summary', {
					rp_id_list: rp_id,
					flash: res.locals.flash
				});
			});
		}
	});
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
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
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

router.get('/rpdetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data for report!"
			);
			res.render('reports/rp_details', {
				rp_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Resource_Person.resource_person_id AS id FROM Resource_Person`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var rp_id = [];
				for(item of results) {
					rp_id.push(item.id);
				}
				res.render('reports/rp_details', {
					rp_id_list: rp_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/insurancedetails', middleware.loggedin_as_superuser, (req, res) => {
	res.render('reports/insurance_details');
});

router.get('/talukadetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data for report!"
			);
			res.render('reports/taluka_wise_details', {
				taluka_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Taluka.taluka_id AS id FROM Taluka`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var taluka_id = [];
				for(item of results) {
					taluka_id.push(item.id);
				}
				res.render('reports/taluka_wise_details', {
					taluka_id_list: taluka_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/districtdetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data for report!"
			);
			res.render('reports/district_wise_details', {
				district_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT District.district_id AS id FROM District`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var district_id = [];
				for(item of results) {
					district_id.push(item.id);
				}
				res.render('reports/district_wise_details', {
					district_id_list: district_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societybalancedetails', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/account_head_balance_details', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/account_head_balance_details', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societybalancedetailsondate', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/account_head_balance_details_ondate', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/account_head_balance_details_ondate', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societyledger', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/account_head_ledger', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/account_head_ledger', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/memberledger', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Member!"
			);
			res.render('reports/sub_account_ledger', {
				sub_account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Sub_Account.sub_account_id AS id FROM Sub_Account;`
			connection.query(sql, (err, results) => {
				connection.release();	
				var sub_account_id = [];
				if(err) {
					console.log(err);
					req.flash(
						"danger",
						"Error while getting data from Member!"
					);
				}
				else {	
					for(item of results) {
						sub_account_id.push(item.id);
					}
				}
				res.render('reports/sub_account_ledger', {
					sub_account_id_list: sub_account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societywisememberledger', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data!"
			);
			res.render('reports/account_head_sub_account_ledger', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1';`
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				if(err) {
					console.log(err);
					req.flash(
						"danger",
						"Error while getting data!"
					);
				}
				else {	
					for(item of results) {
						account_id.push(item.id);
					}
				}
				res.render('reports/account_head_sub_account_ledger', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societywisecalwingage', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/calwing_age', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/calwing_age', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societywisecalwinganalysis', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/calwing_analysis', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/calwing_analysis', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societywiseheiferdate', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/heifer_date_report', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/heifer_date_report', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/societywisedeathdate', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Society!"
			);
			res.render('reports/death_date_report', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1'`;
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				for(item of results) {
					account_id.push(item.id);
				}
				res.render('reports/death_date_report', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

router.get('/receiptperiodicalregister', middleware.loggedin_as_superuser, (req, res) => {
	res.render('reports/receipt_periodical_register');
});

router.get('/paymentperiodicalregister', middleware.loggedin_as_superuser, (req, res) => {
	res.render('reports/payment_periodical_register');
});

router.get('/interest', middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data!"
			);
			res.render('reports/interest', {
				account_id_list: [],
				flash: res.locals.flash
			});
		}
		else {
			var sql = `SELECT Account_Head.account_id AS id FROM Account_Head WHERE Account_Head.is_society = '1';`
			connection.query(sql, (err, results) => {
				connection.release();	
				var account_id = [];
				if(err) {
					console.log(err);
					req.flash(
						"danger",
						"Error while getting data!"
					);
				}
				else {	
					for(item of results) {
						account_id.push(item.id);
					}
				}
				res.render('reports/interest', {
					account_id_list: account_id,
					flash: res.locals.flash
				});
			});
		}
	});
});

module.exports = router;
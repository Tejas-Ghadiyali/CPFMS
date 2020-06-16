const express = require("express");
const router = express.Router();
const getConnection = require("../../connection");
const middleware = require("../auth/auth_middleware");

router.get("/", middleware.loggedin_as_superuser, (req, res) => {
	var entries_per_page, pagenum, totalentries, totalpages;
	if (!req.query.entries_per_page)
		entries_per_page = 25;
	else
		entries_per_page = parseInt(req.query.entries_per_page);
	if (!req.query.pagenum)
		pagenum = 1;
	else
		pagenum = parseInt(req.query.pagenum);
	if (entries_per_page !== 25 && entries_per_page !== 50 && entries_per_page !== 100)
		entries_per_page = 25;
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash(
				"danger",
				"Error while getting data from Master-Account Balance!"
			);
			res.render("masters/account_balance/account_balance", {
				data: [],
				totalpages: 0,
				pagenum: 0,
				entries_per_page,
				totalentries: 0,
				flash: res.locals.flash,
				user_type: req.user.user_type,
			});
		}
		else {
			var sql1 = "SELECT COUNT(*) as ahcount FROM `Account_Balance`";
			connection.query(sql1, (err, results) => {
				if (err) {
					connection.release();
					req.flash("danger", "Error while getting count of Account Balance!");
					console.log(err);
					res.render("masters/account_balance/account_balance", {
						data: [],
						totalpages: 0,
						pagenum: 0,
						entries_per_page,
						totalentries: 0,
						flash: res.locals.flash,
						user_type: req.user.user_type,
					});
				} else {
					totalentries = results[0].ahcount;
					totalpages = Math.ceil(totalentries / entries_per_page);
					if (pagenum > totalpages) {
						pagenum = totalpages;
					} else if (pagenum <= 0) {
						pagenum = 1;
					}
					var sql2 = `
                    SELECT Account_Balance.*,
                        Sub_Account.sub_account_name, Sub_Account.sub_account_address,
                        Account_Head.account_name,
                        Organization.organization_name,
                        Resource_Person.resource_person_name,
                        Village.village_name,
                        Taluka.taluka_name,
                        District.district_name,
                        Cow_Cast.cow_cast_name
                    FROM Account_Balance
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        INNER JOIN Account_Head
                            ON Account_Balance.account_id = Account_Head.account_id
                        INNER JOIN Organization
                            ON Account_Balance.organization_id = Organization.organization_id
                        INNER JOIN Resource_Person
                            ON Account_Balance.resource_person_id = Resource_Person.resource_person_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                        INNER JOIN District
                            ON Taluka.taluka_id = District.district_id
                        INNER JOIN Cow_Cast
                            ON Account_Balance.cow_cast_id = Cow_Cast.cow_cast_id
                    LIMIT ? , ?;
                    `;
					var offset = (pagenum - 1) * entries_per_page;
					connection.query(sql2, [offset, entries_per_page], (err, results) => {
						connection.release();
						if (err) {
							req.flash(
								"danger",
								"Error while getting data from Master-Account Balance!"
							);
							console.log(err);
							res.render("masters/account_balance/account_balance", {
								data: [],
								totalpages: 0,
								pagenum: 0,
								entries_per_page,
								totalentries: 0,
								flash: res.locals.flash,
								user_type: req.user.user_type,
							});
						} else {
							res.render("masters/account_balance/account_balance", {
								data: results,
								totalpages,
								pagenum,
								entries_per_page,
								totalentries,
								flash: res.locals.flash,
								user_type: req.user.user_type,
							});
						}
					});
				}
			});
		}
	});
});

router.get("/search", middleware.loggedin_as_superuser, (req, res) => {
	var entries_per_page, pagenum, totalentries, totalpages;
	if (!req.query.entries_per_page)
		entries_per_page = 25;
	else
		entries_per_page = parseInt(req.query.entries_per_page);
	if (!req.query.pagenum)
		pagenum = 1;
	else
		pagenum = parseInt(req.query.pagenum);
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash("danger", "Error in searching Master-Account Balance!");
			res.redirect("/accountbalance");
		}
		else {
			var sql = `
				SELECT SQL_CALC_FOUND_ROWS
					Account_Balance.*,
					Sub_Account.sub_account_name, Sub_Account.sub_account_address,
					Account_Head.account_name,
					Organization.organization_name,
					Resource_Person.resource_person_name,
					Village.village_name,
					Taluka.taluka_name,
					District.district_name,
					Cow_Cast.cow_cast_name
				FROM Account_Balance
					INNER JOIN Sub_Account
						ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
					INNER JOIN Account_Head
						ON Account_Balance.account_id = Account_Head.account_id
					INNER JOIN Organization
						ON Account_Balance.organization_id = Organization.organization_id
					INNER JOIN Resource_Person
						ON Account_Balance.resource_person_id = Resource_Person.resource_person_id
					INNER JOIN Village
						ON Account_Head.village_id = Village.village_id
					INNER JOIN Taluka
						ON Village.taluka_id = Taluka.taluka_id
					INNER JOIN District
						ON Taluka.taluka_id = District.district_id
					INNER JOIN Cow_Cast
						ON Account_Balance.cow_cast_id = Cow_Cast.cow_cast_id
			`;
			var ob = req.query;
			var searcht = "%" + ob["searchtext"].trim() + "%";
			var flag = false;
			if (ob.hasOwnProperty("account_name")) {
				if (!flag) {
					flag = true;
					sql = sql + " WHERE Account_Head.account_name LIKE " + connection.escape(searcht);
				}
				else
					sql = sql + " OR Account_Head.account_name LIKE " + connection.escape(searcht);
			}
			if (ob.hasOwnProperty("sub_account_name")) {
				if (!flag) {
					flag = true;
					sql = sql + " WHERE Sub_Account.sub_account_name LIKE '" + searcht + "'";
				}
				else
					sql = sql + " OR Sub_Account.sub_account_name LIKE '" + searcht + "'";
			}
			if (ob["account_id"]) {
				if (!flag) {
					flag = true;
					sql = sql + " WHERE Account_Balance.account_id =" + connection.escape(ob["account_id"]);
				}
				else
					sql = sql + " AND Account_Balance.account_id =" + connection.escape(ob["account_id"]);
			}
			if (ob["sub_account_id"]) {
				if (!flag) {
					flag = true;
					sql = sql + " WHERE Account_Balance.sub_account_id =" + connection.escape(ob["sub_account_id"]);
				}
				else
					sql = sql + " AND Account_Balance.sub_account_id =" + connection.escape(ob["sub_account_id"]);
			}
			sql = sql + " LIMIT ?,?; SELECT FOUND_ROWS() AS count;";
			var offset = (pagenum - 1) * entries_per_page;
			if (offset < 0)
				offset = 0;
			connection.query(sql, [offset, entries_per_page], (err, results) => {
				if (err) {
					console.log(err);
					req.flash("danger", "Error in searching Master-Account Balance!");
					res.redirect("/accountbalance");
				}
				else {
					totalentries = parseInt(results[1][0].count);
					totalpages = Math.ceil(totalentries / entries_per_page);
					if (pagenum > totalpages) {
						pagenum = totalpages;
					}
					else if (pagenum <= 0) {
						pagenum = 1;
					}
					var callbackurlarr = req.originalUrl.split('?')[1].split('&');
					var newarr = [];
					for (part of callbackurlarr) {
						if (part.includes('searchtext') || part.includes('account_name') || part.includes('sub_account_name') || part.includes('account_id') || part.includes('sub_account_id')) {
							newarr.push(part);
						}
					}
					var callbackurl = newarr.join('&');
					var searched = (req.query.searchtext ? req.query.searchtext : "-") + "," + (req.query.account_id ? req.query.account_id : "-") + "," + (req.query.sub_account_id ? req.query.sub_account_id : "-");
					res.render("masters/account_balance/account_balance_search", {
						data: results[0],
						searchtext: searched,
						totalpages,
						pagenum,
						entries_per_page,
						totalentries,
						flash: res.locals.flash,
						user_type: req.user.user_type,
						callbackurl
					});
				}
			});
		}
	});
});

router.get("/add", middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash("danger", "Error while adding new entry!");
			res.redirect("/accountbalance");
		} else {
			var sql = `
                SELECT sub_account_id,sub_account_name,sub_account_address FROM Sub_Account;
                SELECT * FROM Account_Head WHERE is_society=1;
                SELECT * FROM Organization;
                SELECT * FROM Resource_Person;
                SELECT * FROM Cow_Cast;
            `;
			connection.query(sql, (err, results) => {
				connection.release();
				if (err) {
					console.log(err);
					req.flash("danger", "Error while adding new entry!");
					res.redirect("/accountbalance");
				} else {
					res.render("masters/account_balance/addform", {
						sub_account: results[0],
						account_head: results[1],
						organization: results[2],
						rp: results[3],
						cc: results[4],
					});
				}
			});
		}
	});
});

router.post("/", middleware.loggedin_as_superuser, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			req.flash("danger", "Error in Adding Master-Account Balance!");
			console.log(err);
			res.redirect("/accountbalance");
		} else {
			var decimal_val = [
				"birth_wt",
				"join_wt",
				"calwing_ltr",
				"cr_ammount",
				"dr_ammount",
				"cl_balance",
				"insurance_ammount",
			];
			for (key in req.body) {
				if (key.includes("date") || decimal_val.includes(key)) {
					if (req.body[key] == "") {
						req.body[key] = null;
					}
				}
			}
			var sql = "INSERT INTO `Account_Balance` SET ?";
			connection.query(sql, req.body, (err, result) => {
				connection.release();
				if (err) {
					console.log(err);
					if (err.code == "ER_DUP_ENTRY")
						req.flash(
							"danger",
							"Member with Member Id " +
							req.body.sub_account_id +
							" with Society " +
							req.body.account_id +
							" already exists!"
						);
					else
						req.flash(
							"danger",
							"Error while adding account in Master-Account Balance!"
						);
					res.redirect("/accountbalance");
				} else {
					req.flash(
						"success",
						"Member with Member Id " +
						req.body.sub_account_id +
						" with Society " +
						req.body.account_id +
						" added!"
					);
					res.redirect("/accountbalance");
				}
			});
		}
	});
});

router.get("/edit/:accountid/:subaccountid", middleware.loggedin_as_admin, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash("danger", "Error while Editing entry!");
			res.redirect("/accountbalance");
		} else {
			var sql = `
                SELECT * FROM Organization;
                SELECT * FROM Resource_Person;
                SELECT * FROM Cow_Cast;
                SELECT 
                    Account_Balance.*,
                    Account_Head.account_id,Account_Head.account_name,
                    Sub_Account.sub_account_id,Sub_Account.sub_account_name,Sub_Account.sub_account_address,
                    Village.village_name,
                    Taluka.taluka_name,
                    District.district_name
                FROM Account_Balance
                    INNER JOIN Account_Head
                        ON Account_Balance.account_id = ? AND Account_Head.account_id = Account_Balance.account_id
                    INNER JOIN Sub_Account
                        ON Account_Balance.sub_account_id = ? AND Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    INNER JOIN Village
                        ON Account_Head.village_id = Village.village_id
                    INNER JOIN Taluka
                        ON Taluka.taluka_id = Village.taluka_id
                    INNER JOIN District
                        On District.district_id = Taluka.district_id
            `;
			connection.query(
				sql,
				[req.params.accountid, req.params.subaccountid],
				(err, results) => {
					connection.release();
					if (err) {
						console.log(err);
						req.flash("danger", "Error while editing entry!");
						res.redirect("/accountbalance");
					} else {
						res.render("masters/account_balance/editform", {
							organization: results[0],
							rp: results[1],
							cc: results[2],
							data: results[3][0],
						});
					}
				}
			);
		}
	});
});

router.post("/edit", middleware.loggedin_as_admin, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash("danger", "Error while editing record !");
			res.redirect("/accountbalance");
		} else {
			var decimal_val = [
				"birth_wt",
				"join_wt",
				"calwing_ltr",
				"cr_ammount",
				"dr_ammount",
				"cl_balance",
				"insurance_ammount",
			];
			for (key in req.body) {
				if (key.includes("date") || decimal_val.includes(key)) {
					if (req.body[key] == "") {
						req.body[key] = null;
					}
				}
			}
			var updateobject = JSON.parse(JSON.stringify(req.body));
			delete updateobject["sub_account_id"];
			delete updateobject["account_id"];
			var sql =
				"UPDATE `Account_Balance` SET ? WHERE account_id = ? AND sub_account_id = ?";
			connection.query(
				sql,
				[updateobject, req.body.account_id, req.body.sub_account_id],
				(err, results) => {
					connection.release();
					if (err) {
						req.flash(
							"danger",
							"Error while editing member with society id " +
							req.body.account_id +
							" and member id " +
							req.body.sub_account_id +
							" !"
						);
						console.log(err);
						res.redirect("/accountbalance");
					} else {
						if (results.affectedRows > 0) {
							req.flash(
								"success",
								"Successfully edited member with society id " +
								req.body.account_id +
								" and member id " +
								req.body.sub_account_id +
								" !"
							);
						} else {
							req.flash(
								"danger",
								"Error while editing member with society id " +
								req.body.account_id +
								" and member id " +
								req.body.sub_account_id +
								" !"
							);
						}
						res.redirect("/accountbalance");
					}
				}
			);
		}
	});
});

router.post("/delete", middleware.loggedin_as_admin, (req, res) => {
	getConnection((err, connection) => {
		if (err) {
			console.log(err);
			req.flash("danger", "Error while deleting the record!");
			res.redirect("/accountbalance");
		} else {
			var sql = "";
			for (var i = 0; i < req.body.account_ids.length; ++i) {
				sql =
					sql +
					"DELETE FROM Account_Balance WHERE account_id=" +
					connection.escape(req.body.account_ids[i]) +
					" AND sub_account_id=" +
					connection.escape(req.body.sub_account_ids[i]) +
					";";
			}
			connection.query(sql, (err, results) => {
				connection.release();
				if (err) {
					req.flash("danger", "Error while deleting the record!");
					console.log(err);
					res.redirect("/accountbalance");
				} else {
					var count = 0;
					for (result of results) {
						if (result.affectedRows === 1) {
							req.flash("success", "Successfully deleted member with society id " + req.body.account_ids[count] + " and member id " + req.body.sub_account_ids[count] + " !");
						} else {
							req.flash("danger", "Error while deleting member with society id " + req.body.account_ids[count] + " and member id " + req.body.sub_account_ids[count] + " !");
						}
						count++;
					}
					res.redirect("/accountbalance");
				}
			});
		}
	});
});

module.exports = router;

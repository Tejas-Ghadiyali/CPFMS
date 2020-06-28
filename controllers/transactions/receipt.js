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
                "Error while getting data from Receipt!"
            );
            res.render("transactions/receipt/receipt", {
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
            var sql1 = "SELECT COUNT(*) as ahcount FROM `Receipt`";
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash("danger", "Error while getting count of Receipt!");
                    console.log(err);
                    res.render("transactions/receipt/receipt", {
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
                    SELECT
                        Receipt.*,
                        DATE_FORMAT(Receipt.receipt_date,'%d/%m/%Y') AS receipt_nice_date,
                        Account_Head.account_name
                    FROM Receipt
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Receipt.cr_account_id
                    ORDER BY Receipt.document_number DESC
                    LIMIT ? , ?;
                    `;
                    var offset = (pagenum - 1) * entries_per_page;
                    if (offset < 0)
                        offset = 0;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            req.flash(
                                "danger",
                                "Error while getting data from Receipt!"
                            );
                            console.log(err);
                            res.render("transactions/receipt/receipt", {
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
                            res.render("transactions/receipt/receipt", {
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
                    res.render("transactions/receipt/receipt_search", {
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
            res.redirect("/receipt");
        } else {
            var sql = `
                SELECT account_id FROM Account_Head;
                SELECT MAX(document_number) AS maxcount FROM Receipt;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while adding new entry!");
                    res.redirect("/receipt");
                } else {
                    var d = new Date();
                    var dd = ('0' + d.getDate()).slice(-2);
                    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
                    var yyyy = d.getFullYear();
                    var date = yyyy + "-" + mm + "-" + dd;
                    res.render("transactions/receipt/addform", {
                        account_head: results[0],
                        document_number: results[1][0].maxcount + 1,
                        today_date: date
                    });
                }
            });
        }
    });
});

router.post("/", middleware.loggedin_as_superuser, (req, res) => {
    console.log(req.body);
    if (req.body.sub_account_ids.length != req.body.receipt_amounts.length) {
        console.log("Array Length is not matching");
        req.flash('danger', 'Error while adding receipt !');
        res.redirect('/receipt');
    }
    else {
        getConnection((err, connection) => {
            if (err) {
                console.log(err);
                req.flash('danger', 'Error while adding receipt !');
                res.redirect('/receipt');
            }
            else {
                var sql = 'INSERT INTO Receipt SET ?;', i, entry, lentry, total = 0.00;
                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                    entry = {
                        document_number: req.body.document_number,
                        receipt_serial_number: i + 1,
                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                        receipt_amount: parseFloat(req.body.receipt_amounts[i]),
                        narration: req.body.narrations[i].trim()
                    };
                    sql = sql + 'INSERT INTO Receipt_Details SET ' + connection.escape(entry) + ';';
                    total += entry.receipt_amount;
                }
                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                    lentry = {
                        tc: 'CR',
                        document_number: req.body.document_number,
                        transaction_date: req.body.receipt_date,
                        account_id: req.body.cr_account_id,
                        sub_account_id: req.body.sub_account_ids[i],
                        cr_amount: parseFloat(req.body.receipt_amounts[i]),
                        dr_amount: null,
                        cross_account_id: req.body.dr_sub_account_id,
                        narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                    };
                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                }
                lentry = {
                    tc: 'CR',
                    document_number: req.body.document_number,
                    transaction_date: req.body.receipt_date,
                    account_id: req.body.dr_sub_account_id,
                    sub_account_id: req.body.dr_sub_account_id,
                    cr_amount: null,
                    dr_amount: total,
                    cross_account_id: req.body.cr_account_id,
                    narration: req.body.acc_narration.trim() + '_Total Member: ' + req.body.sub_account_ids.length
                };
                sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                    entry = {
                        document_number: req.body.document_number,
                        receipt_serial_number: i + 1,
                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                        receipt_amount: parseFloat(req.body.receipt_amounts[i]),
                        narration: req.body.narrations[i].trim()
                    };
                    sql = sql + `CALL updateBalance_Receipt(${entry.cr_sub_account_id}, ${entry.receipt_amount});`;
                }
                var mentry = {
                    document_number: req.body.document_number,
                    receipt_number: req.body.receipt_number,
                    receipt_date: req.body.receipt_date,
                    dr_account_id: req.body.dr_sub_account_id,
                    dr_sub_account_id: req.body.dr_sub_account_id,
                    cr_account_id: req.body.cr_account_id,
                    narration: req.body.acc_narration.trim(),
                    total_amount: total
                };
                console.log(sql, mentry);
                connection.query(sql, mentry, (err, results) => {
                    connection.release();
                    if (err) {
                        console.log(err);
                        req.flash('danger', 'Error while adding entry in Receipt!');
                        res.redirect('/receipt');
                    }
                    else {
                        req.flash('success', `Successfully added Receipt with document number ${req.body.document_number} !`);
                        res.redirect('/receipt');
                    }
                });
            }
        });
    }
});

router.get("/edit/:documentnum", middleware.loggedin_as_admin, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash("danger", "Error while editing entry!");
            res.redirect("/receipt");
        } else {
            var sql = `
                SELECT account_id FROM Account_Head;
                SELECT
                    Receipt.*,
                    DATE_FORMAT(Receipt.receipt_date,'%Y-%m-%d') AS receipt_nice_date,
                    Account_Head.account_name
                FROM Receipt
                INNER JOIN Account_Head
                    ON Account_Head.account_id = Receipt.cr_account_id
                WHERE document_number = ?;
                SELECT
                    Receipt_Details.cr_sub_account_id AS sub_account_id,
                    Sub_Account.sub_account_name,
                    Receipt_Details.receipt_amount,
                    Receipt_Details.narration
                FROM Receipt_Details
                INNER JOIN Sub_Account
                    ON Receipt_Details.cr_sub_account_id = Sub_Account.sub_account_id
                WHERE document_number = ?
                ORDER BY receipt_serial_number ASC;
            `;
            var docnum = parseInt(req.params.documentnum);
            connection.query(sql, [docnum, docnum], (err, results) => {
                console.log(connection.query);
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while editing entry!");
                    res.redirect("/receipt");
                } else {
                    res.render("transactions/receipt/editform", {
                        account_head: results[0],
                        document_number: parseInt(req.params.documentnum),
                        receipt: results[1][0],
                        receipt_details: results[2]
                    });
                }
            });
        }
    });
});

router.post("/edit/:documentnum", middleware.loggedin_as_admin, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error while editing receipt!');
            res.redirect('/receipt');
        }
        else {
            var docnum = parseInt(req.params.documentnum);
            var sql = `
                SELECT * FROM Receipt_Details WHERE Receipt_Details.document_number in (?);
            `;
            connection.query(sql, docnum, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                    req.flash('danger', 'Error while deleting receipt!');
                    res.redirect('/receipt');
                }
                else {
                    sql = '';
                    console.log(results);
                    for (var entryob of results) {
                        sql = sql + `CALL updateBalance_Receipt(${entryob.cr_sub_account_id}, ${-1 * entryob.receipt_amount});`;
                    }
                    sql = sql + `
                        DELETE FROM Receipt_Details WHERE Receipt_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?);
                        DELETE FROM Receipt WHERE Receipt.document_number in (?);
                    `;
                    console.log(sql, docnum);
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        if (err1) {
                            connection.release();
                            console.log(err1);
                            req.flash('danger', 'Error while deleting receipt!');
                            res.redirect('/receipt');
                        }
                        else {
                            console.log(results);
                            sql = '';
                            if (results1[0].affectedRows == 0 && results1[1].affectedRows == 0 && results1[2].affectedRows == 0) {
                                connection.release();
                                req.flash('danger', 'Error while deleting receipt!');
                                res.redirect('/receipt');
                            }
                            else {
                                sql = sql + 'INSERT INTO Receipt SET ?;';
                                var i, entry, lentry, total = 0.00;
                                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                                    entry = {
                                        document_number: req.body.document_number,
                                        receipt_serial_number: i + 1,
                                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                                        receipt_amount: parseFloat(req.body.receipt_amounts[i]),
                                        narration: req.body.narrations[i].trim()
                                    };
                                    sql = sql + 'INSERT INTO Receipt_Details SET ' + connection.escape(entry) + ';';
                                    total += entry.receipt_amount;
                                }
                                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                                    lentry = {
                                        tc: 'CR',
                                        document_number: req.body.document_number,
                                        transaction_date: req.body.receipt_date,
                                        account_id: req.body.cr_account_id,
                                        sub_account_id: req.body.sub_account_ids[i],
                                        cr_amount: parseFloat(req.body.receipt_amounts[i]),
                                        dr_amount: null,
                                        cross_account_id: req.body.dr_sub_account_id,
                                        narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                                    };
                                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                                }
                                lentry = {
                                    tc: 'CR',
                                    document_number: req.body.document_number,
                                    transaction_date: req.body.receipt_date,
                                    account_id: req.body.dr_sub_account_id,
                                    sub_account_id: req.body.dr_sub_account_id,
                                    cr_amount: null,
                                    dr_amount: total,
                                    cross_account_id: req.body.cr_account_id,
                                    narration: req.body.acc_narration.trim() + '_Total Member: ' + req.body.sub_account_ids.length
                                };
                                sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                                    entry = {
                                        document_number: req.body.document_number,
                                        receipt_serial_number: i + 1,
                                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                                        receipt_amount: parseFloat(req.body.receipt_amounts[i]),
                                        narration: req.body.narrations[i].trim()
                                    };
                                    sql = sql + `CALL updateBalance_Receipt(${entry.cr_sub_account_id}, ${entry.receipt_amount});`;
                                }
                                var mentry = {
                                    document_number: req.body.document_number,
                                    receipt_number: req.body.receipt_number,
                                    receipt_date: req.body.receipt_date,
                                    dr_account_id: req.body.dr_sub_account_id,
                                    dr_sub_account_id: req.body.dr_sub_account_id,
                                    cr_account_id: req.body.cr_account_id,
                                    narration: req.body.acc_narration.trim(),
                                    total_amount: total
                                };
                                console.log(sql);
                                connection.query(sql, mentry, (err, results) => {
                                    connection.release();
                                    if (err) {
                                        console.log(err);
                                        req.flash('danger', 'Error while editing receipt!');
                                        res.redirect('/receipt');
                                    }
                                    else {
                                        req.flash('success', 'Successfully edited receipt!');
                                        res.redirect('/receipt');
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.post("/delete", middleware.loggedin_as_admin, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error while deleting receipt!');
            res.redirect('/receipt');
        }
        else {
            var docnum = req.body.document_numbers;
            var sql = `
                SELECT * FROM Receipt_Details WHERE Receipt_Details.document_number in (?);
            `;
            connection.query(sql, docnum, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                    req.flash('danger', 'Error while deleting receipt!');
                    res.redirect('/receipt');
                }
                else {
                    sql = '';
                    for (var entryob of results) {
                        sql = sql + `CALL updateBalance_Receipt(${entryob.cr_sub_account_id}, ${-1 * entryob.receipt_amount});`;
                    }
                    sql = sql + `
                        DELETE FROM Receipt_Details WHERE Receipt_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?);
                        DELETE FROM Receipt WHERE Receipt.document_number in (?);
                    `;
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        connection.release();
                        if (err1) {
                            console.log(err1);
                            req.flash('danger', 'Error while deleting receipt!');
                            res.redirect('/receipt');
                        }
                        else {
                            if (results1[0].affectedRows === 0) {
                                req.flash('danger', 'Error while deleting receipt!');
                            }
                            else if (docnum.length === 1) {
                                req.flash('success', 'Successfully deleted receipt with document number ' + docnum[0] + '!');
                            }
                            else {
                                req.flash('success', 'Successfully deleted selected receipts!');
                            }
                            res.redirect('/receipt');
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
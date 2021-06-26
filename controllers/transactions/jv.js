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
                "Error while getting data from JV!"
            );
            res.render("transactions/jv/jv", {
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
            var sql1 = "SELECT COUNT(*) as ahcount FROM `JV`";
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash("danger", "Error while getting count of JV!");
                    console.log(err);
                    res.render("transactions/jv/jv", {
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
                            JV.*,
                            DATE_FORMAT(JV.jv_date,'%d/%m/%Y') AS jv_nice_date
                        FROM JV
                        ORDER BY JV.document_number DESC
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
                                "Error while getting data from JV!"
                            );
                            console.log(err);
                            res.render("transactions/jv/jv", {
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
                            res.render("transactions/jv/jv", {
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
            req.flash("danger", "Error in searching JV!");
            res.redirect("/jv");
        }
        else {
            var sql = `
                SELECT SQL_CALC_FOUND_ROWS
                    JV.*,
                    DATE_FORMAT(JV.jv_date,'%d/%m/%Y') AS jv_nice_date
                FROM JV
            `;
            var ob = req.query;
            var flag = false;
            if (ob["document_number"]) {
                if (!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.document_number =" + connection.escape(ob["document_number"]);
                }
                else {
                    sql = sql + " AND JV.document_number =" + connection.escape(ob["document_number"]);
                }
            }
            if (ob["jv_number"]) {
                if (!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.jv_number =" + connection.escape(ob["jv_number"]);
                }
                else {
                    sql = sql + " AND JV.jv_number =" + connection.escape(ob["jv_number"]);
                }
            }
            if (ob["jv_date"]) {
                if (!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.jv_date =" + connection.escape(ob["jv_date"]);
                }
                else {
                    sql = sql + " AND JV.jv_date =" + connection.escape(ob["jv_date"]);
                }
            }
            if (ob["amount"]) {
                if (!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.amount =" + connection.escape(ob["amount"]);
                }
                else {
                    sql = sql + " AND JV.amount =" + connection.escape(ob["amount"]);
                }
            }
            sql = sql +
                `
                ORDER BY JV.document_number DESC
                LIMIT ? , ?;
                SELECT FOUND_ROWS() AS count;
			`;
            var offset = (pagenum - 1) * entries_per_page;
            if (offset < 0)
                offset = 0;
            connection.query(sql, [offset, entries_per_page], (err, results) => {
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error in searching JV!");
                    res.redirect("/jv");
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
                        if (part.includes('document_number') || part.includes('jv_number') || part.includes('jv_date') || part.includes('amount') ) {
                            newarr.push(part);
                        }
                    }
                    var callbackurl = newarr.join('&');
                    var searched = (req.query.document_number ? req.query.document_number : "-") + "," + (req.query.jv_number ? req.query.jv_number : "-") + "," + (req.query.jv_date ? req.query.jv_date : "-") + "," + (req.query.amount ? req.query.amount : "-");
                    res.render("transactions/jv/jv_search", {
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
            res.redirect("/jv");
        } else {
            var sql = `
                SELECT account_id FROM Account_Head;
                SELECT MAX(document_number) AS maxcount FROM JV;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while adding new entry!");
                    res.redirect("/jv");
                } else {
                    var d = new Date();
                    var dd = ('0' + d.getDate()).slice(-2);
                    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
                    var yyyy = d.getFullYear();
                    var date = yyyy + "-" + mm + "-" + dd;
                    var account_head_list = [];
                    for (item of results[0]) {
                        account_head_list.push(item.account_id);
                    }
                    res.render("transactions/jv/addform", {
                        account_head: results[0],
                        document_number: results[1][0].maxcount + 1,
                        today_date: date,
                        account_head_list
                    });
                }
            });
        }
    });
});

router.post("/", middleware.loggedin_as_superuser, (req, res) => {
    const len = req.body.account_ids.length;
    if (!(req.body.sub_account_ids.length == len && req.body.cr_amounts.length == len && req.body.dr_amounts.length == len && req.body.narrations.length == len)) {
        console.log("Array Length is not matching");
        req.flash('danger', 'Error while adding jv !');
        res.redirect('/jv');
    }
    else {
        getConnection((err, connection) => {
            if (err) {
                console.log(err);
                req.flash('danger', 'Error while adding jv !');
                res.redirect('/jv');
            }
            else {
                var sql = 'INSERT INTO JV SET ?;', i, entry, lentry, cr_total = 0.00, dr_total = 0.00;
                for (i = 0; i < len; i++) {
                    entry = {
                        document_number: req.body.document_number,
                        jv_serial_number: i + 1,
                        account_id: req.body.account_ids[i],
                        sub_account_id: req.body.sub_account_ids[i],
                        dr_amount: parseFloat(req.body.dr_amounts[i]) || 0.00,
                        cr_amount: parseFloat(req.body.cr_amounts[i]) || 0.00,
                        narration: req.body.narrations[i].trim()
                    };
                    if (entry.cr_amount != 0 && entry.dr_amount != 0) {
                        console.log("Error : Both Credit and Debit Amount should not be there!");
                        req.flash('danger', 'Error while adding jv !');
                        res.redirect('/jv');
                    }
                    else if (entry.cr_amount == 0 && entry.dr_amount == 0) {
                        console.log("Error : Both Credit and Debit Amount should not be zero!");
                        req.flash('danger', 'Error while adding jv !');
                        res.redirect('/jv');
                    }
                    sql = sql + 'INSERT INTO JV_Details SET ' + connection.escape(entry) + ';';
                    cr_total += entry.cr_amount;
                    dr_total += entry.dr_amount;
                }
                if (cr_total != dr_total) {
                    console.log("Error : CR Amount and DR Amount is not matching!");
                    req.flash('danger', 'Error while adding jv !');
                    res.redirect('/jv');
                }
                for (i = 0; i < len; i++) {
                    if (req.body.cr_amounts[i] == 0) {
                        lentry = {
                            tc: 'JV',
                            document_number: req.body.document_number,
                            transaction_date: req.body.jv_date,
                            account_id: req.body.account_ids[i],
                            sub_account_id: req.body.sub_account_ids[i],
                            cr_amount: 0.00,
                            dr_amount: parseFloat(req.body.dr_amounts[i]) || 0.00,
                            cross_account_id: "Multiple",
                            narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                        };
                    }
                    else {
                        lentry = {
                            tc: 'JV',
                            document_number: req.body.document_number,
                            transaction_date: req.body.jv_date,
                            account_id: req.body.account_ids[i],
                            sub_account_id: req.body.sub_account_ids[i],
                            cr_amount: parseFloat(req.body.cr_amounts[i]) || 0.00,
                            dr_amount: 0.00,
                            cross_account_id: "Multiple",
                            narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                        };
                    }
                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                }
                for (i = 0; i < len; i++) {
                    entry = {
                        document_number: req.body.document_number,
                        jv_serial_number: i + 1,
                        account_id: req.body.account_ids[i],
                        sub_account_id: req.body.sub_account_ids[i],
                        dr_amount: parseFloat(req.body.dr_amounts[i]) || 0.00,
                        cr_amount: parseFloat(req.body.cr_amounts[i]) || 0.00,
                        narration: req.body.narrations[i].trim()
                    };
                    if (entry.cr_amount == 0) {
                        sql = sql + `CALL updateBalance_Payment("${entry.sub_account_id}", ${entry.dr_amount});`;
                    }
                    else {
                        sql = sql + `CALL updateBalance_Receipt("${entry.sub_account_id}", ${entry.cr_amount});`;
                    }
                }
                var mentry = {
                    document_number: req.body.document_number,
                    jv_number: req.body.jv_number,
                    jv_date: req.body.jv_date,
                    amount: cr_total,
                    narration: req.body.acc_narration.trim()
                };
                connection.query(sql, mentry, (err, results) => {
                    connection.release();
                    if (err) {
                        console.log(err);
                        req.flash('danger', 'Error while adding entry in JV!');
                        res.redirect('/jv');
                    }
                    else {
                        req.flash('success', `Successfully added JV with document number ${req.body.document_number} !`);
                        res.redirect('/jv');
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
            res.redirect("/jv");
        } else {
            var sql = `
                SELECT account_id FROM Account_Head;
                SELECT
                    JV.*,
                    DATE_FORMAT(JV.jv_date,'%Y-%m-%d') AS jv_nice_date
                FROM JV
                WHERE document_number = ?;
                SELECT
                    JV_Details.account_id,JV_Details.sub_account_id,JV_Details.dr_amount,JV_Details.cr_amount,JV_Details.narration,
                    Account_Head.account_name,
                    Sub_Account.sub_account_name
                FROM JV_Details
                INNER JOIN Account_Head
                    ON JV_Details.account_id = Account_Head.account_id
                INNER JOIN Sub_Account
                    ON JV_Details.sub_account_id = Sub_Account.sub_account_id
                WHERE document_number = ?
                ORDER BY JV_Details.jv_serial_number ASC;
            `;
            var docnum = parseInt(req.params.documentnum);
            connection.query(sql, [docnum, docnum], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while editing entry!");
                    res.redirect("/jv");
                } else {
                    var account_head_list = [];
                    for (item of results[0]) {
                        account_head_list.push(item.account_id);
                    }
                    res.render("transactions/jv/editform", {
                        account_head: results[0],
                        document_number: parseInt(req.params.documentnum),
                        jv: results[1][0],
                        jv_details: results[2],
                        account_head_list
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
            req.flash('danger', 'Error while editing jv!');
            res.redirect('/jv');
        }
        else {
            var error_flag = false;
            var docnum = parseInt(req.params.documentnum);
            var sql = `
                SELECT * FROM JV_Details WHERE JV_Details.document_number in (?);
            `;
            connection.query(sql, docnum, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                    req.flash('danger', 'Error while editing jv!');
                    res.redirect('/jv');
                }
                else {
                    sql = '';
                    for (var entryob of results) {
                        if (entryob.cr_amount == 0) {
                            sql = sql + `CALL updateBalance_Payment("${entryob.sub_account_id}", ${-1 * entryob.dr_amount});`;
                        }
                        else {
                            sql = sql + `CALL updateBalance_Receipt("${entryob.sub_account_id}", ${-1 * entryob.cr_amount});`;
                        }
                    }
                    sql = sql + `
                        DELETE FROM JV_Details WHERE JV_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?) AND Ledger.tc = "JV";
                        DELETE FROM JV WHERE JV.document_number in (?);
                    `;
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        if (err1) {
                            connection.release();
                            console.log(err1);
                            req.flash('danger', 'Error while editing jv!');
                            res.redirect('/jv');
                        }
                        else {
                            sql = '';
                            if (results1[0].affectedRows == 0 && results1[1].affectedRows == 0 && results1[2].affectedRows == 0) {
                                connection.release();
                                req.flash('danger', 'Error while editing jv!');
                                res.redirect('/jv');
                            }
                            else {
                                const len = req.body.account_ids.length;
                                if (!(req.body.sub_account_ids.length == len && req.body.cr_amounts.length == len && req.body.dr_amounts.length == len && req.body.narrations.length == len)) {
                                    console.log("Array Length is not matching");
                                    req.flash('danger', 'Error while adding jv !');
                                    res.redirect('/jv');
                                }
                                sql = 'INSERT INTO JV SET ?;'
                                var i, entry, lentry, cr_total = 0.00, dr_total = 0.00;
                                for (i = 0; i < len; i++) {
                                    entry = {
                                        document_number: req.body.document_number,
                                        jv_serial_number: i + 1,
                                        account_id: req.body.account_ids[i],
                                        sub_account_id: req.body.sub_account_ids[i],
                                        dr_amount: parseFloat(req.body.dr_amounts[i]) || 0.00,
                                        cr_amount: parseFloat(req.body.cr_amounts[i]) || 0.00,
                                        narration: req.body.narrations[i].trim()
                                    };
                                    if (entry.cr_amount != 0 && entry.dr_amount != 0) {
                                        //connection.release();
                                        console.log("Error : Both Credit and Debit Amount should not be there!");
                                        req.flash('danger', 'Error while editing jv !');
                                        error_flag = true;
                                        break;
                                        //res.redirect('/jv');
                                    }
                                    else if (entry.cr_amount == 0 && entry.dr_amount == 0) {
                                        //connection.release();
                                        console.log("Error : Both Credit and Debit Amount should not be zero!");
                                        req.flash('danger', 'Error while editing jv !');
                                        error_flag = true;
                                        break;
                                        //res.redirect('/jv');
                                    }
                                    sql = sql + 'INSERT INTO JV_Details SET ' + connection.escape(entry) + ';';
                                    cr_total += entry.cr_amount;
                                    dr_total += entry.dr_amount;
                                }
                                if (cr_total != dr_total && error_flag != true) {
                                    //connection.release();
                                    console.log("Error : CR Amount and DR Amount is not matching!");
                                    req.flash('danger', 'Error while editing jv !');
                                    error_flag = true;
                                    //res.redirect('/jv');
                                }
                                if (error_flag == true) {
                                    connection.release();
                                    res.redirect('/jv');
                                }
                                else {
                                    for (i = 0; i < len; i++) {
                                        if (req.body.cr_amounts[i] == 0) {
                                            lentry = {
                                                tc: 'JV',
                                                document_number: req.body.document_number,
                                                transaction_date: req.body.jv_date,
                                                account_id: req.body.account_ids[i],
                                                sub_account_id: req.body.sub_account_ids[i],
                                                cr_amount: 0.00,
                                                dr_amount: parseFloat(req.body.dr_amounts[i]) || 0.00,
                                                cross_account_id: "Multiple",
                                                narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                                            };
                                        }
                                        else {
                                            lentry = {
                                                tc: 'JV',
                                                document_number: req.body.document_number,
                                                transaction_date: req.body.jv_date,
                                                account_id: req.body.account_ids[i],
                                                sub_account_id: req.body.sub_account_ids[i],
                                                cr_amount: parseFloat(req.body.cr_amounts[i]) || 0.00,
                                                dr_amount: 0.00,
                                                cross_account_id: "Multiple",
                                                narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                                            };
                                        }
                                        sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                                    }
                                    for (i = 0; i < len; i++) {
                                        entry = {
                                            document_number: req.body.document_number,
                                            jv_serial_number: i + 1,
                                            account_id: req.body.account_ids[i],
                                            sub_account_id: req.body.sub_account_ids[i],
                                            dr_amount: parseFloat(req.body.dr_amounts[i]) || 0.00,
                                            cr_amount: parseFloat(req.body.cr_amounts[i]) || 0.00,
                                            narration: req.body.narrations[i].trim()
                                        };
                                        if (entry.cr_amount == 0) {
                                            sql = sql + `CALL updateBalance_Payment("${entry.sub_account_id}", ${entry.dr_amount});`;
                                        }
                                        else {
                                            sql = sql + `CALL updateBalance_Receipt("${entry.sub_account_id}", ${entry.cr_amount});`;
                                        }
                                    }
                                    var mentry = {
                                        document_number: req.body.document_number,
                                        jv_number: req.body.jv_number,
                                        jv_date: req.body.jv_date,
                                        amount: cr_total,
                                        narration: req.body.acc_narration.trim()
                                    };
                                    connection.query(sql, mentry, (err, results) => {
                                        connection.release();
                                        if (err) {
                                            console.log(err);
                                            req.flash('danger', 'Error while editing entry in JV!');
                                            res.redirect('/jv');
                                        }
                                        else {
                                            req.flash('success', `Successfully edited JV with document number ${req.body.document_number} !`);
                                            res.redirect('/jv');
                                        }
                                    });
                                }
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
            req.flash('danger', 'Error while deleting jv!');
            res.redirect('/jv');
        }
        else {
            var docnum = req.body.document_numbers;
            var sql = `
                SELECT * FROM JV_Details WHERE JV_Details.document_number in (?);
            `;
            connection.query(sql, docnum, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                    req.flash('danger', 'Error while deleting jv!');
                    res.redirect('/jv');
                }
                else {
                    sql = '';
                    for (var entryob of results) {
                        if (entryob.cr_amount == 0) {
                            sql = sql + `CALL updateBalance_Payment("${entryob.sub_account_id}", ${-1 * entryob.dr_amount});`;
                        }
                        else {
                            sql = sql + `CALL updateBalance_Receipt("${entryob.sub_account_id}", ${-1 * entryob.cr_amount});`;
                        }
                    }
                    sql = sql + `
                        DELETE FROM JV_Details WHERE JV_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?) AND Ledger.tc = "JV";
                        DELETE FROM JV WHERE JV.document_number in (?);
                    `;
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        connection.release();
                        if (err1) {
                            console.log(err1);
                            req.flash('danger', 'Error while deleting jv!');
                            res.redirect('/jv');
                        }
                        else {
                            if (results1[results1.length - 1].affectedRows === 0) {
                                req.flash('danger', 'Error while deleting jv!');
                            }
                            else if (docnum.length === 1) {
                                req.flash('success', 'Successfully deleted jv with document number ' + docnum[0] + '!');
                            }
                            else {
                                req.flash('success', 'Successfully deleted selected jvs!');
                            }
                            res.redirect('/jv');
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
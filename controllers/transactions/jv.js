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
                SELECT
                    JV.*,
                    DATE_FORMAT(JV.jv_date,'%d/%m/%Y') AS jv_nice_date,
                    Account_Head.account_name
                FROM JV
                INNER JOIN Account_Head
                    ON Account_Head.account_id = JV.cr_account_id
            `;
            var ob = req.query;
            var flag = false;
            if(ob["document_number"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.document_number ="+ connection.escape(ob["document_number"]);
                }
                else {
                    sql = sql + " AND JV.document_number ="+ connection.escape(ob["document_number"]);
                }
            }
            if(ob["jv_number"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.jv_number ="+ connection.escape(ob["jv_number"]);
                }
                else {
                    sql = sql + " AND JV.jv_number ="+ connection.escape(ob["jv_number"]);
                }
            }
            if(ob["jv_date"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.jv_date ="+ connection.escape(ob["jv_date"]);
                }
                else {
                    sql = sql + " AND JV.jv_date ="+ connection.escape(ob["jv_date"]);
                }
            }
            if(ob["jv_date"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.jv_date ="+ connection.escape(ob["jv_date"]);
                }
                else {
                    sql = sql + " AND JV.jv_date ="+ connection.escape(ob["jv_date"]);
                }
            }
            if(ob["account_id"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE JV.cr_account_id ="+ connection.escape(ob["account_id"]);
                }
                else {
                    sql = sql + " AND JV.cr_account_id ="+ connection.escape(ob["account_id"]);
                }
            }
            if(ob["account_name"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE Account_Head.account_name ="+ connection.escape(ob["account_name"]);
                }
                else {
                    sql = sql + " OR Account_Head.account_name ="+ connection.escape(ob["account_name"]);
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
                else 
                {
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
                        if (part.includes('document_number') || part.includes('jv_number') || part.includes('jv_date') || part.includes('account_id') || part.includes('account_name')) {
                            newarr.push(part);
                        }
                    }
                    var callbackurl = newarr.join('&');
                    var searched = (req.query.document_number ? req.query.document_number : "-") + "," + (req.query.jv_number ? req.query.jv_number : "-") + "," + (req.query.jv_date ? req.query.jv_date : "-") + "," + (req.query.account_id ? req.query.account_id : "-") + "," + (req.query.account_name ? req.query.account_name : "-");
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
                    res.render("transactions/jv/addform", {
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
    if (req.body.sub_account_ids.length != req.body.jv_amounts.length) {
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
                var sql = 'INSERT INTO JV SET ?;', i, entry, lentry, total = 0.00;
                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                    entry = {
                        document_number: req.body.document_number,
                        jv_serial_number: i + 1,
                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                        jv_amount: parseFloat(req.body.jv_amounts[i]),
                        narration: req.body.narrations[i].trim()
                    };
                    sql = sql + 'INSERT INTO JV_Details SET ' + connection.escape(entry) + ';';
                    total += entry.jv_amount;
                }
                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                    lentry = {
                        tc: 'CR',
                        document_number: req.body.document_number,
                        transaction_date: req.body.jv_date,
                        account_id: req.body.cr_account_id,
                        sub_account_id: req.body.sub_account_ids[i],
                        cr_amount: parseFloat(req.body.jv_amounts[i]),
                        dr_amount: null,
                        cross_account_id: req.body.dr_sub_account_id,
                        narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                    };
                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                }
                lentry = {
                    tc: 'CR',
                    document_number: req.body.document_number,
                    transaction_date: req.body.jv_date,
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
                        jv_serial_number: i + 1,
                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                        jv_amount: parseFloat(req.body.jv_amounts[i]),
                        narration: req.body.narrations[i].trim()
                    };
                    sql = sql + `CALL updateBalance_JV(${entry.cr_sub_account_id}, ${entry.jv_amount});`;
                }
                var mentry = {
                    document_number: req.body.document_number,
                    jv_number: req.body.jv_number,
                    jv_date: req.body.jv_date,
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
                    DATE_FORMAT(JV.jv_date,'%Y-%m-%d') AS jv_nice_date,
                    Account_Head.account_name
                FROM JV
                INNER JOIN Account_Head
                    ON Account_Head.account_id = JV.cr_account_id
                WHERE document_number = ?;
                SELECT
                    JV_Details.cr_sub_account_id AS sub_account_id,
                    Sub_Account.sub_account_name,
                    JV_Details.jv_amount,
                    JV_Details.narration
                FROM JV_Details
                INNER JOIN Sub_Account
                    ON JV_Details.cr_sub_account_id = Sub_Account.sub_account_id
                WHERE document_number = ?
                ORDER BY jv_serial_number ASC;
            `;
            var docnum = parseInt(req.params.documentnum);
            connection.query(sql, [docnum, docnum], (err, results) => {
                console.log(connection.query);
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while editing entry!");
                    res.redirect("/jv");
                } else {
                    res.render("transactions/jv/editform", {
                        account_head: results[0],
                        document_number: parseInt(req.params.documentnum),
                        jv: results[1][0],
                        jv_details: results[2]
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
            var docnum = parseInt(req.params.documentnum);
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
                    console.log(results);
                    for (var entryob of results) {
                        sql = sql + `CALL updateBalance_JV(${entryob.cr_sub_account_id}, ${-1 * entryob.jv_amount});`;
                    }
                    sql = sql + `
                        DELETE FROM JV_Details WHERE JV_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?);
                        DELETE FROM JV WHERE JV.document_number in (?);
                    `;
                    console.log(sql, docnum);
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        if (err1) {
                            connection.release();
                            console.log(err1);
                            req.flash('danger', 'Error while deleting jv!');
                            res.redirect('/jv');
                        }
                        else {
                            console.log(results);
                            sql = '';
                            if (results1[0].affectedRows == 0 && results1[1].affectedRows == 0 && results1[2].affectedRows == 0) {
                                connection.release();
                                req.flash('danger', 'Error while deleting jv!');
                                res.redirect('/jv');
                            }
                            else {
                                sql = sql + 'INSERT INTO JV SET ?;';
                                var i, entry, lentry, total = 0.00;
                                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                                    entry = {
                                        document_number: req.body.document_number,
                                        jv_serial_number: i + 1,
                                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                                        jv_amount: parseFloat(req.body.jv_amounts[i]),
                                        narration: req.body.narrations[i].trim()
                                    };
                                    sql = sql + 'INSERT INTO JV_Details SET ' + connection.escape(entry) + ';';
                                    total += entry.jv_amount;
                                }
                                for (i = 0; i < req.body.sub_account_ids.length; i++) {
                                    lentry = {
                                        tc: 'CR',
                                        document_number: req.body.document_number,
                                        transaction_date: req.body.jv_date,
                                        account_id: req.body.cr_account_id,
                                        sub_account_id: req.body.sub_account_ids[i],
                                        cr_amount: parseFloat(req.body.jv_amounts[i]),
                                        dr_amount: null,
                                        cross_account_id: req.body.dr_sub_account_id,
                                        narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                                    };
                                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                                }
                                lentry = {
                                    tc: 'CR',
                                    document_number: req.body.document_number,
                                    transaction_date: req.body.jv_date,
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
                                        jv_serial_number: i + 1,
                                        cr_sub_account_id: req.body.sub_account_ids[i].trim(),
                                        jv_amount: parseFloat(req.body.jv_amounts[i]),
                                        narration: req.body.narrations[i].trim()
                                    };
                                    sql = sql + `CALL updateBalance_JV(${entry.cr_sub_account_id}, ${entry.jv_amount});`;
                                }
                                var mentry = {
                                    document_number: req.body.document_number,
                                    jv_number: req.body.jv_number,
                                    jv_date: req.body.jv_date,
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
                                        req.flash('danger', 'Error while editing jv!');
                                        res.redirect('/jv');
                                    }
                                    else {
                                        req.flash('success', 'Successfully edited jv!');
                                        res.redirect('/jv');
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
                        sql = sql + `CALL updateBalance_JV(${entryob.cr_sub_account_id}, ${-1 * entryob.jv_amount});`;
                    }
                    sql = sql + `
                        DELETE FROM JV_Details WHERE JV_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?);
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
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
                "Error while getting data from Payment!"
            );
            res.render("transactions/payment/payment", {
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
            var sql1 = "SELECT COUNT(*) as ahcount FROM `Payment`";
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash("danger", "Error while getting count of Payment!");
                    console.log(err);
                    res.render("transactions/payment/payment", {
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
                        Payment.*,
                        DATE_FORMAT(Payment.voucher_date,'%d/%m/%Y') AS payment_nice_date,
                        Account_Head.account_name
                    FROM Payment
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Payment.dr_account_id
                    ORDER BY Payment.document_number DESC
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
                                "Error while getting data from Payment!"
                            );
                            console.log(err);
                            res.render("transactions/payment/payment", {
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
                            res.render("transactions/payment/payment", {
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
            req.flash("danger", "Error in searching Payment!");
            res.redirect("/payment");
        }
        else {
            var sql = `
                SELECT SQL_CALC_FOUND_ROWS
                    Payment.*,
                    DATE_FORMAT(Payment.voucher_date,'%d/%m/%Y') AS payment_nice_date,
                    Account_Head.account_name
                FROM Payment
                INNER JOIN Account_Head
                    ON Account_Head.account_id = Payment.dr_account_id
            `;
            var ob = req.query;
            var flag = false;
            if(ob["document_number"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE Payment.document_number ="+ connection.escape(ob["document_number"]);
                }
                else {
                    sql = sql + " AND Payment.document_number ="+ connection.escape(ob["document_number"]);
                }
            }
            if(ob["voucher_date"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE Payment.voucher_date ="+ connection.escape(ob["voucher_date"]);
                }
                else {
                    sql = sql + " AND Payment.voucher_date ="+ connection.escape(ob["voucher_date"]);
                }
            }
            if(ob["account_id"]) {
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE Payment.dr_account_id ="+ connection.escape(ob["account_id"]);
                }
                else {
                    sql = sql + " AND Payment.dr_account_id ="+ connection.escape(ob["account_id"]);
                }
            }
            if(ob["account_name"]) {
                var acc_search_name = "%" + connection.escape(ob["account_name"]) + "%";
                if(!flag) {
                    flag = true;
                    sql = sql + " WHERE Account_Head.account_name LIKE '%" + ob["account_name"] + "%'";
                }
                else {
                    sql = sql + " OR Account_Head.account_name LIKE '%" + ob["account_name"] + "%'";
                }
            }
            sql = sql + 
            `
                ORDER BY Payment.document_number DESC
                LIMIT ? , ?;
                SELECT FOUND_ROWS() AS count;
            `;
            var offset = (pagenum - 1) * entries_per_page;
            if (offset < 0)
                offset = 0;
            connection.query(sql, [offset, entries_per_page], (err, results) => {
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error in searching Payment!");
                    res.redirect("/payment");
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
                        if (part.includes('document_number') || part.includes('voucher_date') || part.includes('account_id') || part.includes('account_name')) {
                            newarr.push(part);
                        }
                    }
                    var callbackurl = newarr.join('&');
                    var searched = (req.query.document_number ? req.query.document_number : "-") + "," + (req.query.voucher_date ? req.query.voucher_date : "-") + "," + (req.query.account_id ? req.query.account_id : "-") + "," + (req.query.account_name ? req.query.account_name : "-");
                    res.render("transactions/payment/payment_search", {
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
            res.redirect("/payment");
        } else {
            var sql = `
                SELECT account_id FROM Account_Head;
                SELECT MAX(document_number) AS maxcount FROM Payment;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while adding new entry!");
                    res.redirect("/payment");
                } else {
                    var d = new Date();
                    var dd = ('0' + d.getDate()).slice(-2);
                    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
                    var yyyy = d.getFullYear();
                    var date = yyyy + "-" + mm + "-" + dd;
                    res.render("transactions/payment/addform", {
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
    var sub_account_len = req.body.sub_account_ids.length;
    if (req.body.cattle_feeds.length != sub_account_len || req.body.mineral_mixs.length != sub_account_len || req.body.pasu_posaks.length != sub_account_len || req.body.insurances.length != sub_account_len || req.body.others.length != sub_account_len || req.body.other1s.length != sub_account_len) {
        console.log("Array Length is not matching");
        req.flash('danger', 'Error while adding payment !');
        res.redirect('/payment');
    }
    else {
        getConnection((err, connection) => {
            if (err) {
                console.log(err);
                req.flash('danger', 'Error while adding payment !');
                res.redirect('/payment');
            }
            else {
                var sql = 'INSERT INTO Payment SET ?;', i, entry, lentry, total = 0.00;
                var sub_total_arr = [];
                for (i = 0; i < sub_account_len; i++) {
                    entry = {
                        document_number: req.body.document_number,
                        voucher_serial_number: i + 1,
                        dr_sub_account_id: parseFloat(req.body.sub_account_ids[i]),
                        cattle_feed: parseFloat(req.body.cattle_feeds[i]),
                        mineral_mix: parseFloat(req.body.mineral_mixs[i]),
                        pasu_posak: parseFloat(req.body.pasu_posaks[i]),
                        insurance: parseFloat(req.body.insurances[i]),
                        other: parseFloat(req.body.others[i]),
                        other1: parseFloat(req.body.other1s[i]),
                        narration: req.body.narrations[i].trim()
                    };
                    sub_total = entry.cattle_feed + entry.mineral_mix + entry.pasu_posak + entry.insurance + entry.other + entry.other1;
                    sub_total_arr.push(sub_total);
                    entry.payment_amount = sub_total;
                    sql = sql + 'INSERT INTO Payment_Details SET ' + connection.escape(entry) + ';';
                    total += entry.payment_amount;
                }
                for (i = 0; i < sub_account_len; i++) {
                    lentry = {
                        tc: 'DR',
                        document_number: req.body.document_number,
                        transaction_date: req.body.voucher_date,
                        account_id: req.body.dr_account_id,
                        sub_account_id: req.body.sub_account_ids[i],
                        cr_amount: null,
                        dr_amount: parseFloat(sub_total_arr[i]),
                        cross_account_id: req.body.cr_sub_account_id,
                        narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                    };
                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                }
                lentry = {
                    tc: 'PM',// PM
                    document_number: req.body.document_number,
                    transaction_date: req.body.voucher_date,
                    account_id: req.body.cr_sub_account_id,
                    sub_account_id: req.body.cr_sub_account_id,
                    cr_amount: total,
                    dr_amount: null,
                    cross_account_id: req.body.dr_account_id,
                    narration: req.body.acc_narration.trim() + '_Total Member: ' + req.body.sub_account_ids.length
                };
                sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                for (i = 0; i < sub_account_len; i++) {
                    sql = sql + `CALL updateBalance_Payment("${req.body.sub_account_ids[i]}", ${sub_total_arr[i]});`;
                }
                var mentry = {
                    document_number: req.body.document_number,
                    voucher_date: req.body.voucher_date,
                    cr_account_id: req.body.cr_sub_account_id,
                    cr_sub_account_id: req.body.cr_sub_account_id,
                    dr_account_id: req.body.dr_account_id,
                    cheque_no: req.body.cheque_no,
                    total_amount: total,
                    narration: req.body.acc_narration.trim()
                };
                connection.query(sql, mentry, (err, results) => {
                    connection.release();
                    if (err) {
                        console.log(err);
                        req.flash('danger', 'Error while adding entry in Payment!');
                        res.redirect('/payment');
                    }
                    else {
                        req.flash('success', `Successfully added Payment with document number ${req.body.document_number} !`);
                        res.redirect('/payment');
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
            res.redirect("/payment");
        } else {
            var sql = `
                SELECT account_id FROM Account_Head;
                SELECT
                    Payment.*,
                    DATE_FORMAT(Payment.voucher_date,'%Y-%m-%d') AS payment_nice_date,
                    Account_Head.account_name
                FROM Payment
                INNER JOIN Account_Head
                    ON Account_Head.account_id = Payment.dr_account_id
                WHERE document_number = ?;
                SELECT
                    Payment_Details.dr_sub_account_id AS sub_account_id,
                    Sub_Account.sub_account_name,
                    Payment_Details.cattle_feed,
                    Payment_Details.mineral_mix,
                    Payment_Details.pasu_posak,
                    Payment_Details.insurance,
                    Payment_Details.other,
                    Payment_Details.other1,
                    Payment_Details.payment_amount as sub_total,
                    Payment_Details.narration
                FROM Payment_Details
                INNER JOIN Sub_Account
                    ON Payment_Details.dr_sub_account_id = Sub_Account.sub_account_id
                WHERE document_number = ?
                ORDER BY voucher_serial_number ASC;
            `;
            var docnum = parseInt(req.params.documentnum);
            connection.query(sql, [docnum, docnum], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash("danger", "Error while editing entry!");
                    res.redirect("/payment");
                } else {
                    res.render("transactions/payment/editform", {
                        account_head: results[0],
                        document_number: parseInt(req.params.documentnum),
                        payment: results[1][0],
                        payment_details: results[2]
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
            req.flash('danger', 'Error while editing payment!');
            res.redirect('/payment');
        }
        else {
            var docnum = parseInt(req.params.documentnum);
            var sql = `
                SELECT * FROM Payment_Details WHERE Payment_Details.document_number in (?);
            `;
            connection.query(sql, docnum, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                    req.flash('danger', 'Error while deleting payment!');
                    res.redirect('/payment');
                }
                else {
                    sql = '';
                    for (var entryob of results) {
                        sql = sql + `CALL updateBalance_Payment("${entryob.dr_sub_account_id}", ${-1 * entryob.payment_amount});`;
                    }
                    sql = sql + `
                        DELETE FROM Payment_Details WHERE Payment_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?) AND Ledger.tc = "PM";
                        DELETE FROM Payment WHERE Payment.document_number in (?);
                    `;
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        if (err1) {
                            connection.release();
                            console.log(err1);
                            req.flash('danger', 'Error while deleting payment!');
                            res.redirect('/payment');
                        }
                        else {
                            sql = '';
                            var sub_account_len = req.body.sub_account_ids.length;
                            if (results1[0].affectedRows == 0 && results1[1].affectedRows == 0 && results1[2].affectedRows == 0) {
                                connection.release();
                                req.flash('danger', 'Error while deleting payment!');
                                res.redirect('/payment');
                            }
                            else if (req.body.cattle_feeds.length != sub_account_len || req.body.mineral_mixs.length != sub_account_len || req.body.pasu_posaks.length != sub_account_len || req.body.insurances.length != sub_account_len || req.body.others.length != sub_account_len || req.body.other1s.length != sub_account_len) {
                                console.log("Array Length is not matching");
                                req.flash('danger', 'Error while editing payment !');
                                res.redirect('/payment');
                            }
                            else {
                                var sql = 'INSERT INTO Payment SET ?;', i, entry, lentry, total = 0.00;
                                var sub_total_arr = [];
                                for (i = 0; i < sub_account_len; i++) {
                                    entry = {
                                        document_number: req.body.document_number,
                                        voucher_serial_number: i + 1,
                                        dr_sub_account_id: parseFloat(req.body.sub_account_ids[i]),
                                        cattle_feed: parseFloat(req.body.cattle_feeds[i]),
                                        mineral_mix: parseFloat(req.body.mineral_mixs[i]),
                                        pasu_posak: parseFloat(req.body.pasu_posaks[i]),
                                        insurance: parseFloat(req.body.insurances[i]),
                                        other: parseFloat(req.body.others[i]),
                                        other1: parseFloat(req.body.other1s[i]),
                                        narration: req.body.narrations[i].trim()
                                    };
                                    sub_total = entry.cattle_feed + entry.mineral_mix + entry.pasu_posak + entry.insurance + entry.other + entry.other1;
                                    sub_total_arr.push(sub_total);
                                    entry.payment_amount = sub_total;
                                    sql = sql + 'INSERT INTO Payment_Details SET ' + connection.escape(entry) + ';';
                                    total += entry.payment_amount;
                                }
                                for (i = 0; i < sub_account_len; i++) {
                                    lentry = {
                                        tc: 'DR',
                                        document_number: req.body.document_number,
                                        transaction_date: req.body.voucher_date,
                                        account_id: req.body.dr_account_id,
                                        sub_account_id: req.body.sub_account_ids[i],
                                        cr_amount: null,
                                        dr_amount: parseFloat(sub_total_arr[i]),
                                        cross_account_id: req.body.cr_sub_account_id,
                                        narration: req.body.acc_narration.trim() + '_' + req.body.narrations[i].trim()
                                    };
                                    sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                                }
                                lentry = {
                                    tc: 'PM',// PM
                                    document_number: req.body.document_number,
                                    transaction_date: req.body.voucher_date,
                                    account_id: req.body.cr_sub_account_id,
                                    sub_account_id: req.body.cr_sub_account_id,
                                    cr_amount: total,
                                    dr_amount: null,
                                    cross_account_id: req.body.dr_account_id,
                                    narration: req.body.acc_narration.trim() + '_Total Member: ' + req.body.sub_account_ids.length
                                };
                                sql = sql + 'INSERT INTO Ledger SET ' + connection.escape(lentry) + ';';
                                for (i = 0; i < sub_account_len; i++) {
                                    sql = sql + `CALL updateBalance_Payment("${req.body.sub_account_ids[i]}", ${sub_total_arr[i]});`;
                                }
                                var mentry = {
                                    document_number: req.body.document_number,
                                    voucher_date: req.body.voucher_date,
                                    cr_account_id: req.body.cr_sub_account_id,
                                    cr_sub_account_id: req.body.cr_sub_account_id,
                                    dr_account_id: req.body.dr_account_id,
                                    cheque_no: req.body.cheque_no,
                                    total_amount: total,
                                    narration: req.body.acc_narration.trim()
                                };
                                connection.query(sql, mentry, (err, results) => {
                                    connection.release();
                                    if (err) {
                                        console.log(err);
                                        req.flash('danger', 'Error while editing payment!');
                                        res.redirect('/payment');
                                    }
                                    else {
                                        req.flash('success', 'Successfully edited payment!');
                                        res.redirect('/payment');
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
            req.flash('danger', 'Error while deleting payment!');
            res.redirect('/payment');
        }
        else {
            var docnum = req.body.document_numbers;
            var sql = `
                SELECT * FROM Payment_Details WHERE Payment_Details.document_number in (?);
            `;
            connection.query(sql, docnum, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                    req.flash('danger', 'Error while deleting payment!');
                    res.redirect('/payment');
                }
                else {
                    sql = '';
                    for (var entryob of results) {
                        sql = sql + `CALL updateBalance_Payment("${entryob.dr_sub_account_id}", ${-1 * entryob.payment_amount});`;
                    }
                    sql = sql + `
                        DELETE FROM Payment_Details WHERE Payment_Details.document_number in (?);
                        DELETE FROM Ledger WHERE Ledger.document_number in (?) AND Ledger.tc = "PM";
                        DELETE FROM Payment WHERE Payment.document_number in (?);
                    `;
                    connection.query(sql, [docnum, docnum, docnum], (err1, results1) => {
                        connection.release();
                        if (err1) {
                            console.log(err1);
                            req.flash('danger', 'Error while deleting payment!');
                            res.redirect('/payment');
                        }
                        else {
                            if (results1[results1.length - 1].affectedRows === 0) {
                                req.flash('danger', 'Error while deleting payment!');
                            }
                            else if (docnum.length === 1) {
                                req.flash('success', 'Successfully deleted payment with document number ' + docnum[0] + '!');
                            }
                            else {
                                req.flash('success', 'Successfully deleted selected payments!');
                            }
                            res.redirect('/payment');
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
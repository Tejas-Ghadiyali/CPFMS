const express = require('express');
const router = express.Router();
const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

router.get('/receiptdetails/:docnum', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, conncetion) => {
        if (err) {
            console.log(err);
            res.send({ status: false });
        }
        else {
            var sql = `
                SELECT 
                    Receipt_Details.receipt_serial_number,Receipt_Details.cr_sub_account_id,Receipt_Details.receipt_amount,Sub_Account.sub_account_name 
                FROM Receipt_Details
                INNER JOIN Sub_Account
                    ON Receipt_Details.cr_sub_account_id = Sub_Account.sub_account_id
                WHERE Receipt_Details.document_number = ?
                ORDER BY Receipt_Details.receipt_serial_number ASC
            `;
            var docnum = parseInt(req.params.docnum);
            conncetion.query(sql, docnum, (err, results) => {
                conncetion.release();
                if (err) {
                    console.log(err);
                    res.send({ status: false });
                }
                else {
                    if (results.length > 0) {
                        res.send({
                            status: true,
                            data: results
                        });
                    }
                    else {
                        res.send({ status: false });
                    }
                }
            });
        }
    });
});

router.get('/paymentdetails/:docnum', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, conncetion) => {
        if (err) {
            console.log(err);
            res.send({ status: false });
        }
        else {
            var sql = `
                SELECT 
                    Payment_Details.voucher_serial_number,Payment_Details.dr_sub_account_id,Payment_Details.payment_amount,Payment_Details.cattle_feed,Payment_Details.mineral_mix,Payment_Details.pasu_posak,Payment_Details.insurance,Payment_Details.other,Payment_Details.other1,Payment_Details.narration,
                    Sub_Account.sub_account_name
                FROM Payment_Details
                INNER JOIN Sub_Account
                    ON Payment_Details.dr_sub_account_id = Sub_Account.sub_account_id
                WHERE Payment_Details.document_number = ?
                ORDER BY Payment_Details.voucher_serial_number ASC
            `;
            var docnum = parseInt(req.params.docnum);
            conncetion.query(sql, docnum, (err, results) => {
                conncetion.release();
                if (err) {
                    console.log(err);
                    res.send({ status: false });
                }
                else {
                    if (results.length > 0) {
                        res.send({
                            status: true,
                            data: results
                        });
                    }
                    else {
                        res.send({ status: false });
                    }
                }
            });
        }
    });
});

router.get('/jvdetails/:docnum', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, conncetion) => {
        if (err) {
            console.log(err);
            res.send({ status: false });
        }
        else {
            var sql = `
                SELECT
                    JV_Details.*,
                    Account_Head.account_name,
                    Sub_Account.sub_account_name
                FROM JV_Details
                INNER JOIN Account_Head
                    ON JV_Details.account_id = Account_Head.account_id
                INNER JOIN Sub_Account
                    ON JV_Details.sub_account_id = Sub_Account.sub_account_id
                WHERE JV_Details.document_number = ?
                ORDER BY JV_Details.jv_serial_number ASC
            `;
            var docnum = parseInt(req.params.docnum);
            conncetion.query(sql, docnum, (err, results) => {
                conncetion.release();
                if (err) {
                    console.log(err);
                    res.send({ status: false });
                }
                else {
                    if (results.length > 0) {
                        res.send({
                            status: true,
                            data: results
                        });
                    }
                    else {
                        res.send({ status: false });
                    }
                }
            });
        }
    });
});

router.get('/membername/:id', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, conncetion) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql = "SELECT sub_account_name FROM Sub_Account WHERE sub_account_id = ?";
            conncetion.query(sql, req.params.id, (err, results) => {
                conncetion.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    res.send({
                        status: true,
                        data: results[0]
                    });
                }
            });
        }
    });
});

router.get('/account_details/:id', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, conncetion) => {
        if (err) {
            console.log(err);
            res.send({ status: false });
        }
        else {
            var sql = `
                SELECT account_name FROM Account_Head WHERE account_id = ?;
                SELECT sub_account_id FROM Account_Balance WHERE account_id = ?;
            `;
            conncetion.query(sql, [req.params.id, req.params.id], (err, results) => {
                conncetion.release();
                if (err) {
                    console.log(err);
                    res.send({ status: false });
                }
                else {
                    if (results[0].length > 0) {
                        res.send({
                            status: true,
                            account_name: results[0][0].account_name,
                            sub_account_id: results[1]
                        });
                    }
                    else {
                        res.send({
                            status: false
                        });
                    }
                }
            });
        }
    });
});

module.exports = router;
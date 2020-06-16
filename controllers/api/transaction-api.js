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
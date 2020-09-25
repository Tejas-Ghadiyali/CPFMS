const express = require('express');
const router = express.Router();
const getConnection = require('../../../connection');
const middleware = require('../../auth/auth_middleware');
const reportGenerator = require('./report_generator_module');

// Listing Report

router.get('/accounthead', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var sql = `
                SET @count_accounthead:=0;
                SELECT
                    (@count_accounthead:=@count_accounthead+1) AS serial_number,
                    Account_Head.account_id,
                    Account_Head.account_name,
                    Account_Head.village_id,
                    Taluka.taluka_id,
                    District.district_id
                FROM Account_Head
                    INNER JOIN Village
                        ON Village.village_id = Account_Head.village_id
                    INNER JOIN Taluka
                        ON Taluka.taluka_id = Village.taluka_id
                    INNER JOIN District
                        ON District.district_id = Taluka.district_id
                ORDER BY Account_Head.account_id ASC;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var headers = ["Sr.No.", "Society ID", "Society Name", "Village", "Taluka", "District"];
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title: "Society List Report",
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            link.hostname = client_link.hostname;
                            //console.log("FINAL PDF LINK : ",link.href);
                            //var pdf_id = link.split('/').slice(-2)[0];
                            //console.log(pdf_id);
                            res.send({
                                status: true,
                                link: link.href
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/talukalistsummary', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var sql = `
                SET @count_taluka_list:=0;
                SELECT
                    (@count_taluka_list:=@count_taluka_list+1) AS serial_number,
                    X.taluka_id,
                    X.taluka_name,
                    X.account_id_count,
                    Y.sub_account_count,
                    X.district_id
                FROM
                    (
                        SELECT 
                            Taluka.*,
                            Count(DISTINCT Account_Balance.account_id) AS account_id_count
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                            INNER JOIN Village
                                ON Account_Head.village_id = Village.village_id
                            INNER JOIN Taluka
                                ON Village.taluka_id = Taluka.taluka_id
                        GROUP BY Taluka.taluka_id
                    ) AS X
                    INNER JOIN 
                        (
                            SELECT
                                Taluka.taluka_id,
                                Count(DISTINCT Account_Balance.sub_account_id) AS sub_account_count
                            FROM Account_Balance
                                INNER JOIN Account_Head
                                    ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                                INNER JOIN Village
                                    ON Account_Head.village_id = Village.village_id
                                INNER JOIN Taluka
                                    ON Village.taluka_id = Taluka.taluka_id
                            GROUP BY Taluka.taluka_id
                        ) AS Y
                    ON  X.taluka_id = Y.taluka_id;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var headers = ["Sr.No.", "Taluka ID", "Taluka Name", "No. of Societies", "No. of Members", "District ID"];
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title: "Taluka List Report",
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            link.hostname = client_link.hostname;
                            //var pdf_id = link.split('/').slice(-2)[0];
                            //console.log(pdf_id);
                            res.send({
                                status: true,
                                link
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/districtlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var sql = `
                SET @count_district_list:=0;
                SELECT
                    (@count_district_list:=@count_district_list+1) AS serial_number,
                    X.district_id,
                    X.district_name,
                    X.account_id_count,
                    Y.sub_account_count
                FROM
                    (
                        SELECT 
                            District.*,
                            Count(DISTINCT Account_Balance.account_id) AS account_id_count
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                            INNER JOIN Village
                                ON Account_Head.village_id = Village.village_id
                            INNER JOIN Taluka
                                ON Village.taluka_id = Taluka.taluka_id
                            INNER JOIN District
                                ON Taluka.district_id = District.district_id
                        GROUP BY District.district_id
                    ) AS X
                    INNER JOIN 
                        (
                            SELECT
                                District.district_id,
                                Count(DISTINCT Account_Balance.sub_account_id) AS sub_account_count
                            FROM Account_Balance
                                INNER JOIN Account_Head
                                    ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                                INNER JOIN Village
                                    ON Account_Head.village_id = Village.village_id
                                INNER JOIN Taluka
                                    ON Village.taluka_id = Taluka.taluka_id
                                INNER JOIN District
                                    ON Taluka.district_id = District.district_id
                            GROUP BY District.district_id
                        ) AS Y
                    ON  X.district_id = Y.district_id;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var headers = ["Sr.No.", "District ID", "District Name", "No. of Societies", "No. of Members"];
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title: "District List Report",
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            link.hostname = client_link.hostname;
                            //var pdf_id = link.split('/').slice(-2)[0];
                            //console.log(pdf_id);
                            res.send({
                                status: true,
                                link
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/receiptlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var sql = `
                SET @count_receipt_list:=0;
                SELECT
                    (@count_receipt_list:=@count_receipt_list+1) AS serial_number,
                    DATE_FORMAT(Receipt.receipt_date,'%d/%m/%Y') AS receipt_nice_date,
                    Receipt.document_number,
                    Receipt.receipt_number,
                    IF(Receipt.narration IS NULL OR Receipt.narration = '',Account_Head.account_name,CONCAT(Account_Head.account_name,"<br/>",Receipt.narration)),
                    Receipt.total_amount
                FROM Receipt
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Receipt.cr_account_id
                WHERE Receipt.receipt_date >= ? AND Receipt.receipt_date <= ?;
            `;
            connection.query(sql, [data.from_date, data.to_date], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var headers = ["Sr.No.", "Date", "Document No.", "Receipt No.", "Society Name / Narration", "Receipt Amount"];
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title: "Receipt List Report",
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            link.hostname = client_link.hostname;
                            //var pdf_id = link.split('/').slice(-2)[0];
                            //console.log(pdf_id);
                            res.send({
                                status: true,
                                link
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/paymentlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var sql = `
                SET @count_payment_list:=0;
                SELECT
                    (@count_payment_list:=@count_payment_list+1) AS serial_number,
                    DATE_FORMAT(Payment.voucher_date,'%d/%m/%Y') AS payment_nice_date,
                    Payment.document_number,
                    IF(Payment.narration IS NULL OR Payment.narration = '',Account_Head.account_name,CONCAT(Account_Head.account_name,"<br/>",Payment.narration)),
                    Payment.total_amount
                FROM Payment
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Payment.dr_account_id
                WHERE Payment.voucher_date >= ? AND Payment.voucher_date <= ?;
            `;
            connection.query(sql, [data.from_date, data.to_date], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var headers = ["Sr.No.", "Date", "Document No.", "Society Name / Narration", "Voucher Amount"];
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title: "Payment List Report",
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            link.hostname = client_link.hostname;
                            //var pdf_id = link.split('/').slice(-2)[0];
                            //console.log(pdf_id);
                            res.send({
                                status: true,
                                link
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
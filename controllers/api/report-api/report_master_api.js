const { query } = require('express');
const express = require('express');
const router = express.Router();
const getConnection = require('../../../connection');
const middleware = require('../../auth/auth_middleware');
const { route } = require('../../reports/report_master');
const reportGenerator = require('./report_generator_module');

// Listing Report

router.get('/accounthead', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
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
                    res.send({
                        status: false
                    });
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
            res.send({
                status: false
            });
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
                    res.send({
                        status: false
                    });
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
            res.send({
                status: false
            });
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
                    res.send({
                        status: false
                    });
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
            res.send({
                status: false
            });
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
                    res.send({
                        status: false
                    });
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
            res.send({
                status: false
            });
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
                    res.send({
                        status: false
                    });
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

router.get('/accountheaddetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, flag = false, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                if (data.show_balance == '1') {
                    flag = true;
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.resource_person_id,
                            Account_Balance.sub_account_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                            Account_Balance.cl_crdr,
                            Account_Balance.cl_balance
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id 
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
                else {
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.sub_account_id,
                            Account_Balance.resource_person_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
            }
            else {
                sql_arr = [data.account_id_list, data.from_date, data.to_date, data.account_id_list, data.from_date, data.to_date];
                if (data.show_balance == '1') {
                    flag = true;
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.resource_person_id,
                            Account_Balance.sub_account_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                            Account_Balance.cl_crdr,
                            Account_Balance.cl_balance
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id 
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
                else {
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.sub_account_id,
                            Account_Balance.resource_person_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var headers, summary_headers, datarows = [], summary = {},data_global_total;

                    if (flag == true) {
                        headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person", "Account Balance"];
                        summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members", "Total Balance"];
                        if (results[0].length <= 0) {
                            datarows = [];
                            summary = [];
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                        }
                        else {
                            var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry, total_balance = 0.00, curr_balance = 0.00, total_balance_arr = [], data_total_str = ``, data_total_crdr = '';

                            // DataRows Generation with balance
                            for (item of results[0]) {
                                new_id = item.account_id;
                                if (curr_id != new_id) {
                                    data_counter = 1;
                                    data_total_crdr = total_balance >= 0 ? "CR" : "DR";
                                    data_total_str = `
                                    <tr style="text-align: center;border-top: 2px solid black;border-bottom: 2px solid black;background-color: white;">
                                        <td></td>
                                        <td colspan="3"><strong>Total</strong></td>
                                        <td colspan="2"><strong>${Math.abs(total_balance).toLocaleString('en-IN') + " " + data_total_crdr}</strong></td>
                                    </tr>
                                `;
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total: data_total_str
                                    }
                                    datarows.push(entry);
                                    sub_title = item.account_id + " - " + item.account_name;
                                    curr_id = new_id;
                                    data_entry = [];
                                    total_balance_arr.push(total_balance);
                                    total_balance = 0.00;
                                }
                                curr_balance = item.cl_crdr.toUpperCase() == 'CR' ? parseFloat(item.cl_balance) : -1 * parseFloat(item.cl_balance);
                                total_balance += curr_balance;
                                single_entry = {
                                    snum: data_counter,
                                    mid: item.sub_account_id,
                                    mname: item.sub_account_name,
                                    jdate: item.join_date,
                                    rp: item.resource_person_id,
                                    abalance: parseFloat(item.cl_balance).toLocaleString('en-IN') + " " + item.cl_crdr
                                };
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                            data_total_crdr = total_balance >= 0 ? "CR" : "DR";
                            data_total_str = `
                                <tr style="text-align: center;border-top: 2px solid black;border-bottom: 2px solid black;background-color: white;">
                                    <td></td>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td colspan="2"><strong>${Math.abs(total_balance).toLocaleString('en-IN') + " " + data_total_crdr}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total: data_total_str
                            }
                            total_balance_arr.push(total_balance);
                            datarows.push(entry);

                            // Summary Generation with balance
                            var summary_counter = 0, total_balance_crdr, final_total_balance = 0.00, final_total_members = 0, final_total_balance_crdr;
                            summary.summary_headers = summary_headers;
                            summary.summary_len = summary_headers.length;
                            summary.summary_data = [];
                            for (item of results[1]) {
                                total_balance = total_balance_arr[summary_counter];
                                final_total_balance += total_balance;
                                total_balance_crdr = total_balance >= 0 ? "CR" : "DR";
                                summary_counter++;
                                entry = {
                                    snum: summary_counter,
                                    scode: item.account_id,
                                    sname: item.account_name,
                                    tm: item.total_members,
                                    tb: Math.abs(total_balance).toLocaleString('en-IN') + " " + total_balance_crdr
                                }
                                final_total_members += parseInt(entry.tm);
                                summary.summary_data.push(entry);
                            }
                            final_total_balance_crdr = final_total_balance >= 0 ? "CR" : "DR";
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td><strong>${final_total_members}</<strong></td>
                                    <td>${Math.abs(final_total_balance).toLocaleString('en-IN') + " " + final_total_balance_crdr}</td>
                                </tr>
                            `;
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                    <td><strong>Total Balance&nbsp;:&nbsp;&nbsp;${Math.abs(final_total_balance).toLocaleString('en-IN') + " " + final_total_balance_crdr}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    else {
                        headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
                        summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
                        if (results[0].length <= 0) {
                            datarows = [];
                            summary = [];
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                        }
                        else {
                            var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                            // DataRows Generation with balance
                            for (item of results[0]) {
                                new_id = item.account_id;
                                if (curr_id != new_id) {
                                    data_counter = 1;
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry
                                    }
                                    datarows.push(entry);
                                    sub_title = item.account_id + " - " + item.account_name;
                                    curr_id = new_id;
                                    data_entry = [];
                                }
                                single_entry = {
                                    snum: data_counter,
                                    mid: item.sub_account_id,
                                    mname: item.sub_account_name,
                                    jdate: item.join_date,
                                    rp: item.resource_person_id,
                                };
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                            entry = {
                                data_title: sub_title,
                                data: data_entry
                            }
                            datarows.push(entry);

                            // Summary Generation with balance
                            var summary_counter = 0, final_total_members = 0;
                            summary.summary_headers = summary_headers;
                            summary.summary_len = summary_headers.length;
                            summary.summary_data = [];
                            for (item of results[1]) {
                                summary_counter++;
                                entry = {
                                    snum: summary_counter,
                                    scode: item.account_id,
                                    sname: item.account_name,
                                    tm: item.total_members
                                }
                                final_total_members += parseInt(entry.tm);
                                summary.summary_data.push(entry);
                            }
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    var username = req.user.user_name;

                    var dataobject = {
                        headers,
                        data_global_total,
                        len: headers.length,
                        datarows,
                        report_title: "Society Detail Report",
                        date: sdate,
                        username
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    if (data.show_balance == '1') {
                        dataobject.sub_title_1 = "With Balance"
                    }
                    var template = "detail-report-main";
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

router.get('/cowcastdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.cowcast_id_list, data.from_date, data.to_date, data.cowcast_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.cow_cast_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.cow_cast_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var headers, summary_headers, datarows = [], summary = {}, data_global_total;
                    headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
                    summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td>><strong>${final_total_members}</<strong>></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;

                    var dataobject = {
                        headers,
                        data_global_total,
                        len: headers.length,
                        datarows,
                        report_title: "Cow Cast Wise Detail Report",
                        date: sdate,
                        username
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
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

router.get('/organizationdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.org_id_list, data.from_date, data.to_date, data.org_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.organization_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.organization_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var headers, summary_headers, datarows = [], summary = {}, data_global_total;
                    headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
                    summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        data_global_total,
                        len: headers.length,
                        datarows,
                        report_title: "Organization Wise Detail Report",
                        date: sdate,
                        username
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
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
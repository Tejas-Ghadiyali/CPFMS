const express = require('express');
const passport = require('passport');
const router = express.Router();
const getConnection = require('../../../connection');
const middleware = require('../../auth/auth_middleware');
const reportGenerator = require('./report_generator_module');

const beautifyDate = (date) => {
    var arr = date.split('-');
    if (arr[0].length == 1)
        arr[0] = "0" + arr[0];
    if (arr[1].length == 1)
        arr[1] = "0" + arr[1];
    var bdate = arr[2] + "/" + arr[1] + "/" + arr[0];
    return bdate;
}

const getFormatedDate = (date) => {
    var dd = date.getDate().toString();
    var mm = (date.getMonth() + 1).toString();
    var yyyy = (date.getFullYear()).toString();
    if (dd.length == 1)
        dd = "0" + dd;
    if (mm.length == 1)
        mm = "0" + mm;
    var date_str = dd + "/" + mm + "/" + yyyy;
    return date_str;
}

const _DAYS_CONST = 1000 * 3600 * 24;

const calculateDays = (date1, date2, st_date) => {
    if (date1.getTime() == date2.getTime())
        return 0;
    else if (date1.getTime() > date2.getTime())
        return calculateDays(date2, date1, st_date);
    else if (date1.getTime() >= st_date.getTime())
        return Math.floor((date2.getTime() - date1.getTime()) / _DAYS_CONST);
    else if (st_date.getTime() >= date2.getTime())
        return 0;
    else
        return Math.floor((date2.getTime() - st_date.getTime()) / _DAYS_CONST);
}

// Listing Report

router.get('/accounthead', middleware.loggedin_as_superuser, (req, res) => {
    var headers = ["Sr.No.", "Society ID", "Society Name", "Village", "Taluka", "District"];
    var report_title = "Society List Report";
    var settings = {
        header_text_align_right: [1, 2],
        text_align_right: [1, 2]
    };
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

                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        settings,
                        datarows: results[1],
                        report_title,
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/talukalistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var headers = ["Sr.No.", "Taluka ID", "Taluka Name", "No. of Societies", "No. of Members", "District ID"];
    var report_title = "Taluka List Report";
    var settings = {
        header_text_align_right: [1, 4, 5],
        text_align_right: [1, 4, 5]
    };
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
                    X.account_id_count AS sos,
                    Y.sub_account_count AS mem,
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

                    var sos_total = 0;
                    var mem_total = 0;

                    for (item of results[1]) {
                        sos_total += parseInt(item.sos);
                        mem_total += parseInt(item.mem);
                    }

                    var data_total = `
                        <tr style="background-color: grey">
                            <td></td>
                            <td style="text-align: center" colspan="2"><strong>Total</strong></td>
                            <td style="text-align: right"><strong>${sos_total}</strong></td>
                            <td style="text-align: right"><strong>${mem_total}</strong></td>
                            <td></td>
                        </tr>
                    `;

                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        data_total,
                        settings,
                        datarows: results[1],
                        report_title,
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/districtlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var headers = ["Sr.No.", "District ID", "District Name", "No. of Societies", "No. of Members"];
    var report_title = "District List Report";
    var settings = {
        header_text_align_right: [1, 4, 5],
        text_align_right: [1, 4, 5]
    };
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
                    X.account_id_count AS sos,
                    Y.sub_account_count AS mem
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

                    var sos_total = 0;
                    var mem_total = 0;

                    for (item of results[1]) {
                        sos_total += parseInt(item.sos);
                        mem_total += parseInt(item.mem);
                    }

                    var data_total = `
                        <tr style="background-color: grey">
                            <td></td>
                            <td style="text-align: center" colspan="2"><strong>Total</strong></td>
                            <td style="text-align: right"><strong>${sos_total}</strong></td>
                            <td style="text-align: right"><strong>${mem_total}</strong></td>
                        </tr>
                    `;

                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        data_total,
                        settings,
                        datarows: results[1],
                        report_title,
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/receiptlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var headers = ["Sr.No.", "Date", "Document No.", "Receipt No.", "Society Name / Narration", "Receipt Amount"];
    var report_title = "Receipt List Report";
    var settings = {
        header_text_align_right: [],
        header_text_align_center: [],
        text_align_right: [],
        text_align_center: []
    };
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
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title,
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/paymentlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var headers = ["Sr.No.", "Date", "Document No.", "Society Name / Narration", "Voucher Amount"];
    var report_title = "Payment List Report";
    var settings = {
        header_text_align_right: [],
        header_text_align_center: [],
        text_align_right: [],
        text_align_center: []
    };
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
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title,
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/rpsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var headers = ["Sr.No.", "RP ID", "RP Name", "Joint", "Cancel", "Death", "Net", "Heifer", "Calwing"];
    var settings = {
        header_text_align_right: [1, 4, 5, 6, 7, 8, 9],
        header_text_align_center: [2],
        text_align_right: [1, 4, 5, 6, 7, 8, 9],
        text_align_center: [2]
    };
    var report_title = "Resource Person Wise Summary Report";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT 
                        DISTINCT Account_Balance.resource_person_id AS rpid,
                        Resource_Person.resource_person_name,
                        (
                            SELECT COUNT(Account_Balance.join_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ) AS x,
                        (
                            SELECT COUNT(Account_Balance.cancel_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.cancel_date >= ? AND Account_Balance.cancel_date <= ?
                        ) AS y,
                        (
                            SELECT COUNT(Account_Balance.death_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ?
                        ) AS z,
                        (
                            SELECT COUNT(Account_Balance.heifer_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ?
                        ) AS a,
                        (
                            SELECT COUNT(Account_Balance.calwing_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ?
                        ) AS b
                    FROM Account_Balance
                        INNER JOIN Resource_Person
                            ON Resource_Person.resource_person_id = Account_Balance.resource_person_id
                    ORDER BY Account_Balance.resource_person_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.rp_id_list];
                sql = `
                    SELECT 
                        DISTINCT Account_Balance.resource_person_id AS rpid,
                        Resource_Person.resource_person_name,
                        (
                            SELECT COUNT(Account_Balance.join_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ) AS x,
                        (
                            SELECT COUNT(Account_Balance.cancel_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.cancel_date >= ? AND Account_Balance.cancel_date <= ?
                        ) AS y,
                        (
                            SELECT COUNT(Account_Balance.death_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ?
                        ) AS z,
                        (
                            SELECT COUNT(Account_Balance.heifer_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ?
                        ) AS a,
                        (
                            SELECT COUNT(Account_Balance.calwing_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ?
                        ) AS b
                    FROM Account_Balance
                        INNER JOIN Resource_Person
                            ON Resource_Person.resource_person_id = Account_Balance.resource_person_id
                    WHERE Account_Balance.resource_person_id IN (?)
                    ORDER BY Account_Balance.resource_person_id ASC;
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

                    var datarows = [], data_global_total;

                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var data_entry = [], single_entry, data_counter = 1, entry, net = 0, jtotal = 0, ctotal = 0, dtotal = 0, ntotal = 0, htotal = 0, caltotal = 0;

                        // DataRows Generation
                        for (item of results) {
                            net = parseInt(item.x) - (parseInt(item.y) + parseInt(item.z));
                            single_entry = {
                                snum: data_counter,
                                rpid: item.rpid,
                                rpname: item.resource_person_name,
                                join: item.x,
                                cancel: item.y,
                                death: item.z,
                                net,
                                hf: item.a,
                                cal: item.b
                            };
                            jtotal += parseInt(single_entry.join);
                            ctotal += parseInt(single_entry.cancel);
                            dtotal += parseInt(single_entry.death);
                            ntotal += net;
                            htotal += parseInt(single_entry.hf);
                            caltotal += parseInt(single_entry.cal);
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        var data_total = `
                            <tr style="background-color: gray;text-align: center;width:100%">
                                <td></td>
                                <td colspan="2"><strong>Total</strong></td>
                                <td><strong>${jtotal}</strong></td>
                                <td><strong>${ctotal}</strong></td>
                                <td><strong>${dtotal}</strong></td>
                                <td><strong>${ntotal}</strong></td>
                                <td><strong>${htotal}</strong></td>
                                <td><strong>${caltotal}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data: data_entry,
                            data_total
                        }
                        datarows.push(entry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    dataobject.datarows = datarows;
                    dataobject.data_global_total = data_global_total;
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

// Details Report

router.get('/accountheaddetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 6],
        header_text_align_center: [4],
        text_align_right: [1, 6],
        text_align_center: [4],
        summary_text_align_right: [1, 4, 5],
        summary_header_text_align_right: [1, 4, 5]
    };
    var headers;
    var summary_headers;
    var report_title = "Society-Member Detail Report";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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

                    var datarows = [], summary = {}, data_global_total;

                    if (flag == true) {
                        headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person", "Account Balance"];
                        summary_headers = ["Sr.No.", "Society ID", "Society Name", "Members", "Balance"];
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
                                        <td colspan="2" style="text-align: right;"><strong>${Math.abs(total_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " " + data_total_crdr}</strong></td>
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
                                    abalance: parseFloat(item.cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " " + item.cl_crdr
                                };
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                            data_total_crdr = total_balance >= 0 ? "CR" : "DR";
                            data_total_str = `
                                <tr style="text-align: center;border-top: 2px solid black;border-bottom: 2px solid black;background-color: white;">
                                    <td></td>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td colspan="2" style="text-align: right;"><strong>${Math.abs(total_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " " + data_total_crdr}</strong></td>
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
                                    tb: Math.abs(total_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " " + total_balance_crdr
                                }
                                final_total_members += parseInt(entry.tm);
                                summary.summary_data.push(entry);
                            }
                            final_total_balance_crdr = final_total_balance >= 0 ? "CR" : "DR";
                            summary.summary_total = `
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                    <td style="text-align: right;">${Math.abs(final_total_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " " + final_total_balance_crdr}</td>
                                </tr>
                            `;
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                    <td><strong>Total Balance&nbsp;:&nbsp;&nbsp;${Math.abs(final_total_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " " + final_total_balance_crdr}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    else {
                        headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
                        summary_headers = ["Sr.No.", "Society ID", "Society Name", "Members"];
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
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/cowcastdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1],
        header_text_align_center: [4, 5],
        text_align_right: [1],
        text_align_center: [4, 5],
        summary_header_text_align_right: [1, 4],
        summary_text_align_right: [1, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Cow Cast Wise Society Detail Report";
    var cow_cast_list;
    if (data.select_all == '1')
        cow_cast_list = 'All';
    else {
        if ("cowcast_id_list" in data) {
            if (typeof (data.cowcast_id_list) === 'string')
                cow_cast_list = data.cowcast_id_list
            else
                cow_cast_list = data.cowcast_id_list.join(', ');
        }
        else
            cow_cast_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Cow Cast</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${cow_cast_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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

                    var datarows = [], summary = {}, data_global_total;

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
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td style="text-align: center;" colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/organizationdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 5],
        header_text_align_center: [4],
        text_align_right: [1, 5],
        text_align_center: [4],
        summary_text_align_right: [1, 4],
        summary_header_text_align_right: [1, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Organization Wise Society Detail Report";
    var org_list;
    if (data.select_all == '1')
        org_list = 'All';
    else {
        if ("org_id_list" in data) {
            if (typeof (data.org_id_list) === 'string')
                org_list = data.org_id_list
            else
                org_list = data.org_id_list.join(', ');
        }
        else
            org_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Organization</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${org_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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

                    var datarows = [], summary = {}, data_global_total;

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
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/rpdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 4],
        header_text_align_center: [4],
        text_align_right: [1, 4],
        text_align_center: [4],
        summary_text_align_right: [1, 4, 5],
        summary_header_text_align_right: [1, 4, 5]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "RP ID"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Resource Person Wise Detail Report";
    var rp_list;
    if (data.select_all == '1')
        rp_list = 'All';
    else {
        if ("rp_id_list" in data) {
            if (typeof (data.rp_id_list) === 'string')
                rp_list = data.rp_id_list
            else
                rp_list = data.rp_id_list.join(', ');
        }
        else
            rp_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Resource Person</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${rp_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.rp_id_list, data.from_date, data.to_date, data.rp_id_list, data.from_date, data.to_date];
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
                    WHERE Account_Balance.resource_person_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.resource_person_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
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

                    var datarows = [], summary = {}, data_global_total;
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
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/insurancedetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 4, 5],
        header_text_align_right: [1, 4, 5],
        summary_text_align_right: [1, 4, 5],
        summary_header_text_align_right: [1, 4, 5]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Insurance Date", "Tag No.", "Next Due On"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Insurance Detail Report";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Insurance Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Insurance Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
            sql = `
                SELECT
                    Account_Balance.account_id,
                    Account_Head.account_name,
                    Account_Balance.sub_account_id,
                    Sub_Account.sub_account_name,
                    DATE_FORMAT(Account_Balance.insurance_date,'%d/%m/%Y') AS join_date,
                    IF(Account_Balance.insurance_tag_no IS NULL,"",Account_Balance.insurance_tag_no) AS tag_no,
                    DATE_FORMAT(Account_Balance.insurance_due_on_date,'%d/%m/%Y') AS due_date
                FROM Account_Balance
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Account_Balance.account_id
                    INNER JOIN Sub_Account
                        ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                WHERE Account_Balance.insurance_date >= ? AND Account_Balance.insurance_date <= ?
                ORDER BY Account_Balance.account_id ASC;
                SELECT
                    Account_Balance.account_id,
                    Account_Head.account_name,
                    Count(Account_Balance.sub_account_id) AS total_members
                FROM Account_Balance
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Account_Balance.account_id
                WHERE Account_Balance.insurance_date >= ? AND Account_Balance.insurance_date <= ?
                GROUP BY Account_Balance.account_id
                ORDER BY Account_Balance.account_id ASC;
            `;
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

                    var datarows = [], summary = {}, data_global_total;

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
                                tnum: item.tag_no,
                                rp: item.due_date
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
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/talukadetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2],
        header_text_align_right: [1, 2],
        text_align_center: [4],
        header_text_align_center: [4],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4],
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Taluka"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Taluka Wise Society Detail Report";
    var taluka_list;
    if (data.select_all == '1')
        taluka_list = 'All';
    else {
        if ("taluka_id_list" in data) {
            if (typeof (data.taluka_id_list) === 'string')
                taluka_list = data.taluka_id_list
            else
                taluka_list = data.taluka_id_list.join(', ');
        }
        else
            taluka_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Taluka</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${taluka_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                        Village.taluka_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
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
                sql_arr = [data.taluka_id_list, data.from_date, data.to_date, data.taluka_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Village.taluka_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.taluka_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.taluka_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
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

                    var datarows = [], summary = {}, data_global_total;
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
                                rp: item.taluka_id,
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
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td style="text-align: center;" colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/districtdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2],
        header_text_align_right: [1, 2],
        text_align_center: [4],
        header_text_align_center: [4],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4],
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "District"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "District Wise Society Detail Report";
    var district_list;
    if (data.select_all == '1')
        district_list = 'All';
    else {
        if ("district_id_list" in data) {
            if (typeof (data.district_id_list) === 'string')
                district_list = data.district_id_list
            else
                district_list = data.district_id_list.join(', ');
        }
        else
            district_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>District</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${district_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                        Taluka.district_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
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
                sql_arr = [data.district_id_list, data.from_date, data.to_date, data.district_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Taluka.district_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.district_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.district_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
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

                    var datarows = [], summary = {}, data_global_total;
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
                                rp: item.district_id,
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
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td style="text-align: center;" colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
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
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societybalancedetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 3, 4, 5, 6],
        header_text_align_right: [1, 3, 4, 5, 6],
        summary_text_align_right: [1, 2, 4, 5, 6, 7],
        summary_header_text_align_right: [1, 2, 4, 5, 6, 7]
    };
    var headers = ["Member ID", "Member Name", "Opening Balance", "Credit", "Debit", "Closing Balance"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Opening Balance", "Credit", "Debit", "Closing Balance"];
    var report_title = "Society Wise Periodical Balance Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Head.account_id AS aid
                    FROM Account_Head
                    WHERE Account_Head.is_society = 0;
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Balance.sub_account_id AS sid,
                        Account_Head.account_name AS aname,
                        Sub_Account.sub_account_name AS sname,
                        IF(
                            Account_Balance.op_crdr = "DR", 
                            -1*Account_Balance.op_balance,
                            Account_Balance.op_balance
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        Ledger.sub_account_id AS sid,
                        (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount)) AS op2
                    FROM Ledger
                        WHERE Ledger.transaction_date < ?
                        GROUP BY Ledger.account_id,Ledger.sub_account_id
                        ORDER BY Ledger.account_id ASC,Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        Ledger.sub_account_id AS sid,
                        IFNULL(SUM(Ledger.cr_amount),0) AS cr,
                        IFNULL(SUM(Ledger.dr_amount),0) AS dr
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                        GROUP BY Ledger.account_id, Ledger.sub_account_id
                        ORDER BY Ledger.account_id ASC, Ledger.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list, data.from_date, data.account_id_list, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Balance.sub_account_id AS sid,
                        Account_Head.account_name AS aname,
                        Sub_Account.sub_account_name AS sname,
                        IF(
                            Account_Balance.op_crdr = "DR", 
                            -1*Account_Balance.op_balance,
                            Account_Balance.op_balance
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Head.is_society = 1 AND Account_Head.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        Ledger.sub_account_id AS sid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.transaction_date < ? AND Ledger.account_id IN (?)
                        GROUP BY Ledger.account_id,Ledger.sub_account_id
                        ORDER BY Ledger.account_id ASC,Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        Ledger.sub_account_id AS sid,
                        IFNULL(SUM(Ledger.cr_amount),0) AS cr,
                        IFNULL(SUM(Ledger.dr_amount),0) AS dr
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.account_id IN (?)
                        GROUP BY Ledger.account_id, Ledger.sub_account_id
                        ORDER BY Ledger.account_id ASC, Ledger.sub_account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                //connection.release();
                //console.log("Query Completed!");
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    // console.log(results);
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    // console.log(results);
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var i = 0, j = 0, k = 0;
                        var item_op1, item_op2, item_ledger;
                        var main_op1 = [], main_op2 = [], ledger = [];

                        var data_entry = [], single_entry, sub_title, entry, s_op = 0.00, s_cr = 0.00, s_dr = 0.00, s_cl = 0.00, op = 0.00, cr = 0.00, dr = 0.00, cl = 0.00, data_total, s_op_global = 0.00, s_cr_global = 0.00, s_dr_global = 0.00, s_cl_global = 0.00, op_string, cl_string, last_aid, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        if (data.select_all == '1') {
                            var acc_list = results[0];
                            var non_sos = [];
                            var l;
                            for (l = 0; l < acc_list.length; l++)
                                non_sos.push(acc_list[l].aid);
                            main_op1 = results[1];
                            var main_op2_pre = results[2];
                            var ledger_pre = results[3];
                            for (j = 0; j < main_op2_pre.length; j++) {
                                item_op2 = main_op2_pre[j];
                                if (!non_sos.includes(item_op2.aid))
                                    main_op2.push(item_op2);
                            }
                            for (k = 0; k < ledger_pre.length; k++) {
                                item_ledger = ledger_pre[k];
                                if (!non_sos.includes(item_ledger.aid))
                                    ledger.push(item_ledger);
                            }
                            j = 0;
                            k = 0;
                        }
                        else {
                            main_op1 = results[0];
                            main_op2 = results[1];
                            ledger = results[2];
                        }
                        last_aid = main_op1[0].aid;
                        for (i = 0; i < main_op1.length; i++) {
                            item_op1 = main_op1[i];
                            /*
                            if (item_op1.aid == '0044') {
                                console.log("\n<=================================================>");
                                console.log(item_op1);
                                console.log(j, k);
                                console.log("-------------------------");
                                console.log(main_op2[j]);
                                console.log(main_op2[j + 1]);
                                console.log(main_op2[j + 2]);
                                console.log("-------------------------");
                                console.log(ledger[k]);
                                console.log(ledger[k + 1]);
                                console.log(ledger[k + 2]);
                                console.log("<=================================================>\n");
                            }
                            */
                            if (last_aid != item_op1.aid && data_entry.length > 0) {
                                console.log("Here!");
                                sub_title = last_aid + " - " + last_aname;
                                if (s_op >= 0) {
                                    op_string = Math.abs(s_op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR";
                                }
                                else {
                                    op_string = Math.abs(s_op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR";
                                }
                                if (s_cl >= 0) {
                                    cl_string = Math.abs(s_cl).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR";
                                }
                                else {
                                    cl_string = Math.abs(s_cl).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR";
                                }
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${op_string}</strong></td>
                                        <td style="text-align: right;"><strong>${s_cr.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${s_dr.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${cl_string}</strong></td>
                                    </tr>
                                `;
                                sentry = {
                                    snum: summary_counter,
                                    aid: last_aid,
                                    aname: last_aname,
                                    op: op_string,
                                    cr: s_cr.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: s_dr.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    cl: cl_string
                                };
                                if (data.show_zero == '0') {
                                    if (s_op != 0 || s_cr != 0 || s_dr != 0) {
                                        summary_counter++;
                                        summary.summary_data.push(sentry);
                                    }
                                }
                                else {
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                                s_op_global += parseFloat(s_op);
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                s_cl_global += parseFloat(s_cl);
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                                s_op = 0.00;
                                s_cr = 0.00;
                                s_dr = 0.00;
                                s_cl = 0.00;
                                data_entry = [];
                            }
                            if (k < ledger.length && ledger[k].sid == item_op1.sid && ledger[k].aid == item_op1.aid) {
                                item_ledger = ledger[k];
                                cr = parseFloat(item_ledger.cr);
                                dr = parseFloat(item_ledger.dr);
                                k++;
                            }
                            else {
                                cr = 0.00;
                                dr = 0.00;
                            }
                            if (j < main_op2.length && main_op2[j].sid == item_op1.sid && main_op2[j].aid == item_op1.aid) {
                                item_op2 = main_op2[j];
                                op2 = parseFloat(item_op2.op2);
                                j++;
                            }
                            else
                                op2 = 0.00;
                            op1 = parseFloat(item_op1.op1);
                            op = op1 + op2;
                            cl = parseFloat(op) + parseFloat(cr) - parseFloat(dr);
                            if (op >= 0) {
                                op_string = Math.abs(op).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                op_string = Math.abs(op).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            if (cl >= 0) {
                                cl_string = Math.abs(cl).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                cl_string = Math.abs(cl).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            single_entry = {
                                sid: item_op1.sid,
                                sname: item_op1.sname,
                                op: op_string,
                                cr: cr.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                dr: dr.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                cl: cl_string
                            };
                            s_op += parseFloat(op);
                            s_cr += parseFloat(cr);
                            s_dr += parseFloat(dr);
                            s_cl += parseFloat(cl);
                            if (data.show_zero == '0') {
                                if (op != 0 || cr != 0 || dr != 0) {
                                    last_aid = item_op1.aid;
                                    last_aname = item_op1.aname;
                                    data_entry.push(single_entry);
                                }
                            }
                            else {
                                last_aid = item_op1.aid;
                                last_aname = item_op1.aname;
                                data_entry.push(single_entry);
                            }
                        }
                        if (data_entry.length > 0) {
                            sub_title = last_aid + " - " + last_aname;
                            if (s_op >= 0) {
                                op_string = Math.abs(s_op).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                op_string = Math.abs(s_op).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            if (s_cl >= 0) {
                                cl_string = Math.abs(s_cl).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                cl_string = Math.abs(s_cl).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${op_string}</strong></td>
                                        <td style="text-align: right;"><strong>${s_cr.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                        <td style="text-align: right;"><strong>${s_dr.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                        <td style="text-align: right;"><strong>${cl_string}</strong></td>
                                    </tr>
                                `;
                            sentry = {
                                snum: summary_counter,
                                aid: last_aid,
                                aname: last_aname,
                                op: op_string,
                                cr: s_cr.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                dr: s_dr.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                cl: cl_string
                            };
                            if (data.show_zero == '0') {
                                if (s_op != 0 || s_cr != 0 || s_dr != 0) {
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                            }
                            else {
                                summary_counter++;
                                summary.summary_data.push(sentry);
                            }
                            s_op_global += parseFloat(s_op);
                            s_cr_global += parseFloat(s_cr);
                            s_dr_global += parseFloat(s_dr);
                            s_cl_global += parseFloat(s_cl);
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            };
                            datarows.push(entry);
                        }
                        var s_op_string, s_cl_string;
                        if (s_op_global >= 0) {
                            s_op_string = Math.abs(s_op_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            s_op_string = Math.abs(s_op_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        if (s_cl_global >= 0) {
                            s_cl_string = Math.abs(s_cl_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            s_cl_string = Math.abs(s_cl_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        // Summary Generation
                        summary.summary_total = `
                            <tr style="background-color: gray;">
                                <td colspan="3" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right;"><strong>${s_op_string}</strong></td>
                                <td style="text-align: right;"><strong>${s_cr_global.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_dr_global.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_cl_string}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societybalancedetailsondate', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 3, 4],
        header_text_align_right: [1, 3, 4],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Member ID", "Member Name", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Credit", "Debit"];
    var report_title = "Society Wise Balance Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>As on Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.to_date, data.to_date];
                sql = `
                    SELECT
                        Account_Head.account_id AS aid
                    FROM Account_Head
                    WHERE Account_Head.is_society = 0;
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        IF(
                            Account_Balance.op_crdr = "DR", 
                            -1*Account_Balance.op_balance,
                            Account_Balance.op_balance
                        ) AS op
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        Ledger.sub_account_id AS sid,
                        IFNULL(SUM(Ledger.cr_amount),0) AS cr,
                        IFNULL(SUM(Ledger.dr_amount),0) AS dr
                    FROM Ledger
                    WHERE Ledger.transaction_date <= ?
                    GROUP BY Ledger.account_id, Ledger.sub_account_id
                    ORDER BY Ledger.account_id ASC, Ledger.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        IF(
                            Account_Balance.op_crdr = "DR", 
                            -1*Account_Balance.op_balance,
                            Account_Balance.op_balance
                        ) AS op
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.account_id IN (?) AND Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        Ledger.sub_account_id AS sid,
                        IFNULL(SUM(Ledger.cr_amount),0) AS cr,
                        IFNULL(SUM(Ledger.dr_amount),0) AS dr
                    FROM Ledger
                    WHERE Ledger.transaction_date <= ? AND Ledger.account_id IN (?)
                    GROUP BY Ledger.account_id, Ledger.sub_account_id
                    ORDER BY Ledger.account_id ASC, Ledger.sub_account_id ASC;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"><strong>Grand Total</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var data_entry = [], single_entry, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, cl = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, last_aid, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var i = 0, j = 0;
                        var main_op = [], ledger = [];
                        var item_op, item_ledger;
                        var s_cl_net = 0.00;

                        if (data.select_all == '1') {
                            var acc_list = results[0];
                            var non_sos = [];
                            var l;
                            for (l = 0; l < acc_list.length; l++)
                                non_sos.push(acc_list[l].aid);
                            main_op = results[1];
                            var ledger_pre = results[2];
                            for (j = 0; j < ledger_pre.length; j++) {
                                item_ledger = ledger_pre[j];
                                if (!non_sos.includes(item_ledger.aid))
                                    ledger.push(item_ledger);
                            }
                            j = 0;
                        }
                        else {
                            main_op = results[0];
                            ledger = results[1];
                        }

                        //console.log(main_op.length,ledger.length);
                        //console.log(i,j);

                        //console.log(results[2][0]);

                        last_aid = main_op[0].aid;
                        for (i = 0; i < main_op.length; i++) {
                            item_op = main_op[i];
                            /*
                            if(item_op.aid == '0087' || item_op.aid == '0086') {
                                console.log("------------------------------------------------")
                                console.log(item_op);
                                console.log(j);
                                console.log(ledger[j]);
                                console.log(ledger[j+1]);
                                console.log(ledger[j+2]);
                                console.log("------------------------------------------------")
                            }
                            */
                            if (last_aid != item_op.aid && data_entry.length > 0) {
                                sub_title = last_aid + " - " + last_aname;
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                s_cl_net = s_cr + s_dr; // s_dr is already in negative
                                if (s_cl_net >= 0) {
                                    sentry = {
                                        snum: summary_counter,
                                        aid: last_aid,
                                        aname: last_aname,
                                        cr: Math.abs(s_cl_net).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: '0.00'
                                    };
                                }
                                else {
                                    sentry = {
                                        snum: summary_counter,
                                        aid: last_aid,
                                        aname: last_aname,
                                        cr: '0.00',
                                        dr: Math.abs(s_cl_net).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                }
                                if (data.show_zero == '0') {
                                    if (s_cr != 0 || s_dr != 0) {
                                        summary_counter++;
                                        summary.summary_data.push(sentry);
                                    }
                                }
                                else {
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                                s_cr = 0.00;
                                s_dr = 0.00;
                                data_entry = [];
                            }
                            if (j < ledger.length && ledger[j].sid == item_op.sid && ledger[j].aid == item_op.aid) {
                                item_ledger = ledger[j];
                                cr = parseFloat(item_ledger.cr);
                                dr = parseFloat(item_ledger.dr);
                                j++;
                            }
                            else {
                                cr = 0.00;
                                dr = 0.00;
                            }
                            op = item_op.op;
                            cl = parseFloat(op) + parseFloat(cr) - parseFloat(dr);
                            if (cl > 0) {
                                single_entry = {
                                    mid: item_op.sid,
                                    mname: item_op.sname,
                                    cr: Math.abs(cl).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += parseFloat(cl);
                                last_aid = item_op.aid;
                                last_aname = item_op.aname;
                                data_entry.push(single_entry);
                            }
                            else if (cl < 0) {
                                single_entry = {
                                    mid: item_op.sid,
                                    mname: item_op.sname,
                                    cr: ' ',
                                    dr: Math.abs(cl).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += parseFloat(cl);
                                last_aid = item_op.aid;
                                last_aname = item_op.aname;
                                data_entry.push(single_entry);
                            }
                            else {
                                if (data.show_zero == '1') {
                                    single_entry = {
                                        mid: item_op.sid,
                                        mname: item_op.sname,
                                        cr: '0.00',
                                        dr: ' '
                                    };
                                    last_aid = item_op.aid;
                                    last_aname = item_op.aname;
                                    data_entry.push(single_entry);
                                }
                            }
                        }
                        if (data_entry.length > 0) {
                            sub_title = last_aid + " - " + last_aname;
                            s_cl_net = s_cr + s_dr; // s_dr is already in negative
                            if (s_cl_net >= 0) {
                                sentry = {
                                    snum: summary_counter,
                                    aid: last_aid,
                                    aname: last_aname,
                                    cr: Math.abs(s_cl_net).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: '0.00'
                                };
                            }
                            else {
                                sentry = {
                                    snum: summary_counter,
                                    aid: last_aid,
                                    aname: last_aname,
                                    cr: '0.00',
                                    dr: Math.abs(s_cl_net).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                            }
                            if (data.show_zero == '0') {
                                if (s_cr != 0 || s_dr != 0) {
                                    summary.summary_data.push(sentry);
                                }
                            }
                            else {
                                summary.summary_data.push(sentry);
                            }
                            s_cr_global += parseFloat(s_cr);
                            s_dr_global += parseFloat(s_dr);
                            data_total = `
                                <tr style="background-color: silver;">
                                    <td colspan="2"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="height: 20px !important;background-color: #FFFFFF;">
                                    <td colspan="7"></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            }
                            datarows.push(entry);
                        }
                        else {
                            data_total = `
                                <tr style="height: 20px !important;background-color: #FFFFFF;">
                                    <td colspan="7"></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_total
                            }
                            datarows.push(entry);
                        }
                        // Summary Generation
                        var net_balance = Math.abs(parseFloat(s_cr_global)) - Math.abs(parseFloat(s_dr_global));
                        if (net_balance >= 0) {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td></td>
                                </tr>
                            `;
                        }
                        else {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                        }
                        /*
                        summary.summary_total = `
                            <tr style="background-color: gray;">
                                <td colspan="3" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        */
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societyledger', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    if (!("select_all" in data))
        data.select_all = '0';
    var settings = {
        text_align_right: [3, 4],
        text_align_center: [1],
        header_text_align_right: [3, 4],
        header_text_align_center: [1],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Date", "Narration", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Credit", "Debit"];
    var report_title = "Society Ledger";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Head.account_id AS aid
                    FROM Account_Head
                    WHERE Account_Head.is_society = 0;
                    SELECT
                        DISTINCT Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        SUM(
                            IF(
                                Account_Balance.op_crdr = "DR", 
                                -1*Account_Balance.op_balance,
                                Account_Balance.op_balance
                            ) 
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Head.is_society = 1
                    GROUP BY Account_Balance.account_id;
                    SELECT
                        Ledger.account_id AS aid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.transaction_date < ?
                        GROUP BY Ledger.account_id
                        ORDER BY Ledger.account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        IFNULL(SUM(Ledger.cr_amount),0) AS cr,
                        IFNULL(SUM(Ledger.dr_amount),0) AS dr,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                        GROUP BY Ledger.tc, Ledger.document_number
                        ORDER BY Ledger.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list, data.account_id_list, data.from_date, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        SUM(
                            IF(
                                Account_Balance.op_crdr = "DR", 
                                -1*Account_Balance.op_balance,
                                Account_Balance.op_balance
                            ) 
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Head.is_society = 1 AND Account_Head.account_id IN (?)
                    GROUP BY Account_Balance.account_id;
                    SELECT
                        Ledger.account_id AS aid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.account_id IN (?) AND Ledger.transaction_date < ?
                        GROUP BY Ledger.account_id
                        ORDER BY Ledger.account_id ASC;
                    SELECT
                        Ledger.account_id AS aid,
                        IFNULL(SUM(Ledger.cr_amount),0) AS cr,
                        IFNULL(SUM(Ledger.dr_amount),0) AS dr,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.account_id IN (?)
                        GROUP BY Ledger.tc, Ledger.document_number
                        ORDER BY Ledger.account_id ASC;
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
                    // console.log(results[1]);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, cl_balance = 0.00, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        // Opening Entry
                        var fr_date_arr = data.from_date.split('-');
                        var fr_date = fr_date_arr[2] + "/" + fr_date_arr[1] + "/" + fr_date_arr[0];
                        var to_date_arr = data.to_date.split('-');
                        var to_date = to_date_arr[2] + "/" + to_date_arr[1] + "/" + to_date_arr[0];
                        op = (parseFloat(results[0].op1) + parseFloat(results[0].op2)) || 0.00;
                        last_aname = results[0].aname;

                        var i = 0, j = 0;
                        var main_op1 = [], main_op2 = [], ledger = [];
                        var item_op1, item_op2, item_ledger;

                        if (data.select_all == '1') {
                            var acc_list = results[0];
                            var non_sos = [];
                            var l;
                            for (l = 0; l < acc_list.length; l++)
                                non_sos.push(acc_list[l].aid);
                            main_op1 = results[1];
                            var main_op2_pre = results[2];
                            var ledger_pre = results[3];
                            for (i = 0; i < main_op2_pre.length; i++) {
                                item_op2 = main_op2_pre[i];
                                if (!non_sos.includes(item_op2.aid))
                                    main_op2.push(item_op2);
                            }
                            for (j = 0; j < ledger_pre.length; j++) {
                                item_ledger = ledger_pre[j];
                                if (!non_sos.includes(item_ledger.aid))
                                    ledger.push(item_ledger);
                            }
                            i = 0;
                            j = 0;
                        }
                        else {
                            main_op1 = results[0];
                            main_op2 = results[1];
                            ledger = results[2];
                        }

                        for (item_op1 of main_op1) {
                            data_entry = [];
                            s_cr = 0.00;
                            s_dr = 0.00;

                            sub_title = item_op1.aid + " - " + item_op1.aname;

                            if (i < main_op2.length && main_op2[i].aid == item_op1.aid) {
                                op2 = main_op2[i].op2;
                                i++;
                            }
                            else
                                op2 = 0.00;

                            // console.log(item_op1.aid);
                            // console.log(item_op1.op1);
                            // console.log(op2);
                            op = (parseFloat(item_op1.op1) + parseFloat(op2)) || 0.00;

                            if (op >= 0) {
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += Math.abs(parseFloat(op));
                            }
                            else {
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: ' ',
                                    dr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += Math.abs(parseFloat(op));
                            }
                            data_entry.push(single_entry);

                            while (j < ledger.length && ledger[j].aid == item_op1.aid) {
                                item_ledger = ledger[j];
                                cr = Math.abs(parseFloat(item_ledger.cr)) || 0.00;
                                dr = Math.abs(parseFloat(item_ledger.dr)) || 0.00;
                                if (dr > 0) {
                                    single_entry = {
                                        date: item_ledger.tc_date,
                                        narration: item_ledger.narration,
                                        cr: ' ',
                                        dr: Math.abs(dr).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    s_dr += dr;
                                }
                                else {
                                    single_entry = {
                                        date: item_ledger.tc_date,
                                        narration: item_ledger.narration,
                                        cr: Math.abs(cr).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: ' '
                                    };
                                    s_cr += cr;
                                }
                                data_entry.push(single_entry);
                                j++;
                                //last_aname = item.aname;
                            }
                            cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                            if (cl_balance >= 0) {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: ' ',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + ' CR'
                                }
                                s_dr += Math.abs(parseFloat(cl_balance));
                                sentry = {
                                    snum: summary_counter,
                                    aid: item_op1.aid,
                                    aname: item_op1.aname,
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ''
                                };
                                s_cr_global += parseFloat(Math.abs(cl_balance));
                            }
                            else {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + ' DR',
                                    dr: ' '
                                }
                                s_cr += Math.abs(parseFloat(cl_balance));
                                sentry = {
                                    snum: summary_counter,
                                    aid: item_op1.aid,
                                    aname: item_op1.aname,
                                    cr: '',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr_global += parseFloat(Math.abs(cl_balance));
                            }
                            data_entry.push(single_entry);
                            data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    </tr>
                                `;
                            summary_counter++;
                            summary.summary_data.push(sentry);
                            if (data_entry.length > 0) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                            }
                        }

                        // Summary Generation
                        var net_balance = parseFloat(s_cr_global) - parseFloat(s_dr_global);
                        if (net_balance >= 0) {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td></td>
                                </tr>
                            `;
                        }
                        else {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/memberledger', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [3, 4],
        text_align_center: [1],
        header_text_align_right: [3, 4],
        header_text_align_center: [1],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Date", "Narration", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Member ID", "Member Name", "Credit", "Debit"];
    var report_title = "Member Ledger";
    var mem_led_list;
    if (data.select_all == '1')
        mem_led_list = 'All';
    else {
        if ("sub_account_id_list" in data) {
            if (typeof (data.sub_account_id_list) === 'string')
                mem_led_list = data.sub_account_id_list
            else
                mem_led_list = data.sub_account_id_list.join(', ');
        }
        else
            mem_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Member</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${mem_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Head.account_id AS aid
                    FROM Account_Head
                    WHERE Account_Head.is_society = 0;
                    SELECT
                        DISTINCT Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        SUM(
                            IF(
                                Account_Balance.op_crdr = "DR", 
                                -1*Account_Balance.op_balance,
                                Account_Balance.op_balance
                            ) 
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    GROUP BY Account_Balance.sub_account_id;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.transaction_date < ?
                        GROUP BY Ledger.sub_account_id
                        ORDER BY Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                        ORDER BY Ledger.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.sub_account_id_list, data.sub_account_id_list, data.from_date, data.from_date, data.to_date, data.sub_account_id_list];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        SUM(
                            IF(
                                Account_Balance.op_crdr = "DR", 
                                -1*Account_Balance.op_balance,
                                Account_Balance.op_balance
                            ) 
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Sub_Account.sub_account_id IN (?)
                    GROUP BY Account_Balance.sub_account_id;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.sub_account_id IN (?) AND Ledger.transaction_date < ?
                        GROUP BY Ledger.sub_account_id
                        ORDER BY Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.sub_account_id IN (?)
                        ORDER BY Ledger.sub_account_id ASC;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, cl_balance = 0.00, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        // Opening Entry
                        var fr_date_arr = data.from_date.split('-');
                        var fr_date = fr_date_arr[2] + "/" + fr_date_arr[1] + "/" + fr_date_arr[0];
                        var to_date_arr = data.to_date.split('-');
                        var to_date = to_date_arr[2] + "/" + to_date_arr[1] + "/" + to_date_arr[0];
                        op = (parseFloat(results[0].op1) + parseFloat(results[0].op2)) || 0.00;
                        last_aname = results[0].aname;

                        var i = 0, j = 0;
                        var main_op1 = [], main_op2 = [], ledger = [];
                        var item_op1, item_op2, item_ledger;

                        if (data.select_all == '1') {
                            var acc_list = results[0];
                            var non_sos = [];
                            var l;
                            for (l = 0; l < acc_list.length; l++)
                                non_sos.push(acc_list[l].aid);
                            main_op1 = results[1];
                            var main_op2_pre = results[2];
                            var ledger_pre = results[3];
                            for (i = 0; i < main_op2_pre.length; i++) {
                                item_op2 = main_op2_pre[i];
                                if (!non_sos.includes(item_op2.aid))
                                    main_op2.push(item_op2);
                            }
                            for (j = 0; j < ledger_pre.length; j++) {
                                item_ledger = ledger_pre[j];
                                if (!non_sos.includes(item_ledger.aid))
                                    ledger.push(item_ledger);
                            }
                            i = 0;
                            j = 0;
                        }
                        else {
                            main_op1 = results[0];
                            main_op2 = results[1];
                            ledger = results[2];
                        }

                        for (item_op1 of main_op1) {
                            data_entry = [];
                            s_cr = 0.00;
                            s_dr = 0.00;

                            sub_title = item_op1.aid + " - " + item_op1.aname;

                            if (i < main_op2.length && main_op2[i].aid == item_op1.aid) {
                                op2 = main_op2[i].op2;
                                i++;
                            }
                            else
                                op2 = 0.00;

                            op = (parseFloat(item_op1.op1) + parseFloat(op2)) || 0.00;

                            if (op >= 0) {
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += Math.abs(parseFloat(op));
                            }
                            else {
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: ' ',
                                    dr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += Math.abs(parseFloat(op));
                            }
                            data_entry.push(single_entry);

                            while (j < ledger.length && ledger[j].aid == item_op1.aid) {
                                item_ledger = ledger[j];
                                cr = Math.abs(parseFloat(item_ledger.cr)) || 0.00;
                                dr = Math.abs(parseFloat(item_ledger.dr)) || 0.00;
                                if (dr > 0) {
                                    single_entry = {
                                        date: item_ledger.tc_date,
                                        narration: item_ledger.narration,
                                        cr: ' ',
                                        dr: Math.abs(dr).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    s_dr += dr;
                                }
                                else {
                                    single_entry = {
                                        date: item_ledger.tc_date,
                                        narration: item_ledger.narration,
                                        cr: Math.abs(cr).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: ' '
                                    };
                                    s_cr += cr;
                                }
                                data_entry.push(single_entry);
                                j++;
                                //last_aname = item.aname;
                            }
                            cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                            if (cl_balance >= 0) {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: ' ',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + ' CR'
                                }
                                s_dr += Math.abs(parseFloat(cl_balance));
                                sentry = {
                                    snum: summary_counter,
                                    aid: item_op1.aid,
                                    aname: item_op1.aname,
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ''
                                };
                                s_cr_global += parseFloat(Math.abs(cl_balance));
                            }
                            else {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + ' DR',
                                    dr: ' '
                                }
                                s_cr += Math.abs(parseFloat(cl_balance));
                                sentry = {
                                    snum: summary_counter,
                                    aid: item_op1.aid,
                                    aname: item_op1.aname,
                                    cr: '',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr_global += parseFloat(Math.abs(cl_balance));
                            }
                            data_entry.push(single_entry);
                            data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    </tr>
                                `;
                            summary_counter++;
                            summary.summary_data.push(sentry);
                            if (data_entry.length > 0) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                            }
                        }

                        // Summary Generation
                        var net_balance = parseFloat(s_cr_global) - parseFloat(s_dr_global);
                        if (net_balance >= 0) {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td></td>
                                </tr>
                            `;
                        }
                        else {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisememberledger', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [3, 4],
        text_align_center: [1],
        header_text_align_right: [3, 4],
        header_text_align_center: [1],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Date", "Narration", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Member ID", "Member Name", "CR", "DR"];
    var report_title = "Society Wise Member Account Ledger Report";
    var mem_led_list, soc_led_list;
    if (data.select_all == '1')
        mem_led_list = 'All';
    else {
        if ("sub_account_id_list" in data) {
            if (typeof (data.sub_account_id_list) === 'string')
                mem_led_list = data.sub_account_id_list
            else
                mem_led_list = data.sub_account_id_list.join(', ');
        }
        else
            mem_led_list = 'None';
    }
    if ("account_id_list" in data) {
        if (typeof (data.account_id_list) === 'string')
            soc_led_list = data.account_id_list
        else
            soc_led_list = data.account_id_list.join(', ');
    }
    else
        soc_led_list = 'None';
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Member</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${mem_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.account_id_list, data.from_date, data.account_id_list, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        SUM(
                            IF(
                                Account_Balance.op_crdr = "DR", 
                                -1*Account_Balance.op_balance,
                                Account_Balance.op_balance
                            ) 
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.account_id = ?
                    GROUP BY Account_Balance.sub_account_id;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.transaction_date < ? AND Ledger.account_id = ?
                        GROUP BY Ledger.sub_account_id
                        ORDER BY Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.account_id = ?
                        ORDER BY Ledger.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list, data.sub_account_id_list, data.account_id_list, data.sub_account_id_list, data.from_date, data.from_date, data.to_date, data.account_id_list, data.sub_account_id_list];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        SUM(
                            IF(
                                Account_Balance.op_crdr = "DR", 
                                -1*Account_Balance.op_balance,
                                Account_Balance.op_balance
                            ) 
                        ) AS op1
                    FROM Account_Balance
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.account_id = ? AND Sub_Account.sub_account_id IN (?)
                    GROUP BY Account_Balance.sub_account_id;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        (IFNULL(SUM(Ledger.cr_amount),0) - IFNULL(SUM(Ledger.dr_amount),0)) AS op2
                    FROM Ledger
                        WHERE Ledger.account_id = ? AND Ledger.sub_account_id IN (?) AND Ledger.transaction_date < ?
                        GROUP BY Ledger.sub_account_id
                        ORDER BY Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS aid,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.account_id = ? AND Ledger.sub_account_id IN (?)
                        ORDER BY Ledger.sub_account_id ASC;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, cl_balance = 0.00, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        // Opening Entry
                        var fr_date_arr = data.from_date.split('-');
                        var fr_date = fr_date_arr[2] + "/" + fr_date_arr[1] + "/" + fr_date_arr[0];
                        var to_date_arr = data.to_date.split('-');
                        var to_date = to_date_arr[2] + "/" + to_date_arr[1] + "/" + to_date_arr[0];
                        op = (parseFloat(results[0].op1) + parseFloat(results[0].op2)) || 0.00;
                        last_aname = results[0].aname;

                        var i = 0, j = 0;
                        var main_op1 = [], main_op2 = [], ledger = [];
                        var item_op1, item_ledger;

                        main_op1 = results[0];
                        main_op2 = results[1];
                        ledger = results[2];

                        for (item_op1 of main_op1) {
                            data_entry = [];
                            s_cr = 0.00;
                            s_dr = 0.00;

                            sub_title = item_op1.aid + " - " + item_op1.aname;

                            if (i < main_op2.length && main_op2[i].aid == item_op1.aid) {
                                op2 = main_op2[i].op2;
                                i++;
                            }
                            else
                                op2 = 0.00;

                            op = (parseFloat(item_op1.op1) + parseFloat(op2)) || 0.00;

                            if (op >= 0) {
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += Math.abs(parseFloat(op));
                            }
                            else {
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: ' ',
                                    dr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += Math.abs(parseFloat(op));
                            }
                            data_entry.push(single_entry);

                            while (j < ledger.length && ledger[j].aid == item_op1.aid) {
                                item_ledger = ledger[j];
                                cr = Math.abs(parseFloat(item_ledger.cr)) || 0.00;
                                dr = Math.abs(parseFloat(item_ledger.dr)) || 0.00;
                                if (dr > 0) {
                                    single_entry = {
                                        date: item_ledger.tc_date,
                                        narration: item_ledger.narration,
                                        cr: ' ',
                                        dr: Math.abs(dr).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    s_dr += dr;
                                }
                                else {
                                    single_entry = {
                                        date: item_ledger.tc_date,
                                        narration: item_ledger.narration,
                                        cr: Math.abs(cr).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: ' '
                                    };
                                    s_cr += cr;
                                }
                                data_entry.push(single_entry);
                                j++;
                                //last_aname = item.aname;
                            }
                            cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                            if (cl_balance >= 0) {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: ' ',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + ' CR'
                                }
                                s_dr += Math.abs(parseFloat(cl_balance));
                                sentry = {
                                    snum: summary_counter,
                                    aid: item_op1.aid,
                                    aname: item_op1.aname,
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ''
                                };
                                s_cr_global += parseFloat(Math.abs(cl_balance));
                            }
                            else {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + ' DR',
                                    dr: ' '
                                }
                                s_cr += Math.abs(parseFloat(cl_balance));
                                sentry = {
                                    snum: summary_counter,
                                    aid: item_op1.aid,
                                    aname: item_op1.aname,
                                    cr: '',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr_global += parseFloat(Math.abs(cl_balance));
                            }
                            data_entry.push(single_entry);
                            data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    </tr>
                                `;
                            summary_counter++;
                            summary.summary_data.push(sentry);
                            if (data_entry.length > 0) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                            }
                        }

                        // Summary Generation
                        var net_balance = parseFloat(s_cr_global) - parseFloat(s_dr_global);
                        if (net_balance >= 0) {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td></td>
                                </tr>
                            `;
                        }
                        else {
                            summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td colspan="3"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                                <tr style="background-color: white">
                                    <td></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td style="text-align: right;"><strong>${Math.abs(net_balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisecalwingage', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2, 6],
        text_align_center: [4, 5],
        header_text_align_right: [1, 2, 6],
        header_text_align_center: [4, 5],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Birth Date", "Calwing Date", "Age(days)"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Average Age(days)"];
    var report_title = "Society Wise Member Calwing Age Report";
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Calwing Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Calwing Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.birth_date,'%d/%m/%Y') AS bdate,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS cdate,
                        Account_Balance.birth_date AS bcaldate,
                        Account_Balance.calwing_date AS ccaldate
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.birth_date IS NOT NULL AND Account_Balance.calwing_date IS NOT NULL AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC, Account_Balance.birth_date ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.birth_date,'%d/%m/%Y') AS bdate,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS cdate,
                        Account_Balance.birth_date AS bcaldate,
                        Account_Balance.calwing_date AS ccaldate
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.birth_date IS NOT NULL AND Account_Balance.calwing_date IS NOT NULL AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ? AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC, Account_Balance.birth_date ASC;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, days = 0, diff, total_days = 0, avg, data_total, lname;
                        var summary_counter = 1, sentry, date1, date2;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                if (data_counter != 0) {
                                    avg = parseFloat(total_days) / parseFloat(data_counter - 1);
                                }
                                else {
                                    avg = 0;
                                }
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td></td>
                                        <td colspan="3"><strong>Average Calwing Period For Whole Society(in Days)</strong></td>
                                        <td colspan="2" style="text-align: right"><strong>${avg.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                                sentry = {
                                    snum: summary_counter,
                                    sid: curr_id,
                                    sname: lname,
                                    age: avg.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                summary_counter++;
                                summary.summary_data.push(sentry);
                                data_entry = [];
                                data_counter = 1;
                                total_days = 0;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            date1 = new Date(item.bcaldate);
                            date2 = new Date(item.ccaldate);
                            diff = date2.getTime() - date1.getTime();
                            days = diff / (1000 * 3600 * 24) + 1;
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                bdate: item.bdate,
                                cdate: item.cdate,
                                age: days.toLocaleString("en-IN")
                            };
                            lname = item.aname;
                            total_days += days;
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        avg = parseFloat(total_days) / parseFloat(data_counter - 1);
                        data_total = `
                            <tr style="text-align: center;background-color: silver;">
                                <td></td>
                                <td colspan="3"><strong>Average Calwing Period For Whole Society(in Days)</strong></td>
                                <td colspan="2" style="text-align: right"><strong>${avg.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data_title: sub_title,
                            data: data_entry,
                            data_total
                        };
                        datarows.push(entry);
                        sentry = {
                            snum: summary_counter,
                            sid: curr_id,
                            sname: lname,
                            age: avg.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                        };
                        summary.summary_data.push(sentry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisecalwinganalysis', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2, 7],
        text_align_center: [4, 5, 6],
        header_text_align_right: [1, 2, 7],
        header_text_align_center: [4, 5, 6],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Calwing Date", "Cancel Date", "Death Date", "Closing Balance"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Closing Balance"];
    var report_title = "Society Wise Member Calwing Analysis Report";
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS caldate,
                        DATE_FORMAT(Account_Balance.cancel_date,'%d/%m/%Y') AS candate,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS deathdate,
                        IF(Account_Balance.cl_crdr = "DR", -1*Account_Balance.cl_balance, Account_Balance.cl_balance) AS cl
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Head.is_society = '1'
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS caldate,
                        DATE_FORMAT(Account_Balance.cancel_date,'%d/%m/%Y') AS candate,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS deathdate,
                        IF(Account_Balance.cl_crdr = "DR", -1*Account_Balance.cl_balance, Account_Balance.cl_balance) AS cl
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Head.is_society = '1' AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, data_total, lname, s_cl_balance, cl_total = 0.00, cl_global = 0.00, s_cl_total, s_cl_global;
                        var summary_counter = 1, sentry, date1, date2;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                if (cl_total >= 0) {
                                    s_cl_total = Math.abs(cl_total).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR";
                                    data_total = `
                                        <tr style="text-align: center;background-color: silver;">
                                            <td></td>
                                            <td colspan="2"><strong>Net Balance</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                        </tr>
                                    `;
                                }
                                else {
                                    s_cl_total = Math.abs(cl_total).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR";
                                    data_total = `
                                        <tr style="text-align: center;background-color: silver;">
                                            <td></td>
                                            <td colspan="2"><strong>Net Balance</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                        </tr>
                                    `;
                                }
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                    sentry = {
                                        snum: summary_counter,
                                        sid: curr_id,
                                        sname: lname,
                                        cl_total: s_cl_total
                                    };
                                    cl_global = parseFloat(cl_global) + parseFloat(cl_total);
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                                data_entry = [];
                                data_counter = 1;
                                cl_total = 0.00;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            if (item.cl >= 0) {
                                s_cl_balance = Math.abs(item.cl).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                s_cl_balance = Math.abs(item.cl).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                caldate: item.caldate,
                                candate: item.candate,
                                deathdate: item.deathdate,
                                cl_balance: s_cl_balance
                            };
                            if (data.show_zero == '0') {
                                if (item.cl != 0) {
                                    lname = item.aname;
                                    cl_total = parseFloat(cl_total) + parseFloat(item.cl);
                                    data_entry.push(single_entry);
                                    data_counter++;
                                }
                            }
                            else {
                                lname = item.aname;
                                cl_total = parseFloat(cl_total) + parseFloat(item.cl);
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                        }
                        if (cl_total >= 0) {
                            s_cl_total = Math.abs(cl_total).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                            data_total = `
                                <tr style="background-color: silver;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                </tr>
                            `;
                        }
                        else {
                            s_cl_total = Math.abs(cl_total).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                            data_total = `
                                <tr style="text-align: center;background-color: silver;">
                                    <td></td>
                                    <td colspan="2"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                </tr>
                            `;
                        }
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            };
                            datarows.push(entry);
                            sentry = {
                                snum: summary_counter,
                                sid: curr_id,
                                sname: lname,
                                cl_total: s_cl_total
                            };
                            cl_global = parseFloat(cl_global) + parseFloat(cl_total);
                            summary_counter++;
                            summary.summary_data.push(sentry);
                        }
                        if (cl_global >= 0) {
                            s_cl_global = Math.abs(cl_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            s_cl_global = Math.abs(cl_global).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        summary.summary_total = `
                            <tr style="background-color: silver;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                <td style="text-align: right"><strong>${s_cl_global}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywiseheiferdate', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2],
        text_align_center: [4],
        header_text_align_right: [1, 2],
        header_text_align_center: [4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Heifer Date"];
    var report_title = "Society-Member Heifer Datewise Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Heifer Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Heifer Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.heifer_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.heifer_date IS NOT NULL AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.heifer_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        LEFT JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        LEFT JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.heifer_date IS NOT NULL AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ? AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
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

                    var datarows = [];
                    if (results.length <= 0) {
                        datarows = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, lname;

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                };
                                datarows.push(entry);
                                data_entry = [];
                                data_counter = 1;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                hdate: item.hdate
                            };
                            lname = item.aname;
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        };
                        datarows.push(entry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisedeathdate', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2],
        text_align_center: [4],
        header_text_align_right: [1, 2],
        header_text_align_center: [4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Death Date"];
    var report_title = "Society-Member Death Datewise Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Death Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Death Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.death_date IS NOT NULL AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.death_date IS NOT NULL AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ? AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
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

                    var datarows = [];
                    if (results.length <= 0) {
                        datarows = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, lname;

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                };
                                datarows.push(entry);
                                data_entry = [];
                                data_counter = 1;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                hdate: item.hdate
                            };
                            lname = item.aname;
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        };
                        datarows.push(entry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/receiptperiodicalregister', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 3, 5],
        header_text_align_center: [2],
        text_align_right: [1, 3, 5],
        text_align_center: [2],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Receipt Date", "Receipt No.", "Society Name", "Receipt Amount"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Receipt Amount"];
    var report_title = "Receipt Register";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date];
            sql = `
                SELECT
                    DATE_FORMAT(Receipt.receipt_date,'%d/%m/%Y') AS rdate,
                    Receipt.receipt_number AS rnum,
                    Receipt.cr_account_id AS aid,
                    Account_Head.account_name AS aname,
                    Receipt.total_amount AS tamount
                FROM Receipt
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Receipt.cr_account_id
                WHERE Receipt.receipt_date IS NOT NULL AND Receipt.receipt_date >= ? AND Receipt.receipt_date <= ?
                ORDER BY Receipt.receipt_date ASC;
            `;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id, data_entry = [], single_entry, data_counter = 1, entry, data_total, gtotal = 0.00;
                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var sdata = {};

                        for (item of results) {
                            curr_id = item.aid;
                            if (curr_id in sdata) {
                                sdata[curr_id]["total"] += parseFloat(item.tamount);
                            }
                            else {
                                sdata[curr_id] = {};
                                sdata[curr_id]["name"] = item.aname;
                                sdata[curr_id]["total"] = parseFloat(item.tamount);
                            }
                            single_entry = {
                                snum: data_counter,
                                rdate: item.rdate,
                                rnum: item.rnum,
                                aname: item.aname,
                                total: parseFloat(item.tamount).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })
                            };
                            data_counter++;
                            gtotal = parseFloat(gtotal) + parseFloat(item.tamount);
                            data_entry.push(single_entry);
                        }
                        data_total = `
                            <tr style="background-color: silver;">
                                <td colspan="2"></td>
                                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data: data_entry,
                            data_total
                        };
                        datarows.push(entry);
                        for (var key in sdata) {
                            sentry = {
                                snum: summary_counter,
                                aid: key,
                                aname: sdata[key]["name"],
                                total: sdata[key]["total"].toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2
                                })
                            };
                            summary_counter++;
                            summary.summary_data.push(sentry);
                        }
                        console.log(gtotal);
                        summary.summary_total = `
                            <tr style="background-color: silver;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/paymentperiodicalregister', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 3, 5],
        header_text_align_center: [2],
        text_align_right: [1, 3, 5],
        text_align_center: [2],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Voucher Date", "Voucher No.", "Society Name", "Payment Amount"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Payment Amount"];
    var report_title = "Payment Register";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date];
            sql = `
                SELECT
                    DATE_FORMAT(Payment.voucher_date,'%d/%m/%Y') AS rdate,
                    Payment.document_number AS rnum,
                    Payment.dr_account_id AS aid,
                    Account_Head.account_name AS aname,
                    Payment.total_amount AS tamount
                FROM Payment
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Payment.dr_account_id
                WHERE Payment.voucher_date IS NOT NULL AND Payment.voucher_date >= ? AND Payment.voucher_date <= ?
                ORDER BY Payment.voucher_date ASC;
            `;
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

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id, data_entry = [], single_entry, data_counter = 1, entry, data_total, gtotal = 0.00;
                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var sdata = {};

                        for (item of results) {
                            curr_id = item.aid;
                            if (curr_id in sdata) {
                                sdata[curr_id]["total"] += parseFloat(item.tamount);
                            }
                            else {
                                sdata[curr_id] = {};
                                sdata[curr_id]["name"] = item.aname;
                                sdata[curr_id]["total"] = parseFloat(item.tamount);
                            }
                            single_entry = {
                                snum: data_counter,
                                rdate: item.rdate,
                                rnum: item.rnum,
                                aname: item.aname,
                                total: parseFloat(item.tamount).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })
                            };
                            data_counter++;
                            gtotal = parseFloat(gtotal) + parseFloat(item.tamount);
                            data_entry.push(single_entry);
                        }
                        data_total = `
                            <tr style="background-color: silver;">
                                <td colspan="2"></td>
                                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data: data_entry,
                            data_total
                        };
                        datarows.push(entry);
                        for (var key in sdata) {
                            sentry = {
                                snum: summary_counter,
                                aid: key,
                                aname: sdata[key]["name"],
                                total: sdata[key]["total"].toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2
                                })
                            };
                            summary_counter++;
                            summary.summary_data.push(sentry);
                        }
                        summary.summary_total = `
                            <tr style="background-color: silver;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/interest', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [3, 4, 5, 8, 9],
        text_align_center: [1, 6, 7],
        header_text_align_right: [3, 4, 5, 8, 9],
        header_text_align_center: [1, 6, 7],
        summary_text_align_right: [1, 2, 4, 5, 6, 7],
        summary_header_text_align_right: [1, 2, 4, 5, 6, 7]
    };
    var headers = ["Date", "Narration", "Credit", "Debit", "Closing", "From", "To", "Days", "Interest Amount"];
    var summary_headers = ["Sr.No.", "Member ID", "Member Name", "Closing", "Interest", "Service Tax", "Total"];
    var report_title = "Society Wise Member Account Interest Report";
    var mem_led_list, soc_led_list;
    if (data.select_all == '1')
        mem_led_list = 'All';
    else {
        if ("sub_account_id_list" in data) {
            if (typeof (data.sub_account_id_list) === 'string')
                mem_led_list = data.sub_account_id_list
            else
                mem_led_list = data.sub_account_id_list.join(', ');
        }
        else
            mem_led_list = 'None';
    }
    if ("account_id_list" in data) {
        if (typeof (data.account_id_list) === 'string')
            soc_led_list = data.account_id_list
        else
            soc_led_list = data.account_id_list.join(', ');
    }
    else
        soc_led_list = 'None';
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Interest Rate</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td><strong>${data.interest_rate.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} %</strong></td>
            <td></td>
            <td style="text-align: center;"><strong>Interest Free Months</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td><strong>${data.interest_free_month}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td><strong>${soc_led_list}</strong></td>
            <td></td>
            <td style="text-align: center;"><strong>Service Tax</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td><strong><strong>${Math.abs(data.st).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Member</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${mem_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
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
                sql_arr = [data.account_id_list, data.account_id_list, data.from_date, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Balance.sub_account_id AS sid,
                        Account_Head.account_name AS aname,
                        Sub_Account.sub_account_name AS sname,
                        Account_Balance.birth_date AS bdate,
                        Account_Balance.calwing_date AS cdate,
                        IF(
                            Account_Balance.op_crdr = "DR", 
                            -1*Account_Balance.op_balance,
                            Account_Balance.op_balance
                        ) AS op1
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.account_id = ?
                    ORDER BY Account_Balance.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS sid,
                        IFNULL(
                            (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                        ,0) AS op2
                    FROM Ledger
                        WHERE Ledger.account_id = ? AND Ledger.transaction_date < ?
                        GROUP BY Ledger.sub_account_id
                        ORDER BY Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS sid,
                        Ledger.transaction_date AS tc_date_r,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date < ? AND Ledger.account_id = ?
                        ORDER BY Ledger.sub_account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list, data.sub_account_id_list, data.account_id_list, data.sub_account_id_list, data.from_date, data.from_date, data.to_date, data.account_id_list, data.sub_account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Balance.sub_account_id AS sid,
                        Account_Head.account_name AS aname,
                        Sub_Account.sub_account_name AS sname,
                        Account_Balance.birth_date AS bdate,
                        Account_Balance.calwing_date AS cdate,
                        IF(
                            Account_Balance.op_crdr = "DR", 
                            -1*Account_Balance.op_balance,
                            Account_Balance.op_balance
                        ) AS op1
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.account_id = ? AND Account_Balance.sub_account_id IN (?)
                    ORDER BY Account_Balance.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS sid,
                        IFNULL(
                            (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                        ,0) AS op2
                    FROM Ledger
                        WHERE Ledger.account_id = ? AND Ledger.sub_account_id IN (?) AND Ledger.transaction_date < ?
                        GROUP BY Ledger.sub_account_id
                        ORDER BY Ledger.sub_account_id ASC;
                    SELECT
                        Ledger.sub_account_id AS sid,
                        Ledger.transaction_date AS tc_date_r,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                    FROM Ledger
                        WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date < ? AND Ledger.account_id = ? AND Ledger.sub_account_id IN (?)
                        ORDER BY Ledger.sub_account_id ASC, Ledger.transaction_date ASC;
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

                    var datarows = [], summary = {};
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var i = 0, j = 0, itemMain, itemSub, op2 = 0.00, op = 0.00;
                        var main = results[0];
                        var main_op = results[1];
                        var sub = results[2];
                        var sub_title, s_cr = 0.00, s_dr = 0.00, s_cl_balance = 0.00, cr = 0.00, dr = 0.00, cl_balance = 0.00, payable = 0.00, data_extra, s_grand_total = 0.00;
                        var total_interest = 0.00, interest = 0.00, s_interest = 0.00, diff_days, st_date, date1, date2;

                        var data_entry, entry;

                        var s_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var fr_date = beautifyDate(data.from_date);
                        var to_date = beautifyDate(data.to_date);

                        var st_date;

                        var total_st = 0.00;

                        for (itemMain of main) {

                            data_entry = [];

                            sub_title = itemMain.sid + " - " + itemMain.sname;
                            st_date = new Date(itemMain.bdate);
                            st_date.setMonth(st_date.getMonth() + parseInt(data.interest_free_month));
                            data_extra = "INTEREST STARTING DATE : " + getFormatedDate(st_date);

                            if (i < main_op.length && main_op[i].sid == itemMain.sid) {
                                op2 = main_op[i].op2;
                                i++;
                            }
                            else
                                op2 = 0.00;

                            op = (parseFloat(itemMain.op1) + parseFloat(op2)) || 0.00;

                            if (j < sub.length && sub[j].sid == itemMain.sid)
                                date2 = new Date(sub[j].tc_date_r);
                            else
                                date2 = new Date(data.to_date);

                            if (op >= 0) {
                                diff_days = 0;
                                interest = 0;
                                if (op != 0)
                                    op = op * -1;
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: '',
                                    cl: op.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    fr: fr_date,
                                    to: getFormatedDate(date2),
                                    days: diff_days,
                                    ia: interest.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_cr += Math.abs(parseFloat(op));
                                cl_balance -= Math.abs(parseFloat(op));
                            }
                            else {
                                date1 = new Date(data.from_date);
                                diff_days = calculateDays(date1, date2, st_date);
                                interest = Math.round((Math.abs(op) * data.interest_rate * diff_days) / (365 * 100));
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: '',
                                    dr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    cl: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    fr: fr_date,
                                    to: getFormatedDate(date2),
                                    days: diff_days,
                                    ia: interest.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                total_interest += parseFloat(interest);
                                s_dr += Math.abs(parseFloat(op));
                                cl_balance += Math.abs(parseFloat(op));
                            }

                            data_entry.push(single_entry);

                            while (j < sub.length && sub[j].sid == itemMain.sid) {

                                itemSub = sub[j];
                                date1 = new Date(itemSub.tc_date_r);

                                if (j != sub.length - 1 && sub[j + 1].sid == itemSub.sid)
                                    date2 = new Date(sub[j + 1].tc_date_r);
                                else
                                    date2 = new Date(data.to_date);

                                diff_days = calculateDays(date1, date2, st_date);

                                cr = Math.abs(parseFloat(itemSub.cr)) || 0.00;
                                dr = Math.abs(parseFloat(itemSub.dr)) || 0.00;

                                if (dr > 0) {
                                    cl_balance += dr;

                                    if (cl_balance <= 0)
                                        interest = 0.00;
                                    else
                                        interest = Math.round((Math.abs(cl_balance) * data.interest_rate * diff_days) / (365 * 100));

                                    single_entry = {
                                        date: itemSub.tc_date,
                                        narration: itemSub.narration,
                                        cr: '',
                                        dr: dr.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        cl: cl_balance.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        fr: itemSub.tc_date,
                                        to: getFormatedDate(date2),
                                        days: diff_days,
                                        ia: interest.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    total_interest += interest;
                                    s_dr += dr;
                                }
                                else {
                                    cl_balance -= cr;
                                    if (cl_balance <= 0)
                                        interest = 0.00;
                                    else
                                        interest = Math.round((Math.abs(cl_balance) * data.interest_rate * diff_days) / (365 * 100));

                                    single_entry = {
                                        date: itemSub.tc_date,
                                        narration: itemSub.narration,
                                        cr: cr.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: '',
                                        cl: cl_balance.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        fr: itemSub.tc_date,
                                        to: getFormatedDate(date2),
                                        days: diff_days,
                                        ia: interest.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    total_interest += interest;
                                    s_cr += cr;
                                }
                                data_entry.push(single_entry);
                                j++;

                            }

                            if (cl_balance >= 0) {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR",
                                    dr: '',
                                    cl: '',
                                    fr: '',
                                    to: '',
                                    days: '',
                                    ia: ''
                                };
                                s_cr += cl_balance;
                            }
                            else {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: '',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR",
                                    cl: '',
                                    fr: '',
                                    to: '',
                                    days: '',
                                    ia: ''
                                };
                                s_dr += Math.abs(cl_balance);
                            }
                            data_entry.push(single_entry);

                            data_total = `
                                <tr style="text-align: center;background-color: silver;">
                                    <td colspan="2"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td colspan="4"></td>
                                    <td style="text-align: right;"><strong>${total_interest.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total,
                                data_extra
                            };
                            datarows.push(entry);

                            payable = cl_balance + total_interest;
                            var st = 0.00;

                            if (typeof itemMain.cdate != 'string' && itemMain.cdate != '00-00-0000') {
                                st = Math.abs(parseFloat(data.st));
                                total_st += st;
                            }

                            payable += st;

                            // Summary entry
                            sentry = {
                                snum: s_counter,
                                sid: itemMain.sid,
                                sname: itemMain.sname,
                                s_cl: cl_balance.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                s_i: total_interest.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                st: st.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                total: payable.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })
                            };

                            s_cl_balance += cl_balance;
                            s_interest += total_interest;
                            s_grand_total += payable;

                            summary.summary_data.push(sentry);
                            s_counter++;

                            cl_balance = 0.00;
                            s_cr = 0.00;
                            s_dr = 0.00;
                            total_interest = 0.00;

                        }

                        summary.summary_total = `
                            <tr style="background-color: gray;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cl_balance).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_interest).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            <td style="text-align: right;"><strong>${Math.abs(total_st).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_grand_total).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/summary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [3, 4, 5, 8, 9],
        text_align_center: [1, 6, 7],
        header_text_align_right: [3, 4, 5, 8, 9],
        header_text_align_center: [1, 6, 7],
        summary_text_align_right: [1, 2, 4, 5, 6],
        summary_header_text_align_right: [1, 2, 4, 5, 6]
    };
    var headers = ["Date", "Narration", "Credit", "Debit", "Closing", "From", "To", "Days", "Interest Amount"];
    var summary_headers = ["Sr.No.", "Member ID", "Member Name", "Closing", "Interest", "Total"];
    var report_title = "Summary Report";
    var mem_led_list, soc_led_list;
    if ("account_id_list" in data) {
        if (typeof (data.account_id_list) === 'string')
            soc_led_list = data.account_id_list
        else
            soc_led_list = data.account_id_list.join(', ');
    }
    else
        soc_led_list = 'None';
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date,data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date];
            sql = `
                SELECT
                    COUNT(DISTINCT account_id) AS scount,
                    COUNT(DISTINCT sub_account_id) AS mcount
                FROM Account_Balance
                WHERE 
                    join_date >= (?) AND join_date <= (?) AND join_date != '0000-00-00' AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
                SELECT
                    IFNULL(SUM(cr_amount),0) AS cr,
                    IFNULL(SUM(dr_amount),0) AS dr
                FROM Ledger
                WHERE
                    transaction_date >= (?) AND transaction_date <= (?) AND transaction_date != '0000-00-00' AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
                SELECT
                    COUNT(DISTINCT sub_account_id) AS hcount
                FROM Account_Balance
                WHERE
                    calwing_date >= (?) AND calwing_date <= (?) AND calwing_date != '0000-00-00' AND birth_date != '0000-00-00' AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
                SELECT
                    ( IFNULL(SUM(DATEDIFF(calwing_date,birth_date) + 1),0) ) AS total_days
                FROM Account_Balance
                WHERE
                    calwing_date >= (?) AND calwing_date <= (?) AND calwing_date != '0000-00-00' AND birth_date != '0000-00-00' AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
                SELECT
                    IFNULL(SUM(dr_amount),0) AS calwing_dr
                FROM Ledger
                WHERE
                    transaction_date <= (?) AND
                    account_id IN (
                        SELECT
                            account_id
                        FROM Account_Balance
                        WHERE 
                            calwing_date >= (?) AND calwing_date <= (?) AND calwing_date != '0000-00-00' AND birth_date != '0000-00-00'
                    ) AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
                SELECT
                    COUNT(DISTINCT sub_account_id) AS cancel_count
                FROM Account_Balance
                WHERE
                    cancel_date >= (?) AND cancel_date <= (?) AND cancel_date != '0000-00-00' AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
                SELECT
                    COUNT(DISTINCT sub_account_id) AS death_count
                FROM Account_Balance
                WHERE
                    death_date >= (?) AND death_date <= (?) AND death_date != '0000-00-00' AND
                    account_id NOT IN (
                        SELECT
                            account_id
                        FROM Account_Head
                        WHERE is_society=0
                    );
            `;
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    // console.log(results);
    
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {};
                    if (results[0].length <= 0) {
                        console.log("NO DATA FOUND!");
                        res.send({
                            status: false
                        });
                    }
                    else{
                        var scount = results[0][0].scount;
                        var mcount = results[0][0].mcount;
                        var cr = results[1][0].cr;
                        var dr = results[1][0].dr;
                        var hcount = results[2][0].hcount;
                        var total_days = results[3][0].total_days;
                        var calwing_dr = results[4][0].calwing_dr;
                        var cancel_count = results[5][0].cancel_count;
                        var death_count = results[6][0].death_count;

                        var avg_calwing_days = total_days/hcount;
                        var avg_calwing_months = avg_calwing_days/30;
                        var avg_calwing_cost = calwing_dr/hcount;

                        var summary_information = `
                            <tr>
                                <td>DCS Covered<br>(Joint Villages)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseInt(scount).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Joint Members</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseInt(mcount).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Total Finance Rs.<br>(Total Debit Amount)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseFloat(dr).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Total Recovery Rs.<br>(Total Credit Amount)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseFloat(cr).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Heifer Calved<br>(Heifer Calved Number)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseInt(hcount).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Average Calving Period (Months)<br>(Calved date - Birth date) (Days)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseFloat(avg_calwing_months).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}<br>
                                ${parseFloat(avg_calwing_days).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Total Calving Cost</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseFloat(calwing_dr).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Average Calving Cost<br>(Calving Loan / Member)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseFloat(avg_calwing_cost).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Total Cancelled Accounts<br>(Within Given Periods)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseInt(cancel_count).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                            <tr>
                                <td>Total Death<br>(Within Given Periods)</td>
                                <td>:</td>
                                <td style="text-align: right;">${parseInt(death_count).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                            </tr>
                        `;
                    }
                    /*
                    else {
                        var i = 0, j = 0, itemMain, itemSub, op2 = 0.00, op = 0.00;
                        var main = results[0];
                        var main_op = results[1];
                        var sub = results[2];
                        var sub_title, s_cr = 0.00, s_dr = 0.00, s_cl_balance = 0.00, cr = 0.00, dr = 0.00, cl_balance = 0.00, payable = 0.00, data_extra, s_grand_total = 0.00;
                        var total_interest = 0.00, interest = 0.00, s_interest = 0.00, diff_days, st_date, date1, date2;

                        var data_entry, entry;

                        var s_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var fr_date = beautifyDate(data.from_date);
                        var to_date = beautifyDate(data.to_date);

                        var st_date;

                        for (itemMain of main) {

                            data_entry = [];

                            sub_title = itemMain.sid + " - " + itemMain.sname;
                            st_date = new Date(itemMain.bdate);
                            st_date.setMonth(st_date.getMonth() + parseInt(data.interest_free_month));
                            data_extra = "INTEREST STARTING DATE : " + getFormatedDate(st_date);

                            if (i < main_op.length && main_op[i].sid == itemMain.sid) {
                                op2 = main_op[i].op2;
                                i++;
                            }
                            else
                                op2 = 0.00;

                            op = (parseFloat(itemMain.op1) + parseFloat(op2)) || 0.00;

                            if (j < sub.length && sub[j].sid == itemMain.sid)
                                date2 = new Date(sub[j].tc_date_r);
                            else
                                date2 = new Date(data.to_date);

                            if (op >= 0) {
                                diff_days = 0;
                                interest = 0;
                                if (op != 0)
                                    op = op * -1;
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: '',
                                    cl: op.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    fr: fr_date,
                                    to: getFormatedDate(date2),
                                    days: diff_days,
                                    ia: interest.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_cr += Math.abs(parseFloat(op));
                                cl_balance -= Math.abs(parseFloat(op));
                            }
                            else {
                                date1 = new Date(data.from_date);
                                diff_days = calculateDays(date1, date2, st_date);
                                interest = Math.round((Math.abs(op) * data.interest_rate * diff_days) / (365 * 100));
                                single_entry = {
                                    date: fr_date,
                                    narration: "Opening Balance",
                                    cr: '',
                                    dr: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    cl: Math.abs(op).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    fr: fr_date,
                                    to: getFormatedDate(date2),
                                    days: diff_days,
                                    ia: interest.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                total_interest += parseFloat(interest);
                                s_dr += Math.abs(parseFloat(op));
                                cl_balance += Math.abs(parseFloat(op));
                            }

                            data_entry.push(single_entry);

                            while (j < sub.length && sub[j].sid == itemMain.sid) {

                                itemSub = sub[j];
                                date1 = new Date(itemSub.tc_date_r);

                                if (j != sub.length - 1 && sub[j + 1].sid == itemSub.sid)
                                    date2 = new Date(sub[j + 1].tc_date_r);
                                else
                                    date2 = new Date(data.to_date);

                                diff_days = calculateDays(date1, date2, st_date);

                                cr = Math.abs(parseFloat(itemSub.cr)) || 0.00;
                                dr = Math.abs(parseFloat(itemSub.dr)) || 0.00;

                                if (dr > 0) {
                                    cl_balance += dr;

                                    if (cl_balance <= 0)
                                        interest = 0.00;
                                    else
                                        interest = Math.round((Math.abs(cl_balance) * data.interest_rate * diff_days) / (365 * 100));

                                    single_entry = {
                                        date: itemSub.tc_date,
                                        narration: itemSub.narration,
                                        cr: '',
                                        dr: dr.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        cl: cl_balance.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        fr: itemSub.tc_date,
                                        to: getFormatedDate(date2),
                                        days: diff_days,
                                        ia: interest.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    total_interest += interest;
                                    s_dr += dr;
                                }
                                else {
                                    cl_balance -= cr;
                                    if (cl_balance <= 0)
                                        interest = 0.00;
                                    else
                                        interest = Math.round((Math.abs(cl_balance) * data.interest_rate * diff_days) / (365 * 100));

                                    single_entry = {
                                        date: itemSub.tc_date,
                                        narration: itemSub.narration,
                                        cr: cr.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: '',
                                        cl: cl_balance.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        fr: itemSub.tc_date,
                                        to: getFormatedDate(date2),
                                        days: diff_days,
                                        ia: interest.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    total_interest += interest;
                                    s_cr += cr;
                                }
                                data_entry.push(single_entry);
                                j++;

                            }

                            if (cl_balance >= 0) {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR",
                                    dr: '',
                                    cl: '',
                                    fr: '',
                                    to: '',
                                    days: '',
                                    ia: ''
                                };
                                s_cr += cl_balance;
                            }
                            else {
                                single_entry = {
                                    date: to_date,
                                    narration: "Closing Balance",
                                    cr: '',
                                    dr: Math.abs(cl_balance).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR",
                                    cl: '',
                                    fr: '',
                                    to: '',
                                    days: '',
                                    ia: ''
                                };
                                s_dr += Math.abs(cl_balance);
                            }
                            data_entry.push(single_entry);

                            data_total = `
                                <tr style="text-align: center;background-color: silver;">
                                    <td colspan="2"></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                    <td colspan="4"></td>
                                    <td style="text-align: right;"><strong>${total_interest.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total,
                                data_extra
                            };
                            datarows.push(entry);

                            payable = cl_balance + total_interest;

                            // Summary entry
                            sentry = {
                                snum: s_counter,
                                sid: itemMain.sid,
                                sname: itemMain.sname,
                                s_cl: cl_balance.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                s_i: total_interest.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                total: payable.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })
                            };

                            s_cl_balance += cl_balance;
                            s_interest += total_interest;
                            s_grand_total += payable;

                            summary.summary_data.push(sentry);
                            s_counter++;

                            cl_balance = 0.00;
                            s_cr = 0.00;
                            s_dr = 0.00;
                            total_interest = 0.00;

                        }

                        summary.summary_total = `
                            <tr style="background-color: gray;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cl_balance).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_interest).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_grand_total).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    */
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        summary_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
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
                            var fullUrl, client_link, link;
                            try {
                                fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                                client_link = new URL(fullUrl);
                                link = new URL(String(resheaders.headers['permanent-link']));
                                link.hostname = client_link.hostname;
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                            catch (e) {
                                console.log(e);
                                res.send({
                                    status: false
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
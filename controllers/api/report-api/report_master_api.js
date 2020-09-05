const express = require('express');
const router = express.Router();
const getConnection = require('../../../connection');
const middleware = require('../../auth/auth_middleware');
const reportGenerator = require('./report_generator_module');

router.get('/accounthead', (req, res) => {
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
                LIMIT 50;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDay()).slice(-2);
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
                    console.log(JSON.stringify(dataobject.datarows))
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var link = String(resheaders.headers['permanent-link']);
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
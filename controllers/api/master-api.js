const express = require('express');
const router = express.Router();
const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

router.get('/accounthead/:id',middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({ status: false });
        }
        else {
            var account_id = req.params.id;
            var sql = `
                SELECT 
                    Account_Head.account_id,Account_Head.account_name,
                    Village.village_name,
                    Taluka.taluka_name,
                    District.district_name
                FROM Account_Head
                    INNER JOIN Village
                        ON Account_Head.account_id = ? AND Village.village_id = Account_Head.village_id
                    INNER JOIN Taluka
                        ON Taluka.taluka_id = Village.taluka_id
                    INNER JOIN District
                        ON District.district_id = Taluka.district_id;
                SELECT
                    DISTINCT sub_account_id AS sid
                FROM Account_Balance
                WHERE account_id = ?
                ORDER BY sub_account_id DESC;
            `;
            connection.query(sql, [account_id, account_id], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({ status: false });
                }
                else {
                    if (results.length > 0) {
                        res.send({
                            status: true,
                            data: results[0][0],
                            sub_account_list: results[1]
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

router.get('/subaccount/:id',middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({ status: false });
        }
        else {
            var sub_account_id = req.params.id;
            var sql = `
                SELECT sub_account_name,sub_account_address
                FROM Sub_Account
                WHERE sub_account_id = ?;
            `;
            connection.query(sql, sub_account_id, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({ status: false });
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

module.exports = router;
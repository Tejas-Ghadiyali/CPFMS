const express = require('express');
const router = express.Router();
const getConnection = require('../connection');

router.get('/', (req, res) => {
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
            connection.release();
            console.log(err);
        }
        else {
            var sql1 = 'SELECT COUNT(*) as ahcount FROM `Account_Head`';
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    console.log(err);
                }
                else {
                    totalentries = results[0].ahcount;
                    totalpages = Math.ceil(totalentries / entries_per_page);
                    if (pagenum > totalpages) {
                        pagenum = totalpages;
                    }
                    else if (pagenum <= 0) {
                        pagenum = 1;
                    }
                    var sql2 = "SELECT * FROM `Account_Head` LIMIT ? , ?";
                    var offset = (pagenum - 1) * entries_per_page;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            console.log(err);
                        }
                        else {
                            res.render('account_head/account_head', {
                                data: results,
                                totalpages,
                                pagenum,
                                entries_per_page,
                                totalentries
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/search', (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'] + '%';
            var sql = "SELECT * FROM Account_Head";
            var flag = false;
            var arr = ['searchtext', 'account_type', 'is_society'];
            for (key in ob) {
                if (ob[key] !== "false" && key !== "searchtext") {
                    if (arr.includes(key)) {
                        if (!flag) {
                            flag = true;
                            sql = sql + " WHERE " + key + "='" + ob[key] + "'";
                        }
                        else
                            sql = sql + " AND " + key + "='" + ob[key] + "'";
                    }
                    else {
                        if (!flag) {
                            flag = true;
                            sql = sql + " WHERE " + ob[key] + " LIKE '" + searcht + "'";
                        }
                        else
                            sql = sql + " OR " + ob[key] + " LIKE '" + searcht + "'";
                    }
                }
            }
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.redirect('/accounthead');
                }
                else {
                    res.render('account_head/account_head_search', {
                        data: results,
                        searchtext: req.query.searchtext
                    });
                }
            });
        }
    });
});

router.post('/', (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var { account_id, account_name, account_type, is_society, village_id } = req.body;
            var sql = 'INSERT INTO `Account_Head` (`account_id`, `account_name`, `account_type`, `is_society`, `village_id`) VALUES (?, ?, ?, ?, ?)'
            connection.query(sql, [account_id, account_name, account_type, is_society, village_id], (err, result) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    res.redirect('/accounthead');
                }
            });
        }
    });
});

router.post('/edit', (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var { account_id, account_name, account_type, is_society, village_id } = req.body;
            var sql = " UPDATE `Account_Head` SET `account_name` = ?, `account_type` = ?, `is_society` = ?, `village_id` = ? WHERE `Account_Head`.`account_id` = ? ";
            connection.query(sql, [account_name, account_type, is_society, village_id, account_id], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    res.redirect('/accounthead');
                }
            });
        }
    })
});

router.post('/delete', (req, res) => {
    console.log(req.body.ids);
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            var sql = "DELETE FROM `Account_Head` WHERE account_id IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(results);
                    res.redirect('/accounthead');
                }
            });
        }
    });
});

module.exports = router;
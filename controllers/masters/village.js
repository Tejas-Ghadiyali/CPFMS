const express = require('express');
const router = express.Router();
const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

router.get('/', middleware.loggedin_as_superuser, (req, res) => {
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
            req.flash('danger', 'Error while getting data from Village!');
            res.render('masters/village/village', {
                data: [],
                taluka: [],
                totalpages: 0,
                pagenum: 0,
                entries_per_page,
                totalentries: 0,
                flash: res.locals.flash,
                user_type: req.user.user_type
            });
        }
        else {
            var sql1 = 'SELECT COUNT(*) as ahcount FROM `Village`';
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash('danger', 'Error while getting count of Village!');
                    console.log(err);
                    res.render('masters/village/village', {
                        data: [],
                        taluka: [],
                        totalpages: 0,
                        pagenum: 0,
                        entries_per_page,
                        totalentries: 0,
                        flash: res.locals.flash,
                        user_type: req.user.user_type
                    });
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
                    var sql2 = "SELECT * FROM Village INNER JOIN Taluka ON Village.taluka_id = Taluka.taluka_id LIMIT ? , ?;SELECT * FROM Taluka";
                    var offset = (pagenum - 1) * entries_per_page;
                    if (offset < 0)
                        offset = 0;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            req.flash('danger', 'Error while getting data from Master-Village!');
                            console.log(err);
                            res.render('masters/village/village ', {
                                data: [],
                                taluka: [],
                                totalpages: 0,
                                pagenum: 0,
                                entries_per_page,
                                totalentries: 0,
                                flash: res.locals.flash,
                                user_type: req.user.user_type
                            });
                        }
                        else {
                            res.render('masters/village/village', {
                                data: results[0],
                                taluka: results[1],
                                totalpages,
                                pagenum,
                                entries_per_page,
                                totalentries,
                                flash: res.locals.flash,
                                user_type: req.user.user_type
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/search', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error in searching Master-Village!');
            res.redirect('/village');
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'].trim() + '%';
            var sql = "SELECT * FROM Village INNER JOIN Taluka ON Village.taluka_id = Taluka.taluka_id";
            var flag = false;
            var arr = [];
            if (ob.taluka_id) {
                ob.taluka_id = 'Village.taluka_id';
            }
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
            sql = sql + ";SELECT * FROM Taluka";
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash('danger', 'Error in searching Master-Village with given parameters!');
                    res.redirect('/village');
                }
                else {
                    res.render('masters/village/village_search', {
                        data: results[0],
                        taluka: results[1],
                        searchtext: req.query.searchtext,
                        flash: res.locals.flash,
                        user_type: req.user.user_type
                    });
                }
            });
        }
    });
});

router.post('/', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            req.flash('danger', 'Error in Adding Master-Village!');
            console.log(err);
            res.redirect('/village');
        }
        else {
            var { village_id, village_name, taluka_id } = req.body;
            village_id = village_id.trim();
            var sql = 'INSERT INTO `Village` (`village_id`, `village_name`, `taluka_id`) VALUES (?, ?, ?)'
            connection.query(sql, [village_id, village_name, taluka_id], (err, result) => {
                connection.release();
                if (err) {
                    console.log(err);
                    if (err.code == 'ER_DUP_ENTRY')
                        req.flash('danger', 'Village with Village Id ' + village_id + ' already exists!');
                    else
                        req.flash('danger', 'Error while adding account in Master-Village!');
                    res.redirect('/village');
                }
                else {
                    req.flash('success', 'Village with Village Id ' + village_id + ' added.');
                    res.redirect('/village');
                }
            });
        }
    });
});

router.post('/edit', middleware.loggedin_as_admin, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error while editing record !');
            res.redirect('/village');
        }
        else {
            var { village_id, village_name, taluka_id } = req.body;
            village_id = village_id.trim();
            var sql = " UPDATE `Village` SET `village_name` = ?, `taluka_id` = ? WHERE `Village`.`village_id` = ? ";
            connection.query(sql, [village_name, taluka_id, village_id], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while editing record with id ' + village_id);
                    console.log(err);
                    res.redirect('/village');
                }
                else {
                    req.flash('success', 'Successfully edited record with id ' + village_id);
                    res.redirect('/village');
                }
            });
        }
    })
});

router.post('/delete', middleware.loggedin_as_admin, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error while deleting the record!');
            res.redirect('/village');
        }
        else {
            var sql = "DELETE FROM `Village` WHERE village_id IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while deleting the record!');
                    console.log(err);
                    res.redirect('/village');
                }
                else {
                    if (results.affectedRows > 0) {
                        if (results.affectedRows === 1) {
                            req.flash('success', 'Successfully deleted record with id ' + req.body.ids[0]);
                        }
                        else {
                            req.flash('success', 'Successfully deleted selected records!');
                        }
                        res.redirect('/village');
                    }
                    else {
                        req.flash('danger', 'Error while deleting the record!');
                        res.redirect('/village');
                    }
                }
            });
        }
    });
});

module.exports = router;
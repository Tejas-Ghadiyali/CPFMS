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
            req.flash('danger', 'Error while getting data from Master-Cow Cast!');
            res.render('masters/cow_cast/cow_cast', {
                data: [],
                totalpages: 0,
                pagenum: 0,
                entries_per_page,
                totalentries: 0,
                flash: res.locals.flash,
                user_type: req.user.user_type
            });
        }
        else {
            var sql1 = 'SELECT COUNT(*) as ahcount FROM `Cow_Cast`';
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash('danger', 'Error while getting count of Cow Cast!');
                    console.log(err);
                    res.render('masters/cow_cast/cow_cast', {
                        data: [],
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
                    var sql2 = "SELECT * FROM `Cow_Cast` LIMIT ? , ?";
                    var offset = (pagenum - 1) * entries_per_page;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            req.flash('danger', 'Error while getting data from Master-Cow Cast!');
                            console.log(err);
                            res.render('masters/cow_cast/cow_cast', {
                                data: [],
                                totalpages: 0,
                                pagenum: 0,
                                entries_per_page,
                                totalentries: 0,
                                flash: res.locals.flash,
                                user_type: req.user.user_type
                            });
                        }
                        else {
                            res.render('masters/cow_cast/cow_cast', {
                                data: results,
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
            req.flash('danger', 'Error in searching Master-Cow Cast!');
            res.redirect('/cowcast');
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'].trim() + '%';
            var sql = "SELECT * FROM Cow_Cast";
            var flag = false;
            var arr = ['searchtext'];
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
                    req.flash('danger', 'Error in searching Master-Cow Cast with given parameters!');
                    res.redirect('/cowcast');
                }
                else {
                    res.render('masters/cow_cast/cow_cast_search', {
                        data: results,
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
            req.flash('danger', 'Error in Adding Master-Cow Cast!');
            console.log(err);
            res.redirect('/cowcast');
        }
        else {
            var { cow_cast_id, cow_cast_name } = req.body;
            cow_cast_id = cow_cast_id.trim();
            var sql = 'INSERT INTO `Cow_Cast` (`cow_cast_id`, `cow_cast_name`) VALUES (?, ?)'
            connection.query(sql, [cow_cast_id, cow_cast_name],
                (err, result) => {
                    connection.release();
                    if (err) {
                        console.log(err);
                        if (err.code == 'ER_DUP_ENTRY')
                            req.flash('danger', 'Cow Cast with Cow Cast Id ' + cow_cast_id + ' already exists!');
                        else
                            req.flash('danger', 'Error while adding cow cast in Master-Cow Cast!');
                        res.redirect('/cowcast');
                    }
                    else {
                        req.flash('success', 'Cow Cast with Cow Cast Id ' + cow_cast_id + ' Added.');
                        res.redirect('/cowcast');
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
            res.redirect('/cowcast');
        }
        else {
            var { cow_cast_id, cow_cast_name } = req.body;
            cow_cast_id = cow_cast_id.trim();
            var sql = " UPDATE `Cow_Cast` SET `cow_cast_name` = ? WHERE `Cow_Cast`.`cow_cast_id` = ? ";
            connection.query(sql, [cow_cast_name, cow_cast_id], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while editing record with id ' + cow_cast_id);
                    console.log(err);
                    res.redirect('/cowcast');
                }
                else {
                    req.flash('success', 'Successfully edited record with id ' + cow_cast_id);
                    res.redirect('/cowcast');
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
            res.redirect('/cowcast');
        }
        else {
            var sql = "DELETE FROM `Cow_Cast` WHERE cow_cast_id IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while deleting the record!');
                    console.log(err);
                    res.redirect('/cowcast');
                }
                else {
                    if (results.affectedRows === 0) {
                        req.flash('danger', 'Error while deleting the record!');
                    }
                    else if (req.body.ids.length === 1) {
                        req.flash('success', 'Successfully deleted record with id ' + req.body.ids[0]);
                    }
                    else {
                        req.flash('success', 'Successfully deleted selected records!');
                    }
                    res.redirect('/cowcast');
                }
            });
        }
    });
});

module.exports = router;
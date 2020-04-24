const express = require('express');
const router = express.Router();
const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

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
            console.log(err);
            req.flash('danger', 'Error while getting data from Master-User!');
            res.render('masters/user/user', {
                data: [],
                totalpages: 0,
                pagenum: 0,
                entries_per_page,
                totalentries: 0,
                flash: res.locals.flash
            });
        }
        else {
            var sql1 = "SELECT COUNT(*) as count FROM `User` WHERE user_type='SUPERUSER' or user_type='ADMIN'";
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash('danger', 'Error while getting count of User!');
                    console.log(err);
                    res.render('masters/user/user', {
                        data: [],
                        totalpages: 0,
                        pagenum: 0,
                        entries_per_page,
                        totalentries: 0,
                        flash: res.locals.flash
                    });
                }
                else {
                    totalentries = results[0].count;
                    totalpages = Math.ceil(totalentries / entries_per_page);
                    if (pagenum > totalpages) {
                        pagenum = totalpages;
                    }
                    else if (pagenum <= 0) {
                        pagenum = 1;
                    }
                    var sql2 = "SELECT * FROM `User` WHERE user_type='SUPERUSER' or user_type='ADMIN' LIMIT ? , ?";
                    var offset = (pagenum - 1) * entries_per_page;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            req.flash('danger', 'Error while getting data from User!');
                            console.log(err);
                            res.render('masters/user/user', {
                                data: [],
                                totalpages: 0,
                                pagenum: 0,
                                entries_per_page,
                                totalentries: 0,
                                flash: res.locals.flash
                            });
                        }
                        else {
                            res.render('masters/user/user', {
                                data: results,
                                totalpages,
                                pagenum,
                                entries_per_page,
                                totalentries,
                                flash: res.locals.flash
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
            req.flash('danger', 'Error in searching Master-Account Head!');
            res.redirect('/accounthead');
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'].trim() + '%';
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
                    req.flash('danger', 'Error in searching Master-Account Head with given parameters!');
                    res.redirect('/accounthead');
                }
                else {
                    res.render('masters/account_head/account_head_search', {
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

router.post('/', (req, res) => {
    if (req.body.password != req.body.confirm_password) {
        req.flash('danger', 'Password and Confirm Password is not same !');
        res.redirect('/user');
    }
    else {
        getConnection((err, connection) => {
            if (err) {
                req.flash('danger', 'Error in Adding Master-User!');
                console.log(err);
                res.redirect('/user');
            }
            else {
                var { user_id, user_name, user_type, active, password } = req.body;
                user_id = user_id.trim();
                var sql = 'INSERT INTO `User` (`user_id`, `user_name`, `user_type`, `active`, `password`) VALUES (?, ?, ?, ?, ?)'
                connection.query(sql, [user_id, user_name, user_type, 1, password], (err, result) => {
                    connection.release();
                    if (err) {
                        console.log(err);
                        if (err.code == 'ER_DUP_ENTRY')
                            req.flash('danger', 'User with User Id ' + user_id + ' already exists!');
                        else
                            req.flash('danger', 'Error while adding user in Master-User!');
                        res.redirect('/user');
                    }
                    else {
                        req.flash('success', 'User with User Id ' + user_id + ' added.');
                        res.redirect('/user');
                    }
                });
            }
        });
    }
});

router.post('/edit', (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error while editing user record !');
            res.redirect('/user');
        }
        else {
            console.log(req.body);
            var { user_id, user_name, user_type, active } = req.body;
            console.log(user_id);
            var sql = " UPDATE `User` SET `user_name` = ?, `user_type` = ?, `active` = ? WHERE `User`.`user_id` = ? ";
            connection.query(sql, [user_name, user_type, active, user_id], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while editing user record with id ' + user_id);
                    console.log(err);
                    res.redirect('/user');
                }
                else {
                    req.flash('success', 'Successfully edited user record with id ' + user_id);
                    res.redirect('/user');
                }
            });
        }
    })
});

router.post('/delete', (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error while deleting the user record!');
            res.redirect('/user');
        }
        else {
            var sql = "DELETE FROM `User` WHERE user_id IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while deleting the user record!');
                    console.log(err);
                    res.redirect('/user');
                }
                else {
                    if (req.body.ids.length === 1) {
                        req.flash('success', 'Successfully deleted user with id ' + req.body.ids[0]);
                    }
                    else {
                        req.flash('success', 'Successfully deleted selected user records!');
                    }
                    res.redirect('/user');
                }
            });
        }
    });
});

module.exports = router;
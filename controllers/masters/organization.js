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
        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                throw err;
            }
            else {
                if (err) {
                    connection.rollback(() => {
                        throw err;
                    })
                    console.log(err);
                    req.flash('danger', 'Error while getting data from Master-Organization!');
                    res.render('masters/organization/organization', {
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
                    var sql1 = 'SELECT COUNT(*) as ahcount FROM `Organization`';
                    connection.query(sql1, (err, results) => {
                        if (err) {
                            connection.release();
                            req.flash('danger', 'Error while getting count of Organization!');
                            console.log(err);
                            res.render('masters/organization/organization', {
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
                            var sql2 = "SELECT * FROM `Organization` LIMIT ? , ?";
                            var offset = (pagenum - 1) * entries_per_page;
                            connection.query(sql2, [offset, entries_per_page], (err, results) => {
                                connection.release();
                                if (err) {
                                    req.flash('danger', 'Error while getting data from Master-Organization!');
                                    console.log(err);
                                    res.render('masters/organization/organization', {
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
                                    res.render('masters/organization/organization', {
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
            }
        });

    });
});

router.get('/search', middleware.loggedin_as_superuser, (req, res) => {
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            req.flash('danger', 'Error in searching Master-Organization!');
            res.redirect('/organization');
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'].trim() + '%';
            var sql = "SELECT * FROM Organization";
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
                    req.flash('danger', 'Error in searching Master-organization with given parameters!');
                    res.redirect('/organization');
                }
                else {
                    res.render('masters/organization/organization_search', {
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
            req.flash('danger', 'Error in Adding Master-Organization!');
            console.log(err);
            res.redirect('/organization');
        }
        else {
            var { organization_id, organization_name } = req.body;
            organization_id = organization_id.trim();
            var sql = 'INSERT INTO `Organization` (`organization_id`, `organization_name`) VALUES (?, ?)'
            connection.query(sql, [organization_id, organization_name],
                (err, result) => {
                    connection.release();
                    if (err) {
                        console.log(err);
                        if (err.code == 'ER_DUP_ENTRY')
                            req.flash('danger', 'Organization with Organization Id ' + organization_id + ' already exists!');
                        else
                            req.flash('danger', 'Error while adding organization in Master-Organization!');
                        res.redirect('/organization');
                    }
                    else {
                        req.flash('success', 'Organization with Organization Id ' + organization_id + ' Added.');
                        res.redirect('/organization');
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
            res.redirect('/organization');
        }
        else {
            var { organization_id, organization_name } = req.body;
            organization_id = organization_id.trim();
            var sql = " UPDATE `Organization` SET `organization_name` = ? WHERE `Organization`.`organization_id` = ? ";
            connection.query(sql, [organization_name, organization_id], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while editing record with id ' + organization_id);
                    console.log(err);
                    res.redirect('/organization');
                }
                else {
                    req.flash('success', 'Successfully edited record with id ' + organization_id);
                    res.redirect('/organization');
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
            res.redirect('/organization');
        }
        else {
            var sql = "DELETE FROM `Organization` WHERE organization_id IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while deleting the record!');
                    console.log(err);
                    res.redirect('/organization');
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
                    res.redirect('/organization');
                }
            });
        }
    });
});

module.exports = router;
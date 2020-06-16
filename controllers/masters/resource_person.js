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
            req.flash('danger', 'Error while getting data from Master-Resource Person!');
            res.render('masters/resource_person/resource_person', {
                data: [],
                village: [],
                totalpages: 0,
                pagenum: 0,
                entries_per_page,
                totalentries: 0,
                flash: res.locals.flash,
                user_type: req.user.user_type
            });
        }
        else {
            var sql1 = 'SELECT COUNT(*) as ahcount FROM `Resource_Person`';
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash('danger', 'Error while getting count of Resource Person!');
                    console.log(err);
                    res.render('masters/resource_person/resource_person', {
                        data: [],
                        village: [],
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
                    var sql2 = "SELECT * FROM `Resource_Person` LIMIT ? , ?;SELECT * FROM Village";
                    var offset = (pagenum - 1) * entries_per_page;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            req.flash('danger', 'Error while getting data from Master-Resource Person!');
                            console.log(err);
                            res.render('masters/resource_person/resource_person', {
                                data: [],
                                village: [],
                                totalpages: 0,
                                pagenum: 0,
                                entries_per_page,
                                totalentries: 0,
                                flash: res.locals.flash,
                                user_type: req.user.user_type
                            });
                        }
                        else {
                            res.render('masters/resource_person/resource_person', {
                                data: results[0],
                                village: results[1],
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
            req.flash('danger', 'Error in searching Master-Resource Person!');
            res.redirect('/resourceperson');
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'].trim() + '%';
            var sql = "SELECT * FROM Resource_Person";
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
            sql = sql + ";SELECT * FROM Village";
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash('danger', 'Error in searching Master-Resource Person with given parameters!');
                    res.redirect('/resourceperson');
                }
                else {
                    res.render('masters/resource_person/resource_person_search', {
                        data: results[0],
                        village: results[1],
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
            req.flash('danger', 'Error in Adding Master-Resource Person!');
            console.log(err);
            res.redirect('/resource_person');
        }
        else {
            var { resource_person_id, resource_person_name, resource_person_address, resource_person_contact, resource_person_village_id, resource_person_remark } = req.body;
            resource_person_id = resource_person_id.trim();
            var sql = 'INSERT INTO `Resource_Person` (`resource_person_id`, `resource_person_name`, `resource_person_address`, `resource_person_contact`, `resource_person_village_id`,  `resource_person_remark`) VALUES (?, ?, ?, ?, ?, ?)'
            connection.query(sql, [resource_person_id, resource_person_name, resource_person_address, resource_person_contact, resource_person_village_id, resource_person_remark], (err, result) => {
                connection.release();
                if (err) {
                    console.log(err);
                    if (err.code == 'ER_DUP_ENTRY')
                        req.flash('danger', 'Resource Person with Id ' + resource_person_id + ' already exists!');
                    else
                        req.flash('danger', 'Error while adding Resource Person in Master-Resource Person!');
                    res.redirect('/resourceperson');
                }
                else {
                    req.flash('success', 'Resource Person with Id ' + resource_person_id + ' added.');
                    res.redirect('/resourceperson');
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
            res.redirect('/resourceperson');
        }
        else {
            var { resource_person_id, resource_person_name, resource_person_address, resource_person_contact, resource_person_village_id, resource_person_remark } = req.body;
            resource_person_id = resource_person_id.trim();
            var sql = " UPDATE `Resource_Person` SET `resource_person_name` = ?, `resource_person_address` = ?, `resource_person_contact` = ?, `resource_person_village_id` = ?, `resource_person_remark` = ? WHERE `Resource_Person`.`resource_person_id` = ? ";
            connection.query(sql, [resource_person_name, resource_person_address, resource_person_contact, resource_person_village_id, resource_person_remark, resource_person_id], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while editing record with id ' + resource_person_id);
                    console.log(err);
                    res.redirect('/resourceperson');
                }
                else {
                    req.flash('success', 'Successfully edited record with id ' + resource_person_id);
                    res.redirect('/resourceperson');
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
            res.redirect('/resourceperson');
        }
        else {
            var sql = "DELETE FROM `Resource_Person` WHERE resource_person_id IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while deleting the record!');
                    console.log(err);
                    res.redirect('/resourceperson');
                }
                else {
                    if (results.affectedRows > 0) {
                        if (results.affectedRows === 1) {
                            req.flash('success', 'Successfully deleted record with id ' + req.body.ids[0]);
                        }
                        else {
                            req.flash('success', 'Successfully deleted selected record!');
                        }
                        res.redirect('/resourceperson');
                    }
                    else {
                        req.flash('danger', 'Error while deleting the record!');
                        res.redirect('/resourceperson');
                    }
                }
            });
        }
    });
});

module.exports = router;
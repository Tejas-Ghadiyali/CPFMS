const express = require('express');
const router = express.Router();
const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

const field_mapping = {
    "join_date": "Join Date",
    "birth_date": "Birth Date",
    "heifer_date": "Heifer Date",
    "calwing_date": "Calwing Date",
    "issue_date": "Issue Date",
    "cancel_date": "Cancel Date",
    "death_date": "Death Date"
}

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
            req.flash('danger', 'Error while getting data from Master-Activity!');
            res.render('masters/activity_master/activity_master', {
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
            var sql1 = 'SELECT COUNT(*) as ahcount FROM `Activity_Master`';
            connection.query(sql1, (err, results) => {
                if (err) {
                    connection.release();
                    req.flash('danger', 'Error while getting count of Activity Master!');
                    console.log(err);
                    res.render('masters/activity_master/activity_master', {
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
                    var sql2 = "SELECT * FROM `Activity_Master` LIMIT ? , ?; SELECT (MAX(activity_num)+1) AS maxn FROM `Activity_Master`;";
                    var offset = (pagenum - 1) * entries_per_page;
                    connection.query(sql2, [offset, entries_per_page], (err, results) => {
                        connection.release();
                        if (err) {
                            req.flash('danger', 'Error while getting data from Master-Activity!');
                            console.log(err);
                            res.render('masters/activity_master/activity_master', {
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
                            /*
                            var data_to_hold = {};
                            for(data of results[0]) {
                                data_to_hold[data.activity_num] = data.remark;
                            }
                            console.log(data_to_hold);
                            */
                            res.render('masters/activity_master/activity_master', {
                                data: results[0],
                                activity_num: results[1][0].maxn,
                                field_mapping,
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
            req.flash('danger', 'Error in searching Master-Account Head!');
            res.redirect('/activity');
        }
        else {
            var ob = req.query;
            var searcht = '%' + ob['searchtext'].trim() + '%';
            var sql = "SELECT * FROM Activity Master";
            var flag = false;
            var arr = ['searchtext', 'activity_field', 'activity_amount', 'member_debit_amount', 'member_debit'];
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
            sql = sql + "; SELECT (MAX(activity_num)+1) AS maxn FROM `Activity_Master`;"
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash('danger', 'Error in searching Master-Activity with given parameters!');
                    res.redirect('/activity');
                }
                else {
                    res.render('masters/activity_master/activity_master_search', {
                        data: results[0],
                        activity_num: results[1][0].maxn,
                        field_mapping,
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
            req.flash('danger', 'Error in Adding Master-Activity!');
            console.log(err);
            res.redirect('/activity');
        }
        else {
            var { activity_id, activity_name, activity_amount, activity_field, remark, member_debit, member_debit_amount } = req.body;
            var sql = 'INSERT INTO `Activity_Master` (`activity_id`, `activity_name`, `activity_amount`, `activity_field`, `remark`, `member_debit`, `member_debit_amount`) VALUES (?, ?, ?, ?, ?, ?, ?)';
            connection.query(sql, [activity_id, activity_name, activity_amount, activity_field, remark, member_debit, member_debit_amount], (err, result) => {
                connection.release();
                if (err) {
                    console.log(err);
                    req.flash('danger', 'Error while adding account in Master-Activity!');
                    res.redirect('/activity');
                }
                else {
                    req.flash('success', 'Activity with Id ' + activity_id + ' added.');
                    res.redirect('/activity');
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
            res.redirect('/activity');
        }
        else {
            var { activity_id, activity_name, activity_amount, activity_field, remark, member_debit, member_debit_amount, activity_num } = req.body;
            var sql = " UPDATE `Activity_Master` SET `activity_id` = ?, `activity_name` = ?, `activity_amount` = ?, `activity_field` = ?, `remark` = ?, `member_debit` = ?, `member_debit_amount` = ? WHERE `Activity_Master`.`activity_num` = ? ";
            connection.query(sql, [activity_id, activity_name, activity_amount, activity_field, remark, member_debit, member_debit_amount, activity_num], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while editing record with id ' + activity_id);
                    console.log(err);
                    res.redirect('/activity');
                }
                else {
                    req.flash('success', 'Successfully edited record with id ' + activity_id);
                    res.redirect('/activity');
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
            res.redirect('/activity');
        }
        else {
            var sql = "DELETE FROM `Activity_Master` WHERE activity_num IN (?)";
            connection.query(sql, [req.body.ids], (err, results) => {
                connection.release();
                if (err) {
                    req.flash('danger', 'Error while deleting the record!');
                    console.log(err);
                    res.redirect('/activity');
                }
                else {
                    if (results.affectedRows > 0) {
                        if (results.affectedRows === 1) {
                            req.flash('success', 'Successfully deleted record with id ' + req.body.ids[0]);
                        }
                        else {
                            req.flash('success', 'Successfully deleted selected records!');
                        }
                        res.redirect('/activity');
                    }
                    else {
                        req.flash('danger', 'Error while deleting the record!');
                        res.redirect('/activity');
                    }
                }
            });
        }
    });
});

module.exports = router;
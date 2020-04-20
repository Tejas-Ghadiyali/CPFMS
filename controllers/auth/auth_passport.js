const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const getConnection = require('../../connection');

passport.serializeUser((user, done) => {
    done(null, user.user_id);
});

passport.deserializeUser((userid, done) => {
    getConnection((err, connection) => {
        if (err) {
            done(err);
        }
        else {
            var sql = "SELECT * FROM `User` WHERE user_id = ? LIMIT 1";
            connection.query(sql, userid, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    done(err);
                }
                else {
                    var usedinfo = {
                        user_id: results[0].user_id,
                        user_name: results[0].user_name,
                        user_type: results[0].user_type,
                        active: results[0].active
                    }
                    done(null, usedinfo);
                }
            });
        }
    });
});

passport.use(new LocalStrategy(
    (username, password, done) => {
        getConnection((err, connection) => {
            if (err) {
                console.log('connection ',err);
                done(err);
            }
            else {
                var sql = "SELECT * FROM `User` WHERE user_id = ? LIMIT 1";
                connection.query(sql, username, (err, results) => {
                    connection.release();
                    if (err) {
                        console.log('Query ERROR !');
                        done(err);
                    }
                    else {
                        /*
                        bcrypt.compare(password, results[0].password, (berr, res) => {
                            if (res === true) {
                                done(null, results[0]);
                            }
                            else {
                                done(null, false);
                            }
                        });
                        */
                        if (results.length != 1) {
                            done(null, false);
                        }
                        else if (results[0].password === password) {
                            done(null, results[0]);
                        }
                        else {
                            done(null, false);
                        }
                    }
                });
            }
        });
    }
));
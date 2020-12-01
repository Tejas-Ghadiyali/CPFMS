const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('./auth_middleware');

router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/loginfailed' }), (req, res) => {
    res.redirect('/');
});

router.get('/logout', middleware.loggedin, (req, res) => {
    req.logout();
    res.redirect('/login');
});

router.get('/loginfailed', (req, res) => {
    req.flash('danger', 'Username or Password is Wrong !');
    res.redirect('/login');
});

router.get('/loggedouttotimeout', middleware.loggedin, (req, res) => {
    req.flash('danger', 'Logged out due to ideal timeout !');
    req.logout();
    res.redirect('/login');
});

module.exports = router;
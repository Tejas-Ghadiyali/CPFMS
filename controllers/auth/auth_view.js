const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('auth/login', {
        flash: res.locals.flash
    });
});

module.exports = router;
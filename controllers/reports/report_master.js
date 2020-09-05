const express = require('express');
const router = express.Router();
//const getConnection = require('../../connection');
const middleware = require('../auth/auth_middleware');

router.get('/accounthead', middleware.loggedin_as_superuser, (req, res) => {
   res.render('reports/account_head_report');
});

module.exports = router;
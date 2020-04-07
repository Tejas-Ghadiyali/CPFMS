const express = require('express');
const router = express.Router();
const getConnection = require('../connection');

router.get('/', (req, res) => {
    getConnection((err, connection) => {
        if (err)
        {
            console.log(err);
        }
        else
        {
            console.log(connection.threadId);
            var sql = 'SELECT * from `Account_Head`'
            connection.query(sql, (err, results) => {
                connection.release();
                if (err)
                {                    
                    console.log(err);
                }
                else
                {                 
                    res.render('account_head', {
                        data : results
                    });
                }
            })    
        }
    });
});

router.post('/', (req, res) => {
    getConnection((err, connection) => {
        if (err)
        {
            console.log(err);
        }
        else
        {
            console.log(connection.threadId);
            var { account_id, account_name, account_type, is_society, village_id } = req.body;
            var sql = 'INSERT INTO `Account_Head` (`account_id`, `account_name`, `account_type`, `is_society`, `village_id`) VALUES (?, ?, ?, ?, ?)'
            connection.query(sql, [account_id,account_name,account_type,is_society,village_id], (err, result) => {
                    connection.release();
                    if (err)
                    {                       
                        console.log(err);
                    }
                    else
                    {
                        res.redirect('/accounthead');
                    }
            });
        }
    });
});

router.put('/', (req, res) => {
    getConnection((err, connection) => {
        if (err)
        {
            console.log(err);    
        }
        else
        {
            var { account_id, account_name, account_type, is_society, village_id } = req.body;
            var sql = " UPDATE `Account_Head` SET `account_name` = ?, `account_type` = ?, `is_society` = ?, `village_id` = ? WHERE `Account_Head`.`account_id` = ? ";
            connection.query(sql, [account_name, account_type, is_society, village_id, account_id], (err, results) => {
                connection.release();
                if (err)
                {
                    console.log(err);
                }
                else
                {
                    res.redirect('/accounthead');
                }
            });
        }
    })
})

module.exports = router;
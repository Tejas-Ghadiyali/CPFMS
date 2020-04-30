run = (db) => {
    console.log("Creating Sub Account Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `Sub_Account` (`sub_account_id` VARCHAR(10) NOT NULL,`sub_account_name` VARCHAR(50) NOT NULL,`sub_account_address` VARCHAR(100),`sub_account_remark` VARCHAR(100),PRIMARY KEY (`sub_account_id`))";
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating Sub Account!!!");
            throw err;
        }
        console.log("Sub Account Table Successfully Created...");
    });
}

module.exports = run;
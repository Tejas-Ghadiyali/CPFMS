run = (db) => {
    console.log("Creating User Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `User` (`user_id` VARCHAR(10) NOT NULL,`user_name` VARCHAR(50) NOT NULL,`user_type` VARCHAR(10) NOT NULL,`password` VARCHAR(60) NOT NULL,`active` TINYINT(1) NOT NULL,PRIMARY KEY (`user_id`));"
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating User Table!!!");
            throw err;
        }
        console.log("User Table Successfully Created...");
    });
}

module.exports = run;
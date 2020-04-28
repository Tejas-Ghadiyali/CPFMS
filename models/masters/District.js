run = (db) => {
    console.log("Creating District Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `District` (`district_id` VARCHAR(10) NOT NULL,`district_name` VARCHAR(30) NOT NULL,PRIMARY KEY (`district_id`));"
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating District Table!!!");
            throw err;
        }
        console.log("District Table Successfully Created...");
    });
}

module.exports = run;
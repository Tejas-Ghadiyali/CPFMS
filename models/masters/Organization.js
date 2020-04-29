run = (db) => {
    console.log("Creating Organization Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `Organization` (`organization_id` VARCHAR(10) NOT NULL,`organization_name` VARCHAR(50) NOT NULL,PRIMARY KEY (`organization_id`));"
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating Organization Table!!!");
            throw err;
        }
        console.log("Organization Table Successfully Created...");
    });
}

module.exports = run;
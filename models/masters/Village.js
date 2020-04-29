run = (db) => {
    console.log("Creating Village Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `Village` (`village_id` VARCHAR(10) NOT NULL,`village_name` VARCHAR(30) NOT NULL,`taluka_id` VARCHAR(10) NOT NULL, PRIMARY KEY (`village_id`));"
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating Village Table!!!");
            throw err;
        }
        console.log("Village Table Successfully Created...");
    });
}

module.exports = run;
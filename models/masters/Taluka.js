run = (db) => {
    console.log("Creating Taluka Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `Taluka`(`taluka_id` VARCHAR(10) NOT NULL,`taluka_name` VARCHAR(30) NOT NULL,`district_id` VARCHAR(10) NOT NULL,PRIMARY KEY (`taluka_id`));"
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating Taluka Table!!!");
            throw err;
        }
        console.log("Taluka Table Successfully Created...");
    });
}

module.exports = run;
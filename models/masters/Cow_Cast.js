run = (db) => {
    console.log("Creating Cow Cast Table...")
    const crquery = "CREATE TABLE IF NOT EXISTS `Cow_Cast` (`cow_cast_id` VARCHAR(10) NOT NULL,`cow_cast_name` VARCHAR(50) NOT NULL,PRIMARY KEY (`cow_cast_id`));"
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating Cow Cast Table!!!");
            throw err;
        }
        console.log("Cow Cast Table Successfully Created...");
    });
}

module.exports = run;
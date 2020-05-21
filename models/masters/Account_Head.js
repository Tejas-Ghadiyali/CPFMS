run = (db) => {
    console.log("Creating Accout Head Table...")
    const crquery = `
                    CREATE TABLE IF NOT EXISTS 'Account_Head'(
                        'account_id' VARCHAR(10) NOT NULL,
                        'account_name' VARCHAR(50) NOT NULL,
                        'account_type' CHAR(3) NOT NULL,
                        'is_society' BOOLEAN NOT NULL,
                        'village_id' VARCHAR(10) NOT NULL,
                        PRIMARY KEY ('account_id')
                    );
                    `;
    db.query(crquery, (err, result) => {
        if (err) {
            console.log("Error while creating Account Head!!!");
            throw err;
        }
        console.log("Account Head Table Successfully Created...");
    });
}

module.exports = run;
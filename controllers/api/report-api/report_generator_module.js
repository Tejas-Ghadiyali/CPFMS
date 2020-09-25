const request = require('request');

const generator = (data, templateName, done) => {
    const report_data = {
        template: {
            name: templateName
        },
        data,
        options: {
            reports: {
                save: true,
                public: true
            }
        }
    }
    const options = {
        headers: {
            'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
            'Content-Type': 'application/json'
        },
        uri: 'http://localhost:8001/api/report',
        method: 'POST',
        json: report_data
    }
    request(options, (err, res) => {
        if (err) {
            console.log("Error : ", err);
            done(err);
        }
        else {
            done(null,res);
        }
    });
}


module.exports = generator;
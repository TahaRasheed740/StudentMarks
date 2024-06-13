var mysql = require("mysql");


var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Football.15",
    database: "StudentMarksDB"
});

module.exports = connection;


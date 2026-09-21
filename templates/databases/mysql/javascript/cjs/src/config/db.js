const mysql = require("mysql2/promise");
const { DATABASE_URL } = require("./env");

const pool = mysql.createPool(DATABASE_URL);

console.log("MySQL pool created");

module.exports = pool;

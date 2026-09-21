const Database = require("better-sqlite3");
const { DATABASE_URL } = require("./env");

const db = new Database(DATABASE_URL || "dev.db");
console.log("SQLite connected");

module.exports = db;

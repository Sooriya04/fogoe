const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { DATABASE_URL } = require("./env");

const pool = new Pool({
  connectionString: DATABASE_URL || "postgresql://postgres:password@localhost:5432/mydb",
});

const db = drizzle(pool);

module.exports = db;

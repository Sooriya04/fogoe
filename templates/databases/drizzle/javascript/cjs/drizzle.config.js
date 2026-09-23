const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  schema: "./src/models/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/mydb",
  },
});

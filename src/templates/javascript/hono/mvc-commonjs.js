const server = `
require("dotenv").config();
const app = require("./app");
const { serve } = require("@hono/node-server");
const { PORT } = require("./config/env");

console.log(\`Server running on http://localhost:\${PORT}\`);

serve({
  fetch: app.fetch,
  port: PORT
});
`.trim();

const app = `
const { Hono } = require("hono");
const { cors } = require("hono/cors");
const homeRoutes = require("./routes/home");

const app = new Hono();

app.use("*", cors());
app.route("/", homeRoutes);

module.exports = app;
`.trim();

const homeRoute = `
const { Hono } = require("hono");
const homeController = require("../controllers/homecontroller");

const router = new Hono();
router.get("/", homeController.home);

module.exports = router;
`.trim();

const homeController = `
function home(c) {
  return c.text("Fogoe running");
}

module.exports = { home };
`.trim();

const authMiddleware = `
const jwt = require("jsonwebtoken");

// Import jsonwebtoken
module.exports = jwt;
`.trim();

const helper = `
// Helper functions placeholder
module.exports = {};
`.trim();

const envConfig = `
require("dotenv").config();

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  DATABASE_URL: process.env.DATABASE_URL || ""
};
`.trim();

const envFile = `
PORT=3000
JWT_SECRET=dev-secret
DATABASE_URL=
`.trim();

const databases = {
  mongodb: {
    dbConfig: `
const mongoose = require("mongoose");
const { DATABASE_URL } = require("./env");

mongoose.connect(DATABASE_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

module.exports = mongoose;
`.trim(),
    model: `
const mongoose = require("mongoose");

// Import mongoose - add your schemas here
module.exports = mongoose;
`.trim()
  },
  prisma: {
    dbConfig: `
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
`.trim(),
    model: `
const prisma = require("../config/db");

// Import Prisma client
module.exports = prisma;
`.trim(),
    schema: `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`.trim()
  },
  mysql: {
    dbConfig: `
const mysql = require("mysql2/promise");
const { DATABASE_URL } = require("./env");

const pool = mysql.createPool(DATABASE_URL);

console.log("MySQL pool created");

module.exports = pool;
`.trim(),
    model: `
const pool = require("../config/db");

// Import MySQL pool
module.exports = pool;
`.trim()
  },
  postgresql: {
    dbConfig: `
const { Pool } = require("pg");
const { DATABASE_URL } = require("./env");

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("connect", () => console.log("PostgreSQL connected"));

module.exports = pool;
`.trim(),
    model: `
const pool = require("../config/db");

// Import PostgreSQL pool
module.exports = pool;
`.trim()
  },
  none: {
    dbConfig: `
// No database selected
module.exports = {};
`.trim(),
    model: `
// No database selected
module.exports = {};
`.trim()
  }
};

const hashing = {
  bcrypt: `
const bcrypt = require("bcrypt");

// Import bcrypt
module.exports = bcrypt;
`.trim(),
  argon2: `
const argon2 = require("argon2");

// Import argon2
module.exports = argon2;
`.trim(),
  crypto: `
const crypto = require("crypto");

// Import crypto
module.exports = crypto;
`.trim()
};

module.exports = {
  server,
  app,
  homeRoute,
  homeController,
  authMiddleware,
  helper,
  envConfig,
  envFile,
  databases,
  hashing
};

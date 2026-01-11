// Fastify CommonJS MVC Templates
// All templates in one file - databases + hashing included

// ========== CORE TEMPLATES ==========

const server = `
require("dotenv").config();

const app = require("./app");
const { PORT } = require("./config/env");

app.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
`.trim();

const app = `
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const homeRoutes = require("./routes/home");

const fastify = Fastify();

fastify.register(cors);
fastify.register(homeRoutes);

module.exports = fastify;
`.trim();

const homeRoute = `
const homeController = require("../controllers/homecontroller");

async function homeRoutes(fastify, options) {
  fastify.get("/", homeController.home);
}

module.exports = homeRoutes;
`.trim();

const homeController = `
async function home(req, res) {
  res.type("text/plain").send("Fogoe running");
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
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  DATABASE_URL: process.env.DATABASE_URL || ""
};
`.trim();

const envFile = `
PORT=3000
JWT_SECRET=dev-secret
DATABASE_URL=
`.trim();

// ========== DATABASE TEMPLATES ==========

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

// ========== HASHING TEMPLATES ==========

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

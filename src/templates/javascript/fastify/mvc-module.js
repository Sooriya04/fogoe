// Fastify ES Module MVC Templates
// All templates in one file - databases + hashing included

// ========== CORE TEMPLATES ==========

const server = `
import "dotenv/config";

import app from "./app.js";
import { PORT } from "./config/env.js";

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(\`Server running on http://localhost:\${PORT}\`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
`.trim();

const app = `
import Fastify from "fastify";
import cors from "@fastify/cors";
import homeRoutes from "./routes/home.js";

const fastify = Fastify();

await fastify.register(cors);
await fastify.register(homeRoutes);

export default fastify;
`.trim();

const homeRoute = `
import { home } from "../controllers/homecontroller.js";

export default async function homeRoutes(fastify, options) {
  fastify.get("/", home);
}
`.trim();

const homeController = `
export async function home(req, res) {
  res.send("Fogoe running");
}
`.trim();

const authMiddleware = `
import jwt from "jsonwebtoken";

// Import jsonwebtoken
export default jwt;
`.trim();

const helper = `
// Helper functions placeholder
export default {};
`.trim();

const envConfig = `
import "dotenv/config";

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const DATABASE_URL = process.env.DATABASE_URL || "";
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
import mongoose from "mongoose";
import { DATABASE_URL } from "./env.js";

mongoose.connect(DATABASE_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

export default mongoose;
`.trim(),
    model: `
import mongoose from "mongoose";

// Import mongoose - add your schemas here
export default mongoose;
`.trim()
  },
  prisma: {
    dbConfig: `
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
`.trim(),
    model: `
import prisma from "../config/db.js";

// Import Prisma client
export default prisma;
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
import mysql from "mysql2/promise";
import { DATABASE_URL } from "./env.js";

const pool = mysql.createPool(DATABASE_URL);

console.log("✅ MySQL pool created");

export default pool;
`.trim(),
    model: `
import pool from "../config/db.js";

// Import MySQL pool
export default pool;
`.trim()
  },
  postgresql: {
    dbConfig: `
import pg from "pg";
const { Pool } = pg;
import { DATABASE_URL } from "./env.js";

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("connect", () => console.log("✅ PostgreSQL connected"));

export default pool;
`.trim(),
    model: `
import pool from "../config/db.js";

// Import PostgreSQL pool
export default pool;
`.trim()
  },
  none: {
    dbConfig: `
// No database selected
export default {};
`.trim(),
    model: `
// No database selected
export default {};
`.trim()
  }
};

// ========== HASHING TEMPLATES ==========

const hashing = {
  bcrypt: `
import bcrypt from "bcrypt";

// Import bcrypt
export default bcrypt;
`.trim(),
  argon2: `
import argon2 from "argon2";

// Import argon2
export default argon2;
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

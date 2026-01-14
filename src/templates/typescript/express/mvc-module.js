// Express ES Module MVC TypeScript Templates
// All templates in one file - databases + hashing included

// ========== CORE TEMPLATES ==========

const server = `
import "dotenv/config";

import app from "./app.js";
import { PORT } from "./config/env.js";

app.listen(PORT, (): void => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`.trim();

const app = `
import express, { Application } from "express";
import cors from "cors";
import homeRoutes from "./routes/home.js";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use("/", homeRoutes);

export default app;
`.trim();

const homeRoute = `
import express, { Router } from "express";
import { home } from "../controllers/homecontroller.js";

const router: Router = express.Router();

router.get("/", home);

export default router;
`.trim();

const homeController = `
import { Request, Response } from "express";

export function home(_req: Request, res: Response): void {
  res.send("Fogoe running");
}
`.trim();

const authMiddleware = `
import jwt from "jsonwebtoken";

export default jwt;
`.trim();

const helper = `
// Helper functions placeholder
export default {};
`.trim();

const envConfig = `
import "dotenv/config";

export const PORT = Number(process.env.PORT) || 3000;
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
  .then((): void => console.log("MongoDB connected"))
  .catch((err): void => console.error("MongoDB error:", err));

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

console.log("MySQL pool created");

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

pool.on("connect", (): void => console.log("PostgreSQL connected"));

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
`.trim(),
    crypto: `
import crypto from "crypto";

// Import crypto
export default crypto;
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

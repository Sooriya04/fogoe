// Express CommonJS MVC TypeScript Templates
// All templates in one file - databases + hashing included

// ========== CORE TEMPLATES ==========

const server = `
import "dotenv/config";

import app from "./app";
import { PORT } from "./config/env";

app.listen(PORT, (): void => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`.trim();

const app = `
import express, { Application } from "express";
import cors from "cors";
import homeRoutes from "./routes/home";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use("/", homeRoutes);

export = app;
`.trim();

const homeRoute = `
import express, { Router } from "express";
import { home } from "../controllers/homecontroller";

const router: Router = express.Router();

router.get("/", home);

export = router;
`.trim();

const homeController = `
import { Request, Response } from "express";

export function home(_req: Request, res: Response): void {
  res.send("Fogoe running");
}
`.trim();

const authMiddleware = `
import jwt from "jsonwebtoken";

export = jwt;
`.trim();

const helper = `
// Helper functions placeholder
export = {};
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
import { DATABASE_URL } from "./env";

mongoose.connect(DATABASE_URL)
  .then((): void => console.log("MongoDB connected"))
  .catch((err): void => console.error("MongoDB error:", err));

export = mongoose;
`.trim(),
        model: `
import mongoose from "mongoose";

// Import mongoose - add your schemas here
export = mongoose;
`.trim()
    },
    prisma: {
        dbConfig: `
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export = prisma;
`.trim(),
        model: `
import prisma from "../config/db";

// Import Prisma client
export = prisma;
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
import { DATABASE_URL } from "./env";

const pool = mysql.createPool(DATABASE_URL);

console.log("MySQL pool created");

export = pool;
`.trim(),
        model: `
import pool from "../config/db";

// Import MySQL pool
export = pool;
`.trim()
    },
    postgresql: {
        dbConfig: `
import { Pool } from "pg";
import { DATABASE_URL } from "./env";

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("connect", (): void => console.log("PostgreSQL connected"));

export = pool;
`.trim(),
        model: `
import pool from "../config/db";

// Import PostgreSQL pool
export = pool;
`.trim()
    },
    none: {
        dbConfig: `
// No database selected
export = {};
`.trim(),
        model: `
// No database selected
export = {};
`.trim()
    }
};

// ========== HASHING TEMPLATES ==========

const hashing = {
    bcrypt: `
import bcrypt from "bcrypt";

// Import bcrypt
export = bcrypt;
`.trim(),
    argon2: `
import argon2 from "argon2";

// Import argon2
export = argon2;
`.trim(),
    crypto: `
import crypto from "crypto";

// Import crypto
export = crypto;
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

// Fastify CommonJS MVC TypeScript Templates
// All templates in one file - databases + hashing included

// ========== CORE TEMPLATES ==========

const server = `
import "dotenv/config";

import app from "./app";
import { PORT } from "./config/env";

app.listen({ port: PORT, host: "0.0.0.0" })
  .then((): void => {
    console.log(\\\`Server running on http://localhost:\\\${PORT}\\\`);
  })
  .catch((err): void => {
    console.error(err);
    process.exit(1);
  });
`.trim();

const app = `
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import homeRoutes from "./routes/home";

const fastify: FastifyInstance = Fastify();

fastify.register(cors);
fastify.register(homeRoutes);

export = fastify;
`.trim();

const homeRoute = `
import { FastifyInstance } from "fastify";
import { home } from "../controllers/homecontroller";

async function homeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", home);
}

export = homeRoutes;
`.trim();

const homeController = `
import { FastifyRequest, FastifyReply } from "fastify";

export async function home(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.type("text/plain").send("Fogoe running");
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

export default {
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

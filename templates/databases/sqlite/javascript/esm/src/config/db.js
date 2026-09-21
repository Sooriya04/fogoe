import Database from "better-sqlite3";
import { DATABASE_URL } from "./env.js";

const db = new Database(DATABASE_URL || "dev.db");
console.log("SQLite connected");

export default db;

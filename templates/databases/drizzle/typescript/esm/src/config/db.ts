import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE_URL } from "./env.js";

const pool = new Pool({
  connectionString: DATABASE_URL || "postgresql://postgres:password@localhost:5432/mydb",
});

export const db = drizzle(pool);
export default db;

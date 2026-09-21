import { Pool } from "pg";
import { DATABASE_URL } from "./env.js";

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("connect", () => console.log("PostgreSQL connected"));

export default pool;

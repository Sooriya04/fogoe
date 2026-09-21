import mysql from "mysql2/promise";
import { DATABASE_URL } from "./env.js";

const pool = mysql.createPool(DATABASE_URL);

console.log("MySQL pool created");

export default pool;

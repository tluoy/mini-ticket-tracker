
import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

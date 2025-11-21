import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

console.log("[DB] Checking DATABASE_URL:", !!process.env.DATABASE_URL);
console.log("[DB] DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);

export const hasDatabase = !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;
let pool: pg.Pool | undefined;

if (hasDatabase) {
  try {
    console.log("[DB] Initializing PostgreSQL connection...");
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    db = drizzle(pool, { schema });
    
    console.log("[DB] PostgreSQL connection initialized");
  } catch (error) {
    console.error("[DB] Failed to initialize database connection:", error);
  }
} else {
  console.log("[DB] DATABASE_URL not available - using fallback storage");
}

export { db, pool };

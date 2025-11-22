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
    
    // Parse DATABASE_URL to check if it's Neon (neon.tech)
    const isNeon = process.env.DATABASE_URL?.includes('neon.tech') || false;
    
    // Configure pool with proper settings for Neon and other providers
    // Neon has specific requirements: connections can be terminated, need smaller pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      // SSL configuration - Neon requires SSL, always enable for cloud databases
      ssl: isNeon || process.env.DATABASE_URL?.includes('amazonaws.com') || 
           process.env.DATABASE_URL?.includes('supabase.co') ||
           process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
      // Connection pool settings optimized for Neon
      max: isNeon ? 5 : 10, // Neon free tier has lower connection limits
      min: 0, // Don't keep minimum connections (Neon terminates idle connections)
      idleTimeoutMillis: isNeon ? 10000 : 30000, // Shorter timeout for Neon (10s)
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
      // Handle connection errors
      allowExitOnIdle: false, // Don't exit when pool is idle
    });
    
    // Handle pool errors gracefully - Neon terminates connections frequently
    pool.on('error', (err: any, client) => {
      // Ignore connection termination errors from Neon (57P01)
      if (err.code === '57P01' || err.message?.includes('terminating connection')) {
        // This is expected with Neon - connections get terminated by admin
        // The pool will automatically create new connections when needed
        return;
      }
      console.error('[DB] Unexpected error on idle client:', err.message || err);
      // Don't crash the app, just log the error
    });
    
    // Handle connection termination gracefully
    pool.on('connect', (client) => {
      // Set up error handler for this specific client
      client.on('error', (err: any) => {
        // Ignore termination errors from Neon
        if (err.code === '57P01' || err.message?.includes('terminating connection')) {
          return;
        }
        console.error('[DB] Client error:', err.message || err);
      });
    });
    
    // Test the connection (but don't fail if it errors - Neon connections can be terminated)
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        // Don't log termination errors as they're expected with Neon
        if (err.code !== '57P01' && !err.message?.includes('terminating connection')) {
          console.error('[DB] Connection test failed:', err.message);
        }
      } else {
        console.log('[DB] Connection test successful');
      }
    });
    
    db = drizzle(pool, { schema });
    
    console.log('[DB] PostgreSQL connection initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database connection:', error);
    // Don't throw, allow fallback to in-memory storage
  }
} else {
  console.log("[DB] DATABASE_URL not available - using fallback storage");
}

export { db, pool };

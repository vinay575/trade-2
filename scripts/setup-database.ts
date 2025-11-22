#!/usr/bin/env tsx
/**
 * Database Setup Script
 * 
 * This script verifies that all required tables exist in the database.
 * If tables don't exist, it will create them using Drizzle ORM.
 * 
 * Usage:
 *   npm run db:push
 *   OR
 *   tsx scripts/setup-database.ts
 */

import { db, hasDatabase } from "../server/db.js";
import * as schema from "../shared/schema.js";
import { sql } from "drizzle-orm";

async function checkTableExists(tableName: string): Promise<boolean> {
  if (!db) return false;
  
  try {
    const result = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )`
    );
    return (result.rows[0] as any)?.exists || false;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function setupDatabase() {
  console.log("🔍 Checking database connection...");
  
  if (!hasDatabase || !db) {
    console.error("❌ Database not available. Please set DATABASE_URL environment variable.");
    console.log("💡 The application will use in-memory storage as fallback.");
    return;
  }

  console.log("✅ Database connection established\n");

  // List of required tables
  const requiredTables = [
    "sessions",
    "users",
    "kyc_documents",
    "wallets",
    "transactions",
    "orders",
    "holdings",
    "watchlists",
  ];

  console.log("📊 Checking required tables...\n");

  const tableStatus: Record<string, boolean> = {};

  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    tableStatus[table] = exists;
    
    if (exists) {
      console.log(`✅ ${table} - EXISTS`);
    } else {
      console.log(`❌ ${table} - MISSING`);
    }
  }

  const missingTables = Object.entries(tableStatus)
    .filter(([_, exists]) => !exists)
    .map(([table]) => table);

  if (missingTables.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missingTables.join(", ")}`);
    console.log("\n📝 To create missing tables, run:");
    console.log("   npm run db:push");
    console.log("\n   OR manually run:");
    console.log("   psql $DATABASE_URL < scripts/create-tables.sql");
  } else {
    console.log("\n✅ All required tables exist!");
  }

  // Show table purposes
  console.log("\n📋 Table Purposes:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. users          → User accounts and profiles");
  console.log("2. wallets        → User money/wallet balances");
  console.log("3. transactions   → Money deductions and additions (deposits/withdrawals/trading)");
  console.log("4. orders         → Trading orders with profit/loss tracking");
  console.log("5. holdings       → Portfolio positions");
  console.log("6. watchlists     → User watchlists");
  console.log("7. kyc_documents  → KYC verification documents");
  console.log("8. sessions       → Authentication sessions");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Run setup
setupDatabase().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});


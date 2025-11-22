import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.error("\n❌ DATABASE_URL environment variable is not set!\n");
  console.log("📝 To set up your database:\n");
  console.log("1. Create a .env file in the root directory");
  console.log("2. Add your DATABASE_URL:");
  console.log("   DATABASE_URL=postgresql://user:password@host:port/database\n");
  console.log("   OR copy from server/env.example:\n");
  console.log("   cp server/env.example .env\n");
  console.log("3. Edit .env and update DATABASE_URL with your database credentials\n");
  console.log("💡 If you don't have a database yet:");
  console.log("   - Use Neon (neon.tech) for free PostgreSQL");
  console.log("   - Or use any PostgreSQL database\n");
  throw new Error("DATABASE_URL is required. See instructions above.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

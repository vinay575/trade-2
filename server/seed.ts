import { db } from "./db";
import { users, wallets } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seed() {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    console.log("Starting database seed...");

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    // Create admin user
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@tradex.com"));
    if (!admin) {
      const adminId = randomUUID();
      await db.insert(users).values({
        id: adminId,
        email: "admin@tradex.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      });
      await db.insert(wallets).values({
        id: randomUUID(),
        userId: adminId,
        balance: "100000.00",
        currency: "USD",
      });
      console.log("✓ Admin user created:");
      console.log("  Email: admin@tradex.com");
      console.log("  Password: admin123");
      console.log("✓ Admin wallet created with $100,000 balance");
    } else {
      console.log("ℹ Admin user already exists");
    }

    // Create regular user
    const [user] = await db.select().from(users).where(eq(users.email, "user@tradex.com"));
    if (!user) {
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        email: "user@tradex.com",
        password: userPassword,
        firstName: "John",
        lastName: "Trader",
        role: "user",
      });
      await db.insert(wallets).values({
        id: randomUUID(),
        userId,
        balance: "50000.00",
        currency: "USD",
      });
      console.log("✓ Regular user created:");
      console.log("  Email: user@tradex.com");
      console.log("  Password: user123");
      console.log("✓ User wallet created with $50,000 balance");
    } else {
      console.log("ℹ Regular user already exists");
    }

    console.log("\n✓ Database seed completed successfully!");
    console.log("\nTest Credentials:");
    console.log("═══════════════════════════════════");
    console.log("Admin:");
    console.log("  Email: admin@tradex.com");
    console.log("  Password: admin123");
    console.log("\nUser:");
    console.log("  Email: user@tradex.com");
    console.log("  Password: user123");
    console.log("═══════════════════════════════════");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
  process.exit(0);
}

seed();

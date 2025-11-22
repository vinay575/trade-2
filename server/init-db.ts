import { db, hasDatabase } from "./db";
import bcrypt from "bcryptjs";
import { users, wallets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { storage } from "./storage";

export async function initializeDatabase() {
  if (!hasDatabase || !db) {
    console.log("Database not available - seeding in-memory storage with test users");
    await seedInMemoryStorage();
    return;
  }

  try {
    console.log("Database connection ready. Ensure schema migrations were applied before booting.");

    const adminEmail = "admin@tradex.com";
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminId = randomUUID();
      await db.insert(users).values({
        id: adminId,
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      });

      await db.insert(wallets).values({
        id: randomUUID(),
        userId: adminId,
        balance: "0",
        currency: "USD",
      });

      console.log("✓ Admin user created: admin@tradex.com / admin123");
    }

    const userEmail = "user@tradex.com";
    const [existingUser] = await db.select().from(users).where(eq(users.email, userEmail));

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("user123", 10);
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        email: userEmail,
        password: hashedPassword,
        firstName: "John",
        lastName: "Trader",
        role: "user",
      });

      await db.insert(wallets).values({
        id: randomUUID(),
        userId,
        balance: "0",
        currency: "USD",
      });

      console.log("✓ Test user created: user@tradex.com / user123");
    }

  } catch (error: any) {
    console.error("Error initializing database:", error);
  }
}

async function seedInMemoryStorage() {
  try {
    const adminEmail = "admin@tradex.com";
    const existingAdmin = await storage.getUserByEmail(adminEmail);

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminId = randomUUID();
      const adminUser = await storage.createUser({
        id: adminId,
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      });

      await storage.createWallet({
        userId: adminId,
        balance: "0",
        currency: "USD",
      });

      console.log("✓ Admin user created in memory: admin@tradex.com / admin123");
    } else {
      console.log("ℹ Admin user already exists in memory");
    }

    const userEmail = "user@tradex.com";
    const existingUser = await storage.getUserByEmail(userEmail);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("user123", 10);
      const userId = randomUUID();
      const regularUser = await storage.createUser({
        id: userId,
        email: userEmail,
        password: hashedPassword,
        firstName: "John",
        lastName: "Trader",
        role: "user",
      });

      await storage.createWallet({
        userId,
        balance: "0",
        currency: "USD",
      });

      console.log("✓ Test user created in memory: user@tradex.com / user123");
    } else {
      console.log("ℹ Test user already exists in memory");
    }

    console.log("\n✓ In-memory storage seeded successfully!");
    console.log("\nTest Credentials:");
    console.log("═══════════════════════════════════");
    console.log("Admin:");
    console.log("  Email: admin@tradex.com");
    console.log("  Password: admin123");
    console.log("\nUser:");
    console.log("  Email: user@tradex.com");
    console.log("  Password: user123");
    console.log("═══════════════════════════════════");
  } catch (error: any) {
    console.error("Error seeding in-memory storage:", error);
  }
}

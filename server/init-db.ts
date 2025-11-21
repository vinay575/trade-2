import { db, hasDatabase } from "./db";
import bcrypt from "bcryptjs";
import { users, wallets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function initializeDatabase() {
  if (!hasDatabase || !db) {
    console.log("Database not available, skipping initialization");
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
        balance: "100000",
        currency: "USD",
      });

      console.log("✓ Admin user created: admin@tradex.com / admin123 with $100,000 wallet");
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
        balance: "50000",
        currency: "USD",
      });

      console.log("✓ Test user created: user@tradex.com / user123 with $50,000 wallet");
    }

  } catch (error: any) {
    console.error("Error initializing database:", error);
  }
}

import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { signupSchema, loginSchema } from "@shared/schema";

export function setupEmailPasswordAuth(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        const firstError = result.error.errors[0];
        return res.status(400).json({
          message: firstError.message,
          field: firstError.path[0] as string,
        });
      }
      const parsed = result.data;
      
      const existingUser = await storage.getUserByEmail(parsed.email);
      if (existingUser && existingUser.password) {
        return res.status(400).json({ 
          message: "Email already registered",
          field: "email"
        });
      }

      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      
      const user = existingUser 
        ? await storage.upsertUser({
            id: existingUser.id,
            email: parsed.email,
            password: hashedPassword,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
          })
        : await storage.createUser({
            email: parsed.email,
            password: hashedPassword,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
          });

      (req.session as any).userId = user.id;

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.json({ user: userResponse });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ message: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        const firstError = result.error.errors[0];
        return res.status(400).json({
          message: firstError.message,
          field: firstError.path[0] as string,
        });
      }
      const parsed = result.data;
      
      const user = await storage.getUserByEmail(parsed.email);
      if (!user || !user.password) {
        return res.status(401).json({ 
          message: "Invalid email or password",
          field: "email"
        });
      }

      const isValidPassword = await bcrypt.compare(parsed.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: "Invalid email or password",
          field: "password"
        });
      }

      (req.session as any).userId = user.id;

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.json({ user: userResponse });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.json(userResponse);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any).userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).userId = userId;
  (req as any).user = user;
  next();
};

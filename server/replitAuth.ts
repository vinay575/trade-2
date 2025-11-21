import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { hasDatabase } from "./db";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  const useDatabaseSessions = hasDatabase && process.env.DATABASE_URL;

  if (useDatabaseSessions) {
    const PgSessionStore = connectPgSimple(session);
    
    sessionStore = new PgSessionStore({
      conString: process.env.DATABASE_URL!,
      tableName: "sessions",
      ttl: sessionTtl / 1000, // convert to seconds
      createTableIfMissing: false, // Sessions table already exists in schema
    });
  } else {
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: sessionTtl,
    });
  }
  
  // SESSION_SECRET is required for session security
  // In development, use a default if not set, but warn the user
  const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-change-in-production" : undefined);
  
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  
  if (process.env.NODE_ENV === "development" && !process.env.SESSION_SECRET) {
    console.warn("[WARNING] SESSION_SECRET not set. Using default dev secret. Set SESSION_SECRET in .env for production.");
  }
  
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // In development on http://localhost we must allow non-secure cookies
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only set up OIDC if REPL_ID is available and not empty
  const hasReplitAuth = process.env.REPL_ID && process.env.REPL_ID.trim() !== '' && process.env.REPL_ID !== 'local-dev';
  
  let config: client.Configuration | null = null;
  
  if (hasReplitAuth) {
    try {
      config = await getOidcConfig();
    } catch (error) {
      console.warn('[Auth] Failed to initialize OIDC config, Replit auth will be disabled:', error);
    }
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    if (!config) {
      throw new Error('OIDC config not available');
    }
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Only use Replit Auth if REPL_ID is set and we're in a Replit environment
    if (!hasReplitAuth || !config) {
      // Redirect to the frontend login page instead
      return res.redirect('/login');
    }
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    if (!hasReplitAuth || !config) {
      return res.redirect('/login');
    }
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    if (!hasReplitAuth || !config) {
      // Simple logout for non-Replit auth
      req.logout(() => {
        res.redirect('/');
      });
      return;
    }
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

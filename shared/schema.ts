import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  numeric,
  integer,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth and compatible with connect-pg-simple)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table (supports both OAuth and email/password auth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 512 }),
  role: varchar("role", { length: 32 }).notNull().default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users);
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// KYC Documents and Status
export const kycDocuments = pgTable("kyc_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, approved, rejected
  documentType: varchar("document_type", { length: 64 }).notNull(), // passport, driver_license, national_id
  documentUrl: text("document_url").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  rejectionReason: text("rejection_reason"),
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({ id: true, submittedAt: true });
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;

// Wallets
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 20, scale: 8 }).notNull().default("0"),
  currency: varchar("currency", { length: 16 }).notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Wallet Transactions (Deposits & Withdrawals)
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(), // deposit, withdrawal
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, completed, failed
  method: varchar("method", { length: 64 }), // upi, card, crypto, bank_transfer
  transactionHash: varchar("transaction_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Trading Orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 64 }).notNull(), // BTC/USD, ETH/USD, AAPL, etc.
  assetType: varchar("asset_type", { length: 32 }).notNull(), // crypto, stock, forex
  type: varchar("type", { length: 32 }).notNull(), // market, limit, stop
  side: varchar("side", { length: 16 }).notNull(), // buy, sell
  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
  price: numeric("price", { precision: 20, scale: 8 }),
  stopPrice: numeric("stop_price", { precision: 20, scale: 8 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, filled, partial, cancelled, rejected
  filledQuantity: numeric("filled_quantity", { precision: 20, scale: 8 }).default("0"),
  averagePrice: numeric("average_price", { precision: 20, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  executedAt: timestamp("executed_at"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, executedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Portfolio Holdings
export const holdings = pgTable(
  "holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 64 }).notNull(),
    assetType: varchar("asset_type", { length: 32 }).notNull(), // crypto, stock, forex
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    averageBuyPrice: numeric("average_buy_price", { precision: 20, scale: 8 }).notNull(),
    currentPrice: numeric("current_price", { precision: 20, scale: 8 }),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userSymbolIdx: uniqueIndex("idx_holdings_user_symbol").on(table.userId, table.symbol),
  }),
);

export const insertHoldingSchema = createInsertSchema(holdings).omit({ id: true, updatedAt: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdings.$inferSelect;

// Watchlists
export const watchlists = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 64 }).notNull(),
  assetType: varchar("asset_type", { length: 32 }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({ id: true, createdAt: true });
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  kycDocuments: many(kycDocuments),
  wallets: many(wallets),
  orders: many(orders),
  holdings: many(holdings),
  watchlists: many(watchlists),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  user: one(users, {
    fields: [holdings.userId],
    references: [users.id],
  }),
}));

export const watchlistsRelations = relations(watchlists, ({ one }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
}));

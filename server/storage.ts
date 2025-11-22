import {
  users,
  kycDocuments,
  wallets,
  transactions,
  orders,
  holdings,
  watchlists,
  type User,
  type UpsertUser,
  type KycDocument,
  type InsertKycDocument,
  type Wallet,
  type InsertWallet,
  type Transaction,
  type InsertTransaction,
  type Order,
  type InsertOrder,
  type Holding,
  type InsertHolding,
  type Watchlist,
  type InsertWatchlist,
} from "@shared/schema";
import { db, hasDatabase } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
};

// Helper function to retry database operations on connection errors
async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error that we should retry
      const isConnectionError = 
        error?.code === '57P01' || // Neon connection termination
        error?.message?.includes('terminating connection') ||
        error?.message?.includes('Connection terminated') ||
        error?.message?.includes('ENOTFOUND') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ECONNRESET';
      
      if (isConnectionError && attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        // Don't log Neon termination errors as they're expected
        if (error?.code !== '57P01') {
          console.warn(`[DB] Connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a connection error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError || new Error('Database operation failed after retries');
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  
  createKycDocument(doc: InsertKycDocument): Promise<KycDocument>;
  getKycDocumentsByUser(userId: string): Promise<KycDocument[]>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  updateKycStatus(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<KycDocument>;
  getPendingKycDocuments(): Promise<KycDocument[]>;
  
  getWalletByUser(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, newBalance: string): Promise<Wallet>;
  getAllWallets(): Promise<Wallet[]>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByWallet(walletId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateOrder(id: string, updates: Partial<Pick<Order, 'status' | 'closePrice' | 'profitLoss' | 'profitLossPercent' | 'closedAt'>>): Promise<Order>;
  
  getHoldingsByUser(userId: string): Promise<Holding[]>;
  upsertHolding(holding: InsertHolding): Promise<Holding>;
  
  getWatchlistByUser(userId: string): Promise<Watchlist[]>;
  addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const database = getDb();
    const [user] = await database.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const database = getDb();
    const [user] = await database.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const database = getDb();
    const record: UpsertUser = {
      ...userData,
      id: userData.id ?? randomUUID(),
    };
    await database.insert(users).values(record);
    const user = await this.getUser(record.id!);
    if (!user) {
      throw new Error("Unable to load created user");
    }
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const database = getDb();
    const record: UpsertUser = { ...userData };

    if (record.email && !record.id) {
      const existingByEmail = await this.getUserByEmail(record.email);
      if (existingByEmail) {
        record.id = existingByEmail.id;
      }
    }

    if (!record.id) {
      record.id = randomUUID();
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (record.password !== undefined) updateData.password = record.password;
    if (record.firstName !== undefined) updateData.firstName = record.firstName;
    if (record.lastName !== undefined) updateData.lastName = record.lastName;
    if (record.profileImageUrl !== undefined) updateData.profileImageUrl = record.profileImageUrl;
    if (record.role !== undefined) updateData.role = record.role;

    await database
      .insert(users)
      .values(record)
      .onConflictDoUpdate({
        target: users.id,
        set: updateData,
      });

    const user = await this.getUser(record.id);
    if (!user) {
      throw new Error("Unable to load upserted user");
    }
    return user;
  }

  async createKycDocument(doc: InsertKycDocument): Promise<KycDocument> {
    const database = getDb();
    const record: InsertKycDocument & { id: string } = {
      ...doc,
      id: (doc as any).id ?? randomUUID(),
    };
    await database.insert(kycDocuments).values(record);
    const [kycDoc] = await database.select().from(kycDocuments).where(eq(kycDocuments.id, record.id));
    if (!kycDoc) {
      throw new Error("Unable to load created KYC document");
    }
    return kycDoc;
  }

  async getKycDocumentsByUser(userId: string): Promise<KycDocument[]> {
    const database = getDb();
    return database.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
  }

  async updateKycStatus(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<KycDocument> {
    const database = getDb();
    await database
      .update(kycDocuments)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy,
        rejectionReason,
      })
      .where(eq(kycDocuments.id, id));
    const [updated] = await database.select().from(kycDocuments).where(eq(kycDocuments.id, id));
    if (!updated) {
      throw new Error("Unable to load updated KYC document");
    }
    return updated;
  }

  async getPendingKycDocuments(): Promise<KycDocument[]> {
    const database = getDb();
    return database.select().from(kycDocuments).where(eq(kycDocuments.status, "pending"));
  }

  async getWalletByUser(userId: string): Promise<Wallet | undefined> {
    const database = getDb();
    const [wallet] = await database.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const database = getDb();
    const record: InsertWallet & { id: string } = {
      ...wallet,
      id: (wallet as any).id ?? randomUUID(),
    };
    await database.insert(wallets).values(record);
    const [newWallet] = await database.select().from(wallets).where(eq(wallets.id, record.id));
    if (!newWallet) {
      throw new Error("Unable to load created wallet");
    }
    return newWallet;
  }

  async updateWalletBalance(userId: string, newBalance: string): Promise<Wallet> {
    const database = getDb();
    await database
      .update(wallets)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(wallets.userId, userId));
    const wallet = await this.getWalletByUser(userId);
    if (!wallet) {
      throw new Error("Wallet not found after update");
    }
    return wallet;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const database = getDb();
    const record: InsertTransaction & { id: string } = {
      ...transaction,
      id: (transaction as any).id ?? randomUUID(),
    };
    await database.insert(transactions).values(record);
    const [newTx] = await database.select().from(transactions).where(eq(transactions.id, record.id));
    if (!newTx) {
      throw new Error("Unable to load created transaction");
    }
    return newTx;
  }

  async getTransactionsByWallet(walletId: string): Promise<Transaction[]> {
    const database = getDb();
    return database
      .select()
      .from(transactions)
      .where(eq(transactions.walletId, walletId))
      .orderBy(desc(transactions.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const database = getDb();
    const record: InsertOrder & { id: string } = {
      ...order,
      id: (order as any).id ?? randomUUID(),
    };
    await database.insert(orders).values(record);
    const [newOrder] = await database.select().from(orders).where(eq(orders.id, record.id));
    if (!newOrder) {
      throw new Error("Unable to load created order");
    }
    return newOrder;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const database = getDb();
    return database
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const database = getDb();
    await database
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));
    const [updated] = await database.select().from(orders).where(eq(orders.id, id));
    if (!updated) {
      throw new Error("Unable to load updated order");
    }
    return updated;
  }

  async updateOrder(id: string, updates: Partial<Pick<Order, 'status' | 'closePrice' | 'profitLoss' | 'profitLossPercent' | 'closedAt'>>): Promise<Order> {
    const database = getDb();
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.closePrice !== undefined) updateData.closePrice = updates.closePrice;
    if (updates.profitLoss !== undefined) updateData.profitLoss = updates.profitLoss;
    if (updates.profitLossPercent !== undefined) updateData.profitLossPercent = updates.profitLossPercent;
    if (updates.closedAt !== undefined) updateData.closedAt = updates.closedAt;
    
    await database
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id));
    
    const [updated] = await database.select().from(orders).where(eq(orders.id, id));
    if (!updated) {
      throw new Error("Unable to load updated order");
    }
    return updated;
  }

  async getHoldingsByUser(userId: string): Promise<Holding[]> {
    const database = getDb();
    return database.select().from(holdings).where(eq(holdings.userId, userId));
  }

  async upsertHolding(holding: InsertHolding): Promise<Holding> {
    const database = getDb();
    await database
      .insert(holdings)
      .values(holding)
      .onConflictDoUpdate({
        target: [holdings.userId, holdings.symbol],
        set: {
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
          currentPrice: holding.currentPrice ?? null,
          updatedAt: new Date(),
        },
      });
    const [upserted] = await database
      .select()
      .from(holdings)
      .where(and(eq(holdings.userId, holding.userId), eq(holdings.symbol, holding.symbol)));
    if (!upserted) {
      throw new Error("Unable to load holding");
    }
    return upserted;
  }

  async getWatchlistByUser(userId: string): Promise<Watchlist[]> {
    const database = getDb();
    return database.select().from(watchlists).where(eq(watchlists.userId, userId));
  }

  async addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist> {
    const database = getDb();
    const record: InsertWatchlist & { id: string } = {
      ...watchlist,
      id: (watchlist as any).id ?? randomUUID(),
    };
    await database.insert(watchlists).values(record);
    const [added] = await database.select().from(watchlists).where(eq(watchlists.id, record.id));
    if (!added) {
      throw new Error("Unable to load created watchlist entry");
    }
    return added;
  }

  async removeFromWatchlist(id: string): Promise<void> {
    const database = getDb();
    await database.delete(watchlists).where(eq(watchlists.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    const database = getDb();
    return database.select().from(users);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const database = getDb();
    await database
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found after role update");
    }
    return user;
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    const database = getDb();
    return database.select().from(kycDocuments);
  }

  async getAllWallets(): Promise<Wallet[]> {
    const database = getDb();
    return database.select().from(wallets);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const database = getDb();
    return database.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    const database = getDb();
    return database.select().from(orders).orderBy(desc(orders.createdAt));
  }
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private kycDocs = new Map<string, KycDocument>();
  private wallets = new Map<string, Wallet>();
  private txs = new Map<string, Transaction>();
  private orders = new Map<string, Order>();
  private holdings = new Map<string, Holding>();
  private watchlists = new Map<string, Watchlist>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const userId = randomUUID();
    const user: User = {
      id: userId,
      email: userData.email!,
      password: userData.password ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role ?? "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingByEmail = userData.email ? await this.getUserByEmail(userData.email) : undefined;
    const userId = userData.id ?? existingByEmail?.id ?? randomUUID();
    const existing = this.users.get(userId);
    const user: User = {
      id: userId,
      email: userData.email!,
      password: userData.password ?? existing?.password ?? null,
      firstName: userData.firstName ?? existing?.firstName ?? null,
      lastName: userData.lastName ?? existing?.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? existing?.profileImageUrl ?? null,
      role: userData.role ?? existing?.role ?? "user",
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createKycDocument(doc: InsertKycDocument): Promise<KycDocument> {
    const kycDoc: KycDocument = {
      id: randomUUID(),
      userId: doc.userId,
      status: doc.status ?? "pending",
      documentType: doc.documentType,
      documentUrl: doc.documentUrl,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    };
    this.kycDocs.set(kycDoc.id, kycDoc);
    return kycDoc;
  }

  async getKycDocumentsByUser(userId: string): Promise<KycDocument[]> {
    return Array.from(this.kycDocs.values()).filter(doc => doc.userId === userId);
  }

  async updateKycStatus(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<KycDocument> {
    const doc = this.kycDocs.get(id);
    if (!doc) throw new Error("KYC document not found");
    const updated: KycDocument = {
      ...doc,
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewedBy ?? null,
      rejectionReason: rejectionReason ?? null,
    };
    this.kycDocs.set(id, updated);
    return updated;
  }

  async getPendingKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocs.values()).filter(doc => doc.status === "pending");
  }

  async getWalletByUser(userId: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(w => w.userId === userId);
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const newWallet: Wallet = {
      id: randomUUID(),
      userId: wallet.userId,
      balance: wallet.balance ?? "0",
      currency: wallet.currency ?? "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.wallets.set(newWallet.id, newWallet);
    return newWallet;
  }

  async updateWalletBalance(userId: string, newBalance: string): Promise<Wallet> {
    const wallet = Array.from(this.wallets.values()).find(w => w.userId === userId);
    if (!wallet) throw new Error("Wallet not found");
    const updated: Wallet = {
      ...wallet,
      balance: newBalance,
      updatedAt: new Date(),
    };
    this.wallets.set(wallet.id, updated);
    return updated;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTx: Transaction = {
      id: randomUUID(),
      walletId: transaction.walletId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status ?? "pending",
      method: transaction.method ?? null,
      transactionHash: transaction.transactionHash ?? null,
      createdAt: new Date(),
      completedAt: transaction.completedAt ?? null,
    };
    this.txs.set(newTx.id, newTx);
    return newTx;
  }

  async getTransactionsByWallet(walletId: string): Promise<Transaction[]> {
    return Array.from(this.txs.values())
      .filter(tx => tx.walletId === walletId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      id: randomUUID(),
      userId: order.userId,
      symbol: order.symbol,
      assetType: order.assetType,
      type: order.type,
      side: order.side,
      quantity: order.quantity,
      price: order.price ?? null,
      stopPrice: order.stopPrice ?? null,
      status: order.status ?? "pending",
      filledQuantity: order.filledQuantity ?? "0",
      averagePrice: order.averagePrice ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      executedAt: null,
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    const updated: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  async updateOrder(id: string, updates: Partial<Pick<Order, 'status' | 'closePrice' | 'profitLoss' | 'profitLossPercent' | 'closedAt'>>): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    const updated: Order = {
      ...order,
      ...updates,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  async getHoldingsByUser(userId: string): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(h => h.userId === userId);
  }

  async upsertHolding(holding: InsertHolding): Promise<Holding> {
    const existing = Array.from(this.holdings.values()).find(
      h => h.userId === holding.userId && h.symbol === holding.symbol
    );
    
    const upserted: Holding = {
      id: existing?.id ?? randomUUID(),
      ...holding,
      currentPrice: holding.currentPrice ?? null,
      updatedAt: new Date(),
    };
    this.holdings.set(upserted.id, upserted);
    return upserted;
  }

  async getWatchlistByUser(userId: string): Promise<Watchlist[]> {
    return Array.from(this.watchlists.values()).filter(w => w.userId === userId);
  }

  async addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist> {
    const added: Watchlist = {
      id: randomUUID(),
      userId: watchlist.userId,
      symbol: watchlist.symbol,
      assetType: watchlist.assetType,
      position: watchlist.position ?? 0,
      createdAt: new Date(),
    };
    this.watchlists.set(added.id, added);
    return added;
  }

  async removeFromWatchlist(id: string): Promise<void> {
    this.watchlists.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated: User = {
      ...user,
      role,
      updatedAt: new Date(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocs.values());
  }

  async getAllWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values());
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.txs.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

export const storage = hasDatabase && db ? new DatabaseStorage() : new MemStorage();

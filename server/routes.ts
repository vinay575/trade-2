import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupEmailPasswordAuth, requireAuth } from "./auth";
import { insertKycDocumentSchema, insertWalletSchema, insertTransactionSchema, insertOrderSchema, insertWatchlistSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  setupEmailPasswordAuth(app);

  // Yahoo Finance proxy endpoints (to avoid CORS issues)
  app.get('/api/yahoo/quote/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=false`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch quote: ${response.status}` });
      }
      
      const data = await response.json();
      // Allow caching for a short time to reduce server load
      res.setHeader('Cache-Control', 'public, max-age=5');
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching Yahoo Finance quote:", error);
      res.status(500).json({ error: error.message || "Failed to fetch quote" });
    }
  });

  app.get('/api/yahoo/candles/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const { interval = "1d", range = "1mo" } = req.query;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch candles: ${response.status}` });
      }
      
      const data = await response.json();
      // Allow caching for a short time to reduce server load
      res.setHeader('Cache-Control', 'public, max-age=5');
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching Yahoo Finance candles:", error);
      res.status(500).json({ error: error.message || "Failed to fetch candles" });
    }
  });

  // Financial news endpoint - uses RSS feeds from major financial sources
  app.get('/api/news/financial', async (req, res) => {
    try {
      const { category, limit = 20 } = req.query;
      
      // Use free RSS feeds from reliable financial news sources
      const categoryFeeds: Record<string, string[]> = {
        'all': [
          'https://www.cnbc.com/id/100003114/device/rss/rss.html', // CNBC Top News
          'https://www.ft.com/?format=rss', // Financial Times
        ],
        'crypto': [
          'https://cointelegraph.com/rss', // CoinTelegraph
        ],
        'stocks': [
          'https://www.cnbc.com/id/10000664/device/rss/rss.html', // CNBC Stocks
        ],
        'forex': [
          'https://www.cnbc.com/id/100727362/device/rss/rss.html', // CNBC Currencies
        ],
        'markets': [
          'https://www.cnbc.com/id/10000664/device/rss/rss.html', // CNBC Markets
        ]
      };
      
      const selectedCategory = (category as string)?.toLowerCase() || 'all';
      const feedUrl = categoryFeeds[selectedCategory]?.[0] || categoryFeeds['all'][0];
      
      // Fetch RSS feed
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
        }
      });
      
      if (!response.ok) {
        console.error('RSS feed error:', response.status);
        return res.json({ articles: [] });
      }
      
      const xmlText = await response.text();
      
      // Parse RSS XML (simple parsing for common RSS formats)
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      const articles = items.slice(0, parseInt(limit as string)).map((item, index) => {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Financial News Update';
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) : '';
        const url = linkMatch ? linkMatch[1] : '';
        
        // Calculate time ago
        let timeAgo = 'Recently';
        if (pubDateMatch) {
          try {
            const publishedDate = new Date(pubDateMatch[1]);
            const now = new Date();
            const diffMs = now.getTime() - publishedDate.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            timeAgo = diffHours < 1 ? 'Just now' : 
                      diffHours < 24 ? `${diffHours}h ago` :
                      `${Math.floor(diffHours / 24)}d ago`;
          } catch (e) {
            // Keep default timeAgo
          }
        }
        
        // Determine sentiment based on keywords
        const text = (title + ' ' + description).toLowerCase();
        const bullishWords = ['surge', 'gain', 'rise', 'rally', 'jump', 'soar', 'bullish', 'up'];
        const bearishWords = ['fall', 'drop', 'decline', 'plunge', 'crash', 'bearish', 'down'];
        
        const hasBullish = bullishWords.some(word => text.includes(word));
        const hasBearish = bearishWords.some(word => text.includes(word));
        
        const sentiment = hasBullish && !hasBearish ? 'bullish' :
                         hasBearish && !hasBullish ? 'bearish' : 'neutral';
        
        return {
          id: index + 1,
          title,
          summary: description,
          category: selectedCategory === 'all' ? 'Markets' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1),
          time: timeAgo,
          source: feedUrl.includes('cnbc') ? 'CNBC' : 
                 feedUrl.includes('ft.com') ? 'Financial Times' :
                 feedUrl.includes('cointelegraph') ? 'CoinTelegraph' : 'Financial News',
          sentiment,
          impact: hasBullish || hasBearish ? 'high' : 'medium',
          relatedAssets: [],
          url,
        };
      });
      
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({ articles });
    } catch (error: any) {
      console.error('Error fetching financial news:', error);
      // Return empty array instead of error to prevent UI breaking
      res.json({ articles: [] });
    }
  });

  app.get('/api/auth/user', async (req: any, res, next) => {
    try {
      // Check session-based auth (email/password)
      const sessionUserId = (req.session as any)?.userId;
      
      if (sessionUserId) {
        try {
          const user = await storage.getUser(sessionUserId);
          if (user) {
            return res.json(user);
          }
        } catch (error) {
          console.error("Error fetching user from session:", error);
          // Continue to check other auth methods
        }
      }
      
      // Check OIDC-based auth (Replit)
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        try {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          if (user) {
            return res.json(user);
          }
        } catch (error) {
          console.error("Error fetching user from OIDC:", error);
          return res.status(500).json({ message: "Failed to fetch user" });
        }
      }
      
      // Not authenticated
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error: any) {
      console.error("Unexpected error in /api/auth/user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const authMiddleware = (req: any, res: any, next: any) => {
    const sessionUserId = (req.session as any).userId;
    if (sessionUserId) {
      req.userId = sessionUserId;
      return next();
    }
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      req.userId = req.user.claims.sub;
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  const adminMiddleware = async (req: any, res: any, next: any) => {
    const sessionUserId = (req.session as any).userId;
    let userId = sessionUserId;
    
    if (!userId && req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      userId = req.user.claims.sub;
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      req.userId = userId;
      req.user = user;
      return next();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  app.post('/api/kyc/upload', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = insertKycDocumentSchema.parse({
        ...req.body,
        userId,
      });
      const kycDoc = await storage.createKycDocument(parsed);
      res.json(kycDoc);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/kyc/status/:userId', authMiddleware, async (req: any, res) => {
    try {
      const docs = await storage.getKycDocumentsByUser(req.params.userId);
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/wallet/topup', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { amount, method } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      let wallet = await storage.getWalletByUser(userId);
      
      if (!wallet) {
        wallet = await storage.createWallet({
          userId,
          balance: "0",
          currency: "USD",
        });
      }

      const transaction = await storage.createTransaction({
        walletId: wallet.id,
        type: "deposit",
        amount: amount.toString(),
        method: method || "upi",
        status: "completed",
      });

      const newBalance = (parseFloat(wallet.balance) + parseFloat(amount)).toString();
      const updatedWallet = await storage.updateWalletBalance(userId, newBalance);

      res.json({ transaction, wallet: updatedWallet });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/wallet/withdraw', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { amount, method } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const wallet = await storage.getWalletByUser(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (parseFloat(wallet.balance) < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const transaction = await storage.createTransaction({
        walletId: wallet.id,
        type: "withdrawal",
        amount: amount.toString(),
        method: method || "bank",
        status: "pending",
      });

      const newBalance = (parseFloat(wallet.balance) - parseFloat(amount)).toString();
      const updatedWallet = await storage.updateWalletBalance(userId, newBalance);

      res.json({ transaction, wallet: updatedWallet });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/wallet/ledger', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const wallet = await storage.getWalletByUser(userId);
      
      if (!wallet) {
        return res.json([]);
      }

      const transactions = await storage.getTransactionsByWallet(wallet.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/market/:type/ticker', async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }
      
      const yahooSymbol = symbol.replace('/', '-');
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d&includePrePost=false`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to fetch ticker data' });
      }
      
      const data = await response.json();
      const result = data.chart.result?.[0];
      const meta = result?.meta;
      
      if (!meta) {
        return res.status(404).json({ error: 'No data found for symbol' });
      }
      
      const price = meta.regularMarketPrice || 0;
      const previousClose = meta.regularMarketPreviousClose || price;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      
      res.json({
        symbol,
        price,
        change,
        changePercent,
        volume: meta.regularMarketVolume?.toLocaleString() || '0',
        high24h: meta.regularMarketDayHigh || price,
        low24h: meta.regularMarketDayLow || price,
      });
    } catch (error: any) {
      console.error('Error fetching ticker:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ticker data' });
    }
  });

  // Note: Yahoo Finance doesn't provide actual order book data. 
  // This generates a synthetic order book based on real current price + realistic spread.
  // For true Level 2 data, would need a specialized market data provider.
  app.get('/api/market/:type/orderbook', async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      const yahooSymbol = symbol?.replace('/', '-');
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d&includePrePost=false`;
      
      const response = await fetch(url);
      const data = await response.json();
      const result = data.chart.result?.[0];
      const meta = result?.meta;
      
      if (!meta) {
        return res.status(404).json({ error: 'No data found for symbol' });
      }
      
      // Get real current price from Yahoo Finance
      const currentPrice = meta.regularMarketPrice;
      // Calculate realistic spread based on asset type (smaller for stocks, larger for crypto)
      const spread = currentPrice * (symbol.includes('-USD') ? 0.0005 : 0.0001);
      
      // Generate synthetic order book based on real price
      // Note: This is simulated depth - real order books require Level 2 market data
      res.json({
        symbol,
        note: 'Synthetic order book based on real current price. For actual Level 2 data, specialized market data provider required.',
        asks: Array.from({ length: 20 }, (_, i) => ({
          price: Number((currentPrice + spread + (i * spread * 2)).toFixed(2)),
          quantity: Number((Math.random() * 2 + 0.1).toFixed(4)),
          total: Number(((currentPrice + spread + (i * spread * 2)) * (Math.random() * 2 + 0.1)).toFixed(2))
        })),
        bids: Array.from({ length: 20 }, (_, i) => ({
          price: Number((currentPrice - spread - (i * spread * 2)).toFixed(2)),
          quantity: Number((Math.random() * 2 + 0.1).toFixed(4)),
          total: Number(((currentPrice - spread - (i * spread * 2)) * (Math.random() * 2 + 0.1)).toFixed(2))
        }))
      });
    } catch (error: any) {
      console.error('Error fetching orderbook:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch orderbook' });
    }
  });

  app.get('/api/market/:type/history', async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      const range = (req.query.range as string) || '1mo';
      const yahooSymbol = symbol?.replace('/', '-');
      
      const intervalMap: Record<string, string> = {
        '1d': '1h',
        '1w': '1d',
        '1mo': '1d',
        '3mo': '1d',
        '1y': '1wk',
      };
      
      const interval = intervalMap[range] || '1d';
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}&includePrePost=false`;
      
      const response = await fetch(url);
      const data = await response.json();
      const result = data.chart.result?.[0];
      
      if (!result) {
        return res.status(404).json({ error: 'No data found for symbol' });
      }
      
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0];
      
      const historyData = timestamps.map((timestamp: number, i: number) => ({
        timestamp: timestamp * 1000,
        open: quotes.open?.[i] || 0,
        high: quotes.high?.[i] || 0,
        low: quotes.low?.[i] || 0,
        close: quotes.close?.[i] || 0,
        volume: quotes.volume?.[i] || 0,
      })).filter((item: any) => item.close > 0);
      
      res.json({
        symbol,
        range,
        data: historyData
      });
    } catch (error: any) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch history' });
    }
  });

  app.post('/api/trade/place-order', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = insertOrderSchema.parse({
        ...req.body,
        userId,
      });
      const order = await storage.createOrder(parsed);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/trade/cancel-order', authMiddleware, async (req: any, res) => {
    try {
      const order = await storage.updateOrderStatus(req.body.orderId, "cancelled");
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/trade/orders', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/trade/trades', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const orders = await storage.getOrdersByUser(userId);
      const completedTrades = orders.filter(o => o.status === "filled");
      res.json(completedTrades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/portfolio/holdings', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const holdings = await storage.getHoldingsByUser(userId);
      res.json(holdings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/watchlist', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const watchlist = await storage.getWatchlistByUser(userId);
      res.json(watchlist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/watchlist/add', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = insertWatchlistSchema.parse({
        ...req.body,
        userId,
      });
      const item = await storage.addToWatchlist(parsed);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/watchlist/:id', authMiddleware, async (req: any, res) => {
    try {
      await storage.removeFromWatchlist(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/admin/users', adminMiddleware, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/users/:userId/role', adminMiddleware, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(userId, role);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/admin/kyc/all', adminMiddleware, async (req: any, res) => {
    try {
      const all = await storage.getAllKycDocuments();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/kyc/action', adminMiddleware, async (req: any, res) => {
    try {
      const { kycId, action, reason } = req.body;
      const userId = req.userId;
      const status = action === "approve" ? "approved" : "rejected";
      const updated = await storage.updateKycStatus(kycId, status, userId, reason);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/admin/kyc/pending', adminMiddleware, async (req: any, res) => {
    try {
      const pending = await storage.getPendingKycDocuments();
      res.json(pending);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/wallets', adminMiddleware, async (req: any, res) => {
    try {
      const wallets = await storage.getAllWallets();
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/transactions', adminMiddleware, async (req: any, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/orders', adminMiddleware, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/stats', adminMiddleware, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const orders = await storage.getAllOrders();
      const transactions = await storage.getAllTransactions();
      const kycDocs = await storage.getAllKycDocuments();
      
      const stats = {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalVolume: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0),
        pendingKyc: kycDocs.filter(doc => doc.status === "pending").length,
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/logs', adminMiddleware, async (req: any, res) => {
    try {
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  const marketWss = new WebSocketServer({ server: httpServer, path: '/ws/market' });
  const userWss = new WebSocketServer({ server: httpServer, path: '/ws/user' });

  marketWss.on('connection', (ws: WebSocket) => {
    console.log('Market WebSocket client connected');
    
    async function fetchRealMarketData() {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1m&range=1d&includePrePost=false`;
        const response = await fetch(url);
        const data = await response.json();
        const result = data.chart.result?.[0];
        const meta = result?.meta;
        
        if (meta && ws.readyState === WebSocket.OPEN) {
          const price = meta.regularMarketPrice || 0;
          const previousClose = meta.regularMarketPreviousClose || price;
          const change = price - previousClose;
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
          
          const realMarketData = {
            type: 'ticker',
            data: {
              symbol: 'BTC/USD',
              price,
              change,
              changePercent,
              volume: meta.regularMarketVolume?.toLocaleString() || '0',
              timestamp: Date.now(),
            }
          };
          ws.send(JSON.stringify(realMarketData));
        }
      } catch (error) {
        console.error('Error fetching real market data for WebSocket:', error);
      }
    }
    
    fetchRealMarketData();
    const interval = setInterval(fetchRealMarketData, 5000);

    ws.on('close', () => {
      console.log('Market WebSocket client disconnected');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      console.error('Market WebSocket error:', error);
      clearInterval(interval);
    });
  });

  userWss.on('connection', (ws: WebSocket) => {
    console.log('User WebSocket client connected');

    ws.on('message', (message: string) => {
      console.log('User WebSocket message received:', message);
    });

    ws.on('close', () => {
      console.log('User WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('User WebSocket error:', error);
    });
  });

  return httpServer;
}

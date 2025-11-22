import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { MarketChart } from "@/components/MarketChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Newspaper, Sparkles, X, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useYahooQuote } from "@/hooks/useYahooFinance";

interface PortfolioSummary {
  totalBalance: number;
  balanceChange: number;
  balanceChangePercent: number;
  todaysPnl: number;
  todaysPnlPercent: number;
  openPositions: number;
  profitablePositions: number;
  holdingsValue: number;
  cashBalance: number;
  unrealizedPnl: number;
}

// Component for displaying open position card
function OpenPositionCard({ position, onClose }: { position: any; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: quote, isLoading: isLoadingQuote, error: quoteError } = useYahooQuote(position.symbol, true, true);
  const [isSelling, setIsSelling] = useState(false);
  const [lastQuoteUpdate, setLastQuoteUpdate] = useState<Date | null>(null);
  const [fallbackPrice, setFallbackPrice] = useState<number | null>(null);

  // Track when quote updates
  useEffect(() => {
    if (quote && quote.regularMarketPrice) {
      setLastQuoteUpdate(new Date());
      setFallbackPrice(null); // Clear fallback when quote loads
    }
  }, [quote]);

  // Fallback: Fetch price from backend if quote fails after 3 seconds
  useEffect(() => {
    if (quoteError && !quote && !fallbackPrice) {
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/yahoo/quote/${position.symbol}`);
          if (res.ok) {
            const data = await res.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            if (price && price > 0) {
              setFallbackPrice(price);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch fallback price for ${position.symbol}:`, error);
        }
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [quoteError, quote, position.symbol, fallbackPrice]);

  const entryPrice = parseFloat(position.averagePrice || position.price || "0");
  const quantity = parseFloat(position.quantity);
  
  // Use quote price, fallback price, or entry price in that order
  const hasValidQuote = quote && quote.regularMarketPrice && quote.regularMarketPrice > 0 && !isNaN(quote.regularMarketPrice);
  const hasFallbackPrice = fallbackPrice && fallbackPrice > 0 && !isNaN(fallbackPrice);
  const currentPrice = hasValidQuote 
    ? quote.regularMarketPrice 
    : hasFallbackPrice 
    ? fallbackPrice 
    : entryPrice;
  
  // Calculate unrealized P&L - use current price if we have quote or fallback
  const hasValidPrice = hasValidQuote || hasFallbackPrice;
  const unrealizedPnL = hasValidPrice ? (currentPrice - entryPrice) * quantity : 0;
  const unrealizedPnLPercent = hasValidPrice && entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
  const isProfit = unrealizedPnL >= 0;

  // Debug logging - log more details
  useEffect(() => {
    console.log(`[${position.symbol}] Position data:`, {
      entryPrice,
      currentPrice,
      quotePrice: quote?.regularMarketPrice,
      fallbackPrice,
      hasValidQuote,
      hasFallbackPrice,
      hasValidPrice,
      isLoadingQuote,
      quoteError: quoteError?.message,
      unrealizedPnL,
      unrealizedPnLPercent,
    });
  }, [quote, position.symbol, entryPrice, currentPrice, fallbackPrice, hasValidQuote, hasFallbackPrice, hasValidPrice, isLoadingQuote, quoteError, unrealizedPnL, unrealizedPnLPercent]);

  const handleSell = async () => {
    setIsSelling(true);
    try {
      // Create sell order
      const sellOrder = {
        symbol: position.symbol,
        assetType: position.assetType,
        type: "market",
        side: "sell",
        quantity: position.quantity,
        price: null,
        timeframe: null,
      };

      const response = await fetch("/api/trade/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sellOrder),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sell");
      }

      // Close the original buy order
      await fetch("/api/trade/close-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderId: position.id }),
      });

      toast({
        title: "Position Sold",
        description: `Sold ${quantity} ${position.symbol} at $${currentPrice.toFixed(2)}`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/trade/open-positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/summary'] });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Sell Failed",
        description: error.message || "Failed to sell position",
        variant: "destructive",
      });
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <Card className="p-4 bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{position.symbol}</span>
            <Badge variant="secondary" className="text-xs">{position.assetType}</Badge>
            <Badge variant="outline" className="text-xs">{position.timeframe || "N/A"}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Quantity: </span>
              <span className="font-mono">{quantity.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Entry: </span>
              <span className="font-mono">${entryPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current: </span>
              <span className="font-mono">
                ${currentPrice.toFixed(2)}
                {isLoadingQuote && (
                  <Loader2 className="w-3 h-3 inline-block ml-1 animate-spin text-muted-foreground" />
                )}
                {quoteError && !hasValidQuote && (
                  <span className="text-xs text-muted-foreground ml-1">(stale)</span>
                )}
                {hasValidQuote && lastQuoteUpdate && (
                  <span className="text-xs text-muted-foreground ml-1" title={`Updated ${lastQuoteUpdate.toLocaleTimeString()}`}>
                    (live)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Unrealized P&L: </span>
              {isLoadingQuote && !hasValidPrice ? (
                <span className="font-mono font-semibold text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline-block mr-1 animate-spin" />
                  Loading...
                </span>
              ) : quoteError && !hasValidPrice ? (
                <span className="font-mono font-semibold text-muted-foreground text-xs">
                  Error loading price
                </span>
              ) : !hasValidPrice ? (
                <span className="font-mono font-semibold text-muted-foreground text-xs">
                  Waiting for price...
                </span>
              ) : (
                <span className={`font-mono font-semibold ${isProfit ? "text-gain" : "text-destructive"}`}>
                  {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)} ({unrealizedPnLPercent >= 0 ? "+" : ""}{unrealizedPnLPercent.toFixed(2)}%)
                  {hasFallbackPrice && !hasValidQuote && (
                    <span className="text-xs text-muted-foreground ml-1">(fallback)</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleSell}
          disabled={isSelling}
          className="ml-4"
        >
          {isSelling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Selling...
            </>
          ) : (
            "Sell"
          )}
        </Button>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user, isResolved } = useAuth();
  const hasRedirected = useRef(false);
  const queryClient = useQueryClient();

  // Fetch portfolio summary data - refresh every 2 seconds for real-time updates
  const { data: portfolioSummary, isLoading: isLoadingPortfolio, error: portfolioError } = useQuery<PortfolioSummary>({
    queryKey: ['/api/portfolio/summary'],
    enabled: isAuthenticated && isResolved,
    refetchInterval: 2000, // Refresh every 2 seconds for live trading feel
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await fetch('/api/portfolio/summary', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch portfolio summary: ${res.status}`);
      }
      return res.json();
    },
  });

  // Log errors for debugging and show toast
  useEffect(() => {
    if (portfolioError) {
      console.error('Portfolio summary error:', portfolioError);
      toast({
        title: "Failed to load portfolio data",
        description: portfolioError instanceof Error ? portfolioError.message : "Please refresh the page",
        variant: "destructive",
      });
    }
  }, [portfolioError, toast]);

  useEffect(() => {
    // Only redirect once auth is definitively resolved
    if (isResolved && !hasRedirected.current) {
      if (!isAuthenticated) {
        // User is definitively not authenticated
        hasRedirected.current = true;
        toast({
          title: "Unauthorized",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        setLocation("/login");
      } else if (user && user.role === "admin") {
        // User is admin, redirect to admin dashboard
        hasRedirected.current = true;
        setLocation("/admin/dashboard");
      }
    }
  }, [isResolved, isAuthenticated, user, toast, setLocation]);

  // Show loading state while auth is being determined
  if (!isResolved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  // Fetch open positions - refresh every 2 seconds for real-time P&L updates
  const { data: openPositions, isLoading: isLoadingPositions, refetch: refetchPositions } = useQuery<any[]>({
    queryKey: ['/api/trade/open-positions'],
    enabled: isAuthenticated && isResolved,
    refetchInterval: 2000, // Refresh every 2 seconds for live trading
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await fetch('/api/trade/open-positions', {
        credentials: 'include',
      });
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
  });

  // Refresh portfolio summary when positions change
  useEffect(() => {
    if (openPositions) {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
    }
  }, [openPositions, queryClient]);

  // Popular assets to show in Live Market
  const popularAssets = [
    { symbol: "AAPL", name: "Apple", assetType: "stock" as const },
    { symbol: "MSFT", name: "Microsoft", assetType: "stock" as const },
    { symbol: "GOOGL", name: "Google", assetType: "stock" as const },
    { symbol: "BTC-USD", name: "Bitcoin", assetType: "crypto" as const },
    { symbol: "ETH-USD", name: "Ethereum", assetType: "crypto" as const },
    { symbol: "TSLA", name: "Tesla", assetType: "stock" as const },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, track your portfolio performance</p>
        </div>
        <Button className="gap-2" data-testid="button-new-trade" onClick={() => setLocation('/trading-terminal')}>
          <TrendingUp className="w-4 h-4" />
          New Trade
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6" glow>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            {isLoadingPortfolio ? (
              <div className="text-3xl font-condensed font-bold animate-pulse" data-testid="text-total-balance">
                Loading...
              </div>
            ) : portfolioError ? (
              <div className="text-sm text-destructive" data-testid="text-total-balance-error">
                Error loading data
              </div>
            ) : (
              <>
                <div className="text-3xl font-condensed font-bold" data-testid="text-total-balance">
                  ${portfolioSummary?.totalBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
                <PriceDisplay
                  change={portfolioSummary?.balanceChange || 0}
                  changePercent={portfolioSummary?.balanceChangePercent || 0}
                  currency=""
                  size="sm"
                />
              </>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Today's P&L</h3>
            {portfolioSummary && portfolioSummary.todaysPnl >= 0 ? (
              <ArrowUpRight className="w-5 h-5 text-gain" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-loss" />
            )}
          </div>
          <div className="space-y-1">
            {isLoadingPortfolio ? (
              <div className="text-3xl font-condensed font-bold animate-pulse" data-testid="text-pnl">
                Loading...
              </div>
            ) : (
              <>
                <div 
                  className={`text-3xl font-condensed font-bold ${
                    (portfolioSummary?.todaysPnl || 0) >= 0 ? 'text-gain' : 'text-loss'
                  }`} 
                  data-testid="text-pnl"
                >
                  {(portfolioSummary?.todaysPnl || 0) >= 0 ? '+' : ''}
                  ${portfolioSummary?.todaysPnl?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(portfolioSummary?.todaysPnlPercent || 0) >= 0 ? '+' : ''}
                  {portfolioSummary?.todaysPnlPercent?.toFixed(2) || '0.00'}% {(portfolioSummary?.todaysPnl || 0) >= 0 ? 'gain' : 'loss'}
                </div>
              </>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Open Positions</h3>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            {isLoadingPortfolio ? (
              <div className="text-3xl font-condensed font-bold animate-pulse" data-testid="text-open-positions">
                Loading...
              </div>
            ) : (
              <>
                <div className="text-3xl font-condensed font-bold" data-testid="text-open-positions">
                  {portfolioSummary?.openPositions || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {portfolioSummary?.profitablePositions || 0} profitable
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Open Positions */}
          {openPositions && openPositions.length > 0 && (
            <GlassCard className="p-6" neonBorder>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-condensed font-semibold">Open Positions</h2>
                <Badge variant="secondary">{openPositions.length} Active</Badge>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {openPositions.map((position) => (
                    <OpenPositionCard
                      key={position.id}
                      position={position}
                      onClose={() => refetchPositions()}
                    />
                  ))}
                </div>
              </ScrollArea>
            </GlassCard>
          )}

          <div>
            <h2 className="text-2xl font-condensed font-semibold mb-4">Live Market</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularAssets.map((asset) => (
                <MarketChart key={asset.symbol} {...asset} />
              ))}
            </div>
          </div>

          <GlassCard className="p-6" neonBorder>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-condensed font-semibold">AI Trading Insights</h3>
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </div>
            <div className="space-y-4">
              <Card className="bg-accent/50 border-accent">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
                    <div>
                      <p className="font-medium">BTC showing strong bullish momentum</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Technical indicators suggest potential breakout above $68K resistance
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-accent/50 border-accent">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal mt-2 animate-pulse" />
                    <div>
                      <p className="font-medium">Consider taking profits on AAPL</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Stock approaching overbought levels on RSI
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                <CardTitle className="font-condensed">Market News</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                Visit the News page for real-time financial news and market analysis
              </p>
              <Button variant="outline" className="w-full" size="sm" data-testid="button-view-all-news" onClick={() => setLocation('/news')}>
                View All News
              </Button>
            </CardContent>
          </Card>

          <GlassCard className="p-6">
            <h3 className="text-lg font-condensed font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" data-testid="button-deposit" onClick={() => setLocation('/deposit')}>
                <Wallet className="w-4 h-4 mr-2" />
                Deposit Funds
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-withdraw" onClick={() => setLocation('/withdraw')}>
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-market-watch" onClick={() => setLocation('/market-watch')}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Market Watch
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-trade-history" onClick={() => setLocation('/trade-history')}>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Trade History
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

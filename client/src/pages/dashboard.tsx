import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { MarketChart } from "@/components/MarketChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Newspaper, Sparkles } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user, isResolved } = useAuth();
  const hasRedirected = useRef(false);

  // Fetch portfolio summary data
  const { data: portfolioSummary, isLoading: isLoadingPortfolio } = useQuery<PortfolioSummary>({
    queryKey: ['/api/portfolio/summary'],
    enabled: isAuthenticated && isResolved,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

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
            ) : (
              <>
                <div className="text-3xl font-condensed font-bold" data-testid="text-total-balance">
                  ${portfolioSummary?.totalBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
                <PriceDisplay
                  value={0}
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
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

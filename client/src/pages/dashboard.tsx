import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import { GlassCard } from "@/components/GlassCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { TickerCard } from "@/components/TickerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Newspaper, Sparkles } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { marketData, isConnected } = useMarketWebSocket();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      const timeoutId = setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading]); // Removed toast from dependencies

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  // Real ticker data from WebSocket - showing BTC/USD live data
  const realTickers = marketData ? [{ 
    symbol: marketData.symbol, 
    name: marketData.symbol.split('/')[0], 
    price: marketData.price, 
    change: marketData.change, 
    changePercent: marketData.changePercent, 
    volume: marketData.volume, 
    assetType: "crypto" as const 
  }] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, track your portfolio performance</p>
        </div>
        <Button className="gap-2" data-testid="button-new-trade">
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
            <div className="text-3xl font-condensed font-bold" data-testid="text-total-balance">
              $125,847.32
            </div>
            <PriceDisplay
              value={0}
              change={3456.78}
              changePercent={2.82}
              currency=""
              size="sm"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Today's P&L</h3>
            <ArrowUpRight className="w-5 h-5 text-gain" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-condensed font-bold text-gain" data-testid="text-pnl">
              +$2,345.67
            </div>
            <div className="text-sm text-muted-foreground">+1.9% gain</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Open Positions</h3>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-condensed font-bold" data-testid="text-open-positions">
              12
            </div>
            <div className="text-sm text-muted-foreground">8 profitable</div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-condensed font-semibold mb-4">Live Market</h2>
            {realTickers.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                  {realTickers.map((ticker) => (
                    <div key={ticker.symbol} className="w-80 shrink-0">
                      <TickerCard {...ticker} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">Connecting to live market data...</p>
              </Card>
            )}
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
              <Button variant="outline" className="w-full" size="sm" data-testid="button-view-all-news" onClick={() => window.location.href = '/news'}>
                View All News
              </Button>
            </CardContent>
          </Card>

          <GlassCard className="p-6">
            <h3 className="text-lg font-condensed font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" data-testid="button-deposit">
                <Wallet className="w-4 h-4 mr-2" />
                Deposit Funds
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-withdraw">
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-market-watch">
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

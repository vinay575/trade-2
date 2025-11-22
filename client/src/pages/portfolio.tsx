import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, PieChart } from "lucide-react";
import { useYahooQuote } from "@/hooks/useYahooFinance";
import type { Holding } from "@shared/schema";

// Component for individual holding row with live price updates
function HoldingRow({ holding }: { holding: Holding }) {
  const { data: quote } = useYahooQuote(holding.symbol, true, true);
  
  const qty = parseFloat(holding.quantity || "0");
  const avgPrice = parseFloat(holding.averageBuyPrice || "0");
  // Use live quote price if available, otherwise use stored currentPrice or avgPrice
  const livePrice = quote?.regularMarketPrice && quote.regularMarketPrice > 0 
    ? quote.regularMarketPrice 
    : parseFloat(holding.currentPrice || holding.averageBuyPrice || "0");
  const currentPrice = livePrice;
  const value = qty * currentPrice;
  const cost = qty * avgPrice;
  const pnl = value - cost;
  const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

  return (
    <TableRow key={holding.id} data-testid={`holding-row-${holding.symbol}`}>
      <TableCell>
        <div>
          <div className="font-medium">{holding.symbol}</div>
          <div className="text-xs text-muted-foreground">{holding.assetName || holding.symbol}</div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">{qty.toFixed(4)}</TableCell>
      <TableCell className="text-right font-mono">${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
      <TableCell className="text-right font-mono">
        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        {quote?.regularMarketPrice && <span className="text-xs text-muted-foreground ml-1">(live)</span>}
      </TableCell>
      <TableCell className="text-right font-mono">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
      <TableCell className="text-right">
        <div className={pnl >= 0 ? "text-gain" : "text-loss"}>
          <div className="font-mono">{pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-xs">({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)</div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Portfolio() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Fetch real holdings from API - refresh every 3 seconds for live updates
  const { data: holdings = [], isLoading: isLoadingHoldings } = useQuery<Holding[]>({
    queryKey: ["/api/portfolio/holdings"],
    enabled: isAuthenticated,
    refetchInterval: 3000, // Refresh every 3 seconds for live trading
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch portfolio summary for accurate Total P&L (includes realized + unrealized)
  const { data: portfolioSummary } = useQuery<any>({
    queryKey: ["/api/portfolio/summary"],
    enabled: isAuthenticated,
    refetchInterval: 3000, // Refresh every 3 seconds for live updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await fetch("/api/portfolio/summary", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch portfolio summary");
      }
      return res.json();
    },
  });

  // Fetch real wallet transactions from API - refresh periodically
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<any[]>({
    queryKey: ["/api/wallet/ledger"],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await fetch("/api/wallet/ledger", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return res.json();
    },
  });

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

  // Calculate totals from real data - use portfolio summary if available, otherwise calculate from holdings
  const portfolioStats = useMemo(() => {
    // If we have portfolio summary, use it for more accurate data
    if (portfolioSummary) {
      return {
        totalValue: portfolioSummary.totalBalance || 0,
        totalPnl: portfolioSummary.totalPnl || 0,
        totalPnlPercent: portfolioSummary.totalPnlPercent || 0,
        totalAssets: portfolioSummary.openPositions || holdings.length || 0,
        assetClasses: new Set(holdings.map(h => {
          const symbol = h.symbol.toUpperCase();
          return symbol.includes('-USD') ? 'crypto' : 'stock';
        })).size,
      };
    }

    // Fallback to calculating from holdings
    if (!holdings || holdings.length === 0) {
      return {
        totalValue: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
        totalAssets: 0,
        assetClasses: 0,
      };
    }

    const totalValue = holdings.reduce((sum, h) => {
      const qty = parseFloat(h.quantity || "0");
      const price = parseFloat(h.currentPrice || h.averageBuyPrice || "0");
      return sum + (qty * price);
    }, 0);

    const totalCost = holdings.reduce((sum, h) => {
      const qty = parseFloat(h.quantity || "0");
      const avgPrice = parseFloat(h.averageBuyPrice || "0");
      return sum + (qty * avgPrice);
    }, 0);

    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    // Count unique asset types (crypto vs stock)
    const assetTypes = new Set(holdings.map(h => {
      const symbol = h.symbol.toUpperCase();
      return symbol.includes('-USD') ? 'crypto' : 'stock';
    }));

    return {
      totalValue,
      totalPnl,
      totalPnlPercent,
      totalAssets: holdings.length,
      assetClasses: assetTypes.size,
    };
  }, [holdings, portfolioSummary]); // Include portfolioSummary in dependencies

  if (isLoading || isLoadingHoldings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-portfolio-title">Portfolio</h1>
          <p className="text-muted-foreground">Track your assets and performance</p>
        </div>
        <Button className="gap-2" data-testid="button-export">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6" glow>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Value</h3>
          <div className="text-3xl font-condensed font-bold mb-2" data-testid="text-total-value">
            ${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <PriceDisplay 
            value={0} 
            change={portfolioStats.totalPnl} 
            changePercent={portfolioStats.totalPnlPercent} 
            currency="" 
            size="sm" 
          />
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total P&L</h3>
          <div 
            className={`text-3xl font-condensed font-bold mb-2 ${(portfolioSummary?.totalPnl || portfolioStats.totalPnl) >= 0 ? 'text-gain' : 'text-loss'}`} 
            data-testid="text-total-pnl"
          >
            {(portfolioSummary?.totalPnl || portfolioStats.totalPnl) >= 0 ? '+' : ''}${(portfolioSummary?.totalPnl || portfolioStats.totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">
            {(portfolioSummary?.totalPnlPercent || portfolioStats.totalPnlPercent) >= 0 ? '+' : ''}{(portfolioSummary?.totalPnlPercent || portfolioStats.totalPnlPercent).toFixed(2)}% all time
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Assets</h3>
          <div className="text-3xl font-condensed font-bold mb-2" data-testid="text-total-assets">
            {portfolioStats.totalAssets}
          </div>
          <div className="text-sm text-muted-foreground">
            Across {portfolioStats.assetClasses} asset {portfolioStats.assetClasses === 1 ? 'class' : 'classes'}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="backdrop-blur-sm bg-card/40">
            <CardHeader>
              <CardTitle className="font-condensed">Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No holdings yet. Start trading to build your portfolio.
                      </TableCell>
                    </TableRow>
                  ) : (
                    holdings.map((holding) => {
                      return <HoldingRow key={holding.id} holding={holding} />;
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/40">
            <CardHeader>
              <CardTitle className="font-condensed">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.slice(0, 10).map((tx, i) => (
                      <TableRow key={tx.id || i} data-testid={`transaction-row-${i}`}>
                        <TableCell className="text-sm">
                          {new Date(tx.createdAt || tx.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type?.toLowerCase().includes('deposit') || tx.type?.toLowerCase().includes('credit') ? "default" : "secondary"}>
                            {tx.type || tx.transactionType || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                        <TableCell className="text-right font-mono">-</TableCell>
                        <TableCell className="text-right font-mono">-</TableCell>
                        <TableCell className="text-right font-mono">
                          ${parseFloat(tx.amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6" neonBorder>
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="font-condensed font-semibold">Asset Allocation</h3>
            </div>
            <div className="space-y-4">
              {holdings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No holdings to display</p>
              ) : (
                holdings.map((holding) => {
                  const qty = parseFloat(holding.quantity || "0");
                  const price = parseFloat(holding.currentPrice || holding.averageBuyPrice || "0");
                  const value = qty * price;
                  const percentage = portfolioStats.totalValue > 0 
                    ? ((value / portfolioStats.totalValue) * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <div key={holding.id} data-testid={`allocation-${holding.symbol}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{holding.symbol}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-orange"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          <Card className="backdrop-blur-sm bg-card/40 p-6">
            <h3 className="font-condensed font-semibold text-sm mb-4">Performance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total P&L</span>
                <span className={(portfolioSummary?.totalPnl || portfolioStats.totalPnl) >= 0 ? "text-gain" : "text-loss"}>
                  {(portfolioSummary?.totalPnl || portfolioStats.totalPnl) >= 0 ? '+' : ''}${(portfolioSummary?.totalPnl || portfolioStats.totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Return</span>
                <span className={(portfolioSummary?.totalPnlPercent || portfolioStats.totalPnlPercent) >= 0 ? "text-gain" : "text-loss"}>
                  {(portfolioSummary?.totalPnlPercent || portfolioStats.totalPnlPercent) >= 0 ? '+' : ''}{(portfolioSummary?.totalPnlPercent || portfolioStats.totalPnlPercent).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assets</span>
                <span className="text-foreground">{portfolioStats.totalAssets}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

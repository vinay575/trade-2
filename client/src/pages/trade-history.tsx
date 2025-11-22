import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Clock, Loader2, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Trade {
  id: string;
  symbol: string;
  assetType: string;
  side: "buy" | "sell";
  quantity: string;
  price: string | null;
  averagePrice: string | null;
  closePrice: string | null;
  profitLoss: string | null;
  profitLossPercent: string | null;
  status: string;
  timeframe: string | null;
  createdAt: string;
  executedAt: string | null;
  closedAt: string | null;
}

export default function TradeHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const [filter, setFilter] = useState<"all" | "win" | "loss" | "open">("all");

  const { data: trades, isLoading, refetch } = useQuery<Trade[]>({
    queryKey: ["/api/trade/trades"],
    queryFn: async () => {
      const res = await fetch("/api/trade/trades", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch trades");
      }
      const data = await res.json();
      console.log("Fetched trades:", data); // Debug log
      return data;
    },
    refetchInterval: 3000, // Refresh every 3 seconds for live updates
    enabled: isAuthenticated,
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: openPositions } = useQuery<Trade[]>({
    queryKey: ["/api/trade/open-positions"],
    queryFn: async () => {
      const res = await fetch("/api/trade/open-positions", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch open positions");
      }
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to view trade history",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isLoadingAuth, toast]);

  // Show loading state
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  const filteredTrades = trades?.filter((trade) => {
    if (filter === "all") return true;
    if (filter === "open") {
      // Show filled buy orders that haven't been closed
      return trade.status === "filled" && trade.side === "buy" && !trade.closedAt;
    }
    if (filter === "win") {
      const pnl = parseFloat(trade.profitLoss || "0");
      return pnl > 0 && trade.status === "closed";
    }
    if (filter === "loss") {
      const pnl = parseFloat(trade.profitLoss || "0");
      return pnl < 0 && trade.status === "closed";
    }
    return true;
  }) || [];

  const totalPnL = filteredTrades.reduce((sum, trade) => {
    return sum + parseFloat(trade.profitLoss || "0");
  }, 0);

  const winCount = filteredTrades.filter(t => parseFloat(t.profitLoss || "0") > 0).length;
  const lossCount = filteredTrades.filter(t => parseFloat(t.profitLoss || "0") < 0).length;

  if (isLoadingAuth) {
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
          <h1 className="text-4xl font-condensed font-bold mb-2">Trade History</h1>
          <p className="text-muted-foreground">View all your trades, open positions, and performance</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <Loader2 className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
          <div className="text-2xl font-condensed font-bold">{filteredTrades.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
          <div className={`text-2xl font-condensed font-bold ${totalPnL >= 0 ? "text-gain" : "text-destructive"}`}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Wins</div>
          <div className="text-2xl font-condensed font-bold text-gain">{winCount}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Losses</div>
          <div className="text-2xl font-condensed font-bold text-destructive">{lossCount}</div>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "open", "win", "loss"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Trades Table */}
      <GlassCard className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trades found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Close Price</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => {
                  const pnl = parseFloat(trade.profitLoss || "0");
                  const pnlPercent = parseFloat(trade.profitLossPercent || "0");
                  const isWin = pnl > 0;
                  const entryPrice = parseFloat(trade.averagePrice || trade.price || "0");
                  const closePrice = parseFloat(trade.closePrice || "0");
                  const isOpen = trade.status === "filled";

                  return (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{trade.symbol}</span>
                          <Badge variant="secondary" className="text-xs">
                            {trade.assetType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={trade.side === "buy" ? "default" : "destructive"}
                          className={trade.side === "buy" ? "bg-gain" : ""}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{parseFloat(trade.quantity).toFixed(4)}</TableCell>
                      <TableCell className="font-mono">${entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">
                        {closePrice > 0 ? `$${closePrice.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.timeframe || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        {trade.status === "closed" ? (
                          <div className={`flex items-center gap-1 ${isWin ? "text-gain" : "text-destructive"}`}>
                            {isWin ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-mono font-semibold">
                              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.status === "closed"
                              ? "default"
                              : trade.status === "filled"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(trade.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {isOpen && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const response = await fetch("/api/trade/close-order", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({ orderId: trade.id }),
                                  });

                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.message || "Failed to close trade");
                                  }

                                  toast({
                                    title: "Trade Closed",
                                    description: "Trade closed successfully. P&L calculated.",
                                  });

                                  // Invalidate all related queries to refresh data
                                  queryClient.invalidateQueries({ queryKey: ['/api/trade/trades'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/trade/open-positions'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/wallet/summary'] });
                                  
                                  refetch();
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to close trade",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Close
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                try {
                                  // Get current price for sell
                                  const priceRes = await fetch(`/api/yahoo/quote/${trade.symbol}`);
                                  if (!priceRes.ok) {
                                    throw new Error("Failed to get current price");
                                  }
                                  const priceData = await priceRes.json();
                                  const currentPrice = priceData.chart?.result?.[0]?.meta?.regularMarketPrice;

                                  if (!currentPrice) {
                                    throw new Error("Unable to get current price");
                                  }

                                  // Create sell order
                                  const sellOrder = {
                                    symbol: trade.symbol,
                                    assetType: trade.assetType,
                                    type: "market",
                                    side: "sell",
                                    quantity: trade.quantity,
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
                                    body: JSON.stringify({ orderId: trade.id }),
                                  });

                                  toast({
                                    title: "Trade Sold",
                                    description: `Sold ${trade.quantity} ${trade.symbol} at $${currentPrice.toFixed(2)}`,
                                  });

                                  // Invalidate all related queries to refresh data
                                  queryClient.invalidateQueries({ queryKey: ['/api/trade/trades'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/trade/open-positions'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/wallet/summary'] });
                                  
                                  refetch();
                                } catch (error: any) {
                                  toast({
                                    title: "Sell Failed",
                                    description: error.message || "Failed to sell trade",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Sell
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

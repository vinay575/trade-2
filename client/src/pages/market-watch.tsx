import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { TickerCard } from "@/components/TickerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Grid3x3, List, Star, Plus } from "lucide-react";

export default function MarketWatch() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<"all" | "crypto" | "stock" | "forex">("all");

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

  const mockAssets = [
    { symbol: "BTC/USD", name: "Bitcoin", price: 67234.50, change: 1234.50, changePercent: 1.87, volume: "$34.2B", assetType: "crypto" as const },
    { symbol: "ETH/USD", name: "Ethereum", price: 3567.89, change: -45.23, changePercent: -1.25, volume: "$18.5B", assetType: "crypto" as const },
    { symbol: "SOL/USD", name: "Solana", price: 142.67, change: 5.34, changePercent: 3.89, volume: "$2.1B", assetType: "crypto" as const },
    { symbol: "AAPL", name: "Apple Inc.", price: 178.34, change: 2.45, changePercent: 1.39, volume: "$58.3M", assetType: "stock" as const },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 145.23, change: -1.23, changePercent: -0.84, volume: "$42.1M", assetType: "stock" as const },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 412.56, change: 8.92, changePercent: 2.21, volume: "$51.2M", assetType: "stock" as const },
    { symbol: "EUR/USD", name: "Euro/Dollar", price: 1.0876, change: 0.0023, changePercent: 0.21, volume: "$112B", assetType: "forex" as const },
    { symbol: "GBP/USD", name: "Pound/Dollar", price: 1.2634, change: -0.0012, changePercent: -0.09, volume: "$78B", assetType: "forex" as const },
  ];

  const filteredAssets = selectedType === "all"
    ? mockAssets
    : mockAssets.filter(asset => asset.assetType === selectedType);

  if (isLoading) {
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
          <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-market-watch-title">Market Watch</h1>
          <p className="text-muted-foreground">Monitor all your favorite assets in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
            data-testid="button-grid-view"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
            data-testid="button-list-view"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets (e.g., BTC, AAPL)..."
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "crypto", "stock", "forex"] as const).map((type) => (
            <Badge
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              className="cursor-pointer hover-elevate active-elevate-2 px-4 py-2"
              onClick={() => setSelectedType(type)}
              data-testid={`filter-${type}`}
            >
              {type.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="watchlist" data-testid="tab-watchlist">
            <Star className="w-4 h-4 mr-2" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-markets">All Markets</TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="mt-6">
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {filteredAssets.slice(0, 6).map((asset) => (
              <TickerCard key={asset.symbol} {...asset} />
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 gap-2" data-testid="button-add-to-watchlist">
            <Plus className="w-4 h-4" />
            Add to Watchlist
          </Button>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {filteredAssets.map((asset) => (
              <TickerCard key={asset.symbol} {...asset} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

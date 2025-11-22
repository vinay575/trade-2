import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useYahooQuote } from "@/hooks/useYahooFinance";
import { GlassCard } from "@/components/GlassCard";
import { TickerCard } from "@/components/TickerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Grid3x3, List, Star, Plus } from "lucide-react";

// Component to render live ticker card with auto-refresh
function LiveTickerCard({ symbol, name, assetType }: { symbol: string; name: string; assetType: "crypto" | "stock" | "forex" }) {
  // Enable auto-refresh for live updates (every 5 seconds)
  const { data: quote, isLoading } = useYahooQuote(symbol, true, true);

  if (isLoading || !quote) {
    return (
      <GlassCard className="p-4 hover-elevate" neonBorder>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-condensed font-semibold text-lg">{symbol}</h3>
                <Badge variant="secondary" className="text-xs">{assetType.toUpperCase()}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
          </div>
          <div className="h-16 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
          </div>
        </div>
      </GlassCard>
    );
  }

  const change = quote.regularMarketChange ?? 0;
  const changePercent = quote.regularMarketChangePercent ?? 0;
  const price = quote.regularMarketPrice ?? 0;

  return (
    <TickerCard
      symbol={symbol}
      name={name}
      price={price}
      change={change}
      changePercent={changePercent}
      assetType={assetType}
    />
  );
}

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

  // Define watchlist assets with their symbols
  const watchlistAssets = [
    { symbol: "BTC-USD", name: "Bitcoin", assetType: "crypto" as const },
    { symbol: "ETH-USD", name: "Ethereum", assetType: "crypto" as const },
    { symbol: "SOL-USD", name: "Solana", assetType: "crypto" as const },
    { symbol: "AAPL", name: "Apple Inc.", assetType: "stock" as const },
    { symbol: "GOOGL", name: "Alphabet Inc.", assetType: "stock" as const },
    { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock" as const },
    { symbol: "EURUSD=X", name: "Euro/Dollar", assetType: "forex" as const },
    { symbol: "GBPUSD=X", name: "Pound/Dollar", assetType: "forex" as const },
  ];

  const filteredAssets = selectedType === "all"
    ? watchlistAssets
    : watchlistAssets.filter(asset => asset.assetType === selectedType);

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
              <LiveTickerCard key={asset.symbol} symbol={asset.symbol} name={asset.name} assetType={asset.assetType} />
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
              <LiveTickerCard key={asset.symbol} symbol={asset.symbol} name={asset.name} assetType={asset.assetType} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

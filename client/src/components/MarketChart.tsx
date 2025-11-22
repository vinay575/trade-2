import { useYahooCandles, useYahooQuote } from "@/hooks/useYahooFinance";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { PriceDisplay } from "@/components/PriceDisplay";

interface MarketChartProps {
  symbol: string;
  name: string;
  assetType: "stock" | "crypto" | "forex";
}

export function MarketChart({ symbol, name, assetType }: MarketChartProps) {
  // Enable auto-refresh for live updates (every 30 seconds for 5m candles)
  const { data, isLoading, error } = useYahooCandles(symbol, "5m", "1d", true);
  
  // Get live quote for current price updates (every 5 seconds)
  const { data: quote } = useYahooQuote(symbol, true, true);

  if (isLoading) {
    return (
      <Card className="p-4 w-full">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-condensed font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground uppercase">{assetType}</p>
          </div>
        </div>
        <div className="h-20 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error || !data?.chart?.result?.[0]) {
    return (
      <Card className="p-4 w-full">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-condensed font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground uppercase">{assetType}</p>
          </div>
        </div>
        <div className="h-20 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            {error?.message || "Unable to load chart"}
          </p>
        </div>
      </Card>
    );
  }

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0];
  
  if (!quotes || !timestamps.length || !quotes.close) {
    return (
      <Card className="p-4 w-full">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-condensed font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground uppercase">{assetType}</p>
          </div>
        </div>
        <div className="h-20 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data - filter out null/undefined values and ensure we have valid data
  const chartData = timestamps
    .map((timestamp, index) => {
      const price = quotes.close?.[index];
      if (price === null || price === undefined || isNaN(price) || price <= 0) {
        return null;
      }
      return {
        time: timestamp,
        price: price,
      };
    })
    .filter((d): d is { time: number; price: number } => d !== null);

  // Ensure we have at least some data points
  if (chartData.length === 0) {
    return (
      <Card className="p-4 w-full">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-condensed font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground uppercase">{assetType}</p>
          </div>
        </div>
        <div className="h-20 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No valid price data</p>
        </div>
      </Card>
    );
  }

  // Get current price from live quote (preferred) or meta or last data point
  const currentPrice = quote?.regularMarketPrice || result.meta?.regularMarketPrice || chartData[chartData.length - 1]?.price || 0;
  const previousClose = result.meta?.regularMarketPreviousClose || chartData[0]?.price || currentPrice;
  
  // Use live quote change if available, otherwise calculate
  let change = quote?.regularMarketChange;
  let changePercent = quote?.regularMarketChangePercent;
  
  // Calculate if not available from quote
  if (change === null || change === undefined) {
    change = currentPrice - previousClose;
  }
  if (changePercent === null || changePercent === undefined) {
    changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
  }
  
  // Fallback to 0 if still null
  change = change ?? 0;
  changePercent = changePercent ?? 0;
  
  // Determine color based on change
  const isPositive = change >= 0;
  const lineColor = isPositive ? "hsl(var(--gain))" : "hsl(var(--loss))";

  // Calculate min/max for Y-axis domain with some padding
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1 || 1; // 10% padding

  return (
    <Card className="p-4 w-full hover-elevate" data-testid={`card-market-${symbol}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-condensed font-semibold text-lg" data-testid={`text-symbol-${symbol}`}>
            {name}
          </h3>
          <p className="text-xs text-muted-foreground uppercase">{assetType}</p>
        </div>
        <div className="text-right">
          <div className="font-condensed font-bold text-lg" data-testid={`text-price-${symbol}`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <PriceDisplay 
            change={change} 
            changePercent={changePercent}
            size="sm"
            currency=""
          />
        </div>
      </div>
      
      <div className="h-20 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <XAxis hide dataKey="time" />
            <YAxis 
              hide 
              domain={[minPrice - padding, maxPrice + padding]} 
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

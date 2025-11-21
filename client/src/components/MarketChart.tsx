import { useYahooCandles } from "@/hooks/useYahooFinance";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { PriceDisplay } from "@/components/PriceDisplay";

interface MarketChartProps {
  symbol: string;
  name: string;
  assetType: "stock" | "crypto" | "forex";
}

export function MarketChart({ symbol, name, assetType }: MarketChartProps) {
  const { data, isLoading, error } = useYahooCandles(symbol, "5m", "1d");

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
          <p className="text-xs text-muted-foreground">Unable to load chart</p>
        </div>
      </Card>
    );
  }

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0];
  
  if (!quotes || !timestamps.length) {
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

  // Prepare chart data
  const chartData = timestamps.map((timestamp, index) => ({
    time: timestamp,
    price: quotes.close[index],
  })).filter(d => d.price !== null && d.price !== undefined);

  const currentPrice = result.meta?.regularMarketPrice || chartData[chartData.length - 1]?.price || 0;
  const change = result.meta?.regularMarketChange || 0;
  const changePercent = result.meta?.regularMarketChangePercent || 0;
  
  // Determine color based on change
  const isPositive = change >= 0;
  const lineColor = isPositive ? "hsl(var(--gain))" : "hsl(var(--loss))";

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
            value={0} 
            change={change} 
            changePercent={changePercent}
            size="sm"
            currency=""
          />
        </div>
      </div>
      
      <div className="h-20 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

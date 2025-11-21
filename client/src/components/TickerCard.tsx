import { GlassCard } from "./GlassCard";
import { PriceDisplay } from "./PriceDisplay";
import { Badge } from "@/components/ui/badge";

interface TickerCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
  assetType: "crypto" | "stock" | "forex";
  onClick?: () => void;
}

export function TickerCard({ symbol, name, price, change, changePercent, volume, assetType, onClick }: TickerCardProps) {
  return (
    <GlassCard
      className="p-4 hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      neonBorder
    >
      <div className="space-y-3" data-testid={`ticker-card-${symbol}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-condensed font-semibold text-lg" data-testid={`text-symbol-${symbol}`}>{symbol}</h3>
              <Badge variant="secondary" className="text-xs" data-testid={`badge-asset-type-${symbol}`}>
                {assetType.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-name-${symbol}`}>{name}</p>
          </div>
        </div>
        <PriceDisplay
          value={price}
          change={change}
          changePercent={changePercent}
          size="md"
        />
        {volume && (
          <div className="text-xs text-muted-foreground">
            Vol: {volume}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

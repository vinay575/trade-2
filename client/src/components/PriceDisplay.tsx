import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceDisplayProps {
  value?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  animate?: boolean;
  className?: string;
}

export function PriceDisplay({
  value,
  change,
  changePercent,
  currency = "$",
  size = "md",
  showTrend = true,
  animate = false,
  className,
}: PriceDisplayProps) {
  const isPositive = (change ?? 0) >= 0;
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl font-condensed font-semibold",
  };

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="price-display">
      {value !== undefined && (
        <span className={cn(sizeClasses[size], animate && "animate-pulse")}>
          {currency}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
      {change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isPositive ? "text-gain" : "text-loss"
        )}>
          {showTrend && (
            isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? "+" : ""}{change.toFixed(2)}
            {changePercent !== undefined && ` (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)`}
          </span>
        </div>
      )}
    </div>
  );
}

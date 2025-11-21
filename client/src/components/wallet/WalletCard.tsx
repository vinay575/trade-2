import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Wallet as WalletType } from '@shared/schema';

interface WalletCardProps {
  wallet: WalletType;
  className?: string;
  showChange?: boolean;
  change?: number;
}

export function WalletCard({ wallet, className, showChange, change }: WalletCardProps) {
  const balance = parseFloat(wallet.balance.toString());
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {wallet.currency} Wallet
          </CardTitle>
          <Wallet className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {wallet.currency === 'USD' ? '$' : ''}
            {balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {showChange && change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {isPositive ? '+' : ''}
              {change.toFixed(2)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


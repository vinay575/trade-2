import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  direction: 'up' | 'down';
  symbol: string;
  amount: number;
  payout: number;
  loading?: boolean;
}

export function TradeConfirmationModal({
  open,
  onClose,
  onConfirm,
  direction,
  symbol,
  amount,
  payout,
  loading = false,
}: TradeConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Trade</DialogTitle>
          <DialogDescription>Please review your trade details before confirming</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Symbol:</span>
            <span className="font-semibold">{symbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Direction:</span>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full font-semibold',
                direction === 'up'
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-red-500/20 text-red-500'
              )}
            >
              {direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {direction.toUpperCase()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Potential Payout:</span>
            <span className="font-bold text-lg text-green-500">${payout.toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


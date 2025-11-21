import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeButtonsProps {
  onUpClick: () => void;
  onDownClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function TradeButtons({ onUpClick, onDownClick, disabled, className }: TradeButtonsProps) {
  return (
    <div className={cn('flex gap-4', className)}>
      <Button
        onClick={onUpClick}
        disabled={disabled}
        size="lg"
        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg h-16"
      >
        <TrendingUp className="w-6 h-6 mr-2" />
        UP
      </Button>
      <Button
        onClick={onDownClick}
        disabled={disabled}
        size="lg"
        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-lg h-16"
      >
        <TrendingDown className="w-6 h-6 mr-2" />
        DOWN
      </Button>
    </div>
  );
}


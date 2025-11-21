import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  currency?: string;
  className?: string;
  quickAmounts?: number[];
}

export function AmountInput({
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 10,
  label = 'Amount',
  currency = '$',
  className,
  quickAmounts = [10, 50, 100, 500],
}: AmountInputProps) {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currency}
          </span>
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              onChange(Math.max(min, Math.min(newValue, max)));
            }}
            min={min}
            max={max}
            step={step}
            className="pl-8 text-center text-lg font-semibold"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {quickAmounts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => onChange(amount)}
              className={cn(value === amount && 'bg-primary text-primary-foreground')}
            >
              {currency}
              {amount}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}


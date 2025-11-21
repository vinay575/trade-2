import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

interface TimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  className?: string;
}

export function Timer({ initialSeconds, onComplete, className }: TimerProps) {
  const realtimeTimer = useAppSelector((state) => state.realtime.timer);
  const [seconds, setSeconds] = useState(initialSeconds || 60);

  useEffect(() => {
    if (realtimeTimer) {
      setSeconds(realtimeTimer.remaining);
    }
  }, [realtimeTimer]);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onComplete]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const isLow = seconds <= 10;

  return (
    <Card className={cn('p-4 flex items-center justify-center gap-2', className)}>
      <Clock className={cn('w-5 h-5', isLow && 'text-red-500 animate-pulse')} />
      <div className={cn('text-2xl font-bold font-mono', isLow && 'text-red-500')}>
        {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
      </div>
    </Card>
  );
}


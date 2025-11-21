import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@shared/schema';
import { cn } from '@/lib/utils';

interface TradesTableProps {
  trades: Order[];
  onCancel?: (orderId: string) => void;
  showActions?: boolean;
}

export function TradesTable({ trades, onCancel, showActions = true }: TradesTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-500/20 text-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-blue-500/20 text-blue-500';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 8 : 7} className="text-center text-muted-foreground">
                No trades found
              </TableCell>
            </TableRow>
          ) : (
            trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>{trade.type}</TableCell>
                <TableCell className={cn('font-semibold', getSideColor(trade.side))}>
                  {trade.side.toUpperCase()}
                </TableCell>
                <TableCell>{parseFloat(trade.quantity.toString()).toFixed(4)}</TableCell>
                <TableCell>
                  {trade.price ? `$${parseFloat(trade.price.toString()).toFixed(2)}` : 'Market'}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(trade.status)}>{trade.status}</Badge>
                </TableCell>
                <TableCell>
                  {trade.createdAt ? format(new Date(trade.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                </TableCell>
                {showActions && (
                  <TableCell>
                    {trade.status === 'pending' && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(trade.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


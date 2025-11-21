import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTradeHistory, fetchOrders } from '@/store/slices/tradeSlice';
import { TradesTable } from '@/components/tables/TradesTable';
import { History, TrendingUp, TrendingDown } from 'lucide-react';

export default function TradeHistory() {
  const dispatch = useAppDispatch();
  const { orders, tradeHistory, isLoading } = useAppSelector((state) => state.trade);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchTradeHistory());
  }, [dispatch]);

  const activeTrades = orders.filter(
    (order) => order.status === 'pending' || order.status === 'partial'
  );
  const completedTrades = orders.filter((order) => order.status === 'filled');
  const cancelledTrades = orders.filter((order) => order.status === 'cancelled');

  const totalProfit = completedTrades.reduce((sum, trade) => {
    const price = parseFloat(trade.averagePrice?.toString() || trade.price?.toString() || '0');
    const quantity = parseFloat(trade.filledQuantity?.toString() || trade.quantity.toString());
    return sum + price * quantity;
  }, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="w-8 h-8" />
          Trade History
        </h1>
        <p className="text-muted-foreground">View your trading activity and performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrades.length}</div>
            <p className="text-xs text-muted-foreground">Pending execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Completed trades</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Trades</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Trades</CardTitle>
              <CardDescription>Complete trading history</CardDescription>
            </CardHeader>
            <CardContent>
              <TradesTable trades={orders} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Trades</CardTitle>
              <CardDescription>Trades pending execution</CardDescription>
            </CardHeader>
            <CardContent>
              <TradesTable trades={activeTrades} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Trades</CardTitle>
              <CardDescription>Successfully executed trades</CardDescription>
            </CardHeader>
            <CardContent>
              <TradesTable trades={completedTrades} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cancelled Trades</CardTitle>
              <CardDescription>Trades that were cancelled</CardDescription>
            </CardHeader>
            <CardContent>
              <TradesTable trades={cancelledTrades} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


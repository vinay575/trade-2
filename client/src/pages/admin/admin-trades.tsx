import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradesTable } from '@/components/tables/TradesTable';
import { apiClient } from '@/lib/api';
import type { Order } from '@shared/schema';

export default function AdminTrades() {
  const [allTrades, setAllTrades] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await apiClient.get('/api/admin/orders');
        setAllTrades(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        setAllTrades([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  const pendingTrades = Array.isArray(allTrades) ? allTrades.filter((t) => t.status === 'pending') : [];
  const completedTrades = Array.isArray(allTrades) ? allTrades.filter((t) => t.status === 'filled') : [];
  const cancelledTrades = Array.isArray(allTrades) ? allTrades.filter((t) => t.status === 'cancelled') : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Trades</h1>
        <p className="text-muted-foreground">Monitor all trading activity</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Trades ({allTrades.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTrades.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTrades.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledTrades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Trades</CardTitle>
              <CardDescription>Complete trading history across all users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <TradesTable trades={allTrades} showActions={false} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Trades</CardTitle>
              <CardDescription>Trades awaiting execution</CardDescription>
            </CardHeader>
            <CardContent>
              <TradesTable trades={pendingTrades} showActions={false} />
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


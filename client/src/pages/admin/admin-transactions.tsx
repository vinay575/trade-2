import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionsTable } from '@/components/tables/TransactionsTable';
import { apiClient } from '@/lib/api';
import type { Transaction } from '@shared/schema';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiClient.get('/api/admin/transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const deposits = transactions.filter((t) => t.type === 'deposit');
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal');
  const pending = transactions.filter((t) => t.status === 'pending');
  const completed = transactions.filter((t) => t.status === 'completed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet Transactions</h1>
        <p className="text-muted-foreground">Monitor all deposit and withdrawal activity</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <TransactionsTable transactions={transactions} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposits</CardTitle>
              <CardDescription>All deposit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={deposits} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawals</CardTitle>
              <CardDescription>All withdrawal transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={withdrawals} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Transactions</CardTitle>
              <CardDescription>Transactions awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={pending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Transactions</CardTitle>
              <CardDescription>Successfully processed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={completed} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";

interface WalletSummary {
  totalBalance: number;
  inOrders: number;
  totalDeposits: number;
}

export default function Wallet() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      const timeoutId = setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading]); // Removed toast from dependencies

  const { ledger, isLoadingLedger, deposit, withdraw, isDepositing, isWithdrawing } = useWallet();
  
  // Fetch wallet summary data - refresh every 2 seconds for live balance updates
  const { data: walletSummary, isLoading: isLoadingSummary } = useQuery<WalletSummary>({
    queryKey: ['/api/wallet/summary'],
    enabled: isAuthenticated,
    refetchInterval: 2000, // Refresh every 2 seconds for live trading
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await fetch('/api/wallet/summary', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch wallet summary: ${res.status}`);
      }
      return res.json();
    },
  });

  const handleDeposit = (amount: string, method: string) => {
    deposit({ amount, method });
    setDepositDialogOpen(false);
  };

  const handleWithdraw = (amount: string, method: string) => {
    withdraw({ amount, method });
    setWithdrawDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-wallet-title">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and transactions</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-deposit">
                <ArrowDownToLine className="w-4 h-4" />
                Deposit
              </Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-glass bg-card/95">
              <DialogHeader>
                <DialogTitle className="font-condensed">Deposit Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Method</Label>
                  <Select defaultValue="upi">
                    <SelectTrigger data-testid="select-deposit-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (USD)</Label>
                  <Input type="number" placeholder="0.00" data-testid="input-deposit-amount" />
                </div>
                <Button 
                  className="w-full" 
                  data-testid="button-confirm-deposit"
                  disabled={isDepositing}
                  onClick={() => {
                    const amount = (document.querySelector('[data-testid="input-deposit-amount"]') as HTMLInputElement)?.value;
                    const method = "upi";
                    if (amount) handleDeposit(amount, method);
                  }}
                >
                  {isDepositing ? "Processing..." : "Confirm Deposit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-withdraw">
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-glass bg-card/95">
              <DialogHeader>
                <DialogTitle className="font-condensed">Withdraw Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Method</Label>
                  <Select defaultValue="bank">
                    <SelectTrigger data-testid="select-withdraw-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (USD)</Label>
                  <Input type="number" placeholder="0.00" data-testid="input-withdraw-amount" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Available Balance: ${walletSummary?.totalBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
                <Button 
                  className="w-full" 
                  data-testid="button-confirm-withdraw"
                  disabled={isWithdrawing}
                  onClick={() => {
                    const amount = (document.querySelector('[data-testid="input-withdraw-amount"]') as HTMLInputElement)?.value;
                    const method = "bank";
                    if (amount) handleWithdraw(amount, method);
                  }}
                >
                  {isWithdrawing ? "Processing..." : "Confirm Withdrawal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6" glow>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
            <WalletIcon className="w-5 h-5 text-primary" />
          </div>
          {isLoadingSummary ? (
            <div className="text-3xl font-condensed font-bold animate-pulse" data-testid="text-balance">
              Loading...
            </div>
          ) : (
            <>
              <div className="text-3xl font-condensed font-bold" data-testid="text-balance">
                ${walletSummary?.totalBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Available for trading</div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">In Orders</h3>
            <ArrowUpFromLine className="w-5 h-5 text-primary" />
          </div>
          {isLoadingSummary ? (
            <div className="text-3xl font-condensed font-bold animate-pulse" data-testid="text-in-orders">
              Loading...
            </div>
          ) : (
            <>
              <div className="text-3xl font-condensed font-bold" data-testid="text-in-orders">
                ${walletSummary?.inOrders?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Locked in open orders</div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Deposits</h3>
            <ArrowDownToLine className="w-5 h-5 text-teal" />
          </div>
          {isLoadingSummary ? (
            <div className="text-3xl font-condensed font-bold animate-pulse" data-testid="text-total-deposits">
              Loading...
            </div>
          ) : (
            <>
              <div className="text-3xl font-condensed font-bold" data-testid="text-total-deposits">
                ${walletSummary?.totalDeposits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">All-time deposits</div>
            </>
          )}
        </GlassCard>
      </div>

      <Card className="backdrop-blur-sm bg-card/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="font-condensed">Transaction History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLedger ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : ledger.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No transactions yet</TableCell>
                </TableRow>
              ) : ledger.map((tx: any) => (
                <TableRow key={tx.id} data-testid={`transaction-${tx.id}`}>
                  <TableCell className="text-sm">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "deposit" ? "default" : "secondary"}>
                      {tx.type === "deposit" ? "Deposit" : "Withdrawal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{tx.method.replace("_", " ")}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${parseFloat(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.status === "completed" ? "outline" : "secondary"}
                      className={tx.status === "completed" ? "text-teal border-teal" : ""}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

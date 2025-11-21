import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createWithdrawal } from '@/store/slices/walletSlice';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from '@/components/wallet/WalletCard';
import { CreditCard, Banknote, Wallet } from 'lucide-react';

export default function Withdraw() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { wallets, selectedWallet, isLoading } = useAppSelector((state) => state.wallet);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [processing, setProcessing] = useState(false);

  const handleWithdraw = async () => {
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: 'Please select a wallet',
        variant: 'destructive',
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const balance = parseFloat(selectedWallet.balance.toString());

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (withdrawAmount > balance) {
      toast({
        title: 'Error',
        description: 'Insufficient balance',
        variant: 'destructive',
      });
      return;
    }

    if (withdrawAmount < 10) {
      toast({
        title: 'Error',
        description: 'Minimum withdrawal amount is $10',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      await dispatch(
        createWithdrawal({
          walletId: selectedWallet.id,
          amount: withdrawAmount.toString(),
          method,
        })
      ).unwrap();

      toast({
        title: 'Success',
        description: 'Withdrawal request submitted successfully',
      });
      setAmount('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to process withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const availableBalance = selectedWallet
    ? parseFloat(selectedWallet.balance.toString())
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdraw Funds</h1>
        <p className="text-muted-foreground">Withdraw funds from your trading account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Form</CardTitle>
            <CardDescription>Enter the amount you want to withdraw</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max={availableBalance}
                step="0.01"
              />
              <p className="text-sm text-muted-foreground">
                Available: ${availableBalance.toFixed(2)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(availableBalance.toString())}
              >
                Withdraw All
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit/Debit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="crypto">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Cryptocurrency
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={processing || !amount || isLoading}
              className="w-full"
              size="lg"
            >
              {processing ? 'Processing...' : 'Withdraw Funds'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedWallet && <WalletCard wallet={selectedWallet} />}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Minimum withdrawal: $10</p>
              <p>• Bank transfers take 3-5 business days</p>
              <p>• Card withdrawals may take 1-2 business days</p>
              <p>• Cryptocurrency withdrawals are processed on blockchain confirmation</p>
              <p>• Withdrawal fees may apply depending on the method</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


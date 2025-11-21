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
import { createDeposit } from '@/store/slices/walletSlice';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from '@/components/wallet/WalletCard';
import { CreditCard, Banknote, Wallet } from 'lucide-react';

export default function Deposit() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { wallets, selectedWallet, isLoading } = useAppSelector((state) => state.wallet);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: 'Please select a wallet',
        variant: 'destructive',
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      await dispatch(
        createDeposit({
          walletId: selectedWallet.id,
          amount: depositAmount.toString(),
          method,
        })
      ).unwrap();

      toast({
        title: 'Success',
        description: 'Deposit request submitted successfully',
      });
      setAmount('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to process deposit',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deposit Funds</h1>
        <p className="text-muted-foreground">Add funds to your trading account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deposit Form</CardTitle>
            <CardDescription>Enter the amount you want to deposit</CardDescription>
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
                step="0.01"
              />
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit/Debit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Bank Transfer
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
              onClick={handleDeposit}
              disabled={processing || !amount || isLoading}
              className="w-full"
              size="lg"
            >
              {processing ? 'Processing...' : 'Deposit Funds'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedWallet && <WalletCard wallet={selectedWallet} />}
          <Card>
            <CardHeader>
              <CardTitle>Deposit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Minimum deposit: $10</p>
              <p>• Deposits are processed instantly for card payments</p>
              <p>• Bank transfers may take 1-3 business days</p>
              <p>• Cryptocurrency deposits are processed on blockchain confirmation</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


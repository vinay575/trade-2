import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminRiskControls() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    maxTradeAmount: 10000,
    minTradeAmount: 10,
    maxDailyLoss: 5000,
    maxDailyTrades: 100,
    enableTrading: true,
    enableWithdrawals: true,
    enableDeposits: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // TODO: Implement API call to save settings
    toast({
      title: 'Success',
      description: 'Risk control settings updated',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Risk Controls
        </h1>
        <p className="text-muted-foreground">Manage platform risk and safety settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trading Limits</CardTitle>
            <CardDescription>Set maximum and minimum trading amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Maximum Trade Amount</Label>
              <Input
                type="number"
                value={settings.maxTradeAmount}
                onChange={(e) =>
                  setSettings({ ...settings, maxTradeAmount: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum Trade Amount</Label>
              <Input
                type="number"
                value={settings.minTradeAmount}
                onChange={(e) =>
                  setSettings({ ...settings, minTradeAmount: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Daily Loss per User</Label>
              <Input
                type="number"
                value={settings.maxDailyLoss}
                onChange={(e) =>
                  setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Daily Trades per User</Label>
              <Input
                type="number"
                value={settings.maxDailyTrades}
                onChange={(e) =>
                  setSettings({ ...settings, maxDailyTrades: parseInt(e.target.value) })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Controls</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Trading</Label>
                <p className="text-sm text-muted-foreground">Allow users to place trades</p>
              </div>
              <Switch
                checked={settings.enableTrading}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableTrading: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Withdrawals</Label>
                <p className="text-sm text-muted-foreground">Allow users to withdraw funds</p>
              </div>
              <Switch
                checked={settings.enableWithdrawals}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableWithdrawals: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Deposits</Label>
                <p className="text-sm text-muted-foreground">Allow users to deposit funds</p>
              </div>
              <Switch
                checked={settings.enableDeposits}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableDeposits: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable platform</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
            {settings.maintenanceMode && (
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-yellow-500">
                  Maintenance mode is active. Users will see a maintenance message.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Trading</p>
              <Badge variant={settings.enableTrading ? 'default' : 'secondary'}>
                {settings.enableTrading ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Withdrawals</p>
              <Badge variant={settings.enableWithdrawals ? 'default' : 'secondary'}>
                {settings.enableWithdrawals ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deposits</p>
              <Badge variant={settings.enableDeposits ? 'default' : 'secondary'}>
                {settings.enableDeposits ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <Badge variant={settings.maintenanceMode ? 'destructive' : 'default'}>
                {settings.maintenanceMode ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}


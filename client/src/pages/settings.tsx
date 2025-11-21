import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Bell, CreditCard, LogOut } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-condensed font-bold mb-2" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2" data-testid="tab-payment">
            <CreditCard className="w-4 h-4" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="font-condensed">Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input defaultValue={(user as any)?.firstName || ""} data-testid="input-first-name" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input defaultValue={(user as any)?.lastName || ""} data-testid="input-last-name" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue={(user as any)?.email || ""} disabled data-testid="input-email" />
              </div>
              <Button data-testid="button-save-profile">Save Changes</Button>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="font-condensed">Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Secure your account with TOTP</p>
                  </div>
                  <Switch data-testid="switch-2fa" />
                </div>
              </CardContent>
            </GlassCard>

            <Card className="backdrop-blur-sm bg-card/40">
              <CardHeader>
                <CardTitle className="font-condensed">Active Sessions</CardTitle>
                <CardDescription>Manage your logged-in devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-md">
                  <div>
                    <p className="font-medium text-sm">Current Session</p>
                    <p className="text-xs text-muted-foreground">Chrome on Windows - Active now</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-logout-session">
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="font-condensed">Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trade Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when your orders are executed</p>
                </div>
                <Switch defaultChecked data-testid="switch-trade-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Price Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive notifications for price movements</p>
                </div>
                <Switch defaultChecked data-testid="switch-price-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">News & Updates</p>
                  <p className="text-sm text-muted-foreground">Stay updated with market news</p>
                </div>
                <Switch data-testid="switch-news-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive promotional content and offers</p>
                </div>
                <Switch data-testid="switch-marketing" />
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="payment">
          <div className="space-y-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="font-condensed">Bank Accounts</CardTitle>
                <CardDescription>Manage your linked bank accounts</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-3">
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-md">
                  <div>
                    <p className="font-medium">Chase Bank ****4567</p>
                    <p className="text-xs text-muted-foreground">Added on Jan 15, 2026</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-remove-bank">
                    Remove
                  </Button>
                </div>
                <Button variant="outline" className="w-full" data-testid="button-add-bank">
                  Add Bank Account
                </Button>
              </CardContent>
            </GlassCard>

            <Card className="backdrop-blur-sm bg-card/40">
              <CardHeader>
                <CardTitle className="font-condensed">UPI IDs</CardTitle>
                <CardDescription>Manage your UPI payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-md">
                  <div>
                    <p className="font-medium">user@paytm</p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-remove-upi">
                    Remove
                  </Button>
                </div>
                <Button variant="outline" className="w-full" data-testid="button-add-upi">
                  Add UPI ID
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-6 border-t border-border">
        <Button variant="destructive" className="gap-2" asChild data-testid="button-logout">
          <a href="/api/logout">
            <LogOut className="w-4 h-4" />
            Logout
          </a>
        </Button>
      </div>
    </div>
  );
}

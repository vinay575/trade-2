import { Switch, Route } from "wouter";
import { useMemo } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import MarketWatch from "@/pages/market-watch";
import Markets from "@/pages/markets";
import News from "@/pages/news";
import TradingTerminal from "@/pages/trading-terminal";
import Portfolio from "@/pages/portfolio";
import Wallet from "@/pages/wallet";
import Deposit from "@/pages/deposit";
import Withdraw from "@/pages/withdraw";
import TradeHistory from "@/pages/trade-history";
import Notifications from "@/pages/notifications";
import KYC from "@/pages/kyc";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin/admin-login";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminUsers from "@/pages/admin/admin-users";
import AdminTrades from "@/pages/admin/admin-trades";
import AdminTransactions from "@/pages/admin/admin-transactions";
import AdminRiskControls from "@/pages/admin/admin-risk-controls";
import AdminLogs from "@/pages/admin/admin-logs";

function Router() {
  // Don't call useAuth here - it causes re-renders
  // Routes are always available, components handle their own auth checks
  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/markets" component={Markets} />
      <Route path="/news" component={News} />
      
      {/* Landing page at root */}
      <Route path="/" component={Landing} />
      {/* Protected routes - components handle auth internally */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/market-watch" component={MarketWatch} />
      <Route path="/trading-terminal" component={TradingTerminal} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/trade-history" component={TradeHistory} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/kyc" component={KYC} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/trades" component={AdminTrades} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/risk-controls" component={AdminRiskControls} />
      <Route path="/admin/logs" component={AdminLogs} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const style = useMemo(() => ({
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  }), []);

  // Memoize the layout decision to prevent unnecessary re-renders
  const layout = useMemo(() => {
    // Show loading state only on initial load
    if (isLoading && isAuthenticated === undefined) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    // Show public layout (no sidebar) for unauthenticated users on public pages
    // Protected pages will handle their own auth checks
    if (!isAuthenticated) {
      return <Router />;
    }

    // Show authenticated layout with sidebar
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm bg-background/80">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }, [isAuthenticated, isLoading, style]);

  return layout;
}

function App() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

export default App;

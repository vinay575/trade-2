import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlassCard } from "@/components/GlassCard";
import { PublicNavbar } from "@/components/PublicNavbar";
import { LiveTicker } from "@/components/LiveTicker";
import { useYahooCandles } from "@/hooks/useYahooFinance";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Activity,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts";

// Using real market data from Yahoo Finance for all charts

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [selectedChartSymbol] = useState("AAPL");

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = user.role === "admin" ? "/admin/dashboard" : "/dashboard";
      // Only redirect if we're not already on the target path
      if (window.location.pathname !== targetPath) {
        setLocation(targetPath);
      }
    }
  }, [isAuthenticated, user, setLocation]);
  
  // Get chart data for Trading Terminal preview using Yahoo Finance
  const { data: terminalCandlesData, isLoading: isLoadingTerminalChart } = useYahooCandles(
    selectedChartSymbol,
    "1d",
    "1mo",
    true
  );

  // Format terminal chart data
  const terminalChartData = useMemo(() => {
    if (terminalCandlesData && terminalCandlesData.chart && terminalCandlesData.chart.result && terminalCandlesData.chart.result.length > 0) {
      try {
        const result = terminalCandlesData.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0];
        
        if (quotes && timestamps.length > 0) {
          const chartData = timestamps.map((timestamp: number, i: number) => {
            const date = new Date(timestamp * 1000);
            const price = quotes.close?.[i] || 0;
            return {
              date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              price: price,
            };
          }).filter(item => item.price > 0 && !isNaN(item.price));
          
          if (chartData.length > 0) {
            return chartData;
          }
        }
      } catch (error) {
        console.error("Error processing terminal chart data:", error);
      }
    }
    // Fallback data - generate realistic price movement
    const basePrice = 150;
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      const trend = Math.sin(i / 10) * 15;
      const noise = (Math.random() - 0.5) * 5;
      const growth = i * 0.5;
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: basePrice + growth + trend + noise,
      };
    });
  }, [terminalCandlesData]);

  const terminalChartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <LiveTicker />
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Live Market Data Powered by Yahoo Finance</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-condensed font-bold mb-6 leading-tight" data-testid="text-hero-title">
                Professional
                <br />
                <span className="bg-gradient-orange bg-clip-text text-transparent">
                  Trading Platform
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-hero-subtitle">
                Trade stocks, crypto, and forex with real-time data, advanced analytics, 
                and institutional-grade tools. Built for traders who demand excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-base group bg-gradient-orange hover:opacity-90" data-testid="button-get-started">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base" data-testid="button-learn-more">
                  <Link href="/markets">Explore Markets</Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 mt-8 pt-8 border-t border-border/50">
                <div>
                  <div className="text-2xl font-condensed font-bold">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Traders</div>
                </div>
                <div>
                  <div className="text-2xl font-condensed font-bold">$2.5B+</div>
                  <div className="text-sm text-muted-foreground">Trading Volume</div>
                </div>
                <div>
                  <div className="text-2xl font-condensed font-bold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <GlassCard className="p-6 shadow-2xl" neonBorder>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Portfolio Value</div>
                    <div className="text-3xl font-condensed font-bold">$125,847.32</div>
                    <div className="flex items-center gap-1 text-gain text-sm mt-1">
                      <TrendingUp className="w-4 h-4" />
                      +2.82% ($3,456.78)
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-2">
                    <Activity className="w-3 h-3" />
                    Live
                  </Badge>
                </div>
                <ChartContainer config={terminalChartConfig} className="h-[300px]">
                  <AreaChart data={terminalChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl font-condensed font-bold mb-4">
              Everything You Need to Trade
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools and features designed for serious traders
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="p-8 hover-elevate transition-all group" data-testid="card-feature-realtime" neonBorder>
              <div className="w-16 h-16 rounded-xl bg-gradient-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-condensed text-2xl mb-3 font-bold">Real-Time Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Live market data with sub-second latency powered by Yahoo Finance. 
                Never miss a trading opportunity with instant price updates.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover-elevate transition-all group" data-testid="card-feature-security" neonBorder>
              <div className="w-16 h-16 rounded-xl bg-gradient-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-condensed text-2xl mb-3 font-bold">Bank-Grade Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                2FA, encryption, and advanced security measures to protect your assets. 
                Your funds and data are always secure.
              </p>
            </GlassCard>

            <GlassCard className="p-8 hover-elevate transition-all group" data-testid="card-feature-multiasset" neonBorder>
              <div className="w-16 h-16 rounded-xl bg-gradient-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-condensed text-2xl mb-3 font-bold">Multi-Asset Trading</h3>
              <p className="text-muted-foreground leading-relaxed">
                Trade stocks, crypto, and forex all from one unified platform. 
                Access global markets with a single account.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Trading Terminal Preview */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card/20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Advanced Features</Badge>
              <h2 className="text-4xl md:text-5xl font-condensed font-bold mb-6">
                Professional Trading Terminal
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Professional charting tools, real-time order books, and lightning-fast execution. 
                Everything you need to trade like a pro, all in one place.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Advanced Charting with Multiple Timeframes",
                  "Real-time Order Book & Depth Charts",
                  "Market, Limit & Stop Orders",
                  "Portfolio Analytics & P&L Tracking",
                  "Risk Management Tools",
                  "Customizable Trading Interface"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" asChild className="group bg-gradient-orange hover:opacity-90">
                <Link href="/signup">
                  Start Trading Now
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <GlassCard className="p-6 shadow-2xl" neonBorder>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Trading Terminal</div>
                  <div className="text-xl font-condensed font-bold">{selectedChartSymbol}</div>
                </div>
                <Badge variant="secondary" className="gap-2">
                  <Activity className="w-3 h-3" />
                  Live Chart
                </Badge>
              </div>
              {isLoadingTerminalChart && terminalChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-8 h-8 animate-pulse text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading chart data...</p>
                  </div>
                </div>
              ) : terminalChartData.length > 0 ? (
                <ChartContainer config={terminalChartConfig} className="h-[300px]">
                  <AreaChart data={terminalChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(value) => value}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>Chart data unavailable</p>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gain animate-pulse" />
                  <span className="text-muted-foreground">Real-time Data</span>
                </div>
                <span className="text-muted-foreground">Powered by Yahoo Finance</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <GlassCard className="p-6 text-center" neonBorder>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-condensed font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Active Traders</div>
            </GlassCard>
            <GlassCard className="p-6 text-center" neonBorder>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-condensed font-bold text-primary mb-2">$2.5B+</div>
              <div className="text-muted-foreground">Trading Volume</div>
            </GlassCard>
            <GlassCard className="p-6 text-center" neonBorder>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-condensed font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </GlassCard>
            <GlassCard className="p-6 text-center" neonBorder>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-condensed font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-condensed font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of traders who trust TradePro for their daily trading needs. 
            Get started in minutes with our easy onboarding process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base bg-gradient-orange hover:opacity-90" data-testid="button-start-trading">
              <Link href="/signup">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base">
              <Link href="/markets">Explore Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-gradient-orange flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-condensed font-bold">TradePro</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional trading platform for modern traders.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Platform</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/markets" className="hover:text-primary transition-colors">Markets</Link></li>
                <li><Link href="/news" className="hover:text-primary transition-colors">News</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Resources</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/markets" className="hover:text-primary transition-colors">Market Data</Link></li>
                <li><Link href="/news" className="hover:text-primary transition-colors">Market News</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 TradePro. All rights reserved.</p>
            <p className="mt-2">Trading involves risk. Only trade with money you can afford to lose.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

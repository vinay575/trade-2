import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Newspaper, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Search,
  Filter,
  Calendar,
  Loader2
} from "lucide-react";

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  time: string;
  source: string;
  sentiment: string;
  impact: string;
  relatedAssets: string[];
  url?: string;
}

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: newsData, isLoading, dataUpdatedAt } = useQuery<{ articles: NewsArticle[] }>({
    queryKey: [`/api/news/financial?category=${selectedCategory}&limit=20`],
    queryFn: async () => {
      const res = await fetch(`/api/news/financial?category=${selectedCategory}&limit=20`);
      if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes for live news updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts
  });

  const newsArticles = newsData?.articles || [];
  const filteredNews = newsArticles;

  // Market sentiment data for chart
  const sentimentData = [
    { date: "Mon", bullish: 45, bearish: 25, neutral: 30 },
    { date: "Tue", bullish: 52, bearish: 20, neutral: 28 },
    { date: "Wed", bullish: 48, bearish: 22, neutral: 30 },
    { date: "Thu", bullish: 55, bearish: 18, neutral: 27 },
    { date: "Fri", bullish: 58, bearish: 15, neutral: 27 },
    { date: "Sat", bullish: 50, bearish: 20, neutral: 30 },
    { date: "Sun", bullish: 53, bearish: 17, neutral: 30 },
  ];

  // News impact by category
  const impactData = [
    { category: "Crypto", high: 12, medium: 8, low: 5 },
    { category: "Stocks", high: 15, medium: 10, low: 7 },
    { category: "Forex", high: 8, medium: 6, low: 4 },
    { category: "Markets", high: 10, medium: 8, low: 5 },
  ];

  const chartConfig = {
    bullish: {
      label: "Bullish",
      color: "hsl(142, 76%, 36%)",
    },
    bearish: {
      label: "Bearish",
      color: "hsl(0, 84%, 60%)",
    },
    neutral: {
      label: "Neutral",
      color: "hsl(var(--muted-foreground))",
    },
  };

  const categories = ["all", "crypto", "stocks", "forex", "markets"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading latest financial news...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-condensed font-bold mb-2">Market News</h1>
          <p className="text-muted-foreground">Stay informed with the latest market updates and analysis from real financial sources</p>
          {dataUpdatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date(dataUpdatedAt).toLocaleTimeString("en-US", { 
                hour: "2-digit", 
                minute: "2-digit" 
              })}
              {(() => {
                const now = new Date();
                const lastUpdate = new Date(dataUpdatedAt);
                const diffMs = now.getTime() - lastUpdate.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                if (diffMins < 1) {
                  return " (Just now)";
                } else if (diffMins < 60) {
                  return ` (${diffMins}m ago)`;
                }
                const diffHours = Math.floor(diffMins / 60);
                return ` (${diffHours}h ago)`;
              })()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search news articles..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer hover-elevate px-4 py-2"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main News Feed */}
        <div className="lg:col-span-2 space-y-4">
          {filteredNews.map((article) => (
            <GlassCard key={article.id} className="p-6 hover-elevate cursor-pointer" neonBorder>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{article.category}</Badge>
                  <Badge 
                    variant={article.sentiment === "bullish" ? "default" : article.sentiment === "bearish" ? "destructive" : "outline"}
                  >
                    {article.sentiment}
                  </Badge>
                  <Badge variant="outline">{article.impact} impact</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {article.time}
                </div>
              </div>
              <h3 className="text-xl font-condensed font-semibold mb-2">{article.title}</h3>
              <p className="text-muted-foreground mb-4">{article.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Related:</span>
                  {article.relatedAssets.map((asset) => (
                    <Badge key={asset} variant="outline" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{article.source}</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Sentiment Chart */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-condensed font-semibold">Market Sentiment</h3>
            </div>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="bullish" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="bearish" 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </GlassCard>

          {/* News Impact by Category */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-condensed font-semibold">News Impact</h3>
            </div>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={impactData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="high" stackId="a" fill="hsl(0, 84%, 60%)" />
                <Bar dataKey="medium" stackId="a" fill="hsl(45, 93%, 47%)" />
                <Bar dataKey="low" stackId="a" fill="hsl(142, 76%, 36%)" />
              </BarChart>
            </ChartContainer>
          </GlassCard>

          {/* Trending Topics */}
          <GlassCard className="p-4">
            <h3 className="text-lg font-condensed font-semibold mb-4">Trending Topics</h3>
            <div className="space-y-2">
              {["Bitcoin ETF", "Fed Rate Cuts", "AI Stocks", "Ethereum Upgrade", "Forex Volatility"].map((topic, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                  <span className="text-sm">{topic}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.floor(Math.random() * 50) + 10} articles
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* News Sources Table */}
          <GlassCard className="p-4">
            <h3 className="text-lg font-condensed font-semibold mb-4">Top Sources</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Articles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Bloomberg</TableCell>
                  <TableCell>24</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Reuters</TableCell>
                  <TableCell>18</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CoinDesk</TableCell>
                  <TableCell>15</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Financial Times</TableCell>
                  <TableCell>12</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CryptoNews</TableCell>
                  <TableCell>10</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      </div>
      </div>
    </div>
  );
}


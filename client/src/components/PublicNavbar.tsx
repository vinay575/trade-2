import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrendingUp, BarChart3, Newspaper } from "lucide-react";

export function PublicNavbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/markets", label: "Markets", icon: BarChart3 },
    { href: "/news", label: "News", icon: Newspaper },
  ];

  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-gradient-orange flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-condensed font-bold bg-gradient-orange bg-clip-text text-transparent">
                  TradePro
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">Professional Trading</p>
              </div>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-orange hover:opacity-90">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}


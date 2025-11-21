import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  PieChart,
  Wallet,
  FileCheck,
  Settings,
  Shield,
  LogOut,
  Users,
  Activity,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const userMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Market Watch",
    url: "/market-watch",
    icon: TrendingUp,
  },
  {
    title: "Trading Terminal",
    url: "/trading-terminal",
    icon: BarChart3,
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: PieChart,
  },
  {
    title: "Wallet",
    url: "/wallet",
    icon: Wallet,
  },
  {
    title: "KYC",
    url: "/kyc",
    icon: FileCheck,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Trades",
    url: "/admin/trades",
    icon: Activity,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: Wallet,
  },
  {
    title: "Risk Controls",
    url: "/admin/risk-controls",
    icon: AlertTriangle,
  },
  {
    title: "Logs",
    url: "/admin/logs",
    icon: FileText,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-md bg-gradient-orange flex items-center justify-center">
                {isAdmin ? <Shield className="w-6 h-6 text-white" /> : <TrendingUp className="w-6 h-6 text-white" />}
              </div>
              <h1 className="text-xl font-condensed font-bold bg-gradient-orange bg-clip-text text-transparent">
                {isAdmin ? "Admin Panel" : "TradePro"}
              </h1>
            </div>
          </div>
          <SidebarGroupLabel className="font-condensed">
            {isAdmin ? "Administration" : "Trading"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="outline" className="w-full gap-2" asChild data-testid="nav-logout">
          <a href="/api/logout">
            <LogOut className="w-4 h-4" />
            Logout
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

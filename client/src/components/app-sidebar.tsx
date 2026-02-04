import { Link, useLocation } from "wouter";
import { Pill, Archive, Shield, Building2, Wallet, BarChart3, Bell, LogOut, User, Settings, Coins, Trophy, Brain } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainMenuItems = [
  {
    title: "Pharma Sovereign Hub",
    url: "/",
    icon: Pill,
    badge: "LIVE",
  },
  {
    title: "Sentinel OS Auditor",
    url: "/sentinel",
    icon: Brain,
    badge: "AI",
  },
  {
    title: "Account Dashboard",
    url: "/account",
    icon: User,
  },
  {
    title: "ROI Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Alert Center",
    url: "/alerts",
    icon: Bell,
  },
];

const settingsMenuItems = [
  {
    title: "Wallet",
    url: "/wallet",
    icon: Wallet,
  },
  {
    title: "Treasury",
    url: "/treasury",
    icon: Coins,
    badge: "NEW",
  },
  {
    title: "Leaderboard",
    url: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Organization",
    url: "/organization",
    icon: Building2,
  },
  {
    title: "Admin Treasury",
    url: "/admin",
    icon: Settings,
    badge: "ADMIN",
  },
  {
    title: "Archive",
    url: "/archive",
    icon: Archive,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--electric-cyan))] to-[hsl(var(--neon-green))] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[hsl(var(--sovereign-blue))]" />
          </div>
          <div>
            <span className="text-base font-black text-[hsl(var(--electric-cyan))] uppercase tracking-tight block">
              POLAR COMMAND
            </span>
            <span className="text-[10px] font-mono text-sidebar-foreground/60 block">
              PolarUniversal Sovereign Systems
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
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
      <SidebarFooter className="p-4 space-y-4">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user.firstName || user.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="h-8 w-8"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="text-[10px] font-mono text-sidebar-foreground/50">
          Movement M1 | Railgun ZK | Gemini AI
        </div>
        <div className="text-[10px] font-mono text-sidebar-foreground/40">
          v3.1.0-WHALE
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

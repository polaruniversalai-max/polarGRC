import { Link, useLocation } from "wouter";
import { Pill, Archive, Shield, Building2, Wallet, BarChart3, Bell, LogOut, User, Settings, Coins, Trophy, Brain, Microscope, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

const coreMenuItems = [
  {
    title: "Pharma Hub",
    url: "/",
    icon: Pill,
    badge: "LIVE",
  },
  {
    title: "Sentinel Auditor",
    url: "/sentinel",
    icon: Brain,
    badge: "AI",
  },
  {
    title: "Clinical Engine",
    url: "/clinical",
    icon: Microscope,
    badge: "NDCT",
  },
  {
    title: "ROI Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
  },
];

const financeMenuItems = [
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
];

const systemMenuItems = [
  {
    title: "Account",
    url: "/account",
    icon: User,
  },
  {
    title: "Organization",
    url: "/organization",
    icon: Building2,
  },
  {
    title: "Admin",
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

interface MenuSectionProps {
  label: string;
  items: typeof coreMenuItems;
  location: string;
  defaultOpen?: boolean;
}

function MenuSection({ label, items, location, defaultOpen = true }: MenuSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasActiveItem = items.some(item => item.url === location);

  return (
    <Collapsible open={open || hasActiveItem} onOpenChange={setOpen}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="flex items-center justify-between cursor-pointer">
            <span>{label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${open || hasActiveItem ? "rotate-0" : "-rotate-90"}`} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="truncate">{item.title}</span>
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
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[hsl(var(--electric-cyan))] to-[hsl(var(--neon-green))] flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[hsl(var(--sovereign-blue))]" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-black text-[hsl(var(--electric-cyan))] uppercase tracking-tight block truncate">
              POLAR COMMAND
            </span>
            <span className="text-[9px] font-mono text-sidebar-foreground/50 block truncate">
              v3.1.0 Sovereign Systems
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <MenuSection label="Core" items={coreMenuItems} location={location} defaultOpen={true} />
        <MenuSection label="Finance" items={financeMenuItems} location={location} defaultOpen={false} />
        <MenuSection label="System" items={systemMenuItems} location={location} defaultOpen={false} />
      </SidebarContent>
      <SidebarFooter className="p-2">
        {user && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-sidebar-accent/30">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] text-[10px]">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {user.firstName || user.email?.split("@")[0] || "User"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

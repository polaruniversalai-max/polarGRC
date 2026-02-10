import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UtilitySidebar } from "@/components/utility-sidebar";
import { TenantBrandingProvider, useTenantBranding } from "@/contexts/tenant-branding";
import { TenantSelector } from "@/components/tenant-selector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PanelRightOpen, Clock, User, Shield } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PharmaDashboard from "@/pages/pharma-dashboard";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import OrganizationSettings from "@/pages/organization-settings";
import WalletPage from "@/pages/wallet";
import ROIAnalytics from "@/pages/roi-analytics";
import AlertCenter from "@/pages/alert-center";
import AccountPage from "@/pages/account";
import AdminPage from "@/pages/admin";
import TreasuryPage from "@/pages/treasury";
import LeaderboardPage from "@/pages/leaderboard-page";
import SentinelPage from "@/pages/sentinel";
import ClinicalAnalysisPage from "@/pages/clinical-analysis";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={PharmaDashboard} />
      <Route path="/account" component={AccountPage} />
      <Route path="/legacy" component={Dashboard} />
      <Route path="/archive" component={Dashboard} />
      <Route path="/organization" component={OrganizationSettings} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/treasury" component={TreasuryPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/analytics" component={ROIAnalytics} />
      <Route path="/alerts" component={AlertCenter} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/sentinel" component={SentinelPage} />
      <Route path="/clinical" component={ClinicalAnalysisPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);
  const formatted = time.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Kolkata",
  });
  return (
    <span className="flex items-center gap-1" data-testid="text-live-clock">
      <Clock className="w-3 h-3" />
      {formatted} IST
    </span>
  );
}

function AuthenticatedApp() {
  const [utilitySidebarOpen, setUtilitySidebarOpen] = useState(false);
  const { user } = useAuth();
  const { tenantConfig } = useTenantBranding();
  const sidebarStyle = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Agent"
    : "Agent";

  const auditorRole = tenantConfig?.auditorRole || "Sovereign Auditor";

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-3 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--sovereign-blue))] flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-mono text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  SECURE
                </span>
                <span className="hidden md:flex items-center gap-1 text-emerald-400 flex-shrink-0">
                  <Shield className="w-3 h-3" />
                  ZK Vault
                </span>
              </div>
              <TenantSelector />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <LiveClock />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground" data-testid="text-user-info">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]" data-testid="text-username">{displayName}</span>
                <span className="text-[hsl(var(--electric-cyan))] hidden md:inline" data-testid="text-auditor-role">{auditorRole}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUtilitySidebarOpen(!utilitySidebarOpen)}
                data-testid="button-open-utility-sidebar"
              >
                <PanelRightOpen className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </div>
        <UtilitySidebar
          isOpen={utilitySidebarOpen}
          onToggle={() => setUtilitySidebarOpen(!utilitySidebarOpen)}
        />
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--electric-cyan))]" />
          <span className="text-muted-foreground">Loading POLAR COMMAND...</span>
        </div>
      </div>
    );
  }

  // Show login page at /login route
  if (location === "/login") {
    return <LoginPage />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TenantBrandingProvider>
          <AppContent />
        </TenantBrandingProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

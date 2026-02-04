import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SecureFooterBar } from "@/components/secure-footer-bar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const sidebarStyle = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-2 p-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--sovereign-blue))]">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
          <SecureFooterBar />
        </div>
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
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

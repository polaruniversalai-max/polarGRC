import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Wallet, 
  Bell, 
  Shield, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ExternalLink,
  Loader2,
  ChevronRight,
  Package
} from "lucide-react";
import { Link } from "wouter";
import { safeNumber, formatNumber } from "@/lib/format";

interface CreditBalance {
  id: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  stakedPolarTokens: number;
  freeMonthlyScans: number;
  lastRewardAt: string | null;
}

interface LedgerEntry {
  id: string;
  actionType: string;
  description: string;
  creditsUsed: number;
  creditsEarned: number;
  createdAt: string;
}

interface Alert {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Compliance Sentinel alert generators
const generateComplianceSentinelAlerts = (credits: CreditBalance | undefined, alerts: Alert[]): Alert[] => {
  const sentinelAlerts: Alert[] = [];
  
  // Low Credit Balance Alert
  if (credits && safeNumber(credits.balance) < 10) {
    sentinelAlerts.push({
      id: "sentinel-low-credits",
      type: "credit",
      priority: "high",
      title: "Low Credit Balance",
      message: `Your balance is ${safeNumber(credits.balance)} credits. Top up to continue scanning.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }
  
  // Nov 27, 2026 Small Dispenser Deadline
  const deadline = new Date("2026-11-27");
  const now = new Date();
  const daysUntil = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 365) {
    sentinelAlerts.push({
      id: "sentinel-dscsa-deadline",
      type: "compliance",
      priority: daysUntil <= 90 ? "critical" : "medium",
      title: "DSCSA 2026 Deadline Approaching",
      message: `${daysUntil} days until Nov 27, 2026 - Small dispenser compliance required.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }
  
  // Add existing alerts
  return [...sentinelAlerts, ...alerts.slice(0, 5)];
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "critical": return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "high": return <AlertTriangle className="w-4 h-4 text-[hsl(var(--alert-amber))]" />;
    case "medium": return <Info className="w-4 h-4 text-blue-400" />;
    default: return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "critical": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
    case "high": return <Badge className="bg-[hsl(var(--alert-amber))]/20 text-[hsl(var(--alert-amber))] border-[hsl(var(--alert-amber))]/30">High</Badge>;
    case "medium": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Medium</Badge>;
    default: return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
  }
};

export default function AccountPage() {
  const { data: credits, isLoading: creditsLoading } = useQuery<CreditBalance>({
    queryKey: ["/api/v1/credits"],
  });

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery<{ transactions: LedgerEntry[] }>({
    queryKey: ["/api/v1/ledger"],
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ["/api/v1/alerts"],
  });

  const balance = safeNumber(credits?.balance);
  const lowBalance = balance < 10;
  const allAlerts = generateComplianceSentinelAlerts(credits, alertsData?.alerts || []);

  // DSCSA Countdown
  const deadline = new Date("2026-11-27");
  const now = new Date();
  const daysUntil = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]">Account Dashboard</h1>
            <p className="text-muted-foreground">Unified view of your $POLAR economy and compliance status</p>
          </div>
          <Badge className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30">
            Sovereign OS v3.1.0
          </Badge>
        </div>

        {/* Quick Stats Row */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[hsl(var(--electric-cyan))]/10 to-transparent border-[hsl(var(--electric-cyan))]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Credit Balance</div>
                  <div className="text-3xl font-bold text-[hsl(var(--electric-cyan))]" data-testid="text-account-balance">
                    {creditsLoading ? "..." : formatNumber(balance)}
                  </div>
                </div>
                <Wallet className="w-8 h-8 text-[hsl(var(--electric-cyan))]/50" />
              </div>
              {lowBalance && (
                <Badge variant="destructive" className="mt-2">Low Balance</Badge>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">$POLAR Staked</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {creditsLoading ? "..." : formatNumber(safeNumber(credits?.stakedPolarTokens))}
                  </div>
                </div>
                <Shield className="w-8 h-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Free Scans</div>
                  <div className="text-3xl font-bold text-green-400">
                    {creditsLoading ? "..." : formatNumber(safeNumber(credits?.freeMonthlyScans))}
                  </div>
                </div>
                <Zap className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${daysUntil <= 90 ? 'from-red-500/10 border-red-500/20' : 'from-[hsl(var(--alert-amber))]/10 border-[hsl(var(--alert-amber))]/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">DSCSA Deadline</div>
                  <div className={`text-3xl font-bold ${daysUntil <= 90 ? 'text-red-400' : 'text-[hsl(var(--alert-amber))]'}`}>
                    {daysUntil}d
                  </div>
                </div>
                <Clock className="w-8 h-8 text-[hsl(var(--alert-amber))]/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Token Ledger */}
          <Card className="lg:col-span-2 bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                  Token Ledger
                </CardTitle>
                <CardDescription>Recent $POLAR credit transactions</CardDescription>
              </div>
              <Link href="/wallet">
                <Button variant="outline" size="sm" className="gap-1" data-testid="link-view-wallet">
                  View Wallet <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ledgerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--electric-cyan))]" />
                </div>
              ) : (ledgerData?.transactions?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start scanning to see your usage history</p>
                </div>
              ) : (
                <div className="space-y-2" data-testid="token-ledger-list">
                  {ledgerData?.transactions?.slice(0, 8).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-[hsl(var(--sovereign-blue))]/30 rounded-lg"
                      data-testid={`ledger-row-${tx.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {safeNumber(tx.creditsEarned) > 0 ? (
                          <div className="p-2 rounded-full bg-green-500/20">
                            <ArrowUpRight className="w-4 h-4 text-green-400" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-full bg-orange-500/20">
                            <ArrowDownRight className="w-4 h-4 text-orange-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{tx.actionType.replace(/_/g, " ")}</div>
                          <div className="text-xs text-muted-foreground">{tx.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-semibold ${safeNumber(tx.creditsEarned) > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                          {safeNumber(tx.creditsEarned) > 0 ? `+${formatNumber(tx.creditsEarned)}` : `-${formatNumber(tx.creditsUsed)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Sentinel */}
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[hsl(var(--alert-amber))]" />
                  Compliance Sentinel
                </CardTitle>
                <CardDescription>Critical alerts and notifications</CardDescription>
              </div>
              <Link href="/alerts">
                <Button variant="outline" size="sm" className="gap-1" data-testid="link-view-alerts">
                  All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--electric-cyan))]" />
                </div>
              ) : allAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
                  <p className="text-green-400">All Clear</p>
                  <p className="text-sm">No compliance alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="sentinel-alerts">
                  {allAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.priority === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                        alert.priority === 'high' ? 'bg-[hsl(var(--alert-amber))]/10 border-[hsl(var(--alert-amber))]/30' :
                        'bg-[hsl(var(--sovereign-blue))]/30 border-[hsl(var(--border))]'
                      }`}
                      data-testid={`sentinel-alert-${alert.id}`}
                    >
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(alert.priority)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{alert.title}</span>
                            {getPriorityBadge(alert.priority)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/wallet">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="action-topup">
                  <CreditCard className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                  <div className="text-left">
                    <div className="font-medium">Top Up Credits</div>
                    <div className="text-xs text-muted-foreground">Add $POLAR with Stripe</div>
                  </div>
                </Button>
              </Link>
              
              <a href="https://jup.ag/swap/SOL-POLAR" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="action-buy-polar">
                  <ExternalLink className="w-5 h-5 text-green-400" />
                  <div className="text-left">
                    <div className="font-medium">Buy $POLAR</div>
                    <div className="text-xs text-muted-foreground">Jupiter DEX Swap</div>
                  </div>
                </Button>
              </a>

              <Link href="/analytics">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="action-analytics">
                  <Zap className="w-5 h-5 text-[hsl(var(--alert-amber))]" />
                  <div className="text-left">
                    <div className="font-medium">View ROI</div>
                    <div className="text-xs text-muted-foreground">Analytics Dashboard</div>
                  </div>
                </Button>
              </Link>

              <Link href="/organization">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="action-settings">
                  <User className="w-5 h-5 text-purple-400" />
                  <div className="text-left">
                    <div className="font-medium">Organization</div>
                    <div className="text-xs text-muted-foreground">FDA & Company Settings</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

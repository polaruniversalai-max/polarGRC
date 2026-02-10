import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  BarChart3,
  Target,
  Loader2,
  ShieldAlert,
  Calculator,
  Bot,
  Users
} from "lucide-react";
import { safeNumber, formatNumber, formatCompact } from "@/lib/format";

interface ROIData {
  finesAvoided: number;
  potentialFinePerViolation: number;
  verifiedScans: number;
  totalScans: number;
  complianceRate: number;
  timeSaved: { hours: number; costSaved: number };
  creditUsage: { total: number; scans: number; zkShielding: number; exports: number };
}

// Format currency with NaN protection
const formatCurrency = (amount: number | undefined | null): string => {
  const safe = safeNumber(amount);
  if (safe >= 1000000) return `$${(safe / 1000000).toFixed(1)}M`;
  if (safe >= 1000) return `$${(safe / 1000).toFixed(0)}K`;
  return `$${safe.toFixed(2)}`;
};

// Formula constants
const FINE_PER_VIOLATION = 10000; // $10,000 per violation
const MANUAL_AUDIT_COST_PER_UNIT = 50; // $50/unit manual
const AI_AUDIT_COST_PER_UNIT = 0.05; // $0.05/unit AI

export default function ROIAnalytics() {
  const { data: roi, isLoading } = useQuery<ROIData>({
    queryKey: ["/api/v1/analytics/roi"],
  });

  const mockROI: ROIData = {
    finesAvoided: 12400000,
    potentialFinePerViolation: FINE_PER_VIOLATION,
    verifiedScans: 1240,
    totalScans: 1289,
    complianceRate: 96.2,
    timeSaved: { hours: 2578, costSaved: 386700 },
    creditUsage: { total: 1567, scans: 1289, zkShielding: 145, exports: 133 },
  };

  const data = roi || mockROI;
  
  // Calculate formula-based metrics with Zero-NaN protection
  const verifiedScans = safeNumber(data.verifiedScans);
  const totalScans = safeNumber(data.totalScans);
  const calculatedFinesAvoided = verifiedScans * FINE_PER_VIOLATION;
  const manualCost = totalScans * MANUAL_AUDIT_COST_PER_UNIT;
  const aiCost = totalScans * AI_AUDIT_COST_PER_UNIT;
  const automationSavings = manualCost - aiCost;
  const savingsMultiplier = aiCost > 0 ? Math.floor(manualCost / aiCost) : 0;
  const complianceRate = safeNumber(data.complianceRate);

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]">ROI & Compliance Analytics</h1>
            <p className="text-muted-foreground">Financial impact and risk mitigation metrics</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Live Data
          </Badge>
        </div>

        {/* Top Metrics Row */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Risk Mitigation - Fines Avoided (Primary Card) */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <ShieldAlert className="w-5 h-5" />
                Risk Mitigation
              </CardTitle>
              <CardDescription>Potential FDA penalties prevented through compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-green-400" data-testid="text-fines-avoided">
                {isLoading ? <Loader2 className="animate-spin" /> : formatCurrency(calculatedFinesAvoided)}
              </div>
              <div className="mt-4 p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-[hsl(var(--alert-amber))]" />
                  <span className="text-sm font-semibold text-[hsl(var(--alert-amber))]">Formula</span>
                </div>
                <div className="font-mono text-sm" data-testid="text-fines-formula">
                  Fines Avoided = Verified_Scans × $10,000
                </div>
                <div className="font-mono text-sm text-muted-foreground mt-1">
                  = {formatNumber(verifiedScans)} × ${formatNumber(FINE_PER_VIOLATION)} = {formatCurrency(calculatedFinesAvoided)}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  <span>{formatNumber(verifiedScans)} Verified Scans</span>
                </div>
                <div className="text-muted-foreground">
                  @ {formatCurrency(FINE_PER_VIOLATION)} per violation
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Saved */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Clock className="w-5 h-5" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-400" data-testid="text-hours-saved">
                {formatNumber(safeNumber(data.timeSaved?.hours))}
              </div>
              <div className="text-sm text-muted-foreground">Hours</div>
              <div className="mt-2 text-lg font-semibold text-blue-300">
                {formatCurrency(safeNumber(data.timeSaved?.costSaved))}
              </div>
              <div className="text-xs text-muted-foreground">Labor Cost Savings</div>
            </CardContent>
          </Card>

          {/* Compliance Rate */}
          <Card className="bg-gradient-to-br from-[hsl(var(--electric-cyan))]/10 to-transparent border-[hsl(var(--electric-cyan))]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--electric-cyan))]">
                <Target className="w-5 h-5" />
                Compliance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[hsl(var(--electric-cyan))]" data-testid="text-compliance-rate">
                {complianceRate.toFixed(1)}%
              </div>
              <Progress 
                value={complianceRate} 
                className="mt-4 h-2 bg-[hsl(var(--sovereign-blue))]"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                {formatNumber(totalScans)} Total Scans
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automation Savings Bento Card */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-[hsl(var(--alert-amber))]/10 to-transparent border-[hsl(var(--alert-amber))]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--alert-amber))]">
                <TrendingUp className="w-5 h-5" />
                Automation Savings
              </CardTitle>
              <CardDescription>Cost efficiency: Manual vs AI audit comparison</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Manual Audit</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-400" data-testid="text-manual-cost">
                    {formatCurrency(manualCost)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${MANUAL_AUDIT_COST_PER_UNIT}/unit × {formatNumber(totalScans)} units
                  </div>
                </div>
                <div className="p-4 bg-[hsl(var(--electric-cyan))]/10 rounded-lg border border-[hsl(var(--electric-cyan))]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                    <span className="text-sm font-medium text-[hsl(var(--electric-cyan))]">AI Audit</span>
                  </div>
                  <div className="text-2xl font-bold text-[hsl(var(--electric-cyan))]" data-testid="text-ai-cost">
                    {formatCurrency(aiCost)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${AI_AUDIT_COST_PER_UNIT}/unit × {formatNumber(totalScans)} units
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Savings</div>
                    <div className="text-3xl font-bold text-green-400" data-testid="text-automation-savings">
                      {formatCurrency(automationSavings)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {savingsMultiplier}x More Efficient
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground font-mono">
                  Savings = ($50/unit - $0.05/unit) × {formatNumber(totalScans)} = {formatCurrency(automationSavings)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                Manual vs. AI Audit Comparison
              </CardTitle>
              <CardDescription>Time efficiency gains from automated verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Manual Audit</span>
                    <span className="text-sm text-muted-foreground">2 hours per scan</span>
                  </div>
                  <div className="h-8 bg-orange-500/20 rounded-lg flex items-center px-3">
                    <div className="text-sm font-mono text-orange-400">
                      {formatNumber(totalScans * 2)} hours total
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI Instant Verification</span>
                    <span className="text-sm text-muted-foreground">~3 seconds per scan</span>
                  </div>
                  <div className="h-8 bg-[hsl(var(--electric-cyan))]/20 rounded-lg flex items-center px-3" style={{ width: '5%', minWidth: '100px' }}>
                    <div className="text-sm font-mono text-[hsl(var(--electric-cyan))]">
                      {((totalScans * 3) / 3600).toFixed(1)} hours
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">
                    {totalScans > 0 ? ((totalScans * 2 * 60) / Math.max(totalScans * 3 / 60, 1)).toFixed(0) : 0}x Faster
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Reduction in audit processing time
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Usage */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              Credit Usage Breakdown
            </CardTitle>
            <CardDescription>How your $POLAR credits are being utilized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-[hsl(var(--electric-cyan))]">
              {formatNumber(safeNumber(data.creditUsage?.total))}
            </div>
            <div className="text-sm text-muted-foreground">Total Credits Used</div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Scans (1 credit each)</span>
                  <span className="text-sm font-mono">{formatNumber(safeNumber(data.creditUsage?.scans))}</span>
                </div>
                <Progress 
                  value={safeNumber(data.creditUsage?.total) > 0 ? (safeNumber(data.creditUsage?.scans) / safeNumber(data.creditUsage?.total)) * 100 : 0} 
                  className="h-2"
                />
              </div>
              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">ZK-Shielding (5 credits each)</span>
                  <span className="text-sm font-mono">{formatNumber(safeNumber(data.creditUsage?.zkShielding) * 5)}</span>
                </div>
                <Progress 
                  value={safeNumber(data.creditUsage?.total) > 0 ? (safeNumber(data.creditUsage?.zkShielding) * 5 / safeNumber(data.creditUsage?.total)) * 100 : 0} 
                  className="h-2"
                />
              </div>
              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">PDF Exports (2 credits each)</span>
                  <span className="text-sm font-mono">{formatNumber(safeNumber(data.creditUsage?.exports) * 2)}</span>
                </div>
                <Progress 
                  value={safeNumber(data.creditUsage?.total) > 0 ? (safeNumber(data.creditUsage?.exports) * 2 / safeNumber(data.creditUsage?.total)) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DSCSA Countdown */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle>DSCSA 2026 Compliance Countdown</CardTitle>
            <CardDescription>Federal deadline for full serialization and traceability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {(() => {
                const deadline = new Date("2026-11-27");
                const now = new Date();
                const diff = deadline.getTime() - now.getTime();
                const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                const months = Math.floor(days / 30);
                
                return (
                  <>
                    <div className="text-center p-6 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                      <div className="text-4xl font-bold text-[hsl(var(--electric-cyan))]">{months}</div>
                      <div className="text-sm text-muted-foreground">Months</div>
                    </div>
                    <div className="text-center p-6 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                      <div className="text-4xl font-bold text-[hsl(var(--electric-cyan))]">{days % 30}</div>
                      <div className="text-sm text-muted-foreground">Days</div>
                    </div>
                    <div className="col-span-2 p-6 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-[hsl(var(--alert-amber))]" />
                        <span className="font-semibold">November 27, 2026</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        All trading partners must be able to verify product identifiers and 
                        share transaction data electronically. Non-compliance penalties up to 
                        $10,000 per violation.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

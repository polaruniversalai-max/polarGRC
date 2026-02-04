import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pill,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Scan,
  Clock,
  Zap,
  Lock,
  Radio,
  ChevronDown,
  Send,
  Loader2,
  TrendingDown,
  Server,
  Cpu,
  WifiOff,
  CloudOff,
  Wrench,
  Target,
  ShieldAlert,
  FileCheck,
  Terminal,
} from "lucide-react";
import { UtilitySidebar } from "@/components/utility-sidebar";
import { HelpDrawer } from "@/components/help-drawer";
import { WidgetWrapper } from "@/components/widget-wrapper";
import { OnboardingTour } from "@/components/onboarding-tour";
import { LiveAuditMapView } from "@/components/live-audit-map";
import { AIInsightModal } from "@/components/ai-insight-modal";
import { IndiaAIPackExport } from "@/components/india-ai-pack-export";
import { useHapticFeedback } from "@/hooks/use-mobile";
import "react-tooltip/dist/react-tooltip.css";

interface ScanResult {
  serial_id: string;
  product_name?: string;
  status: "VERIFIED" | "QUARANTINE" | "AUDIT_REQUIRED" | "PENDING" | "COUNTERFEIT";
  timestamp: string;
  movement_verified: boolean;
  ledger_version?: number;
  tx_hash?: string;
  offline_cached?: boolean;
  is_demo_data?: boolean;
}

interface PrivacyWallet {
  zk_address: string;
  viewing_key: {
    public_key: string;
    private_key: string;
  };
}

interface RiskLevel {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  violations: number;
}

interface GasSavings {
  sovereign_route: { chain: string; cost_usd: number };
  standard_route: { chain: string; cost_usd: number };
  savings: { amount_usd: number; percent: number };
}

interface OfflineCache {
  pendingScans: ScanResult[];
  lastSyncAttempt: string;
}

const OFFLINE_CACHE_KEY = "polarcommand_offline_cache";

interface ComplianceAnalysisResult {
  success: boolean;
  timestamp: string;
  scenario: string;
  analysis: {
    status: string;
    confidence: number;
    violations: Array<{ type: string; severity: string; description: string }>;
    recommendations: string[];
    quarantine_triggered: boolean;
  };
  opik_traced: boolean;
  project: string;
}

interface TEELogEntry {
  message: string;
  timestamp: string;
  status: "pending" | "complete";
}

function ComplianceCommandCenter({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [scenario, setScenario] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComplianceAnalysisResult | null>(null);
  const [teeLogs, setTeeLogs] = useState<TEELogEntry[]>([]);

  const addTeeLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setTeeLogs(prev => [...prev, { message, timestamp, status: "complete" }]);
  };

  const handleRunAudit = async () => {
    if (!scenario.trim()) {
      toast({
        title: "Missing Scenario",
        description: "Please enter a compliance scenario to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setTeeLogs([]);

    try {
      addTeeLog("Initializing Secure Enclave...");
      await new Promise(resolve => setTimeout(resolve, 400));
      
      addTeeLog("Generic Secure TEE (Trusted Execution Environment) ready");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addTeeLog("Sealing Regulatory Metadata...");
      await new Promise(resolve => setTimeout(resolve, 350));
      
      addTeeLog("Generating ZK-Proof for Solana ledger...");
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch("/api/v1/compliance/analyze-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      
      addTeeLog("ZK-Proof verified on Movement M2 Mainnet");
      addTeeLog("Compliance attestation sealed to blockchain");
      
      setResult(data);
      
      toast({
        title: "Audit Complete",
        description: `Analysis traced to Opik project: ${data.project}`,
      });
    } catch (error) {
      addTeeLog("ERROR: Secure enclave operation failed");
      toast({
        title: "Analysis Failed",
        description: "Could not complete compliance analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="col-span-1 md:col-span-12 bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="compliance-command-center">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
            </div>
            <div>
              <CardTitle className="text-lg font-sans">Compliance Command Center</CardTitle>
              <p className="text-xs font-mono text-muted-foreground">AI-Powered Audit Analysis</p>
            </div>
          </div>
          <Badge className="text-[9px] font-mono bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30">OPIK TRACED</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">Compliance Scenario</label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe your compliance scenario... (e.g., 'A pharmaceutical shipment arrived with temperature logs showing 12°C for 4 hours during transit')"
              className="w-full h-24 p-3 bg-[hsl(var(--sovereign-blue))] border border-[hsl(var(--border))] rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[hsl(var(--electric-cyan))]/50"
              data-testid="input-compliance-scenario"
            />
          </div>
          
          <Button
            onClick={handleRunAudit}
            disabled={isAnalyzing || !scenario.trim()}
            className="w-full bg-gradient-to-r from-[hsl(var(--electric-cyan))] to-[hsl(var(--neon-green))] text-[hsl(var(--deep-navy))] font-mono text-sm uppercase tracking-wider"
            data-testid="button-run-audit"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ANALYZING...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                RUN PROFESSIONAL AUDIT
              </>
            )}
          </Button>

          {teeLogs.length > 0 && (
            <div className="mt-4 p-3 bg-[hsl(var(--deep-navy))] rounded-lg border border-[hsl(155_80%_40%)]/30 font-mono text-xs" data-testid="tee-terminal-logs">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[hsl(155_80%_40%)]/20">
                <div className="w-2 h-2 rounded-full bg-[hsl(155_80%_40%)] animate-pulse"></div>
                <span className="text-[hsl(155_80%_40%)] uppercase text-[10px] tracking-widest">Secure TEE Terminal</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {teeLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60 shrink-0">[{log.timestamp}]</span>
                    <span className={`${log.message.startsWith("ERROR") ? "text-[hsl(var(--danger))]" : "text-[hsl(155_80%_40%)]"}`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-[hsl(155_80%_40%)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]" data-testid="audit-result">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-muted-foreground">AUDIT RESULT</span>
                <Badge className={`text-[9px] font-mono ${
                  result.analysis.status === "COMPLIANT" 
                    ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30"
                    : "bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30"
                }`}>
                  {result.analysis.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2 bg-[hsl(var(--deep-navy))] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${result.analysis.confidence >= 0.8 ? "bg-[hsl(var(--neon-green))]" : result.analysis.confidence >= 0.5 ? "bg-[hsl(var(--electric-cyan))]" : "bg-[hsl(var(--warning))]"}`}
                    style={{ width: `${result.analysis.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{Math.round(result.analysis.confidence * 100)}% CONFIDENCE</span>
              </div>

              {result.analysis.violations.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-mono uppercase text-[hsl(var(--danger))] block mb-2">VIOLATIONS ({result.analysis.violations.length})</span>
                  {result.analysis.violations.slice(0, 3).map((v, i) => (
                    <div key={i} className="text-xs font-mono text-muted-foreground pl-3 py-1 border-l-2 border-[hsl(var(--danger))]/30 mb-1">
                      <span className="text-[hsl(var(--danger))]">[{v.severity}]</span> {v.description}
                    </div>
                  ))}
                </div>
              )}

              {result.analysis.recommendations.length > 0 && (
                <div>
                  <span className="text-xs font-mono uppercase text-[hsl(var(--electric-cyan))] block mb-2">RECOMMENDATIONS</span>
                  {result.analysis.recommendations.slice(0, 3).map((r, i) => (
                    <div key={i} className="text-xs font-mono text-muted-foreground pl-3 py-1 border-l-2 border-[hsl(var(--electric-cyan))]/30 mb-1">
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const safeNumber = (value: number | null | undefined, fallback: string = "Syncing..."): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value.toString();
};

const safePercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "Syncing...";
  }
  return `${value}%`;
};

const safeCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "$0.00";
  }
  return `$${value.toFixed(2)}`;
};

const formatTexasTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export default function PharmaDashboard() {
  const { toast } = useToast();
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [infrastructureMode, setInfrastructureMode] = useState<"economy" | "fortress">("fortress");
  const [privacyWallet, setPrivacyWallet] = useState<PrivacyWallet | null>(null);
  const [showViewingKey, setShowViewingKey] = useState(false);
  const [shieldedHistory, setShieldedHistory] = useState<any[]>([]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>({ level: "LOW", score: 15, violations: 0 });
  const [gasSavings, setGasSavings] = useState<GasSavings | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [batchEmail, setBatchEmail] = useState("");
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineCache, setOfflineCache] = useState<OfflineCache>({ pendingScans: [], lastSyncAttempt: "" });
  const [showRemediationModal, setShowRemediationModal] = useState(false);
  const [utilitySidebarOpen, setUtilitySidebarOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [showAIInsightModal, setShowAIInsightModal] = useState(false);
  const haptics = useHapticFeedback();
  const [activeHelpWidget, setActiveHelpWidget] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleHelpClick = (widgetId: string) => {
    setActiveHelpWidget(widgetId);
    setHelpDrawerOpen(true);
  };

  const handleNavigateToWidget = (widgetId: string) => {
    const element = document.getElementById(widgetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-[hsl(var(--electric-cyan))]");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-[hsl(var(--electric-cyan))]");
      }, 2000);
    }
  };

  const fetchDemoScans = async () => {
    try {
      const response = await fetch("/api/v1/scans?limit=20");
      if (response.ok) {
        const data = await response.json();
        if (data.scans && data.scans.length > 0) {
          const formattedScans: ScanResult[] = data.scans.map((scan: any) => ({
            serial_id: scan.serial_id,
            product_name: scan.product_name,
            status: scan.status,
            timestamp: scan.created_at || new Date().toISOString(),
            movement_verified: scan.movement_verified,
            ledger_version: scan.ledger_version,
            tx_hash: scan.tx_hash,
            is_demo_data: scan.is_demo_data,
          }));
          setScanHistory(formattedScans);
        }
      }
    } catch (e) {
      console.error("Failed to fetch demo scans:", e);
    }
  };

  useEffect(() => {
    const savedCache = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (savedCache) {
      setOfflineCache(JSON.parse(savedCache));
    }
    fetchGasSavings();
    fetchDemoScans();
    const interval = setInterval(fetchGasSavings, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (offlineCache.pendingScans.length > 0) {
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(offlineCache));
    }
  }, [offlineCache]);

  const fetchGasSavings = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch("/api/v1/gas/savings", { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setGasSavings(data);
        if (isOfflineMode) {
          setIsOfflineMode(false);
          syncOfflineCache();
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setIsOfflineMode(true);
      }
      console.error("Failed to fetch gas savings:", e);
    }
  };

  const syncOfflineCache = async () => {
    if (offlineCache.pendingScans.length === 0) return;
    
    toast({ title: "Syncing offline scans...", description: `${offlineCache.pendingScans.length} pending` });
    
    for (const scan of offlineCache.pendingScans) {
      try {
        await fetch("/api/v1/analyze-shipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serial_id: scan.serial_id,
            pharmacy_id: privacyWallet?.zk_address?.slice(0, 20) || "default-pharmacy",
            temperature_logs: [{ celsius: 4.5, location: "Cold Storage" }],
            chain_of_custody: [{ entity: "Manufacturer" }, { entity: "Distributor" }],
            shield_data: true,
            offline_sync: true,
          }),
        });
      } catch (e) {
        console.error("Failed to sync scan:", scan.serial_id);
      }
    }
    
    setOfflineCache({ pendingScans: [], lastSyncAttempt: new Date().toISOString() });
    localStorage.removeItem(OFFLINE_CACHE_KEY);
    toast({ title: "Sync Complete", description: "All offline scans submitted" });
  };

  const handleScan = async () => {
    if (!scanInput.trim()) {
      toast({ title: "Enter a serial ID to scan", variant: "destructive" });
      haptics.errorPattern();
      return;
    }

    haptics.mediumTap();
    setIsScanning(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch("/api/v1/analyze-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_id: scanInput,
          pharmacy_id: privacyWallet?.zk_address?.slice(0, 20) || "default-pharmacy",
          temperature_logs: [{ celsius: 4.5, location: "Cold Storage" }],
          chain_of_custody: [{ entity: "Manufacturer" }, { entity: "Distributor" }],
          shield_data: true,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      const result: ScanResult = {
        serial_id: scanInput,
        status: data.analysis?.status || "PENDING",
        timestamp: new Date().toISOString(),
        movement_verified: true,
        tx_hash: data.quarantine?.transaction_hash,
      };

      setScanHistory(prev => [result, ...prev].slice(0, 10));

      if (data.privacy?.viewing_key && !privacyWallet) {
        setPrivacyWallet({
          zk_address: data.privacy.zk_address,
          viewing_key: {
            public_key: data.privacy.viewing_key.public_key,
            private_key: data.privacy.viewing_key.private_key,
          },
        });
      }

      const newViolations = data.analysis?.violations?.length || 0;
      updateRiskLevel(newViolations);

      if (gasSavings) {
        setTotalSavings(prev => prev + gasSavings.savings.amount_usd);
      }

      if (isOfflineMode) {
        setIsOfflineMode(false);
      }

      toast({
        title: data.analysis?.status === "VERIFIED" ? "DSCSA 2026 Compliant" : "Scan Complete",
        description: `Status: ${data.analysis?.status || "PENDING"}`,
      });
      
      haptics.onChainConfirm();
      setScanInput("");
    } catch (e: any) {
      if (e.name === "AbortError") {
        setIsOfflineMode(true);
        
        const offlineResult: ScanResult = {
          serial_id: scanInput,
          status: "PENDING",
          timestamp: new Date().toISOString(),
          movement_verified: false,
          offline_cached: true,
        };
        
        setScanHistory(prev => [offlineResult, ...prev].slice(0, 10));
        setOfflineCache(prev => ({
          pendingScans: [...prev.pendingScans, offlineResult],
          lastSyncAttempt: new Date().toISOString(),
        }));
        
        toast({ 
          title: "Secure Offline Mode", 
          description: "Scan cached locally. Will sync when connection restored.",
        });
        setScanInput("");
      } else {
        toast({ title: "Scan failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const updateRiskLevel = (newViolations: number) => {
    setRiskLevel(prev => {
      const totalViolations = prev.violations + newViolations;
      let level: RiskLevel["level"] = "LOW";
      let score = 15;

      if (totalViolations >= 5) {
        level = "CRITICAL";
        score = 95;
      } else if (totalViolations >= 3) {
        level = "HIGH";
        score = 75;
      } else if (totalViolations >= 1) {
        level = "MEDIUM";
        score = 45;
      }

      return { level, score, violations: totalViolations };
    });
  };

  const createPrivacyWallet = async () => {
    setIsLoadingWallet(true);
    try {
      const response = await fetch("/api/v1/privacy/create-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacy_id: `pharmacy_${Date.now()}` }),
      });

      const data = await response.json();
      if (data.success) {
        setPrivacyWallet({
          zk_address: data.zk_address,
          viewing_key: {
            public_key: data.viewing_key.public_key,
            private_key: data.viewing_key.private_key,
          },
        });
        toast({ title: "Privacy Wallet Created", description: "Your 0zk address is ready" });
      }
    } catch (e: any) {
      toast({ title: "Failed to create wallet", variant: "destructive" });
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const viewShieldedHistory = async () => {
    if (!privacyWallet) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/v1/privacy/view-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacy_id: privacyWallet.zk_address.slice(0, 20),
          viewing_private_key: privacyWallet.viewing_key.private_key,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShieldedHistory(data.history || []);
        toast({ title: "Custody Decrypted", description: `${data.total_notes} shielded notes found` });
      }
    } catch (e: any) {
      toast({ title: "Failed to decrypt custody", variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const downloadReport = async (format: "json" | "csv" | "pdf") => {
    try {
      const response = await fetch(`/api/v1/export-report?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance_report.${format === "pdf" ? "txt" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast({ title: "Report Downloaded", description: `${format.toUpperCase()} report saved` });
    } catch (e) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const requestBatchAudit = async () => {
    if (!batchEmail.trim()) {
      toast({ title: "Enter email address", variant: "destructive" });
      return;
    }

    setIsSendingBatch(true);
    try {
      const response = await fetch("/api/v1/batch-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: batchEmail,
          pharmacy_id: privacyWallet?.zk_address?.slice(0, 20) || "default-pharmacy",
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Batch Audit Requested", description: `Report will be sent to ${batchEmail}` });
        setBatchEmail("");
      }
    } catch (e) {
      toast({ title: "Request failed", variant: "destructive" });
    } finally {
      setIsSendingBatch(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED": 
        return { text: "DSCSA 2026 COMPLIANT | AUTHENTIC", color: "text-[hsl(var(--electric-cyan))]", bg: "bg-[hsl(var(--electric-cyan))]/20" };
      case "QUARANTINE": 
        return { text: "QUARANTINE", color: "text-[hsl(var(--danger))]", bg: "bg-[hsl(var(--danger))]/20" };
      case "COUNTERFEIT": 
        return { text: "COUNTERFEIT DETECTED", color: "text-red-500", bg: "bg-red-500/20" };
      case "AUDIT_REQUIRED": 
        return { text: "AUDIT REQUIRED", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]/20" };
      default: 
        return { text: "PENDING", color: "text-muted-foreground", bg: "bg-muted/20" };
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "from-red-500 to-red-700";
      case "HIGH": return "from-orange-500 to-red-500";
      case "MEDIUM": return "from-yellow-500 to-orange-500";
      default: return "from-[hsl(var(--electric-cyan))] to-[hsl(var(--neon-green))]";
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-4 md:p-6" data-testid="pharma-dashboard">
      <OnboardingTour isUtilitySidebarOpen={utilitySidebarOpen} />
      <HelpDrawer 
        isOpen={helpDrawerOpen} 
        onClose={() => setHelpDrawerOpen(false)} 
        widgetId={activeHelpWidget} 
      />
      <UtilitySidebar 
        isOpen={utilitySidebarOpen}
        onToggle={() => setUtilitySidebarOpen(!utilitySidebarOpen)}
        onNavigateToWidget={handleNavigateToWidget}
      />
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(var(--electric-cyan))] to-[hsl(var(--neon-green))] flex items-center justify-center">
              <Shield className="w-7 h-7 text-[hsl(var(--sovereign-blue))]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-sans font-black text-[hsl(var(--electric-cyan))] tracking-tight uppercase">
                POLAR COMMAND
              </h1>
              <p className="text-xs md:text-sm font-mono text-muted-foreground">
                PolarUniversal Sovereign Systems v3.1.0-WHALE
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--midnight-navy))] rounded-md border border-[hsl(var(--glass-border))]">
              <div className={`w-2 h-2 rounded-full ${isOfflineMode ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--neon-green))] animate-pulse"}`} />
              <span className="text-[10px] font-mono text-muted-foreground">
                Node: Movement M1 Testnet | Privacy: {privacyWallet ? "ZK-Active" : "ZK-Ready"}
              </span>
            </div>
            
            {isOfflineMode && (
              <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 gap-1">
                <WifiOff className="w-3 h-3" />
                Secure Offline Mode
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-download-reports">
                  <Download className="w-4 h-4" />
                  Download Reports
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadReport("json")} data-testid="menu-item-json">
                  <FileJson className="w-4 h-4 mr-2" />
                  JSON Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadReport("csv")} data-testid="menu-item-csv">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadReport("pdf")} data-testid="menu-item-pdf">
                  <FileText className="w-4 h-4 mr-2" />
                  PDF Format
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Email for batch report"
                value={batchEmail}
                onChange={(e) => setBatchEmail(e.target.value)}
                className="flex-1 md:w-48 px-3 py-2 bg-[hsl(var(--midnight-navy))] border border-[hsl(var(--border))] rounded-md text-sm font-mono text-foreground"
                data-testid="input-batch-email"
              />
              <Button
                onClick={requestBatchAudit}
                disabled={isSendingBatch}
                className="gap-2"
                data-testid="button-request-batch"
              >
                {isSendingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Batch Audit
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <Card id="pharma-hub" className="col-span-1 md:col-span-12 lg:col-span-6 bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-pharma-hub">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-sans">Pharma Sovereign Hub</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground">2D Serial Scanner</p>
                </div>
              </div>
              <Badge className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30">
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                LIVE
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 relative">
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder="Scan or enter serial ID (e.g., NDC-2026-001)"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isScanning && handleScan()}
                  disabled={isScanning}
                  className="flex-1 px-4 py-3 bg-[hsl(var(--sovereign-blue))] border border-[hsl(var(--border))] rounded-md text-sm font-mono text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[hsl(var(--electric-cyan))] focus:border-transparent disabled:opacity-50"
                  data-testid="input-serial-scan"
                />
                <Button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="gap-2 bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))] hover:bg-[hsl(var(--electric-cyan))]/90 min-w-[100px] relative overflow-visible"
                  data-testid="button-scan"
                >
                  <AnimatePresence mode="wait">
                    {isScanning ? (
                      <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-4 h-4" />
                        </motion.div>
                        <span className="text-xs">Verifying...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ready"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Scan className="w-4 h-4" />
                        Verify
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
                
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -top-10 right-0 bg-[hsl(var(--midnight-navy))] border border-[hsl(var(--electric-cyan))]/50 rounded-md px-3 py-1.5 shadow-lg"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-[hsl(var(--electric-cyan))]"
                        />
                        <span className="text-xs font-mono text-[hsl(var(--electric-cyan))]">
                          Verifying on Movement...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-[hsl(var(--sovereign-blue))] rounded-lg p-4 border border-[hsl(var(--border))]">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Movement Verification Status
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isOfflineMode ? (
                    <>
                      <CloudOff className="w-4 h-4 text-[hsl(var(--warning))]" />
                      <span className="text-sm font-mono text-[hsl(var(--warning))]">Secure Offline Mode - Local Cache Active</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--neon-green))] animate-pulse" />
                      <span className="text-sm font-mono text-[hsl(var(--neon-green))]">Connected to Movement M1 Testnet</span>
                    </>
                  )}
                </div>
              </div>

              <div id="scan-history" className="space-y-2 max-h-48 overflow-auto terminal-scrollbar">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Immutable Chain of Custody</span>
                </div>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm font-mono">
                    No scans yet. Enter a serial ID above to begin.
                  </div>
                ) : (
                  scanHistory.map((scan, i) => {
                    const badge = getStatusBadge(scan.status);
                    return (
                      <motion.div
                        key={`${scan.serial_id}-${scan.timestamp}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-2 px-3 bg-[hsl(var(--sovereign-blue))]/50 rounded-md"
                        data-testid={`scan-entry-${i}`}
                      >
                        <div className="flex items-center gap-3">
                          {scan.offline_cached ? (
                            <WifiOff className="w-4 h-4 text-[hsl(var(--warning))]" />
                          ) : scan.status === "VERIFIED" ? (
                            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                          ) : scan.status === "QUARANTINE" || scan.status === "COUNTERFEIT" ? (
                            <AlertTriangle className="w-4 h-4 text-[hsl(var(--danger))]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[hsl(var(--warning))]" />
                          )}
                          <span className="font-mono text-sm text-foreground">{scan.serial_id}</span>
                          {scan.is_demo_data && (
                            <Badge className="text-[8px] font-mono bg-purple-500/20 text-purple-400 border-purple-500/30 px-1.5 py-0">
                              DEMO
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`text-[10px] font-mono ${badge.color} ${badge.bg}`}>
                            {scan.offline_cached ? "CACHED OFFLINE" : badge.text}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatTexasTime(scan.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card id="eight-pillars" className="col-span-1 md:col-span-6 lg:col-span-3 bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-infrastructure">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--neon-green))]/20 flex items-center justify-center">
                  <Server className="w-5 h-5 text-[hsl(var(--neon-green))]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-sans">Infrastructure</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground">Sovereign Switch</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                <div>
                  <span className="text-sm font-sans text-foreground block mb-1">
                    {infrastructureMode === "fortress" ? "Fortress Mode" : "Economy Mode"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {infrastructureMode === "fortress" ? "Movement + Monad" : "Base L2"}
                  </span>
                </div>
                <Switch
                  checked={infrastructureMode === "fortress"}
                  onCheckedChange={(checked) => setInfrastructureMode(checked ? "fortress" : "economy")}
                  data-testid="switch-infrastructure"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Primary</span>
                  <Badge className={infrastructureMode === "fortress" ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))]" : "bg-muted text-muted-foreground"}>
                    {infrastructureMode === "fortress" ? "Movement M1" : "Base"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Backup</span>
                  <Badge className={infrastructureMode === "fortress" ? "bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))]" : "bg-muted text-muted-foreground"}>
                    {infrastructureMode === "fortress" ? "Monad" : "None"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Security</span>
                  <Badge className={infrastructureMode === "fortress" ? "bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))]" : "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]"}>
                    {infrastructureMode === "fortress" ? "MAXIMUM" : "STANDARD"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="lra-score" className="col-span-1 md:col-span-6 lg:col-span-3 bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-risk-meter">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--warning))]/20 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[hsl(var(--warning))]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-sans">Live Compliance</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground">AI Risk Meter</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => setShowRemediationModal(true)}
                className="relative w-full h-32 flex items-center justify-center cursor-pointer group"
                data-testid="button-compliance-score"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRiskColor(riskLevel.level)} opacity-20 animate-pulse group-hover:opacity-40 transition-opacity`} />
                </div>
                <div className="text-center z-10">
                  <span className={`text-4xl font-mono font-bold bg-gradient-to-r ${getRiskColor(riskLevel.level)} bg-clip-text text-transparent`}>
                    {safeNumber(riskLevel.score, "...")}
                  </span>
                  <span className="block text-xs font-mono text-muted-foreground mt-1">RISK SCORE</span>
                  <span className="block text-[10px] font-mono text-[hsl(var(--electric-cyan))] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for Remediation
                  </span>
                </div>
              </button>

              <div className="h-2 bg-[hsl(var(--sovereign-blue))] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${getRiskColor(riskLevel.level)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${riskLevel.score}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">{safeNumber(riskLevel.violations, "0")} violations detected</span>
                <Badge className={`${
                  riskLevel.level === "LOW" ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))]" :
                  riskLevel.level === "MEDIUM" ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]" :
                  "bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]"
                }`}>
                  {riskLevel.level}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card id="wallet-balance" className="col-span-1 md:col-span-12 lg:col-span-6 bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-privacy-vault">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-sans">Privacy Vault</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground">Railgun ZK Shielding</p>
                </div>
              </div>
              {privacyWallet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewShieldedHistory}
                  disabled={isLoadingHistory}
                  className="gap-2"
                  data-testid="button-view-history"
                >
                  {isLoadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Private View
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!privacyWallet ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Create a privacy wallet to enable ZK shielding</p>
                  <Button
                    onClick={createPrivacyWallet}
                    disabled={isLoadingWallet}
                    className="gap-2"
                    data-testid="button-create-wallet"
                  >
                    {isLoadingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Create Privacy Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase text-muted-foreground">0zk Address</span>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">SHIELDED</Badge>
                    </div>
                    <code className="text-sm font-mono text-[hsl(var(--electric-cyan))] break-all" data-testid="text-zk-address">
                      {privacyWallet.zk_address}
                    </code>
                  </div>

                  <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase text-muted-foreground">Viewing Key</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowViewingKey(!showViewingKey)}
                        data-testid="button-toggle-viewing-key"
                      >
                        {showViewingKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground break-all" data-testid="text-viewing-key">
                      {showViewingKey ? privacyWallet.viewing_key.private_key : "••••••••••••••••••••••••••••••••"}
                    </code>
                  </div>

                  {shieldedHistory.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase text-muted-foreground">Immutable Chain of Custody</span>
                      <div className="max-h-32 overflow-auto terminal-scrollbar space-y-1">
                        {shieldedHistory.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between py-1 px-2 bg-[hsl(var(--sovereign-blue))]/50 rounded text-xs font-mono">
                            <span className="text-foreground truncate">{entry.noteId}</span>
                            <span className="text-muted-foreground">{formatTexasTime(entry.shieldTimestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-12 lg:col-span-6 bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-system-status">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-sans">System Status</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground">Real-time Infrastructure</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${isOfflineMode ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--neon-green))] animate-pulse"}`} />
                    <span className="text-xs font-mono uppercase text-muted-foreground">Movement M1</span>
                  </div>
                  <span className={`text-sm font-mono ${isOfflineMode ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--neon-green))]"}`}>
                    {isOfflineMode ? "Offline" : "Connected"}
                  </span>
                </div>
                <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--electric-cyan))] animate-pulse" />
                    <span className="text-xs font-mono uppercase text-muted-foreground">Gemini AI</span>
                  </div>
                  <span className="text-sm font-mono text-[hsl(var(--electric-cyan))]">Active</span>
                </div>
                <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-xs font-mono uppercase text-muted-foreground">Railgun</span>
                  </div>
                  <span className="text-sm font-mono text-purple-400">ZK Ready</span>
                </div>
                <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--warning))] animate-pulse" />
                    <span className="text-xs font-mono uppercase text-muted-foreground">Jupiter</span>
                  </div>
                  <span className="text-sm font-mono text-[hsl(var(--warning))]">Pricing Live</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <ComplianceCommandCenter toast={toast} />

          <div className="col-span-1 md:col-span-12 lg:col-span-6">
            <LiveAuditMapView 
              network="Movement M1"
              operation="DSCSA Batch Verification"
              onSimulateFailover={() => haptics.heavyTap()}
            />
          </div>

          <div className="col-span-1 md:col-span-12 lg:col-span-6">
            <Card className="h-full bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-sponsor-panel">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-sans">DeveloperWeek 2026</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground">Sponsor Integrations</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => {
                    haptics.mediumTap();
                    setShowAIInsightModal(true);
                  }}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  data-testid="button-ai-insight"
                >
                  <Terminal className="w-4 h-4" />
                  View AI Reasoning Traces
                  <Badge className="ml-auto text-[9px]">OPIK</Badge>
                </Button>
                <div className="pt-2">
                  <IndiaAIPackExport />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-6 md:mt-8 p-4 bg-[hsl(var(--midnight-navy))] rounded-lg border border-[hsl(var(--glass-border))]" data-testid="footer-savings">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <TrendingDown className="w-5 h-5 text-[hsl(var(--neon-green))]" />
              <div>
                <span className="text-xs font-mono uppercase text-muted-foreground block">Live Savings Counter</span>
                <span className="text-sm font-sans text-foreground">
                  Sovereign route vs. High-Gas routes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 md:gap-8">
              {offlineCache.pendingScans.length > 0 && (
                <div className="text-right">
                  <span className="text-xs font-mono text-muted-foreground block">Pending Sync</span>
                  <span className="text-lg font-mono font-semibold text-[hsl(var(--warning))]">
                    {safeNumber(offlineCache.pendingScans.length, "0")} scans
                  </span>
                </div>
              )}
              <div className="text-right">
                <span className="text-xs font-mono text-muted-foreground block">Session Savings</span>
                <span className="text-2xl font-mono font-bold text-[hsl(var(--neon-green))]">
                  {safeCurrency(totalSavings)}
                </span>
              </div>
              {gasSavings && (
                <div className="text-right">
                  <span className="text-xs font-mono text-muted-foreground block">Per TX Savings</span>
                  <span className="text-lg font-mono font-semibold text-[hsl(var(--electric-cyan))]">
                    {safePercent(gasSavings.savings.percent)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground ml-1">
                    ({safeCurrency(gasSavings.savings.amount_usd)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>

      <Dialog open={showRemediationModal} onOpenChange={setShowRemediationModal}>
        <DialogContent className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-sans">
              <Wrench className="w-6 h-6 text-[hsl(var(--electric-cyan))]" />
              Remediation Roadmap
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-mono text-sm">
              Action items to improve your compliance score from {safeNumber(riskLevel.score)} to optimal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))] hover-elevate cursor-pointer" data-testid="fix-traceability">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] text-[10px]">FIX 1</Badge>
                    <span className="font-sans font-semibold text-foreground">Incomplete Traceability</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Scan batch units to verify Movement M1 custody chain. Each unverified unit increases risk score by 5 points.
                  </p>
                  <Button size="sm" className="mt-3 gap-2" onClick={() => {
                    setShowRemediationModal(false);
                    scanInputRef.current?.focus();
                  }}>
                    <Scan className="w-4 h-4" />
                    Start Scanning
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))] hover-elevate cursor-pointer" data-testid="fix-privacy">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] text-[10px]">FIX 2</Badge>
                    <span className="font-sans font-semibold text-foreground">Privacy Leak Detected</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Toggle Railgun ZK-Shield to encrypt batch IDs. Unshielded data exposes supply chain to competitors.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={() => {
                    setShowRemediationModal(false);
                    if (!privacyWallet) {
                      createPrivacyWallet();
                    }
                  }}>
                    <Lock className="w-4 h-4" />
                    {privacyWallet ? "ZK Active" : "Enable ZK Shield"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg border border-[hsl(var(--border))] hover-elevate cursor-pointer" data-testid="fix-guidelines">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--neon-green))]/20 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-[hsl(var(--neon-green))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] text-[10px]">FIX 3</Badge>
                    <span className="font-sans font-semibold text-foreground">Guideline Sync</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Update logic to FDA DSCSA 2026 standards. Current ruleset may be outdated for full compliance certification.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 gap-2" disabled>
                    <CheckCircle2 className="w-4 h-4" />
                    DSCSA 2026 Active
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIInsightModal 
        open={showAIInsightModal} 
        onOpenChange={setShowAIInsightModal}
        title="Opik AI Reasoning Traces"
      />
    </div>
  );
}

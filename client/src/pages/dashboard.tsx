import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Wallet, Shield, Activity, Network, CheckCircle2, AlertTriangle, Clock, Zap, Terminal, TrendingUp, Lock, Unlock } from "lucide-react";

type LogEntryType = "audit" | "payment_required" | "payment_processing" | "payment_complete" | "access_granted" | "checkpoint" | "verification";

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  type: LogEntryType;
  message: string;
  hash?: string;
  details?: string;
  status: "success" | "warning" | "info" | "processing";
}

const COMPLIANCE_MODULES = [
  "AML/KYC Verification",
  "Transaction Monitoring",
  "Sanctions Screening",
  "Risk Assessment",
  "Regulatory Reporting",
  "Smart Contract Audit",
  "Token Transfer Validation",
  "Cross-chain Compliance",
  "Liquidity Pool Analysis",
  "Governance Verification",
];

const AUDIT_ACTIONS = [
  "Scanning validator set consensus...",
  "Verifying block finality on Movement M1...",
  "Analyzing token flow patterns...",
  "Checking smart contract permissions...",
  "Validating staking rewards distribution...",
  "Auditing governance proposal execution...",
  "Monitoring cross-chain bridge activity...",
  "Inspecting MEV protection mechanisms...",
  "Reviewing gas optimization metrics...",
  "Verifying node operator compliance...",
];

function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function generateShortHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusIndicator({ status, pulse = false }: { status: "online" | "offline" | "processing"; pulse?: boolean }) {
  const colors = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    processing: "bg-electric",
  };
  
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${pulse ? "animate-pulse-glow" : ""}`} />
  );
}

function AgentHealthWidget({ health, uptime }: { health: number; uptime: string }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (health / 100) * circumference;

  return (
    <div className="p-6 border-b border-sidebar-border" data-testid="widget-agent-health">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-electric" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Health</h3>
      </div>
      <div className="flex items-center justify-between">
        <div className="relative w-20 h-20">
          <svg className="transform -rotate-90 w-20 h-20" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="hsl(var(--electric-blue))"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-foreground" data-testid="text-health-percentage">{health}%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end mb-1">
            <StatusIndicator status="online" pulse />
            <span className="text-sm text-foreground">Active</span>
          </div>
          <span className="text-xs text-muted-foreground" data-testid="text-uptime">Uptime: {uptime}</span>
        </div>
      </div>
    </div>
  );
}

function ComplianceScoreWidget({ score, trend }: { score: number; trend: number }) {
  const getRiskLevel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-success" };
    if (score >= 75) return { label: "Good", color: "text-electric" };
    if (score >= 50) return { label: "Fair", color: "text-warning" };
    return { label: "At Risk", color: "text-destructive" };
  };

  const risk = getRiskLevel(score);

  return (
    <div className="p-6 border-b border-sidebar-border" data-testid="widget-compliance-score">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-electric" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance Score</h3>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-tight text-foreground" data-testid="text-compliance-score">{score}</span>
        <div className="pb-1">
          <div className={`flex items-center gap-1 ${trend >= 0 ? "text-success" : "text-destructive"}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
            <span className="text-xs font-medium">{trend >= 0 ? "+" : ""}{trend}%</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-sm font-medium ${risk.color}`}>{risk.label}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-electric rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function NetworkStatusWidget({ network, blockHeight }: { network: string; blockHeight: number }) {
  return (
    <div className="p-6 border-b border-sidebar-border" data-testid="widget-network-status">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-electric" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network</h3>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIndicator status="online" pulse />
          <span className="text-sm font-medium text-foreground" data-testid="text-network-name">{network}</span>
        </div>
        <Badge variant="secondary" className="text-xs" data-testid="badge-connection-status">
          Connected
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Block Height</span>
        <span className="font-mono text-foreground" data-testid="text-block-height">{blockHeight.toLocaleString()}</span>
      </div>
    </div>
  );
}

function ModuleStatusWidget({ modules }: { modules: { name: string; status: "complete" | "in_progress" | "pending" }[] }) {
  return (
    <div className="p-6" data-testid="widget-audit-modules">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4 h-4 text-electric" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Modules</h3>
      </div>
      <div className="space-y-2">
        {modules.slice(0, 5).map((module, i) => (
          <div key={i} className="flex items-center justify-between text-xs" data-testid={`module-status-${i}`}>
            <span className="text-muted-foreground truncate pr-2">{module.name}</span>
            {module.status === "complete" && <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />}
            {module.status === "in_progress" && <Clock className="w-3.5 h-3.5 text-electric animate-pulse flex-shrink-0" />}
            {module.status === "pending" && <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalLogEntry({ entry }: { entry: AuditLogEntry }) {
  const isPaymentBlock = entry.type === "payment_required" || entry.type === "payment_processing" || entry.type === "payment_complete" || entry.type === "access_granted";
  
  const getTypeStyles = () => {
    switch (entry.type) {
      case "payment_required":
        return "border-l-warning bg-warning/10 animate-payment-pulse";
      case "payment_processing":
        return "border-l-warning bg-warning/5";
      case "payment_complete":
        return "border-l-success bg-success/5";
      case "access_granted":
        return "border-l-success bg-success/10";
      case "checkpoint":
        return "border-l-electric bg-electric/5";
      case "verification":
        return "border-l-electric";
      default:
        return "border-l-transparent";
    }
  };

  const getStatusIcon = () => {
    switch (entry.status) {
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
      case "processing":
        return <Zap className="w-3.5 h-3.5 text-electric animate-pulse" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = () => {
    switch (entry.type) {
      case "payment_required":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning">402 PAYMENT REQUIRED</Badge>;
      case "payment_processing":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning">SETTLING $MOVE</Badge>;
      case "payment_complete":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success text-success">PAYMENT CONFIRMED</Badge>;
      case "access_granted":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success text-success">ACCESS GRANTED</Badge>;
      case "checkpoint":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-electric text-electric">CHECKPOINT</Badge>;
      case "verification":
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">VERIFY</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">AUDIT</Badge>;
    }
  };

  return (
    <div 
      className={`border-l-2 pl-3 pr-4 py-2 animate-fade-in-up ${getTypeStyles()} ${isPaymentBlock ? "my-1" : ""}`}
      data-testid={`log-entry-${entry.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">{formatTime(entry.timestamp)}</span>
            {getTypeBadge()}
            {entry.type === "payment_required" && (
              <Lock className="w-3 h-3 text-warning" />
            )}
            {entry.type === "access_granted" && (
              <Unlock className="w-3 h-3 text-success" />
            )}
          </div>
          <p className="text-xs text-foreground mt-1 leading-relaxed">{entry.message}</p>
          {entry.hash && (
            <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate" title={entry.hash}>
              tx: {entry.hash}
            </p>
          )}
          {entry.details && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{entry.details}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletButton({ connected, address, onConnect }: { connected: boolean; address?: string; onConnect: () => void }) {
  return (
    <Button
      onClick={onConnect}
      variant={connected ? "secondary" : "default"}
      className={connected ? "" : "bg-electric hover:bg-electric/90"}
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {connected && address ? (
        <span className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
      ) : (
        "Connect Movement Wallet"
      )}
    </Button>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [complianceScore, setComplianceScore] = useState(87);
  const [scoreTrend, setScoreTrend] = useState(2.4);
  const [blockHeight, setBlockHeight] = useState(14523847);
  const [modules, setModules] = useState(
    COMPLIANCE_MODULES.map((name, i) => ({
      name,
      status: i < 3 ? "complete" as const : i === 3 ? "in_progress" as const : "pending" as const,
    }))
  );
  const [isPaymentSequence, setIsPaymentSequence] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const sequenceStep = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, []);

  const addLog = useCallback((entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev.slice(-50), newEntry]);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  const runPaymentSequence = useCallback(() => {
    setIsPaymentSequence(true);
    const moduleIndex = Math.floor(Math.random() * 4) + 3;
    const moduleName = COMPLIANCE_MODULES[moduleIndex];
    
    const steps = [
      {
        type: "payment_required" as const,
        message: `x402 Payment Required: Access to ${moduleName} module requires $MOVE settlement`,
        status: "warning" as const,
        details: "Fee: 0.0025 $MOVE • Protocol: x402 Payment Standard",
      },
      {
        type: "payment_processing" as const,
        message: "Initiating automatic $MOVE token settlement via Movement Network...",
        status: "processing" as const,
        hash: generateHash(),
      },
      {
        type: "payment_complete" as const,
        message: "Payment settled successfully. Transaction confirmed on Movement M1.",
        status: "success" as const,
        hash: generateHash(),
        details: "Gas: 0.00012 $MOVE • Confirmations: 3/3",
      },
      {
        type: "access_granted" as const,
        message: `Access unlocked. Resuming ${moduleName} audit sequence...`,
        status: "success" as const,
      },
    ];

    sequenceStep.current = 0;

    const runStep = () => {
      if (sequenceStep.current < steps.length) {
        addLog(steps[sequenceStep.current]);
        sequenceStep.current++;
        setTimeout(runStep, 1200);
      } else {
        setIsPaymentSequence(false);
        setModules((prev) => 
          prev.map((m, i) => 
            i === moduleIndex ? { ...m, status: "in_progress" as const } : m
          )
        );
        setComplianceScore((prev) => Math.min(100, prev + Math.random() * 2));
      }
    };

    runStep();
  }, [addLog]);

  const generateAuditEntry = useCallback(() => {
    if (isPaymentSequence) return;

    const shouldTriggerPayment = Math.random() < 0.15;
    
    if (shouldTriggerPayment) {
      runPaymentSequence();
      return;
    }

    const isCheckpoint = Math.random() < 0.2;
    const isVerification = Math.random() < 0.3;
    
    if (isCheckpoint) {
      addLog({
        type: "checkpoint",
        message: `Checkpoint saved: Block ${blockHeight.toLocaleString()} audit state persisted`,
        hash: generateHash(),
        status: "success",
      });
      setBlockHeight((prev) => prev + Math.floor(Math.random() * 100) + 50);
    } else if (isVerification) {
      const action = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
      addLog({
        type: "verification",
        message: action,
        hash: generateShortHash(),
        status: "info",
        details: `Module: ${COMPLIANCE_MODULES[Math.floor(Math.random() * 5)]}`,
      });
    } else {
      addLog({
        type: "audit",
        message: AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)],
        hash: generateHash(),
        status: "success",
      });
    }

    if (Math.random() < 0.1) {
      setModules((prev) => {
        const inProgressIndex = prev.findIndex((m) => m.status === "in_progress");
        const nextPendingIndex = prev.findIndex((m) => m.status === "pending");
        
        if (inProgressIndex !== -1 && nextPendingIndex !== -1) {
          return prev.map((m, i) => {
            if (i === inProgressIndex) return { ...m, status: "complete" as const };
            if (i === nextPendingIndex) return { ...m, status: "in_progress" as const };
            return m;
          });
        }
        return prev;
      });
    }
  }, [addLog, blockHeight, isPaymentSequence, runPaymentSequence]);

  useEffect(() => {
    addLog({
      type: "audit",
      message: "PolarUniversal GRC Agent initialized. Beginning autonomous compliance audit...",
      status: "success",
      details: "Target: Movement Network M1 • Protocol: x402",
    });

    addLog({
      type: "checkpoint",
      message: "Connected to Movement M1 mainnet. Syncing audit state...",
      hash: generateHash(),
      status: "success",
    });
  }, [addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      generateAuditEntry();
    }, 5000);

    return () => clearInterval(interval);
  }, [generateAuditEntry]);

  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress(undefined);
    } else {
      setWalletConnected(true);
      setWalletAddress(generateHash().slice(0, 42));
      addLog({
        type: "audit",
        message: "Movement Wallet connected successfully. Agent now authorized for on-chain settlements.",
        status: "success",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background" data-testid="dashboard-container">
      <aside className="w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col" data-testid="sidebar">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-electric flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-sidebar-foreground">PolarUniversal</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">GRC Agent</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <AgentHealthWidget health={98} uptime="14d 7h 23m" />
          <ComplianceScoreWidget score={complianceScore} trend={scoreTrend} />
          <NetworkStatusWidget network="Movement M1" blockHeight={blockHeight} />
          <ModuleStatusWidget modules={modules} />
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground text-center">
            x402 Payment Protocol Active
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card" data-testid="main-header">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-card-foreground" data-testid="text-page-title">Proof of Audit</h2>
            <Badge variant="outline" className="text-xs border-electric text-electric" data-testid="badge-live-status">
              <StatusIndicator status="online" pulse />
              <span className="ml-1.5">Live</span>
            </Badge>
          </div>
          <WalletButton 
            connected={walletConnected} 
            address={walletAddress}
            onConnect={handleConnectWallet}
          />
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          <Card className="h-full flex flex-col bg-terminal border-terminal-border" data-testid="terminal-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border" data-testid="terminal-header">
              <Terminal className="w-4 h-4 text-electric" />
              <span className="text-xs font-medium text-foreground">Autonomous GRC Audit Terminal</span>
              <div className="flex-1" />
              <span className="text-[10px] text-muted-foreground font-mono" data-testid="text-log-count">
                {logs.length} entries
              </span>
              <span className="w-1.5 h-4 bg-electric animate-terminal-blink rounded-sm" data-testid="indicator-terminal-cursor" />
            </div>
            
            <div 
              ref={logContainerRef}
              className="flex-1 overflow-auto terminal-scrollbar p-2 space-y-1"
              data-testid="terminal-log-container"
            >
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Terminal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Initializing audit sequence...</p>
                  </div>
                </div>
              ) : (
                logs.map((entry) => (
                  <TerminalLogEntry key={entry.id} entry={entry} />
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Wallet, Shield, Activity, CheckCircle2, Terminal, Award, Cpu, Zap, Radio } from "lucide-react";

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  code: string;
  action: string;
  status: "SUCCESS" | "PROCESSING" | "VERIFIED" | "SETTLED";
}

interface VelocityDataPoint {
  time: string;
  velocity: number;
}

const AUDIT_ACTIONS = [
  "SCANNING MOVE-VM BYTECODE",
  "VERIFYING VALIDATOR SIGNATURES",
  "ANALYZING TOKEN FLOW PATTERNS",
  "CHECKING GOVERNANCE PERMISSIONS",
  "VALIDATING STAKING REWARDS",
  "AUDITING CROSS-CHAIN BRIDGE",
  "INSPECTING MEV PROTECTION",
  "REVIEWING GAS METRICS",
  "VERIFYING NODE COMPLIANCE",
  "SCANNING SMART CONTRACTS",
  "ANALYZING LIQUIDITY POOLS",
  "CHECKING SANCTIONS LIST",
  "VALIDATING KYC STATUS",
  "AUDITING TRANSACTION HISTORY",
];

function generateAuditCode(): string {
  const num = String(Math.floor(Math.random() * 999)).padStart(3, "0");
  return `AUDIT-${num}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function NetworkHealthBar() {
  return (
    <div className="h-10 bg-[#050505] border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between px-6" data-testid="network-health-bar">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Movement M1:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-live-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-success">ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Agent Connectivity:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan">100%</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Radio className="w-3 h-3 text-cyan animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">x402 Protocol Active</span>
      </div>
    </div>
  );
}

function ProTerminal({ logs, logContainerRef }: { logs: AuditLogEntry[]; logContainerRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div
      className="glass-card rounded-md h-full flex flex-col neon-glow animate-slide-up"
      data-testid="pro-terminal"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-cyan" />
          <span className="text-xs font-mono uppercase tracking-widest text-foreground">GRC AUDIT TERMINAL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-live-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-success">LIVE</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{logs.length} ENTRIES</span>
          <span className="w-2 h-4 bg-cyan animate-cursor-blink rounded-sm" />
        </div>
      </div>
      
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-auto terminal-scrollbar p-4 font-mono text-xs space-y-1"
        data-testid="terminal-log-container"
      >
        {logs.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 py-1 animate-fade-in-up" data-testid={`log-entry-${entry.id}`}>
            <span className="text-muted-foreground shrink-0">{formatTime(entry.timestamp)}</span>
            <span className="text-cyan shrink-0">[{entry.code}]</span>
            <span className="text-foreground">{entry.action}...</span>
            <span className={`shrink-0 ${
              entry.status === "SUCCESS" ? "text-success" : 
              entry.status === "VERIFIED" ? "text-cyan" :
              entry.status === "SETTLED" ? "text-warning" :
              "text-muted-foreground"
            }`}>{entry.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VelocityChart({ data }: { data: VelocityDataPoint[] }) {
  return (
    <div
      className="glass-card rounded-md p-4 animate-slide-up transition-transform hover:scale-[1.02]"
      style={{ animationDelay: "0.3s" }}
      data-testid="velocity-chart"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-cyan" />
        <span className="text-xs font-mono uppercase tracking-widest text-foreground">COMPLIANCE VERIFICATION VELOCITY</span>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="time" 
              stroke="hsl(210 10% 30%)" 
              tick={{ fontSize: 10, fill: "hsl(210 10% 50%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(210 10% 30%)" 
              tick={{ fontSize: 10, fill: "hsl(210 10% 50%)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: "rgba(0,0,0,0.8)", 
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                fontSize: "10px"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="velocity" 
              stroke="hsl(185 100% 50%)" 
              strokeWidth={2}
              dot={false}
              filter="url(#glow)"
            />
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon: Icon, delay }: { title: string; value: string; subtitle: string; icon: typeof Shield; delay: number }) {
  return (
    <div
      className="glass-card rounded-md p-4 animate-slide-up transition-transform hover:scale-[1.02]"
      style={{ animationDelay: `${delay}s` }}
      data-testid={`stats-card-${title.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-cyan" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground neon-text">{value}</div>
      <div className="text-[10px] font-mono text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

function WalletButton({ connected, address, onConnect }: { connected: boolean; address?: string; onConnect: () => void }) {
  return (
    <Button
      onClick={onConnect}
      variant="outline"
      className="glass-card border-[rgba(255,255,255,0.1)] text-xs font-mono uppercase tracking-wider"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-4 h-4 mr-2 text-cyan" />
      {connected && address ? (
        <span className="text-cyan">{address.slice(0, 6)}...{address.slice(-4)}</span>
      ) : (
        "CONNECT WALLET"
      )}
    </Button>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [velocityData, setVelocityData] = useState<VelocityDataPoint[]>([]);
  const [complianceScore, setComplianceScore] = useState(94);
  const [auditCount, setAuditCount] = useState(1247);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    const initialData: VelocityDataPoint[] = [];
    for (let i = 0; i < 20; i++) {
      initialData.push({
        time: `${i}s`,
        velocity: 50 + Math.random() * 30,
      });
    }
    setVelocityData(initialData);

    addLog({
      code: "AUDIT-001",
      action: "POLARUNIVERSAL GRC AGENT INITIALIZED",
      status: "SUCCESS",
    });
    addLog({
      code: "AUDIT-002",
      action: "CONNECTED TO MOVEMENT M1 MAINNET",
      status: "VERIFIED",
    });
  }, [addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      const action = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
      const statuses: AuditLogEntry["status"][] = ["SUCCESS", "VERIFIED", "PROCESSING"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      addLog({
        code: generateAuditCode(),
        action,
        status,
      });

      setVelocityData((prev) => {
        const newData = [...prev.slice(1), {
          time: `${Date.now() % 100}s`,
          velocity: 50 + Math.random() * 40,
        }];
        return newData;
      });

      setAuditCount((prev) => prev + 1);
      if (Math.random() < 0.3) {
        setComplianceScore((prev) => Math.min(100, Math.max(85, prev + (Math.random() - 0.5) * 2)));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [addLog]);

  useEffect(() => {
    const remittanceInterval = setInterval(() => {
      const amount = (Math.random() * 0.005 + 0.002).toFixed(4);
      const paymentCode = String(Math.floor(Math.random() * 999)).padStart(3, "0");
      
      addLog({
        code: `AUDIT-${paymentCode}`,
        action: "X402 PAYMENT REQUIRED FOR MODULE ACCESS",
        status: "PROCESSING",
      });

      setTimeout(() => {
        addLog({
          code: `AUDIT-${paymentCode}`,
          action: `SETTLING ${amount} MOVE VIA X402 PROTOCOL`,
          status: "PROCESSING",
        });
      }, 1200);

      setTimeout(() => {
        addLog({
          code: `AUDIT-${paymentCode}`,
          action: `REMITTANCE ${amount} MOVE CONFIRMED ON MOVEMENT M1`,
          status: "SETTLED",
        });

        toast({
          title: "x402 REMITTANCE",
          description: `${amount} MOVE settled via x402 protocol`,
          duration: 4000,
        });
      }, 2400);

      setTimeout(() => {
        addLog({
          code: `AUDIT-${paymentCode}`,
          action: "ACCESS UNLOCKED - RESUMING AUDIT SEQUENCE",
          status: "SUCCESS",
        });
      }, 3600);
    }, 45000);

    return () => clearInterval(remittanceInterval);
  }, [addLog, toast]);

  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress(undefined);
    } else {
      const chars = "0123456789abcdef";
      let addr = "0x";
      for (let i = 0; i < 40; i++) {
        addr += chars[Math.floor(Math.random() * chars.length)];
      }
      setWalletConnected(true);
      setWalletAddress(addr);
      addLog({
        code: "AUDIT-003",
        action: "MOVEMENT WALLET CONNECTED SUCCESSFULLY",
        status: "SUCCESS",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505]" data-testid="dashboard-container">
      <NetworkHealthBar />
      
      <header className="h-14 flex items-center justify-between px-6 border-b border-[rgba(255,255,255,0.1)]" data-testid="main-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-cyan/20 flex items-center justify-center neon-glow">
              <Shield className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h1 className="text-sm font-mono uppercase tracking-widest text-foreground">POLARUNIVERSAL</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">GRC AGENT v2.0</p>
            </div>
          </div>
          <Badge className="text-[10px] font-mono uppercase tracking-wider bg-success/20 text-success border border-success/30 gap-1.5" data-testid="badge-proof-of-compliance">
            <Award className="w-3 h-3" />
            PROOF OF COMPLIANCE
          </Badge>
        </div>
        <WalletButton 
          connected={walletConnected} 
          address={walletAddress}
          onConnect={handleConnectWallet}
        />
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-full grid grid-cols-[1fr_320px] gap-6">
          <ProTerminal logs={logs} logContainerRef={logContainerRef} />
          
          <div className="flex flex-col gap-4">
            <StatsCard
              title="Compliance Score"
              value={`${Math.round(complianceScore)}%`}
              subtitle="EXCELLENT STANDING"
              icon={Shield}
              delay={0.4}
            />
            <StatsCard
              title="Audits Processed"
              value={auditCount.toLocaleString()}
              subtitle="LAST 24 HOURS"
              icon={Cpu}
              delay={0.5}
            />
            <StatsCard
              title="Network Latency"
              value="12ms"
              subtitle="MOVEMENT M1"
              icon={Zap}
              delay={0.6}
            />
            <VelocityChart data={velocityData} />
          </div>
        </div>
      </main>
    </div>
  );
}

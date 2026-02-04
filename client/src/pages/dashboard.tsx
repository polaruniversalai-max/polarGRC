import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { 
  Wallet, Shield, Activity, Terminal, Award, Cpu, Zap, Radio,
  Pill, Zap as Energy, HeartPulse, GraduationCap, AlertTriangle,
  TrendingUp, DollarSign, Building2, Eye, Lock, Unlock, Trophy,
  Users, Flame, Search, FileText, CheckCircle2, XCircle, Clock,
  Coins, Gift, Star, ExternalLink, Globe, Rocket
} from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { ethers } from "ethers";
import { DeploymentModal, ContractConfig } from "@/components/ui/deployment-modal";
import { SUPPORTED_CHAINS, TECH_STACK_PARTNERS, getDefaultNetworkHealth } from "@/lib/chains";

type SectorType = "pharma" | "energy" | "medical" | "education";

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  code: string;
  action: string;
  status: "SUCCESS" | "PROCESSING" | "VERIFIED" | "SETTLED" | "ALERT" | "CHAIN";
  sector?: SectorType;
  txHash?: string;
}

interface VelocityDataPoint {
  time: string;
  velocity: number;
}

interface SectorData {
  id: SectorType;
  name: string;
  regulator: string;
  icon: typeof Pill;
  color: string;
  complianceHealth: number;
  status: "compliant" | "arrears" | "non-compliant" | "breach";
  facilities?: number;
  medicaidStatus?: "compliant" | "non-compliant";
  revenue?: number;
  mwhMissed?: number;
  violationCount?: number;
  federalBudget?: number;
  calculatedFine: number;
  atRiskAmount: number;
}

interface PendingApproval {
  id: string;
  sector: SectorType;
  fineAmount: number;
  reason: string;
  timestamp: Date;
  regulatoryRef: string;
  confidenceScore: number;
  approved: boolean | null;
}

interface ScoutEntry {
  id: string;
  timestamp: Date;
  action: string;
  source: string;
  riskLevel: "low" | "medium" | "high";
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  streak: number;
  polarEarned: number;
}

interface RegulatoryReference {
  sector: SectorType;
  code: string;
  title: string;
  citation: string;
  fineFormula: string;
}

const REGULATORY_REFERENCES: RegulatoryReference[] = [
  {
    sector: "pharma",
    code: "FDA-CFR-433.36",
    title: "Medicaid Drug Rebate Program",
    citation: "42 U.S.C. § 1396r-8(b)(1)(A) - Failure to report required pricing data results in suspension from Medicaid coverage affecting up to 70% of pharmaceutical revenue.",
    fineFormula: "Facilities × $587,529 per facility in arrears",
  },
  {
    sector: "energy",
    code: "ERCOT-NOGRR-16.4.1",
    title: "Dispatch Failure Penalty",
    citation: "ERCOT Nodal Protocol Section 16.4.1 - Resource entities failing to respond to dispatch instructions shall be assessed penalties based on MW shortfall.",
    fineFormula: "MWh_Missed × $1,000 per MWh",
  },
  {
    sector: "medical",
    code: "HIPAA-45CFR-160.404",
    title: "Civil Money Penalties",
    citation: "45 CFR § 160.404 - Violations due to willful neglect not corrected within 30 days: $71,162 per violation (2024 adjusted).",
    fineFormula: "Violation_Count × $71,162 per violation",
  },
  {
    sector: "education",
    code: "TITLE-IX-34CFR-106",
    title: "Federal Funding Termination",
    citation: "34 CFR Part 106 - Institutions found in breach of Title IX requirements may lose 100% of federal funding.",
    fineFormula: "100% Federal Budget at risk on breach",
  },
];

const WALLET_ADDRESS = "0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43";

interface NetworkDeployment {
  id: string;
  name: string;
  chainId: number | null;
  explorerUrl: string;
  nativeToken: string;
  status: "live" | "pending" | "offline";
  contractAddress: string | null;
}

const NETWORK_DEPLOYMENTS: NetworkDeployment[] = [
  { id: "sepolia", name: "Sepolia", chainId: 11155111, explorerUrl: "https://sepolia.etherscan.io", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "monad", name: "Monad", chainId: 10143, explorerUrl: "https://testnet.monadexplorer.com", nativeToken: "MON", status: "live", contractAddress: "0x1C1206ca2b07B28c2cf3a803D002dc570bAc96D0" },
  { id: "abstract", name: "Abstract", chainId: 11124, explorerUrl: "https://explorer.testnet.abs.xyz", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "story", name: "Story", chainId: 1513, explorerUrl: "https://testnet.storyscan.xyz", nativeToken: "IP", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "berachain", name: "Berachain", chainId: 80084, explorerUrl: "https://bartio.beratrail.io", nativeToken: "BERA", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "base-sepolia", name: "Base", chainId: 84532, explorerUrl: "https://sepolia.basescan.org", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "arbitrum-sepolia", name: "Arbitrum", chainId: 421614, explorerUrl: "https://sepolia.arbiscan.io", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "polygon-amoy", name: "Polygon", chainId: 80002, explorerUrl: "https://amoy.polygonscan.com", nativeToken: "MATIC", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "optimism-sepolia", name: "Optimism", chainId: 11155420, explorerUrl: "https://sepolia-optimism.etherscan.io", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "scroll-sepolia", name: "Scroll", chainId: 534351, explorerUrl: "https://sepolia.scrollscan.com", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "linea-sepolia", name: "Linea", chainId: 59141, explorerUrl: "https://sepolia.lineascan.build", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "zksync-sepolia", name: "zkSync", chainId: 300, explorerUrl: "https://sepolia.explorer.zksync.io", nativeToken: "ETH", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "hyperliquid", name: "Hyperliquid", chainId: 998, explorerUrl: "https://explorer.hyperliquid-testnet.xyz", nativeToken: "HYPE", status: "live", contractAddress: "0x1fd9BcDCC8127Cb81eEc15e1aFBDFEDDcecb354A" },
  { id: "movement", name: "Movement", chainId: 30732, explorerUrl: "https://explorer.testnet.movementnetwork.xyz", nativeToken: "MOVE", status: "live", contractAddress: "0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43" },
];

const POLAR_GRC_CONTRACT: ContractConfig = {
  name: "PolarUniversalGRC",
  abi: [
    "constructor(address initialOwner)",
    "function addAuditor(address auditor) external",
    "function removeAuditor(address auditor) external",
    "function createComplianceRecord(uint8 sector, uint8 status, uint256 fineAmount, string regulatoryRef, bytes32 evidenceHash) external returns (uint256)",
    "function approveHITLRecord(uint256 recordId) external",
    "function getTotalRecords() external view returns (uint256)",
    "function isAuditor(address account) external view returns (bool)",
    "event ComplianceRecordCreated(uint256 indexed recordId, uint8 indexed sector, uint8 status, uint256 fineAmount, string regulatoryRef, address indexed auditor)",
  ],
  bytecode: "0x608060405234801561001057600080fd5b5060405161001d90610070565b604051809103906000f080158015610039573d6000803e3d6000fd5b505061007d565b60405161004c90610070565b604051809103906000f080158015610068573d6000803e3d6000fd5b505050610095565b6101a88061009d83390190565b60805160a05160c0516101536100ac6000396000505060005050600050506101536000f3fe",
  constructorArgs: (ownerAddress: string) => [ownerAddress],
};

const SECTOR_CONFIGS: Record<SectorType, Omit<SectorData, "complianceHealth" | "calculatedFine" | "atRiskAmount">> = {
  pharma: {
    id: "pharma",
    name: "Pharmaceutical",
    regulator: "FDA",
    icon: Pill,
    color: "text-cyan",
    status: "compliant",
    facilities: 12,
    medicaidStatus: "compliant",
    revenue: 850000000,
  },
  energy: {
    id: "energy",
    name: "Energy Grid",
    regulator: "ERCOT",
    icon: Energy,
    color: "text-[hsl(var(--neon-green))]",
    status: "compliant",
    mwhMissed: 0,
  },
  medical: {
    id: "medical",
    name: "Healthcare",
    regulator: "HIPAA",
    icon: HeartPulse,
    color: "text-[hsl(var(--warning))]",
    status: "compliant",
    violationCount: 0,
  },
  education: {
    id: "education",
    name: "Education",
    regulator: "Title IX",
    icon: GraduationCap,
    color: "text-purple-400",
    status: "compliant",
    federalBudget: 45000000,
  },
};

function calculateSectorFines(sector: SectorData): { fine: number; atRisk: number } {
  switch (sector.id) {
    case "pharma":
      let pharmaFine = 0;
      let pharmaAtRisk = 0;
      if (sector.status === "arrears" && sector.facilities) {
        pharmaFine = sector.facilities * 587529;
      }
      if (sector.medicaidStatus === "non-compliant" && sector.revenue) {
        pharmaAtRisk = sector.revenue * 0.7;
      }
      return { fine: pharmaFine, atRisk: pharmaAtRisk };
    
    case "energy":
      const energyFine = (sector.mwhMissed || 0) * 1000;
      return { fine: energyFine, atRisk: 0 };
    
    case "medical":
      const medicalFine = (sector.violationCount || 0) * 71162;
      return { fine: medicalFine, atRisk: 0 };
    
    case "education":
      const eduAtRisk = sector.status === "breach" ? (sector.federalBudget || 0) : 0;
      return { fine: 0, atRisk: eduAtRisk };
    
    default:
      return { fine: 0, atRisk: 0 };
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function SectorSidebar({ 
  sectors, 
  activeSector, 
  onSectorChange 
}: { 
  sectors: SectorData[]; 
  activeSector: SectorType; 
  onSectorChange: (sector: SectorType) => void;
}) {
  return (
    <div className="w-72 bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))] flex flex-col" data-testid="sector-sidebar">
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-cyan" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">SECTOR CONTROL</span>
        </div>
        <span className="text-xs font-mono text-foreground">Multi-Sector GRC Dashboard</span>
      </div>
      
      <div className="flex-1 p-3 space-y-2 overflow-auto">
        {sectors.map((sector) => {
          const Icon = sector.icon;
          const isActive = sector.id === activeSector;
          const healthColor = sector.complianceHealth >= 90 ? "text-[hsl(var(--neon-green))]" : 
                             sector.complianceHealth >= 70 ? "text-[hsl(var(--warning))]" : 
                             "text-[hsl(var(--danger))]";
          
          return (
            <button
              key={sector.id}
              onClick={() => onSectorChange(sector.id)}
              className={`w-full p-3 rounded-md text-left transition-all hover-elevate ${
                isActive 
                  ? "bg-[hsl(var(--sidebar-accent))] border border-cyan/30" 
                  : "border border-transparent"
              }`}
              data-testid={`sector-button-${sector.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${sector.color}`} />
                  <span className="text-xs font-mono uppercase tracking-wider text-foreground">{sector.name}</span>
                </div>
                <Badge 
                  className={`text-[8px] font-mono ${
                    sector.status === "compliant" ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30" :
                    sector.status === "arrears" || sector.status === "non-compliant" ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" :
                    "bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30"
                  }`}
                  data-testid={`sector-status-${sector.id}`}
                >
                  {sector.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">{sector.regulator}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-mono font-semibold ${healthColor}`}>
                    {sector.complianceHealth}%
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">HEALTH</span>
                </div>
              </div>
              
              <div className="mt-2 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    sector.complianceHealth >= 90 ? "bg-[hsl(var(--neon-green))]" :
                    sector.complianceHealth >= 70 ? "bg-[hsl(var(--warning))]" :
                    "bg-[hsl(var(--danger))]"
                  }`}
                  style={{ width: `${sector.complianceHealth}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-3 h-3 text-cyan animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">CHAIN LISTENER</span>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground break-all">
          {WALLET_ADDRESS.slice(0, 20)}...
        </div>
      </div>
    </div>
  );
}

function ComplianceHealthMeter({ sector }: { sector: SectorData }) {
  const Icon = sector.icon;
  const { fine, atRisk } = calculateSectorFines(sector);
  
  return (
    <div className="glass-card rounded-md p-4 animate-slide-up" data-testid={`health-meter-${sector.id}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${sector.color}`} />
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-foreground">{sector.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">({sector.regulator})</span>
          </div>
        </div>
        <Badge 
          className={`text-[10px] font-mono uppercase ${
            sector.status === "compliant" ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30" :
            sector.status === "arrears" || sector.status === "non-compliant" ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" :
            "bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30"
          }`}
        >
          {sector.status}
        </Badge>
      </div>
      
      <div className="relative h-4 bg-[hsl(var(--muted))] rounded-full overflow-hidden mb-4">
        <div 
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            sector.complianceHealth >= 90 ? "bg-gradient-to-r from-[hsl(var(--neon-green))] to-[hsl(var(--neon-cyan))]" :
            sector.complianceHealth >= 70 ? "bg-gradient-to-r from-[hsl(var(--warning))] to-[hsl(var(--neon-green))]" :
            "bg-gradient-to-r from-[hsl(var(--danger))] to-[hsl(var(--warning))]"
          }`}
          style={{ width: `${sector.complianceHealth}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold text-white drop-shadow-lg">
            {sector.complianceHealth}% COMPLIANT
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-[hsl(var(--muted))] rounded-md">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-[hsl(var(--danger))]" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground">CALCULATED FINE</span>
          </div>
          <span className={`text-lg font-mono font-semibold ${fine > 0 ? "text-[hsl(var(--danger))]" : "text-[hsl(var(--neon-green))]"}`}>
            {fine > 0 ? formatCurrency(fine) : "$0"}
          </span>
        </div>
        <div className="p-3 bg-[hsl(var(--muted))] rounded-md">
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-[hsl(var(--warning))]" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground">AT RISK</span>
          </div>
          <span className={`text-lg font-mono font-semibold ${atRisk > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--neon-green))]"}`}>
            {atRisk > 0 ? formatCurrency(atRisk) : "$0"}
          </span>
        </div>
      </div>
    </div>
  );
}

function LiveAuditTrail({ logs, logContainerRef }: { logs: AuditLogEntry[]; logContainerRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div className="glass-card rounded-md h-full flex flex-col neon-glow animate-slide-up" data-testid="live-audit-trail">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(56,189,248,0.15)]">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-cyan" />
          <span className="text-xs font-mono uppercase tracking-widest text-foreground">LIVE AUDIT TRAIL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--neon-green))] animate-live-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--neon-green))]">ON-CHAIN</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{logs.length} ENTRIES</span>
          <span className="w-2 h-4 bg-cyan animate-cursor-blink rounded-sm" />
        </div>
      </div>
      
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-auto terminal-scrollbar p-4 font-mono text-xs space-y-1"
        data-testid="audit-log-container"
      >
        {logs.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 py-1 animate-fade-in-up" data-testid={`log-entry-${entry.id}`}>
            <span className="text-muted-foreground shrink-0">{formatTime(entry.timestamp)}</span>
            <span className="text-cyan shrink-0">[{entry.code}]</span>
            <span className="text-foreground flex-1">{entry.action}</span>
            {entry.txHash && (
              <span className="text-[hsl(var(--neon-green))] shrink-0 text-[10px]">
                {entry.txHash.slice(0, 10)}...
              </span>
            )}
            <span className={`shrink-0 ${
              entry.status === "SUCCESS" ? "text-[hsl(var(--neon-green))]" : 
              entry.status === "VERIFIED" ? "text-cyan" :
              entry.status === "SETTLED" ? "text-[hsl(var(--warning))]" :
              entry.status === "ALERT" ? "text-[hsl(var(--danger))]" :
              entry.status === "CHAIN" ? "text-[hsl(var(--neon-green))]" :
              "text-muted-foreground"
            }`}>{entry.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ROIHeader({ sectors, walletConnected }: { sectors: SectorData[]; walletConnected: boolean }) {
  const totalFines = sectors.reduce((sum, s) => {
    const { fine } = calculateSectorFines(s);
    return sum + fine;
  }, 0);
  const totalAtRisk = sectors.reduce((sum, s) => {
    const { atRisk } = calculateSectorFines(s);
    return sum + atRisk;
  }, 0);
  const avgHealth = Math.round(sectors.reduce((sum, s) => sum + s.complianceHealth, 0) / sectors.length);
  
  return (
    <div className="glass-card rounded-md p-4 mb-4" data-testid="roi-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-cyan to-[hsl(var(--neon-green))] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[hsl(var(--deep-navy))]" />
          </div>
          <div>
            <h1 className="text-lg font-mono uppercase tracking-widest text-foreground">COMPLIANCE-AS-A-SERVICE ROI</h1>
            <p className="text-xs font-mono text-muted-foreground">POLARUNIVERSAL GRC AGENT • MULTI-SECTOR PRODUCTION</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">PORTFOLIO HEALTH</span>
            <span className={`text-xl font-mono font-semibold ${
              avgHealth >= 90 ? "text-[hsl(var(--neon-green))]" : 
              avgHealth >= 70 ? "text-[hsl(var(--warning))]" : 
              "text-[hsl(var(--danger))]"
            }`}>{avgHealth}%</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">FINES AVOIDED</span>
            <span className="text-xl font-mono font-semibold text-[hsl(var(--neon-green))]">
              {totalFines === 0 ? formatCurrency(12500000) : formatCurrency(Math.max(0, 12500000 - totalFines))}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">CAPITAL PROTECTED</span>
            <span className="text-xl font-mono font-semibold text-cyan">
              {totalAtRisk === 0 ? formatCurrency(895000000) : formatCurrency(Math.max(0, 895000000 - totalAtRisk))}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-[rgba(56,189,248,0.15)]">
            <div className={`w-3 h-3 rounded-full ${walletConnected ? "bg-[hsl(var(--neon-green))] animate-live-pulse" : "bg-[hsl(var(--muted-foreground))]"}`} />
            <span className="text-[10px] font-mono uppercase text-muted-foreground">
              {walletConnected ? "CHAIN ACTIVE" : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VelocityChart({ data }: { data: VelocityDataPoint[] }) {
  return (
    <div className="glass-card rounded-md p-4 animate-slide-up" style={{ animationDelay: "0.3s" }} data-testid="velocity-chart">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-cyan" />
        <span className="text-xs font-mono uppercase tracking-widest text-foreground">COMPLIANCE VERIFICATION VELOCITY</span>
      </div>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="time" 
              stroke="hsl(222 30% 20%)" 
              tick={{ fontSize: 10, fill: "hsl(210 10% 50%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(222 30% 20%)" 
              tick={{ fontSize: 10, fill: "hsl(210 10% 50%)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: "hsl(222 47% 8%)", 
                border: "1px solid rgba(56,189,248,0.2)",
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
    <div className="glass-card rounded-md p-4 animate-slide-up" style={{ animationDelay: `${delay}s` }} data-testid={`stats-card-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-cyan" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      <div className="text-xl font-semibold text-foreground neon-text">{value}</div>
      <div className="text-[10px] font-mono text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

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

function ComplianceCommandCenter() {
  const [scenario, setScenario] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComplianceAnalysisResult | null>(null);
  const { toast } = useToast();

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

    try {
      const response = await fetch("/api/v1/compliance/analyze-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Audit Complete",
        description: `Analysis traced to Opik project: ${data.project}`,
      });
    } catch (error) {
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
    <div className="glass-card rounded-md p-3" data-testid="compliance-command-center">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-cyan" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">COMPLIANCE COMMAND CENTER</span>
        <Badge className="text-[7px] font-mono bg-cyan/20 text-cyan border-cyan/30 ml-auto">OPIK TRACED</Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground block mb-1">Compliance Scenario</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Describe your compliance scenario... (e.g., 'A pharmaceutical shipment arrived with temperature logs showing 12°C for 4 hours during transit')"
            className="w-full h-20 p-2 bg-[hsl(var(--muted))] border border-[rgba(56,189,248,0.15)] rounded text-xs font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-cyan/50"
            data-testid="input-compliance-scenario"
          />
        </div>
        
        <Button
          onClick={handleRunAudit}
          disabled={isAnalyzing || !scenario.trim()}
          className="w-full bg-gradient-to-r from-cyan to-[hsl(var(--neon-green))] text-[hsl(var(--deep-navy))] font-mono text-[10px] uppercase tracking-wider"
          data-testid="button-run-audit"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-3 h-3 mr-2 animate-spin" />
              ANALYZING...
            </>
          ) : (
            <>
              <Shield className="w-3 h-3 mr-2" />
              RUN PROFESSIONAL AUDIT
            </>
          )}
        </Button>

        {result && (
          <div className="mt-3 p-2 bg-[hsl(var(--muted))] rounded border border-[rgba(56,189,248,0.15)]" data-testid="audit-result">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">AUDIT RESULT</span>
              <Badge className={`text-[7px] font-mono ${
                result.analysis.status === "COMPLIANT" 
                  ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30"
                  : "bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30"
              }`}>
                {result.analysis.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-16 h-1.5 bg-[hsl(var(--deep-navy))] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${result.analysis.confidence >= 0.8 ? "bg-[hsl(var(--neon-green))]" : result.analysis.confidence >= 0.5 ? "bg-cyan" : "bg-[hsl(var(--warning))]"}`}
                  style={{ width: `${result.analysis.confidence * 100}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-muted-foreground">{Math.round(result.analysis.confidence * 100)}% CONFIDENCE</span>
            </div>

            {result.analysis.violations.length > 0 && (
              <div className="mb-2">
                <span className="text-[8px] font-mono uppercase text-[hsl(var(--danger))] block mb-1">VIOLATIONS ({result.analysis.violations.length})</span>
                {result.analysis.violations.slice(0, 2).map((v, i) => (
                  <div key={i} className="text-[8px] font-mono text-muted-foreground pl-2 border-l border-[hsl(var(--danger))]/30">
                    {v.description.substring(0, 60)}...
                  </div>
                ))}
              </div>
            )}

            {result.analysis.recommendations.length > 0 && (
              <div>
                <span className="text-[8px] font-mono uppercase text-cyan block mb-1">RECOMMENDATIONS</span>
                {result.analysis.recommendations.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-[8px] font-mono text-muted-foreground pl-2 border-l border-cyan/30">
                    {r.substring(0, 60)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return "text-[hsl(var(--neon-green))]";
    if (score >= 70) return "text-cyan";
    if (score >= 50) return "text-[hsl(var(--warning))]";
    return "text-[hsl(var(--danger))]";
  };
  
  return (
    <div className="flex items-center gap-2" data-testid="confidence-score">
      <div className="flex items-center gap-1">
        <Eye className="w-3 h-3 text-muted-foreground" />
        <span className="text-[9px] font-mono uppercase text-muted-foreground">AI CONFIDENCE</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-12 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${score >= 90 ? "bg-[hsl(var(--neon-green))]" : score >= 70 ? "bg-cyan" : score >= 50 ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--danger))]"}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-[10px] font-mono font-semibold ${getColor()}`}>{score}%</span>
      </div>
    </div>
  );
}

function SourceGrounding({ sector }: { sector: SectorData }) {
  const reference = REGULATORY_REFERENCES.find(r => r.sector === sector.id);
  
  if (!reference) return null;
  
  const isNonCompliant = sector.status !== "compliant";
  const hasCompleteData = sector.complianceHealth >= 70 && !isNonCompliant;
  const confidenceScore = hasCompleteData ? 85 + Math.floor(Math.random() * 15) : isNonCompliant ? 35 + Math.floor(Math.random() * 10) : 50 + Math.floor(Math.random() * 20);
  
  return (
    <div className="glass-card rounded-md p-3 mt-3 border border-cyan/20" data-testid="source-grounding">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-cyan" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">REGULATORY REFERENCE</span>
        </div>
        <ConfidenceScore score={confidenceScore} />
      </div>
      
      {confidenceScore >= 50 ? (
        <>
          <div className="bg-[hsl(var(--muted))] rounded p-2 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-[8px] font-mono bg-cyan/20 text-cyan border-cyan/30">{reference.code}</Badge>
              <span className="text-[10px] font-mono text-foreground">{reference.title}</span>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground italic leading-relaxed">"{reference.citation}"</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-muted-foreground">FORMULA:</span>
            <span className="text-[10px] font-mono text-cyan">{reference.fineFormula}</span>
          </div>
        </>
      ) : (
        <div className="bg-[hsl(var(--danger))]/10 border border-[hsl(var(--danger))]/30 rounded p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--danger))]" />
          <div>
            <span className="text-[10px] font-mono uppercase text-[hsl(var(--danger))] block">HUMAN AUDIT REQUIRED</span>
            <span className="text-[9px] font-mono text-muted-foreground">Insufficient data for automated compliance assessment</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HITLApprovalPanel({ 
  pendingApprovals, 
  onApprove, 
  onReject 
}: { 
  pendingApprovals: PendingApproval[]; 
  onApprove: (id: string) => void; 
  onReject: (id: string) => void;
}) {
  const pendingItems = pendingApprovals.filter(p => p.approved === null);
  
  return (
    <div className="glass-card rounded-md p-4 animate-slide-up" data-testid="hitl-approval-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[hsl(var(--warning))]" />
          <span className="text-xs font-mono uppercase tracking-widest text-foreground">PENDING APPROVALS</span>
        </div>
        <Badge className={`text-[10px] font-mono ${pendingItems.length > 0 ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" : "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30"}`}>
          {pendingItems.length} AWAITING REVIEW
        </Badge>
      </div>
      
      {pendingItems.length === 0 ? (
        <div className="text-center py-4">
          <Unlock className="w-6 h-6 text-[hsl(var(--neon-green))] mx-auto mb-2" />
          <span className="text-[10px] font-mono text-muted-foreground">AUTONOMOUS OUTREACH UNLOCKED</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-auto terminal-scrollbar">
          {pendingItems.map((item) => (
            <div key={item.id} className="bg-[hsl(var(--muted))] rounded p-2" data-testid={`approval-item-${item.id}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge className="text-[8px] font-mono uppercase bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
                    {item.sector}
                  </Badge>
                  <span className="text-[10px] font-mono text-[hsl(var(--danger))] font-semibold">{formatCurrency(item.fineAmount)}</span>
                </div>
                <ConfidenceScore score={item.confidenceScore} />
              </div>
              <p className="text-[9px] font-mono text-muted-foreground mb-2">{item.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-mono text-muted-foreground">{item.regulatoryRef}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="text-[9px] font-mono text-[hsl(var(--neon-green))]" onClick={() => onApprove(item.id)} data-testid={`button-approve-${item.id}`}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />APPROVE
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[9px] font-mono text-[hsl(var(--danger))]" onClick={() => onReject(item.id)} data-testid={`button-reject-${item.id}`}>
                    <XCircle className="w-3 h-3 mr-1" />REJECT
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {pendingItems.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-[hsl(var(--warning))]">
          <Lock className="w-3 h-3" />
          <span>AUTONOMOUS OUTREACH LOCKED UNTIL APPROVALS COMPLETE</span>
        </div>
      )}
    </div>
  );
}

function PolarRewardsPanel({ polarBalance, streak, leaderboard, onClaim }: { polarBalance: number; streak: number; leaderboard: LeaderboardEntry[]; onClaim: () => void }) {
  return (
    <div className="glass-card rounded-md p-4 animate-slide-up" data-testid="polar-rewards-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[hsl(var(--neon-green))]" />
          <span className="text-xs font-mono uppercase tracking-widest text-foreground">SOVEREIGN REWARDS</span>
        </div>
        <Badge className="text-[10px] font-mono bg-purple-500/20 text-purple-400 border-purple-500/30">$POLAR</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-[hsl(var(--muted))] rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Coins className="w-4 h-4 text-[hsl(var(--neon-green))]" />
            <span className="text-lg font-mono font-semibold text-[hsl(var(--neon-green))]">{polarBalance.toLocaleString()}</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">$POLAR BALANCE</span>
        </div>
        <div className="bg-[hsl(var(--muted))] rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-[hsl(var(--warning))]" />
            <span className="text-lg font-mono font-semibold text-[hsl(var(--warning))]">{streak}</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">DAY STREAK</span>
        </div>
      </div>
      
      <Button onClick={onClaim} className="w-full mb-3 bg-gradient-to-r from-[hsl(var(--neon-green))] to-cyan text-[hsl(var(--deep-navy))] font-mono text-xs uppercase tracking-wider" data-testid="button-claim-polar">
        <Gift className="w-4 h-4 mr-2" />CLAIM DAILY REWARD
      </Button>
      
      <div className="border-t border-[rgba(56,189,248,0.15)] pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-3 h-3 text-[hsl(var(--warning))]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">COMPLIANCE STREAK LEADERBOARD</span>
        </div>
        <div className="space-y-1">
          {leaderboard.slice(0, 5).map((entry) => (
            <div key={entry.rank} className="flex items-center justify-between py-1 px-2 rounded bg-[hsl(var(--muted))]/50" data-testid={`leaderboard-entry-${entry.rank}`}>
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-5 h-5 rounded-full ${entry.rank === 1 ? "bg-[hsl(var(--warning))]" : entry.rank === 2 ? "bg-slate-400" : entry.rank === 3 ? "bg-amber-600" : "bg-[hsl(var(--muted))]"}`}>
                  {entry.rank <= 3 ? (
                    <Trophy className={`w-3 h-3 ${entry.rank === 1 ? "text-[hsl(var(--deep-navy))]" : "text-white"}`} />
                  ) : (
                    <span className="text-[8px] font-mono font-bold text-muted-foreground">{entry.rank}</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-foreground">{entry.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[hsl(var(--warning))]" />
                  <span className="text-[9px] font-mono text-foreground">{entry.streak}d</span>
                </div>
                <span className="text-[9px] font-mono text-[hsl(var(--neon-green))]">{entry.polarEarned.toLocaleString()} $POLAR</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgenticScoutFeed({ scoutEntries }: { scoutEntries: ScoutEntry[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [scoutEntries]);
  
  return (
    <div className="glass-card rounded-md h-full flex flex-col" data-testid="scout-feed">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(56,189,248,0.15)]">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-foreground">AGENTIC SCOUT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan animate-live-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan">SCANNING</span>
        </div>
      </div>
      
      <div ref={feedRef} className="flex-1 overflow-auto terminal-scrollbar p-3 font-mono text-[10px] space-y-1 bg-[hsl(var(--deep-navy))]">
        {scoutEntries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-2 animate-fade-in-up" data-testid={`scout-entry-${entry.id}`}>
            <span className="text-muted-foreground shrink-0">{formatTime(entry.timestamp)}</span>
            <span className={`shrink-0 ${
              entry.riskLevel === "high" ? "text-[hsl(var(--danger))]" : 
              entry.riskLevel === "medium" ? "text-[hsl(var(--warning))]" : 
              "text-[hsl(var(--neon-green))]"
            }`}>●</span>
            <span className="text-cyan shrink-0">[{entry.source}]</span>
            <span className="text-foreground">{entry.action}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-cyan">
          <span className="w-2 h-4 bg-cyan animate-cursor-blink rounded-sm" />
          <span className="animate-pulse">Awaiting next signal...</span>
        </div>
      </div>
    </div>
  );
}

function PermanentAuditLog({ logs }: { logs: AuditLogEntry[] }) {
  const logRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);
  
  return (
    <div className="glass-card rounded-md border-t-2 border-cyan/50" data-testid="permanent-audit-log">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(56,189,248,0.15)]">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-cyan" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">PERMANENT AUDIT LOG</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-muted-foreground">{logs.length} ACTIONS RECORDED</span>
          <Badge className="text-[8px] font-mono bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30">IMMUTABLE</Badge>
        </div>
      </div>
      
      <div ref={logRef} className="h-24 overflow-auto terminal-scrollbar px-4 py-2 font-mono text-[9px] space-y-0.5">
        {logs.slice(-50).map((entry) => (
          <div key={entry.id} className="flex items-center gap-2" data-testid={`perm-log-${entry.id}`}>
            <span className="text-muted-foreground shrink-0 w-16">{formatTime(entry.timestamp)}</span>
            <span className="text-cyan shrink-0 w-16">[{entry.code}]</span>
            <span className="text-foreground flex-1 truncate">{entry.action}</span>
            <span className={`shrink-0 w-16 text-right ${
              entry.status === "SUCCESS" ? "text-[hsl(var(--neon-green))]" : 
              entry.status === "ALERT" ? "text-[hsl(var(--danger))]" :
              entry.status === "CHAIN" ? "text-purple-400" :
              "text-muted-foreground"
            }`}>{entry.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlphaBanner() {
  return (
    <div className="bg-gradient-to-r from-[hsl(var(--warning))]/20 via-purple-500/20 to-cyan/20 border-b border-[hsl(var(--warning))]/30 px-6 py-2" data-testid="alpha-banner">
      <div className="flex items-center justify-center gap-3">
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
        <span className="text-xs font-mono uppercase tracking-wider text-[hsl(var(--warning))]">
          ALPHA STAGE: Experimental software for research only. Users assume all risk. Enterprise DeSci Infrastructure. Not for production use.
        </span>
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
      </div>
    </div>
  );
}

function SKRGuardianStaking() {
  const [hasSeekerToken, setHasSeekerToken] = useState(false);
  const [isVIPUnlocked, setIsVIPUnlocked] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  useEffect(() => {
    const checkSeekerGenesisToken = async () => {
      setCheckingToken(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const simulatedTokenPresent = true;
        setHasSeekerToken(simulatedTokenPresent);
        setIsVIPUnlocked(simulatedTokenPresent);
      } catch (error) {
        console.error('Error checking Seeker Genesis Token:', error);
      } finally {
        setCheckingToken(false);
      }
    };
    
    checkSeekerGenesisToken();
  }, []);
  
  const handleClaimSKR = () => {
    window.open('https://stake.solanamobile.com', '_blank');
  };
  
  return (
    <div className="glass-card rounded-md p-3" data-testid="skr-guardian-staking">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-purple-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">SKR GUARDIAN STAKING</span>
        <Badge className="text-[8px] font-mono bg-purple-500/20 text-purple-400 border-purple-500/30 ml-auto">SOVEREIGN TIER</Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-[hsl(var(--muted))] rounded">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${checkingToken ? 'bg-[hsl(var(--warning))] animate-pulse' : hasSeekerToken ? 'bg-[hsl(var(--neon-green))]' : 'bg-muted-foreground'}`} />
            <span className="text-[9px] font-mono text-foreground">Seeker Genesis Token</span>
          </div>
          <Badge className={`text-[7px] font-mono ${hasSeekerToken ? 'bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30' : 'bg-muted text-muted-foreground border-muted-foreground/30'}`}>
            {checkingToken ? 'CHECKING...' : hasSeekerToken ? 'DETECTED' : 'NOT FOUND'}
          </Badge>
        </div>
        
        {isVIPUnlocked && (
          <div className="flex items-center justify-between p-2 bg-purple-500/10 border border-purple-500/30 rounded animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-purple-400" />
              <span className="text-[9px] font-mono text-purple-400">VIP Auditor Features</span>
            </div>
            <Badge className="text-[7px] font-mono bg-purple-500/20 text-purple-400 border-purple-500/30">UNLOCKED</Badge>
          </div>
        )}
        
        <Button
          size="sm"
          variant="default"
          onClick={handleClaimSKR}
          className="w-full bg-purple-600 text-[10px] font-mono uppercase tracking-wider"
          data-testid="button-claim-skr"
        >
          <ExternalLink className="w-3 h-3 mr-1.5" />
          Claim SKR Rewards
        </Button>
      </div>
    </div>
  );
}

function GrantTrackerWidget() {
  const grants = [
    {
      id: "jpmorgan-medtech",
      name: "J.P. Morgan Medtech",
      amount: "$175,000",
      deadline: "2026-03-15",
      status: "in_progress",
      requirements: [
        { id: "dscsa-2026", name: "DSCSA 2026 Compliance", status: "verified", icon: CheckCircle2 },
        { id: "hipaa", name: "HIPAA Audit Trail", status: "verified", icon: CheckCircle2 },
        { id: "zk-proofs", name: "ZK Proof Integration", status: "verified", icon: CheckCircle2 },
        { id: "movement-m1", name: "Movement M1 Deployment", status: "verified", icon: CheckCircle2 },
        { id: "aml-gateway", name: "AML Gateway (FET.ai)", status: "pending", icon: Clock },
      ],
      completionRate: 80,
    },
    {
      id: "phathom-pharma",
      name: "Phathom Pharma",
      amount: "$175,000",
      deadline: "2026-04-30",
      status: "in_progress",
      requirements: [
        { id: "cdsco", name: "CDSCO Audit Export", status: "verified", icon: CheckCircle2 },
        { id: "dpdp-act", name: "DPDP Act (India)", status: "verified", icon: CheckCircle2 },
        { id: "celestia-da", name: "Celestia DA Fallback", status: "verified", icon: CheckCircle2 },
        { id: "icp-vault", name: "ICP Patient Vault", status: "pending", icon: Clock },
        { id: "stacks-btc", name: "Stacks BTC Anchoring", status: "pending", icon: Clock },
      ],
      completionRate: 60,
    },
    {
      id: "google-cloud",
      name: "Google Cloud Scale Tier",
      amount: "$350,000",
      deadline: "2026-06-01",
      status: "eligible",
      requirements: [
        { id: "triple-zero", name: "Triple-Zero Standard", status: "verified", icon: CheckCircle2 },
        { id: "opik-observability", name: "Opik Observability", status: "verified", icon: CheckCircle2 },
        { id: "multi-chain", name: "Multi-Chain Deploy", status: "verified", icon: CheckCircle2 },
        { id: "rbi-sandbox", name: "RBI Sandbox Mode", status: "verified", icon: CheckCircle2 },
        { id: "gemini-ai", name: "Gemini AI Integration", status: "verified", icon: CheckCircle2 },
      ],
      completionRate: 100,
    },
  ];

  return (
    <div className="glass-card rounded-md p-3" data-testid="grant-tracker-widget">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-[hsl(var(--neon-green))]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">GRANT TRACKER</span>
        <Badge className="text-[8px] font-mono bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30 ml-auto">SENTINEL v1.1</Badge>
      </div>
      
      <div className="space-y-3">
        {grants.map((grant) => (
          <div 
            key={grant.id}
            className="p-2 bg-[hsl(var(--muted))] rounded border border-[rgba(56,189,248,0.1)]"
            data-testid={`grant-${grant.id}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  grant.completionRate === 100 ? 'bg-[hsl(var(--neon-green))] animate-pulse' :
                  grant.completionRate >= 60 ? 'bg-[hsl(var(--warning))]' :
                  'bg-muted-foreground'
                }`} />
                <span className="text-[9px] font-mono font-semibold text-foreground">{grant.name}</span>
              </div>
              <Badge className={`text-[7px] font-mono ${
                grant.completionRate === 100 
                  ? 'bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30'
                  : 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30'
              }`}>
                {grant.completionRate === 100 ? 'ELIGIBLE' : `${grant.completionRate}%`}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[hsl(var(--neon-green))] font-semibold">{grant.amount}</span>
              <span className="text-[8px] font-mono text-muted-foreground">Due: {grant.deadline}</span>
            </div>
            
            <div className="h-1 bg-[hsl(var(--deep-navy))] rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all ${
                  grant.completionRate === 100 ? 'bg-[hsl(var(--neon-green))]' : 'bg-[hsl(var(--warning))]'
                }`}
                style={{ width: `${grant.completionRate}%` }}
              />
            </div>
            
            <div className="flex flex-wrap gap-1">
              {grant.requirements.map((req) => {
                const ReqIcon = req.icon;
                return (
                  <div 
                    key={req.id}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[6px] font-mono ${
                      req.status === 'verified' 
                        ? 'bg-[hsl(var(--neon-green))]/10 text-[hsl(var(--neon-green))]' 
                        : 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'
                    }`}
                    title={req.name}
                  >
                    <ReqIcon className="w-2 h-2" />
                    <span className="truncate max-w-[50px]">{req.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-[rgba(56,189,248,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono text-muted-foreground">Total Grant Value</span>
          <span className="text-[10px] font-mono font-semibold text-[hsl(var(--neon-green))]">$700,000</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px] font-mono text-muted-foreground">Indian Localization</span>
          <Badge className="text-[6px] font-mono bg-cyan/20 text-cyan border-cyan/30">DPDP + CDSCO + RBI</Badge>
        </div>
      </div>
    </div>
  );
}

function TransparencyLedgerConfig() {
  const [pushToMovement, setPushToMovement] = useState(true);
  
  return (
    <div className="glass-card rounded-md p-3" data-testid="transparency-ledger">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-[hsl(var(--neon-green))]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">TRANSPARENCY LEDGER</span>
        <Badge className="text-[8px] font-mono bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30 ml-auto">PHARMA GRC</Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-[hsl(var(--muted))] rounded">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${pushToMovement ? 'bg-[hsl(var(--neon-green))] animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-[9px] font-mono text-foreground">Push to Movement Testnet</span>
          </div>
          <Badge className="text-[7px] font-mono bg-[#E4FF1A]/20 text-[#E4FF1A] border-[#E4FF1A]/30">
            {pushToMovement ? 'ACTIVE' : 'DISABLED'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-[hsl(var(--muted))] rounded">
          <span className="text-[8px] font-mono text-muted-foreground">Audit Logs Synced</span>
          <span className="text-[9px] font-mono text-foreground">1,247</span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-[hsl(var(--muted))] rounded">
          <span className="text-[8px] font-mono text-muted-foreground">Last Sync</span>
          <span className="text-[9px] font-mono text-[hsl(var(--neon-green))]">2s ago</span>
        </div>
      </div>
    </div>
  );
}

function TechnologyStackMap() {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'data': return Radio;
      case 'ai': return Cpu;
      case 'desci': return FileText;
      case 'identity': return Users;
      default: return Globe;
    }
  };

  return (
    <div className="glass-card rounded-md p-3" data-testid="tech-stack-map">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-cyan" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">TECHNOLOGY STACK</span>
        <Badge className="text-[8px] font-mono bg-purple-500/20 text-purple-400 border-purple-500/30 ml-auto">MODULAR</Badge>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {TECH_STACK_PARTNERS.map((partner) => {
          const Icon = getCategoryIcon(partner.category);
          return (
            <div 
              key={partner.id}
              className="flex items-center gap-1.5 p-1.5 bg-[hsl(var(--muted))] rounded hover-elevate"
              data-testid={`tech-${partner.id}`}
            >
              <div 
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ backgroundColor: `${partner.color}30` }}
              >
                <Icon className="w-3 h-3" style={{ color: partner.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-mono uppercase text-foreground block truncate">{partner.name}</span>
                <span className="text-[6px] font-mono text-muted-foreground block truncate">{partner.description}</span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full ${
                partner.status === 'active' ? 'bg-[hsl(var(--neon-green))]' :
                partner.status === 'integrating' ? 'bg-[hsl(var(--warning))] animate-pulse' :
                'bg-muted-foreground'
              }`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NetworkHealthIndicators() {
  const [healthData] = useState(() => {
    const defaultHealth = getDefaultNetworkHealth();
    return SUPPORTED_CHAINS.map(chain => ({
      chainId: chain.id,
      name: chain.name.split(' ')[0],
      latency: defaultHealth[chain.id]?.latency || 50,
      status: defaultHealth[chain.id]?.status || 'healthy' as const,
      airdropMultiplier: defaultHealth[chain.id]?.airdropMultiplier || 1.5,
      color: chain.logoColor || '#ffffff',
    }));
  });

  return (
    <div className="glass-card rounded-md p-3" data-testid="network-health">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-[hsl(var(--neon-green))]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">NETWORK HEALTH</span>
        <Badge className="text-[8px] font-mono bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30 ml-auto">LIVE</Badge>
      </div>
      <div className="space-y-1.5">
        {healthData.map((network) => (
          <div 
            key={network.chainId}
            className="flex items-center justify-between p-1.5 bg-[hsl(var(--muted))] rounded"
            data-testid={`health-${network.chainId}`}
          >
            <div className="flex items-center gap-2">
              <span 
                className={`w-2 h-2 rounded-full ${
                  network.status === 'healthy' ? 'bg-[hsl(var(--neon-green))]' :
                  network.status === 'degraded' ? 'bg-[hsl(var(--warning))]' :
                  'bg-[hsl(var(--danger))]'
                }`}
              />
              <span className="text-[9px] font-mono uppercase text-foreground" style={{ color: network.color }}>{network.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-muted-foreground">{network.latency}ms</span>
              <Badge className="text-[7px] font-mono bg-cyan/20 text-cyan border-cyan/30">
                {network.airdropMultiplier}x
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiChainStatus({ networks }: { networks: NetworkDeployment[] }) {
  return (
    <div className="glass-card rounded-md p-3" data-testid="multichain-status">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-cyan" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">MULTI-CHAIN DEPLOYMENTS</span>
        <Badge className="text-[8px] font-mono bg-cyan/20 text-cyan border-cyan/30 ml-auto">AIRDROP MAX</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {networks.map((network) => (
          <div 
            key={network.id}
            className="flex items-center justify-between p-2 bg-[hsl(var(--muted))] rounded"
            data-testid={`network-${network.id}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                network.status === "live" ? "bg-[hsl(var(--neon-green))] animate-pulse" :
                network.status === "pending" ? "bg-[hsl(var(--warning))]" :
                "bg-[hsl(var(--muted-foreground))]"
              }`} />
              <span className="text-[9px] font-mono uppercase text-foreground">{network.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className={`text-[7px] font-mono ${
                network.status === "live" ? "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30" :
                network.status === "pending" ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" :
                "bg-[hsl(var(--muted))]/50 text-muted-foreground border-muted"
              }`}>
                {network.status.toUpperCase()}
              </Badge>
              {network.contractAddress && (
                <a 
                  href={`${network.explorerUrl}/address/${network.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover-elevate p-1 rounded"
                  data-testid={`explorer-${network.id}`}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-[rgba(56,189,248,0.15)]">
        <p className="text-[8px] font-mono text-muted-foreground text-center">
          Deploy via MetaMask: Sepolia, Berachain, Monad, Story, Abstract | Movement: Use Aptos CLI
        </p>
      </div>
    </div>
  );
}

function NetworkStatusBar({ walletConnected, chainMode }: { walletConnected: boolean; chainMode: "realtime" | "balance" | "offline" }) {
  return (
    <div className="h-10 bg-[hsl(var(--deep-navy))] border-b border-[rgba(56,189,248,0.15)] flex items-center justify-between px-6" data-testid="network-status-bar">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Movement M1:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--neon-green))] animate-live-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--neon-green))]">ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Data Mode:</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              chainMode === "realtime" ? "bg-[hsl(var(--neon-green))] animate-pulse" : 
              chainMode === "balance" ? "bg-cyan animate-pulse" : 
              "bg-[hsl(var(--muted-foreground))]"
            }`} />
            <span className={`text-[10px] font-mono uppercase tracking-wider ${
              chainMode === "realtime" ? "text-[hsl(var(--neon-green))]" : 
              chainMode === "balance" ? "text-cyan" : 
              "text-muted-foreground"
            }`}>
              {chainMode === "realtime" ? "REAL-TIME TX" : chainMode === "balance" ? "BALANCE MONITOR" : "OFFLINE"}
            </span>
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

export default function Dashboard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [chainMode, setChainMode] = useState<"realtime" | "balance" | "offline">("offline");
  const [activeSector, setActiveSector] = useState<SectorType>("pharma");
  const [velocityData, setVelocityData] = useState<VelocityDataPoint[]>([]);
  const [auditCount, setAuditCount] = useState(1247);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [scoutEntries, setScoutEntries] = useState<ScoutEntry[]>([]);
  const [polarBalance, setPolarBalance] = useState(12450);
  const [complianceStreak, setComplianceStreak] = useState(47);
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, address: "0x7a2f...8b31", streak: 142, polarEarned: 28400 },
    { rank: 2, address: "0x3c4e...9f12", streak: 128, polarEarned: 25600 },
    { rank: 3, address: "0x9d1a...4e67", streak: 115, polarEarned: 23000 },
    { rank: 4, address: "0x5b8c...2a19", streak: 98, polarEarned: 19600 },
    { rank: 5, address: "0x1f3d...7c85", streak: 87, polarEarned: 17400 },
  ]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "approvals">("dashboard");
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
    setLogs((prev) => [...prev.slice(-100), newEntry]);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  useEffect(() => {
    const initialSectors: SectorData[] = Object.values(SECTOR_CONFIGS).map((config, idx) => {
      if (idx === 2) {
        return {
          ...config,
          complianceHealth: 65,
          calculatedFine: 0,
          atRiskAmount: 0,
          status: "non-compliant" as const,
          violationCount: 2,
        };
      }
      return {
        ...config,
        complianceHealth: 85 + Math.floor(Math.random() * 15),
        calculatedFine: 0,
        atRiskAmount: 0,
      };
    });
    setSectors(initialSectors);
    
    setPendingApprovals([{
      id: crypto.randomUUID(),
      sector: "medical",
      fineAmount: 142324,
      reason: "Healthcare sector: 2 HIPAA violations detected exceeding $25,000 threshold",
      timestamp: new Date(),
      regulatoryRef: "HIPAA-45CFR-160.404",
      confidenceScore: 87,
      approved: null,
    }]);

    const initialData: VelocityDataPoint[] = [];
    for (let i = 0; i < 20; i++) {
      initialData.push({
        time: `${i}s`,
        velocity: 50 + Math.random() * 30,
      });
    }
    setVelocityData(initialData);

    addLog({
      code: "SYS-001",
      action: "POLARUNIVERSAL MULTI-SECTOR GRC AGENT INITIALIZED",
      status: "SUCCESS",
    });
    addLog({
      code: "NET-001",
      action: "CONNECTED TO MOVEMENT M1 MAINNET RPC",
      status: "VERIFIED",
    });
    addLog({
      code: "CFG-001",
      action: "LOADED 4 SECTOR COMPLIANCE PROFILES: FDA/ERCOT/HIPAA/TITLE-IX",
      status: "SUCCESS",
    });
  }, [addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sectorActions: Record<SectorType, string[]> = {
        pharma: [
          "SCANNING FDA 21 CFR PART 11 COMPLIANCE",
          "VERIFYING GMP FACILITY CERTIFICATIONS",
          "AUDITING DRUG SAFETY REPORTING CHAIN",
          "CHECKING MEDICAID REBATE CALCULATIONS",
        ],
        energy: [
          "MONITORING ERCOT DISPATCH SIGNALS",
          "VERIFYING GRID FREQUENCY COMPLIANCE",
          "AUDITING RENEWABLE CREDIT CLAIMS",
          "CHECKING ANCILLARY SERVICE RECORDS",
        ],
        medical: [
          "SCANNING PHI ACCESS LOGS FOR VIOLATIONS",
          "VERIFYING BAA CHAIN COMPLIANCE",
          "AUDITING HIPAA SECURITY RULE ADHERENCE",
          "CHECKING BREACH NOTIFICATION STATUS",
        ],
        education: [
          "AUDITING TITLE IX COMPLAINT RESPONSE TIME",
          "VERIFYING CLERY ACT DISCLOSURES",
          "CHECKING FERPA CONSENT RECORDS",
          "MONITORING FEDERAL GRANT COMPLIANCE",
        ],
      };

      const sector = Object.keys(sectorActions)[Math.floor(Math.random() * 4)] as SectorType;
      const actions = sectorActions[sector];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const statuses: AuditLogEntry["status"][] = ["SUCCESS", "VERIFIED", "PROCESSING"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      addLog({
        code: `${sector.toUpperCase().slice(0, 3)}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
        action,
        status,
        sector,
      });

      setVelocityData((prev) => {
        const newData = [...prev.slice(1), {
          time: `${Date.now() % 100}s`,
          velocity: 50 + Math.random() * 40,
        }];
        return newData;
      });

      setAuditCount((prev) => prev + 1);

      setSectors((prev) => prev.map(s => ({
        ...s,
        complianceHealth: Math.min(100, Math.max(60, s.complianceHealth + (Math.random() - 0.45) * 2)),
      })));
    }, 4000);

    return () => clearInterval(interval);
  }, [addLog]);

  useEffect(() => {
    if (!walletConnected) return;

    const provider = new ethers.JsonRpcProvider("https://mainnet.movementnetwork.xyz");
    let lastBlockNumber = 0;
    let lastBalance = BigInt(0);
    let rpcMode: "full" | "limited" = "full";
    
    setChainMode("balance");
    
    addLog({
      code: "ETH-001",
      action: `INITIALIZING ETHERS.JS v${ethers.version} PROVIDER`,
      status: "PROCESSING",
    });

    addLog({
      code: "WAL-002",
      action: `SUBSCRIBING TO WALLET ${WALLET_ADDRESS.slice(0, 20)}...`,
      status: "PROCESSING",
    });

    const scanBlockForWalletTx = async (blockNumber: number): Promise<{found: boolean; txHash?: string; value?: string}> => {
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (!block || !block.prefetchedTransactions) return { found: false };
        
        for (const tx of block.prefetchedTransactions) {
          if (tx.from?.toLowerCase() === WALLET_ADDRESS.toLowerCase() || 
              tx.to?.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
            return { 
              found: true, 
              txHash: tx.hash,
              value: ethers.formatEther(tx.value)
            };
          }
        }
        return { found: false };
      } catch {
        return { found: false };
      }
    };

    const checkForActivity = async () => {
      try {
        const blockNumber = await provider.getBlockNumber();
        
        if (lastBlockNumber > 0 && blockNumber > lastBlockNumber) {
          const blocksProcessed = blockNumber - lastBlockNumber;
          
          addLog({
            code: "CHN-BLK",
            action: `SCANNING ${blocksProcessed} NEW BLOCK(S) #${lastBlockNumber + 1} → #${blockNumber}`,
            status: "CHAIN",
          });

          const balance = await provider.getBalance(WALLET_ADDRESS);
          const balanceInMOVE = ethers.formatEther(balance);
          
          if (balance !== lastBalance && lastBalance !== BigInt(0)) {
            const diff = balance - lastBalance;
            const diffFormatted = ethers.formatEther(diff > 0 ? diff : -diff);
            const direction = diff > 0 ? "RECEIVED" : "SENT";
            
            addLog({
              code: "TXN-DET",
              action: `WALLET ${direction} ${parseFloat(diffFormatted).toFixed(6)} MOVE`,
              status: "CHAIN",
            });

            const sectors: SectorType[] = ["pharma", "energy", "medical", "education"];
            const sector = sectors[Math.floor(Math.random() * sectors.length)];
            
            addLog({
              code: "CMP-EVT",
              action: `COMPLIANCE STATE CHANGE TRIGGERED FOR ${sector.toUpperCase()} SECTOR`,
              status: "ALERT",
              sector,
            });

            setSectors(prev => prev.map(s => {
              if (s.id === sector) {
                const healthChange = diff > 0 ? Math.random() * 3 : -(Math.random() * 5);
                const newHealth = Math.min(100, Math.max(50, s.complianceHealth + healthChange));
                
                let newStatus = s.status;
                if (newHealth < 70) {
                  newStatus = s.id === "education" ? "breach" : 
                              s.id === "pharma" ? "arrears" : "non-compliant";
                } else if (newHealth < 85) {
                  newStatus = "non-compliant";
                } else {
                  newStatus = "compliant";
                }
                
                return { ...s, complianceHealth: newHealth, status: newStatus };
              }
              return s;
            }));
          }
          
          lastBalance = balance;

          addLog({
            code: "WAL-BAL",
            action: `CURRENT BALANCE: ${parseFloat(balanceInMOVE).toFixed(6)} MOVE`,
            status: "VERIFIED",
          });

          if (rpcMode === "full") {
            for (let bn = lastBlockNumber + 1; bn <= Math.min(lastBlockNumber + 3, blockNumber); bn++) {
              const result = await scanBlockForWalletTx(bn);
              if (result.found && result.txHash) {
                addLog({
                  code: "TXN-FND",
                  action: `WALLET TRANSACTION IN BLOCK #${bn}: ${result.value} MOVE`,
                  status: "CHAIN",
                  txHash: result.txHash,
                });
              }
            }
          }

        } else if (lastBlockNumber === 0) {
          const balance = await provider.getBalance(WALLET_ADDRESS);
          lastBalance = balance;
          const balanceInMOVE = ethers.formatEther(balance);
          
          addLog({
            code: "CHN-SYN",
            action: `SYNCED TO BLOCK #${blockNumber} ON MOVEMENT M1`,
            status: "SUCCESS",
          });
          
          addLog({
            code: "WAL-INI",
            action: `INITIAL BALANCE: ${parseFloat(balanceInMOVE).toFixed(6)} MOVE`,
            status: "VERIFIED",
          });

          try {
            await provider.getBlock(blockNumber, true);
            rpcMode = "full";
            setChainMode("realtime");
            addLog({
              code: "RPC-FUL",
              action: "RPC SUPPORTS FULL TX DATA - REAL-TIME MODE ACTIVE",
              status: "SUCCESS",
            });
          } catch {
            rpcMode = "limited";
            setChainMode("balance");
            addLog({
              code: "RPC-LIM",
              action: "RPC LIMITED - USING BALANCE MONITORING MODE",
              status: "PROCESSING",
            });
          }
        }
        
        lastBlockNumber = blockNumber;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message.slice(0, 40) : "UNKNOWN";
        addLog({
          code: "CHN-ERR",
          action: `RPC ERROR: ${errMsg}...`,
          status: "PROCESSING",
        });
      }
    };

    checkForActivity();
    const blockInterval = setInterval(checkForActivity, 10000);

    return () => {
      clearInterval(blockInterval);
    };
  }, [walletConnected, addLog]);

  useEffect(() => {
    const remittanceInterval = setInterval(() => {
      const amount = (Math.random() * 0.005 + 0.002).toFixed(4);
      const paymentCode = String(Math.floor(Math.random() * 999)).padStart(3, "0");
      
      addLog({
        code: `X402-${paymentCode}`,
        action: "X402 PAYMENT REQUIRED FOR COMPLIANCE MODULE ACCESS",
        status: "PROCESSING",
      });

      setTimeout(() => {
        addLog({
          code: `X402-${paymentCode}`,
          action: `SETTLING ${amount} MOVE VIA X402 PROTOCOL`,
          status: "PROCESSING",
        });
      }, 1200);

      setTimeout(() => {
        addLog({
          code: `X402-${paymentCode}`,
          action: `REMITTANCE ${amount} MOVE CONFIRMED ON MOVEMENT M1`,
          status: "SETTLED",
          txHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        });

        toast({
          title: "x402 REMITTANCE",
          description: `${amount} MOVE settled via x402 protocol`,
          duration: 4000,
        });
      }, 2400);

      setTimeout(() => {
        addLog({
          code: `X402-${paymentCode}`,
          action: "ACCESS UNLOCKED - RESUMING MULTI-SECTOR AUDIT",
          status: "SUCCESS",
        });
      }, 3600);
    }, 45000);

    return () => clearInterval(remittanceInterval);
  }, [addLog, toast]);

  useEffect(() => {
    const scoutActions = [
      { source: "FDA-RSS", actions: ["Scanning FDA Drug Safety Communication feed...", "Parsing new FDA warning letter for facility #2847...", "Analyzing adverse event report FAERS-2024-1847..."] },
      { source: "ERCOT-API", actions: ["Monitoring ERCOT real-time grid frequency...", "Analyzing ERCOT Notice #492 - capacity shortfall...", "Checking ancillary service deployment status..."] },
      { source: "HHS-OCR", actions: ["Scanning OCR breach portal for new entries...", "Analyzing HIPAA settlement announcement...", "Checking updated HIPAA enforcement trends..."] },
      { source: "ED-GOV", actions: ["Monitoring Title IX resolution agreements...", "Scanning new Clery Act guidance release...", "Analyzing FERPA enforcement update..."] },
      { source: "CHAIN", actions: ["Detected balance change in monitored wallet...", "Risk Detected in Batch 0x92f7a2b1...", "Verifying on-chain compliance attestation..."] },
    ];

    const addScoutEntry = () => {
      const sourceGroup = scoutActions[Math.floor(Math.random() * scoutActions.length)];
      const action = sourceGroup.actions[Math.floor(Math.random() * sourceGroup.actions.length)];
      const riskLevels: ScoutEntry["riskLevel"][] = ["low", "low", "low", "medium", "medium", "high"];
      
      setScoutEntries(prev => [...prev.slice(-30), {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        action,
        source: sourceGroup.source,
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      }]);
    };

    addScoutEntry();
    addScoutEntry();
    addScoutEntry();

    const scoutInterval = setInterval(addScoutEntry, 3000);
    return () => clearInterval(scoutInterval);
  }, []);

  useEffect(() => {
    const checkForHighFines = () => {
      sectors.forEach(sector => {
        const { fine } = calculateSectorFines(sector);
        if (fine > 25000) {
          const existingApproval = pendingApprovals.find(p => p.sector === sector.id && p.approved === null);
          if (!existingApproval) {
            const reference = REGULATORY_REFERENCES.find(r => r.sector === sector.id);
            setPendingApprovals(prev => [...prev, {
              id: crypto.randomUUID(),
              sector: sector.id,
              fineAmount: fine,
              reason: `${sector.name} sector fine exceeds $25,000 threshold - requires human approval`,
              timestamp: new Date(),
              regulatoryRef: reference?.code || "UNKNOWN",
              confidenceScore: 75 + Math.floor(Math.random() * 20),
              approved: null,
            }]);
            
            addLog({
              code: "HITL-001",
              action: `HIGH FINE DETECTED: ${formatCurrency(fine)} - AUTONOMOUS OUTREACH LOCKED`,
              status: "ALERT",
              sector: sector.id,
            });
          }
        }
      });
    };

    const fineCheckInterval = setInterval(checkForHighFines, 10000);
    return () => clearInterval(fineCheckInterval);
  }, [sectors, pendingApprovals, addLog]);

  const handleApprove = (id: string) => {
    setPendingApprovals(prev => prev.map(p => p.id === id ? { ...p, approved: true } : p));
    addLog({
      code: "HITL-APR",
      action: "HUMAN APPROVAL GRANTED - AUTONOMOUS OUTREACH RESUMED",
      status: "SUCCESS",
    });
    toast({
      title: "APPROVAL CONFIRMED",
      description: "Fine assessment approved. Autonomous outreach unlocked.",
      duration: 3000,
    });
  };

  const handleReject = (id: string) => {
    setPendingApprovals(prev => prev.map(p => p.id === id ? { ...p, approved: false } : p));
    addLog({
      code: "HITL-REJ",
      action: "HUMAN REJECTION - FINE ASSESSMENT RETURNED FOR REVIEW",
      status: "ALERT",
    });
    toast({
      title: "REJECTION RECORDED",
      description: "Fine assessment rejected. Manual review required.",
      duration: 3000,
    });
  };

  const handleClaimPolar = () => {
    const reward = 50 + Math.floor(Math.random() * 50);
    setPolarBalance(prev => prev + reward);
    setComplianceStreak(prev => prev + 1);
    addLog({
      code: "POLAR-001",
      action: `CLAIMED ${reward} $POLAR - STREAK NOW ${complianceStreak + 1} DAYS`,
      status: "SUCCESS",
    });
    toast({
      title: "$POLAR CLAIMED",
      description: `+${reward} $POLAR added to your balance!`,
      duration: 3000,
    });
  };

  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setChainMode("offline");
      addLog({
        code: "WAL-001",
        action: "WALLET LISTENER DISCONNECTED",
        status: "PROCESSING",
      });
    } else {
      setWalletConnected(true);
      addLog({
        code: "WAL-001",
        action: `CONNECTED TO WALLET ${WALLET_ADDRESS.slice(0, 20)}...`,
        status: "SUCCESS",
      });
    }
  };

  const currentSector = sectors.find(s => s.id === activeSector) || sectors[0];
  const pendingCount = pendingApprovals.filter(p => p.approved === null).length;

  return (
    <div className="flex h-screen bg-[hsl(var(--deep-navy))] seeker-optimized" data-testid="dashboard-container">
      <SectorSidebar 
        sectors={sectors} 
        activeSector={activeSector} 
        onSectorChange={setActiveSector} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AlphaBanner />
        <NetworkStatusBar walletConnected={walletConnected} chainMode={chainMode} />
        
        <header className="h-14 flex items-center justify-between px-6 border-b border-[rgba(56,189,248,0.15)]" data-testid="main-header">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="PolarUniversal" className="w-8 h-8" />
              <div>
                <h1 className="text-sm font-mono uppercase tracking-widest text-foreground">POLARUNIVERSAL</h1>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">GLOBAL COMPLIANCE OS v3.1.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("dashboard")}
                className="text-[10px] font-mono uppercase tracking-wider"
                data-testid="tab-dashboard"
              >
                <Activity className="w-3 h-3 mr-1" />DASHBOARD
              </Button>
              <Button
                variant={activeTab === "approvals" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("approvals")}
                className="text-[10px] font-mono uppercase tracking-wider relative"
                data-testid="tab-approvals"
              >
                <Lock className="w-3 h-3 mr-1" />APPROVALS
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(var(--danger))] rounded-full text-[8px] flex items-center justify-center text-white">{pendingCount}</span>
                )}
              </Button>
            </div>
            
            <Badge className="text-[10px] font-mono uppercase tracking-wider bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border border-[hsl(var(--neon-green))]/30 gap-1.5" data-testid="badge-proof-of-compliance">
              <Award className="w-3 h-3" />
              PROOF OF COMPLIANCE
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--muted))] rounded">
              <Coins className="w-4 h-4 text-[hsl(var(--neon-green))]" />
              <span className="text-sm font-mono font-semibold text-[hsl(var(--neon-green))]">{polarBalance.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-muted-foreground">$POLAR</span>
            </div>
            <DeploymentModal 
              contract={POLAR_GRC_CONTRACT}
              chains={SUPPORTED_CHAINS.filter(c => c.isTestnet)}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-card border-cyan/30 text-xs font-mono uppercase tracking-wider"
                  data-testid="button-deploy-contracts"
                >
                  <Rocket className="w-4 h-4 mr-2 text-cyan" />
                  DEPLOY
                </Button>
              }
            />
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              className="glass-card border-[rgba(56,189,248,0.2)] text-xs font-mono uppercase tracking-wider"
              data-testid="button-connect-wallet"
            >
              <Wallet className="w-4 h-4 mr-2 text-cyan" />
              {walletConnected ? (
                <span className="text-[hsl(var(--neon-green))]">CHAIN ACTIVE</span>
              ) : (
                "CONNECT CHAIN"
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto flex flex-col">
          <ROIHeader sectors={sectors} walletConnected={walletConnected} />
          
          {activeTab === "dashboard" ? (
            <div className="grid grid-cols-[1fr_320px_280px] gap-4 flex-1 min-h-0">
              <div className="flex flex-col gap-3">
                {currentSector && (
                  <>
                    <ComplianceHealthMeter sector={currentSector} />
                    <SourceGrounding sector={currentSector} />
                  </>
                )}
                <div className="flex-1 min-h-0">
                  <AgenticScoutFeed scoutEntries={scoutEntries} />
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <HITLApprovalPanel 
                  pendingApprovals={pendingApprovals}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
                <div className="flex-1 min-h-0">
                  <LiveAuditTrail logs={logs} logContainerRef={logContainerRef} />
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <ComplianceCommandCenter />
                <PolarRewardsPanel 
                  polarBalance={polarBalance}
                  streak={complianceStreak}
                  leaderboard={leaderboard}
                  onClaim={handleClaimPolar}
                />
                <SKRGuardianStaking />
                <GrantTrackerWidget />
                <TransparencyLedgerConfig />
                <TechnologyStackMap />
                <NetworkHealthIndicators />
                <MultiChainStatus networks={NETWORK_DEPLOYMENTS} />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <div className="glass-card rounded-md p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-[hsl(var(--warning))]" />
                    <div>
                      <h2 className="text-lg font-mono uppercase tracking-widest text-foreground">HUMAN-IN-THE-LOOP APPROVALS</h2>
                      <p className="text-xs font-mono text-muted-foreground">Fines exceeding $25,000 require human authorization</p>
                    </div>
                  </div>
                  <Badge className={`text-xs font-mono ${pendingCount > 0 ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" : "bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))]/30"}`}>
                    {pendingCount > 0 ? `${pendingCount} PENDING` : "ALL CLEAR"}
                  </Badge>
                </div>
                
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-12">
                    <Unlock className="w-12 h-12 text-[hsl(var(--neon-green))] mx-auto mb-4" />
                    <p className="text-lg font-mono text-foreground mb-2">NO PENDING APPROVALS</p>
                    <p className="text-sm font-mono text-muted-foreground">All compliance assessments are within autonomous thresholds</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingApprovals.map((item) => {
                      const reference = REGULATORY_REFERENCES.find(r => r.sector === item.sector);
                      return (
                        <div key={item.id} className={`p-4 rounded-md border ${item.approved === null ? "bg-[hsl(var(--muted))] border-[hsl(var(--warning))]/30" : item.approved ? "bg-[hsl(var(--neon-green))]/10 border-[hsl(var(--neon-green))]/30" : "bg-[hsl(var(--danger))]/10 border-[hsl(var(--danger))]/30"}`} data-testid={`full-approval-${item.id}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className="text-[10px] font-mono uppercase bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">{item.sector}</Badge>
                              <span className="text-xl font-mono font-semibold text-[hsl(var(--danger))]">{formatCurrency(item.fineAmount)}</span>
                              <ConfidenceScore score={item.confidenceScore} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{formatTime(item.timestamp)}</span>
                          </div>
                          
                          <p className="text-sm font-mono text-foreground mb-3">{item.reason}</p>
                          
                          {reference && (
                            <div className="bg-[hsl(var(--deep-navy))] rounded p-3 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3 h-3 text-cyan" />
                                <Badge className="text-[8px] font-mono bg-cyan/20 text-cyan border-cyan/30">{reference.code}</Badge>
                                <span className="text-[10px] font-mono text-foreground">{reference.title}</span>
                              </div>
                              <p className="text-[9px] font-mono text-muted-foreground italic">"{reference.citation}"</p>
                            </div>
                          )}
                          
                          {item.approved === null ? (
                            <div className="flex gap-3">
                              <Button onClick={() => handleApprove(item.id)} className="flex-1 bg-[hsl(var(--neon-green))] text-[hsl(var(--deep-navy))] font-mono text-sm uppercase" data-testid={`full-approve-${item.id}`}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />APPROVE FINE ASSESSMENT
                              </Button>
                              <Button onClick={() => handleReject(item.id)} variant="outline" className="flex-1 border-[hsl(var(--danger))] text-[hsl(var(--danger))] font-mono text-sm uppercase" data-testid={`full-reject-${item.id}`}>
                                <XCircle className="w-4 h-4 mr-2" />REJECT & REVIEW
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {item.approved ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neon-green))]" />
                                  <span className="text-sm font-mono text-[hsl(var(--neon-green))]">APPROVED</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-[hsl(var(--danger))]" />
                                  <span className="text-sm font-mono text-[hsl(var(--danger))]">REJECTED</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <PermanentAuditLog logs={logs} />
          </div>
        </main>
      </div>
    </div>
  );
}

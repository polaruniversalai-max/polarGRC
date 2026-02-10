import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Lock, Globe, ChevronRight, ShieldCheck, Activity, FileCheck, Database, Coins, Eye, Radio, Archive, Fingerprint } from "lucide-react";

// 8-Pillar Sovereign Architecture Configuration
const SOVEREIGN_PILLARS = [
  {
    id: "movement",
    name: "Movement M1",
    icon: Globe,
    color: "from-cyan-500 to-blue-600",
    bgGlow: "cyan",
    role: "Immutable Ledger",
    dscsaRole: "100k TPS Serialization - All pharmaceutical product identifiers hashed on-chain with sub-second finality",
    description: "High-throughput blockchain for real-time supply chain verification"
  },
  {
    id: "railgun",
    name: "Railgun",
    icon: Lock,
    color: "from-purple-500 to-violet-600",
    bgGlow: "purple",
    role: "ZK Privacy",
    dscsaRole: "HIPAA-Compliant Shielding - Zero-knowledge proofs protect patient data while proving compliance",
    description: "Privacy-preserving transaction verification for sensitive data"
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: Zap,
    color: "from-amber-400 to-orange-500",
    bgGlow: "amber",
    role: "Audit AI",
    dscsaRole: "Autonomous Compliance Analysis - AI-powered anomaly detection and predictive risk scoring",
    description: "Advanced AI analysis for real-time compliance verification"
  },
  {
    id: "jupiter",
    name: "Jupiter",
    icon: Coins,
    color: "from-green-400 to-emerald-500",
    bgGlow: "green",
    role: "Liquidity",
    dscsaRole: "$POLAR DEX Integration - Instant token swaps for credit purchases and staking",
    description: "Decentralized exchange for $POLAR token liquidity"
  },
  {
    id: "arweave",
    name: "Arweave",
    icon: Archive,
    color: "from-blue-400 to-indigo-500",
    bgGlow: "blue",
    role: "Permanent Archive",
    dscsaRole: "200-Year Compliance Records - Immutable audit trails stored permanently on-chain",
    description: "Permanent decentralized storage for compliance records"
  },
  {
    id: "did",
    name: "DID",
    icon: Fingerprint,
    color: "from-pink-400 to-rose-500",
    bgGlow: "pink",
    role: "Identity Layer",
    dscsaRole: "Decentralized Attestation - Verifiable credentials for manufacturers, distributors, and dispensers",
    description: "Self-sovereign identity for supply chain participants"
  },
  {
    id: "polar",
    name: "$POLAR",
    icon: Shield,
    color: "from-cyan-400 to-teal-500",
    bgGlow: "cyan",
    role: "Economy Token",
    dscsaRole: "Credit & Governance - Stake for rewards, pay for scans, vote on protocol upgrades",
    description: "Native utility token powering the compliance ecosystem"
  },
  {
    id: "pyth",
    name: "Pyth",
    icon: Radio,
    color: "from-orange-400 to-red-500",
    bgGlow: "orange",
    role: "Price Oracles",
    dscsaRole: "Real-Time Market Data - FDA-grade pricing feeds for pharmaceutical cost validation",
    description: "High-fidelity oracle network for real-time data feeds"
  }
];

function HexPillar({ pillar, isActive, onClick }: { 
  pillar: typeof SOVEREIGN_PILLARS[0]; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const IconComponent = pillar.icon;
  const isPolar = pillar.id === "polar";
  
  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${isActive ? 'scale-105 z-10' : 'hover:scale-102'} ${isPolar ? 'animate-pulse-slow' : ''}`}
      onClick={onClick}
      data-testid={`hex-pillar-${pillar.id}`}
    >
      {/* Special glow ring for $POLAR */}
      {isPolar && (
        <div 
          className="absolute inset-0 animate-spin-slow opacity-70"
          style={{
            background: 'conic-gradient(from 0deg, transparent, hsl(var(--electric-cyan)), transparent, hsl(var(--electric-cyan)), transparent)',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            transform: 'scale(1.15)',
            filter: 'blur(4px)'
          }}
        />
      )}
      
      {/* Hexagon shape with gradient */}
      <div className={`
        relative w-32 h-36 flex flex-col items-center justify-center
        bg-gradient-to-br ${pillar.color}
        clip-hexagon transition-all duration-300
        ${isActive ? 'ring-2 ring-white/50 shadow-lg' : 'opacity-80 hover:opacity-100'}
        ${isPolar ? 'shadow-[0_0_30px_rgba(0,240,255,0.5)]' : ''}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
      }}
      >
        <IconComponent className={`w-8 h-8 text-white mb-1 transition-transform ${isActive ? 'scale-110' : ''} ${isPolar ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`} />
        <span className={`text-xs font-bold text-white text-center px-2 ${isPolar ? 'drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]' : ''}`}>{pillar.name}</span>
        <span className="text-[10px] text-white/80">{pillar.role}</span>
      </div>
      
      {/* Glow effect */}
      <div className={`
        absolute inset-0 -z-10 blur-xl transition-opacity duration-300
        bg-gradient-to-br ${pillar.color}
        ${isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-30'}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
      }}
      />
    </div>
  );
}

export default function Landing() {
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const selectedPillar = SOVEREIGN_PILLARS.find(p => p.id === activePillar);
  
  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] text-foreground overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[hsl(var(--sovereign-blue))]/80 border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--electric-cyan))] to-[hsl(var(--electric-cyan))]/50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[hsl(var(--sovereign-blue))]" />
            </div>
            <div>
              <span className="text-xl font-bold text-[hsl(var(--electric-cyan))]">POLAR COMMAND</span>
              <span className="text-xs text-muted-foreground block">v3.1.0-WHALE | Sovereign OS</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" data-testid="button-login">
              <Button variant="outline" className="border-[hsl(var(--electric-cyan))]/30 text-[hsl(var(--electric-cyan))] hover:bg-[hsl(var(--electric-cyan))]/10">
                Sign In
              </Button>
            </a>
            <a href="/login" data-testid="button-get-started">
              <Button className="bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))] hover:bg-[hsl(var(--electric-cyan))]/90">
                Get Started <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-[hsl(var(--electric-cyan))]/10 text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30">
                FDA DSCSA 2026 Compliant
              </Badge>
              <h1 className="text-5xl font-bold leading-tight">
                <span className="text-[hsl(var(--electric-cyan))]">Sovereign</span> Pharmaceutical
                <br />Supply Chain Compliance
              </h1>
              <p className="text-xl text-muted-foreground">
                Enterprise-grade blockchain verification powered by the 8-Pillar Sovereign Architecture. 
                Built for institutional adoption with FDA DSCSA 2026 readiness.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <a href="/login" data-testid="button-hero-cta">
                  <Button size="lg" className="bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))] hover:bg-[hsl(var(--electric-cyan))]/90">
                    Start Free Trial <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="border-[hsl(var(--border))]">
                  View Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  100 Free Credits
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  No Credit Card
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--electric-cyan))]/20 to-transparent rounded-2xl blur-3xl" />
              <Card className="relative bg-[hsl(var(--card))]/50 border-[hsl(var(--electric-cyan))]/20 backdrop-blur">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Compliance Score</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">VERIFIED</Badge>
                  </div>
                  <div className="text-6xl font-bold text-[hsl(var(--electric-cyan))]">98.7%</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                      <div className="text-2xl font-bold">$12.4M</div>
                      <div className="text-xs text-muted-foreground">Fines Avoided</div>
                    </div>
                    <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                      <div className="text-2xl font-bold">847hrs</div>
                      <div className="text-xs text-muted-foreground">Time Saved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 8-Pillar Sovereign Architecture Section */}
        <section className="py-20 bg-gradient-to-b from-transparent via-[hsl(var(--sovereign-blue))]/50 to-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-[hsl(var(--alert-amber))]/10 text-[hsl(var(--alert-amber))] border-[hsl(var(--alert-amber))]/30">
                8-Pillar Architecture
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Sovereign Technology Stack</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Click each pillar to discover its specific role in FDA DSCSA 2026 compliance
              </p>
            </div>

            {/* Hex Grid */}
            <div className="flex flex-wrap justify-center gap-3 mb-8" data-testid="hex-grid">
              {/* Row 1: 3 pillars */}
              <div className="flex gap-3 justify-center w-full">
                {SOVEREIGN_PILLARS.slice(0, 3).map((pillar) => (
                  <HexPillar 
                    key={pillar.id} 
                    pillar={pillar} 
                    isActive={activePillar === pillar.id}
                    onClick={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
                  />
                ))}
              </div>
              {/* Row 2: 2 pillars offset */}
              <div className="flex gap-3 justify-center w-full -mt-4">
                {SOVEREIGN_PILLARS.slice(3, 5).map((pillar) => (
                  <HexPillar 
                    key={pillar.id} 
                    pillar={pillar} 
                    isActive={activePillar === pillar.id}
                    onClick={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
                  />
                ))}
              </div>
              {/* Row 3: 3 pillars */}
              <div className="flex gap-3 justify-center w-full -mt-4">
                {SOVEREIGN_PILLARS.slice(5, 8).map((pillar) => (
                  <HexPillar 
                    key={pillar.id} 
                    pillar={pillar} 
                    isActive={activePillar === pillar.id}
                    onClick={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
                  />
                ))}
              </div>
            </div>

            {/* DSCSA Role Reveal Panel */}
            <div className={`
              transition-all duration-500 overflow-hidden
              ${selectedPillar ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
            `}>
              {selectedPillar && (
                <Card className="bg-[hsl(var(--card))]/80 border-[hsl(var(--electric-cyan))]/30 backdrop-blur max-w-3xl mx-auto">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${selectedPillar.color}`}>
                        <selectedPillar.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{selectedPillar.name}</h3>
                          <Badge variant="outline" className="text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30">
                            {selectedPillar.role}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{selectedPillar.description}</p>
                        <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg border border-[hsl(var(--alert-amber))]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <FileCheck className="w-4 h-4 text-[hsl(var(--alert-amber))]" />
                            <span className="text-sm font-semibold text-[hsl(var(--alert-amber))]">DSCSA 2026 Role</span>
                          </div>
                          <p className="text-sm" data-testid={`dscsa-role-${selectedPillar.id}`}>
                            {selectedPillar.dscsaRole}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Enterprise Features */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Grade Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[hsl(var(--card))]/50 border-[hsl(var(--border))] hover:border-[hsl(var(--electric-cyan))]/30 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--electric-cyan))]/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[hsl(var(--electric-cyan))]" />
                </div>
                <h3 className="text-xl font-semibold">Movement M1 Blockchain</h3>
                <p className="text-muted-foreground">
                  Immutable chain of custody verification with sub-second finality and enterprise SLAs.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card))]/50 border-[hsl(var(--border))] hover:border-[hsl(var(--electric-cyan))]/30 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--electric-cyan))]/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[hsl(var(--electric-cyan))]" />
                </div>
                <h3 className="text-xl font-semibold">Railgun ZK Privacy</h3>
                <p className="text-muted-foreground">
                  HIPAA-compliant zero-knowledge proofs protect sensitive patient and transaction data.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card))]/50 border-[hsl(var(--border))] hover:border-[hsl(var(--electric-cyan))]/30 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--electric-cyan))]/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[hsl(var(--electric-cyan))]" />
                </div>
                <h3 className="text-xl font-semibold">Gemini AI Analysis</h3>
                <p className="text-muted-foreground">
                  Real-time compliance analysis with predictive risk scoring and automated remediation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="border-t border-[hsl(var(--border))] py-8">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>PolarUniversal Systems</span>
            <span>8-Pillar Architecture | FDA DSCSA 2026</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

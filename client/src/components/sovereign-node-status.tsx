import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Shield, Zap, Globe, Lock, CheckCircle2 } from "lucide-react";

interface NodeStatus {
  name: string;
  region: string;
  status: "ACTIVE" | "STANDBY" | "OFFLINE";
  latency: number;
  dataResidency: "INDIA" | "UAE" | "EU" | "US";
  compliance: string[];
}

export function SovereignNodeStatus() {
  const [activeNode, setActiveNode] = useState<NodeStatus>({
    name: "IN-MUM-SOV-01",
    region: "ap-south-1 (Mumbai)",
    status: "ACTIVE",
    latency: 12,
    dataResidency: "INDIA",
    compliance: ["DPDP Act 2023", "CERT-IN", "MeitY Guidelines"],
  });

  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
      setActiveNode((node) => ({
        ...node,
        latency: Math.floor(8 + Math.random() * 15),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500";
      case "STANDBY":
        return "bg-yellow-500";
      case "OFFLINE":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-blue-950/10">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Server className="h-5 w-5 text-cyan-400" />
              <span
                className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ${getStatusColor(
                  activeNode.status
                )} ${pulse ? "animate-ping" : ""}`}
              />
            </div>
            <span className="font-semibold text-sm">Sovereign Node Status</span>
          </div>
          <Badge
            variant="outline"
            className="text-emerald-400 border-emerald-500/50 gap-1"
            data-testid="node-status-badge"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(activeNode.status)}`} />
            {activeNode.status}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span>Node</span>
            </div>
            <span className="font-mono text-xs text-cyan-300" data-testid="node-name">
              {activeNode.name}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Data Residency</span>
            </div>
            <Badge className="bg-orange-600/80 text-xs" data-testid="data-residency">
              {activeNode.dataResidency}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              <span>Latency</span>
            </div>
            <span
              className={`font-mono text-xs ${
                activeNode.latency < 20 ? "text-emerald-400" : "text-yellow-400"
              }`}
              data-testid="node-latency"
            >
              {activeNode.latency}ms
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>Region</span>
            </div>
            <span className="font-mono text-xs">{activeNode.region}</span>
          </div>

          <div className="p-2 rounded bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Compliance Frameworks</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeNode.compliance.map((framework) => (
                <Badge
                  key={framework}
                  variant="secondary"
                  className="text-[10px] bg-slate-800 hover:bg-slate-700"
                >
                  {framework}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Processing on Indian Sovereign Infrastructure</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Encrypted
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SovereignNodeStatus;

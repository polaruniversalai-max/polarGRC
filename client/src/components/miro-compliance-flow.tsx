import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Violation {
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

interface MiroComplianceFlowProps {
  auditStatus: string;
  violations?: Violation[];
}

interface FlowNode {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error" | "warning";
  rule?: string;
}

interface MiroStatus {
  available: boolean;
  mode: "LIVE" | "DEMO";
  reason?: string;
  timestamp: string;
}

export function MiroComplianceFlow({ auditStatus, violations = [] }: MiroComplianceFlowProps) {
  // Fetch Miro SDK integration status from backend
  const { data: miroStatus } = useQuery<MiroStatus>({
    queryKey: ["/api/v1/miro/status"],
    refetchInterval: 30000,
  });

  const [nodes, setNodes] = useState<FlowNode[]>([
    { id: "intake", label: "Document Intake", status: "pending", rule: "NDCT 2026 Ch.1" },
    { id: "pii", label: "PII Masking", status: "pending", rule: "DPDP Act §4" },
    { id: "classify", label: "Risk Classification", status: "pending", rule: "CDSCO Sch.Y" },
    { id: "audit", label: "Regulatory Audit", status: "pending", rule: "FDA 21 CFR 11" },
    { id: "decision", label: "Compliance Decision", status: "pending", rule: "NDCT Rule 21" },
  ]);

  useEffect(() => {
    const hasViolations = violations.length > 0;
    const hasCritical = violations.some((v) => v.severity === "CRITICAL");

    switch (auditStatus) {
      case "STANDBY":
        setNodes((prev) => prev.map((n) => ({ ...n, status: "pending" })));
        break;
      case "PROCESSING":
        setNodes((prev) =>
          prev.map((n, i) => ({
            ...n,
            status: i === 0 ? "active" : i < 2 ? "complete" : "pending",
          }))
        );
        break;
      case "RISK_ASSESSMENT":
        setNodes((prev) =>
          prev.map((n, i) => ({
            ...n,
            status: i < 3 ? "complete" : i === 3 ? "active" : "pending",
          }))
        );
        break;
      case "COMPLETE":
        setNodes((prev) =>
          prev.map((n, i) => ({
            ...n,
            status:
              i === prev.length - 1
                ? hasCritical
                  ? "error"
                  : hasViolations
                  ? "warning"
                  : "complete"
                : "complete",
          }))
        );
        break;
      case "ERROR":
        setNodes((prev) =>
          prev.map((n, i) => ({
            ...n,
            status: i < 2 ? "complete" : i === 2 ? "error" : "pending",
          }))
        );
        break;
    }
  }, [auditStatus, violations]);

  const getNodeIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "active":
        return <Clock className="h-4 w-4 text-blue-400 animate-pulse" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getNodeBg = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-emerald-500/10 border-emerald-500/30";
      case "active":
        return "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      case "warning":
        return "bg-amber-500/10 border-amber-500/30";
      default:
        return "bg-muted/30 border-muted-foreground/20";
    }
  };

  const getConnectorColor = (fromStatus: string, toStatus: string) => {
    if (fromStatus === "complete" && toStatus !== "pending") return "bg-emerald-500";
    if (fromStatus === "active") return "bg-blue-500 animate-pulse";
    return "bg-muted-foreground/30";
  };

  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-purple-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-violet-400" />
            <span>Compliance Flowchart</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={miroStatus?.mode === "LIVE" 
                ? "text-emerald-400 border-emerald-500/50" 
                : "text-amber-400 border-amber-500/50"
              }
              data-testid="miro-sdk-badge"
            >
              {miroStatus?.mode === "LIVE" ? "Miro SDK: LIVE" : "Miro SDK: DEMO"}
            </Badge>
            {miroStatus?.mode === "LIVE" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                data-testid="miro-board-link"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {miroStatus?.mode === "LIVE" 
            ? "Connected to Miro SDK - boards sync automatically"
            : "Real-time visualization of NDCT compliance reasoning flow"
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {nodes.map((node, index) => (
            <div key={node.id}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${getNodeBg(node.status)}`}
                data-testid={`flow-node-${node.id}`}
              >
                {getNodeIcon(node.status)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{node.label}</div>
                  {node.rule && (
                    <div className="text-xs text-muted-foreground font-mono">{node.rule}</div>
                  )}
                </div>
                {node.status === "active" && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    Processing
                  </Badge>
                )}
              </div>

              {index < nodes.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <div
                    className={`w-0.5 h-4 rounded ${getConnectorColor(
                      node.status,
                      nodes[index + 1].status
                    )}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {violations.length > 0 && auditStatus === "COMPLETE" && (
          <div className="mt-4 pt-4 border-t border-muted-foreground/20">
            <div className="text-xs text-muted-foreground mb-2">Findings:</div>
            <div className="space-y-1">
              {violations.slice(0, 3).map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      v.severity === "CRITICAL"
                        ? "bg-red-500"
                        : v.severity === "HIGH"
                        ? "bg-orange-500"
                        : v.severity === "MEDIUM"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <span className="text-muted-foreground truncate">{v.description}</span>
                </div>
              ))}
              {violations.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{violations.length - 3} more findings
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MiroComplianceFlow;

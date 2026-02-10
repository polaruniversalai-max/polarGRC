import { useState, useReducer, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity,
  Brain,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Terminal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShaktiTracker } from "./shakti-tracker";
import { SovereignNodeStatus } from "./sovereign-node-status";
import { MiroComplianceFlow } from "./miro-compliance-flow";

type AuditLifecycle = "STANDBY" | "PROCESSING" | "RISK_ASSESSMENT" | "COMPLETE" | "ERROR";

interface AuditState {
  lifecycle: AuditLifecycle;
  serialId: string;
  scenario: string;
  jurisdiction: "US" | "INDIA" | "UAE" | "EU";
  result: any | null;
  reasoningLog: string[];
  error: string | null;
}

type AuditAction =
  | { type: "SET_INPUT"; payload: Partial<AuditState> }
  | { type: "START_AUDIT" }
  | { type: "UPDATE_LIFECYCLE"; payload: AuditLifecycle }
  | { type: "ADD_REASONING"; payload: string }
  | { type: "COMPLETE"; payload: any }
  | { type: "ERROR"; payload: string }
  | { type: "RESET" };

const initialState: AuditState = {
  lifecycle: "STANDBY",
  serialId: "",
  scenario: "",
  jurisdiction: "US",
  result: null,
  reasoningLog: [],
  error: null,
};

function auditReducer(state: AuditState, action: AuditAction): AuditState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, ...action.payload };
    case "START_AUDIT":
      return { ...state, lifecycle: "PROCESSING", reasoningLog: [], result: null, error: null };
    case "UPDATE_LIFECYCLE":
      return { ...state, lifecycle: action.payload };
    case "ADD_REASONING":
      return { ...state, reasoningLog: [...state.reasoningLog, action.payload] };
    case "COMPLETE":
      return { ...state, lifecycle: "COMPLETE", result: action.payload };
    case "ERROR":
      return { ...state, lifecycle: "ERROR", error: action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

function RiskScoreGauge({ score, status }: { score: number; status: string }) {
  const percentage = Math.round(score * 100);
  
  const getStatusColor = () => {
    if (status === "VERIFIED") return "text-green-500";
    if (status === "QUARANTINE") return "text-red-500";
    if (status === "AUDIT_REQUIRED") return "text-amber-500";
    return "text-blue-500";
  };
  
  const getProgressColor = () => {
    if (status === "VERIFIED") return "bg-green-500";
    if (status === "QUARANTINE") return "bg-red-500";
    if (status === "AUDIT_REQUIRED") return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6" data-testid="risk-score-gauge">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            className="stroke-muted"
            strokeWidth="8"
            fill="none"
            r="40"
            cx="50"
            cy="50"
          />
          <circle
            className={`${getProgressColor().replace("bg-", "stroke-")} transition-all duration-1000`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            r="40"
            cx="50"
            cy="50"
            strokeDasharray={`${percentage * 2.51} 251`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-bold ${getStatusColor()}`}>{percentage}%</span>
          <span className="text-xs text-muted-foreground">Confidence</span>
        </div>
      </div>
      <Badge 
        variant={status === "VERIFIED" ? "default" : status === "QUARANTINE" ? "destructive" : "secondary"}
        className="text-sm px-4 py-1"
        data-testid="status-badge"
      >
        {status}
      </Badge>
    </div>
  );
}

function ReasoningLog({ logs }: { logs: string[] }) {
  return (
    <Card className="h-full" data-testid="reasoning-log">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Agent Reasoning Log
        </CardTitle>
        <CardDescription className="text-xs">Step-by-step compliance analysis</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4 pb-4">
          <div className="space-y-2 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground italic">Waiting for analysis...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-2 text-muted-foreground">
                  <span className="text-primary/60 shrink-0">[{index + 1}]</span>
                  <span className="break-all">{log}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function LifecycleIndicator({ lifecycle }: { lifecycle: AuditLifecycle }) {
  const stages: { key: AuditLifecycle; label: string; icon: any }[] = [
    { key: "STANDBY", label: "Standby", icon: Clock },
    { key: "PROCESSING", label: "Processing", icon: Loader2 },
    { key: "RISK_ASSESSMENT", label: "Risk Assessment", icon: Brain },
    { key: "COMPLETE", label: "Complete", icon: CheckCircle2 },
  ];

  const currentIndex = stages.findIndex(s => s.key === lifecycle);

  return (
    <div className="flex items-center justify-between gap-2 p-4" data-testid="lifecycle-indicator">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isActive = stage.key === lifecycle;
        const isPast = index < currentIndex;
        const isError = lifecycle === "ERROR";

        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${isActive && !isError ? "bg-primary text-primary-foreground" : ""}
              ${isPast ? "bg-muted text-muted-foreground" : ""}
              ${isError && isActive ? "bg-destructive text-destructive-foreground" : ""}
              ${!isActive && !isPast ? "bg-muted/50 text-muted-foreground/50" : ""}
            `}>
              <Icon className={`w-3 h-3 ${isActive && stage.key === "PROCESSING" ? "animate-spin" : ""}`} />
              {stage.label}
            </div>
            {index < stages.length - 1 && (
              <div className={`w-8 h-0.5 ${isPast ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ViolationsList({ violations }: { violations: any[] }) {
  if (!violations || violations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 p-4">
        <CheckCircle2 className="w-5 h-5" />
        <span>No violations detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4" data-testid="violations-list">
      {violations.map((violation, index) => (
        <div 
          key={index} 
          className={`p-3 rounded-lg border ${
            violation.severity === "CRITICAL" ? "border-red-500 bg-red-500/10" :
            violation.severity === "HIGH" ? "border-orange-500 bg-orange-500/10" :
            violation.severity === "MEDIUM" ? "border-amber-500 bg-amber-500/10" :
            "border-blue-500 bg-blue-500/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${
              violation.severity === "CRITICAL" ? "text-red-500" :
              violation.severity === "HIGH" ? "text-orange-500" :
              violation.severity === "MEDIUM" ? "text-amber-500" :
              "text-blue-500"
            }`} />
            <Badge variant="outline" className="text-xs">{violation.severity}</Badge>
            <Badge variant="secondary" className="text-xs">{violation.type}</Badge>
          </div>
          <p className="text-sm">{violation.description}</p>
          {violation.recommendation && (
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Recommendation:</strong> {violation.recommendation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function SovereignDashboard() {
  const [state, dispatch] = useReducer(auditReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const runAudit = useCallback(async () => {
    if (!state.scenario.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a compliance scenario to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    dispatch({ type: "START_AUDIT" });
    dispatch({ type: "ADD_REASONING", payload: `[${new Date().toISOString()}] Audit initiated` });

    try {
      dispatch({ type: "ADD_REASONING", payload: "[CONNECT] Connecting to Sentinel Brain AI..." });
      dispatch({ type: "UPDATE_LIFECYCLE", payload: "PROCESSING" });

      const serialId = state.serialId || `audit_${Date.now()}`;
      
      dispatch({ type: "ADD_REASONING", payload: `[INPUT] Serial ID: ${serialId}` });
      dispatch({ type: "ADD_REASONING", payload: `[INPUT] Jurisdiction: ${state.jurisdiction}` });
      
      const response = await apiRequest("POST", "/api/v1/sentinel/audit", {
        serialId,
        scenario: state.scenario,
        jurisdiction: state.jurisdiction,
        includeBlockchainVerification: true,
      });

      dispatch({ type: "UPDATE_LIFECYCLE", payload: "RISK_ASSESSMENT" });
      dispatch({ type: "ADD_REASONING", payload: "[ANALYZE] Running AI compliance analysis..." });

      const result = await response.json();

      if (result.compliance?.reasoningLog) {
        result.compliance.reasoningLog.forEach((log: string) => {
          dispatch({ type: "ADD_REASONING", payload: log });
        });
      }

      dispatch({ type: "ADD_REASONING", payload: `[RESULT] Status: ${result.compliance?.status}` });
      dispatch({ type: "ADD_REASONING", payload: `[RESULT] Confidence: ${Math.round((result.compliance?.confidence || 0) * 100)}%` });
      dispatch({ type: "COMPLETE", payload: result });

      toast({
        title: "Audit Complete",
        description: `Compliance status: ${result.compliance?.status}`,
      });
    } catch (error: any) {
      dispatch({ type: "ADD_REASONING", payload: `[ERROR] ${error.message}` });
      dispatch({ type: "ERROR", payload: error.message });
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [state.scenario, state.serialId, state.jurisdiction, toast]);

  return (
    <div className="space-y-6 p-6" data-testid="sovereign-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Sentinel OS Compliance Auditor
          </h1>
          <p className="text-sm text-muted-foreground">
            Enterprise-grade GRC powered by AI with full reasoning transparency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3" />
            Triple-Zero Standard
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <LifecycleIndicator lifecycle={state.lifecycle} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Compliance Scenario Input
              </CardTitle>
              <CardDescription>
                Enter regulatory text, audit logs, or compliance scenarios to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Serial ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="e.g., BATCH-2026-001"
                    value={state.serialId}
                    onChange={(e) => dispatch({ type: "SET_INPUT", payload: { serialId: e.target.value } })}
                    data-testid="input-serial-id"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Jurisdiction</label>
                  <select
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                    value={state.jurisdiction}
                    onChange={(e) => dispatch({ type: "SET_INPUT", payload: { jurisdiction: e.target.value as any } })}
                    data-testid="select-jurisdiction"
                  >
                    <option value="US">United States</option>
                    <option value="INDIA">India</option>
                    <option value="UAE">UAE/Dubai</option>
                    <option value="EU">European Union</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Scenario / Regulatory Text</label>
                <Textarea
                  placeholder="Enter compliance scenario, regulatory text, or audit logs to analyze...&#10;&#10;Example: A pharmaceutical shipment from Irving, TX showed temperature readings of 12°C for 2 hours during transit. The batch contains insulin requiring 2-8°C storage. Evaluate DSCSA 2026 compliance and recommend actions."
                  className="min-h-[150px] font-mono text-sm"
                  value={state.scenario}
                  onChange={(e) => dispatch({ type: "SET_INPUT", payload: { scenario: e.target.value } })}
                  data-testid="textarea-scenario"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={runAudit} 
                  disabled={isSubmitting}
                  className="gap-2"
                  data-testid="button-run-audit"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Analyzing..." : "Run Compliance Audit"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => dispatch({ type: "RESET" })}
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {state.result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Compliance Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ViolationsList violations={state.result.compliance?.violations || []} />
                
                {state.result.compliance?.recommendations?.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-4">
                      <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {state.result.compliance.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {state.result.compliance?.sources?.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-4">
                      <h4 className="text-sm font-medium mb-2">Regulatory Sources</h4>
                      <div className="flex flex-wrap gap-2">
                        {state.result.compliance.sources.map((source: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{source}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {state.result ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RiskScoreGauge 
                  score={state.result.compliance?.confidence || 0} 
                  status={state.result.compliance?.status || "PENDING"} 
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Brain className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Run an audit to see the risk assessment
                </p>
              </CardContent>
            </Card>
          )}

          <ReasoningLog logs={state.reasoningLog} />

          <SovereignNodeStatus />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ShaktiTracker />
        <MiroComplianceFlow 
          auditStatus={state.lifecycle}
          violations={state.result?.compliance?.violations || []}
        />
      </div>

      {state.error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{state.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SovereignDashboard;

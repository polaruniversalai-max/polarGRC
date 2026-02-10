import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle2, XCircle, Timer, Flag, Zap, ExternalLink } from "lucide-react";

interface ShaktiDeadline {
  applicationDate: Date;
  trialType: "HIGH_RISK" | "STANDARD" | "EXPEDITED" | "PRIOR_INTIMATION";
  drugName: string;
  applicationId: string;
}

interface ShaktiTrackerProps {
  deadlines?: ShaktiDeadline[];
}

export function ShaktiTracker({ deadlines }: ShaktiTrackerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const defaultDeadlines: ShaktiDeadline[] = deadlines || [
    {
      applicationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      trialType: "HIGH_RISK",
      drugName: "Cytoxan-PG Injectable",
      applicationId: "CDSCO-2026-CTX-001",
    },
    {
      applicationDate: new Date(),
      trialType: "PRIOR_INTIMATION",
      drugName: "Paracetamol-500 Generic",
      applicationId: "CDSCO-2026-PCM-042",
    },
  ];

  const calculateDeadline = (deadline: ShaktiDeadline) => {
    const totalDays = deadline.trialType === "HIGH_RISK" ? 45 : 
                      deadline.trialType === "PRIOR_INTIMATION" ? 14 :
                      deadline.trialType === "EXPEDITED" ? 14 : 14;
    const deadlineDate = new Date(deadline.applicationDate);
    deadlineDate.setDate(deadlineDate.getDate() + totalDays);

    const elapsed = now.getTime() - deadline.applicationDate.getTime();
    const total = deadlineDate.getTime() - deadline.applicationDate.getTime();
    const remaining = deadlineDate.getTime() - now.getTime();

    const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRemaining = Math.floor((remaining % (1000 * 60)) / 1000);

    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

    let status: "ON_TRACK" | "WARNING" | "CRITICAL" | "EXPIRED" | "COMPLETE";
    if (remaining < 0) {
      status = "EXPIRED";
    } else if (daysRemaining <= 3) {
      status = "CRITICAL";
    } else if (daysRemaining <= 10) {
      status = "WARNING";
    } else {
      status = "ON_TRACK";
    }

    return {
      deadlineDate,
      daysRemaining: Math.max(0, daysRemaining),
      hoursRemaining: Math.max(0, hoursRemaining),
      minutesRemaining: Math.max(0, minutesRemaining),
      secondsRemaining: Math.max(0, secondsRemaining),
      progress,
      status,
      totalDays,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ON_TRACK":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "WARNING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "EXPIRED":
        return "bg-red-900/30 text-red-300 border-red-700/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ON_TRACK":
        return <CheckCircle2 className="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4" />;
      case "CRITICAL":
        return <Timer className="h-4 w-4 animate-pulse" />;
      case "EXPIRED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTrialTypeBadge = (type: string) => {
    switch (type) {
      case "HIGH_RISK":
        return <Badge variant="destructive" className="text-xs">45-Day License</Badge>;
      case "PRIOR_INTIMATION":
        return (
          <a 
            href="https://cdsco.gov.in/opencms/opencms/en/Notifications/2026/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Badge className="bg-emerald-600 hover:bg-emerald-500 text-xs cursor-pointer">
              Fast-Track Verified
            </Badge>
          </a>
        );
      case "EXPEDITED":
        return <Badge className="bg-teal-600 text-xs">Expedited</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Standard Review</Badge>;
    }
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-orange-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-400" />
            <span>SHAKTI Compliance Tracker</span>
          </CardTitle>
          <Badge variant="outline" className="text-amber-400 border-amber-500/50">
            CDSCO 2026
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Biopharma SHAKTI Initiative - Real-time NDCT Approval Window Monitoring
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultDeadlines.map((deadline) => {
          const calc = calculateDeadline(deadline);
          return (
            <div
              key={deadline.applicationId}
              className={`p-3 rounded-lg border ${getStatusColor(calc.status)}`}
              data-testid={`shakti-deadline-${deadline.applicationId}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">{deadline.drugName}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {deadline.applicationId}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrialTypeBadge(deadline.trialType)}
                  <span className="flex items-center gap-1 text-xs">
                    {getStatusIcon(calc.status)}
                    {calc.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <Progress value={calc.progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {calc.totalDays}-Day Window
                </span>
                {calc.status !== "EXPIRED" ? (
                  <div className="font-mono font-bold text-base tabular-nums" data-testid="countdown-timer">
                    {calc.daysRemaining}d {calc.hoursRemaining.toString().padStart(2, "0")}:
                    {calc.minutesRemaining.toString().padStart(2, "0")}:
                    {calc.secondsRemaining.toString().padStart(2, "0")}
                  </div>
                ) : (
                  <span className="font-bold text-red-400">DEADLINE PASSED</span>
                )}
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Deadline: {calc.deadlineDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default ShaktiTracker;

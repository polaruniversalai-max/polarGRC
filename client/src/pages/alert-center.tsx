import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CreditCard,
  MapPin,
  X,
  Check,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Alert {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle },
  high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", icon: AlertCircle },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: Bell },
  low: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Info },
};

const TYPE_ICONS: Record<string, any> = {
  LOW_CREDITS: CreditCard,
  COMPLIANCE_DEADLINE: Clock,
  SECURITY: ShieldAlert,
  UNAUTHORIZED_LOGIN: MapPin,
};

const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-1",
    type: "LOW_CREDITS",
    priority: "critical",
    title: "Low Credit Balance",
    message: "Your $POLAR credit balance is below 10%. Top up now to continue scanning.",
    metadata: { currentBalance: 8, threshold: 10 },
    isRead: false,
    isDismissed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "alert-2",
    type: "COMPLIANCE_DEADLINE",
    priority: "high",
    title: "DSCSA 2026 Deadline Approaching",
    message: "Federal compliance deadline is November 27, 2026. Ensure all systems are ready.",
    metadata: { daysRemaining: 308 },
    isRead: false,
    isDismissed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "alert-3",
    type: "UNAUTHORIZED_LOGIN",
    priority: "high",
    title: "Unusual Login Detected",
    message: "Login attempt from new location: Tokyo, Japan. Verify if this was you.",
    metadata: { location: "Tokyo, Japan", ip: "203.0.113.42" },
    isRead: true,
    isDismissed: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "alert-4",
    type: "SECURITY",
    priority: "medium",
    title: "Weekly Security Report",
    message: "Your account security score is 92/100. Enable 2FA to improve.",
    metadata: { score: 92 },
    isRead: true,
    isDismissed: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function AlertCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading } = useQuery<{ alerts: Alert[] }>({
    queryKey: ["/api/v1/alerts"],
  });

  const alerts = alertsData?.alerts?.length ? alertsData.alerts : MOCK_ALERTS;

  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest("PATCH", `/api/v1/alerts/${alertId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/alerts"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest("PATCH", `/api/v1/alerts/${alertId}/dismiss`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Alert Dismissed" });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/alerts"] });
    },
  });

  const criticalAlerts = alerts.filter(a => a.priority === "critical" && !a.isDismissed);
  const otherAlerts = alerts.filter(a => a.priority !== "critical" && !a.isDismissed);
  const unreadCount = alerts.filter(a => !a.isRead && !a.isDismissed).length;

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]">Alert Center</h1>
            <p className="text-muted-foreground">Compliance notifications and security alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={unreadCount > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-[hsl(var(--border))]"}>
              {unreadCount} Unread
            </Badge>
          </div>
        </div>

        {criticalAlerts.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Critical Alerts
              </CardTitle>
              <CardDescription className="text-red-400/80">Requires immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalAlerts.map((alert) => {
                const config = PRIORITY_CONFIG[alert.priority];
                const TypeIcon = TYPE_ICONS[alert.type] || Bell;
                
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${config.bg} ${!alert.isRead ? 'ring-1 ring-red-500/50' : ''}`}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <TypeIcon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                        <div>
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
                          <div className="text-xs text-muted-foreground mt-2">{getTimeAgo(alert.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markReadMutation.mutate(alert.id)}
                            data-testid={`button-mark-read-${alert.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissMutation.mutate(alert.id)}
                          data-testid={`button-dismiss-${alert.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {alert.type === "LOW_CREDITS" && (
                      <div className="mt-3">
                        <a href="/wallet">
                          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Top Up Credits
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                  Notification Inbox
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : otherAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No alerts to display
                  </div>
                ) : (
                  otherAlerts.map((alert) => {
                    const config = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.low;
                    const TypeIcon = TYPE_ICONS[alert.type] || Bell;
                    
                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${config.bg} ${!alert.isRead ? 'ring-1 ring-[hsl(var(--electric-cyan))]/30' : ''}`}
                        data-testid={`alert-${alert.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <TypeIcon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{alert.title}</span>
                                <Badge variant="outline" className={`text-xs ${config.color}`}>
                                  {alert.priority}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
                              <div className="text-xs text-muted-foreground mt-2">{getTimeAgo(alert.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!alert.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markReadMutation.mutate(alert.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissMutation.mutate(alert.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <CardHeader>
                <CardTitle className="text-sm">Alert Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
                  const count = alerts.filter(a => a.priority === priority && !a.isDismissed).length;
                  const Icon = config.icon;
                  return (
                    <div key={priority} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--sovereign-blue))]/50">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="capitalize text-sm">{priority}</span>
                      </div>
                      <Badge variant="outline" className={config.color}>
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[hsl(var(--electric-cyan))]/10 to-transparent border-[hsl(var(--electric-cyan))]/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  DSCSA Countdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const deadline = new Date("2026-11-27");
                  const now = new Date();
                  const diff = deadline.getTime() - now.getTime();
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[hsl(var(--electric-cyan))]">{days}</div>
                      <div className="text-sm text-muted-foreground">Days until deadline</div>
                      <div className="text-xs text-muted-foreground mt-2">November 27, 2026</div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

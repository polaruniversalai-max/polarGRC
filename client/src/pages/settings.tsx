import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Globe,
  Zap,
  Save,
  Loader2,
  CheckCircle2,
  Monitor,
  Clock,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTenantBranding } from "@/contexts/tenant-branding";

interface UserPreferences {
  auditNotes: string;
  favorites: string[];
  tourCompleted: boolean;
  settings: Record<string, any>;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tenantConfig, tenantId: currentTenantId } = useTenantBranding();

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [localSettings, setLocalSettings] = useState({
    defaultTollRoad: "ECO_COMMUTE",
    autoRefreshInterval: "30",
    notificationsEnabled: true,
    compactMode: false,
    showResilienceEvents: true,
    defaultRegistry: "AKIRI",
    timezone: "Asia/Kolkata",
  });

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/v1/user/preferences"],
  });

  const { data: owaspStatus } = useQuery<any>({
    queryKey: ["/api/v1/owasp/status"],
  });

  useEffect(() => {
    if (preferences?.settings) {
      setLocalSettings(prev => ({
        ...prev,
        ...preferences.settings,
      }));
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      setSaveStatus("saving");
      const res = await apiRequest("PUT", "/api/v1/user/preferences", { settings });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
      setSaveStatus("saved");
      toast({ title: "Settings Saved", description: "Your preferences have been updated." });
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: (error: any) => {
      setSaveStatus("idle");
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(localSettings);
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--electric-cyan))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]" data-testid="text-settings-title">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure your workspace, network preferences, and notifications
            </p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
            {saveStatus === "saving" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saveStatus === "saved" ? "Saved" : "Save Settings"}
          </Button>
        </div>

        <Card data-testid="card-network-settings">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Network Preferences</CardTitle>
            </div>
            <CardDescription>Choose your default toll road tier and network configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultTollRoad">Default Toll Road</Label>
                <Select
                  value={localSettings.defaultTollRoad}
                  onValueChange={v => updateSetting("defaultTollRoad", v)}
                >
                  <SelectTrigger id="defaultTollRoad" data-testid="select-default-toll-road">
                    <SelectValue placeholder="Select toll road" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECO_COMMUTE">Eco-Commute (1x cost)</SelectItem>
                    <SelectItem value="EXPRESS_LANE">Express Lane (2x cost)</SelectItem>
                    <SelectItem value="TURBO_TOLL">Turbo Toll (10x cost)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  The toll road used by default when submitting new audits
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultRegistry">Default Clinical Registry</Label>
                <Select
                  value={localSettings.defaultRegistry}
                  onValueChange={v => updateSetting("defaultRegistry", v)}
                >
                  <SelectTrigger id="defaultRegistry" data-testid="select-default-registry">
                    <SelectValue placeholder="Select registry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKIRI">Akiri Health Data Network</SelectItem>
                    <SelectItem value="CTRI">CTRI (India)</SelectItem>
                    <SelectItem value="CLINICALTRIALS_GOV">ClinicalTrials.gov (US)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Primary registry for Site-Navigator agent lookups
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="autoRefreshInterval">Auto-Refresh Interval</Label>
                <Select
                  value={localSettings.autoRefreshInterval}
                  onValueChange={v => updateSetting("autoRefreshInterval", v)}
                >
                  <SelectTrigger id="autoRefreshInterval" data-testid="select-refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  How often dashboards refresh network health data
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={localSettings.timezone}
                  onValueChange={v => updateSetting("timezone", v)}
                >
                  <SelectTrigger id="timezone" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">IST (India)</SelectItem>
                    <SelectItem value="America/New_York">EST (US East)</SelectItem>
                    <SelectItem value="America/Los_Angeles">PST (US West)</SelectItem>
                    <SelectItem value="Europe/London">GMT (London)</SelectItem>
                    <SelectItem value="Asia/Singapore">SGT (Singapore)</SelectItem>
                    <SelectItem value="Asia/Tokyo">JST (Japan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-display-settings">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Display & Notifications</CardTitle>
            </div>
            <CardDescription>Customize your dashboard experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Notifications</Label>
                <p className="text-[10px] text-muted-foreground">Receive alerts for compliance events, failovers, and system updates</p>
              </div>
              <Switch
                checked={localSettings.notificationsEnabled}
                onCheckedChange={v => updateSetting("notificationsEnabled", v)}
                data-testid="switch-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-[10px] text-muted-foreground">Reduce spacing in tables and card layouts for denser information display</p>
              </div>
              <Switch
                checked={localSettings.compactMode}
                onCheckedChange={v => updateSetting("compactMode", v)}
                data-testid="switch-compact-mode"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Show Resilience Events</Label>
                <p className="text-[10px] text-muted-foreground">Display real-time failover events in the Network Vitals widget</p>
              </div>
              <Switch
                checked={localSettings.showResilienceEvents}
                onCheckedChange={v => updateSetting("showResilienceEvents", v)}
                data-testid="switch-resilience-events"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-security-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Security & Compliance</CardTitle>
            </div>
            <CardDescription>Current security posture and tenant configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">Tenant ID</p>
                <p className="text-sm font-mono" data-testid="text-tenant-id">{currentTenantId || "polar-hq"}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">Auditor Role</p>
                <p className="text-sm" data-testid="text-auditor-role">{tenantConfig?.auditorRole || "Sovereign Auditor"}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">OWASP Version</p>
                <p className="text-sm font-mono" data-testid="text-owasp-version">{owaspStatus?.owaspVersion || "N/A"}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1">Active Mitigations</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" data-testid="badge-mitigations">
                    {owaspStatus?.mitigationsActive || 0}/10
                  </Badge>
                  <span className="text-xs text-emerald-400">All guards active</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="p-3 rounded-md bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium">Zero-Trust Architecture</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-[10px]">Zero-Downtime</Badge>
                <Badge variant="outline" className="text-[10px]">Zero-Knowledge</Badge>
                <Badge variant="outline" className="text-[10px]">Zero-Trust</Badge>
              </div>
            </div>
            <div className="p-3 rounded-md bg-muted/30">
              <p className="text-[10px] text-muted-foreground mb-1">Logged In As</p>
              <p className="text-sm" data-testid="text-user-email">{user?.email || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

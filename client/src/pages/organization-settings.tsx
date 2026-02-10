import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, FileCheck, Shield, Save, Loader2, Trash2, AlertTriangle, Database } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Organization {
  id: string;
  name: string;
  corporateId: string | null;
  fdaLicenseNumber: string | null;
  dea_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export default function OrganizationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    corporateId: "",
    fdaLicenseNumber: "",
    dea_number: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/v1/organizations", data);
      return res.json();
    },
    onSuccess: (org) => {
      toast({ title: "Organization Created", description: "Your company profile has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/organizations"] });
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const clearDemoDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/v1/demo/clear", {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Demo Data Cleared", description: "All demo records have been removed. You now have a clean slate." });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/reports"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrgMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]">Organization Settings</h1>
            <p className="text-muted-foreground">Manage your company profile and compliance credentials</p>
          </div>
          <Badge className="bg-[hsl(var(--electric-cyan))]/10 text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30">
            DSCSA 2026 Ready
          </Badge>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                Company Profile
              </CardTitle>
              <CardDescription>Your organization's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Pharmaceuticals Inc."
                    className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corporateId">Corporate ID</Label>
                  <Input
                    id="corporateId"
                    value={formData.corporateId}
                    onChange={(e) => setFormData({ ...formData, corporateId: e.target.value })}
                    placeholder="CORP-12345"
                    className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                    data-testid="input-corporate-id"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Pharma Way, Boston, MA 02101"
                  className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                  data-testid="input-address"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="compliance@acmepharma.com"
                    className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                Regulatory Credentials
              </CardTitle>
              <CardDescription>FDA and DEA licensing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fdaLicenseNumber">FDA License Number</Label>
                  <Input
                    id="fdaLicenseNumber"
                    value={formData.fdaLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, fdaLicenseNumber: e.target.value })}
                    placeholder="FDA-2026-XXXX"
                    className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                    data-testid="input-fda-license"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dea_number">DEA Registration Number</Label>
                  <Input
                    id="dea_number"
                    value={formData.dea_number}
                    onChange={(e) => setFormData({ ...formData, dea_number: e.target.value })}
                    placeholder="AB1234567"
                    className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                    data-testid="input-dea-number"
                  />
                </div>
              </div>
              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg border border-[hsl(var(--electric-cyan))]/20">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  <span className="text-muted-foreground">
                    Credentials are encrypted and stored using Railgun ZK-shielding for HIPAA compliance.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={createOrgMutation.isPending || !formData.name}
              className="bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))] hover:bg-[hsl(var(--electric-cyan))]/90"
              data-testid="button-save-organization"
            >
              {createOrgMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Organization
            </Button>
          </div>
        </form>

        {/* Clean Slate - Demo Data Management */}
        <Card className="bg-[hsl(var(--card))] border-red-500/20 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Database className="w-5 h-5" />
              Clean Slate
            </CardTitle>
            <CardDescription>Remove all demo data and start fresh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Warning: This action cannot be undone</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will permanently delete all demo data including Phronesis-Insulin, NovaVanguard-Vaccine, 
                    and M-Core Biologics sample records. Only records marked with is_demo_data=true will be removed.
                    Your real compliance data will remain intact.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Demo Data Status</p>
                <p className="text-xs text-muted-foreground">
                  Sample records for testing and demonstration purposes
                </p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                DEMO Active
              </Badge>
            </div>

            <Button
              variant="destructive"
              onClick={() => clearDemoDataMutation.mutate()}
              disabled={clearDemoDataMutation.isPending}
              className="w-full"
              data-testid="button-clear-demo-data"
            >
              {clearDemoDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Clear All Demo Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

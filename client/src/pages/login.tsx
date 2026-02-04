import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Chrome } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-[hsl(var(--electric-cyan))] to-cyan-600">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            <span className="text-[hsl(var(--electric-cyan))]">POLAR</span> COMMAND
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            FDA DSCSA 2026 Compliance Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            Sign in to access your pharmaceutical supply chain compliance dashboard
          </div>
          
          <Button 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
            data-testid="button-google-login"
          >
            <SiGoogle className="w-5 h-5 mr-3 text-[#4285F4]" />
            Sign in with Google
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-4">
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>Enterprise-grade blockchain verification</p>
              <p className="text-[hsl(var(--electric-cyan))]">8-Pillar Sovereign Architecture</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

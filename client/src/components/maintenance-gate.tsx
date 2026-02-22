import { useState, useEffect, useCallback } from "react";
import { Shield, AlertTriangle, Loader2, Lock, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

type GateState = "maintenance" | "connecting" | "signing" | "verifying" | "unauthorized" | "authorized";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("maintenance");
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/architect/status", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.verified && data.address) {
          setConnectedAddress(data.address);
          setState("authorized");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0 && state !== "authorized") {
        setState("maintenance");
        setConnectedAddress(null);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [state]);

  const connectAndSign = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setError("MetaMask not detected. Install MetaMask to authenticate.");
      return;
    }

    setState("connecting");
    setError(null);

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setState("maintenance");
        return;
      }

      const addr = accounts[0];
      setConnectedAddress(addr);

      setState("signing");

      const nonceRes = await fetch("/api/v1/architect/nonce");
      const { message } = await nonceRes.json();

      const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, addr],
      });

      setState("verifying");

      const verifyRes = await apiRequest("POST", "/api/v1/architect/verify", {
        address: addr,
        signature,
        message,
      });

      const result = await verifyRes.json();

      if (result.authorized) {
        setState("authorized");
      } else {
        setState("unauthorized");
        setError(result.error || "Verification failed");
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Signature request was rejected.");
        setState("maintenance");
      } else {
        setError(err.message || "Authentication failed.");
        setState("maintenance");
      }
    }
  }, []);

  if (state === "authorized") {
    return <>{children}</>;
  }

  if (state === "unauthorized") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[hsl(var(--sovereign-blue))] flex items-center justify-center" data-testid="overlay-unauthorized">
        <div className="max-w-lg w-full mx-6 text-center space-y-8">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-red-400 font-mono tracking-wider">
              UNAUTHORIZED SIGNATURE
            </h1>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              This GRC instance is restricted to the Lead Security Architect.
            </p>
          </div>

          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg font-mono text-xs text-red-300/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CONNECTED</span>
              <span className="truncate ml-2 max-w-[280px]">{connectedAddress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">STATUS</span>
              <span className="text-red-400">ACCESS DENIED</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => { setState("maintenance"); setConnectedAddress(null); }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-xs"
            data-testid="button-disconnect"
          >
            DISCONNECT
          </Button>
        </div>
      </div>
    );
  }

  const statusLabel =
    state === "connecting" ? "CONNECTING WALLET..." :
    state === "signing" ? "SIGN MESSAGE IN WALLET..." :
    state === "verifying" ? "VERIFYING SIGNATURE..." : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[hsl(var(--sovereign-blue))] flex items-center justify-center" data-testid="overlay-maintenance">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--electric-cyan))]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[hsl(var(--electric-cyan))]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full mx-6 text-center space-y-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--electric-cyan))]/30 animate-spin" style={{ animationDuration: "8s" }} />
          <div className="absolute inset-2 rounded-full border border-[hsl(var(--electric-cyan))]/20 animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
          <div className="absolute inset-4 rounded-full bg-[hsl(var(--electric-cyan))]/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-[hsl(var(--electric-cyan))]" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
            <span className="text-xs font-mono text-[hsl(var(--electric-cyan))]/80 tracking-[0.3em] uppercase">Sentinel GRC</span>
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--electric-cyan))] font-mono tracking-wider">
            RESTRICTED ACCESS
          </h1>
          <p className="text-sm text-muted-foreground font-mono leading-relaxed max-w-md mx-auto">
            System undergoing FDA DSCSA 2026 audit.<br />
            Sovereign Architect signature required.
          </p>
        </div>

        <div className="p-4 bg-[hsl(var(--card))]/30 border border-[hsl(var(--electric-cyan))]/20 rounded-lg space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>PROTOCOL</span>
            <span className="text-[hsl(var(--electric-cyan))]">SENTINEL v3.1</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>MODE</span>
            <span className="text-amber-400">MAINTENANCE</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>CLEARANCE</span>
            <span className="text-red-400">ARCHITECT ONLY</span>
          </div>
        </div>

        {statusLabel ? (
          <Button disabled className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] font-mono w-full max-w-xs mx-auto">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {statusLabel}
          </Button>
        ) : (
          <Button
            onClick={connectAndSign}
            className="bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))] hover:bg-[hsl(var(--electric-cyan))]/90 font-mono w-full max-w-xs mx-auto"
            data-testid="button-connect-wallet"
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            AUTHENTICATE WITH WALLET
          </Button>
        )}

        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}

        <p className="text-[10px] text-muted-foreground/50 font-mono">
          POLAR COMMAND | Zero-Trust Architecture | All access attempts logged
        </p>
      </div>
    </div>
  );
}

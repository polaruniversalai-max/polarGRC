import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Coins, 
  CreditCard, 
  TrendingUp, 
  Zap, 
  Gift, 
  Clock, 
  ArrowUpRight,
  Loader2,
  Shield,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { safeNumber, formatNumber, formatCurrency, formatPolar } from "@/lib/format";

interface CreditBalance {
  id: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  stakedPolarTokens: number;
  freeMonthlyScans: number;
  lastRewardAt: string | null;
}

interface LedgerEntry {
  id: string;
  actionType: string;
  description: string;
  creditsUsed: number;
  creditsEarned: number;
  createdAt: string;
}

const CREDIT_PACKAGES = [
  { credits: 100, price: 9.99, popular: false },
  { credits: 500, price: 39.99, popular: true },
  { credits: 1000, price: 69.99, popular: false },
  { credits: 5000, price: 299.99, popular: false },
];

export default function WalletPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const { data: credits, isLoading: creditsLoading } = useQuery<CreditBalance>({
    queryKey: ["/api/v1/credits"],
  });

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery<{ transactions: LedgerEntry[] }>({
    queryKey: ["/api/v1/ledger"],
  });

  const topupMutation = useMutation({
    mutationFn: async (pkg: typeof CREDIT_PACKAGES[0]) => {
      const res = await apiRequest("POST", "/api/v1/credits/topup", {
        amount: pkg.price * 100,
        creditsToAdd: pkg.credits,
        stripeSessionId: `mock_${Date.now()}`,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Credits Added!", description: "Your balance has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/ledger"] });
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const claimRewardsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/v1/staking/claim-rewards", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.freeScans > 0) {
        toast({ title: "Rewards Claimed!", description: `You received ${data.freeScans} free monthly scans!` });
      } else {
        toast({ title: "No Rewards Available", description: "Stake more $POLAR tokens to earn rewards." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/v1/credits"] });
    },
  });

  const balance = safeNumber(credits?.balance);
  const lowBalance = balance < 10;

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]">$POLAR Wallet</h1>
            <p className="text-muted-foreground">Manage your credits and staking rewards</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                Credit Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="text-6xl font-bold text-[hsl(var(--electric-cyan))]" data-testid="text-credit-balance">
                  {creditsLoading ? "..." : safeNumber(balance).toFixed(2)}
                </div>
                <div className="text-muted-foreground mb-2">$POLAR Credits</div>
                {lowBalance && (
                  <Badge variant="destructive" className="mb-2">Low Balance</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Lifetime Earned</div>
                  <div className="text-xl font-bold text-green-400">{formatNumber(credits?.lifetimeEarned)}</div>
                </div>
                <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Lifetime Spent</div>
                  <div className="text-xl font-bold text-orange-400">{formatNumber(credits?.lifetimeSpent)}</div>
                </div>
                <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Free Scans</div>
                  <div className="text-xl font-bold text-[hsl(var(--electric-cyan))]">{formatNumber(credits?.freeMonthlyScans)}</div>
                </div>
              </div>

              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/30 rounded-lg border border-[hsl(var(--border))]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Zap className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                  Credit Usage
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Scan: </span>
                    <span className="font-mono">1 Credit</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ZK-Shield: </span>
                    <span className="font-mono">5 Credits</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PDF Export: </span>
                    <span className="font-mono">2 Credits</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[hsl(var(--electric-cyan))]/10 to-transparent border-[hsl(var(--electric-cyan))]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                Staking Rewards
              </CardTitle>
              <CardDescription>Hold $POLAR tokens for free monthly scans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-[hsl(var(--electric-cyan))]">
                  {safeNumber(credits?.stakedPolarTokens).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">$POLAR Staked</div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">100+ $POLAR</span>
                  <span>5 Free Scans/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1,000+ $POLAR</span>
                  <span>20 Free Scans/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">5,000+ $POLAR</span>
                  <span>50 Free Scans/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">10,000+ $POLAR</span>
                  <span className="text-[hsl(var(--electric-cyan))]">100 Free Scans/mo</span>
                </div>
              </div>

              <Button
                onClick={() => claimRewardsMutation.mutate()}
                disabled={claimRewardsMutation.isPending}
                className="w-full bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))]"
                data-testid="button-claim-rewards"
              >
                {claimRewardsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4 mr-2" />
                )}
                Claim Rewards
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              Top Up Credits
            </CardTitle>
            <CardDescription>Purchase $POLAR credits with Stripe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPackage(i)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPackage === i
                      ? "border-[hsl(var(--electric-cyan))] bg-[hsl(var(--electric-cyan))]/10"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--electric-cyan))]/50"
                  }`}
                  data-testid={`card-package-${pkg.credits}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 right-2 bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))]">
                      Popular
                    </Badge>
                  )}
                  <div className="text-2xl font-bold">{pkg.credits.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                  <div className="text-lg font-semibold mt-2">${pkg.price}</div>
                  <div className="text-xs text-muted-foreground">
                    ${(pkg.price / pkg.credits * 100).toFixed(1)}¢ per credit
                  </div>
                </div>
              ))}
            </div>
            
            {selectedPackage !== null && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => topupMutation.mutate(CREDIT_PACKAGES[selectedPackage])}
                  disabled={topupMutation.isPending}
                  className="bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))]"
                  data-testid="button-purchase-credits"
                >
                  {topupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Purchase {CREDIT_PACKAGES[selectedPackage].credits} Credits
                </Button>
              </div>
            )}

            <div className="mt-4 p-3 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
              Demo Mode: Transactions are simulated. Real Stripe integration ready for production.
            </div>
          </CardContent>
        </Card>

        {/* Stripe Replenish + Jupiter Swap */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-400" />
                Stripe Replenish
              </CardTitle>
              <CardDescription>Auto-replenish when balance falls below threshold</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Auto-Replenish</span>
                  <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Set a threshold and automatically purchase credits when your balance drops below it.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-purple-500/30 text-purple-400"
                disabled
                data-testid="button-stripe-replenish"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Configure Stripe Replenish
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-green-400" />
                Buy $POLAR
              </CardTitle>
              <CardDescription>Swap tokens for $POLAR on Jupiter DEX</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Jupiter Aggregator</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Best rates across Solana DEXs. Swap SOL, USDC, or any SPL token for $POLAR.
                </p>
              </div>
              <a 
                href="https://jup.ag/swap/SOL-POLAR" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  data-testid="button-jupiter-swap"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Jupiter Swap
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ledgerLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
            ) : ledgerData?.transactions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="space-y-2">
                {ledgerData?.transactions?.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--sovereign-blue))]/30 rounded-lg"
                    data-testid={`ledger-entry-${tx.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {tx.creditsEarned > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <Zap className="w-4 h-4 text-orange-400" />
                      )}
                      <div>
                        <div className="font-medium">{tx.actionType.replace(/_/g, " ")}</div>
                        <div className="text-xs text-muted-foreground">{tx.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={tx.creditsEarned > 0 ? "text-green-400" : "text-orange-400"}>
                        {tx.creditsEarned > 0 ? `+${tx.creditsEarned}` : `-${tx.creditsUsed}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

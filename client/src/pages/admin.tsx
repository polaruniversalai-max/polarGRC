import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Wallet, 
  TrendingUp, 
  DollarSign,
  ArrowDownToLine,
  Loader2,
  AlertTriangle,
  Clock,
  Users,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { safeNumber, formatCurrency, formatNumber } from "@/lib/format";

interface TreasuryData {
  treasury: {
    totalFees: number;
    totalGross: number;
    transactionCount: number;
    feePercentage: number;
    availableProfit: number;
  };
  recentTransactions: Array<{
    id: string;
    transactionType: string;
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
    createdAt: string;
  }>;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: treasuryData, isLoading } = useQuery<TreasuryData>({
    queryKey: ["/api/v1/admin/treasury"],
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/v1/admin/treasury/withdraw", { amount });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Withdrawal Requested", 
        description: `${data.message}. Amount: $${data.requestedAmount}` 
      });
      setWithdrawAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const treasury = treasuryData?.treasury;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--electric-cyan))]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[hsl(var(--electric-cyan))]" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform Treasury & Economics</p>
        </div>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          ADMIN ONLY
        </Badge>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Fees Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              ${safeNumber(treasury?.totalFees).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {safeNumber(treasury?.feePercentage)}% platform fee
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Gross Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              ${safeNumber(treasury?.totalGross).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All credit purchases
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {formatNumber(treasury?.transactionCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Credit purchases processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[hsl(var(--electric-cyan))]/10 to-transparent border-[hsl(var(--electric-cyan))]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Available Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[hsl(var(--electric-cyan))]">
              ${safeNumber(treasury?.availableProfit).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to withdraw
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              Withdraw Funds
            </CardTitle>
            <CardDescription>Request a withdrawal from platform treasury</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Withdrawal Notice</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Withdrawals are processed within 3-5 business days. 
                    This is a mocked feature for demonstration purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Amount (USD)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
                  data-testid="input-withdraw-amount"
                />
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending || !withdrawAmount}
                  className="bg-[hsl(var(--electric-cyan))] text-[hsl(var(--sovereign-blue))]"
                  data-testid="button-withdraw"
                >
                  {withdrawMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Withdraw"
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-[hsl(var(--border))]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Balance:</span>
                <span className="font-mono text-[hsl(var(--electric-cyan))]">
                  ${safeNumber(treasury?.availableProfit).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              Recent Treasury Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {treasuryData?.recentTransactions?.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {treasuryData.recentTransactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{tx.transactionType}</p>
                      <p className="text-xs text-muted-foreground">
                        Gross: ${safeNumber(tx.grossAmount).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-green-400">
                        +${safeNumber(tx.feeAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fee collected
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No treasury transactions yet</p>
                <p className="text-xs">Fees will appear when users purchase credits</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle>Platform Fee Structure</CardTitle>
          <CardDescription>2.5% Platform Fee on all credit purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
              <p className="text-muted-foreground mb-1">Example: $100 Purchase</p>
              <div className="space-y-1">
                <p>Platform Fee: <span className="text-green-400">$2.50</span></p>
                <p>Net to User: <span className="text-[hsl(var(--electric-cyan))]">$97.50</span></p>
              </div>
            </div>
            <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
              <p className="text-muted-foreground mb-1">Example: $500 Purchase</p>
              <div className="space-y-1">
                <p>Platform Fee: <span className="text-green-400">$12.50</span></p>
                <p>Net to User: <span className="text-[hsl(var(--electric-cyan))]">$487.50</span></p>
              </div>
            </div>
            <div className="p-4 bg-[hsl(var(--sovereign-blue))]/50 rounded-lg">
              <p className="text-muted-foreground mb-1">Example: $1000 Purchase</p>
              <div className="space-y-1">
                <p>Platform Fee: <span className="text-green-400">$25.00</span></p>
                <p>Net to User: <span className="text-[hsl(var(--electric-cyan))]">$975.00</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

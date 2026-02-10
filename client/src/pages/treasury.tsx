import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wallet, 
  ArrowRightLeft, 
  TrendingUp, 
  DollarSign,
  Coins,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Fuel
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { safeNumber, formatNumber, formatCurrency } from "@/lib/format";

interface TreasuryStats {
  totalFees: number;
  totalTransactions: number;
  polarPrice: number;
  gasPrice: number;
}

interface SwapTransaction {
  id: string;
  type: "buy" | "swap";
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  feeAmount: number;
  feePercentage: number;
  status: string;
  timestamp: string;
}

const SOVEREIGN_FEE_PERCENTAGE = 1.5;

export default function TreasuryPage() {
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("POLAR");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: treasuryStats, isLoading: statsLoading } = useQuery<TreasuryStats>({
    queryKey: ["/api/v1/treasury/stats"],
  });

  const { data: swapHistory, isLoading: historyLoading } = useQuery<SwapTransaction[]>({
    queryKey: ["/api/v1/treasury/history"],
  });

  const { data: credits } = useQuery<{ balance: number }>({
    queryKey: ["/api/credits"],
  });

  const buyMutation = useMutation({
    mutationFn: async (data: { amount: number; token: string }) => {
      const res = await apiRequest("POST", "/api/v1/treasury/buy", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/treasury"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
      toast({
        title: "Purchase Complete",
        description: `Bought ${data.toAmount} ${data.toToken}. Fee: ${data.feeAmount.toFixed(4)} (${SOVEREIGN_FEE_PERCENTAGE}%)`,
      });
      setBuyAmount("");
    },
    onError: () => {
      toast({ title: "Transaction Failed", variant: "destructive" });
    },
  });

  const swapMutation = useMutation({
    mutationFn: async (data: { fromToken: string; toToken: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/v1/treasury/swap", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/treasury"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
      toast({
        title: "Swap Complete",
        description: `Swapped ${data.fromAmount} ${data.fromToken} → ${data.toAmount} ${data.toToken}. Fee: ${data.feeAmount.toFixed(4)}`,
      });
      setSwapAmount("");
    },
    onError: () => {
      toast({ title: "Swap Failed", variant: "destructive" });
    },
  });

  const handleBuy = async () => {
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await buyMutation.mutateAsync({ amount, token: "POLAR" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwap = async () => {
    const amount = parseFloat(swapAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await swapMutation.mutateAsync({ fromToken, toToken, amount });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateFee = (amount: number) => {
    return amount * (SOVEREIGN_FEE_PERCENTAGE / 100);
  };

  const calculateReceive = (amount: number, rate: number = 1) => {
    const fee = calculateFee(amount);
    return (amount - fee) * rate;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-bold text-foreground flex items-center gap-3">
              <Wallet className="w-8 h-8 text-[hsl(var(--electric-cyan))]" />
              Treasury
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              Buy $POLAR tokens and swap gas tokens
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] border-[hsl(var(--electric-cyan))]/30 px-3 py-1">
              <Shield className="w-3 h-3 mr-1" />
              {SOVEREIGN_FEE_PERCENTAGE}% Sovereign Service Fee
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Your Balance</p>
                  <p className="text-xl font-mono font-bold">{formatNumber(safeNumber(credits?.balance))} $POLAR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--neon-green))]/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[hsl(var(--neon-green))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">$POLAR Price</p>
                  <p className="text-xl font-mono font-bold">${safeNumber(treasuryStats?.polarPrice, 0.25).toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--warning))]/20 flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-[hsl(var(--warning))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Gas (Gwei)</p>
                  <p className="text-xl font-mono font-bold">{safeNumber(treasuryStats?.gasPrice, 25).toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Platform Fees Collected</p>
                  <p className="text-xl font-mono font-bold">${safeNumber(treasuryStats?.totalFees).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-sans">
                <Coins className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
                Buy $POLAR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-mono">Amount (USD)</label>
                <Input
                  type="number"
                  placeholder="100.00"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))] font-mono"
                  data-testid="input-buy-amount"
                />
              </div>

              {buyAmount && !isNaN(parseFloat(buyAmount)) && (
                <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-mono">Sovereign Fee ({SOVEREIGN_FEE_PERCENTAGE}%)</span>
                    <span className="text-[hsl(var(--warning))] font-mono">-${calculateFee(parseFloat(buyAmount)).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-mono">You Receive</span>
                    <span className="text-[hsl(var(--neon-green))] font-mono font-bold">
                      {calculateReceive(parseFloat(buyAmount), 4).toFixed(2)} $POLAR
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={isProcessing || !buyAmount}
                className="w-full bg-[hsl(var(--electric-cyan))] text-[hsl(var(--midnight-navy))] hover:bg-[hsl(var(--electric-cyan))]/90"
                data-testid="button-buy-polar"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Coins className="w-4 h-4 mr-2" />}
                Buy $POLAR
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-sans">
                <ArrowRightLeft className="w-5 h-5 text-[hsl(var(--neon-green))]" />
                Swap Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-mono">From</label>
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]" data-testid="select-from-token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="MOVE">MOVE</SelectItem>
                      <SelectItem value="POLAR">POLAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-mono">To</label>
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]" data-testid="select-to-token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="MOVE">MOVE</SelectItem>
                      <SelectItem value="POLAR">POLAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-mono">Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))] font-mono"
                  data-testid="input-swap-amount"
                />
              </div>

              {swapAmount && !isNaN(parseFloat(swapAmount)) && (
                <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-mono">Sovereign Fee ({SOVEREIGN_FEE_PERCENTAGE}%)</span>
                    <span className="text-[hsl(var(--warning))] font-mono">-{calculateFee(parseFloat(swapAmount)).toFixed(6)} {fromToken}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-mono">You Receive (est.)</span>
                    <span className="text-[hsl(var(--neon-green))] font-mono font-bold">
                      {(parseFloat(swapAmount) * 0.985).toFixed(6)} {toToken}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSwap}
                disabled={isProcessing || !swapAmount || fromToken === toToken}
                className="w-full bg-[hsl(var(--neon-green))] text-[hsl(var(--midnight-navy))] hover:bg-[hsl(var(--neon-green))]/90"
                data-testid="button-swap"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                Swap Tokens
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-sans">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !swapHistory || swapHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono">
                  No transactions yet. Buy or swap tokens above.
                </div>
              ) : (
                <div className="space-y-2">
                  {swapHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-[hsl(var(--sovereign-blue))] rounded-lg"
                      data-testid={`tx-${tx.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {tx.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-[hsl(var(--neon-green))]" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-[hsl(var(--warning))]" />
                        )}
                        <div>
                          <p className="font-mono text-sm">
                            {tx.type === "buy" ? "Bought" : "Swapped"} {tx.fromAmount} {tx.fromToken} → {tx.toAmount.toFixed(4)} {tx.toToken}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Fee: {tx.feeAmount.toFixed(6)} ({tx.feePercentage}%)
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Shield, Award, TrendingUp } from "lucide-react";
import { safeNumber } from "@/lib/format";
import { getRankFromXP, SovereignRanks, XPRewards } from "@shared/schema";

interface UserXPData {
  complianceXP: number;
  consecutiveLRADays: number;
  facilityName: string;
}

export function XPProgressBar() {
  const { data: preferences, isLoading } = useQuery<UserXPData>({
    queryKey: ["/api/v1/user/preferences"],
  });

  const xp = safeNumber(preferences?.complianceXP);
  const rankInfo = getRankFromXP(xp);
  
  const progressToNextRank = () => {
    if (!rankInfo.nextRank) return 100;
    const currentRankMin = rankInfo.minXP;
    const nextRankMin = rankInfo.nextRank.minXP;
    const progress = ((xp - currentRankMin) / (nextRankMin - currentRankMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const xpToNextRank = () => {
    if (!rankInfo.nextRank) return 0;
    return rankInfo.nextRank.minXP - xp;
  };

  const getRankIcon = (rankName: string) => {
    if (rankName === SovereignRanks.SOVEREIGN_WARDEN.name) {
      return <Award className="w-5 h-5" style={{ color: SovereignRanks.SOVEREIGN_WARDEN.color }} />;
    } else if (rankName === SovereignRanks.SILVER_SENTINEL.name) {
      return <Shield className="w-5 h-5" style={{ color: SovereignRanks.SILVER_SENTINEL.color }} />;
    }
    return <Star className="w-5 h-5" style={{ color: SovereignRanks.BRONZE_AUDITOR.color }} />;
  };

  const getRankBadgeStyle = (rankName: string) => {
    if (rankName === SovereignRanks.SOVEREIGN_WARDEN.name) {
      return { backgroundColor: "rgba(255, 215, 0, 0.2)", color: "#FFD700", borderColor: "rgba(255, 215, 0, 0.3)" };
    } else if (rankName === SovereignRanks.SILVER_SENTINEL.name) {
      return { backgroundColor: "rgba(192, 192, 192, 0.2)", color: "#C0C0C0", borderColor: "rgba(192, 192, 192, 0.3)" };
    }
    return { backgroundColor: "rgba(205, 127, 50, 0.2)", color: "#CD7F32", borderColor: "rgba(205, 127, 50, 0.3)" };
  };

  if (isLoading) {
    return (
      <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="xp-progress" className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]" data-testid="card-xp-progress">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-lg font-sans">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
            Compliance XP
          </div>
          <Badge style={getRankBadgeStyle(rankInfo.name)} className="flex items-center gap-1">
            {getRankIcon(rankInfo.name)}
            {rankInfo.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold text-[hsl(var(--electric-cyan))]">
            {xp.toLocaleString()} XP
          </span>
          {rankInfo.nextRank && (
            <span className="text-sm text-muted-foreground font-mono">
              {xpToNextRank().toLocaleString()} XP to {rankInfo.nextRank.name}
            </span>
          )}
        </div>

        <Progress 
          value={progressToNextRank()} 
          className="h-3 bg-[hsl(var(--sovereign-blue))]"
        />

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-[hsl(var(--sovereign-blue))] rounded-lg">
            <p className="text-xs text-muted-foreground font-mono">Verified Scan</p>
            <p className="text-sm font-mono font-bold text-[hsl(var(--neon-green))]">+{XPRewards.VERIFIED_SCAN} XP</p>
          </div>
          <div className="text-center p-2 bg-[hsl(var(--sovereign-blue))] rounded-lg">
            <p className="text-xs text-muted-foreground font-mono">Token Swap</p>
            <p className="text-sm font-mono font-bold text-[hsl(var(--neon-green))]">+{XPRewards.TOKEN_SWAP} XP</p>
          </div>
          <div className="text-center p-2 bg-[hsl(var(--sovereign-blue))] rounded-lg">
            <p className="text-xs text-muted-foreground font-mono">LRA Uptime Day</p>
            <p className="text-sm font-mono font-bold text-[hsl(var(--neon-green))]">+{XPRewards.LRA_UPTIME_DAY} XP</p>
          </div>
        </div>

        {safeNumber(preferences?.consecutiveLRADays) > 0 && (
          <div className="flex items-center gap-2 p-2 bg-[hsl(var(--neon-green))]/10 rounded-lg">
            <Shield className="w-4 h-4 text-[hsl(var(--neon-green))]" />
            <span className="text-sm font-mono text-[hsl(var(--neon-green))]">
              {preferences?.consecutiveLRADays} day streak of 100% LRA uptime!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

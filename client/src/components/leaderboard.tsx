import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Award, Star, Loader2 } from "lucide-react";
import { safeNumber } from "@/lib/format";
import { getRankFromXP, SovereignRanks } from "@shared/schema";

interface LeaderboardEntry {
  rank: number;
  facilityName: string;
  facilityLocation: string;
  complianceXP: number;
  sovereignRank: string;
  userId: string;
}

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/v1/leaderboard"],
  });

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-700" />;
      default:
        return <Star className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (rankName: string) => {
    if (rankName === SovereignRanks.SOVEREIGN_WARDEN.name) {
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    } else if (rankName === SovereignRanks.SILVER_SENTINEL.name) {
      return "bg-gray-400/20 text-gray-300 border-gray-400/30";
    }
    return "bg-amber-700/20 text-amber-600 border-amber-700/30";
  };

  return (
    <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-sans">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Irving Leaderboard
          <Badge className="ml-auto bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))] text-xs">
            Top Facilities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">
              No facilities ranked yet. Complete scans to earn XP!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    entry.rank <= 3
                      ? "bg-gradient-to-r from-[hsl(var(--sovereign-blue))] to-transparent"
                      : "bg-[hsl(var(--sovereign-blue))]/50"
                  }`}
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--midnight-navy))] flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {entry.facilityName || `Facility #${entry.rank}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {entry.facilityLocation || "Irving"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRankBadgeColor(entry.sovereignRank)}>
                      {entry.sovereignRank}
                    </Badge>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[hsl(var(--electric-cyan))]">
                        {safeNumber(entry.complianceXP).toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

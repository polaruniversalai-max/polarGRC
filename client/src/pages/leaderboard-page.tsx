import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Star, Target } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";
import { XPProgressBar } from "@/components/xp-progress";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-bold text-foreground flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Sovereign Ranks
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              Gamification & Facility Leaderboard
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-amber-900/30 to-amber-700/10 border-amber-700/30">
            <CardContent className="pt-6 text-center">
              <Star className="w-12 h-12 mx-auto mb-3" style={{ color: "#CD7F32" }} />
              <h3 className="font-sans font-bold text-lg" style={{ color: "#CD7F32" }}>Bronze Auditor</h3>
              <p className="text-sm text-muted-foreground font-mono mt-1">0 - 499 XP</p>
              <p className="text-xs text-muted-foreground mt-2">Entry level compliance officer</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-500/30 to-gray-400/10 border-gray-400/30">
            <CardContent className="pt-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-3" style={{ color: "#C0C0C0" }} />
              <h3 className="font-sans font-bold text-lg" style={{ color: "#C0C0C0" }}>Silver Sentinel</h3>
              <p className="text-sm text-muted-foreground font-mono mt-1">500 - 1,999 XP</p>
              <p className="text-xs text-muted-foreground mt-2">Experienced compliance guardian</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/30 to-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: "#FFD700" }} />
              <h3 className="font-sans font-bold text-lg" style={{ color: "#FFD700" }}>Sovereign Warden</h3>
              <p className="text-sm text-muted-foreground font-mono mt-1">2,000+ XP</p>
              <p className="text-xs text-muted-foreground mt-2">Master compliance leader</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <XPProgressBar />
          <Leaderboard />
        </div>

        <Card className="bg-[hsl(var(--midnight-navy))] border-[hsl(var(--glass-border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-sans">
              <Target className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              How to Earn XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--neon-green))]/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-[hsl(var(--neon-green))]">+10</span>
                  </div>
                  <h4 className="font-sans font-medium">Verified Scan</h4>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Complete a pharmaceutical verification scan with VERIFIED status
                </p>
              </div>

              <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-[hsl(var(--electric-cyan))]">+50</span>
                  </div>
                  <h4 className="font-sans font-medium">Token Swap</h4>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Complete a token swap or purchase in the Treasury
                </p>
              </div>

              <div className="p-4 bg-[hsl(var(--sovereign-blue))] rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-400">+100</span>
                  </div>
                  <h4 className="font-sans font-medium">LRA Uptime Day</h4>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Maintain 100% LRA compliance for a full 24-hour period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Zap, Clock, ExternalLink } from "lucide-react";

interface RegulatoryPathwayBadgeProps {
  startDelay: number;
  mechanism?: string;
}

export function RegulatoryPathwayBadge({ startDelay, mechanism }: RegulatoryPathwayBadgeProps) {
  const isFastTrack = startDelay === 0;

  if (isFastTrack) {
    return (
      <a
        href="https://cdsco.gov.in/opencms/opencms/en/Notifications/2026/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1"
        data-testid="regulatory-badge-fast-track"
      >
        <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1">
          <Zap className="h-3 w-3" />
          FAST-TRACK: Prior-Intimation
          <ExternalLink className="h-3 w-3 ml-1" />
        </Badge>
      </a>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className="bg-amber-600/20 text-amber-400 border-amber-500/30 gap-1"
      data-testid="regulatory-badge-standard"
    >
      <Clock className="h-3 w-3" />
      STANDARD: CDSCO 45-Day Review
    </Badge>
  );
}

export default RegulatoryPathwayBadge;

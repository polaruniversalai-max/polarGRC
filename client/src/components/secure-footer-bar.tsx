import { Shield, Database, Lock, MapPin } from "lucide-react";

interface SecureFooterBarProps {
  className?: string;
}

export function SecureFooterBar({ className }: SecureFooterBarProps) {
  const handleMiroClick = () => {
    console.log("[Miro SDK] Generate Compliance Map button clicked");
    console.log("[Miro SDK] Board creation would be initiated here with current trial data");
  };

  return (
    <div 
      className={`flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-700/50 text-xs ${className || ""}`}
      data-testid="secure-footer-bar"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Lock className="h-3 w-3" />
          <span className="font-mono">[SECURE]</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="h-3 w-3" />
          <span>Data Residency: <span className="text-cyan-400 font-mono">India-South</span></span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Database className="h-3 w-3" />
          <span>PII Vault: <span className="text-emerald-400 font-mono">ACTIVE</span></span>
        </div>
      </div>

      <button
        onClick={handleMiroClick}
        className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white transition-colors"
        data-testid="button-miro-generate-map"
      >
        <Shield className="h-3 w-3" />
        Miro: Generate Compliance Map
      </button>
    </div>
  );
}

export default SecureFooterBar;

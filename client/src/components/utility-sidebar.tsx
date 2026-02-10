import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PanelRightClose, 
  PanelRightOpen, 
  FileText, 
  Star, 
  Trash2,
  Loader2,
  Save,
  CheckCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface UserPreferences {
  auditNotes: string;
  favorites: string[];
  tourCompleted: boolean;
}

interface UtilitySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigateToWidget?: (widgetId: string) => void;
}

const WIDGET_LABELS: Record<string, string> = {
  "lra-score": "LRA Compliance Score",
  "wallet-balance": "Wallet & Credits",
  "eight-pillars": "8-Pillar Architecture",
  "scan-history": "Scan History",
  "privacy-wallet": "Privacy Wallet",
  "gas-savings": "Gas Savings",
  "risk-monitor": "Risk Monitor",
  "batch-export": "Batch Export",
  "offline-mode": "Offline Mode",
  "remediation": "Remediation Engine",
};

export function UtilitySidebar({ isOpen, onToggle, onNavigateToWidget }: UtilitySidebarProps) {
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/v1/user/preferences"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const res = await apiRequest("PUT", "/api/v1/user/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (widgetId: string) => {
      const newFavorites = (preferences?.favorites || []).filter(f => f !== widgetId);
      const res = await apiRequest("PUT", "/api/v1/user/preferences", { favorites: newFavorites });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
    },
  });

  useEffect(() => {
    if (preferences?.auditNotes !== undefined) {
      setNotes(preferences.auditNotes);
    }
  }, [preferences?.auditNotes]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    setSaveStatus("idle");
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      saveMutation.mutate({ auditNotes: value });
    }, 1500);
  }, [saveMutation]);

  const handleRemoveFavorite = (widgetId: string) => {
    removeFavoriteMutation.mutate(widgetId);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 w-80 h-screen border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col z-40 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
          <span className="font-semibold">Utility Panel</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} data-testid="button-close-utility-sidebar">
          <PanelRightClose className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted-foreground">Audit Notes</label>
            <div className="flex items-center gap-1">
              {saveStatus === "saving" && (
                <Badge variant="outline" className="text-xs">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Saving...
                </Badge>
              )}
              {saveStatus === "saved" && (
                <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
          </div>
          <Textarea
            placeholder="Write your audit notes here... They auto-save to the cloud."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="min-h-[150px] resize-none bg-[hsl(var(--sovereign-blue))] border-[hsl(var(--border))]"
            data-testid="textarea-audit-notes"
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-[hsl(var(--border))] flex-shrink-0">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">Favorites</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {preferences?.favorites?.length || 0}
            </Badge>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : preferences?.favorites?.length ? (
                preferences.favorites.map((widgetId) => (
                  <div
                    key={widgetId}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md",
                      "bg-[hsl(var(--sovereign-blue))]/50 hover-elevate cursor-pointer"
                    )}
                    onClick={() => onNavigateToWidget?.(widgetId)}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{WIDGET_LABELS[widgetId] || widgetId}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(widgetId);
                      }}
                      data-testid={`button-remove-favorite-${widgetId}`}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No favorites yet</p>
                  <p className="text-xs mt-1">Click the star on any widget to add it here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

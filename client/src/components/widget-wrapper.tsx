import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, HelpCircle, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Tooltip } from "react-tooltip";

interface WidgetWrapperProps {
  id: string;
  title: string;
  tooltip?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
  onHelpClick?: (widgetId: string) => void;
}

interface UserPreferences {
  auditNotes: string;
  favorites: string[];
  tourCompleted: boolean;
}

export function WidgetWrapper({
  id,
  title,
  tooltip,
  icon,
  badge,
  className,
  headerClassName,
  children,
  onHelpClick,
}: WidgetWrapperProps) {
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/v1/user/preferences"],
  });

  const isFavorite = preferences?.favorites?.includes(id) || false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const currentFavorites = preferences?.favorites || [];
      const newFavorites = isFavorite
        ? currentFavorites.filter(f => f !== id)
        : [...currentFavorites, id];
      
      const res = await apiRequest("PUT", "/api/v1/user/preferences", { favorites: newFavorites });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  const handleHelpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHelpClick?.(id);
  };

  const tooltipId = `tooltip-${id}`;

  return (
    <Card id={id} className={cn("bg-[hsl(var(--card))] border-[hsl(var(--border))]", className)} data-testid={`widget-${id}`}>
      <CardHeader className={cn("pb-2 flex flex-row items-center justify-between gap-2 flex-wrap", headerClassName)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <CardTitle className="text-base truncate">{title}</CardTitle>
          {tooltip && (
            <>
              <Info
                className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0"
                data-tooltip-id={tooltipId}
                data-tooltip-content={tooltip}
              />
              <Tooltip id={tooltipId} place="top" className="max-w-xs z-50" />
            </>
          )}
          {badge}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            data-testid={`button-favorite-${id}`}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpClick}
            data-testid={`button-help-${id}`}
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

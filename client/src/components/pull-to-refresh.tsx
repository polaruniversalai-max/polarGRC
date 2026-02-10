/**
 * Sentinel OS v1.2 - Pull to Refresh Component
 * =============================================
 * Mobile-optimized refresh component with haptic feedback.
 * DeveloperWeek 2026: Replit Mobile $1,000 + iPad Challenge
 * 
 * @component PullToRefresh
 * @version 1.2.0
 */

import { useState, useCallback, useRef } from 'react';
import { RefreshCw, ArrowDown, CheckCircle2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);

  const triggerHaptic = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptic not supported
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      const dampedDistance = Math.pow(distance, 0.8);
      setPullDistance(Math.min(dampedDistance, threshold * 1.5));
      
      if (dampedDistance >= threshold && pullDistance < threshold) {
        triggerHaptic(25);
      }
    }
  }, [isRefreshing, threshold, pullDistance, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic(50);
      
      try {
        await onRefresh();
        triggerHaptic([50, 50, 50]);
        setRefreshComplete(true);
        setTimeout(() => setRefreshComplete(false), 1000);
      } catch {
        triggerHaptic([100, 50, 100]);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    startYRef.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh, triggerHaptic]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing || refreshComplete;

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="pull-to-refresh-container"
    >
      <div 
        className="absolute left-0 right-0 flex items-center justify-center transition-all duration-200 -top-16 z-50"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          opacity: showIndicator ? 1 : 0 
        }}
      >
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full
          ${refreshComplete 
            ? 'bg-emerald-500/20 border-emerald-500/50' 
            : 'bg-[hsl(var(--electric-cyan))]/20 border-[hsl(var(--electric-cyan))]/50'}
          border backdrop-blur-sm
        `}>
          {refreshComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />
          ) : isRefreshing ? (
            <RefreshCw className="w-5 h-5 text-[hsl(var(--electric-cyan))] animate-spin" />
          ) : (
            <ArrowDown 
              className="w-5 h-5 text-[hsl(var(--electric-cyan))] transition-transform"
              style={{ 
                transform: `rotate(${progress >= 1 ? 180 : 0}deg)`,
                opacity: 0.5 + progress * 0.5
              }}
            />
          )}
        </div>
      </div>

      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance * 0.5}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;

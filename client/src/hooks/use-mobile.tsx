/**
 * Sentinel OS v1.2 - Mobile Hooks
 * ================================
 * Hooks for mobile responsiveness and haptic feedback.
 * DeveloperWeek 2026: Replit Mobile $1,000 + iPad Challenge
 * 
 * @module hooks/use-mobile
 * @version 1.2.0
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useHapticFeedback() {
  const vibrate = React.useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration API not supported on this device
      }
    }
  }, []);

  const lightTap = React.useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = React.useCallback(() => vibrate(25), [vibrate]);
  const heavyTap = React.useCallback(() => vibrate(50), [vibrate]);
  const successPattern = React.useCallback(() => vibrate([50, 50, 50]), [vibrate]);
  const errorPattern = React.useCallback(() => vibrate([100, 50, 100, 50, 100]), [vibrate]);
  const onChainConfirm = React.useCallback(() => vibrate([25, 25, 50, 50, 100]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    successPattern,
    errorPattern,
    onChainConfirm
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useDeviceOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

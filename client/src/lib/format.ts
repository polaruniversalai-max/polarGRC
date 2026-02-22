/**
 * Global Number Formatting Utilities
 * Prevents NaN/undefined display issues across all UI components
 */

/**
 * Safe number wrapper - returns fallback for undefined/null/NaN/Infinity
 */
export function safeNumber(val: number | undefined | null, fallback: number = 0): number {
  if (val === undefined || val === null || !Number.isFinite(val)) {
    return fallback;
  }
  return val;
}

/**
 * Format number with locale string and NaN protection
 */
export function formatNumber(val: number | undefined | null, fallback: number = 0): string {
  return safeNumber(val, fallback).toLocaleString();
}

/**
 * Format currency with 2 decimal places
 */
export function formatCurrency(val: number | undefined | null, symbol: string = "$", fallback: number = 0): string {
  return `${symbol}${safeNumber(val, fallback).toFixed(2)}`;
}

/**
 * Format $POLAR token balance
 */
export function formatPolar(val: number | undefined | null, fallback: number = 0): string {
  return `${safeNumber(val, fallback).toFixed(2)} $POLAR`;
}

/**
 * Format credits balance
 */
export function formatCredits(val: number | undefined | null, fallback: number = 0): string {
  return `${safeNumber(val, fallback).toLocaleString()} credits`;
}

/**
 * Format percentage with NaN protection
 */
export function formatPercent(val: number | undefined | null, fallback: number = 0): string {
  return `${safeNumber(val, fallback).toFixed(1)}%`;
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompact(val: number | undefined | null, fallback: number = 0): string {
  const num = safeNumber(val, fallback);
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

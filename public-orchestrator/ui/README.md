# Public Orchestrator - UI Components

This directory contains references to the public UI components used in the Sentinel OS dashboard.

## Component Locations

All UI components are located in `client/src/components/` and `client/src/pages/`:

### Sponsor Integration Components

| Component | File | Sponsor Challenge |
|-----------|------|-------------------|
| AI Insight Modal | `client/src/components/ai-insight-modal.tsx` | Perfect Corp $1,500 |
| Live Audit Map | `client/src/components/live-audit-map.tsx` | Miro Bose/Lego |
| Pull to Refresh | `client/src/components/pull-to-refresh.tsx` | Replit Mobile $1,000 |
| IndiaAI Pack Export | `client/src/components/india-ai-pack-export.tsx` | IndiaAI ₹1 Crore |

### Mobile Hooks

| Hook | File | Purpose |
|------|------|---------|
| useHaptics | `client/src/hooks/use-mobile.tsx` | Haptic feedback patterns |
| useNetworkStatus | `client/src/hooks/use-mobile.tsx` | Offline detection |
| usePullToRefresh | `client/src/hooks/use-mobile.tsx` | Pull gesture handling |

### Core Dashboard

| Page | File | Description |
|------|------|-------------|
| Pharma Dashboard | `client/src/pages/pharma-dashboard.tsx` | Main compliance dashboard |
| Treasury | `client/src/pages/treasury.tsx` | $POLAR token operations |
| Leaderboard | `client/src/pages/leaderboard.tsx` | Compliance XP rankings |

## Styling

- **Theme**: Ultra-dark institutional (charcoal, slate, electric blue)
- **Framework**: Tailwind CSS with custom CSS variables
- **Components**: shadcn/ui built on Radix UI
- **Design System**: Fluent Design adapted for financial dashboards

## Responsive Design

All components are fully responsive with mobile-first breakpoints:

- `sm`: 640px (Mobile landscape)
- `md`: 768px (Tablet)
- `lg`: 1024px (Desktop)
- `xl`: 1280px (Large desktop)

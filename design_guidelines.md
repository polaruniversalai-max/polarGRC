# PolarUniversal AI Agent Dashboard - Design Guidelines

## Design Approach
**System:** Fluent Design (Microsoft) adapted for financial/enterprise dashboards
**Justification:** Data-heavy, mission-critical application requiring institutional credibility. Fluent provides the depth, structure, and professional polish needed for hedge fund/bank environments while supporting complex real-time data visualization.

**Key Principles:**
- Terminal authenticity: Real-world command-line aesthetics with modern polish
- Institutional trust: Every element signals stability and precision
- Information density: Maximize data visibility without overwhelming users
- Instant comprehension: Status should be understood at a glance

## Typography
**Font Families:**
- Primary UI: Inter (via Google Fonts) - clean, professional sans-serif
- Terminal/Logs: JetBrains Mono - monospace for code/hash displays
- Data/Metrics: Tabular figures from Inter for numerical alignment

**Hierarchy:**
- H1 (Dashboard title): text-2xl font-semibold tracking-tight
- H2 (Section headers): text-lg font-medium
- H3 (Component titles): text-sm font-semibold uppercase tracking-wide
- Body: text-sm font-normal
- Terminal text: text-xs font-mono
- Small labels: text-xs font-medium uppercase tracking-wider

## Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing (p-2, gap-2): Within components, terminal lines
- Standard spacing (p-4, gap-4): Between related elements
- Section spacing (p-6, p-8): Card padding, panel separation
- Major spacing (mb-12, mt-16): Between major dashboard sections

**Grid Structure:**
- Sidebar: Fixed width 280px (w-[280px])
- Main content: flex-1 with max-width constraints
- Terminal feed: Full-height scrollable (h-full overflow-auto)

## Component Library

**Sidebar Navigation**
- Fixed left panel with subtle border-right
- Logo/branding at top (h-16)
- Agent Health widget: Circular progress indicator showing uptime percentage
- Compliance Score: Large numeric display (text-4xl) with trend indicator (↑/↓)
- Network Status: Badge showing "Movement M1" with connection indicator dot
- Bottom section: Settings icon, documentation link
- Each widget has p-6 spacing with subtle divider lines

**Main Dashboard Panel**
- Header bar: "Proof of Audit" title + real-time status badge + wallet connection button
- Wallet button: Prominent positioning (top-right), icon + "Connect Movement Wallet" text
- Terminal feed container: Rounded corners (rounded-lg), subtle border, full remaining height

**Terminal Feed Component**
- Auto-scrolling log display with newest entries at bottom
- Each log entry structure:
  - Timestamp (text-xs, muted)
  - Action type badge (pill-shaped, small)
  - Hash display (text-xs font-mono, truncated with ellipsis)
  - Status indicator (icon or dot)
- Line height: leading-relaxed for readability
- Padding between entries: py-2
- Zebra striping on hover for scanning

**x402 Payment Visualization**
- Inline payment flow within terminal:
  1. "402 Payment Required" status line (highlighted row)
  2. Payment processing animation (subtle pulse on status badge)
  3. "$MOVE token settlement" confirmation with transaction hash
  4. "Access granted - Continuing audit" success message
- Visual distinction: These 4-line sequences appear as connected blocks with left border accent

**Status Components**
- Health indicator: Pulsing dot (w-2 h-2 rounded-full) + text label
- Score displays: Large numbers with small delta indicators
- Badges: Rounded-full, px-3 py-1, text-xs uppercase
- Progress bars: Slim (h-1.5), rounded, animated fills

**Data Cards**
- Rounded-lg borders with p-6 internal padding
- Header with icon + title (flex items-center gap-2)
- Primary metric: Large bold numbers
- Supporting metrics: Grid of smaller stats below
- Subtle hover state: Very slight border emphasis (no dramatic effects)

**Interactive Elements**
- Primary button (Wallet connect): px-6 py-2.5, rounded-lg, font-medium, with icon
- Icon buttons: p-2, rounded hover states
- All buttons: Subtle transitions (transition-colors duration-200)
- No hover animations on terminal entries (maintain professional stability)

**Iconography**
- Use Heroicons (outline style for navigation, solid for status indicators)
- Icon sizes: w-5 h-5 for UI elements, w-4 h-4 for inline badges
- Wallet icon, health monitor icon, compliance shield icon, network node icon

## Animations
- Terminal auto-scroll: Smooth scrolling when new entries appear
- Payment settlement: 2-second fade-in for the 402 payment block
- Health pulse: Subtle 2s infinite pulse on active status indicator
- Loading states: Skeleton placeholders for initial data load
- No excessive motion: This is institutional software, not a consumer app

## Critical UX Details
- Terminal must feel authentic: Use realistic blockchain hash formats (0x...)
- Update timing: Visible 5-second intervals with subtle visual feedback
- Compliance score: Range 0-100, show color-coded risk levels via badges only (High/Medium/Low text)
- Network status: Always show "Connected" or "Reconnecting..." states
- Wallet button: Disabled state when connected, showing truncated address

## Responsive Behavior
- Desktop-first: Primary use case is large monitors (1920px+)
- Tablet (1024px): Sidebar collapses to icons-only
- Mobile: Stack vertically, sidebar becomes bottom navigation
- Terminal feed: Maintains full functionality at all breakpoints with horizontal scroll for long hashes

**No Images Required:** This is a pure data/terminal interface. All visual interest comes from typography, spacing, and real-time data displays.
# Next-Gen Multi-Asset Trading Platform - Design Guidelines

## Design Approach
**Reference-Based:** Inspired by Bloomberg Terminal's information density + Linear's refined UI + cinematic sci-fi interfaces (Blade Runner aesthetic). Creating a unique futuristic trading platform for professional traders - NOT copying existing trading platforms like Robinhood, Binance, or traditional brokerages.

**Core Philosophy:** Premium, data-rich experience with glass-morphism depth, strategic neon accents, and real-time streaming emphasis. Desktop-first for pro traders and institutional users.

## Color System
- **Background Base:** `#0F0F12` (deep near-black)
- **Elevated Panels:** `#1B1B1F` (cards, modals)
- **Primary Gradient:** `#FF7A00` → `#FF4500` (vibrant orange to deep orange-red)
- **Neon Glow Accent:** `rgba(255, 90, 0, 0.14)` (subtle ambient lighting)
- **Success/Positive:** Teal/cyan tones for gains, confirmations
- **Danger/Negative:** Red gradient for losses, destructive actions
- **Text:** High-contrast whites (#FFFFFF, #E5E5E5) and grays (#8A8A8A) for WCAG AA compliance

## Typography
**Fonts:** Inter Tight (condensed, modern) from Google Fonts for all text
**Hierarchy:**
- **Display/Hero:** 42-56px, bold condensed
- **Section Headers:** 28-36px, semibold condensed  
- **Card Titles:** 18-22px, semibold
- **Data/Body:** 13-16px, medium
- **Small Labels:** 11-13px, medium

**Implementation:** Emphasize numerical data with tabular figures, tight letter-spacing (-0.02em) for condensed headers, normal spacing for body text.

## Layout System
**Spacing Primitives:** Use Tailwind units: 1, 2, 4, 6, 8, 12, 16, 20, 24
- **Micro spacing:** `gap-1`, `gap-2` for tight data grids
- **Component padding:** `p-4`, `p-6` for cards
- **Section spacing:** `py-12`, `py-16`, `py-20` for page sections
- **Page margins:** `px-6` to `px-12`

**Breakpoints:** Desktop-first at 1440px → 1024px → 768px → 360px

## Visual Treatment

### Glass-morphism Panels
Semi-transparent backgrounds (`rgba(27, 27, 31, 0.85)`) with backdrop blur (12-16px), subtle 1px borders with orange glow (`rgba(255, 122, 0, 0.2)`), layered shadows for depth hierarchy.

### Depth & Shadows
Multi-layer soft shadows on elevated elements: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 48px rgba(255, 90, 0, 0.08)` for glass panels. Stronger glow on interactive/active trading elements.

### Real-Time Data Effects
Pulse glow on live-updating values, subtle color flash on change (green up, red down with 300ms transition), smooth number counter animations, no jarring effects.

## Component Library

### Buttons
- **Primary CTA:** Orange gradient fill, enhanced glow on hover, semibold text
- **Secondary:** Transparent with orange border, gradient fill on hover
- **Danger:** Red gradient for sell orders/destructive actions
- **Ghost:** Minimal text-only for tertiary actions
- **Buttons on Images:** Apply backdrop blur (`blur-md`) to button backgrounds when placed over hero images or any visual content

### Data Grids & Tables
Virtualized scrolling for performance, sticky glass-morphic headers, row hover highlights, sortable columns with indicators, monospace numbers for alignment, compact row height (40-48px).

### Inputs & Forms
Dark backgrounds (`#1B1B1F`), subtle borders, orange focus glow, inline validation, autocomplete for symbols/tickers, prominent labels.

### Cards
Glass-morphism base, gradient overlays for dimensionality, shadow depth by importance level, compact variants for dense dashboards.

### Charts
TradingView integration with dark theme, candlestick primary view, depth charts for order books, sparklines for trends, custom orange/teal/red color scheme.

### Modals
Full-screen dark backdrop with blur, centered glass panels (max-width 600-900px), smooth scale-in entrance, click-outside to close.

## Page Layouts

### Landing Page (5-7 Sections)
1. **Hero:** Full-width cinematic background image (1440px+) with gradient overlay (orange-to-black left-to-right for readability). Display headline (56px), subheadline, primary CTA with blurred background, trust indicators ("$2B+ traded daily"). Height: 85vh.
2. **Multi-Asset Showcase:** 3-column grid of asset types (Stocks, Crypto, Forex) with glass cards, icons, feature bullets.
3. **Trading Terminal Preview:** Full-width screenshot/mockup of terminal interface with annotation callouts.
4. **Advanced Analytics:** 2-column split - left: feature list, right: chart visualization.
5. **Security & Compliance:** 4-column badges/certifications with descriptions.
6. **Testimonials:** 3-column cards with trader photos, quotes, performance stats.
7. **Final CTA:** Centered section with gradient background, headline, CTA buttons.

### Trading Terminal
**Layout:** Dockable panels - Chart (60% width left), Order Panel (20% right sidebar), Order Book (top-right 20%), Depth Chart (bottom-right 20%). Glass panels with resize handles. Real-time websocket updates with pulse effects on order book changes. Quick order entry form with one-click buy/sell execution.

### Dashboard  
**Hero Metrics:** 3-card row - Total Balance, 24h P&L, Portfolio Value with large numbers (36px), sparkline trends, percentage changes.
**Grid Layout:** 2-column for watchlist + recent trades, full-width ticker carousel, AI insights panel with orange accent border.

### Market Watch
Grid/list toggle view, drag-drop watchlist reordering, chip-based filters (asset type, volume, gainers/losers), fuzzy search with instant results, sortable columns.

### Portfolio
**Allocation:** 3D donut chart visualization with hover tooltips, performance heatmap grid, transaction timeline with date grouping, export buttons (CSV/PDF).

### KYC Workflow
Multi-step wizard (4 steps) with visual progress indicator, drag-drop document upload with thumbnails, real-time validation, status badge tracking.

### Admin Dashboard
User management grid with virtualized table, KYC review queue (card-based interface), real-time trade stream feed, large metric cards with trend indicators.

## Images

### Landing Page Hero
**Image Type:** Abstract fintech visualization - glowing network nodes connecting across dark space, or futuristic holographic trading floor with depth of field bokeh. Professional photography quality.
**Placement:** Full viewport width (100vw), 85vh height
**Treatment:** Gradient overlay (orange `#FF7A00` at 40% opacity on left fading to black on right) for text readability
**Purpose:** Establish premium, cinematic tone immediately

### Additional Images
Trading terminal preview screenshots, chart visualizations, security certification badges, trader testimonial photos (professional headshots with subtle orange rim lighting effect).

## Animations
**Minimal Approach:** Only for functional feedback and real-time updates.
- Pulse effects on live data values (300ms cycles)
- Smooth transitions for state changes (200-300ms)
- Number counter animations for balance updates
- Chart line drawing animations on load (once only)
- NO decorative scroll animations, parallax, or continuous motion

## Responsive Strategy
**1440px:** Full layout with all panels visible
**1024px:** Simplified terminal with collapsible sidebars  
**768px:** Single-column stack, bottom sheet modals
**360px:** Mobile-optimized with bottom navigation bar, full-screen chart view
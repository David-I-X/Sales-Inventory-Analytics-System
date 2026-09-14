---
name: ui-ux-design-system
description: >-
  Use this skill when improving the visual aesthetics, UI polish, or design system of the
  SaaS Vertical frontend. Covers CSS design tokens, component styling, micro-interactions,
  layout refinements, color palettes, typography, spacing, animations, and visual hierarchy.
  Activate when the user asks to "mejorar el diseño", "pulir la estética", "hacer más bonito",
  "rediseñar", "UI/UX", "diseño profesional", or any visual improvement request.
---

# UI/UX Design System — SaaS Vertical

## Project Context

- **Stack**: React 19 + TypeScript + Vite 8 + CSS custom properties (NO Tailwind CSS installed)
- **Icons**: `@tabler/icons-react` v3
- **Font**: Inter (Google Fonts)
- **CSS Architecture**: Two files:
  - `src/styles/index.css` — Reset, design tokens (`:root` variables), dark theme, base elements
  - `src/styles/components.css` — Component classes (`.btn`, `.card`, `.table`, `.modal`, `.sidebar`, etc.)
- **Pages**: Dashboard, Contacts, Invoices, Inventory, Purchases, Accounting, MlEngine, Users, Profile, Login
- **Layout**: Sidebar + Header + Content area (`src/components/layout/`)
- **Build output**: `backend/app/static/spa/` (monorepo served by FastAPI)

## Design Philosophy

This SaaS targets **Colombian SME owners** (workshops, security tech installers, distributors) who are
**non-technical**. The design must be:

1. **Clean & Spacious** — Generous whitespace, no visual clutter
2. **Warm & Trustworthy** — Professional but approachable, not cold/corporate
3. **Data-First** — Numbers and KPIs should be the visual hero, not decorations
4. **Accessible** — High contrast ratios, clear labels in Spanish, large click targets
5. **Consistent** — Every component uses design tokens; no hardcoded colors or magic numbers

## Design Tokens Reference

All tokens live in `:root` in `src/styles/index.css`. When modifying:

### Colors
```css
--bg-canvas       /* Page background */
--bg-surface      /* Card/panel background */
--bg-elevated     /* Sidebar, elevated panels */
--bg-hover        /* Hover states */
--text-primary    /* Main text */
--text-secondary  /* Labels, descriptions */
--text-muted      /* Disabled, hints */
--border-default  /* Light borders */
--border-strong   /* Emphasized borders */
--accent-primary  /* CTA buttons, links */
--accent-success  /* Positive indicators */
--accent-warning  /* Caution indicators */
--accent-danger   /* Error, destructive */
```

### Geometry
```css
--radius-sm: 6px   --radius-md: 8px   --radius-lg: 12px   --radius-full: 9999px
--shadow-sm        --shadow-md
--space-1 to --space-8 (4px scale: 4, 8, 12, 16, 24, 32, 48, 64)
```

### Layout
```css
--sidebar-width: 240px
--sidebar-collapsed-width: 64px
--header-height: 56px
```

## Improvement Checklist

When tasked with improving aesthetics, evaluate and address these areas:

### 1. Color Palette Refinement
- [ ] Ensure accent colors pass WCAG AA contrast (4.5:1 for text)
- [ ] Add subtle gradient or tinted backgrounds for visual warmth
- [ ] Introduce a secondary accent color for variety without chaos
- [ ] Make dark theme equally polished (not just inverted)

### 2. Typography & Hierarchy
- [ ] Establish clear heading scale (h1: 24px, h2: 18px, h3: 15px)
- [ ] Use font-weight variation (300, 400, 500, 600, 700) purposefully
- [ ] Add letter-spacing to uppercase section titles
- [ ] Ensure monospace font for financial numbers (`font-variant-numeric: tabular-nums`)

### 3. Spacing & Layout
- [ ] Consistent padding in cards, modals, tables
- [ ] Section spacing between dashboard blocks (24px minimum)
- [ ] Table cell padding comfortable for scanning
- [ ] Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)

### 4. Component Polish
- [ ] Buttons: Add subtle hover lift (`transform: translateY(-1px)`)
- [ ] Cards: Consider hover elevation effect
- [ ] Badges: Slightly larger padding for readability
- [ ] Modals: Smooth entry animation (`@keyframes fadeIn + slideUp`)
- [ ] Tables: Zebra striping or row hover with subtle highlight
- [ ] Inputs: Focus ring with brand color glow
- [ ] Sidebar: Active item with left accent bar or colored indicator

### 5. Micro-Interactions & Animations
- [ ] Page transitions (fade in content on route change)
- [ ] Button press effect (`:active { transform: scale(0.98) }`)
- [ ] Card hover elevation shift
- [ ] Loading skeletons with shimmer animation (already exists, verify quality)
- [ ] Toast notifications slide-in from bottom-right
- [ ] Number counters with CSS animation on first render

### 6. Visual Indicators
- [ ] Stat cards: Colored left/top border accent matching the metric type
- [ ] Status badges: Dot indicator + text (not just colored text)
- [ ] Low stock alerts: Pulsing amber glow
- [ ] Profitability: Green gradient background when profitable
- [ ] Empty states: Illustrated SVG or icon + helpful message

### 7. Login Page
- [ ] Full-screen gradient or subtle pattern background
- [ ] Centered card with shadow depth
- [ ] Brand logo/icon at top
- [ ] Smooth input focus transitions
- [ ] Loading state on submit button

### 8. Sidebar Polish
- [ ] Logo area with brand styling
- [ ] Section dividers with labels
- [ ] Active item: left border accent + background tint
- [ ] Collapse animation: smooth width transition
- [ ] Bottom section: user avatar + logout clearly separated

## CSS-Only Techniques (No External Libraries)

Since we don't have Tailwind, use these patterns:

```css
/* Glassmorphism card */
.card-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Gradient accent border */
.card-accent {
  border-left: 3px solid;
  border-image: linear-gradient(to bottom, var(--accent-primary), var(--accent-success)) 1;
}

/* Smooth hover elevation */
.card-hover {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

/* Pulsing alert */
@keyframes pulse-amber {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
}
.alert-pulse { animation: pulse-amber 2s infinite; }

/* Number animation */
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-value { animation: countUp 0.4s ease-out; }
```

## Tailwind CSS Utility Classes in JSX

The project uses inline Tailwind-like class names in JSX (e.g., `text-2xl`, `font-bold`, `gap-4`).
These are **NOT from a Tailwind installation** — they must be defined in `components.css` as custom
utility classes if you want them to work, OR the page components need to use inline styles / CSS
custom properties instead.

**Current approach**: Pages use a mix of:
1. CSS classes from `components.css` (`.btn`, `.card`, `.table`, `.stat-card`, etc.)
2. Inline styles for layout (`style={{ display: 'flex', gap: '16px' }}`)
3. Tailwind-like class names that rely on a utility CSS framework

**Recommended fix**: Either install Tailwind CSS or convert all utility classes to proper CSS
in `components.css`.

## Build & Verify

After any CSS or component changes:

```bash
cd frontend
npm run build          # TypeScript check + Vite production bundle
# Output goes to: ../backend/app/static/spa/
```

Then verify visually at `http://localhost:8080` (FastAPI serves the SPA).

## File Map

| File | Purpose |
|------|---------|
| `src/styles/index.css` | Design tokens, reset, dark theme |
| `src/styles/components.css` | Component class definitions |
| `src/pages/Login.tsx` | Login page (full-screen, no layout) |
| `src/pages/Dashboard.tsx` | Executive dashboard (3 pillars) |
| `src/pages/Inventory.tsx` | Product catalog + movements + KPIs |
| `src/pages/Purchases.tsx` | Purchase orders + supplier management |
| `src/pages/Accounting.tsx` | P&L, cash flow, expenses, CSV export |
| `src/components/layout/Sidebar.tsx` | Collapsible sidebar navigation |
| `src/components/layout/Header.tsx` | Top header bar |
| `src/components/layout/AppLayout.tsx` | Layout wrapper |

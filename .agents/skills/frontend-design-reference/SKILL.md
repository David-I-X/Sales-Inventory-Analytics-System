---
name: frontend-design-reference
description: >-
  Visual design reference and inspiration guide for SaaS dashboard UIs.
  Contains curated patterns from top SaaS products (Linear, Vercel, Stripe, Notion)
  with CSS implementation examples. Use when seeking design inspiration or implementing
  specific UI patterns like data tables, stat cards, navigation, forms, or charts.
---

# Frontend Design Reference — SaaS Dashboard Patterns

## Inspiration Sources

These are the gold-standard SaaS products whose visual language we draw from:

| Product | What to Learn |
|---------|---------------|
| **Linear** | Keyboard-first UX, clean sidebar, minimal chrome, purple accents |
| **Vercel** | Black/white contrast, generous spacing, mono typography for data |
| **Stripe** | Gradient accents, layered cards, financial dashboard patterns |
| **Notion** | Warm grays, readable typography, icon + text nav items |
| **Twenty CRM** | Our direct inspiration — sidebar structure, contact management |

## Color Palette Recipes

### Recipe 1: "Corporate Blue" (Current)
```
Primary: #1A56DB → Professional, trustworthy
Success: #059669 → Financial positive
Warning: #D97706 → Attention, low stock
Danger:  #DC2626 → Error, losses
```

### Recipe 2: "Warm Indigo" (Recommended Upgrade)
```
Primary: #4F46E5 (Indigo 600) → Modern, energetic
Primary Hover: #4338CA (Indigo 700)
Secondary: #0EA5E9 (Sky 500) → Complementary
Surface: #FAFBFF → Slight blue tint for warmth
Canvas: #F5F7FF → Softer than pure gray
Success: #10B981 (Emerald 500) → Brighter green
Warning: #F59E0B (Amber 500)
Danger:  #EF4444 (Red 500)
```

### Recipe 3: "Dark Elegance" (Dark Theme)
```
Canvas:    #0A0A0F → Deep navy-black
Surface:   #12121A → Elevated panels
Elevated:  #1A1A2E → Sidebar, modals
Hover:     #22223A → Interactive hover
Border:    #2A2A40 → Subtle separation
Text:      #E8E8F0 → Soft white
Secondary: #8888AA → Subdued labels
Accent:    #818CF8 (Indigo 400) → Pops on dark
```

## Component Patterns

### Stat Cards (Financial KPIs)

**Pattern A: Border Accent Card**
```css
.stat-card-accent {
  position: relative;
  padding: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}
.stat-card-accent::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--card-accent-color, var(--accent-primary));
  border-radius: 12px 0 0 12px;
}
.stat-card-accent .stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.stat-card-accent .stat-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-card-accent .stat-change {
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

**Pattern B: Gradient Background Card**
```css
.stat-card-gradient {
  padding: 20px;
  border-radius: 12px;
  color: white;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}
```

### Data Tables

**Pattern: Stripe-style table**
```css
.table-modern {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.table-modern th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  background: var(--bg-canvas);
  border-bottom: 2px solid var(--border-default);
  position: sticky;
  top: 0;
  z-index: 1;
}
.table-modern td {
  padding: 12px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-default);
  vertical-align: middle;
}
.table-modern tbody tr {
  transition: background-color 150ms ease;
}
.table-modern tbody tr:hover {
  background-color: var(--bg-hover);
}
/* Zebra striping */
.table-modern tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.015);
}
```

### Navigation Sidebar

**Pattern: Linear-style sidebar**
```css
.sidebar-modern {
  background: var(--bg-elevated);
  border-right: 1px solid var(--border-default);
}
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 2px 8px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all 150ms ease;
  cursor: pointer;
  text-decoration: none;
}
.sidebar-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.sidebar-nav-item-active {
  background: var(--bg-surface);
  color: var(--accent-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.sidebar-section-label {
  padding: 16px 20px 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
```

### Form Inputs

**Pattern: Modern input with floating label**
```css
.input-modern {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border-default);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-surface);
  color: var(--text-primary);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.input-modern:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
.input-modern::placeholder {
  color: var(--text-muted);
}
```

### Badges & Status Indicators

**Pattern: Dot + Text badge**
```css
.badge-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}
.badge-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
```

## Animation Library

```css
/* Fade in from below */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in (for modals) */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide in from right (for slide-overs) */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Shimmer loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Subtle pulse for alerts */
@keyframes subtlePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Usage classes */
.animate-fadeInUp { animation: fadeInUp 0.3s ease-out both; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out both; }
.animate-slideInRight { animation: slideInRight 0.3s ease-out both; }
.animate-shimmer {
  background: linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-elevated) 50%, var(--bg-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Stagger children */
.stagger-children > * {
  animation: fadeInUp 0.3s ease-out both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
```

## Responsive Breakpoints

```css
/* Mobile first, then scale up */
@media (min-width: 640px)  { /* sm: tablets portrait */ }
@media (min-width: 768px)  { /* md: tablets landscape */ }
@media (min-width: 1024px) { /* lg: desktop */ }
@media (min-width: 1280px) { /* xl: large desktop */ }

/* Sidebar behavior */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    z-index: 50;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 49;
  }
}
```

## Decision: Tailwind CSS

The project currently does **NOT** have Tailwind CSS installed. Pages use utility-like class names
(`text-2xl`, `font-bold`, `gap-4`, `grid grid-cols-3`, etc.) in JSX, but these classes are not
defined anywhere — they rely on the browser ignoring unknown classes and the layout working via
inline styles or flex/grid defaults.

**If installing Tailwind**: Run `npm install -D tailwindcss @tailwindcss/vite` and configure Vite.
This would make all utility classes in JSX actually work.

**If NOT installing Tailwind**: All utility classes must be defined in `components.css` as custom
utilities, or components must be refactored to use CSS classes from the design system.

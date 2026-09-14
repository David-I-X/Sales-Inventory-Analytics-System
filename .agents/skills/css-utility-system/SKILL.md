---
name: css-utility-system
description: >-
  Provides a comprehensive set of CSS utility classes for the SaaS Vertical project.
  Use when the agent needs to add layout, spacing, typography, flexbox, grid, or
  responsive utilities to components without Tailwind CSS. Contains ready-to-paste
  CSS utility definitions compatible with the existing design token system.
---

# CSS Utility System — Tailwind-Compatible Classes

Since this project does not use Tailwind CSS, this skill provides equivalent utility
classes that can be added to `src/styles/components.css`.

## How to Use

Copy the needed utility sections into `src/styles/components.css`. Only add what you
actually need to keep the CSS bundle small.

## Display & Visibility

```css
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
```

## Flexbox

```css
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-grow { flex-grow: 1; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.self-start { align-self: flex-start; }
.self-center { align-self: center; }
.self-end { align-self: flex-end; }
```

## Grid

```css
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.col-span-2 { grid-column: span 2 / span 2; }
.col-span-3 { grid-column: span 3 / span 3; }
.col-span-full { grid-column: 1 / -1; }
```

## Gap / Spacing

```css
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-5 { gap: 24px; }
.gap-6 { gap: 32px; }
.gap-8 { gap: 64px; }
```

## Padding

```css
.p-0 { padding: 0; }
.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 24px; }
.p-6 { padding: 32px; }
.p-8 { padding: 64px; }

.px-1 { padding-left: 4px; padding-right: 4px; }
.px-2 { padding-left: 8px; padding-right: 8px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.px-4 { padding-left: 16px; padding-right: 16px; }
.px-5 { padding-left: 24px; padding-right: 24px; }

.py-1 { padding-top: 4px; padding-bottom: 4px; }
.py-2 { padding-top: 8px; padding-bottom: 8px; }
.py-3 { padding-top: 12px; padding-bottom: 12px; }
.py-4 { padding-top: 16px; padding-bottom: 16px; }
.py-6 { padding-top: 32px; padding-bottom: 32px; }
.py-8 { padding-top: 64px; padding-bottom: 64px; }
.py-12 { padding-top: 96px; padding-bottom: 96px; }

.pt-1 { padding-top: 4px; }
.pt-2 { padding-top: 8px; }
.pb-2 { padding-bottom: 8px; }
.pl-3 { padding-left: 12px; }
.pr-3 { padding-right: 12px; }
```

## Margin

```css
.m-0 { margin: 0; }
.m-auto { margin: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mb-1 { margin-bottom: 4px; }
.mb-1\.5 { margin-bottom: 6px; }
.mb-2 { margin-bottom: 8px; }
.ml-1 { margin-left: 4px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
```

## Width & Height

```css
.w-full { width: 100%; }
.w-auto { width: auto; }
.w-8 { width: 32px; }
.w-16 { width: 64px; }
.w-24 { width: 96px; }
.w-28 { width: 112px; }
.w-36 { width: 144px; }
.w-48 { width: 192px; }
.w-64 { width: 256px; }
.h-2 { height: 8px; }
.h-2\.5 { height: 10px; }
.h-8 { height: 32px; }
.h-full { height: 100%; }
.min-h-screen { min-height: 100vh; }
.max-w-md { max-width: 448px; }
```

## Typography

```css
.text-xs { font-size: 12px; line-height: 1.4; }
.text-sm { font-size: 13px; line-height: 1.5; }
.text-base { font-size: 14px; line-height: 1.5; }
.text-lg { font-size: 16px; line-height: 1.5; }
.text-xl { font-size: 18px; line-height: 1.4; }
.text-2xl { font-size: 24px; line-height: 1.3; }
.text-3xl { font-size: 30px; line-height: 1.2; }

.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.font-mono { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.uppercase { text-transform: uppercase; }
.capitalize { text-transform: capitalize; }
.lowercase { text-transform: lowercase; }

.tracking-wider { letter-spacing: 0.05em; }
.tracking-widest { letter-spacing: 0.1em; }

.leading-tight { line-height: 1.25; }
.leading-relaxed { line-height: 1.625; }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.whitespace-nowrap { white-space: nowrap; }
```

## Colors (Text)

```css
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }

.text-emerald-600 { color: #059669; }
.text-red-600 { color: #DC2626; }
.text-red-700 { color: #B91C1C; }
.text-amber-600 { color: #D97706; }
.text-amber-700 { color: #B45309; }
.text-amber-800 { color: #92400E; }
.text-amber-900 { color: #78350F; }
.text-blue-600 { color: #2563EB; }
.text-blue-700 { color: #1D4ED8; }
.text-purple-600 { color: #9333EA; }
.text-gray-700 { color: #374151; }
```

## Colors (Background)

```css
.bg-white { background-color: #FFFFFF; }
.bg-gray-50 { background-color: #F9FAFB; }
.bg-gray-100 { background-color: #F3F4F6; }
.bg-red-50 { background-color: #FEF2F2; }
.bg-emerald-50 { background-color: #ECFDF5; }
.bg-amber-50 { background-color: #FFFBEB; }
.bg-amber-100 { background-color: #FEF3C7; }
.bg-blue-50 { background-color: #EFF6FF; }
.bg-purple-50 { background-color: #FAF5FF; }

/* With opacity */
.bg-gray-50\/50 { background-color: rgba(249, 250, 251, 0.5); }
.bg-amber-50\/30 { background-color: rgba(255, 251, 235, 0.3); }
```

## Borders

```css
.border { border: 1px solid var(--border-default); }
.border-0 { border: 0; }
.border-t { border-top: 1px solid var(--border-default); }
.border-b { border-bottom: 1px solid var(--border-default); }
.border-l-4 { border-left-width: 4px; border-left-style: solid; }
.border-default { border-color: var(--border-default); }
.border-red-200 { border-color: #FECACA; }
.border-amber-200 { border-color: #FDE68A; }
.border-amber-300 { border-color: #FCD34D; }
.border-purple-200 { border-color: #E9D5FF; }
.border-l-emerald-500 { border-left-color: #10B981; }
.border-l-red-500 { border-left-color: #EF4444; }
.border-l-blue-500 { border-left-color: #3B82F6; }
.border-l-amber-500 { border-left-color: #F59E0B; }

.rounded { border-radius: 6px; }
.rounded-md { border-radius: 8px; }
.rounded-lg { border-radius: 12px; }
.rounded-full { border-radius: 9999px; }
```

## Overflow & Position

```css
.overflow-hidden { overflow: hidden; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.top-0 { top: 0; }
.right-0 { right: 0; }
.z-10 { z-index: 10; }
.z-50 { z-index: 50; }
```

## Visual Effects

```css
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow-md { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.opacity-60 { opacity: 0.6; }
.transition-all { transition: all 150ms ease; }
.transition-colors { transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease; }
.hover\:underline:hover { text-decoration: underline; }
```

## Responsive Prefixes

```css
@media (min-width: 640px) {
  .sm\:flex-row { flex-direction: row; }
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sm\:items-center { align-items: center; }
  .sm\:w-48 { width: 192px; }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

## Animations

```css
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## Compound Utilities (Space-Y)

```css
.space-y-1 > * + * { margin-top: 4px; }
.space-y-2 > * + * { margin-top: 8px; }
.space-y-2\.5 > * + * { margin-top: 10px; }
.space-y-3 > * + * { margin-top: 12px; }
.space-y-4 > * + * { margin-top: 16px; }
.space-y-6 > * + * { margin-top: 24px; }
```

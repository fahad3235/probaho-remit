# DESIGN_SYSTEM.md — Titan visual language

## 1. Art direction
Premium fintech console: deep navy surfaces, restrained teal accents, generous whitespace,
tabular numerals for money. Trustworthy, editorial, calm — never a generic AI dashboard.

## 2. Tokens (`css/tokens.css` — the single source of truth)
- `--navy-950 #08111F` · `--navy-800 #101D30` · `--navy-700 #14243A`
- `--bg #F5F7FA` · `--surface #FFFFFF`
- `--teal #16C7B7` · `--teal-deep #0B8F86` · `--teal-tint #E3F7F4`
- `--ink #142033` · `--ink-2 #64748B` · `--line #E2E8F0`
- `--ok #16835D` · `--warn #B7791F` · `--crit #C83D4D` · `--high #D9622B` (HIGH ≠ CRITICAL)
- Type: Inter with system-ui fallback (no webfont download required); `ui-monospace` for
  references; `font-variant-numeric: tabular-nums` on all money (`.num`).

## 3. Rules
- Risk states are **never colour-alone**: every severity pairs colour with a text label and icon.
- Focus is always visible: 3px teal outline, offset 2px.
- Touch targets ≥ 44px (36px for explicitly small controls).
- `prefers-reduced-motion` disables animation globally.
- Demo labelling uses a dashed amber `DEMO DATA` badge — visually distinct from status badges.

## 4. Components
Cards, KPI tiles, data tables (scroll regions on mobile), key-value blocks, modal (focus trap,
Esc, labelled), toasts (aria-live), chat bubbles, verdict panels with SVG gauges, SVG line chart
with MA overlay + text summary fallback, timeline, checklist, progress bars, receipt with
dashed "SIMULATED RECORD" stamp.

## 5. Layout
Sticky blurred header with persistent demo badge; centred 1200px canvas; navy hero on landing;
footer carries the full simulation disclosure. Mobile ≤900px: hamburger → drawer; grids collapse;
tables scroll horizontally; hero stacks; chat and modals fit the viewport.

# ADMIN_PORTAL_SPEC.md — hidden admin console (Master Prompt v3)

## 1. Purpose
A demonstration operations console for staff: review and tune the synthetic
demo configuration (copy, corridors, providers, FX seeds, risk rules, tuition
seeds, ledger, payout routes, KYC queue, reports, demo users, audit log, settings). It manages **demo content
only**. It cannot move money, verify real beneficiaries, or protect real data.

## 2. Authentication mode: **B — clearly labeled demo sign-in (hardened)**

**Two separate sign-ins exist:**
- `#/` — public site entry: one demo account (`demo@probaho.demo`), explores the demo only.
- `#/sign-in` — staff console: three role accounts, with the protections below.
A public session never skips the staff sign-in; a staff session may browse the public demo.

**Staff console protections (real client-side measures):**
- 5 failed attempts → 15-minute lockout. The counter is persisted, so refreshing the page
  does not reset it. The lockout message shows remaining time; the form re-enables automatically.
- 30 minutes of inactivity → automatic staff sign-out (with audit event + toast).
- Every failed staff sign-in is audit-logged (email only — passwords are never logged).
- Sessions stay in-memory only; absolute 8-hour expiry; refresh signs out.

**Honesty boundary (unchanged):** a static site cannot truly protect anything server-side,
so the staff page keeps its plain "not real authentication" disclosure, and the console
lists its protections as demo-grade. A production system would enforce all of this server-side.
- No backend, no identity provider, no server-side authorization exists in a
  static deployment — so no production authentication is claimed.
- Three **public** demo accounts are printed on the sign-in screen itself:
  `owner@probaho.demo`, `editor@probaho.demo`, `viewer@probaho.demo`
  (password `demo1234` for all). They are not secrets.
- Session is **in-memory only** (a JS variable). Refreshing the page or
  closing the tab signs the user out. Absolute expiry: 8 hours.
- Nothing secret is persisted: no passwords, no keys in `localStorage`.
- The sign-in page states, in plain words, that this is not real authentication.

## 3. Routes
Public: `#/sign-in` — **not linked** from the header, footer, drawer, module
cards, or any menu. Direct destination for staff.

Admin namespace (also unlinked from public navigation):
`#/admin` (overview), `#/admin/content`, `#/admin/corridors`,
`#/admin/providers`, `#/admin/fx-data`, `#/admin/scamshield-rules`,
`#/admin/tuition`, `#/admin/vault`, `#/admin/kyc`, `#/admin/payout-routes`,
`#/admin/reports`, `#/admin/users`, `#/admin/audit`, `#/admin/settings`.

## 4. Guard behaviour
- Opening any `#/admin/*` route with no session renders the sign-in screen —
  **no protected content renders first** (guard runs synchronously in the
  router before module render).
- After sign-in the user returns to the originally requested admin route.
- A signed-in role without permission for a section sees an access-denied
  page, not the section.
- Sign-out clears the in-memory session immediately; admin views become
  unreachable without signing in again.
- "Hidden is not secure": route hiding is a UX requirement. The console is
  honest that client-side checks are not a security boundary (stated in the
  console chrome and in SECURITY_MODEL.md).

## 5. Roles (demo conveniences, not a security boundary)
| Role   | May view | May change |
|--------|----------|------------|
| owner  | everything | everything (users, settings, resets) |
| editor | overview, content, corridors, providers, fx-data, rules, tuition, vault, payout-routes, reports, audit | content, corridors, providers, fx-data, rules, tuition seeds, payout routes |
| viewer | overview, vault, reports, audit | nothing (read-only) |

Permission checks run both in the sidebar (hide sections) **and** in every
action handler. Viewers see a read-only notice instead of save controls.

## 6. Sections
1. **Overview** — KPI cards computed from actual local state (drafts, seeded
   ledger rows, enabled corridors/providers, open deadlines, audit events),
   system checklist, recent audit activity, quick actions. All figures labeled
   synthetic/demo.
2. **Content** — plain-text editing of hero copy, CTAs, module-card text, demo
   badge label, disclaimer. Character limits, live preview, restore defaults.
   All saved copy is HTML-escaped on render (no markup/script injection).
3. **Corridors** — enable/disable, edit display name, cities, 3-letter currency
   codes, illustrative reference rate, FX seed, blurb. Validation on save.
   At least one corridor must stay enabled. Public optimizer/FX read the same
   effective data.
4. **Providers** — edit the five fictional providers' flat fee, % fee, spread,
   delivery estimate, note, enabled flag. Validated ranges; the public
   optimizer recalculates through the shared `FinancialEngine` immediately.
5. **FX Data** — inspect the seeded 90-day series (KPIs + sparkline), regenerate
   deterministically from a chosen integer seed, restore the original seed.
6. **ScamShield Rules** — weight editor (0–30) + enable/disable per rule, with a
   **live preview** of both reference sample scores computed through the
   central `RiskEngine` before saving. Scores stay clamped 0–100; severity
   bands unchanged. One-click restore to defaults (scam 96 / legit 0).
7. **Tuition Seeds** — edit budget defaults, add/edit/remove example deadlines,
   edit checklist labels. Editing seeds changes what a planner *reset*
   restores; it never touches the live planner silently. A separate confirmed
   action resets the live planner to the seeds.
8. **Vault** — filter/search the synthetic ledger + simulated drafts, KPIs,
   confirmed clearing of drafts. No execute/settle/reverse actions exist.
9. **KYC Queue** — **SIMULATED** identity-review queue: 6 fictional applicants
   (name, country, documents, submitted date). Owner can approve/reject with a
   reason (required, audit-logged); decisions are stored as admin overrides.
   Banner states nothing is really verified.
10. **Payout Routes** — illustrative payout methods per corridor (bank, wallet,
    cash pickup) with timing, 1–5 trust score, notes, enable/disable. Edits
    flow into the public Send flow through the shared override layer.
11. **Reports** — two local demo queues: ScamShield session scans (score,
    severity, rule ids — **never** message text) and support tickets from the
    Help page (view, resolve/reopen; owner-only writes).
12. **Users** — **DEMO USER MANAGEMENT** (simulated): change demo roles,
   enable/disable demo accounts. Disabled accounts cannot sign in; role edits
   apply on next session read. Last active demo owner cannot be demoted or
   disabled; users cannot change their own role.
13. **Audit Log** — local table (time, actor, action, target, result, DEMO
    marker) with filter and owner-only clear. Never logs passwords, keys, or
    pasted content. Labeled local/demo-only, not tamper-proof.
14. **Settings** — product name/tagline, Gemini-field visibility toggle, and
    scoped resets (console config, planner, drafts, full). No secret fields —
    by design.

## 7. Demo vs production
| Demo (this build) | Production (not built) |
|---|---|
| In-memory session, public demo credentials | Trusted identity provider, server sessions |
| Client-side role flags (inspectable) | Server-side authorization, least privilege |
| Local audit log (not tamper-proof) | Append-only audit trail, monitoring |
| localStorage demo data | Encrypted store, retention policies, backups |
| No secrets in bundle | Secret manager, no keys in frontend |

The console chrome carries a permanent "STATIC DEMO" notice linking to this
distinction.

# SECURITY_MODEL.md — honest boundaries for a static demo

## 1. What this demo does NOT have (by design)
Real identity verification, bank-account verification, regulatory onboarding, AML/KYC workflow,
sanctions screening, live payment rails, server-side authorization, secret management, real-time
fraud intelligence, or guaranteed fraud prevention. Good front-end practices ≠ banking security.

## 2. Browser security
- No `eval()` / `new Function()`; no `innerHTML` with untrusted data (user text renders via
  `textContent`; only caller-owned template strings use `innerHTML`, with `U.esc()` on variables).
- All amount/message/date inputs validated at the boundary; XSS payloads verified escaped in QA.
- No third-party scripts, no analytics, no required network calls. Google Fonts not used
  (system stack) so the app is fully offline-capable.

## 3. Local data
- `localStorage` key `probaho-titan-v1` (versioned; malformed JSON → treated as empty, never crashes;
  unavailable storage → in-memory fallback; app keeps running).
- Persisted: tuition deadlines/checklist/budget + user-created drafts + admin console overrides
  (content copy, corridor/provider edits, FX seeds, risk weights, tuition seeds, settings,
  simulated user list) + local audit log.
- **Never persisted:** pasted ScamShield content, assessments' source text, any API key,
  any password, the demo session (in-memory only).
- The optional Gemini key lives in a module-scoped variable, cleared on "Remove"; entering it is
  explicitly described as browser-visible, not production-secure.

## 3b. Authentication mode: B — clearly labeled demo sign-in
Chosen because this is a static deployment with no backend. Mode A (production
IdP) cannot be honestly implemented here.
- The three demo accounts (`owner@`/`editor@`/`viewer@probaho.demo`, password
  `demo1234`) are **public**, printed on the sign-in screen. They are not secrets
  and are not presented as protecting anything real.
- Session = one in-memory object `{email, name, role, issuedAt}`; 8-hour
  absolute expiry; cleared on sign-out; a page refresh signs the user out.
- Role flags are demo conveniences checked in the sidebar AND in action
  handlers — but client-side checks are inspectable, so they are **not** a
  security boundary. The console says this on every page ("STATIC DEMO").
- Route guards run synchronously before render: `#/admin/*` with no session
  renders the sign-in screen with no protected content flashed first.
- `#/sign-in` and `#/admin/*` are absent from all public navigation (header,
  footer, drawer, module cards). Hiding is UX, not access control.
- Trust boundaries: everything the browser downloads (JS, seed data, "hidden"
  routes) is visible to the user. Any real deployment needs a trusted identity
  provider, server-side authorization, and server-held secrets — see the
  production roadmap (§5) and docs/ADMIN_PORTAL_SPEC.md §7.

## 4. Responsible AI notes
- ScamShield: local demonstration rules; does not verify senders, banks or universities.
- Copilot: grounded in seeded demo data; says when it cannot answer; never gives regulated advice.
- FX signals: illustrative decision rules on synthetic data, not forecasts.

## 5. Production roadmap (not built)
Regulated provider integrations, source-attributed live FX, server-side credentials, real KYC/AML,
beneficiary verification, fraud intelligence, authN/Z, encryption & key management, audit logging,
privacy controls, incident response, licensing, independent security assessment, user testing.

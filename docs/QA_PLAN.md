# QA_PLAN.md — Verification Strategy (Round 2 Titan Edition)

## 1. Layers
1. **Fee-Agreement Regression** (`qa/fee-agreement.test.js`): canonical example (2,500 / 4.99 / 0 / 120.15 -> 299,775.45), 7-input battery matching client `FinancialEngine.canonicalQuote` against `server/api.js` mirror, input rejections, corridor registry integrity.
2. **In-Browser Harness** (`qa/qa.html`): loads all scripts identically to `index.html`, 96 executed assertions covering signed-out state, public quick-fill, 25 routes, copilot UI + engine math, vault records, owner typed sign-in, admin sections, viewer denial, and sign-out wipe.
3. **CDP-Driven Execution** (`qa/run-qa.mjs`): Chromium via Chrome DevTools Protocol; desktop 1440×900 and mobile 390×844 viewports; auth lockout probes, static code checks (escaping, UTC math, no plaintext credentials).
4. **Backend Staging Test Suites** (`qa/test-phase1.js`, `test-phase2.js`, `test-phase3.js`, `test-phase4-phase5.js`): Marked NOT-APPLICABLE for static bundle verification (they target live backend on 127.0.0.1:3000).

## 2. Evidence rules
- A test counts as passed only if it **executed** and its assertion held. No mocks, no stubs.
- Console-error policy: CDP Log errors filtered only for documented sandbox environment noise (CORS blocks under `file://`, sandbox-blocked CDN fonts/avatars). JS errors and unhandled rejections strictly fail the run.
- Untested items are documented honestly in QA_REPORT.md, never papered over.

## 3. Not-Covered / Out-of-Scope List
- Production backend live settlement / automated clearing house (ACH/BEFTN).
- Live email/SMS delivery for OTPs (demo uses random hashed tokens without external delivery).
- Client-side tampering via devtools (real enforcement requires server-side production backend).

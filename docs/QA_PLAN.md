# QA_PLAN.md — Verification Strategy (Round 2 Titan Edition)

## 1. Layers
1. **Fee-Agreement Regression** (harness removed during static-only cleanup): canonical example (2,500 / 4.99 / 0 / 120.15 -> 299,775.45) against client `FinancialEngine.canonicalQuote`, input rejections, corridor registry integrity.
2. **In-Browser Harness** (removed during static-only cleanup): previously loaded all scripts identically to `index.html`, 96 executed assertions covering signed-out state, public quick-fill, 25 routes, copilot UI + engine math, vault records, owner typed sign-in, admin sections, viewer denial, and sign-out wipe.
3. **CDP-Driven Execution** (removed during static-only cleanup): Chromium via Chrome DevTools Protocol; desktop 1440×900 and mobile 390×844 viewports; auth lockout probes, static code checks (escaping, UTC math, no plaintext credentials).
4. **Backend Staging Test Suites**: removed — no backend in this repo.

## 2. Evidence rules
- A test counts as passed only if it **executed** and its assertion held. No mocks, no stubs.
- Console-error policy: CDP Log errors filtered only for documented sandbox environment noise (CORS blocks under `file://`, sandbox-blocked CDN fonts/avatars). JS errors and unhandled rejections strictly fail the run.
- Untested items are documented honestly in QA_REPORT.md, never papered over.

## 3. Not-Covered / Out-of-Scope List
- Production backend live settlement / automated clearing house (ACH/BEFTN).
- Live email/SMS delivery for OTPs (demo uses random hashed tokens without external delivery).
- Client-side tampering via devtools (real enforcement requires server-side production backend).

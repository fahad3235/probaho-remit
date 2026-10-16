# PRODUCT_SPEC.md — Probaho Remit · Titan Edition

## 1. Product
**Probaho Remit — Titan Edition.** Tagline: *Send smarter. Spot scams. Protect every transfer.*
Theme: **AI as a Financial Participant** (2026 Shenzhen International FinTech Competition, Topic C).

## 2. Users
International students, Bangladeshi families, and remittance senders comparing cross-border
payment options. The demo persona: a father in Dhaka funding his daughter's £2,000 UK tuition instalment.

## 3. What the product does (and does not do)
It helps people **compare** synthetic transfer options, **calculate** costs, **assess** suspicious
payment instructions with explainable rules, **plan** tuition deadlines, **read** seeded FX trends, and
**organise** simulated receipts. A recommendation is not an execution, a draft is not a transfer,
and a risk score is not proof of fraud.

## 4. Modules & routes
| Route | Module | Core promise |
|---|---|---|
| `#/` | Landing | Product story in seconds; entry to all ten modules |
| `#/dashboard` | Dashboard | Transfers at a glance: drafts, tickets, deadlines, last check |
| `#/send` | Send Money | Guided 3-step simulated transfer: details → review → draft |
| `#/corridor-optimizer` | Corridor Optimizer | 5 fictional providers ranked by recipient amount; honest benchmark |
| `#/rates` | Rate Board | Illustrative rate snapshot per corridor (synthetic, not live) |
| `#/scamshield` | ScamShield | 10-rule local risk assessment, 0–100, explained |
| `#/fx-advisor` | FX Timing Advisor | 90-day seeded FX, MA overlay, illustrative signals |
| `#/tuition-planner` | Tuition Planner | Deadlines, 5-doc checklist, BDT budget |
| `#/ask-probaho` | Ask Probaho | Local grounded copilot; optional user Gemini key |
| `#/payment-vault` | Payment Vault | Searchable simulated ledger + printable receipts |
| `#/help` | Help & Support | FAQ + demo support tickets (visible in admin Reports) |

Unknown routes render a 404 with a way home. Back/forward work natively (hash routing).

## 5. Data & determinism
- One seeded dataset per concern; mulberry32 PRNG with fixed per-corridor seeds for FX.
- Same inputs → same outputs, every load, every machine. Verified by test.
- Draft references: `TX-DEMO-XXXXX` from cyrb53 of canonical draft inputs (incl. session sequence).

## 6. Demo labelling (mandatory)
`DEMO DATA` badge in the persistent header; per-module demo notices; `SIMULATED`,
`ILLUSTRATIVE FEES`, `NOT A LIVE QUOTE`, `SIMULATED DRAFT` labels at the point of use;
full disclosure in the footer. Labels never disappear on navigation or in modals.

## 7. Non-goals
No real payments, no live rates, no provider integrations, no auth system, no backend,
no tracking, no fabricated market statistics or testimonials.

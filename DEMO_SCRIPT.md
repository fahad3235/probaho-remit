# DEMO_SCRIPT.md — the five-minute competition demo

Presenter: one laptop, this app, no internet required. Every number below is produced live by
the app's own engines (verified 2026-10-11). If any number on screen differs, read the screen —
the engine is the source of truth.

---

## Minute 0–1 — The hook · `#/` (public sign-in) → `#/home`

**Say:** "Every year, Bangladesh receives billions of dollars in remittances. But the cost of
sending money, confusing exchange rates, and payment scams put a serious burden on families.
Meet Probaho Remit — an AI-powered cross-border finance companion. It doesn't just move numbers.
It helps people make safer, better-informed decisions *before* they act."

**Do:** Show the landing page. Point at the six module cards. Point at the persistent
**DEMO DATA** badge: "Everything here is synthetic and clearly labelled — that honesty is
part of the product."

## Minute 1–3 — The £2,000 tuition scenario · `#/corridor-optimizer`

**Say:** "Imagine a father in Dhaka helping his daughter pay a £2,000 UK tuition instalment.
He needs to know what the transfer *actually* costs — not the advertised fee."

**Do:**
1. Corridor: **Dhaka → London**. Amount: type **320000**.
2. "Five illustrative providers quote the same amount. The engine ranks them by what the
   recipient actually receives — fees and spreads included."
3. Point at the winner: **MeridianPay — BEST VALUE**. Read the hero:
   - Recipient: **£2,035.20** — covers the £2,000 instalment.
   - Illustrative rate **0.00640**, total illustrative fees **৳1,922.50**.
4. Scroll to the savings callout: "**£67.34** more than the illustrative bank-transfer benchmark."
   "The benchmark is a synthetic baseline, not a real bank quote — and if it ever wins, we show that too."
5. Click **Draft transfer**. Read the modal: full fee breakdown, deterministic reference
   `TX-DEMO-XXXXX`, and the warning: *SIMULATED DRAFT — not a real transfer.*
6. Click **Cancel** — "Nothing was created." Reopen, click **Confirm simulated draft**.
   "The draft is filed. No money moved."

**Say:** "Probaho compares the economics, explains the trade-offs, and prepares a draft.
It does not move money or pretend to have a live quote."

## Minute 3–4 — The ScamShield twist · `#/scamshield`

**Say:** "Now imagine that just before payment, the family gets an email: the university has
*changed its bank details*."

**Do:**
1. Click **Load sample scam email**, then **Analyse message**.
2. Gauge: **96/100 — CRITICAL**. "Six independent warning signs, each explained:"
   read two or three — manufactured urgency, payment-destination change, OTP request.
3. Read the recommendation: "Stop and do not use the supplied payment details. Contact the
   institution using previously verified contact information."
4. "This is where a financial assistant becomes more than a calculator. It recognises warning
   signs, explains them, and tells you to stop. A score is a warning sign — not proof of fraud."

## Minute 4–5 — Close the loop

**Do:**
- `#/rates`: "A snapshot board — every corridor's best illustrative rate, trend and 7-day
  change. Synthetic, not live — and it says so on the page."
- `#/send`: "Quote, review and draft in three steps — the guided path for the same engine."
  Enter an amount, pick a payout method, review, confirm.
- `#/fx-advisor`: "Ninety days of seeded FX with a moving average. Read the illustrative signal
  and the one-line reason — guidance, not a forecast."
- `#/tuition-planner`: "The next deadline, its countdown, the document checklist, the BDT budget."
- `#/payment-vault`: "And the draft we confirmed is here — open the receipt. Stamped
  SIMULATED RECORD, printable, auditable."
- `#/dashboard` (if a beat remains): "Everything at a glance — drafts, tickets, deadlines,
  last risk check."

**Say:** "Probaho doesn't just show financial data. It participates in decisions: it compares,
recommends, drafts, and warns. That is **AI as a Financial Participant**."

End on the footer disclosure — read it once, briefly.

## Fallbacks
- Any chart fails → all KPIs and signals are also plain text.
- Copilot → ask "Which provider is cheapest right now?" — answered from live app state.
- Projector dies → every number above is documented in `docs/FINANCIAL_MODEL.md`.

## Optional 60-second admin preview (only if time permits)
**Do:** open `#/sign-in` directly (it is not in the public nav). Tap the Demo Owner
account, sign in. "This is a clearly labeled demo sign-in for a static site — public
credentials, memory-only session, no production security claims." Open
`#/admin/scamshield-rules`: "Weights are tunable; the preview shows both reference
samples recomputed live through the same engine." Open `#/admin/providers`, nudge a
fee: "The public optimizer recalculates through the shared engine immediately."
**Say:** "The console manages demo content only — it cannot move money or protect
real data, and it never claims otherwise."

# DEMO_FLOW.md — the five-minute presentation, technically

Covers the exact same beats as DEMO_SCRIPT.md, mapped to routes and expected engine outputs.

## 0:00–1:00 — Hook (`#/`)
Landing: hero → six module cards → "AI as a Financial Participant". Point at the persistent
`DEMO DATA` badge: everything synthetic, nothing live.

## 1:00–3:00 — The £2,000 tuition scenario (`#/corridor-optimizer`)
1. Corridor: **Dhaka → London**. Amount: **320000** (BDT).
2. Table renders 5 offers + benchmark. **MeridianPay** wins BEST VALUE.
3. Read the numbers aloud: recipient **£2,035.20**, illustrative fees **৳1,922.50**,
   **£67.34** more than the synthetic benchmark.
4. Select MeridianPay → **Draft transfer** → modal shows the full breakdown.
5. **Cancel once** — no draft created (say so). Reopen → **Confirm simulated draft**.
6. Reference appears: `TX-DEMO-XXXXX`, deterministic for these inputs.

## 3:00–4:00 — The ScamShield twist (`#/scamshield`)
1. **Load sample scam email** → **96/100 CRITICAL**.
2. Point at the gauge, the severity, and the fired rules: urgency, destination change,
   OTP request, WhatsApp, rate promise, secrecy.
3. Read the recommendation: stop, use previously verified contact info.
4. "A score is a warning sign, not proof of fraud."

## 4:00–5:00 — Close the loop
- `#/fx-advisor`: 90-day seeded chart + MA; read the illustrative signal and its one-line reason.
- `#/tuition-planner`: next deadline countdown; checklist progress; BDT budget remaining.
- `#/payment-vault`: the confirmed draft sits at the top — open its **SIMULATED RECORD** receipt.
- Close: "Probaho compares, recommends, drafts and warns. That is AI as a Financial Participant."
  End on the footer disclosure.

## Fallbacks
- Any visual fails → every number is also in the DOM text and the docs' worked example.
- Gemini section → never needed; local brain answers everything in the script.
- Offline → the entire flow works from `file://` with zero network.

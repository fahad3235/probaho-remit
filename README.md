# Probaho Remit

**An AI financial participant that moves money across borders the cheapest, safest way possible.**

Demo MVP built for the **2026 Shenzhen International FinTech Competition (FinTechathon)** — International Track, **Topic C: Cross-border & Student Finance Assistant**. Theme: *"AI as a Financial Participant."*

> **All data in this demo is synthetic and seeded (deterministic). No real money moves anywhere.**

## What's inside

| Module | What it does |
|---|---|
| Corridor Optimizer | Compares 5 synthetic providers across 4 corridors (fee + FX spread + speed), highlights the best deal, drafts a demo transfer |
| ScamShield | Deterministic fraud-risk scorer (0–100) with plain-language reasons for any payment instruction |
| FX Timing Advisor | Seeded 90-day rate chart with 7-day moving average and SEND NOW / WAIT / HOLD signal |
| Tuition Planner | Deadlines, document checklist, and BDT budget tracker for students abroad |
| Ask Probaho | Deterministic copilot answering corridor/fee/safety questions (optional session-only Gemini key, never persisted) |
| Payment Vault | Seeded ledger of demo transfers with receipt details |

## Run it

Static site — no build step, no server needed. Open `index.html` in a browser, or serve the folder with any static server.

## Team

Team Probaho — Inter-University AI Dev Fest 2026 (20th of 132).

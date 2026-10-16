# FINANCIAL_MODEL.md — every formula, in one place

All money math lives in `js/financial-engine.js`. No module computes money any other way.

## 1. Definitions
- `principal` — sending amount, integer **minor units** (e.g. poisha/cents).
- `flatFee` — per-transfer flat fee in **send currency**.
- `pctFee` — percentage fee on the principal.
- `midRate` — synthetic mid-market reference, receive-per-send (seeded per corridor).
- `spreadPct` — how far the illustrative customer rate sits under the synthetic mid.
- `customerRate = midRate × (1 − spreadPct/100)`.

## 2. Quote formulas
```
fee             = round(flatFee + (send × pctFee / 100))
net             = send − fee
recipientAmount = round(net × customerRate)
customerRate    = midRate × (1 − spreadPct/100)
spreadPct       = ((midRate − customerRate) / midRate) × 100
```
Rounding order: exact two-step rounding. Fee is rounded to cents/minor units first,
then recipientAmount = round((send − fee) × customerRate).

## 3. Worked example (verified by test)
Dhaka→London, ৳320,000, MeridianPay (flat ৳2.50, 0.60%, spread 0.80%, mid 0.00645):
- totalFee = 2.50 + (320,000 × 0.006) = ৳1,922.50
- net = 320,000 − 1,922.50 = ৳318,077.50
- customerRate = 0.00645 × 0.992 = 0.0063984
- recipientAmount = round(318,077.50 × 0.0063984) = **£2,035.19**
- totalSenderCost = ৳320,000.00

## 4. Best value
Default objective: **maximise recipient amount** for the same sending amount on the same
corridor. Deterministic tie-breaks: lower total fee, then provider order. The winning row
gets the `BEST VALUE` badge plus a one-line explanation of why it wins.

## 5. Benchmark & savings
The benchmark (`Illustrative bank-transfer benchmark`: flat 12.00, 1.20%, 3.50% spread,
2–3 days) is a **synthetic baseline, not a bank quote**. Savings = best recipient −
benchmark recipient, shown with its honest sign (zero/negative shown as-is, never inflated).
For the worked example: benchmark recipient £1,967.78 → savings **£67.41**.

## 6. Corridor assumptions (seeded, illustrative)
| Corridor | Send → Receive | Synthetic mid |
|---|---|---|
| Dhaka → London | BDT → GBP | 0.00645 |
| Dhaka → New York | BDT → USD | 0.00820 |
| Riyadh → Dhaka | SAR → BDT | 32.30 |
| Kuala Lumpur → Dhaka | MYR → BDT | 28.80 |

Demo per-transfer caps: BDT 2,000,000 · GBP 12,000 · USD 15,000 · SAR 56,000 · MYR 70,000.
Amounts accept at most 2 decimals; empty/non-numeric/negative/over-cap inputs are rejected
with inline messages and never reach the engine as NaN.

/* ============================================================
   demo-config.js — central configuration for ALL demo assumptions.
   Nothing here is a live quote, a real fee, or a verified fact.
   Change assumptions here; every module reads from this file.
   ============================================================ */
(function(global){
"use strict";

var DemoConfig = {
  demoMode: true,
  buildName: "Probaho Remit — Titan Edition",
  competition: "2026 Shenzhen International FinTech Competition · International Track · Topic C",

  /* ---- money ---- */
  precision: 2,                 // decimals kept for money math boundaries
  maxPerTx: {                   // illustrative per-transfer caps (send currency)
    "BDT": 2000000, "GBP": 25000, "USD": 50000, "EUR": 45000,
    "CAD": 50000, "AUD": 50000, "CNY": 350000, "SGD": 60000,
    "AED": 180000, "SAR": 180000, "MYR": 150000, "INR": 4000000, "PHP": 2500000
  },
  maxDecimals: 2,

  /* ---- fee model (documented in docs/FINANCIAL_MODEL.md) ----
     percentageFee = principal × pctFee
     netPrincipal  = principal − percentageFee      (pct fee deducted from principal)
     totalSenderCost = principal + flatFee          (flat fee charged on top)
     recipientAmount = netPrincipal × customerRate  */
  feeModel: "pct-deducted-flat-on-top",

  /* ---- FX spread convention ----
     customerRate = midRate × (1 − spreadPct/100)
     spreadPct    = ((midRate − customerRate) / midRate) × 100
     A higher receive-per-send rate is better for the sender. */

  /* ---- benchmark: a clearly synthetic baseline, NOT a bank quote ---- */
  benchmark: {
    id: "benchmark",
    name: "Illustrative bank-transfer benchmark",
    flatFee: 12.00,      // in send currency
    pctFee: 1.20,        // percent
    spreadPct: 3.50,     // percent under synthetic mid
    delivery: "2–3 days",
    note: "Synthetic baseline for comparison only — not a real bank quote."
  },

  /* ---- FX advisor signal thresholds (documented, configurable) ---- */
  fxSignal: {
    sendNowMinRank: 0.65,   // current rate at/above 65th pct of 90d series…
    sendNowMaxDip: -0.002,  // …and within 0.2% below the 7-day average
    holdMaxRank: 0.35,      // at/below 35th pct…
    holdMaxTrend: -0.008,   // …or 0.8% below the 7-day average → HOLD
    historyDays: 90
  },

  /* ---- ScamShield severity bands (single source of truth) ---- */
  severityBands: [
    { id:"low",      min:0,  max:19,  label:"LOW",      action:"Continue with normal verification. Confirm the recipient and payment details independently." },
    { id:"medium",   min:20, max:44,  label:"MEDIUM",   action:"Pause and review the flagged language. Verify any payment instructions through a trusted contact method." },
    { id:"high",     min:45, max:69,  label:"HIGH",     action:"Do not proceed until the unusual requests have been independently verified." },
    { id:"critical", min:70, max:100, label:"CRITICAL", action:"Stop and do not use the supplied payment details. Contact the institution using previously verified contact information." }
  ],

  /* ---- tuition planner ---- */
  tuition: { budgetCurrency: "BDT" },

  /* ---- persistence ---- */
  storageKey: "probaho-titan-v1",

  /* ---- reference format ---- */
  refPrefix: "TX-DEMO-",
  refLength: 5,

  /* ---- visible labels ---- */
  labels: {
    demoData: "DEMO DATA",
    simulatedRate: "SIMULATED RATE",
    illustrativeFees: "ILLUSTRATIVE FEES",
    notLiveQuote: "NOT A LIVE QUOTE",
    simulatedDraft: "SIMULATED DRAFT",
    notRealTransfer: "NOT A REAL TRANSFER"
  },

  disclaimer:
    "Probaho Remit is an educational demonstration using synthetic data. Rates, fees, provider " +
    "comparisons, AI responses, and risk scores are illustrative and are not live financial offers. " +
    "No money is moved, and no payment instructions are verified with a bank or university. " +
    "Independently confirm recipient details and obtain current quotes from authorized providers " +
    "before making a real payment."
};

global.DemoConfig = DemoConfig;
})(typeof window !== "undefined" ? window : global);

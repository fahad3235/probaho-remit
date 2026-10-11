/* ============================================================
   Probaho Remit — Demo Data Engine (CONTRACT FILE)
   Deterministic: seeded PRNG, no network, no randomness at runtime.
   Do NOT rename DemoData fields or helper functions. Do not edit
   this file — build on top of it.
   ============================================================ */
'use strict';

/* Seeded PRNG (mulberry32) — deterministic across runs/browsers */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

var DemoData = (function () {

  /* ---------------- Corridors (SYNTHETIC rates, clearly demo) ---------------- */
  var corridors = [
    { id: 'dhk-lon', from: 'Dhaka',        to: 'London',       fromCur: 'BDT', toCur: 'GBP', baseRate: 0.00690, days: 90 },
    { id: 'dhk-nyc', from: 'Dhaka',        to: 'New York',     fromCur: 'BDT', toCur: 'USD', baseRate: 0.00826, days: 90 },
    { id: 'ruh-dhk', from: 'Riyadh',       to: 'Dhaka',        fromCur: 'SAR', toCur: 'BDT', baseRate: 32.10,   days: 90 },
    { id: 'kul-dhk', from: 'Kuala Lumpur', to: 'Dhaka',        fromCur: 'MYR', toCur: 'BDT', baseRate: 25.60,   days: 90 }
  ];

  /* ---------------- Providers (SYNTHETIC fee schedules) ----------------
     feeFlat is keyed by sender currency. feePct is % of send amount.
     spreadPct is the FX markup vs the base (mid-market) rate.        */
  var providers = [
    { id: 'pexp',  name: 'Probaho Express', tag: 'Fastest',    feeFlat: { BDT: 0,    SAR: 0,  MYR: 0  }, feePct: 0.9, spreadPct: 0.8, speed: 'Minutes',   method: 'Mobile wallet / bank' },
    { id: 'rwise', name: 'RemitWise',       tag: 'Low spread', feeFlat: { BDT: 0,    SAR: 0,  MYR: 0  }, feePct: 1.2, spreadPct: 0.5, speed: 'Same day',  method: 'Bank transfer' },
    { id: 'spay',  name: 'SwiftPay',        tag: '',           feeFlat: { BDT: 800,  SAR: 25, MYR: 30 }, feePct: 0.6, spreadPct: 1.5, speed: '1 day',     method: 'Bank transfer' },
    { id: 'gbank', name: 'GlobalBank Wire', tag: '',           feeFlat: { BDT: 1500, SAR: 45, MYR: 55 }, feePct: 0.4, spreadPct: 2.4, speed: '1–2 days',  method: 'Wire transfer' },
    { id: 'ckiosk',name: 'CashAgent Kiosk', tag: 'Cash pickup',feeFlat: { BDT: 300,  SAR: 10, MYR: 12 }, feePct: 2.0, spreadPct: 3.5, speed: 'Same day',  method: 'Cash pickup' }
  ];

  function getCorridor(id) {
    for (var i = 0; i < corridors.length; i++) if (corridors[i].id === id) return corridors[i];
    return corridors[0];
  }
  function getProvider(id) {
    for (var i = 0; i < providers.length; i++) if (providers[i].id === id) return providers[i];
    return providers[0];
  }

  /* ---------------- Deterministic quote engine ----------------
     Returns: { fee, rate, recipientGets, totalCost, totalCostPct, spreadPct } */
  function calc(corridorId, providerId, amount) {
    var c = getCorridor(corridorId);
    var p = getProvider(providerId);
    amount = Math.max(0, Number(amount) || 0);
    var flat = (p.feeFlat[c.fromCur] !== undefined) ? p.feeFlat[c.fromCur] : 0;
    var fee = flat + amount * (p.feePct / 100);
    if (fee > amount) fee = amount;
    var rate = c.baseRate * (1 - p.spreadPct / 100);
    var recipientGets = (amount - fee) * rate;
    var spreadCost = amount * (p.spreadPct / 100);
    var totalCost = fee + spreadCost;
    var totalCostPct = amount > 0 ? (totalCost / amount) * 100 : 0;
    return {
      corridor: c, provider: p, amount: amount,
      fee: fee, flat: flat, rate: rate,
      recipientGets: recipientGets,
      totalCost: totalCost, totalCostPct: totalCostPct,
      spreadPct: p.spreadPct
    };
  }

  /* Compare all providers for a corridor+amount, sorted cheapest first */
  function compareAll(corridorId, amount) {
    var out = providers.map(function (p) { return calc(corridorId, p.id, amount); });
    out.sort(function (a, b) { return a.totalCostPct - b.totalCostPct; });
    return out;
  }

  /* ---------------- Synthetic 90-day FX series (seeded) ---------------- */
  var _seriesCache = {};
  function fxSeries(corridorId) {
    if (_seriesCache[corridorId]) return _seriesCache[corridorId];
    var c = getCorridor(corridorId);
    var rng = mulberry32(hashStr('fx-' + corridorId));
    var points = [];
    var rate = c.baseRate * (1 - (rng() - 0.5) * 0.04);
    // Anchor the series so "today" ends near the base rate for realism
    var today = new Date(2026, 9, 11); // fixed demo "today": 11 Oct 2026
    for (var i = c.days - 1; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000);
      rate = rate * (1 + (rng() - 0.5) * 0.012);
      // gentle pull toward base rate
      rate = rate + (c.baseRate - rate) * 0.03;
      points.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        rate: rate
      });
    }
    _seriesCache[corridorId] = points;
    return points;
  }

  function movingAverage(series, window) {
    return series.map(function (_, i) {
      var start = Math.max(0, i - window + 1);
      var sum = 0, n = 0;
      for (var j = start; j <= i; j++) { sum += series[j].rate; n++; }
      return sum / n;
    });
  }

  /* Signal: higher rate = better for the recipient. */
  function fxSignal(corridorId) {
    var s = fxSeries(corridorId);
    var ma = movingAverage(s, 7);
    var cur = s[s.length - 1].rate;
    var avg = ma[ma.length - 1];
    var diff = (cur - avg) / avg;
    if (diff >= 0.005)  return { level: 'send', text: 'SEND NOW', reason: 'Rate is ' + (diff * 100).toFixed(2) + '% above the 7-day average — favorable for the recipient.' };
    if (diff <= -0.005) return { level: 'wait', text: 'WAIT',     reason: 'Rate is ' + Math.abs(diff * 100).toFixed(2) + '% below the 7-day average — waiting may get a better rate.' };
    return { level: 'hold', text: 'HOLD', reason: 'Rate is within 0.5% of the 7-day average — no strong timing edge right now.' };
  }

  /* ---------------- Payment vault (seeded demo ledger) ---------------- */
  var vaultTransfers = [
    { id: 'TX-DEMO-1042', date: '2026-10-09', corridorId: 'dhk-lon', providerId: 'pexp',  sendAmount: 250000, status: 'Completed' },
    { id: 'TX-DEMO-1041', date: '2026-10-07', corridorId: 'ruh-dhk', providerId: 'rwise', sendAmount: 4500,   status: 'Completed' },
    { id: 'TX-DEMO-1040', date: '2026-10-05', corridorId: 'dhk-nyc', providerId: 'spay',  sendAmount: 180000, status: 'Completed' },
    { id: 'TX-DEMO-1039', date: '2026-10-03', corridorId: 'kul-dhk', providerId: 'ckiosk',sendAmount: 2200,   status: 'Completed' },
    { id: 'TX-DEMO-1038', date: '2026-09-30', corridorId: 'dhk-lon', providerId: 'gbank', sendAmount: 400000, status: 'Completed' },
    { id: 'TX-DEMO-1037', date: '2026-09-28', corridorId: 'ruh-dhk', providerId: 'pexp',  sendAmount: 6000,   status: 'Pending'   },
    { id: 'TX-DEMO-1036', date: '2026-09-25', corridorId: 'dhk-nyc', providerId: 'rwise', sendAmount: 95000,  status: 'Completed' },
    { id: 'TX-DEMO-1035', date: '2026-09-21', corridorId: 'kul-dhk', providerId: 'spay',  sendAmount: 3100,   status: 'Completed' }
  ];

  /* ---------------- Tuition planner seed ---------------- */
  var tuitionDeadlines = [
    { id: 'dl1', title: 'Spring tuition installment — University of Manchester', date: '2026-11-15', amount: '£4,250' },
    { id: 'dl2', title: 'Accommodation deposit — Fall term',                    date: '2026-12-01', amount: '£1,200' },
    { id: 'dl3', title: 'Visa financial evidence window opens',                 date: '2026-10-25', amount: '—' }
  ];
  var tuitionDocs = [
    'Passport bio page (all applicants)',
    'University offer letter / CAS statement',
    'Tuition invoice for the term',
    'Bank statement — 28-day maintenance funds',
    'Sponsor letter (if family-funded)'
  ];

  /* ---------------- Formatting helpers ---------------- */
  var curSymbols = { BDT: '৳', GBP: '£', USD: '$', SAR: 'SAR ', MYR: 'RM ' };
  function fmtMoney(n, cur) {
    var sym = curSymbols[cur] || (cur + ' ');
    var v = Number(n) || 0;
    var dec = (cur === 'BDT') ? 0 : 2;
    return sym + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtPct(n) { return (Number(n) || 0).toFixed(2) + '%'; }
  function fmtRate(n) {
    n = Number(n) || 0;
    return n >= 1 ? n.toFixed(2) : n.toFixed(5);
  }

  return {
    version: '1.0-demo',
    corridors: corridors,
    providers: providers,
    getCorridor: getCorridor,
    getProvider: getProvider,
    calc: calc,
    compareAll: compareAll,
    fxSeries: fxSeries,
    movingAverage: movingAverage,
    fxSignal: fxSignal,
    vaultTransfers: vaultTransfers,
    tuitionDeadlines: tuitionDeadlines,
    tuitionDocs: tuitionDocs,
    fmtMoney: fmtMoney,
    fmtPct: fmtPct,
    fmtRate: fmtRate
  };
})();

/* ============================================================
   fx-engine.js — seeded FX history + signal rules. DOM-free.
   90 days of DETERMINISTIC synthetic rates per corridor (mulberry32
   from the corridor's fxSeed). Same seed → same series on every load.
   Displayed as "SIMULATED FX HISTORY — NOT LIVE MARKET DATA."
   ============================================================ */
(function(global){
"use strict";

var FX = {};

FX.series = function(corridor){
  var p = global.FxGenParams;
  var rng = global.U.mulberry32(corridor.fxSeed);
  var mid = corridor.midRate;
  var rate = mid * (1 + p.startOffsetPct / 100);
  var out = [];
  for (var i = 0; i < p.days; i++){
    var shock = (rng() - 0.5) * 2 * (p.dailyVolPct / 100);
    rate = rate * (1 + shock);
    rate = rate + (mid - rate) * p.meanReversion;   // gentle pull to synthetic mid
    rate = Math.max(rate, mid * 0.9);                // guard rails — plausible band
    rate = Math.min(rate, mid * 1.1);
    out.push({ day: i, dateISO: global.U.isoDaysAgo(p.days - 1 - i), rate: rate });
  }
  return out;
};

FX.movingAverage = function(series, n){
  var out = [];
  for (var i = 0; i < series.length; i++){
    var from = Math.max(0, i - n + 1), sum = 0, c = 0;
    for (var j = from; j <= i; j++){ sum += series[j].rate; c++; }
    out.push(sum / c);
  }
  return out;
};

FX.kpis = function(corridor){
  var s = FX.series(corridor);
  var last = s[s.length - 1].rate;
  var week = s[s.length - 8].rate;
  var best = s[0].rate;
  for (var i = 1; i < s.length; i++) if (s[i].rate > best) best = s[i].rate; // higher = better for sender
  return {
    current: last,
    change7Pct: (last - week) / week * 100,
    best90: best,
    spreadVsMidPct: (corridor.midRate - last) / corridor.midRate * 100,
    series: s
  };
};

/* Deterministic illustrative signal. NOT a prediction. */
FX.signal = function(corridor){
  var cfg = global.DemoConfig.fxSignal;
  var k = FX.kpis(corridor);
  var s = k.series, n = s.length;
  var rank = 0;
  for (var i = 0; i < n; i++) if (s[i].rate <= k.current) rank++;
  rank = rank / n;
  var ma = FX.movingAverage(s, 7);
  var ma7 = ma[n - 1];
  var trend = (k.current - ma7) / ma7;

  var sig, reason;
  if (rank >= cfg.sendNowMinRank && trend >= cfg.sendNowMaxDip){
    sig = "SEND_NOW";
    reason = "The simulated rate sits at the " + Math.round(rank * 100) + "th percentile of the 90-day " +
      "seeded series and is within " + Math.abs(trend * 100).toFixed(2) + "% of its 7-day average — " +
      "the illustrative rules favour acting now rather than waiting on noise.";
  } else if (rank <= cfg.holdMaxRank || trend <= cfg.holdMaxTrend){
    sig = "HOLD";
    reason = "The simulated rate is at the " + Math.round(rank * 100) + "th percentile of the 90-day " +
      "seeded series (" + Math.abs(trend * 100).toFixed(2) + "% vs the 7-day average) — the illustrative " +
      "rules suggest reviewing the decision rather than sending into a weak patch.";
  } else {
    sig = "WAIT";
    reason = "The simulated rate is mid-range (" + Math.round(rank * 100) + "th percentile of the 90-day " +
      "seeded series) with no compelling edge either way — the illustrative rules see no reason to rush.";
  }
  return {
    signal: sig,
    reason: reason,
    rank: rank,
    trendPct: trend * 100,
    kpis: { current:k.current, change7Pct:k.change7Pct, best90:k.best90, spreadVsMidPct:k.spreadVsMidPct },
    note: "Illustrative timing guidance only. Exchange rates can move unpredictably, and this demo cannot forecast future market conditions."
  };
};

global.FxEngine = FX;
})(window);

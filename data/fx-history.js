/* FX history is GENERATED deterministically at runtime (see js/fx-engine.js)
   from each corridor's fxSeed. This file only documents the parameters —
   no fabricated "historical market prices" are stored anywhere. */
(function(global){
"use strict";
global.FxGenParams = {
  days: 90,
  startOffsetPct: -0.5,   // series starts 0.5% below synthetic mid
  dailyVolPct: 0.35,       // daily random move, ±%
  meanReversion: 0.06,     // pull back toward synthetic mid each day
  note: "SIMULATED FX HISTORY — NOT LIVE MARKET DATA."
};
})(window);

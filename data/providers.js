/* Top cross-border remittance providers matching the titan benchmark.
   Illustrative simulation data for competition demonstration. */
(function(global){
"use strict";
global.SeedProviders = [
  { id:"worldremit", name:"WorldRemit", flatFee:4.99, pctFee:0.00, spreadPct:0.02, delivery:"1-2 days",
    badge:"Best Value", note:"Zero percentage fee · best value for bank deposit & student fees." },
  { id:"wise",       name:"Wise",       flatFee:4.50, pctFee:0.22, spreadPct:0.01, delivery:"Instant",
    badge:"Fastest",    note:"Mid-market exchange rate · instant direct bank transfer." },
  { id:"remitly",    name:"Remitly",    flatFee:1.99, pctFee:0.50, spreadPct:0.55, delivery:"1-2 days",
    badge:"Low Fee",    note:"Express promotional pricing · mobile wallet & cash pickup." },
  { id:"westernunion", name:"Western Union", flatFee:12.00, pctFee:0.40, spreadPct:0.45, delivery:"2-3 days",
    badge:"",           note:"Global agent network · direct to bank or cash collection." },
  { id:"meridian",   name:"MeridianPay", flatFee:2.50, pctFee:0.60, spreadPct:0.80, delivery:"10 minutes",
    badge:"",           note:"Near-instant payout · mobile wallet & account credit." }
];
})(window);

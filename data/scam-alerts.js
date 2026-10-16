/* Seeded ScamShield alerts and safety tips matching Screen 5.
   Simulated fintech demonstration data. */
(function(global){
"use strict";
global.SeedScamShield = {
  defaultScore: 92,
  severity: "low",
  statusLabel: "Low Risk",
  alerts: [
    { id:"alt-01", title:"Suspicious payment request blocked", time:"2 hours ago", type:"blocked", icon:"shield" },
    { id:"alt-02", title:"Unusual login attempt detected", time:"5 hours ago", type:"warn", icon:"lock" },
    { id:"alt-03", title:"New scam pattern detected", time:"1 day ago", type:"info", icon:"alert" }
  ],
  tips: [
    { title:"Verify before you transfer", desc:"Always verify university IBAN directly from student portal.", icon:"check" },
    { title:"Use official channels", desc:"Only wire payments to accredited institutions or authorized providers.", icon:"send" },
    { title:"Never share credentials", desc:"Probaho Remit and banks will never ask for your OTP or password.", icon:"lock" }
  ]
};
})(window);

/* Probaho Remit · Titan Edition — seed payout routes (synthetic demo data).
   Illustrative payout methods per corridor. Nothing here moves money. */
(function(global){
  "use strict";
  global.SeedPayoutRoutes = [
    { id:"po-bank-uk", corridorId:"dhaka-london", name:"Bank transfer", kind:"bank",
      feeNote:"Covered by the provider quote", hours:"2–24 hours", trust:5,
      note:"Direct to a UK bank account. Recipient name is matched before release in this demo.",
      enabled:true },
    { id:"po-wallet-uk", corridorId:"dhaka-london", name:"Mobile wallet", kind:"wallet",
      feeNote:"Covered by the provider quote", hours:"10–60 minutes", trust:4,
      note:"Payout to a UK mobile wallet. Illustrative only.", enabled:true },
    { id:"po-bank-us", corridorId:"dhaka-newyork", name:"Bank transfer", kind:"bank",
      feeNote:"Covered by the provider quote", hours:"1–2 business days", trust:5,
      note:"Direct to a US bank account (ACH-style timing, illustrative).", enabled:true },
    { id:"po-wallet-us", corridorId:"dhaka-newyork", name:"Mobile wallet", kind:"wallet",
      feeNote:"Covered by the provider quote", hours:"30–90 minutes", trust:4,
      note:"Payout to a US mobile wallet. Illustrative only.", enabled:true },
    { id:"po-bank-riyadh", corridorId:"riyadh-dhaka", name:"Bank transfer", kind:"bank",
      feeNote:"Covered by the provider quote", hours:"2–24 hours", trust:5,
      note:"Direct to a Bangladeshi bank account.", enabled:true },
    { id:"po-bkash-riyadh", corridorId:"riyadh-dhaka", name:"bKash wallet", kind:"wallet",
      feeNote:"Covered by the provider quote", hours:"10–30 minutes", trust:5,
      note:"Payout to a bKash mobile wallet. Fictional provider names, illustrative timing.", enabled:true },
    { id:"po-cash-riyadh", corridorId:"riyadh-dhaka", name:"Cash pickup", kind:"cash",
      feeNote:"Covered by the provider quote", hours:"Same day", trust:3,
      note:"Recipient collects cash with a reference code. Identity check simulated in this demo.", enabled:true },
    { id:"po-bank-kl", corridorId:"kl-dhaka", name:"Bank transfer", kind:"bank",
      feeNote:"Covered by the provider quote", hours:"2–24 hours", trust:5,
      note:"Direct to a Bangladeshi bank account.", enabled:true },
    { id:"po-wallet-kl", corridorId:"kl-dhaka", name:"Mobile wallet", kind:"wallet",
      feeNote:"Covered by the provider quote", hours:"15–45 minutes", trust:4,
      note:"Payout to a Bangladeshi mobile wallet. Illustrative only.", enabled:true }
  ];
})(window);

/* Seeded payment-vault ledger matching the reference screens.
   Simulated fintech demonstration data. */
(function(global){
"use strict";
global.SeedLedger = [
  { ref:"TXN001245", user:"Rahim Uddin", userEmail:"rahim@domain.com", type:"Deposit", avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 12, 2026 10:24", corridorId:"us-dhaka", providerId:"worldremit",
    send:250.00, sendCcy:"USD", flatFee:4.99, pctFee:0.00, rate:119.48, receive:29273.79, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001244", user:"Ayesha Khan", userEmail:"ayesha@domain.com", type:"Transfer", avatar:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 12, 2026 09:42", corridorId:"us-dhaka", providerId:"wise",
    send:120.00, sendCcy:"USD", flatFee:4.50, pctFee:0.26, rate:119.22, receive:13732.95, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001243", user:"Tanvir Hasan", userEmail:"tanvir@domain.com", type:"Payment", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 12, 2026 08:17", corridorId:"dhaka-london", providerId:"remitly",
    send:85.50, sendCcy:"USD", flatFee:1.99, pctFee:0.43, rate:118.85, receive:9881.19, receiveCcy:"BDT", status:"Pending" },
  { ref:"TXN001242", user:"Nusrat Jahan", userEmail:"nusrat@domain.com", type:"Withdrawal", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 11, 2026 22:30", corridorId:"us-dhaka", providerId:"westernunion",
    send:286.00, sendCcy:"USD", flatFee:12.00, pctFee:1.14, rate:118.97, receive:32209.94, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001241", user:"Imran Hossain", userEmail:"imran@domain.com", type:"Deposit", avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 11, 2026 19:15", corridorId:"us-dhaka", providerId:"worldremit",
    send:500.00, sendCcy:"USD", flatFee:4.99, pctFee:0.00, rate:119.48, receive:59143.79, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001240", user:"Sadia Afrin", userEmail:"sadia@domain.com", type:"Transfer", avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 11, 2026 16:40", corridorId:"ca-dhaka", providerId:"wise",
    send:310.00, sendCcy:"CAD", flatFee:3.80, pctFee:0.68, rate:86.65, receive:26349.40, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001239", user:"Rafiq Islam", userEmail:"rafiq@domain.com", type:"Payment", avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 11, 2026 14:10", corridorId:"us-dhaka", providerId:"remitly",
    send:64.00, sendCcy:"USD", flatFee:1.99, pctFee:0.32, rate:118.85, receive:7346.12, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001238", user:"Meherab Ahmed", userEmail:"meherab@domain.com", type:"Withdrawal", avatar:"https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 11, 2026 11:25", corridorId:"dhaka-london", providerId:"meridian",
    send:150.00, sendCcy:"GBP", flatFee:2.50, pctFee:0.90, rate:151.80, receive:22185.57, receiveCcy:"BDT", status:"Completed" },
  { ref:"TXN001237", user:"Fatima Begum", userEmail:"fatima@domain.com", type:"Deposit", avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces",
    date:"Oct 11, 2026 09:05", corridorId:"us-dhaka", providerId:"worldremit",
    send:920.00, sendCcy:"USD", flatFee:4.99, pctFee:0.00, rate:119.48, receive:109325.39, receiveCcy:"BDT", status:"Completed" }
];
})(window);

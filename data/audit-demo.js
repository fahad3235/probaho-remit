/* Seeded audit log events matching Screen 12 (Admin Audit Logs).
   Simulated fintech demonstration data. */
(function(global){
"use strict";
global.SeedAuditLogs = [
  { time:"Oct 12, 10:24", user:"admin@probaho.com", action:"User Updated", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 12, 09:18", user:"ishan.ahmed", action:"KYC Approved", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 12, 08:42", user:"admin@probaho.com", action:"Provider Updated", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 12, 07:12", user:"ishan.ahmed", action:"Login", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 11, 22:45", user:"admin@probaho.com", action:"Settings Changed", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 11, 18:30", user:"admin@probaho.com", action:"Risk Rule Adjusted", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 11, 14:15", user:"ishan.ahmed", action:"Transfer Drafted", ip:"103.45.67.2", status:"Success" },
  { time:"Oct 11, 11:02", user:"admin@probaho.com", action:"Corridor Added", ip:"103.45.67.2", status:"Success" }
];
})(window);

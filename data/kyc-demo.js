/* Probaho Remit · Titan Edition — synthetic KYC applicant queue (demo only).
   Matching Screen 11 reference in the competition architecture + QA IDs. */
(function(global){
  "use strict";
  global.SeedKyc = [
    { id:"kyc-241", name:"Imran Hossain", country:"BD", countryName:"Bangladesh",
      docs:["Passport"], docType:"Passport", submitted:"Oct 12, 10:24",
      status:"pending", note:"Biometric passport bio page uploaded. Legible high-res scan." },
    { id:"kyc-251", name:"Fatima Ahmed", country:"BD", countryName:"Bangladesh",
      docs:["National ID"], docType:"National ID", submitted:"Oct 12, 09:18",
      status:"pending", note:"Smart NID front and back. Face matching verified at 98.4%." },
    { id:"kyc-252", name:"Zayed Khan", country:"SA", countryName:"Saudi Arabia",
      docs:["Passport"], docType:"Passport", submitted:"Oct 12, 08:42",
      status:"pending", note:"Secondary residence address check in progress with remittance provider." },
    { id:"kyc-253", name:"Meherik Akhtar", country:"BD", countryName:"Bangladesh",
      docs:["NID"], docType:"NID", submitted:"Oct 11, 17:32",
      status:"approved", decidedBy:"ishan.ahmed", decidedAt:"Oct 12, 09:18",
      reason:"Identity verified against civil registry.", note:"Approved for international university tuition transfers." },
    { id:"kyc-254", name:"Rashidul Islam", country:"BD", countryName:"Bangladesh",
      docs:["Passport"], docType:"Passport", submitted:"Oct 11, 15:20",
      status:"pending", note:"Passport page uploaded; waiting for address verification utility bill." },
    { id:"kyc-255", name:"Arif Chowdhury", country:"UK", countryName:"United Kingdom",
      docs:["Passport bio page","Proof of address"], docType:"Passport", submitted:"Oct 10, 11:15",
      status:"approved", decidedBy:"admin@probaho.com", decidedAt:"Oct 10, 14:20",
      reason:"UK student visa and university enrollment letter verified.", note:"" }
  ];
})(window);

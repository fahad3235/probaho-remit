/* Seeded tuition deadlines and multi-year calculator models.
   Matching Screen 4 reference in the competition architecture with global institutions. */
(function(global){
"use strict";
global.SeedTuition = {
  activeCalculation: {
    university: "University of Toronto",
    program: "Computer Science",
    startDate: "Jan 2027",
    currency: "CAD",
    annualCost: 45000,
    tuitionCost: 32000,
    livingCost: 13000,
    totalFourYears: 195000,
    fundedPercent: 72,
    savingsWithPlan: 2180,
    recommendedProvider: "Wise",
    recommendedDelivery: "1-2 days",
    yearlyBreakdown: [
      { year: "Year 1", tuition: 32000, living: 13000, total: 45000 },
      { year: "Year 2", tuition: 34000, living: 13500, total: 47500 },
      { year: "Year 3", tuition: 36000, living: 14000, total: 50000 },
      { year: "Year 4", tuition: 38000, living: 14500, total: 52500 }
    ]
  },
  universities: [
    { name:"University of Toronto", country:"Canada", ccy:"CAD", tuition:32000, living:13000, prog:["Computer Science", "Data Science", "Engineering", "Business Administration", "Economics"] },
    { name:"Harvard University", country:"United States", ccy:"USD", tuition:55000, living:22000, prog:["Computer Science", "Data Science", "Economics", "Law", "MBA"] },
    { name:"Massachusetts Institute of Technology (MIT)", country:"United States", ccy:"USD", tuition:58000, living:21000, prog:["Computer Science", "Artificial Intelligence", "Mechanical Engineering", "Physics"] },
    { name:"University of Oxford", country:"United Kingdom", ccy:"GBP", tuition:36000, living:16000, prog:["Computer Science", "Philosophy, Politics & Economics", "Mathematics", "Financial Economics"] },
    { name:"University of Melbourne", country:"Australia", ccy:"AUD", tuition:44000, living:24000, prog:["Computer Science", "Finance", "Information Systems", "Biomedicine"] },
    { name:"University of British Columbia (UBC)", country:"Canada", ccy:"CAD", tuition:38000, living:16000, prog:["Computer Science", "Management", "Civil Engineering"] },
    { name:"Tsinghua University (清华大学)", country:"China", ccy:"CNY", tuition:30000, living:24000, prog:["Computer Science & FinTech", "Artificial Intelligence", "Electronic Engineering", "Global MBA"] },
    { name:"Peking University (北京大学)", country:"China", ccy:"CNY", tuition:29000, living:24000, prog:["Data Science", "Economics & Finance", "Computer Science", "International Relations"] },
    { name:"National University of Singapore (NUS)", country:"Singapore", ccy:"SGD", tuition:39000, living:18000, prog:["Computer Science", "Quantitative Finance", "Business Analytics", "Electrical Engineering"] },
    { name:"ETH Zurich", country:"Switzerland / EU", ccy:"EUR", tuition:18000, living:22000, prog:["Computer Science", "Robotics & AI", "Data Science", "Quantitative Finance"] }
  ],
  deadlines: [
    { id:"td-uoft", title:"University of Toronto — Fall term balance", institution:"University of Toronto",
      amount:18200, ccy:"CAD", due:"2026-12-01", note:"Residence deposit already acknowledged.", status:"upcoming" },
    { id:"td-tsinghua", title:"Tsinghua University — Autumn Semester Tuition", institution:"Tsinghua University",
      amount:30000, ccy:"CNY", due:"2026-11-15", note:"International student registrar clearing.", status:"upcoming" },
    { id:"td-kcl",  title:"King's College London — Spring tuition instalment", institution:"King's College London",
      amount:24500, ccy:"GBP", due:"2027-01-15", note:"Second instalment of the annual fee.", status:"upcoming" },
    { id:"td-monash", title:"Monash University — Semester 1 fees", institution:"Monash University",
      amount:12400, ccy:"AUD", due:"2027-02-20", note:"Includes OSHC health coverage.", status:"upcoming" }
  ],
  checklist: [
    { id:"ck-pass",  label:"Passport", text:"Valid passport with at least 6 months remaining.", checked:true },
    { id:"ck-offer", label:"University offer / enrolment letter", text:"Signed offer or confirmation of enrolment.", checked:true },
    { id:"ck-inv",   label:"Tuition invoice", text:"Official invoice showing amount, currency and due date.", checked:true },
    { id:"ck-benef", label:"Beneficiary instructions", text:"University's official payment details, verified independently.", checked:false },
    { id:"ck-funds", label:"Proof of funds", text:"Bank statement or sponsor letter, if required.", checked:false }
  ],
  budget: { budgetBDT:1500000, plannedTuitionBDT:1180000, plannedFeesBDT:45000, paidBDT:320000 }
};
})(typeof window !== "undefined" ? window : global);

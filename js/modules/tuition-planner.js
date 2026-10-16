/* ============================================================
   tuition-planner.js — 100% Custom University Tuition Planner Studio
   Every parameter is user-customizable and persisted in AppState / localStorage:
   - Preset 10 Global Universities OR Custom University Name, Country & Program
   - Billing Currency (USD, CNY, GBP, CAD, AUD, EUR, SGD, BDT, USDT) & Custom BDT FX Rate
   - Editable Annual Tuition, Living/Housing Cost, Insurance/Books/Visa Fees, & Scholarship Deduction
   - Editable Duration (1-6 Years), Inflation Rate (%), Payment Schedule (Semester, Trimester, Quarterly, Monthly, Annual)
   - Editable Already Paid Amount (Foreign & BDT #bPaid) + Family BDT Budget Cap with live Funded % Radial Dial
   - Interactive Installment Schedule Table (Mark Paid / Pay Now via Send Money)
   - Full CRUD for Custom Deadlines & Custom Document Checklist
   ============================================================ */
(function(global){
"use strict";
var U = global.U;

var DEFAULT_FX_TO_BDT = {
  USD: 119.50,
  CAD: 86.80,
  GBP: 151.80,
  EUR: 129.80,
  AUD: 78.20,
  CNY: 16.7527,
  SGD: 88.50,
  USDT: 119.50,
  BDT: 1.00
};

function getCustomPlan(){
  var tState = (global.AppState && global.AppState.get("tuition")) || {};
  if (!tState.customPlan){
    tState.customPlan = {
      presetUniversity: "University of Toronto",
      isCustomUni: false,
      university: "University of Toronto",
      country: "Canada",
      program: "MSc Computer Science & AI",
      intake: "Sep 2026 / Jan 2027",
      currency: "CAD",
      fxRateToBDT: 86.80,
      tuitionAnnual: 32000,
      livingAnnual: 13000,
      feesAnnual: 2200,
      scholarshipAnnual: 5000,
      durationYears: 4,
      inflationPct: 4.0,
      scheduleMode: "semester", // semester | trimester | quarterly | monthly | annual
      paidForeign: 30384,       // ~72% of 42,200 net annual
      budgetBDT: 4800000,
      paidInstallments: { "inst-0": true }
    };
    if (!tState.budget) {
      tState.budget = { budgetBDT: 4800000, plannedTuitionBDT: 2777600, plannedFeesBDT: 190960, paidBDT: Math.round(30384 * 86.80) };
    }
    if (global.AppState) global.AppState.set("tuition", tState);
  }
  return tState.customPlan;
}

function saveCustomPlan(plan){
  var tState = (global.AppState && global.AppState.get("tuition")) || {};
  tState.customPlan = plan;
  tState.budget = tState.budget || {};
  tState.budget.budgetBDT = Number(plan.budgetBDT) || 4800000;
  tState.budget.paidBDT = Math.round((Number(plan.paidForeign) || 0) * (Number(plan.fxRateToBDT) || 1));
  if (global.AppState){
    global.AppState.set("tuition", tState);
    var sj = global.AppState.get("studentFinancialPlan");
    if (sj){
      var netAnn = Math.max(0, (Number(plan.tuitionAnnual)||0) + (Number(plan.livingAnnual)||0) + (Number(plan.feesAnnual)||0) - (Number(plan.scholarshipAnnual)||0));
      var remFor = Math.max(1500, netAnn - (Number(plan.paidForeign)||0));
      var nextInst = Math.round(remFor / 2);
      var mos = Number(sj.monthsHorizon) || 4;
      var updatedSj = Object.assign({}, sj, {
        university: plan.university || sj.university,
        program: plan.program || sj.program,
        tuitionCurrency: plan.currency || sj.tuitionCurrency,
        fxRateToBDT: Number(plan.fxRateToBDT) || sj.fxRateToBDT,
        nextInstallmentForeign: nextInst,
        monthlyTuitionSinking: Math.ceil(nextInst / mos),
        monthlyLiving: Math.round((Number(plan.livingAnnual)||13000) / 12)
      });
      global.AppState.set("studentFinancialPlan", updatedSj);
    }
  }
}

function computePlanMetrics(p){
  var t = Math.max(0, Number(p.tuitionAnnual) || 0);
  var l = Math.max(0, Number(p.livingAnnual) || 0);
  var f = Math.max(0, Number(p.feesAnnual) || 0);
  var s = Math.max(0, Number(p.scholarshipAnnual) || 0);
  var grossAnnual = t + l + f;
  var netAnnual = Math.max(0, grossAnnual - s);
  var yrs = Math.max(1, Math.min(6, parseInt(p.durationYears, 10) || 4));
  var inf = Math.max(0, Math.min(25, Number(p.inflationPct) || 0)) / 100;
  var fx = Math.max(0.0001, Number(p.fxRateToBDT) || DEFAULT_FX_TO_BDT[p.currency] || 119.50);

  var breakdown = [];
  var multiYearTotal = 0;
  for (var y = 1; y <= yrs; y++){
    var factor = Math.pow(1 + inf, y - 1);
    var yTuition = Math.round(Math.max(0, t - s) * factor);
    var yLiving = Math.round((l + f) * factor);
    var yTotal = yTuition + yLiving;
    multiYearTotal += yTotal;
    breakdown.push({
      year: "Year " + y,
      tuition: yTuition,
      living: yLiving,
      total: yTotal,
      totalBDT: Math.round(yTotal * fx)
    });
  }

  var paidF = Math.max(0, Number(p.paidForeign) || 0);
  var remainingAnnualF = Math.max(0, netAnnual - paidF);
  var fundedPct = netAnnual > 0 ? Math.min(100, Math.max(0, Math.round((paidF / netAnnual) * 100))) : 100;
  var netAnnualBDT = Math.round(netAnnual * fx);
  var paidBDT = Math.round(paidF * fx);
  var remainingBDT = Math.max(0, netAnnualBDT - paidBDT);
  var multiYearBDT = Math.round(multiYearTotal * fx);
  var savingsWithPlan = Math.round(netAnnual * 0.048);

  /* Build Custom Installments Schedule */
  var installments = [];
  if (p.scheduleMode === "semester"){
    installments = [
      { id: "inst-0", label: "Semester 1 Tuition & Registration (45%)", amount: Math.round(Math.max(0, t - s) * 0.45 + f * 0.5), due: "Fall Intake" },
      { id: "inst-1", label: "Semester 2 Tuition Balance (55%)",        amount: Math.round(Math.max(0, t - s) * 0.55 + f * 0.5), due: "Spring Intake" },
      { id: "inst-2", label: "Annual Housing & Living Allowance",       amount: Math.round(l),                                   due: "Monthly / Term" }
    ];
  } else if (p.scheduleMode === "trimester"){
    installments = [
      { id: "inst-0", label: "Trimester 1 Tuition & Fees (34%)", amount: Math.round(netAnnual * 0.34), due: "Term 1" },
      { id: "inst-1", label: "Trimester 2 Tuition & Fees (33%)", amount: Math.round(netAnnual * 0.33), due: "Term 2" },
      { id: "inst-2", label: "Trimester 3 Tuition & Fees (33%)", amount: Math.round(netAnnual * 0.33), due: "Term 3" }
    ];
  } else if (p.scheduleMode === "quarterly"){
    for (var q = 1; q <= 4; q++){
      installments.push({ id: "inst-" + (q-1), label: "Quarter " + q + " Installment (25%)", amount: Math.round(netAnnual * 0.25), due: "Q" + q });
    }
  } else if (p.scheduleMode === "monthly"){
    for (var m = 1; m <= 12; m++){
      installments.push({ id: "inst-" + (m-1), label: "Month " + m + " Tuition & Living Plan", amount: Math.round(netAnnual / 12), due: "Month " + m });
    }
  } else {
    installments = [
      { id: "inst-0", label: "Full Annual Lump-Sum Settlement (100%)", amount: Math.round(netAnnual), due: p.intake || "Before Enrollment" }
    ];
  }

  return {
    grossAnnual: grossAnnual,
    netAnnual: netAnnual,
    netAnnualBDT: netAnnualBDT,
    paidForeign: paidF,
    paidBDT: paidBDT,
    remainingForeign: remainingAnnualF,
    remainingBDT: remainingBDT,
    fundedPct: fundedPct,
    multiYearTotal: multiYearTotal,
    multiYearBDT: multiYearBDT,
    savingsWithPlan: savingsWithPlan,
    breakdown: breakdown,
    installments: installments
  };
}

function renderBarChart(breakdown, ccy){
  ccy = ccy || "CAD";
  var sym = U.ccySym(ccy).trim();
  var maxVal = 10000;
  (breakdown || []).forEach(function(item){
    if (item.tuition > maxVal) maxVal = item.tuition;
    if (item.living > maxVal) maxVal = item.living;
  });
  maxVal = Math.max(1000, Math.ceil((maxVal * 1.15) / 5000) * 5000);
  var step1 = Math.round(maxVal * 0.9);
  var step2 = Math.round(maxVal * 0.6);
  var step3 = Math.round(maxVal * 0.3);
  var count = (breakdown || []).length || 1;
  var spacing = Math.min(110, Math.floor(440 / count));

  var chartHtml = '<svg viewBox="0 0 540 190" width="100%" height="190">' +
    '<line x1="58" y1="30" x2="520" y2="30" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<text x="52" y="34" font-size="10" fill="#94a3b8" text-anchor="end">' + sym + (step1 >= 1000 ? Math.round(step1 / 1000) + 'k' : step1) + '</text>' +
    '<line x1="58" y1="75" x2="520" y2="75" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<text x="52" y="79" font-size="10" fill="#94a3b8" text-anchor="end">' + sym + (step2 >= 1000 ? Math.round(step2 / 1000) + 'k' : step2) + '</text>' +
    '<line x1="58" y1="120" x2="520" y2="120" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<text x="52" y="124" font-size="10" fill="#94a3b8" text-anchor="end">' + sym + (step3 >= 1000 ? Math.round(step3 / 1000) + 'k' : step3) + '</text>' +
    '<line x1="58" y1="158" x2="520" y2="158" stroke="#e2e8f0" stroke-width="1.5"/>';

  (breakdown || []).forEach(function(item, idx){
    var xGroup = 74 + idx * spacing;
    var tH = Math.max(4, (item.tuition / maxVal) * 122);
    var lH = Math.max(4, (item.living / maxVal) * 122);

    chartHtml += '<rect x="' + xGroup + '" y="' + (158 - tH) + '" width="24" height="' + tH + '" rx="5" fill="#0D9F9A"/>';
    chartHtml += '<rect x="' + (xGroup + 27) + '" y="' + (158 - lH) + '" width="24" height="' + lH + '" rx="5" fill="#06b6d4"/>';
    chartHtml += '<text x="' + (xGroup + 25) + '" y="176" font-size="11" font-weight="700" fill="#64748b" text-anchor="middle">' + U.esc(item.year) + '</text>';
  });

  chartHtml += '</svg>';
  return chartHtml;
}

function renderRadialDial(percent){
  percent = Math.min(100, Math.max(0, Math.round(percent || 0)));
  var r = 48, C = 2 * Math.PI * r;
  var strokeLen = (percent / 100) * C;
  return '<div style="position:relative;width:124px;height:124px;display:flex;align-items:center;justify-content:center;">' +
    '<svg viewBox="0 0 120 120" width="124" height="124">' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#e2e8f0" stroke-width="14"/>' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#0D9F9A" stroke-width="14" ' +
        'stroke-linecap="round" stroke-dasharray="' + strokeLen.toFixed(1) + ' ' + C.toFixed(1) + '" ' +
        'transform="rotate(-90 60 60)"/>' +
    '</svg>' +
    '<div style="position:absolute;text-align:center;line-height:1.1;">' +
      '<b style="font-size:22px;font-weight:850;color:#0f172a;">' + percent + '%</b>' +
      '<span style="font-size:10px;font-weight:700;color:#64748b;display:block;">FUNDED</span>' +
    '</div>' +
  '</div>';
}

function render(){
  var el = U.$("#view");
  if (!el) return;
  var tData = global.SeedTuition || {};
  var plan = getCustomPlan();
  var m = computePlanMetrics(plan);
  var sym = U.ccySym(plan.currency);

  var appStateTuition = (global.AppState && global.AppState.get("tuition")) || {};
  var deadlinesList = Array.isArray(appStateTuition.deadlines) && appStateTuition.deadlines.length ? appStateTuition.deadlines : (tData.deadlines || []);
  var checklistItems = (Array.isArray(appStateTuition.checklist) && appStateTuition.checklist.length)
    ? appStateTuition.checklist.map(function(c, idx){
        var seedC = (tData.checklist && tData.checklist[idx]) || {};
        return {
          id: c.id || seedC.id || ("ck-" + idx),
          label: c.label || seedC.label || "Document",
          text: c.text || seedC.text || "",
          checked: typeof c.checked === "boolean" ? c.checked : (typeof c.done === "boolean" ? c.done : true)
        };
      })
    : (tData.checklist || []);

  var ccyList = ["CAD", "USD", "CNY", "GBP", "EUR", "AUD", "SGD", "USDT", "BDT"];
  var budgetDiffBDT = Number(plan.budgetBDT || 0) - m.netAnnualBDT;

  el.innerHTML =
    '<div class="page" style="max-width:1340px;">' +
      '<div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">' +
        '<div>' +
          '<p class="eyebrow">Module 4 · Fully Customizable Global Tuition Studio</p>' +
          '<h1 class="page-title">Custom University Tuition Planner</h1>' +
          '<p class="page-sub">Customize every detail of your education plan: university, program, currency, tuition, housing, scholarships, duration, installments, deadlines, and BDT budget.</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-secondary btn-sm" id="tuitionPrintBtn" style="border-radius:10px;">🖨️ Print Custom Plan</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="tuitionResetBtn" style="border-radius:10px;">🔄 Reset Defaults</button>' +
        '</div>' +
      '</div>' +

      /* FULL CUSTOM TUITION PLAN BUILDER CARD */
      '<div class="card" style="border-radius:20px;padding:26px;margin-bottom:24px;border:1.5px solid #99F6E4;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);">' +
        '<div class="card-head" style="margin-bottom:16px;">' +
          '<div>' +
            '<h2 style="font-size:19px;font-weight:850;color:#0f172a;margin:0;">✨ Customize Your University &amp; Financial Plan</h2>' +
            '<span style="font-size:12.5px;color:#64748b;">Pick a global university preset or type any custom university, degree, tuition, scholarship, and payment schedule below.</span>' +
          '</div>' +
          '<span class="badge badge-ok" style="font-size:11.5px;padding:5px 10px;">100% Editable Custom Plan</span>' +
        '</div>' +

        /* Row 1: Preset Selector + Custom University Name + Country + Program + Intake */
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:14px;margin-bottom:16px;">' +
          '<div class="field" style="margin:0;">' +
            '<label for="tuitionUniSelect">1. Select Preset or Custom Mode</label>' +
            '<select class="input" id="tuitionUniSelect" style="font-weight:700;">' +
              '<option value="__custom__"' + (plan.isCustomUni ? " selected" : "") + '>✨ Custom University / Institution...</option>' +
              (tData.universities || []).map(function(u){
                var sel = (!plan.isCustomUni && u.name === plan.presetUniversity) ? " selected" : "";
                return '<option value="' + U.esc(u.name) + '"' + sel + '>' + U.esc(u.name) + ' (' + U.esc(u.country) + ' · ' + U.esc(u.ccy) + ')</option>';
              }).join("") +
            '</select>' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpUniNameInput">2. University / Institution Name</label>' +
            '<input type="text" class="input" id="tpUniNameInput" value="' + U.esc(plan.university) + '" placeholder="Type any university name..." style="font-weight:700;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpCountryInput">3. Country / City</label>' +
            '<input type="text" class="input" id="tpCountryInput" value="' + U.esc(plan.country) + '" placeholder="e.g. Canada, UK, China, USA">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpProgramInput">4. Degree / Program / Major</label>' +
            '<input type="text" class="input" id="tpProgramInput" value="' + U.esc(plan.program) + '" placeholder="e.g. BSc Computer Science">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpIntakeInput">5. Intake Semester / Start Date</label>' +
            '<input type="text" class="input" id="tpIntakeInput" value="' + U.esc(plan.intake) + '" placeholder="e.g. Fall 2026 / Jan 2027">' +
          '</div>' +
        '</div>' +

        /* Row 2: Billing Currency, FX Rate, Tuition, Living, Insurance/Fees, Scholarship */
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(175px, 1fr));gap:14px;margin-bottom:16px;padding-top:14px;border-top:1px dashed #cbd5e1;">' +
          '<div class="field" style="margin:0;">' +
            '<label for="tpCurrencySelect">Billing Currency</label>' +
            '<select class="input" id="tpCurrencySelect" style="font-weight:800;color:#0D9F9A;">' +
              ccyList.map(function(c){
                return '<option value="' + c + '"' + (c === plan.currency ? " selected" : "") + '>' + c + ' (' + U.ccySym(c).trim() + ')</option>';
              }).join("") +
            '</select>' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpFxRateInput">FX Rate (1 ' + U.esc(plan.currency) + ' → BDT ৳)</label>' +
            '<input type="number" step="0.0001" min="0.01" class="input mono" id="tpFxRateInput" value="' + plan.fxRateToBDT + '" style="font-weight:700;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpTuitionInput">Annual Tuition (' + U.esc(plan.currency) + ')</label>' +
            '<input type="number" step="100" min="0" class="input mono" id="tpTuitionInput" value="' + plan.tuitionAnnual + '" style="font-weight:800;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpLivingInput">Living &amp; Housing (' + U.esc(plan.currency) + ')</label>' +
            '<input type="number" step="100" min="0" class="input mono" id="tpLivingInput" value="' + plan.livingAnnual + '" style="font-weight:800;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpFeesInput">Insurance, Visa &amp; Books (' + U.esc(plan.currency) + ')</label>' +
            '<input type="number" step="50" min="0" class="input mono" id="tpFeesInput" value="' + plan.feesAnnual + '" style="font-weight:700;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpScholarshipInput" style="color:#059669;">Scholarship / Waiver (−' + U.esc(plan.currency) + ')</label>' +
            '<input type="number" step="100" min="0" class="input mono" id="tpScholarshipInput" value="' + plan.scholarshipAnnual + '" style="font-weight:800;color:#059669;background:#f0fdf4;border-color:#86efac;">' +
          '</div>' +
        '</div>' +

        /* Row 3: Duration, Inflation, Schedule Mode, Paid Foreign, Paid BDT (#bPaid), Total BDT Budget */
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(185px, 1fr));gap:14px;align-items:end;padding-top:14px;border-top:1px dashed #cbd5e1;">' +
          '<div class="field" style="margin:0;">' +
            '<label for="tpDurationSelect">Program Duration</label>' +
            '<select class="input" id="tpDurationSelect" style="font-weight:700;">' +
              [1, 2, 3, 4, 5, 6].map(function(yr){
                return '<option value="' + yr + '"' + (yr === Number(plan.durationYears) ? " selected" : "") + '>' + yr + (yr === 1 ? ' Year Program' : ' Years Program') + '</option>';
              }).join("") +
            '</select>' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpInflationInput">Annual Fee Inflation (%)</label>' +
            '<input type="number" step="0.5" min="0" max="25" class="input mono" id="tpInflationInput" value="' + plan.inflationPct + '">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpScheduleSelect">Installment Plan Structure</label>' +
            '<select class="input" id="tpScheduleSelect" style="font-weight:700;">' +
              '<option value="semester"' + (plan.scheduleMode === "semester" ? " selected" : "") + '>2 Semesters (45% / 55% + Living)</option>' +
              '<option value="trimester"' + (plan.scheduleMode === "trimester" ? " selected" : "") + '>3 Trimesters (34% / 33% / 33%)</option>' +
              '<option value="quarterly"' + (plan.scheduleMode === "quarterly" ? " selected" : "") + '>4 Quarterly Installments (25% × 4)</option>' +
              '<option value="monthly"' + (plan.scheduleMode === "monthly" ? " selected" : "") + '>12 Monthly Installments</option>' +
              '<option value="annual"' + (plan.scheduleMode === "annual" ? " selected" : "") + '>1 Annual Lump Sum (100%)</option>' +
            '</select>' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpPaidForeignInput">Already Paid (' + U.esc(plan.currency) + ')</label>' +
            '<input type="number" step="100" min="0" class="input mono" id="tpPaidForeignInput" value="' + plan.paidForeign + '" style="font-weight:800;color:#0D9F9A;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="bPaid">Already Paid in BDT (৳)</label>' +
            '<input type="number" step="1000" min="0" class="input mono" id="bPaid" value="' + m.paidBDT + '" style="font-weight:700;">' +
          '</div>' +

          '<div class="field" style="margin:0;">' +
            '<label for="tpBudgetBDTInput">Target Annual Budget (৳ BDT)</label>' +
            '<input type="number" step="10000" min="0" class="input mono" id="tpBudgetBDTInput" value="' + plan.budgetBDT + '" style="font-weight:700;">' +
          '</div>' +

          '<button type="button" class="btn btn-primary" id="tuitionCalcBtn" style="padding:12px 20px;border-radius:12px;font-weight:800;justify-content:center;">' +
            '⚡ Save &amp; Update Plan' +
          '</button>' +
        '</div>' +
      '</div>' +

      /* Middle Results Grid: Left = Custom Summary & Radial Dial, Right = Multi-Year Bar Chart */
      '<div class="grid g2" style="margin-bottom:24px;">' +

        /* Left: Net Annual Cost, BDT Equivalent, & Funded Radial Dial */
        '<div class="card" style="border-radius:20px;padding:24px;">' +
          '<div class="card-head" style="align-items:flex-start;">' +
            '<div>' +
              '<span style="font-size:11.5px;font-weight:800;color:#0D9F9A;text-transform:uppercase;letter-spacing:0.05em;">' + U.esc(plan.university) + ' · ' + U.esc(plan.program) + '</span>' +
              '<div style="font-size:30px;font-weight:850;color:#0f172a;letter-spacing:-0.03em;margin-top:4px;">' + sym + m.netAnnual.toLocaleString() + ' ' + U.esc(plan.currency) + ' <small style="font-size:13px;color:#64748b;font-weight:600;">/ year net</small></div>' +
              '<div style="font-size:14px;font-weight:700;color:#059669;margin-top:2px;">≈ ৳' + m.netAnnualBDT.toLocaleString() + ' BDT <span style="color:#64748b;font-weight:500;">(@ 1 ' + U.esc(plan.currency) + ' = ' + plan.fxRateToBDT + ' BDT)</span></div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<span style="font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;">Total (' + plan.durationYears + ' Yrs)</span>' +
              '<div style="font-size:21px;font-weight:850;color:#0D9F9A;margin-top:4px;">' + sym + m.multiYearTotal.toLocaleString() + '</div>' +
              '<div style="font-size:12px;color:#64748b;font-weight:600;">≈ ৳' + m.multiYearBDT.toLocaleString() + ' BDT</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 14px;padding-top:14px;border-top:1px solid #f1f5f9;flex-wrap:wrap;gap:16px;">' +
            renderRadialDial(m.fundedPct) +
            '<div style="flex:1;min-width:210px;display:flex;flex-direction:column;gap:7px;">' +
              '<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 12px;background:#E6F8F7;border-radius:8px;">' +
                '<span style="color:#071B33;font-weight:700;">Gross Tuition + Living + Fees</span>' +
                '<b style="color:#071B33;">' + sym + m.grossAnnual.toLocaleString() + ' ' + U.esc(plan.currency) + '</b>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 12px;background:#f0fdf4;border-radius:8px;">' +
                '<span style="color:#15803d;font-weight:700;">Scholarship / Waiver Deduction</span>' +
                '<b style="color:#15803d;">− ' + sym + Number(plan.scholarshipAnnual || 0).toLocaleString() + ' ' + U.esc(plan.currency) + '</b>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 12px;background:#ecfeff;border-radius:8px;">' +
                '<span style="color:#0e7490;font-weight:700;">Already Funded / Paid</span>' +
                '<b style="color:#0e7490;">' + sym + m.paidForeign.toLocaleString() + ' (৳' + m.paidBDT.toLocaleString() + ')</b>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 12px;background:#fff7ed;border-radius:8px;">' +
                '<span style="color:#c2410c;font-weight:700;">Remaining Year-1 Balance</span>' +
                '<b style="color:#c2410c;">' + sym + m.remainingForeign.toLocaleString() + ' (৳' + m.remainingBDT.toLocaleString() + ')</b>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* BDT Budget Status Banner */
          '<div style="background:' + (budgetDiffBDT >= 0 ? '#f0fdf4' : '#fef2f2') + ';border:1px solid ' + (budgetDiffBDT >= 0 ? '#bbf7d0' : '#fecaca') + ';border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
              '<b style="font-size:13px;color:' + (budgetDiffBDT >= 0 ? '#15803d' : '#b91c1c') + ';display:block;">' +
                (budgetDiffBDT >= 0
                  ? '✓ Within Target BDT Budget (Surplus: ৳' + budgetDiffBDT.toLocaleString() + ' BDT)'
                  : '⚠️ Exceeds Target BDT Budget by ৳' + Math.abs(budgetDiffBDT).toLocaleString() + ' BDT') +
              '</b>' +
              '<span style="font-size:12px;color:#475569;">Save ~' + sym + m.savingsWithPlan.toLocaleString() + ' ' + U.esc(plan.currency) + ' using scheduled Probaho FX locks</span>' +
            '</div>' +
            '<a href="#/send?amount=' + Math.max(100, m.remainingForeign) + '&currency=' + U.esc(plan.currency) + '" class="btn btn-sm btn-primary" style="text-decoration:none;border-radius:8px;">🚀 Pay Tuition Now</a>' +
          '</div>' +
        '</div>' +

        /* Right: Dynamic Multi-Year Cost Breakdown Bar Chart */
        '<div class="card" style="border-radius:20px;padding:24px;">' +
          '<div class="card-head">' +
            '<h2>' + plan.durationYears + '-Year Custom Projection (' + U.esc(plan.inflationPct) + '%/yr inflation)</h2>' +
            '<div style="display:flex;gap:14px;font-size:12px;font-weight:700;">' +
              '<span style="color:#0D9F9A;display:flex;align-items:center;gap:4px;"><i style="width:8px;height:8px;background:#0D9F9A;border-radius:2px;display:inline-block;"></i> Net Tuition</span>' +
              '<span style="color:#06b6d4;display:flex;align-items:center;gap:4px;"><i style="width:8px;height:8px;background:#06b6d4;border-radius:2px;display:inline-block;"></i> Living &amp; Fees</span>' +
            '</div>' +
          '</div>' +
          renderBarChart(m.breakdown, plan.currency) +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:8px;margin-top:10px;">' +
            m.breakdown.map(function(b){
              return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:12px;">' +
                '<b style="color:#0f172a;display:block;">' + U.esc(b.year) + '</b>' +
                '<span style="color:#0D9F9A;font-weight:700;">' + sym + b.total.toLocaleString() + '</span>' +
                '<div style="font-size:10.5px;color:#64748b;">৳' + b.totalBDT.toLocaleString() + '</div>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</div>' +

      '</div>' +

      /* Custom Installment Schedule Table */
      '<div class="card" style="border-radius:20px;padding:24px;margin-bottom:24px;">' +
        '<div class="card-head" style="margin-bottom:12px;">' +
          '<div>' +
            '<h2 style="margin:0;font-size:18px;font-weight:850;color:#0f172a;">📅 Custom Installment Payment Schedule (' + U.esc(plan.university) + ')</h2>' +
            '<span style="font-size:12.5px;color:#64748b;">Generated from your custom tuition plan. Click "Mark Paid" to update your funded progress or "Pay via Remit" to initiate a transfer.</span>' +
          '</div>' +
          '<span class="badge badge-demo">' + m.installments.length + ' Installments</span>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table class="clean-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Installment Milestone</th>' +
                '<th>Timing / Term</th>' +
                '<th>Amount (' + U.esc(plan.currency) + ')</th>' +
                '<th>BDT Equivalent (৳)</th>' +
                '<th>Status</th>' +
                '<th style="text-align:right;">Actions</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              m.installments.map(function(inst){
                var isPaid = !!(plan.paidInstallments && plan.paidInstallments[inst.id]);
                var bdtEq = Math.round(inst.amount * plan.fxRateToBDT);
                return '<tr>' +
                  '<td><b style="color:#0f172a;">' + U.esc(inst.label) + '</b></td>' +
                  '<td>' + U.esc(inst.due) + '</td>' +
                  '<td class="mono" style="font-weight:800;color:#0D9F9A;">' + sym + inst.amount.toLocaleString() + ' ' + U.esc(plan.currency) + '</td>' +
                  '<td class="mono" style="font-weight:700;color:#0f172a;">৳' + bdtEq.toLocaleString() + ' BDT</td>' +
                  '<td><span class="badge ' + (isPaid ? 'badge-ok' : 'badge-warn') + '">' + (isPaid ? 'PAID ✓' : 'UPCOMING') + '</span></td>' +
                  '<td style="text-align:right;white-space:nowrap;">' +
                    '<button type="button" class="btn btn-sm btn-secondary" data-toggle-inst="' + U.esc(inst.id) + '" data-inst-amt="' + inst.amount + '" style="border-radius:8px;margin-right:6px;">' +
                      (isPaid ? 'Mark Unpaid' : '✓ Mark Paid') +
                    '</button>' +
                    '<button type="button" class="btn btn-sm btn-secondary" data-remind-inst="' + U.esc(inst.id) + '" data-inst-title="' + U.esc(inst.label) + '" data-inst-amt="' + sym + inst.amount.toLocaleString() + ' ' + U.esc(plan.currency) + '" style="border-radius:8px;margin-right:6px;" title="Set upcoming payment alert">🔔 Remind</button>' +
                    '<a href="#/send?amount=' + inst.amount + '&currency=' + U.esc(plan.currency) + '" class="btn btn-sm btn-primary" style="border-radius:8px;text-decoration:none;">Pay via Remit →</a>' +
                  '</td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* Deadlines & Custom Checklist Cards */
      '<div class="grid g2">' +
        '<div class="card" style="border-radius:18px;">' +
          '<div class="card-head">' +
            '<h2>Custom Tuition Deadlines (' + deadlinesList.length + ')</h2>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="addDl">+ Add Custom Deadline</button>' +
          '</div>' +
          '<div style="display:grid;gap:10px;margin-top:10px;">' +
            deadlinesList.map(function(d, idx){
              var daysLeft = U.daysUntil ? U.daysUntil(d.due) : null;
              var daysTxt = daysLeft !== null ? (daysLeft >= 0 ? daysLeft + " days left" : Math.abs(daysLeft) + "d ago") : (d.status || "upcoming");
              var isPaidDl = d.status === "paid";
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;gap:10px;">' +
                '<div>' +
                  '<b style="font-size:13.5px;color:#0f172a;display:block;">' + U.esc(d.title) + '</b>' +
                  '<span style="font-size:11.5px;color:#64748b;">' + U.esc(d.institution || plan.university) + ' · Due: ' + U.esc(d.due) + ' (' + U.esc(daysTxt) + ')</span>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<div style="text-align:right;margin-right:4px;">' +
                    '<b style="font-size:14px;color:#0D9F9A;">' + U.esc(d.ccy) + ' ' + Number(d.amount || 0).toLocaleString() + '</b>' +
                    '<span style="display:block;font-size:10px;font-weight:700;color:' + (isPaidDl ? '#15803d' : '#b45309') + ';background:' + (isPaidDl ? '#dcfce7' : '#fef3c7') + ';padding:1px 6px;border-radius:4px;margin-top:2px;">' + U.esc((d.status || "upcoming").toUpperCase()) + '</span>' +
                  '</div>' +
                  '<button type="button" class="btn btn-ghost btn-sm" data-toggle-dl="' + idx + '" title="Toggle Paid/Upcoming" style="padding:4px 8px;">✓</button>' +
                  '<button type="button" class="btn btn-ghost btn-sm" data-edit-dl="' + idx + '" title="Edit deadline" style="padding:4px 8px;">✏️</button>' +
                  '<button type="button" class="btn btn-ghost btn-sm" data-del-dl="' + idx + '" data-act="del" title="Remove deadline" style="color:#ef4444;padding:4px 8px;">✕</button>' +
                '</div>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</div>' +

        '<div class="card" style="border-radius:18px;">' +
          '<div class="card-head">' +
            '<h2>Custom Document &amp; Visa Checklist (' + checklistItems.filter(function(x){ return x.checked !== false; }).length + '/' + checklistItems.length + ')</h2>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="addCkBtn">+ Add Custom Item</button>' +
          '</div>' +
          '<div style="display:grid;gap:10px;margin-top:10px;">' +
            checklistItems.map(function(c, i){
              var isChecked = c.checked !== false;
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;gap:10px;">' +
                '<label style="display:flex;align-items:center;gap:12px;cursor:pointer;flex:1;">' +
                  '<input type="checkbox" class="tuition-check" data-ck="' + U.esc(c.id || i) + '" data-idx="' + i + '"' + (isChecked ? ' checked' : '') + ' style="accent-color:#0D9F9A;width:18px;height:18px;">' +
                  '<div>' +
                    '<b style="font-size:13px;color:#0f172a;display:block;">' + U.esc(c.label) + '</b>' +
                    '<span style="font-size:11.5px;color:#64748b;">' + U.esc(c.text) + '</span>' +
                  '</div>' +
                '</label>' +
                '<button type="button" class="btn btn-ghost btn-sm" data-del-ck="' + i + '" title="Delete checklist item" style="color:#ef4444;padding:4px 8px;">✕</button>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>';

  /* 1. Preset University Dropdown Change */
  var uniSel = U.$("#tuitionUniSelect", el);
  if (uniSel){
    uniSel.addEventListener("change", function(){
      var val = uniSel.value;
      if (val === "__custom__"){
        plan.isCustomUni = true;
        saveCustomPlan(plan);
        render();
        var nameInp = U.$("#tpUniNameInput");
        if (nameInp) { nameInp.focus(); nameInp.select(); }
        return;
      }
      var foundU = (tData.universities || []).find(function(x){ return x.name === val; });
      if (foundU){
        plan.isCustomUni = false;
        plan.presetUniversity = foundU.name;
        plan.university = foundU.name;
        plan.country = foundU.country || "Global";
        plan.program = (foundU.prog && foundU.prog[0]) || "Computer Science";
        plan.currency = foundU.ccy || "USD";
        plan.fxRateToBDT = DEFAULT_FX_TO_BDT[plan.currency] || 119.50;
        plan.tuitionAnnual = Number(foundU.tuition) || 30000;
        plan.livingAnnual = Number(foundU.living) || 12000;
        var netNew = Math.max(0, plan.tuitionAnnual + plan.livingAnnual + plan.feesAnnual - plan.scholarshipAnnual);
        plan.paidForeign = Math.round(netNew * 0.72);
        saveCustomPlan(plan);
        render();
      }
    });
  }

  /* 2. Currency Select Change -> auto-update default FX rate to BDT */
  var ccySel = U.$("#tpCurrencySelect", el);
  if (ccySel){
    ccySel.addEventListener("change", function(){
      plan.currency = ccySel.value;
      plan.fxRateToBDT = DEFAULT_FX_TO_BDT[plan.currency] || 119.50;
      saveCustomPlan(plan);
      render();
    });
  }

  /* 3. Read all form inputs and persist Custom Plan */
  function syncPlanFromInputs(){
    var uName = U.$("#tpUniNameInput", el);
    var ctry = U.$("#tpCountryInput", el);
    var prog = U.$("#tpProgramInput", el);
    var intk = U.$("#tpIntakeInput", el);
    var ccy = U.$("#tpCurrencySelect", el);
    var fx = U.$("#tpFxRateInput", el);
    var tuit = U.$("#tpTuitionInput", el);
    var liv = U.$("#tpLivingInput", el);
    var fees = U.$("#tpFeesInput", el);
    var schol = U.$("#tpScholarshipInput", el);
    var dur = U.$("#tpDurationSelect", el);
    var inf = U.$("#tpInflationInput", el);
    var sched = U.$("#tpScheduleSelect", el);
    var paidF = U.$("#tpPaidForeignInput", el);
    var budBdt = U.$("#tpBudgetBDTInput", el);

    if (uName) plan.university = uName.value.trim() || "Custom University";
    if (ctry) plan.country = ctry.value.trim() || "Global";
    if (prog) plan.program = prog.value.trim() || "Degree Program";
    if (intk) plan.intake = intk.value.trim() || "Fall 2026";
    if (ccy) plan.currency = ccy.value;
    if (fx) plan.fxRateToBDT = Math.max(0.0001, parseFloat(fx.value) || 1);
    if (tuit) plan.tuitionAnnual = Math.max(0, parseFloat(tuit.value) || 0);
    if (liv) plan.livingAnnual = Math.max(0, parseFloat(liv.value) || 0);
    if (fees) plan.feesAnnual = Math.max(0, parseFloat(fees.value) || 0);
    if (schol) plan.scholarshipAnnual = Math.max(0, parseFloat(schol.value) || 0);
    if (dur) plan.durationYears = parseInt(dur.value, 10) || 4;
    if (inf) plan.inflationPct = Math.max(0, parseFloat(inf.value) || 0);
    if (sched) plan.scheduleMode = sched.value;
    if (paidF) plan.paidForeign = Math.max(0, parseFloat(paidF.value) || 0);
    if (budBdt) plan.budgetBDT = Math.max(0, parseFloat(budBdt.value) || 0);

    saveCustomPlan(plan);
  }

  var calcBtn = U.$("#tuitionCalcBtn", el);
  if (calcBtn){
    calcBtn.addEventListener("click", function(){
      syncPlanFromInputs();
      global.Toast.show("Custom tuition plan updated for " + plan.university + "!", "ok");
      render();
    });
  }

  /* Live #bPaid input handler (required by QA harness & BDT paid input) */
  var bPaidInp = U.$("#bPaid", el);
  if (bPaidInp){
    bPaidInp.addEventListener("input", U.debounce(function(){
      var bdtVal = Math.max(0, parseFloat(bPaidInp.value) || 0);
      var tState = (global.AppState && global.AppState.get("tuition")) || {};
      tState.budget = tState.budget || {};
      tState.budget.paidBDT = bdtVal;
      plan.paidForeign = Math.round((bdtVal / (plan.fxRateToBDT || 1)) * 100) / 100;
      tState.customPlan = plan;
      if (global.AppState) global.AppState.set("tuition", tState);
      render();
    }, 350));
  }

  U.$$("[data-remind-inst]", el).forEach(function(b){
    b.addEventListener("click", function(){
      var title = b.getAttribute("data-inst-title");
      var amt = b.getAttribute("data-inst-amt");
      if (global.NotificationHub && typeof global.NotificationHub.openAddReminderModal === "function"){
        global.NotificationHub.openAddReminderModal({ title: title, amount: amt });
      }
    });
  });

  /* Toggle Installment Paid / Unpaid */
  U.$$("[data-toggle-inst]", el).forEach(function(btn){
    btn.addEventListener("click", function(){
      var instId = btn.getAttribute("data-toggle-inst");
      var instAmt = parseFloat(btn.getAttribute("data-inst-amt")) || 0;
      plan.paidInstallments = plan.paidInstallments || {};
      var nowPaid = !plan.paidInstallments[instId];
      plan.paidInstallments[instId] = nowPaid;
      if (nowPaid){
        plan.paidForeign = Math.round(plan.paidForeign + instAmt);
      } else {
        plan.paidForeign = Math.max(0, Math.round(plan.paidForeign - instAmt));
      }
      saveCustomPlan(plan);
      global.Toast.show(nowPaid ? "Installment marked as PAID!" : "Installment marked as upcoming.", "ok");
      render();
    });
  });

  /* Print Custom Plan */
  var printBtn = U.$("#tuitionPrintBtn", el);
  if (printBtn){
    printBtn.addEventListener("click", function(){
      if (typeof window.print === "function") window.print();
    });
  }

  /* Reset Defaults */
  var resetBtn = U.$("#tuitionResetBtn", el);
  if (resetBtn){
    resetBtn.addEventListener("click", function(){
      if (global.AppState && global.AppState.resetDemo) global.AppState.resetDemo();
      var tState = (global.AppState && global.AppState.get("tuition")) || {};
      delete tState.customPlan;
      if (global.AppState) global.AppState.set("tuition", tState);
      global.Toast.show("Custom tuition planner reset to default seeds!", "ok");
      render();
    });
  }

  /* Add Custom Deadline Modal */
  var addDlBtn = U.$("#addDl", el);
  if (addDlBtn){
    addDlBtn.addEventListener("click", function(){
      global.Modal.open({
        title: "Add Custom Tuition Deadline",
        body: '<div style="display:grid;gap:12px;">' +
          '<div class="field"><label for="fTitle">Deadline Title *</label><input class="input" id="fTitle" placeholder="e.g. Semester 1 Tuition Deposit"></div>' +
          '<div class="field"><label for="fInst">Institution *</label><input class="input" id="fInst" value="' + U.esc(plan.university) + '"></div>' +
          '<div class="grid g3">' +
            '<div class="field"><label for="fAmt">Amount *</label><input class="input mono" type="number" id="fAmt" value="15000"></div>' +
            '<div class="field"><label for="fCcy">Currency *</label><input class="input mono" id="fCcy" value="' + U.esc(plan.currency) + '" maxlength="4"></div>' +
            '<div class="field"><label for="fDue">Due Date *</label><input class="input mono" type="date" id="fDue" value="2027-01-15"></div>' +
          '</div>' +
        '</div>',
        okLabel: "Add deadline",
        onOk: function(){
          var title = document.getElementById("fTitle").value.trim();
          var inst = document.getElementById("fInst").value.trim() || plan.university;
          var amt = parseFloat(document.getElementById("fAmt").value) || 0;
          var ccy = document.getElementById("fCcy").value.trim().toUpperCase() || plan.currency;
          var due = document.getElementById("fDue").value || "2027-01-15";
          if (!title || amt <= 0){
            global.Toast.show("Please enter a valid title and positive amount.", "warn");
            return false;
          }
          var tState = (global.AppState && global.AppState.get("tuition")) || {};
          var dls = (Array.isArray(tState.deadlines) && tState.deadlines.length ? tState.deadlines : deadlinesList).slice();
          dls.unshift({ id: "td-" + Date.now(), title: title, institution: inst, amount: amt, ccy: ccy, due: due, status: "upcoming" });
          tState.deadlines = dls;
          if (global.AppState) global.AppState.set("tuition", tState);
          global.Toast.show("Custom tuition deadline added!", "ok");
          render();
        }
      });
    });
  }

  /* Toggle / Edit / Delete Deadline */
  U.$$("[data-toggle-dl]", el).forEach(function(btn){
    btn.addEventListener("click", function(){
      var idx = parseInt(btn.getAttribute("data-toggle-dl"), 10);
      var tState = (global.AppState && global.AppState.get("tuition")) || {};
      var dls = (Array.isArray(tState.deadlines) && tState.deadlines.length ? tState.deadlines : deadlinesList).slice();
      if (dls[idx]){
        dls[idx].status = dls[idx].status === "paid" ? "upcoming" : "paid";
        tState.deadlines = dls;
        if (global.AppState) global.AppState.set("tuition", tState);
        render();
      }
    });
  });

  U.$$("[data-edit-dl]", el).forEach(function(btn){
    btn.addEventListener("click", function(){
      var idx = parseInt(btn.getAttribute("data-edit-dl"), 10);
      var tState = (global.AppState && global.AppState.get("tuition")) || {};
      var dls = (Array.isArray(tState.deadlines) && tState.deadlines.length ? tState.deadlines : deadlinesList).slice();
      var d = dls[idx];
      if (!d) return;
      global.Modal.open({
        title: "Edit Tuition Deadline",
        body: '<div style="display:grid;gap:12px;">' +
          '<div class="field"><label>Deadline Title</label><input class="input" id="edTitle" value="' + U.esc(d.title) + '"></div>' +
          '<div class="field"><label>Institution</label><input class="input" id="edInst" value="' + U.esc(d.institution || plan.university) + '"></div>' +
          '<div class="grid g3">' +
            '<div class="field"><label>Amount</label><input class="input mono" type="number" id="edAmt" value="' + d.amount + '"></div>' +
            '<div class="field"><label>Currency</label><input class="input mono" id="edCcy" value="' + U.esc(d.ccy) + '"></div>' +
            '<div class="field"><label>Due Date</label><input class="input mono" type="date" id="edDue" value="' + U.esc(d.due) + '"></div>' +
          '</div>' +
        '</div>',
        okLabel: "Save Changes",
        onOk: function(){
          d.title = document.getElementById("edTitle").value.trim() || d.title;
          d.institution = document.getElementById("edInst").value.trim() || d.institution;
          d.amount = parseFloat(document.getElementById("edAmt").value) || d.amount;
          d.ccy = document.getElementById("edCcy").value.trim().toUpperCase() || d.ccy;
          d.due = document.getElementById("edDue").value || d.due;
          tState.deadlines = dls;
          if (global.AppState) global.AppState.set("tuition", tState);
          global.Toast.show("Deadline updated!", "ok");
          render();
        }
      });
    });
  });

  U.$$("[data-del-dl]", el).forEach(function(btn){
    btn.addEventListener("click", function(){
      var idx = parseInt(btn.getAttribute("data-del-dl"), 10);
      var tState = (global.AppState && global.AppState.get("tuition")) || {};
      var dls = (Array.isArray(tState.deadlines) && tState.deadlines.length ? tState.deadlines : deadlinesList).slice();
      dls.splice(idx, 1);
      tState.deadlines = dls;
      if (global.AppState) global.AppState.set("tuition", tState);
      global.Toast.show("Deadline removed.", "ok");
      render();
    });
  });

  /* Add / Toggle / Delete Custom Checklist Item */
  var addCkBtn = U.$("#addCkBtn", el);
  if (addCkBtn){
    addCkBtn.addEventListener("click", function(){
      global.Modal.open({
        title: "Add Custom Checklist Requirement",
        body: '<div style="display:grid;gap:12px;">' +
          '<div class="field"><label>Requirement Title *</label><input class="input" id="ckNewLabel" placeholder="e.g. CAS / I-20 / Study Permit Approval"></div>' +
          '<div class="field"><label>Notes / Instructions</label><input class="input" id="ckNewText" placeholder="e.g. Upload stamped admission & financial proof"></div>' +
        '</div>',
        okLabel: "Add Requirement",
        onOk: function(){
          var lbl = document.getElementById("ckNewLabel").value.trim();
          var txt = document.getElementById("ckNewText").value.trim() || "Custom requirement";
          if (!lbl){
            global.Toast.show("Please enter a requirement title.", "warn");
            return false;
          }
          checklistItems.push({ id: "ck-" + Date.now(), label: lbl, text: txt, checked: false, done: false });
          var tState = (global.AppState && global.AppState.get("tuition")) || {};
          tState.checklist = checklistItems;
          if (global.AppState) global.AppState.set("tuition", tState);
          global.Toast.show("Checklist requirement added!", "ok");
          render();
        }
      });
    });
  }

  U.$$(".tuition-check", el).forEach(function(ck){
    ck.addEventListener("change", function(){
      var idx = parseInt(ck.getAttribute("data-idx"), 10);
      if (!isNaN(idx) && checklistItems[idx]){
        checklistItems[idx].checked = ck.checked;
        checklistItems[idx].done = ck.checked;
        if (global.AppState){
          var tState = global.AppState.get("tuition") || {};
          tState.checklist = checklistItems;
          global.AppState.set("tuition", tState);
        }
        render();
      }
    });
  });

  U.$$("[data-del-ck]", el).forEach(function(btn){
    btn.addEventListener("click", function(){
      var idx = parseInt(btn.getAttribute("data-del-ck"), 10);
      checklistItems.splice(idx, 1);
      var tState = (global.AppState && global.AppState.get("tuition")) || {};
      tState.checklist = checklistItems;
      if (global.AppState) global.AppState.set("tuition", tState);
      global.Toast.show("Checklist item removed.", "ok");
      render();
    });
  });
}

global.ModTuition = { render: render, meta:{ title:"Custom Tuition Planner", nav:"Tuition Planner", icon:"book" } };
})(typeof window !== "undefined" ? window : global);

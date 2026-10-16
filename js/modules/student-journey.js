/* ============================================================
   student-journey.js — End-to-End Connected Student Financial Journey (#/student-journey)
   100% Bi-Directionally Connected with:
   - AI Copilot+ Agent (NVIDIA Nemotron 3 Ultra 550B)
   - Custom University Tuition Planner (#/tuition-planner)
   - Smarter Transfer Optimizer (#/corridor-optimizer)
   - Explainable ScamShield (#/scamshield)
   - Multi-Currency & Web3 Payment Vault (#/payment-vault)
   ============================================================ */
(function(global){
"use strict";
var U = global.U;

var activeStoryAct = 1;
var lastAiReplyBox = null;
var lastStoryExecHtml = "";

function getSyncedPlan(){
  var LLM = global.ProbahoLocalLLM;
  var existing = (global.AppState && global.AppState.get("studentFinancialPlan")) || null;
  if (existing && existing.tuitionCurrency !== "CNY" && existing.tuitionCurrency !== "BDT" && existing.monthlyLiving === 10811){
    /* Self-heal accidental 10,811 typo back to 1,080 */
    existing.monthlyLiving = 1080;
    if (global.AppState) global.AppState.set("studentFinancialPlan", existing);
  }
  if (LLM && typeof LLM.syncStudentJourney === "function"){
    if (!existing){
      var snap = LLM.getLiveSnapshot ? LLM.getLiveSnapshot() : null;
      var tPlan = (snap && snap.tuition) ? snap.tuition : {};
      var aCorr = (snap && snap.activeCorridor) ? snap.activeCorridor : {};
      var FE = global.FinancialEngine;
      var rem = Math.max(2000, Number(tPlan.remainingForeign) || 12000);
      var inst = Math.round(rem / 2) || 6000;
      var months = 4;
      var famSend = (aCorr.sendCcy === "CNY") ? 2000 : 350;
      var mid = aCorr.midRate || 119.50;
      var qFam = (FE && FE.canonicalQuote) ? FE.canonicalQuote(famSend, 4.50, 0.22, mid * 0.9999) : { fee: 5.27, receive: Math.round((famSend - 5.27) * mid) };
      var initLiv = Math.round((Number(tPlan.livingAnnual) || 13000) / 12);
      if (initLiv === 10811) initLiv = 1080;
      existing = {
        monthsHorizon: months,
        university: tPlan.university || "University of Toronto",
        program: tPlan.program || "MSc Computer Science & AI",
        tuitionCurrency: tPlan.currency || "CAD",
        fxRateToBDT: tPlan.fxRateToBDT || 86.80,
        nextInstallmentForeign: inst,
        monthlyTuitionSinking: Math.ceil(inst / months),
        projectedVaultYield: Number((inst * (0.068 * (months / 12))).toFixed(2)),
        monthlyLiving: initLiv,
        corridorId: aCorr.id || "us-dhaka",
        corridorLabel: aCorr.label || "United States → Bangladesh",
        monthlyFamilySend: famSend,
        familySendCcy: aCorr.sendCcy || "USD",
        familyFee: qFam.fee,
        familyReceiveBDT: qFam.receive,
        bdGovtIncentiveBDT: Number((qFam.receive * 0.025).toFixed(2)),
        bestProvider: aCorr.bestProvider || "Wise",
        recipientId: "b0000000-0000-0000-0000-000000000001",
        recipientName: "Rahim Ahmed (Brother · bKash)",
        monthlyEmergencySave: 250,
        lockedMonths: {}
      };
    }
    return existing;
  }
  return existing || {
    monthsHorizon: 4,
    university: "University of Toronto",
    program: "MSc Computer Science & AI",
    tuitionCurrency: "CAD",
    fxRateToBDT: 86.80,
    nextInstallmentForeign: 6000,
    monthlyTuitionSinking: 1500,
    projectedVaultYield: 136.00,
    monthlyLiving: 1080,
    corridorId: "us-dhaka",
    corridorLabel: "United States → Bangladesh",
    monthlyFamilySend: 350,
    familySendCcy: "USD",
    familyFee: 5.27,
    familyReceiveBDT: 41195.80,
    bdGovtIncentiveBDT: 1029.90,
    bestProvider: "Wise",
    recipientId: "b0000000-0000-0000-0000-000000000001",
    recipientName: "Rahim Ahmed (Brother · bKash)",
    monthlyEmergencySave: 250,
    lockedMonths: {}
  };
}

function buildScheduleRowsHtml(jp){
  var lockedMonths = jp.lockedMonths || {};
  var monthNames = [
    "Month 1 (Nov 2026)", "Month 2 (Dec 2026)", "Month 3 (Jan 2027)", "Month 4 (Feb 2027)",
    "Month 5 (Mar 2027)", "Month 6 (Apr 2027)", "Month 7 (May 2027)", "Month 8 (Jun 2027)",
    "Month 9 (Jul 2027)", "Month 10 (Aug 2027)", "Month 11 (Sep 2027)", "Month 12 (Oct 2027)"
  ];
  var rows = [];
  for (var m = 1; m <= jp.monthsHorizon; m++){
    var isFinal = (m === jp.monthsHorizon);
    var isLocked = !!lockedMonths["m" + m];
    var mLabel = (monthNames[m - 1] || ("Month " + m)) + (isFinal ? " — Tuition Deadline" : "");
    var cumSaved = Math.min(jp.nextInstallmentForeign, jp.monthlyTuitionSinking * m);
    var pct = Math.min(100, Math.round((cumSaved / Math.max(1, jp.nextInstallmentForeign)) * 100));
    rows.push(
      '<tr style="' + (isLocked ? 'background:rgba(16,185,129,0.08);' : '') + '">' +
        '<td>' +
          '<b>' + U.esc(mLabel) + '</b>' +
          (isLocked ? ' <span class="badge badge-ok" style="margin-left:6px;">✓ Vault Locked</span>' : (isFinal ? ' <span class="badge badge-blue" style="margin-left:6px;">100% Target</span>' : '')) +
        '</td>' +
        '<td class="mono" style="color:#097A76;font-weight:800;">' + U.esc(jp.tuitionCurrency) + ' ' + Number(jp.monthlyTuitionSinking).toLocaleString() + ' <span class="tiny muted">(' + pct + '% cumulative)</span></td>' +
        '<td class="mono" style="color:#6d28d9;font-weight:700;">' + U.esc(jp.tuitionCurrency) + ' ' + Number(jp.monthlyLiving).toLocaleString() + '</td>' +
        '<td class="mono" style="color:#047857;font-weight:800;">' + Number(jp.monthlyFamilySend).toLocaleString() + ' ' + U.esc(jp.familySendCcy) + ' → ৳' + Number(jp.familyReceiveBDT).toLocaleString() + ' BDT</td>' +
        '<td class="mono" style="font-weight:700;">$' + Number(jp.monthlyEmergencySave).toLocaleString() + ' USD</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button type="button" class="btn ' + (isLocked ? 'btn-secondary' : 'btn-primary') + ' btn-sm" data-lock-month="' + m + '" data-lock-amt="' + jp.monthlyTuitionSinking + '" data-lock-ccy="' + U.esc(jp.tuitionCurrency) + '">' +
              (isLocked ? '✓ Locked in Vault' : '🔒 Lock Month ' + m + ' Fund') +
            '</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-remind-m="' + m + '" data-remind-title="' + U.esc(mLabel) + '" data-remind-amt="' + jp.monthlyTuitionSinking + ' ' + U.esc(jp.tuitionCurrency) + '" title="Set upcoming payment alert">🔔 Remind</button>' +
            '<a href="#/send?amount=' + jp.monthlyFamilySend + '&currency=' + U.esc(jp.familySendCcy) + '&beneficiary_id=' + U.esc(jp.recipientId) + '&purpose=Family+Support" class="btn btn-secondary btn-sm" style="text-decoration:none;">⚡ Send Family ৳</a>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }
  return rows.join("");
}

function render(){
  var el = U.$("#view");
  if (!el) return;

  var LLM = global.ProbahoLocalLLM;
  var snap = (LLM && LLM.getLiveSnapshot) ? LLM.getLiveSnapshot() : null;
  var jp = getSyncedPlan();
  var netWorthUSD = (snap && snap.wallet) ? snap.wallet.netWorthUSD : 48493.24;
  var allCorridors = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
  var lockedMonths = jp.lockedMonths || {};
  var lockedCount = Object.keys(lockedMonths).filter(function(k){ return !!lockedMonths[k]; }).length;

  var actDetails = {
    1: {
      badge: "ACT 1 OF 4 · AI GOAL UNDERSTANDING & HOLISTIC PLAN",
      title: "Ishan's Goal: Tuition in " + jp.monthsHorizon + " Months + Monthly Family Support to Dhaka",
      scenario: "Ishan Ahmed is a Bangladeshi student studying at " + jp.university + ". He has a semester tuition installment of " + jp.tuitionCurrency + " " + Number(jp.nextInstallmentForeign).toLocaleString() + " due in " + jp.monthsHorizon + " months, pays " + jp.tuitionCurrency + " " + Number(jp.monthlyLiving).toLocaleString() + "/mo for living expenses, and sends " + jp.monthlyFamilySend + " " + jp.familySendCcy + "/mo home to his family in Dhaka.",
      quote: '"Amar ' + jp.monthsHorizon + ' months por tuition dite hobe, sathe family ke monthly taka pathate hoy"',
      solution: "AI Copilot+ parses Ishan's goal and builds a synchronized " + jp.monthsHorizon + "-month plan: locking " + jp.tuitionCurrency + " " + Number(jp.monthlyTuitionSinking).toLocaleString() + "/mo in a 6.8% APY Tuition Sinking Vault while routing his monthly family support via " + jp.bestProvider + " for ৳" + Number(jp.familyReceiveBDT).toLocaleString() + " BDT net payout (+৳" + Number(jp.bdGovtIncentiveBDT).toLocaleString() + " BD Govt Incentive).",
      execBtnLabel: "⚡ Execute Act 1 Live: Generate & Sync AI Plan on This Page",
      navLabel: "🤖 Open Full Copilot+ Studio →",
      navHref: "#/copilot"
    },
    2: {
      badge: "ACT 2 OF 4 · EXPLAINABLE SCAMSHIELD INTERCEPTION",
      title: "Intercepting a Fake Tuition Account Change & WhatsApp Discount Trap",
      scenario: "Before his tuition deadline, Ishan receives an urgent message in Banglish/Bangla claiming the university's tuition bank account has changed and offering a '10% special discount' if he sends an advance fee via WhatsApp and shares his OTP.",
      quote: '"URGENT Bhai: University tuition fee account change hoyeche! Ekhoni notun personal bKash number e taka pathan, 8% extra rate & special discount paben. WhatsApp e OTP code din."',
      solution: "Explainable ScamShield scans the message inline, highlights every suspicious phrase ('URGENT', 'notun personal bKash', 'special discount', 'WhatsApp', 'OTP code din'), scores it Critical Risk, and gives Ishan a 3-step verification checklist.",
      execBtnLabel: "🛡️ Execute Act 2 Live: Run Explainable ScamShield Scan Here",
      navLabel: "🛡️ Open Full ScamShield Module →",
      navHref: "#/scamshield"
    },
    3: {
      badge: "ACT 3 OF 4 · SMARTER TRANSFER OPTIMIZER WITH VISIBLE REASONING",
      title: "Transparent Net Payout After All Fees & FX Spread",
      scenario: "When sending his " + jp.monthlyFamilySend + " " + jp.familySendCcy + " monthly family support on " + jp.corridorLabel + ", Ishan wants to see exact recipient payout after all fees and FX spread, delivery time, and why the #1 route wins.",
      quote: '"Compare all 5 providers on ' + jp.corridorLabel + ' for ' + jp.monthlyFamilySend + ' ' + jp.familySendCcy + ' and show exact net payout formula."',
      solution: "Smarter Transfer Optimizer deducts upfront fees and FX spread using FinancialEngine.canonicalQuote, proving " + jp.bestProvider + " delivers ৳" + Number(jp.familyReceiveBDT).toLocaleString() + " BDT net to his family.",
      execBtnLabel: "📊 Execute Act 3 Live: Run 5-Provider Optimizer Comparison Here",
      navLabel: "⚡ Open Full Smarter Optimizer →",
      navHref: "#/corridor-optimizer"
    },
    4: {
      badge: "ACT 4 OF 4 · MULTI-CURRENCY VAULT YIELD & AUDITABLE RECEIPTS",
      title: "Locking Tuition Sinking Fund at 6.8% APY & Claiming 2.5% BD Govt Incentive",
      scenario: "Ishan locks Month 1's tuition sinking fund (" + jp.tuitionCurrency + " " + Number(jp.monthlyTuitionSinking).toLocaleString() + ") in the High-Yield Payment Vault, earning +" + jp.tuitionCurrency + " " + jp.projectedVaultYield + " APY yield before his deadline.",
      quote: '"Lock Month 1 tuition sinking fund (' + jp.tuitionCurrency + ' ' + jp.monthlyTuitionSinking + ') in High-Yield Vault and update my tuition progress."',
      solution: "The Vault locks the funds immediately, updates wallet.allocations, marks Month 1 as Locked in the schedule below, and increments Tuition Planner progress.",
      execBtnLabel: "🔒 Execute Act 4 Live: Lock Month 1 Tuition Fund in Vault Now",
      navLabel: "🪙 Open Multi-Currency Vault →",
      navHref: "#/payment-vault"
    }
  }[activeStoryAct] || {};

  var ccyList = ["CAD", "USD", "GBP", "EUR", "AUD", "CNY", "SGD"];

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      /* Top Header */
      '<div class="page-head" style="text-align:center;max-width:920px;margin:0 auto 20px;">' +
        '<div style="display:inline-flex;align-items:center;gap:8px;background:#E6F8F7;border:1px solid #99F6E4;color:#097A76;padding:5px 14px;border-radius:999px;font-size:11.5px;font-weight:800;margin-bottom:10px;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>' +
          '<span>🧭 END-TO-END CONNECTED STUDENT FINANCIAL ASSISTANT · TUITION + REMITTANCE + SAVINGS + SAFETY</span>' +
        '</div>' +
        '<h1 class="page-title">Connected Student Financial Journey</h1>' +
        '<p class="page-sub">Live bi-directional synchronization between <b>AI Copilot+ Agent</b>, <b>Tuition Planner</b>, <b>Smarter Transfer Optimizer</b>, <b>Explainable ScamShield</b>, and <b>Payment Vault</b>.</p>' +
      '</div>' +

      /* ============================================================
         EMBEDDED AI COPILOT+ GOAL ARCHITECT BAR (Zero API Keys Shown!)
         ============================================================ */
      '<div class="card" style="border-radius:22px;padding:22px 24px;margin-bottom:24px;background:linear-gradient(135deg,#f8fafc 0%,#E6F8F7 100%);border:2px solid #0D9F9A;box-shadow:0 12px 30px -10px rgba(37,99,235,0.18);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '' + (U.aiOrb ? U.aiOrb("ai-orb-md") : '<div style="width:38px;height:38px;border-radius:50%;background:#7c3aed;color:#fff;display:grid;place-items:center;">🤖</div>') + '' +
            '<div>' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                '<b style="font-size:15px;color:#0f172a;">AI Copilot+ Live Journey Architect (Nemotron 3 Ultra 550B)</b>' +
                '<span class="badge badge-ok" style="font-size:10px;">AI ENGINE ACTIVE</span>' +
              '</div>' +
              '<span style="font-size:12px;color:#475569;">Tell Copilot+ your tuition deadline, living/rent budget, emergency buffer, or monthly family remittance in English, Banglish, or Bangla — updates live!</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* AI Input Form */
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<input type="text" class="input" id="sjAiPromptInput" value="Amar ' + jp.monthsHorizon + ' months por tuition dite hobe, sathe family ke monthly taka pathate hoy" placeholder="e.g. Change living budget to 1200 USD, emergency buffer to 300, or Amar 4 months por tuition..." style="flex:1;min-width:min(100%, 220px);background:#fff;font-weight:600;">' +
          '<button type="button" class="btn btn-primary" id="sjAiRunBtn" style="font-weight:800;padding:10px 20px;">🤖 Generate &amp; Update Journey with AI Copilot+</button>' +
        '</div>' +

        /* 1-Click AI Scenario Presets */
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
          '<span style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;">1-Click AI Presets:</span>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-ai-preset="Amar 4 months por tuition dite hobe, sathe family ke monthly taka pathate hoy, living cost 1080 CAD, emergency buffer 250" style="border-radius:999px;font-size:11.5px;">🇧🇩 4-Mo Canada Plan (Banglish)</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-ai-preset="Change my plan to MIT with 18000 USD tuition in 5 months and 450 USD monthly family remittance, living budget 1450, emergency buffer 300" style="border-radius:999px;font-size:11.5px;">🇺🇸 MIT USA ($18k in 5 Mos · Living $1,450)</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-ai-preset="Set my plan to Tsinghua University with 30000 CNY tuition in 3 months and 2500 CNY monthly family remittance, living budget 3200, emergency buffer 200" style="border-radius:999px;font-size:11.5px;">🇨🇳 Tsinghua China (¥30k in 3 Mos · Living ¥3,200)</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-ai-preset="Update my plan to UCL London with 14800 GBP tuition in 6 months and 300 GBP monthly family remittance, living budget 1150, emergency buffer 250" style="border-radius:999px;font-size:11.5px;">🇬🇧 UCL London (£14.8k in 6 Mos · Living £1,150)</button>' +
        '</div>' +

        /* Live AI Copilot+ Response Box inside #/student-journey */
        '<div id="sjAiReplyContainer" style="margin-top:' + (lastAiReplyBox ? '14px' : '0') + ';">' +
          (lastAiReplyBox ? (
            '<div style="background:#fff;border:1.5px solid #93c5fd;border-radius:14px;padding:14px 18px;">' +
              (lastAiReplyBox.thinking && lastAiReplyBox.thinking.steps ? (
                '<details class="ai-thought-trace" style="margin-bottom:10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:8px 12px;font-size:12px;color:#475569;">' +
                  '<summary style="cursor:pointer;font-weight:750;color:#0D9F9A;display:flex;align-items:center;gap:6px;list-style:none;">' +
                    '<span>💭 Thought for ' + (lastAiReplyBox.thinking.timeSeconds || "1.4") + 's · View step-by-step AI reasoning process</span>' +
                    '<span style="font-size:10px;margin-left:auto;">▼</span>' +
                  '</summary>' +
                  '<div style="margin-top:8px;padding-top:6px;border-top:1px dashed #cbd5e1;line-height:1.55;color:#334155;">' +
                    lastAiReplyBox.thinking.steps.map(function(st){ return '<div style="margin-bottom:3px;"><span style="color:#0D9F9A;font-weight:700;">✓</span> ' + U.esc(st) + '</div>'; }).join("") +
                  '</div>' +
                '</details>'
              ) : '') +
              '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">' +
                '<span style="font-size:11px;font-weight:900;color:#097A76;">' + U.esc(lastAiReplyBox.title || "COPILOT+ LIVE PLAN") + '</span>' +
                '<span style="font-size:10px;font-weight:800;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:4px;">' + U.esc(lastAiReplyBox.badge || "AI SYNCED") + '</span>' +
              '</div>' +
              '<p style="margin:0 0 8px;font-size:13.5px;color:#0f172a;line-height:1.5;">' + lastAiReplyBox.text + '</p>' +
              (lastAiReplyBox.dataBox ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:12.5px;line-height:1.55;color:#334155;">' + lastAiReplyBox.dataBox + '</div>' : '') +
            '</div>'
          ) : '') +
        '</div>' +
      '</div>' +

      /* ============================================================
         CONNECTED 4-PILLAR KPI STRIP (Directly Editable & Live Synced on Every Keystroke!)
         ============================================================ */
      '<div class="grid g4" style="margin-bottom:24px;">' +
        '<div class="card" style="padding:18px;border-top:4px solid #0D9F9A;">' +
          '<span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;">🎓 1. Tuition Sinking Target</span>' +
          '<div id="sjKpiTuitionVal" style="font-size:22px;font-weight:900;color:#0f172a;margin:6px 0 4px;">' + U.esc(jp.tuitionCurrency) + ' ' + Number(jp.monthlyTuitionSinking).toLocaleString() + '<span style="font-size:13px;color:#64748b;">/mo</span></div>' +
          '<span id="sjKpiTuitionSub" style="font-size:12px;color:#097A76;font-weight:700;">' + U.esc(jp.tuitionCurrency) + ' ' + Number(jp.nextInstallmentForeign).toLocaleString() + ' due in ' + jp.monthsHorizon + ' mos (' + U.esc(jp.university) + ')</span>' +
        '</div>' +
        '<div class="card" style="padding:18px;border-top:4px solid #059669;">' +
          '<span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;">💸 2. Monthly Family Remittance</span>' +
          '<div id="sjKpiFamilyVal" style="font-size:22px;font-weight:900;color:#0f172a;margin:6px 0 4px;">৳' + Number(jp.familyReceiveBDT).toLocaleString() + ' <span style="font-size:13px;color:#64748b;">BDT/mo</span></div>' +
          '<span id="sjKpiFamilySub" style="font-size:12px;color:#059669;font-weight:700;">From ' + Number(jp.monthlyFamilySend).toLocaleString() + ' ' + U.esc(jp.familySendCcy) + ' via ' + U.esc(jp.bestProvider) + ' (+৳' + Number(jp.bdGovtIncentiveBDT).toLocaleString() + ' bonus)</span>' +
        '</div>' +
        '<div class="card" style="padding:18px;border-top:4px solid #7c3aed;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">' +
            '<span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;">🏠 3. Host Living &amp; Rent Budget</span>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnQuickEditLiving" style="padding:2px 6px;font-size:10.5px;min-height:22px;color:#7c3aed;font-weight:800;">✏️ Edit</button>' +
          '</div>' +
          '<div id="sjKpiLivingVal" style="font-size:22px;font-weight:900;color:#0f172a;margin:6px 0 4px;">' + U.esc(jp.tuitionCurrency) + ' ' + Number(jp.monthlyLiving).toLocaleString() + '<span style="font-size:13px;color:#64748b;">/mo</span></div>' +
          '<span id="sjKpiLivingSub" style="font-size:12px;color:#7c3aed;font-weight:700;display:block;">Plus $' + Number(jp.monthlyEmergencySave).toLocaleString() + '/mo Emergency FX Buffer (' + lockedCount + '/' + jp.monthsHorizon + ' mos locked)</span>' +
          /* Direct Inline Quick-Edit Controls inside KPI Card 3 */
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;">' +
            '<div>' +
              '<label for="sjCardLivingIn" style="font-size:9.5px;font-weight:800;color:#64748b;display:block;">Living (' + U.esc(jp.tuitionCurrency) + '/mo)</label>' +
              '<input type="number" class="input" id="sjCardLivingIn" min="50" step="50" value="' + jp.monthlyLiving + '" style="min-height:30px;padding:3px 7px;font-size:12.5px;font-weight:800;">' +
            '</div>' +
            '<div>' +
              '<label for="sjCardEmIn" style="font-size:9.5px;font-weight:800;color:#64748b;display:block;">Buffer ($ USD/mo)</label>' +
              '<input type="number" class="input" id="sjCardEmIn" min="0" step="25" value="' + jp.monthlyEmergencySave + '" style="min-height:30px;padding:3px 7px;font-size:12.5px;font-weight:800;">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="padding:18px;border-top:4px solid #d97706;">' +
          '<span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;">🪙 4. Vault APY &amp; Net Worth</span>' +
          '<div id="sjKpiVaultVal" style="font-size:22px;font-weight:900;color:#0f172a;margin:6px 0 4px;">$' + Math.round(netWorthUSD).toLocaleString() + ' <span style="font-size:13px;color:#64748b;">USD</span></div>' +
          '<span id="sjKpiVaultSub" style="font-size:12px;color:#b45309;font-weight:700;">Earns +' + U.esc(jp.tuitionCurrency) + ' ' + jp.projectedVaultYield + ' yield on tuition lock</span>' +
        '</div>' +
      '</div>' +

      /* ============================================================
         SECTION 2: INTERACTIVE CONNECTED GOAL CUSTOMIZER (Instant Live Sync on Keystroke!)
         ============================================================ */
      '<div class="card" style="border-radius:20px;padding:24px;margin-bottom:24px;">' +
        '<div class="card-head" style="margin-bottom:14px;">' +
          '<div>' +
            '<h2 style="margin:0;">⚙️ Customize Your End-to-End Student Financial Plan (Instant Live Sync)</h2>' +
            '<span style="font-size:12.5px;color:#64748b;">Every field below updates the KPI cards, Month-by-Month Schedule, <b>Tuition Planner</b>, <b>Smarter Optimizer</b>, and <b>AI Copilot+</b> automatically as you type.</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<span class="badge badge-ok">INSTANT LIVE SYNC</span>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnResetJourneyDefaults" style="font-size:11.5px;">🔄 Reset Defaults</button>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:16px;">' +
          '<div class="field">' +
            '<label for="sjUniInput">Target University</label>' +
            '<input type="text" class="input" id="sjUniInput" value="' + U.esc(jp.university) + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjCcySelect">Tuition Billing Currency</label>' +
            '<select class="input" id="sjCcySelect">' +
              ccyList.map(function(c){ return '<option value="' + c + '"' + (c === jp.tuitionCurrency ? ' selected' : '') + '>' + c + '</option>'; }).join("") +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjMonths">Months Until Tuition Due</label>' +
            '<input type="number" class="input" id="sjMonths" min="1" max="18" value="' + jp.monthsHorizon + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjTuitionDue" id="lblSjTuitionDue">Next Tuition Installment (' + U.esc(jp.tuitionCurrency) + ')</label>' +
            '<input type="number" class="input" id="sjTuitionDue" min="100" step="100" value="' + jp.nextInstallmentForeign + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjLivingMo" id="lblSjLivingMo">Monthly Living &amp; Rent (' + U.esc(jp.tuitionCurrency) + '/mo)</label>' +
            '<input type="number" class="input" id="sjLivingMo" min="50" step="50" value="' + jp.monthlyLiving + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjCorridorSelect">Family Remittance Corridor</label>' +
            '<select class="input" id="sjCorridorSelect">' +
              allCorridors.map(function(cr){
                return '<option value="' + U.esc(cr.id) + '"' + (cr.id === jp.corridorId ? ' selected' : '') + '>' + U.esc(cr.label) + ' (' + cr.sendCcy + '→' + cr.receiveCcy + ')</option>';
              }).join("") +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjFamilyMo" id="lblSjFamilyMo">Monthly Family Remittance (' + U.esc(jp.familySendCcy) + ')</label>' +
            '<input type="number" class="input" id="sjFamilyMo" min="10" step="25" value="' + jp.monthlyFamilySend + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="sjEmergencyMo">Monthly Emergency FX Buffer ($ USD)</label>' +
            '<input type="number" class="input" id="sjEmergencyMo" min="0" step="25" value="' + jp.monthlyEmergencySave + '">' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-primary" id="btnRecalcJourney" style="font-weight:800;">⚡ Save &amp; Sync Across All Modules</button>' +
          '<a href="#/tuition-planner" class="btn btn-secondary" style="text-decoration:none;">🎓 Open Synced Tuition Planner</a>' +
          '<a href="#/corridor-optimizer" class="btn btn-secondary" style="text-decoration:none;">📊 Open Synced Route Optimizer</a>' +
          '<a href="#/scamshield" class="btn btn-secondary" style="text-decoration:none;">🛡️ Scan a Payment Request</a>' +
        '</div>' +
      '</div>' +

      /* ============================================================
         SECTION 3: MONTH-BY-MONTH CONNECTED SCHEDULE TABLE
         ============================================================ */
      '<div class="card" style="border-radius:20px;padding:24px;margin-bottom:26px;">' +
        '<div class="card-head" style="margin-bottom:14px;">' +
          '<div>' +
            '<h2 style="margin:0;" id="sjScheduleHeading">📅 ' + jp.monthsHorizon + '-Month Connected Cashflow, Tuition Sinking Fund &amp; Family Remittance Schedule</h2>' +
            '<span style="font-size:12.5px;color:#64748b;">Click <b>"🔒 Lock Month X Fund"</b> to lock that month&#39;s tuition slice in your Payment Vault at 6.8% APY, or <b>"⚡ Send Family ৳"</b> to launch a pre-filled transfer.</span>' +
          '</div>' +
          '<span class="badge badge-blue" id="sjLockedBadge">' + lockedCount + ' of ' + jp.monthsHorizon + ' Months Locked</span>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<table class="data">' +
            '<thead>' +
              '<tr>' +
                '<th>Timeline Milestone</th>' +
                '<th>Tuition Sinking Fund (Vault Lock)</th>' +
                '<th>Host Living &amp; Rent</th>' +
                '<th>Monthly Family Remittance (Net BDT)</th>' +
                '<th>Emergency FX Buffer</th>' +
                '<th>1-Click Connected Actions</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="sjScheduleTbody">' + buildScheduleRowsHtml(jp) + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* ============================================================
         SECTION 4: 4-ACT REAL-LIFE BANGLADESHI STUDENT STORY LIVE DEMO
         ============================================================ */
      '<div class="card" style="border-radius:22px;padding:24px;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);color:#fff;border:1px solid rgba(56,189,248,0.35);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
          '<div>' +
            '<span style="font-size:10.5px;font-weight:900;color:#38bdf8;text-transform:uppercase;letter-spacing:0.08em;">🎬 LIVE COMPETITION PITCH STORY · REAL-LIFE STUDENT SCENARIO</span>' +
            '<h2 style="margin:4px 0 0;font-size:20px;font-weight:900;color:#fff;">Ishan&#39;s 4-Act Cross-Border Student Financial Journey</h2>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-sm ' + (activeStoryAct===1?'btn-primary':'btn-secondary') + '" data-story-act="1" style="border-radius:999px;">Act 1: AI ' + jp.monthsHorizon + '-Mo Plan</button>' +
            '<button type="button" class="btn btn-sm ' + (activeStoryAct===2?'btn-primary':'btn-secondary') + '" data-story-act="2" style="border-radius:999px;">Act 2: ScamShield Defense</button>' +
            '<button type="button" class="btn btn-sm ' + (activeStoryAct===3?'btn-primary':'btn-secondary') + '" data-story-act="3" style="border-radius:999px;">Act 3: Smarter Optimizer</button>' +
            '<button type="button" class="btn btn-sm ' + (activeStoryAct===4?'btn-primary':'btn-secondary') + '" data-story-act="4" style="border-radius:999px;">Act 4: Vault &amp; 2.5% Bonus</button>' +
          '</div>' +
        '</div>' +

        '<div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:18px 20px;">' +
          '<div style="font-size:11px;font-weight:800;color:#4ade80;margin-bottom:4px;">' + U.esc(actDetails.badge) + '</div>' +
          '<h3 style="font-size:17px;font-weight:850;color:#fff;margin:0 0 8px;">' + U.esc(actDetails.title) + '</h3>' +
          '<p style="font-size:13.5px;color:#e2e8f0;line-height:1.55;margin:0 0 10px;">' + U.esc(actDetails.scenario) + '</p>' +
          '<div style="background:rgba(15,23,42,0.65);border-left:4px solid #38bdf8;padding:10px 14px;border-radius:8px;font-family:monospace;font-size:13px;color:#93c5fd;margin-bottom:12px;">' +
            U.esc(actDetails.quote) +
          '</div>' +
          '<p style="font-size:13.5px;color:#f8fafc;line-height:1.55;margin:0 0 14px;"><b>How Probaho Solves It:</b> ' + U.esc(actDetails.solution) + '</p>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-primary btn-sm" id="btnExecStoryActLive" style="font-weight:800;">' + U.esc(actDetails.execBtnLabel) + '</button>' +
            '<a href="' + actDetails.navHref + '" class="btn btn-secondary btn-sm" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);text-decoration:none;font-weight:700;">' + U.esc(actDetails.navLabel) + '</a>' +
            '<a href="#/evaluation" class="btn btn-secondary btn-sm" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);text-decoration:none;">📊 View Evaluation Report (117/117 QA)</a>' +
          '</div>' +
          (lastStoryExecHtml ? '<div style="margin-top:14px;background:#0b1324;border:1px solid #38bdf8;border-radius:12px;padding:14px 16px;color:#f8fafc;font-size:13px;line-height:1.55;">' + lastStoryExecHtml + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';

  /* ============================================================
     LIVE IN-PLACE DOM SYNC (Updates KPI Cards & Schedule on Every Keystroke Without Losing Focus!)
     ============================================================ */
  function syncFromFormInputsInPlace(source){
    var uniEl = U.$("#sjUniInput", el);
    var ccyEl = U.$("#sjCcySelect", el);
    var mosEl = U.$("#sjMonths", el);
    var tDueEl = U.$("#sjTuitionDue", el);
    var livEl = U.$("#sjLivingMo", el);
    var corrEl = U.$("#sjCorridorSelect", el);
    var famEl = U.$("#sjFamilyMo", el);
    var emEl = U.$("#sjEmergencyMo", el);
    var cardLivEl = U.$("#sjCardLivingIn", el);
    var cardEmEl = U.$("#sjCardEmIn", el);

    /* Keep KPI Card #3 inline inputs and Form inputs 100% mirrored */
    if (source === "card" && cardLivEl && livEl) livEl.value = cardLivEl.value;
    if (source === "card" && cardEmEl && emEl) emEl.value = cardEmEl.value;
    if (source === "form" && livEl && cardLivEl) cardLivEl.value = livEl.value;
    if (source === "form" && emEl && cardEmEl) cardEmEl.value = emEl.value;

    var uniVal = (uniEl && uniEl.value.trim()) ? uniEl.value.trim() : jp.university;
    var ccyVal = (ccyEl && ccyEl.value) ? ccyEl.value : jp.tuitionCurrency;
    var mVal = Math.max(1, Math.min(24, parseInt(mosEl ? mosEl.value : jp.monthsHorizon, 10) || 4));
    var tDueVal = Math.max(0, parseFloat(tDueEl ? tDueEl.value : jp.nextInstallmentForeign) || 0);
    var lMoVal = Math.max(0, parseFloat(livEl ? livEl.value : jp.monthlyLiving) || 0);
    var corrVal = (corrEl && corrEl.value) ? corrEl.value : jp.corridorId;
    var fMoVal = Math.max(0, parseFloat(famEl ? famEl.value : jp.monthlyFamilySend) || 0);
    var emMoVal = Math.max(0, parseFloat(emEl ? emEl.value : jp.monthlyEmergencySave) || 0);

    var synced = jp;
    if (LLM && typeof LLM.syncStudentJourney === "function"){
      synced = LLM.syncStudentJourney({
        university: uniVal,
        tuitionCurrency: ccyVal,
        monthsHorizon: mVal,
        nextInstallmentForeign: tDueVal,
        monthlyLiving: lMoVal,
        corridorId: corrVal,
        monthlyFamilySend: fMoVal,
        monthlyEmergencySave: emMoVal
      });
    }
    jp = synced;

    var lCount = Object.keys(synced.lockedMonths || {}).filter(function(k){ return !!synced.lockedMonths[k]; }).length;

    /* Update KPI Cards in place */
    var k1v = U.$("#sjKpiTuitionVal", el);
    if (k1v) k1v.innerHTML = U.esc(synced.tuitionCurrency) + ' ' + Number(synced.monthlyTuitionSinking).toLocaleString() + '<span style="font-size:13px;color:#64748b;">/mo</span>';
    var k1s = U.$("#sjKpiTuitionSub", el);
    if (k1s) k1s.textContent = synced.tuitionCurrency + ' ' + Number(synced.nextInstallmentForeign).toLocaleString() + ' due in ' + synced.monthsHorizon + ' mos (' + synced.university + ')';

    var k2v = U.$("#sjKpiFamilyVal", el);
    if (k2v) k2v.innerHTML = '৳' + Number(synced.familyReceiveBDT).toLocaleString() + ' <span style="font-size:13px;color:#64748b;">BDT/mo</span>';
    var k2s = U.$("#sjKpiFamilySub", el);
    if (k2s) k2s.textContent = 'From ' + Number(synced.monthlyFamilySend).toLocaleString() + ' ' + synced.familySendCcy + ' via ' + synced.bestProvider + ' (+৳' + Number(synced.bdGovtIncentiveBDT).toLocaleString() + ' bonus)';

    var k3v = U.$("#sjKpiLivingVal", el);
    if (k3v) k3v.innerHTML = U.esc(synced.tuitionCurrency) + ' ' + Number(synced.monthlyLiving).toLocaleString() + '<span style="font-size:13px;color:#64748b;">/mo</span>';
    var k3s = U.$("#sjKpiLivingSub", el);
    if (k3s) k3s.textContent = 'Plus $' + Number(synced.monthlyEmergencySave).toLocaleString() + '/mo Emergency FX Buffer (' + lCount + '/' + synced.monthsHorizon + ' mos locked)';

    var k4s = U.$("#sjKpiVaultSub", el);
    if (k4s) k4s.textContent = 'Earns +' + synced.tuitionCurrency + ' ' + synced.projectedVaultYield + ' yield on tuition lock';

    /* Update dynamic field labels */
    var lblT = U.$("#lblSjTuitionDue", el);
    if (lblT) lblT.textContent = "Next Tuition Installment (" + synced.tuitionCurrency + ")";
    var lblL = U.$("#lblSjLivingMo", el);
    if (lblL) lblL.textContent = "Monthly Living & Rent (" + synced.tuitionCurrency + "/mo)";
    var lblF = U.$("#lblSjFamilyMo", el);
    if (lblF) lblF.textContent = "Monthly Family Remittance (" + synced.familySendCcy + ")";

    /* Update Schedule Table & Heading in place */
    var sHead = U.$("#sjScheduleHeading", el);
    if (sHead) sHead.textContent = "📅 " + synced.monthsHorizon + "-Month Connected Cashflow, Tuition Sinking Fund & Family Remittance Schedule";
    var lBadge = U.$("#sjLockedBadge", el);
    if (lBadge) lBadge.textContent = lCount + " of " + synced.monthsHorizon + " Months Locked";
    var tbody = U.$("#sjScheduleTbody", el);
    if (tbody){
      tbody.innerHTML = buildScheduleRowsHtml(synced);
      bindLockButtons();
  el.querySelectorAll("[data-remind-m]").forEach(function(b){
    b.addEventListener("click", function(){
      var title = b.getAttribute("data-remind-title");
      var amt = b.getAttribute("data-remind-amt");
      if (global.NotificationHub && typeof global.NotificationHub.openAddReminderModal === "function"){
        global.NotificationHub.openAddReminderModal({ title: title, amount: amt });
      }
    });
  });
    }
    return synced;
  }

  /* Bind instant live input & change listeners to all 8 form inputs + 2 KPI Card #3 inline inputs */
  ["#sjUniInput", "#sjCcySelect", "#sjMonths", "#sjTuitionDue", "#sjLivingMo", "#sjCorridorSelect", "#sjFamilyMo", "#sjEmergencyMo"].forEach(function(sel){
    var inp = U.$(sel, el);
    if (inp){
      inp.addEventListener("input", function(){ syncFromFormInputsInPlace("form"); });
      inp.addEventListener("change", function(){ syncFromFormInputsInPlace("form"); });
    }
  });

  ["#sjCardLivingIn", "#sjCardEmIn"].forEach(function(sel){
    var inp = U.$(sel, el);
    if (inp){
      inp.addEventListener("input", function(){ syncFromFormInputsInPlace("card"); });
      inp.addEventListener("change", function(){ syncFromFormInputsInPlace("card"); });
    }
  });

  var quickEditLivBtn = U.$("#btnQuickEditLiving", el);
  if (quickEditLivBtn){
    quickEditLivBtn.addEventListener("click", function(){
      var cIn = U.$("#sjCardLivingIn", el);
      if (cIn){ cIn.focus(); if (cIn.select) cIn.select(); }
    });
  }

  /* Bind Lock Month X buttons inside Schedule Table */
  function bindLockButtons(){
    el.querySelectorAll("[data-lock-month]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var mIdx = btn.getAttribute("data-lock-month");
        var amt = parseFloat(btn.getAttribute("data-lock-amt")) || jp.monthlyTuitionSinking;
        var ccy = btn.getAttribute("data-lock-ccy") || jp.tuitionCurrency;

        if (LLM && typeof LLM.executeAction === "function"){
          LLM.executeAction({ type: "VAULT_LOCK", amount: amt, asset: ccy, days: 90 });
          var curPlan = getSyncedPlan();
          var nextLocked = Object.assign({}, curPlan.lockedMonths || {});
          nextLocked["m" + mIdx] = true;

          var tState = (global.AppState && global.AppState.get("tuition")) || {};
          var curPaid = (tState.customPlan && Number(tState.customPlan.paidForeign)) || 30384;
          LLM.syncStudentJourney({
            lockedMonths: nextLocked,
            paidForeign: curPaid + amt
          });

          if (global.Toast) global.Toast.show("🔒 Locked Month " + mIdx + " Tuition Sinking Fund (" + ccy + " " + amt.toLocaleString() + ") in Vault & updated Tuition Planner!", "ok");
          render();
        }
      });
    });
  }
  bindLockButtons();
  el.querySelectorAll("[data-remind-m]").forEach(function(b){
    b.addEventListener("click", function(){
      var title = b.getAttribute("data-remind-title");
      var amt = b.getAttribute("data-remind-amt");
      if (global.NotificationHub && typeof global.NotificationHub.openAddReminderModal === "function"){
        global.NotificationHub.openAddReminderModal({ title: title, amount: amt });
      }
    });
  });

  /* 1. Embedded AI Copilot+ Architect Bar */
  var aiInput = U.$("#sjAiPromptInput", el);
  var aiRunBtn = U.$("#sjAiRunBtn", el);

  function executeAiJourneyPrompt(promptStr, skipPreSync){
    var txt = String(promptStr || "").trim();
    if (!txt || !LLM) return;
    if (!skipPreSync){
      syncFromFormInputsInPlace("form");
    }
    if (aiRunBtn){
      aiRunBtn.disabled = true;
      aiRunBtn.textContent = "💭 AI Copilot+ Thinking Step-by-Step...";
    }
    var repCont = U.$("#sjAiReplyContainer", el);
    var startT = Date.now();
    var sjThinkTimer = null;
    if (repCont){
      repCont.style.marginTop = "14px";
      repCont.innerHTML =
        '<div style="background:#fff;border:1.5px solid #a855f7;border-radius:14px;padding:14px 18px;box-shadow:0 4px 14px rgba(124,58,237,0.1);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
            '<span style="font-size:11.5px;font-weight:800;color:#7c3aed;display:flex;align-items:center;gap:6px;">' +
              '<span class="typing"><i></i><i></i><i></i></span>' +
              '<span>AI Copilot+ Thinking Before Answering...</span>' +
            '</span>' +
            '<span class="mono" style="font-size:11px;color:#64748b;font-weight:700;" id="sjThinkTimer">0.2s</span>' +
          '</div>' +
          '<div id="sjThinkStep" style="font-size:12.5px;color:#334155;line-height:1.5;">• Step 1: Parsing student financial goal, horizon months &amp; currency parameters...</div>' +
        '</div>';
      sjThinkTimer = setInterval(function(){
        var elMs = Date.now() - startT;
        var tNode = document.getElementById("sjThinkTimer");
        if (tNode) tNode.textContent = (elMs / 1000).toFixed(1) + "s";
        var sNode = document.getElementById("sjThinkStep");
        if (sNode){
          if (elMs < 350) sNode.innerHTML = "• Step 1: Parsing student financial goal, horizon months &amp; currency parameters...";
          else if (elMs < 750) sNode.innerHTML = "• Step 2: Calculating monthly tuition sinking fund target &amp; 6.8% APY Vault yield...";
          else if (elMs < 1100) sNode.innerHTML = "• Step 3: Optimizing monthly family remittance route to Dhaka via #1 net-payout provider...";
          else sNode.innerHTML = "• Step 4: Synchronizing Connected Student Journey, Tuition Planner &amp; upcoming reminders...";
        }
      }, 100);
    }

    function completeSjReply(replyObj){
      var waitLeft = Math.max(0, 1200 - (Date.now() - startT));
      setTimeout(function(){
        if (sjThinkTimer) clearInterval(sjThinkTimer);
        lastAiReplyBox = replyObj || LLM.infer(txt);
        if (global.Toast) global.Toast.show("🤖 AI Copilot+ thought through & synced your Connected Student Journey!", "ok");
        render();
      }, waitLeft);
    }

    if (typeof LLM.inferAsync === "function"){
      LLM.inferAsync(txt, { forceOpenRouter: true }).then(function(reply){
        completeSjReply(reply || LLM.infer(txt));
      }).catch(function(){
        completeSjReply(LLM.infer(txt));
      });
    } else {
      completeSjReply(LLM.infer(txt));
    }
  }

  if (aiRunBtn && aiInput){
    aiRunBtn.addEventListener("click", function(){ executeAiJourneyPrompt(aiInput.value, false); });
    aiInput.addEventListener("keydown", function(e){ if (e.key === "Enter") executeAiJourneyPrompt(aiInput.value, false); });
  }

  el.querySelectorAll("[data-ai-preset]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var p = btn.getAttribute("data-ai-preset");
      if (aiInput) aiInput.value = p;
      executeAiJourneyPrompt(p, true);
    });
  });

  /* 2. Save & Sync Button + Reset Defaults Button */
  var recalcBtn = U.$("#btnRecalcJourney", el);
  if (recalcBtn){
    recalcBtn.addEventListener("click", function(){
      var synced = syncFromFormInputsInPlace("form");
      lastAiReplyBox = {
        title: "CONNECTED STUDENT JOURNEY · SYNCHRONIZED ACROSS ALL MODULES",
        badge: "2-WAY SYNC COMPLETE",
        text: "✅ Updated <b>" + U.esc(synced.university) + "</b> (" + synced.monthsHorizon + "-month horizon) across Tuition Planner, Smarter Optimizer, Send Money &amp; Copilot+!",
        dataBox: "• <b>Monthly Tuition Sinking Target:</b> " + U.esc(synced.tuitionCurrency) + " " + Number(synced.monthlyTuitionSinking).toLocaleString() + "/mo (for " + U.esc(synced.tuitionCurrency) + " " + Number(synced.nextInstallmentForeign).toLocaleString() + " due in " + synced.monthsHorizon + " mos)<br>" +
                 "• <b>Host Living &amp; Rent Budget:</b> " + U.esc(synced.tuitionCurrency) + " " + Number(synced.monthlyLiving).toLocaleString() + "/mo + $" + Number(synced.monthlyEmergencySave).toLocaleString() + "/mo Emergency FX Buffer<br>" +
                 "• <b>Monthly Family Remittance:</b> " + Number(synced.monthlyFamilySend).toLocaleString() + " " + U.esc(synced.familySendCcy) + "/mo → <b style='color:#15803d;'>৳" + Number(synced.familyReceiveBDT).toLocaleString() + " BDT</b> via <b>" + U.esc(synced.bestProvider) + "</b> (+৳" + Number(synced.bdGovtIncentiveBDT).toLocaleString() + " BD Govt Incentive)"
      };
      if (global.Toast) global.Toast.show("⚡ Synced " + synced.monthsHorizon + "-month plan across Tuition Planner, Optimizer & Copilot+!", "ok");
      render();
    });
  }

  var resetBtn = U.$("#btnResetJourneyDefaults", el);
  if (resetBtn){
    resetBtn.addEventListener("click", function(){
      if (LLM && typeof LLM.syncStudentJourney === "function"){
        LLM.syncStudentJourney({
          university: "University of Toronto",
          tuitionCurrency: "CAD",
          monthsHorizon: 4,
          nextInstallmentForeign: 6000,
          monthlyLiving: 1080,
          corridorId: "us-dhaka",
          monthlyFamilySend: 350,
          monthlyEmergencySave: 250,
          lockedMonths: {}
        });
      }
      lastAiReplyBox = null;
      if (global.Toast) global.Toast.show("🔄 Reset Connected Student Journey to clean defaults!", "ok");
      render();
    });
  }

  /* 4. 4-Act Story Switcher & Live Inline Execution */
  el.querySelectorAll("[data-story-act]").forEach(function(b){
    b.addEventListener("click", function(){
      activeStoryAct = Number(b.getAttribute("data-story-act")) || 1;
      lastStoryExecHtml = "";
      render();
    });
  });

  var execActBtn = U.$("#btnExecStoryActLive", el);
  if (execActBtn){
    execActBtn.addEventListener("click", function(){
      if (activeStoryAct === 1){
        executeAiJourneyPrompt("Amar " + jp.monthsHorizon + " months por tuition dite hobe, sathe family ke monthly taka pathate hoy", false);
      } else if (activeStoryAct === 2){
        var scamSample = (global.RiskEngine && global.RiskEngine.SAMPLE_BANGLISH_SCAM) || "URGENT Bhai: University tuition fee account change hoyeche! Ekhoni notun personal bKash number e taka pathan, 8% extra rate & special discount paben. WhatsApp e OTP code din.";
        var scan = (global.RiskEngine && global.RiskEngine.analyze) ? global.RiskEngine.analyze(scamSample) : { score: 88, severityLabel: "Critical risk", highlightedHtml: scamSample, triggered: [] };
        lastStoryExecHtml =
          '<div style="font-size:11px;font-weight:900;color:#f87171;margin-bottom:4px;">🚨 LIVE SCAMSHIELD INTERCEPTION RESULT · RISK SCORE: ' + scan.score + '/100 (' + U.esc(scan.severityLabel) + ')</div>' +
          '<div style="background:#1e293b;padding:10px 12px;border-radius:8px;font-family:monospace;font-size:12.5px;margin-bottom:8px;">' + scan.highlightedHtml + '</div>' +
          '<div><b>Triggered Rules (' + scan.triggered.length + '):</b> ' + scan.triggered.map(function(t){ return U.esc(t.label) + " (+" + t.weight + ")"; }).join(" · ") + '</div>';
        if (global.Toast) global.Toast.show("🛡️ Act 2 Executed: ScamShield flagged the fake tuition WhatsApp message (" + scan.score + "/100 Critical Risk)!", "warn");
        render();
      } else if (activeStoryAct === 3){
        lastStoryExecHtml =
          '<div style="font-size:11px;font-weight:900;color:#4ade80;margin-bottom:4px;">⚡ LIVE SMARTER OPTIMIZER ROUTE VERIFICATION (' + U.esc(jp.corridorLabel) + ')</div>' +
          '<div>• <b>Recommended #1 Route:</b> <b>' + U.esc(jp.bestProvider) + '</b> · Gross Send: <b>' + Number(jp.monthlyFamilySend).toLocaleString() + ' ' + U.esc(jp.familySendCcy) + '</b> − Fee: <b>' + jp.familyFee.toFixed(2) + ' ' + U.esc(jp.familySendCcy) + '</b> → Exact Recipient Payout: <b style="color:#4ade80;">৳' + Number(jp.familyReceiveBDT).toLocaleString() + ' BDT</b> (+৳' + Number(jp.bdGovtIncentiveBDT).toLocaleString() + ' 2.5% BD Govt Incentive)</div>';
        if (global.Toast) global.Toast.show("⚡ Act 3 Executed: Verified #1 net-payout route via " + jp.bestProvider + "!", "ok");
        render();
      } else if (activeStoryAct === 4){
        if (LLM && typeof LLM.executeAction === "function"){
          var lockRes = LLM.executeAction({ type: "VAULT_LOCK", amount: jp.monthlyTuitionSinking, asset: jp.tuitionCurrency, days: 90 });
          var curP = getSyncedPlan();
          var nextL = Object.assign({}, curP.lockedMonths || {}, { m1: true });
          LLM.syncStudentJourney({ lockedMonths: nextL });
          lastStoryExecHtml =
            '<div style="font-size:11px;font-weight:900;color:#38bdf8;margin-bottom:4px;">🔒 LIVE VAULT LOCK &amp; INCENTIVE CERTIFICATE GENERATED</div>' +
            '<div>• ' + U.esc(lockRes ? lockRes.summary : "Locked Month 1 Tuition Sinking Fund in Vault.") + '<br>• <b>2.5% BD Remittance Cash Incentive:</b> +৳' + Number(jp.bdGovtIncentiveBDT).toLocaleString() + ' BDT ready in Payment Vault.</div>';
          if (global.Toast) global.Toast.show("🔒 Act 4 Executed: Month 1 Tuition Sinking Fund locked in Vault!", "ok");
          render();
        }
      }
    });
  }
}

global.ModStudentJourney = {
  render: render,
  meta: { title: "Connected Student Financial Journey", nav: "Student Journey" }
};
})(typeof window !== "undefined" ? window : global);

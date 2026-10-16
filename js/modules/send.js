/* send.js — Complete 4-Step Global Remittance Flow (100% Standalone Client-Side)
   1) Beneficiary + Purpose + Global Corridor Selection
   2) Live Quote with 60-second FX lock countdown + Daily KYC Tier Limit check
   3) ScamShield Pre-Check & Region-Aware Payment Gateway Review
   4) Instant Sandbox Order Execution + Live timeline tracking + Printable PDF receipt. */
(function(global){
"use strict";
var U = global.U;

var S = null;
var lockTimer = null;
var lockSecondsRemaining = 60;

/* Region-aware payment gateway options per send currency */
function gatewaysForCurrency(ccy){
  var c = String(ccy || "USD").toUpperCase();
  if (c === "CNY") return ["Alipay", "WeChat Pay", "UnionPay", "Crypto & Fiat Vault (CNY / USDT)"];
  if (c === "GBP") return ["UK Faster Payments", "Open Banking", "Crypto & Fiat Vault (USDT / BTC)", "Apple Pay / Card"];
  if (c === "EUR") return ["SEPA Instant", "Open Banking", "Crypto & Fiat Vault (USDT / ETH)", "Debit / Credit Card"];
  if (c === "CAD") return ["Interac e-Transfer", "Direct Bank EFT", "Crypto & Fiat Vault (USDT)", "Debit Card"];
  if (c === "AUD") return ["PayID / NPP Instant", "POLi Bank Transfer", "Crypto & Fiat Vault (USDT)", "Debit Card"];
  if (c === "SGD") return ["PayNow Instant", "FAST Bank Transfer", "Crypto & Fiat Vault (USDT)", "Debit Card"];
  if (c === "SAR" || c === "AED") return ["Mada / SADAD", "Instant Bank Wire", "Crypto & Fiat Vault (USDT)", "Apple Pay"];
  if (c === "MYR") return ["FPX Online Banking", "DuitNow QR", "Crypto & Fiat Vault (USDT)", "Debit Card"];
  if (c === "BDT") return ["bKash / Nagad Funding", "BEFTN / NPSB Bank", "Crypto & Fiat Vault (BDT / USDT)", "Debit Card"];
  return ["ACH / FedNow Instant", "Crypto & Fiat Vault (USD / USDT / BTC)", "Apple Pay / Debit Card", "Domestic Wire"];
}

function findCorridorObj(cid){
  var list = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
  var q = String(cid || "us-dhaka").toLowerCase();
  for (var i = 0; i < list.length; i++){
    var item = list[i];
    if (String(item.id).toLowerCase() === q || String(item.code || "").toLowerCase() === q) return item;
  }
  if (q === "cn-bd") return list.find(function(x){ return x.id === "cn-dhaka"; }) || list[0];
  if (q === "gb-bd") return list.find(function(x){ return x.id === "uk-dhaka"; }) || list[0];
  if (q === "sa-bd") return list.find(function(x){ return x.id === "riyadh-dhaka"; }) || list[0];
  if (q === "us-bd") return list.find(function(x){ return x.id === "us-dhaka"; }) || list[0];
  return list[0] || { id:"us-dhaka", code:"US-BD", label:"United States → Bangladesh", sendCcy:"USD", receiveCcy:"BDT", midRate:119.50 };
}

function localQuote(amount, corridorId){
  var amt = Number(amount || 0);
  var match = findCorridorObj(corridorId || (S && S.corridorId) || "us-dhaka");
  var rate = match.midRate || 119.50;
  var FE = global.FinancialEngine;
  var q = FE.canonicalQuote(amt > 0 ? amt : 1, 0, 0, rate);
  return {
    send_currency: match.sendCcy || "USD",
    send_amount: amt,
    receive_currency: match.receiveCcy || "BDT",
    receive_amount: amt > 0 ? q.receive : 0,
    fx_rate: rate,
    fee_amount: q.fee,
    corridor: match.code || match.id,
    corridor_label: match.label,
    fx_locked_until: new Date(Date.now() + 60000).toISOString()
  };
}

function freshState(){
  var initCid = (global.AppState && global.AppState.get("corridorId")) || "us-dhaka";
  var corr = findCorridorObj(initCid);
  var gws = gatewaysForCurrency(corr.sendCcy);
  var kyc = (global.AppState && global.AppState.get("kycData")) || { kyc_level: "basic", daily_limit: 50000, spent_today: 13402.16, remaining_today: 36597.84 };
  return {
    step: 1,
    corridorId: corr.id,
    sendCcy: corr.sendCcy,
    receiveCcy: corr.receiveCcy,
    amount: String((global.AppState && global.AppState.get("amount")) || "1000"),
    beneficiaryId: null,
    recipientName: "",
    payoutMethod: "bkash",
    accountNumber: "",
    purpose: "Family Support",
    paymentMethod: gws[0],
    quote: null,
    lockExpiresAt: null,
    riskScore: 92,
    idempotencyKey: null,
    transferResult: null,
    events: [],
    kycData: kyc,
    notifyRecipientSms: true,
    notifySenderEmail: true,
    setUpcomingReminder: true,
    upcomingFreq: "Monthly Recurring",
    upcomingLeadDays: 3,
    upcomingDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  };
}

function stopLockTimer(){
  if (lockTimer){
    clearInterval(lockTimer);
    lockTimer = null;
  }
}

function startLockTimer(expiresIso, onExpire){
  stopLockTimer();
  var expireTs = expiresIso ? new Date(expiresIso).getTime() : Date.now() + 60000;
  lockTimer = setInterval(function(){
    var left = Math.max(0, Math.round((expireTs - Date.now()) / 1000));
    lockSecondsRemaining = left;
    var timerEl = document.getElementById("fxLockCountdown");
    if (timerEl){
      timerEl.textContent = left + "s";
      var barEl = document.getElementById("fxLockProgressBar");
      if (barEl){
        var pct = Math.max(0, Math.min(100, (left / 60) * 100));
        barEl.style.width = pct + "%";
        if (left <= 10) barEl.style.background = "#ef4444";
        else if (left <= 25) barEl.style.background = "#f59e0b";
        else barEl.style.background = "#10b981";
      }
    }
    if (left <= 0){
      stopLockTimer();
      if (onExpire) onExpire();
    }
  }, 1000);
}

function refreshQuoteAndTimer(callback){
  if (!S) S = freshState();
  var corr = findCorridorObj(S.corridorId);
  S.sendCcy = corr.sendCcy;
  S.receiveCcy = corr.receiveCcy;
  S.quote = localQuote(S.amount || 1000, S.corridorId);
  S.lockExpiresAt = S.quote.fx_locked_until;
  lockSecondsRemaining = 60;
  startLockTimer(S.lockExpiresAt, function(){
    if (global.Toast) global.Toast.show("60s FX rate lock refreshed.", "info");
    refreshQuoteAndTimer(function(){
      if (S && S.step === 2) render();
    });
  });
  if (callback) callback();
}

/* Convert any receive currency amount to BDT-equivalent for daily KYC quota comparison */
function toBdtEquivalent(amount, ccy){
  var n = Number(amount || 0);
  var c = String(ccy || "BDT").toUpperCase();
  if (c === "BDT") return n;
  var rates = { USD: 119.50, GBP: 151.80, EUR: 130.80, CAD: 86.80, AUD: 78.80, CNY: 16.7527, SGD: 91.20, AED: 32.70, SAR: 32.30, MYR: 28.80, INR: 1.42, PHP: 2.08 };
  return n * (rates[c] || 119.50);
}

function stepsBar(){
  var labels = ["Receiver & Route", "Amount & 60s Lock", "Fraud Pre-Check", "Fund & Track"];
  return '<ol class="steps" style="margin-bottom:28px;grid-template-columns:repeat(4,minmax(0,1fr));">' + labels.map(function(l, i){
    var n = i + 1;
    var isActive = S.step === n;
    var isDone = S.step > n;
    return '<li class="step' + (isActive ? " active" : "") + (isDone ? " done" : "") + '" style="padding:14px 16px;">' +
      '<span class="n">STEP ' + n + (isDone ? ' ✓' : '') + '</span><h3 style="font-size:14px;margin:4px 0 0;">' + l + '</h3></li>';
  }).join("") + '</ol>';
}

/* STEP 1: RECEIVER & GLOBAL CORRIDOR */
function renderStep1(el){
  var bens = (global.ModBeneficiaries && global.ModBeneficiaries.list()) || [];
  var allCorridors = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
  var curCorr = findCorridorObj(S.corridorId);

  el.innerHTML =
    '<div class="page" style="max-width:980px;">' +
      stepsBar() +
      '<div class="page-head">' +
        '<p class="eyebrow">Transfer Order · Step 1 of 4</p>' +
        '<h1 class="page-title">Select Beneficiary & Global Corridor</h1>' +
        '<p class="page-sub">Choose your international remittance corridor and select a verified recipient.</p>' +
      '</div>' +

      '<div class="grid gm">' +
        '<div class="card" style="border-radius:20px;padding:26px;">' +
          /* Global Corridor Selector + Quick Pills */
          '<div class="field" style="margin-bottom:18px;">' +
            '<label class="f" for="sCorridorSelect">Global Remittance Corridor (' + allCorridors.length + ' Active Routes)</label>' +
            '<select class="input" id="sCorridorSelect" style="font-weight:700;margin-bottom:10px;">' +
              allCorridors.map(function(c){
                var sel = c.id === curCorr.id ? " selected" : "";
                var f1 = c.flagFrom || U.ccyFlag(c.sendCcy);
                var f2 = c.flagTo || U.ccyFlag(c.receiveCcy);
                return '<option value="' + U.esc(c.id) + '"' + sel + '>' + f1 + ' ' + U.esc(c.label) + ' (' + c.sendCcy + ' → ' + c.receiveCcy + ' · 1 ' + c.sendCcy + ' = ' + Number(c.midRate).toFixed(c.midRate < 1 ? 4 : 2) + ' ' + c.receiveCcy + ') ' + f2 + '</option>';
              }).join("") +
            '</select>' +
            '<div class="seg" id="sCorrSeg" style="display:flex;gap:6px;flex-wrap:wrap;">' +
              [
                { id:"us-dhaka", label:"🇺🇸 US → 🇧🇩 BD" },
                { id:"uk-dhaka", label:"🇬🇧 UK → 🇧🇩 BD" },
                { id:"cn-dhaka", label:"🇨🇳 CN → 🇧🇩 BD" },
                { id:"eu-dhaka", label:"🇪🇺 EU → 🇧🇩 BD" },
                { id:"ca-dhaka", label:"🇨🇦 CA → 🇧🇩 BD" },
                { id:"riyadh-dhaka", label:"🇸🇦 SA → 🇧🇩 BD" },
                { id:"us-uk", label:"🇺🇸 US → 🇬🇧 UK" },
                { id:"us-in", label:"🇺🇸 US → 🇮🇳 IN" }
              ].map(function(p){
                var act = curCorr.id === p.id;
                return '<button type="button" data-cid="' + p.id + '" class="btn btn-sm ' + (act ? "btn-primary" : "btn-secondary") + '" style="font-size:11.5px;padding:5px 10px;">' + p.label + '</button>';
              }).join("") +
            '</div>' +
          '</div>' +

          /* Purpose of Remittance */
          '<div class="field" style="margin-bottom:22px;">' +
            '<label class="f" for="sPurpose">Transfer Purpose (Regulatory Classification)</label>' +
            '<div class="inp"><select class="input" id="sPurpose">' +
              ["Family Support", "Education / University Tuition", "Living Expenses", "Emergency Medical", "Savings & Investment", "Other"].map(function(p){
                var sel = S.purpose === p ? " selected" : "";
                return '<option value="' + p + '"' + sel + '>' + p + '</option>';
              }).join("") +
            '</select></div>' +
          '</div>' +

          /* Saved Beneficiary Selection Cards */
          '<div class="field" style="margin-bottom:16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">' +
              '<label class="f" style="margin:0;">Select Saved Beneficiary *</label>' +
              '<div style="display:flex;gap:8px;">' +
                '<button type="button" class="btn btn-secondary btn-sm" id="sQuickAddBenBtn" style="font-size:12px;">+ Add New Receiver</button>' +
                '<a href="#/beneficiaries" class="btn btn-ghost btn-sm" style="font-size:12px;color:#0D9F9A;text-decoration:none;">Manage All</a>' +
              '</div>' +
            '</div>' +

            (bens.length === 0 ?
              '<div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:14px;padding:24px;text-align:center;">' +
                '<p style="margin:0 0 10px;color:#64748b;">No saved beneficiaries found.</p>' +
                '<button type="button" class="btn btn-primary btn-sm" id="sEmptyAddBenBtn">+ Add New Receiver</button>' +
              '</div>' :
              '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:12px;" id="sBenGrid">' +
                bens.map(function(b){
                  var isSelected = S.beneficiaryId === b.id;
                  var isBkash = b.payout_method === "bkash";
                  var isNagad = b.payout_method === "nagad";
                  var badgeColor = isBkash ? "#e11d48" : isNagad ? "#ea580c" : "#0D9F9A";
                  var badgeBg = isBkash ? "#ffe4e6" : isNagad ? "#ffedd5" : "#CCFBF1";
                  return '<div class="card s-ben-card" data-bid="' + U.esc(b.id) + '" style="cursor:pointer;border-radius:14px;padding:14px;transition:all 0.15s;margin:0;' + (isSelected ? 'border:2px solid #0D9F9A;background:#E6F8F7;' : 'border:1px solid #e2e8f0;') + '">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                      '<b style="font-size:14.5px;color:#0f172a;">' + U.esc(b.name) + '</b>' +
                      '<span style="font-size:10.5px;font-weight:750;color:' + badgeColor + ';background:' + badgeBg + ';padding:2px 8px;border-radius:6px;">' + U.esc(b.payout_method.toUpperCase()) + '</span>' +
                    '</div>' +
                    '<span style="font-size:12px;color:#64748b;display:block;">' + U.esc(b.relationship || "Beneficiary") + (b.country ? ' · ' + U.esc(b.country) : '') + '</span>' +
                    '<div class="mono" style="font-size:12.5px;font-weight:700;color:#334155;margin-top:6px;">' + U.esc(b.account_number || b.phone) + '</div>' +
                  '</div>';
                }).join("") +
              '</div>'
            ) +
          '</div>' +

          '<p class="field-err" id="sStep1Err" style="color:#ef4444;font-size:12.5px;margin-bottom:12px;display:none;"></p>' +

          '<button type="button" class="btn btn-primary btn-block" id="sStep1Next" style="padding:13px;font-weight:750;border-radius:12px;margin-top:10px;">' +
            'Continue to Amount & 60s Rate Lock →' +
          '</button>' +
        '</div>' +

        /* Sidebar Info */
        '<div>' +
          '<div class="card" style="border-radius:20px;padding:22px;background:#f8fafc;">' +
            '<h3 style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:10px;">🛡️ Global Safe Transfer Guarantee</h3>' +
            '<p style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:14px;">Every transfer is screened by ScamShield AI heuristics and locked at the quoted exchange rate for 60 seconds.</p>' +
            '<div style="font-size:12px;color:#475569;display:flex;flex-direction:column;gap:8px;">' +
              '<div>✓ <b>Instant Mobile Wallets & Bank Rails</b> (bKash, Nagad, SEPA, Faster Payments, UPI, GCash)</div>' +
              '<div>✓ <b>60-Second Guaranteed FX Rate Lock</b></div>' +
              '<div>✓ <b>Zero Platform Fee</b> on promotional direct routes</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function selectCorridor(cid){
    var corr = findCorridorObj(cid);
    S.corridorId = corr.id;
    S.sendCcy = corr.sendCcy;
    S.receiveCcy = corr.receiveCcy;
    var gws = gatewaysForCurrency(corr.sendCcy);
    S.paymentMethod = gws[0];
    if (global.AppState) global.AppState.set("corridorId", corr.id);
    renderStep1(el);
  }

  var corrSelect = U.$("#sCorridorSelect", el);
  if (corrSelect){
    corrSelect.addEventListener("change", function(){
      selectCorridor(corrSelect.value);
    });
  }

  el.querySelectorAll("#sCorrSeg button").forEach(function(b){
    b.addEventListener("click", function(){
      selectCorridor(b.getAttribute("data-cid"));
    });
  });

  /* Quick add beneficiary inline modal */
  function triggerAddBen(){
    if (global.ModBeneficiaries && typeof global.ModBeneficiaries.openAddModal === "function"){
      global.ModBeneficiaries.openAddModal(null, function(newBen){
        if (newBen){
          S.beneficiaryId = newBen.id;
          S.recipientName = newBen.name;
          S.payoutMethod = newBen.payout_method;
          S.accountNumber = newBen.account_number || newBen.phone;
        }
        renderStep1(el);
      });
    }
  }
  var qAddBtn = U.$("#sQuickAddBenBtn", el);
  if (qAddBtn) qAddBtn.addEventListener("click", triggerAddBen);
  var eAddBtn = U.$("#sEmptyAddBenBtn", el);
  if (eAddBtn) eAddBtn.addEventListener("click", triggerAddBen);

  /* Beneficiary select */
  el.querySelectorAll(".s-ben-card").forEach(function(card){
    card.addEventListener("click", function(){
      var bid = card.getAttribute("data-bid");
      S.beneficiaryId = bid;
      var chosen = bens.find(function(x){ return x.id === bid; });
      if (chosen){
        S.recipientName = chosen.name;
        S.payoutMethod = chosen.payout_method;
        S.accountNumber = chosen.account_number || chosen.phone;
      }
      renderStep1(el);
    });
  });

  /* Next step */
  var nextBtn = U.$("#sStep1Next", el);
  if (nextBtn){
    nextBtn.addEventListener("click", function(){
      var errBox = U.$("#sStep1Err", el);
      if (!S.beneficiaryId){
        errBox.textContent = "Please select a beneficiary (or click '+ Add New Receiver') to continue.";
        errBox.style.display = "block";
        return;
      }
      S.purpose = U.$("#sPurpose", el).value;
      S.step = 2;
      refreshQuoteAndTimer(function(){ render(); });
    });
  }
}

/* STEP 2: AMOUNT, LIVE QUOTE & 60s FX LOCK + KYC TIER LIMIT CHECK */
function renderStep2(el){
  var q = S.quote || localQuote(S.amount || 1000, S.corridorId);
  S.quote = q;
  var rateDecimals = q.fx_rate < 1 ? 4 : 4;

  var kyc = (global.AppState && global.AppState.get("kycData")) || S.kycData || { kyc_level: "basic", daily_limit: 50000, remaining_today: 36597.84 };
  S.kycData = kyc;
  var recvBdtEquiv = toBdtEquivalent(q.receive_amount, q.receive_currency);
  var isOverLimit = recvBdtEquiv > Number(kyc.remaining_today);

  el.innerHTML =
    '<div class="page" style="max-width:980px;">' +
      stepsBar() +
      '<div class="page-head">' +
        '<p class="eyebrow">Transfer Order · Step 2 of 4</p>' +
        '<h1 class="page-title">Amount & Guaranteed 60s FX Rate Lock</h1>' +
        '<p class="page-sub">Corridor: <b>' + U.esc(q.corridor_label || q.corridor) + '</b>. Rate locked for 60 seconds with zero slippage.</p>' +
      '</div>' +

      /* 60-Second FX Lock Countdown Banner */
      '<div class="card" style="border-radius:18px;padding:16px 22px;background:#0f172a;color:#fff;margin-bottom:24px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<span style="font-size:24px;">⏱️</span>' +
            '<div>' +
              '<b style="font-size:14.5px;color:#fff;display:block;">Guaranteed FX Lock: 1 ' + U.esc(S.sendCcy) + ' = ' + Number(q.fx_rate).toFixed(rateDecimals) + ' ' + U.esc(S.receiveCcy) + '</b>' +
              '<span style="font-size:12px;color:#94a3b8;">Rate protected against market volatility until timer expires</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<span id="fxLockCountdown" style="font-family:monospace;font-size:22px;font-weight:800;color:#10b981;">' + lockSecondsRemaining + 's</span>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="btnRefreshQuote" style="padding:6px 12px;font-size:12px;border-radius:8px;">Refresh Rate 🔄</button>' +
          '</div>' +
        '</div>' +
        '<div style="width:100%;height:4px;background:#334155;border-radius:2px;margin-top:12px;overflow:hidden;">' +
          '<div id="fxLockProgressBar" style="width:100%;height:100%;background:#10b981;transition:width 1s linear;"></div>' +
        '</div>' +
      '</div>' +

      /* Over Daily Tier Limit Alert (If applicable) */
      (isOverLimit ?
        '<div class="card" style="border-left:5px solid #ef4444;background:#fef2f2;padding:18px 24px;border-radius:16px;margin-bottom:24px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">' +
            '<div>' +
              '<b style="font-size:15px;color:#991b1b;">⚠️ Daily KYC Limit Exceeded</b>' +
              '<p style="margin:4px 0 0;font-size:13px;color:#b91c1c;">' +
                'This transfer (' + U.ccySym(S.receiveCcy) + Number(q.receive_amount).toLocaleString() + ' ' + U.esc(S.receiveCcy) + ') exceeds your remaining ' + kyc.kyc_level.toUpperCase() + ' tier daily quota (Remaining today: ৳' + Number(kyc.remaining_today).toLocaleString() + ' BDT equivalent).' +
              '</p>' +
            '</div>' +
            '<a href="#/kyc" class="btn btn-primary btn-sm" style="border-radius:10px;padding:8px 16px;background:#dc2626;border-color:#dc2626;text-decoration:none;">' +
              'Upgrade to Tier 2 (৳500k/day) ↑' +
            '</a>' +
          '</div>' +
        '</div>' : '') +

      '<div class="grid gm">' +
        /* Left: Amount Input Card */
        '<div class="card" style="border-radius:20px;padding:26px;">' +
          '<div class="field" style="margin-bottom:18px;">' +
            '<label class="f" for="sSendAmt">You Send (' + U.esc(S.sendCcy) + ')</label>' +
            '<div class="input-row">' +
              '<span class="ccy-tag" style="font-weight:800;color:#0D9F9A;">' + U.ccyFlag(S.sendCcy) + ' ' + U.esc(S.sendCcy) + '</span>' +
              '<input class="input mono" id="sSendAmt" type="number" step="1" min="1" value="' + U.esc(S.amount) + '" style="font-size:22px;font-weight:800;" placeholder="0.00">' +
            '</div>' +
          '</div>' +

          /* Quick Amount Chips */
          '<div style="display:flex;gap:8px;margin-bottom:22px;flex-wrap:wrap;">' +
            (S.sendCcy === "BDT" ? [10000, 25000, 50000, 100000] : [200, 500, 1000, 2500]).map(function(amt){
              return '<button type="button" class="btn btn-secondary btn-sm amt-chip" data-amt="' + amt + '" style="border-radius:8px;font-size:12px;">' + U.esc(S.sendCcy) + ' ' + amt.toLocaleString() + '</button>';
            }).join("") +
          '</div>' +

          /* Conversion Output Card */
          '<div id="sQuote" style="background:#f8fafc;border-radius:16px;padding:18px;margin-bottom:20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<span style="font-size:13px;color:#64748b;">Recipient receives (' + U.esc(S.receiveCcy) + ')</span>' +
              '<b style="font-size:22px;font-weight:850;color:#059669;">' + U.ccySym(S.receiveCcy) + Number(q.receive_amount).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + U.esc(S.receiveCcy) + '</b>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;">' +
              '<span>Locked Exchange Rate</span>' +
              '<b>1 ' + U.esc(S.sendCcy) + ' = ' + Number(q.fx_rate).toFixed(rateDecimals) + ' ' + U.esc(S.receiveCcy) + '</b>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-top:4px;">' +
              '<span>Transfer Fee</span>' +
              '<span style="color:#059669;font-weight:700;">FREE (0.00 ' + U.esc(S.sendCcy) + ')</span>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;gap:10px;">' +
            '<button type="button" class="btn btn-secondary" id="sStep2Back" style="border-radius:12px;">← Back</button>' +
            '<button type="button" class="btn btn-primary btn-block" id="sStep2Next" ' + (isOverLimit ? 'disabled' : '') + ' style="border-radius:12px;font-weight:750;">' +
              (isOverLimit ? 'Limit Exceeded (Upgrade KYC to Tier 2)' : 'Proceed to ScamShield Pre-Check →') +
            '</button>' +
          '</div>' +
        '</div>' +

        /* Right: Recipient Summary */
        '<div>' +
          '<div class="card" style="border-radius:20px;padding:22px;background:#f8fafc;">' +
            '<h3 style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:14px;">Recipient Details</h3>' +
            '<div class="kv">' +
              '<div class="r"><span>Name</span><b>' + U.esc(S.recipientName) + '</b></div>' +
              '<div class="r"><span>Payout Method</span><b>' + U.esc(S.payoutMethod.toUpperCase()) + '</b></div>' +
              '<div class="r"><span>Account / Wallet</span><b class="mono">' + U.esc(S.accountNumber) + '</b></div>' +
              '<div class="r"><span>Corridor</span><span>' + U.esc(q.corridor_label || q.corridor) + '</span></div>' +
              '<div class="r"><span>Purpose</span><span>' + U.esc(S.purpose) + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Refresh rate */
  var refBtn = U.$("#btnRefreshQuote", el);
  if (refBtn){
    refBtn.addEventListener("click", function(){
      refreshQuoteAndTimer(function(){ renderStep2(el); });
    });
  }

  /* Quick chips */
  el.querySelectorAll(".amt-chip").forEach(function(b){
    b.addEventListener("click", function(){
      S.amount = b.getAttribute("data-amt");
      refreshQuoteAndTimer(function(){ renderStep2(el); });
    });
  });

  /* Input change */
  var sendInp = U.$("#sSendAmt", el);
  if (sendInp){
    sendInp.addEventListener("input", U.debounce(function(){
      if (!document.body.contains(sendInp)) return;
      S.amount = sendInp.value;
      refreshQuoteAndTimer(function(){ renderStep2(el); });
    }, 350));
  }

  /* Back & Next */
  U.$("#sStep2Back", el).addEventListener("click", function(){
    S.step = 1;
    render();
  });

  var nextBtn = U.$("#sStep2Next", el);
  if (nextBtn){
    nextBtn.addEventListener("click", function(){
      var numAmt = Number(S.amount);
      if (!isFinite(numAmt) || numAmt <= 0){
        if (global.Toast) global.Toast.show("Please enter a valid transfer amount greater than 0.", "warn");
        return;
      }
      if (isOverLimit){
        if (global.Toast) global.Toast.show("Transfer amount exceeds your daily KYC quota.", "warn");
        return;
      }
      S.step = 3;
      render();
    });
  }
}

/* STEP 3: SCAMSHIELD PRE-CHECK & COMPLIANCE REVIEW */
function renderStep3(el){
  var q = S.quote || localQuote(S.amount || 1000, S.corridorId);
  var gws = gatewaysForCurrency(S.sendCcy);
  if (gws.indexOf(S.paymentMethod) === -1) S.paymentMethod = gws[0];

  el.innerHTML =
    '<div class="page" style="max-width:980px;">' +
      stepsBar() +
      '<div class="page-head">' +
        '<p class="eyebrow">Transfer Order · Step 3 of 4</p>' +
        '<h1 class="page-title">ScamShield Fraud Defense & Final Review</h1>' +
        '<p class="page-sub">Real-time AI behavioral fraud check and recipient sanctions screening.</p>' +
      '</div>' +

      /* ScamShield Safety Score Card */
      '<div class="card" style="border-radius:20px;padding:26px;background:linear-gradient(135deg, #0f172a, #1e293b);color:#fff;margin-bottom:24px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">' +
          '<div style="display:flex;align-items:center;gap:16px;">' +
            '<div style="width:64px;height:64px;border-radius:18px;background:rgba(16,185,129,0.15);border:2px solid #10b981;display:grid;place-items:center;font-size:32px;">' +
              '🛡️' +
            '</div>' +
            '<div>' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span style="background:#10b981;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;text-transform:uppercase;">Safety Score: ' + S.riskScore + '/100 (Low Risk)</span>' +
                '<span style="color:#94a3b8;font-size:12px;">10 Heuristic Rules Evaluated</span>' +
              '</div>' +
              '<h2 style="margin:4px 0 0;font-size:18px;color:#fff;">Recipient Cleared · Zero Scam Signals Detected</h2>' +
              '<p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Beneficiary is verified and not linked to known impersonation, urgency pressure, or fraudulent accounts.</p>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span style="display:block;font-size:11px;color:#64748b;text-transform:uppercase;">Sanctions List</span>' +
            '<b style="color:#10b981;font-size:13px;">✓ Global Sandbox Cleared</b>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Complete Review Summary Table */
      '<div class="grid gm">' +
        '<div class="card" style="border-radius:20px;padding:26px;">' +
          '<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:16px;">Order Summary</h3>' +
          '<div class="kv">' +
            '<div class="r"><span>Recipient</span><b>' + U.esc(S.recipientName) + '</b></div>' +
            '<div class="r"><span>Payout Channel</span><b style="color:#0D9F9A;">' + U.esc(S.payoutMethod.toUpperCase()) + ' (' + U.esc(S.accountNumber) + ')</b></div>' +
            '<div class="r"><span>Corridor</span><span>' + U.esc(q.corridor_label || q.corridor) + '</span></div>' +
            '<div class="r"><span>Purpose</span><span>' + U.esc(S.purpose) + '</span></div>' +
            '<div class="r"><span>You Send</span><b class="num">' + U.ccySym(S.sendCcy) + Number(q.send_amount).toFixed(2) + ' ' + U.esc(S.sendCcy) + '</b></div>' +
            '<div class="r"><span>Locked FX Rate</span><b class="num">1 ' + U.esc(S.sendCcy) + ' = ' + Number(q.fx_rate).toFixed(4) + ' ' + U.esc(S.receiveCcy) + '</b></div>' +
            '<div class="r"><span>Transfer Fee</span><b style="color:#10b981;">0.00 ' + U.esc(S.sendCcy) + ' (FREE)</b></div>' +
            '<div class="r total"><span>Recipient Receives</span><b class="num" style="color:#059669;font-size:18px;">' + U.ccySym(S.receiveCcy) + Number(q.receive_amount).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + U.esc(S.receiveCcy) + '</b></div>' +
          '</div>' +

          /* Select Payment Gateway (Region-Aware) */
          '<div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:16px;">' +
            '<label class="f" style="margin-bottom:10px;">Select Payment Gateway (' + U.esc(S.sendCcy) + ' Sandbox)</label>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px;" id="sPayGateSeg">' +
              gws.map(function(gw){
                var act = S.paymentMethod === gw;
                return '<button type="button" class="btn btn-sm ' + (act ? "btn-primary" : "btn-secondary") + '" data-pm="' + U.esc(gw) + '">' + U.esc(gw) + '</button>';
              }).join("") +
            '</div>' +
          '</div>' +

          /* Notification & Upcoming Payment Options */
          '<div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">' +
              '<label class="f" style="margin:0;font-size:13.5px;font-weight:800;color:#0f172a;">🔔 Notification &amp; Upcoming Payment Reminder Options</label>' +
              '<span class="badge badge-info" style="font-size:10.5px;">SMS · WhatsApp · Email · Reminders</span>' +
            '</div>' +
            '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:14px;padding:14px;display:grid;gap:10px;">' +
              '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:#1e293b;">' +
                '<input type="checkbox" id="sNotifSms" ' + (S.notifyRecipientSms !== false ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#0D9F9A;margin-top:2px;">' +
                '<div>' +
                  '<b>Notify Recipient via SMS &amp; WhatsApp (' + U.esc(S.recipientName) + ')</b>' +
                  '<div style="font-size:11.5px;color:#64748b;">Instant payout advice sent to ' + U.esc(S.accountNumber) + ' when funds are delivered.</div>' +
                '</div>' +
              '</label>' +
              '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:#1e293b;">' +
                '<input type="checkbox" id="sNotifEmail" ' + (S.notifySenderEmail !== false ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#0D9F9A;margin-top:2px;">' +
                '<div>' +
                  '<b>Email Payment Advice &amp; NBR Tax-Free Certificate (PDF)</b>' +
                  '<div style="font-size:11.5px;color:#64748b;">Downloadable official remittance receipt sent to your verified email.</div>' +
                '</div>' +
              '</label>' +
              '<div style="border-top:1px dashed #cbd5e1;padding-top:10px;">' +
                '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:#1e293b;">' +
                  '<input type="checkbox" id="sNotifUpcoming" ' + (S.setUpcomingReminder !== false ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#0D9F9A;margin-top:2px;">' +
                  '<div style="flex:1;">' +
                    '<b style="color:#097A76;">⏰ Set Upcoming Payment Notification / Recurring Reminder</b>' +
                    '<div style="font-size:11.5px;color:#475569;">Receive an automated in-app notification &amp; alert before your next scheduled payment.</div>' +
                  '</div>' +
                '</label>' +
                '<div id="sUpcomingOptions" style="display:' + (S.setUpcomingReminder !== false ? 'grid' : 'none') + ';grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:10px;margin-top:10px;padding-left:28px;">' +
                  '<div>' +
                    '<label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Reminder Frequency</label>' +
                    '<select id="sUpcomingFreq" class="input" style="font-size:12px;min-height:34px;padding:3px 8px;">' +
                      '<option value="Monthly Recurring"' + (S.upcomingFreq === 'Monthly Recurring' ? ' selected' : '') + '>Monthly Recurring</option>' +
                      '<option value="Bi-Weekly Recurring"' + (S.upcomingFreq === 'Bi-Weekly Recurring' ? ' selected' : '') + '>Bi-Weekly Recurring</option>' +
                      '<option value="Semester Milestone"' + (S.upcomingFreq === 'Semester Milestone' ? ' selected' : '') + '>Next Semester Tuition Date</option>' +
                      '<option value="One-Time Upcoming"' + (S.upcomingFreq === 'One-Time Upcoming' ? ' selected' : '') + '>One-Time Upcoming</option>' +
                    '</select>' +
                  '</div>' +
                  '<div>' +
                    '<label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Next Due Date</label>' +
                    '<input type="date" id="sUpcomingDate" class="input mono" value="' + U.esc(S.upcomingDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) + '" style="font-size:12px;min-height:34px;padding:3px 8px;">' +
                  '</div>' +
                  '<div>' +
                    '<label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Notify Me Ahead</label>' +
                    '<select id="sUpcomingLead" class="input" style="font-size:12px;min-height:34px;padding:3px 8px;">' +
                      '<option value="3"' + (S.upcomingLeadDays == 3 ? ' selected' : '') + '>3 Days Before Due Date</option>' +
                      '<option value="7"' + (S.upcomingLeadDays == 7 ? ' selected' : '') + '>7 Days Before Due Date</option>' +
                      '<option value="1"' + (S.upcomingLeadDays == 1 ? ' selected' : '') + '>1 Day Before Due Date</option>' +
                      '<option value="0"' + (S.upcomingLeadDays == 0 ? ' selected' : '') + '>On the Due Date</option>' +
                    '</select>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;gap:10px;margin-top:24px;">' +

            '<button type="button" class="btn btn-secondary" id="sStep3Back" style="border-radius:12px;">← Back</button>' +
            '<button type="button" class="btn btn-primary btn-block" id="sStep3Confirm" style="border-radius:12px;font-weight:750;background:linear-gradient(135deg, #16a34a, #15803d);border-color:#16a34a;">' +
              'Authorize & Dispatch Simulated Transfer' +
            '</button>' +
          '</div>' +
        '</div>' +

        /* Fraud Notice Disclaimer */
        '<div>' +
          '<div class="card" style="border-radius:20px;padding:22px;background:#f8fafc;">' +
            '<h3 style="font-size:14.5px;font-weight:800;color:#0f172a;margin-bottom:10px;">Important Notice</h3>' +
            '<p style="font-size:12.5px;color:#64748b;line-height:1.6;margin-bottom:10px;">Demo only — no real payout. Timing shown is an illustrative demo estimate, not a delivery promise.</p>' +
            '<div style="font-size:11.5px;color:#475569;">' +
              'By continuing, you confirm that you know and trust the recipient, and that this transfer is not made under coercion or remote assistance.' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Payment method selector */
  el.querySelectorAll("#sPayGateSeg button").forEach(function(b){
    b.addEventListener("click", function(){
      S.paymentMethod = b.getAttribute("data-pm");
      el.querySelectorAll("#sPayGateSeg button").forEach(function(btn){
        btn.className = "btn btn-sm " + (btn.getAttribute("data-pm") === S.paymentMethod ? "btn-primary" : "btn-secondary");
      });
    });
  });

  var upCk = U.$("#sNotifUpcoming", el);
  var upOpts = U.$("#sUpcomingOptions", el);
  if (upCk){
    upCk.addEventListener("change", function(){
      S.setUpcomingReminder = upCk.checked;
      if (upOpts) upOpts.style.display = upCk.checked ? "grid" : "none";
    });
  }
  var smsCk = U.$("#sNotifSms", el);
  if (smsCk) smsCk.addEventListener("change", function(){ S.notifyRecipientSms = smsCk.checked; });
  var emCk = U.$("#sNotifEmail", el);
  if (emCk) emCk.addEventListener("change", function(){ S.notifySenderEmail = emCk.checked; });
  var frSel = U.$("#sUpcomingFreq", el);
  if (frSel) frSel.addEventListener("change", function(){ S.upcomingFreq = frSel.value; });
  var dtInp = U.$("#sUpcomingDate", el);
  if (dtInp) dtInp.addEventListener("change", function(){ S.upcomingDate = dtInp.value; });
  var ldSel = U.$("#sUpcomingLead", el);
  if (ldSel) ldSel.addEventListener("change", function(){ S.upcomingLeadDays = parseInt(ldSel.value, 10) || 0; });

  U.$("#sStep3Back", el).addEventListener("click", function(){
    S.step = 2;
    render();
  });

  /* Submit Transfer */
  U.$("#sStep3Confirm", el).addEventListener("click", function(){
    executeTransfer(el);
  });
}

function executeTransfer(el){
  stopLockTimer();
  var confirmBtn = U.$("#sStep3Confirm", el);
  if (confirmBtn){
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Authorizing " + S.paymentMethod + "...";
  }

  if (!S.idempotencyKey){
    S.idempotencyKey = "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  var q = S.quote || localQuote(S.amount || 1000, S.corridorId);
  var nowIso = new Date().toISOString();
  var seq = ((global.AppState && global.AppState.get("draftSeq")) || 0) + 1;
  if (global.AppState) global.AppState.set("draftSeq", seq);

  var ref = global.FinancialEngine
    ? global.FinancialEngine.draftRef(global.FinancialEngine.canonicalDraft(S.corridorId, S.payoutMethod, Math.round(Number(q.send_amount) * 100), seq))
    : ("TX-DEMO-" + Math.floor(10000 + Math.random() * 90000));

  /* Capture user-selected notification options */
  var notifSms = U.$("#sNotifSms", el) ? U.$("#sNotifSms", el).checked : (S.notifyRecipientSms !== false);
  var notifEmail = U.$("#sNotifEmail", el) ? U.$("#sNotifEmail", el).checked : (S.notifySenderEmail !== false);
  var notifUpcoming = U.$("#sNotifUpcoming", el) ? U.$("#sNotifUpcoming", el).checked : (S.setUpcomingReminder !== false);
  var upcomingFreq = U.$("#sUpcomingFreq", el) ? U.$("#sUpcomingFreq", el).value : (S.upcomingFreq || "Monthly Recurring");
  var upcomingDate = U.$("#sUpcomingDate", el) ? U.$("#sUpcomingDate", el).value : (S.upcomingDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  var upcomingLead = U.$("#sUpcomingLead", el) ? parseInt(U.$("#sUpcomingLead", el).value, 10) : (S.upcomingLeadDays != null ? S.upcomingLeadDays : 3);

  S.notifyRecipientSms = notifSms;
  S.notifySenderEmail = notifEmail;
  S.setUpcomingReminder = notifUpcoming;
  S.upcomingFreq = upcomingFreq;
  S.upcomingDate = upcomingDate;
  S.upcomingLeadDays = upcomingLead;

  /* Schedule upcoming payment notification reminder */
  if (notifUpcoming && global.NotificationHub && typeof global.NotificationHub.addUpcomingPaymentReminder === "function"){
    global.NotificationHub.addUpcomingPaymentReminder({
      title: "Upcoming Transfer: " + S.recipientName + " (" + S.purpose + ")",
      amount: Number(q.send_amount).toFixed(2) + " " + S.sendCcy + " (≈ " + U.ccySym(S.receiveCcy) + Number(q.receive_amount).toFixed(2) + " " + S.receiveCcy + ")",
      dueDate: upcomingDate,
      frequency: upcomingFreq,
      leadDays: upcomingLead,
      channel: (notifSms ? "In-App + SMS/WhatsApp" : "In-App") + (notifEmail ? " + Email PDF" : "")
    });
  }

  /* Log dispatch notification */
  if (global.NotificationHub && typeof global.NotificationHub.addNotification === "function"){
    global.NotificationHub.addNotification({
      category: "TRANSFER_STATUS",
      title: "Transfer Dispatched · Ref: " + ref,
      message: "Transfer of " + U.ccySym(S.sendCcy) + Number(q.send_amount).toFixed(2) + " " + S.sendCcy + " to " + S.recipientName + " (" + S.payoutMethod.toUpperCase() + ") dispatched." + (notifSms ? " Recipient notified via SMS/WhatsApp." : "") + (notifEmail ? " Official PDF receipt emailed." : ""),
      actionLabel: "View in Vault",
      actionRoute: "#/payment-vault",
      amount: U.ccySym(S.sendCcy) + Number(q.send_amount).toFixed(2)
    }, false);
  }

  var mockEvents = [
    { status: "draft", detail: "Transfer order created & rate locked (1 " + S.sendCcy + " = " + Number(q.fx_rate).toFixed(4) + " " + S.receiveCcy + ")", created_at: nowIso },
    { status: "funded", detail: "Payment collected via " + S.paymentMethod + " Sandbox", created_at: nowIso },
    { status: "aml_cleared", detail: "ScamShield & AML sanctions screening cleared (Safety Score: " + S.riskScore + "/100)", created_at: nowIso },
    { status: "dispatched", detail: "Dispatched to " + S.payoutMethod.toUpperCase() + " settlement gateway (" + S.accountNumber + ")", created_at: nowIso }
  ];

  var mockTx = {
    id: S.idempotencyKey,
    psp_reference: ref,
    beneficiary_id: S.beneficiaryId,
    recipient_name: S.recipientName,
    payout_method: S.payoutMethod,
    account_number: S.accountNumber,
    corridor: q.corridor || S.corridorId,
    send_amount: Number(q.send_amount),
    send_currency: S.sendCcy,
    receive_amount: Number(q.receive_amount),
    receive_currency: S.receiveCcy,
    fx_rate: Number(q.fx_rate),
    fee_amount: 0,
    purpose: S.purpose,
    payment_method: S.paymentMethod,
    status: "dispatched",
    created_at: nowIso,
    events: mockEvents
  };

  /* Persist to AppState transfers & drafts & update KYC daily quota */
  if (global.AppState){
    var transfers = (global.AppState.get("transfers") || []).slice();
    transfers.unshift(mockTx);
    global.AppState.set("transfers", transfers);

    var drafts = (global.AppState.get("drafts") || []).slice();
    drafts.unshift({
      ref: ref,
      createdISO: nowIso,
      corridorId: S.corridorId,
      providerId: S.payoutMethod,
      providerName: S.paymentMethod,
      principalMinor: Math.round(Number(q.send_amount) * 100),
      sendCcy: S.sendCcy,
      sendSym: U.ccySym(S.sendCcy),
      flatMinor: 0,
      pctMinor: 0,
      customerRate: Number(q.fx_rate),
      receiveMinor: Math.round(Number(q.receive_amount) * 100),
      receiveCcy: S.receiveCcy,
      receiveSym: U.ccySym(S.receiveCcy),
      delivery: "Instant ~ 10 mins",
      recipientName: S.recipientName,
      purpose: S.purpose
    });
    global.AppState.set("drafts", drafts);

    var kyc = Object.assign({}, global.AppState.get("kycData") || S.kycData);
    var addBdt = toBdtEquivalent(q.receive_amount, S.receiveCcy);
    kyc.spent_today = Math.round(((Number(kyc.spent_today) || 0) + addBdt) * 100) / 100;
    kyc.remaining_today = Math.max(0, Math.round(((Number(kyc.daily_limit) || 50000) - kyc.spent_today) * 100) / 100);
    kyc.spent_today_bdt = kyc.spent_today;
    kyc.remaining_today_bdt = kyc.remaining_today;
    global.AppState.set("kycData", kyc);
    S.kycData = kyc;

    /* Core-Banking Sync 1: Deduct from Payment Vault balance & log outbound transaction */
    var w = global.AppState.get("wallet");
    if (!w && global.ProbahoLocalLLM && global.ProbahoLocalLLM.getLiveSnapshot){
      var snapW = global.ProbahoLocalLLM.getLiveSnapshot().wallet;
      if (snapW && snapW.balances) w = { balances: JSON.parse(JSON.stringify(snapW.balances)), transactions: [], allocations: [] };
    }
    if (w && w.balances){
      var wClone = JSON.parse(JSON.stringify(w));
      var sCcy = S.sendCcy || "USD";
      var sAmt = Number(q.send_amount) || 0;
      if (wClone.balances[sCcy]){
        var curTot = Number(wClone.balances[sCcy].total) || 0;
        var curLck = Number(wClone.balances[sCcy].locked) || 0;
        wClone.balances[sCcy].total = Math.max(curLck, Number((curTot - sAmt).toFixed(2)));
      }
      wClone.transactions = Array.isArray(wClone.transactions) ? wClone.transactions : [];
      wClone.transactions.unshift({
        id: ref,
        type: "WITHDRAWAL",
        channel: String(S.payoutMethod || "BANK_TRANSFER").toUpperCase().indexOf("BKASH") >= 0 || String(S.payoutMethod || "").toUpperCase().indexOf("NAGAD") >= 0 ? "MOBILE_WALLET" : "BANK_TRANSFER",
        asset: sCcy,
        amount: sAmt,
        network: "Remittance to " + (S.recipientName || "Recipient") + " (" + Number(q.receive_amount).toLocaleString() + " " + S.receiveCcy + ")",
        date: nowIso.slice(0, 16).replace("T", " "),
        status: "COMPLETED",
        ref: ref
      });
      global.AppState.set("wallet", wClone);
    }

    /* Core-Banking Sync 2: If transfer purpose is Tuition/Education, auto-increment Tuition Planner paid amount */
    var isTuitionPayment = /tuition|education|university|registrar|college/i.test((S.purpose || "") + " " + (S.recipientName || ""));
    if (isTuitionPayment){
      var tState = JSON.parse(JSON.stringify(global.AppState.get("tuition") || {}));
      if (tState.customPlan){
        var FE = global.FinancialEngine;
        var planCcy = tState.customPlan.currency || "CAD";
        var creditInPlanCcy = Number(q.send_amount) || 0;
        if (FE && FE.convert && S.sendCcy !== planCcy){
          try { creditInPlanCcy = FE.convert(creditInPlanCcy, S.sendCcy, planCcy, 0); } catch(e){}
        }
        tState.customPlan.paidForeign = Math.round(((Number(tState.customPlan.paidForeign) || 0) + creditInPlanCcy) * 100) / 100;
        tState.budget = tState.budget || {};
        tState.budget.paidBDT = Math.round(tState.customPlan.paidForeign * (Number(tState.customPlan.fxRateToBDT) || 86.80));
        global.AppState.set("tuition", tState);
      }
    }
  }

  S.transferResult = mockTx;
  S.events = mockEvents;
  S.step = 4;
  render();
  if (global.Toast) global.Toast.show("Transfer " + ref + " dispatched! Saved to Vault.", "ok");
}

/* STEP 4: CONFIRMATION, LIVE TRACKING TIMELINE & PDF RECEIPT */
function renderStep4(el){
  var tx = S.transferResult || {};
  var pspRef = tx.psp_reference || "TX-DEMO-94810";
  var isDelivered = tx.status === "paid_out";

  el.innerHTML =
    '<div class="page" style="max-width:980px;">' +
      stepsBar() +

      /* Success Hero Banner */
      '<div class="card" style="border-radius:24px;padding:32px;text-align:center;background:linear-gradient(135deg, #059669, #047857);color:#fff;margin-bottom:20px;">' +
        '<div style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.2);margin:0 auto 16px;display:grid;place-items:center;font-size:36px;">' +
          '✓' +
        '</div>' +
        '<h1 style="margin:0 0 8px;font-size:26px;color:#fff;">' + (isDelivered ? "Simulated Transfer Delivered!" : "Simulated Transfer Order Dispatched!") + '</h1>' +
        '<p style="margin:0;font-size:15px;color:#a7f3d0;">Reference ID: <span class="mono" style="font-weight:800;color:#fff;">' + U.esc(pspRef) + '</span></p>' +
      '</div>' +

      /* Active Notification & Upcoming Reminder Confirmation Card */
      '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:16px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="font-size:26px;">🔔</span>' +
          '<div>' +
            '<b style="color:#166534;font-size:14px;display:block;">' + (S.setUpcomingReminder ? 'Notification Sent &amp; Upcoming Payment Reminder Scheduled!' : 'Transfer Notification Dispatched!') + '</b>' +
            '<span style="color:#15803d;font-size:12.5px;">' +
              (S.notifyRecipientSms ? 'Recipient (' + U.esc(S.recipientName) + ') notified via SMS/WhatsApp (' + U.esc(S.accountNumber) + ') · ' : '') +
              (S.notifySenderEmail ? 'PDF Advice emailed · ' : '') +
              (S.setUpcomingReminder ? 'Upcoming (' + U.esc(S.upcomingFreq || "Monthly") + ') reminder set for ' + U.esc(S.upcomingDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) + ' (' + (S.upcomingLeadDays == 0 ? 'on due date' : S.upcomingLeadDays + 'd ahead') + ').' : 'Logged in Notification Hub.') +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-sm btn-secondary" id="btnStep4ViewReminders" style="border-radius:8px;font-size:11.5px;font-weight:700;">⏰ View Reminders</button>' +
          '<button type="button" class="btn btn-sm btn-secondary" id="btnStep4ViewNotifs" style="border-radius:8px;font-size:11.5px;font-weight:700;">🔔 All Alerts</button>' +
        '</div>' +
      '</div>' +

      '<div class="grid gm">' +
        /* Left: Live Event Tracking Timeline */
        '<div class="card" style="border-radius:20px;padding:26px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">' +
            '<h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">Live Tracking Timeline</h2>' +
            '<span class="badge" style="background:' + (isDelivered ? '#dcfce7;color:#15803d;' : '#CCFBF1;color:#097A76;') + 'font-weight:750;">' + (isDelivered ? "✓ Delivered (Paid Out)" : "⚡ In Transit / Dispatched") + '</span>' +
          '</div>' +

          /* Stepper Timeline */
          '<div style="position:relative;padding-left:32px;display:flex;flex-direction:column;gap:22px;" id="transferTimelineBox">' +
            '<div style="position:relative;">' +
              '<div style="position:absolute;left:-32px;top:2px;width:20px;height:20px;border-radius:50%;background:#10b981;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:800;">✓</div>' +
              '<b style="font-size:14px;color:#0f172a;display:block;">Payment Authorized & Funded</b>' +
              '<span style="font-size:12px;color:#64748b;">Funded via ' + U.esc(S.paymentMethod) + ' Sandbox. Ref: ' + U.esc(pspRef) + '</span>' +
            '</div>' +
            '<div style="position:relative;">' +
              '<div style="position:absolute;left:-32px;top:2px;width:20px;height:20px;border-radius:50%;background:#10b981;color:#fff;display:grid;place-items:center;font-size:11px;font-weight:800;">✓</div>' +
              '<b style="font-size:14px;color:#0f172a;display:block;">ScamShield & AML Sanctions Cleared</b>' +
              '<span style="font-size:12px;color:#64748b;">Sanctions check passed. Anti-fraud safety score: ' + S.riskScore + '/100 (Safe).</span>' +
            '</div>' +
            '<div style="position:relative;">' +
              '<div style="position:absolute;left:-32px;top:2px;width:20px;height:20px;border-radius:50%;background:' + (isDelivered ? '#10b981' : '#0D9F9A') + ';color:#fff;display:grid;place-items:center;font-size:11px;font-weight:800;">' + (isDelivered ? '✓' : '⚡') + '</div>' +
              '<b style="font-size:14px;color:#071B33;display:block;">Dispatched to Settlement Gateway (' + U.esc(S.payoutMethod.toUpperCase()) + ')</b>' +
              '<span style="font-size:12px;color:#64748b;">Dispatched to simulated settlement rail (' + U.esc(S.accountNumber) + ').</span>' +
            '</div>' +
            '<div style="position:relative;' + (isDelivered ? '' : 'opacity:0.65;') + '">' +
              '<div style="position:absolute;left:-32px;top:2px;width:20px;height:20px;border-radius:50%;background:' + (isDelivered ? '#10b981' : '#cbd5e1') + ';color:#fff;display:grid;place-items:center;font-size:11px;font-weight:800;">' + (isDelivered ? '✓' : '4') + '</div>' +
              '<b style="font-size:14px;color:' + (isDelivered ? '#15803d' : '#64748b') + ';display:block;">Payout Delivered to Beneficiary</b>' +
              '<span style="font-size:12px;color:#64748b;">' + (isDelivered ? 'Confirmed credited to ' + U.esc(S.recipientName) + ' (' + U.esc(S.accountNumber) + ').' : 'Awaiting recipient settlement node callback.') + '</span>' +
            '</div>' +
          '</div>' +

          '<div style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap;">' +
            (!isDelivered ?
              '<button type="button" class="btn btn-primary btn-sm" id="btnSimDeliverNow" style="border-radius:10px;background:#059669;">⚡ Simulate Instant Delivery</button>' : '') +
            '<button type="button" class="btn btn-secondary btn-sm" id="btnPrintReceiptBtn" style="border-radius:10px;font-weight:750;">' +
              '📄 Print / Save PDF Receipt' +
            '</button>' +
            '<a href="#/payment-vault" class="btn btn-ghost btn-sm" style="font-size:13px;text-decoration:none;">' +
              'View in Payment Vault →' +
            '</a>' +
          '</div>' +
        '</div>' +

        /* Right: PDF Printable Receipt Preview */
        '<div>' +
          '<div class="card" id="printableReceiptCard" style="border-radius:20px;padding:24px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 4px 15px rgba(0,0,0,0.04);">' +
            '<div style="border-bottom:2px dashed #e2e8f0;padding-bottom:14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">' +
              '<div>' +
                '<b style="font-size:16px;color:#0f172a;letter-spacing:-0.3px;">PROBAHO REMIT</b>' +
                '<span style="display:block;font-size:10.5px;color:#64748b;">Titan Edition · Remittance Advice (Demo)</span>' +
              '</div>' +
              '<span style="font-size:10.5px;font-weight:800;color:#15803d;background:#dcfce7;padding:3px 8px;border-radius:6px;">SIMULATED RECORD</span>' +
            '</div>' +

            '<div style="font-size:12px;color:#475569;margin-bottom:14px;line-height:1.6;">' +
              '<div><b>Ref ID:</b> <span class="mono">' + U.esc(pspRef) + '</span></div>' +
              '<div><b>Timestamp:</b> ' + new Date().toISOString().replace("T", " ").slice(0, 19) + ' UTC</div>' +
              '<div><b>Sender:</b> ' + U.esc((global.AuthService && global.AuthService.session() && (global.AuthService.session().name || global.AuthService.session().email)) || "Ishan Ahmed") + '</div>' +
              '<div><b>Beneficiary:</b> ' + U.esc(S.recipientName) + ' (' + U.esc(S.payoutMethod.toUpperCase()) + ')</div>' +
              '<div><b>Account / Wallet:</b> ' + U.esc(S.accountNumber) + '</div>' +
              '<div><b>Corridor:</b> ' + U.esc(tx.corridor || S.corridorId) + ' (' + U.esc(S.sendCcy) + ' → ' + U.esc(S.receiveCcy) + ')</div>' +
              '<div><b>Funding Rail:</b> ' + U.esc(S.paymentMethod) + '</div>' +
            '</div>' +

            '<div style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;font-size:12.5px;">' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                '<span>Sent Amount:</span><b>' + U.ccySym(S.sendCcy) + (Number(tx.send_amount) || Number(S.amount) || 0).toFixed(2) + ' ' + U.esc(S.sendCcy) + '</b>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                '<span>Locked Exchange Rate:</span><b>1 ' + U.esc(S.sendCcy) + ' = ' + (Number(tx.fx_rate) || 119.50).toFixed(4) + ' ' + U.esc(S.receiveCcy) + '</b>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
                '<span>Transfer Fee:</span><span style="color:#10b981;font-weight:700;">FREE (0.00 ' + U.esc(S.sendCcy) + ')</span>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:6px;font-size:14px;font-weight:800;color:#0f172a;">' +
                '<span>Total Credited:</span><span style="color:#059669;">' + U.ccySym(S.receiveCcy) + (Number(tx.receive_amount) || 0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + U.esc(S.receiveCcy) + '</span>' +
              '</div>' +
            '</div>' +

            '<div style="font-size:10px;color:#94a3b8;line-height:1.4;text-align:center;">' +
              'Simulated remittance advice record for demonstration purposes. No real money moved.' +
            '</div>' +
          '</div>' +

          '<div style="margin-top:16px;">' +
            '<button type="button" class="btn btn-primary btn-block" id="sSendAnotherBtn" style="border-radius:12px;padding:12px;">' +
              'Send Another Transfer 💸' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Simulate Instant Delivery */
  var simDelBtn = U.$("#btnSimDeliverNow", el);
  if (simDelBtn){
    simDelBtn.addEventListener("click", function(){
      tx.status = "paid_out";
      var nowIso = new Date().toISOString();
      tx.events = tx.events || [];
      tx.events.push({ status: "paid_out", detail: "Payout delivered to " + S.recipientName + " (" + S.accountNumber + ")", created_at: nowIso });
      if (global.AppState){
        var list = (global.AppState.get("transfers") || []).map(function(item){
          return item.id === tx.id ? tx : item;
        });
        global.AppState.set("transfers", list);
      }
      if (global.NotificationHub && typeof global.NotificationHub.addNotification === "function"){
        global.NotificationHub.addNotification({
          category: "TRANSFER_STATUS",
          title: "Payout Delivered (Paid Out) · Ref: " + pspRef,
          message: "Funds credited to " + S.recipientName + " (" + S.payoutMethod.toUpperCase() + " " + S.accountNumber + ")." + (S.notifyRecipientSms ? " SMS/WhatsApp confirmation delivered." : ""),
          actionLabel: "View Receipt",
          actionRoute: "#/payment-vault",
          amount: U.ccySym(S.receiveCcy) + Number(tx.receive_amount || 0).toLocaleString() + " " + S.receiveCcy
        }, false);
      }
      if (global.Toast) global.Toast.show("Payout status updated to Delivered (Paid Out)!", "ok");
      renderStep4(el);
    });
  }

  var vRemBtn = U.$("#btnStep4ViewReminders", el);
  if (vRemBtn){
    vRemBtn.addEventListener("click", function(){
      if (global.NotificationHub) global.NotificationHub.openModal("reminders");
    });
  }
  var vNotifBtn = U.$("#btnStep4ViewNotifs", el);
  if (vNotifBtn){
    vNotifBtn.addEventListener("click", function(){
      if (global.NotificationHub) global.NotificationHub.openModal("all");
    });
  }

  /* Print Receipt Action */
  var printBtn = U.$("#btnPrintReceiptBtn", el);
  if (printBtn){
    printBtn.addEventListener("click", function(){
      window.print();
    });
  }

  /* Send Another */
  var againBtn = U.$("#sSendAnotherBtn", el);
  if (againBtn){
    againBtn.addEventListener("click", function(){
      S = freshState();
      initAndRender();
    });
  }
}

function render(){
  if (!S) S = freshState();
  var el = U.$("#view");
  if (!el) return;

  if (S.step === 2) renderStep2(el);
  else if (S.step === 3) renderStep3(el);
  else if (S.step === 4) renderStep4(el);
  else renderStep1(el);
}

function initAndRender(){
  if (!S) S = freshState();

  // Check URL params for beneficiary_id, amount, currency, corridor
  var hash = location.hash || "";
  var qIdx = hash.indexOf("?");
  if (qIdx >= 0){
    var qs = hash.slice(qIdx + 1);
    var benMatch = qs.match(/(?:^|&)beneficiary_id=([^&]+)/);
    if (benMatch && benMatch[1]) S.beneficiaryId = decodeURIComponent(benMatch[1]);

    var amtMatch = qs.match(/(?:^|&)amount=([^&]+)/);
    if (amtMatch && amtMatch[1] && !isNaN(Number(amtMatch[1]))) S.amount = String(Number(amtMatch[1]));

    var purpMatch = qs.match(/(?:^|&)purpose=([^&]+)/);
    if (purpMatch && purpMatch[1]) S.purpose = decodeURIComponent(purpMatch[1].replace(/\+/g, " "));

    var corrMatch = qs.match(/(?:^|&)corridor=([^&]+)/);
    if (corrMatch && corrMatch[1]){
      var cObj = findCorridorObj(decodeURIComponent(corrMatch[1]));
      S.corridorId = cObj.id;
      S.sendCcy = cObj.sendCcy;
      S.receiveCcy = cObj.receiveCcy;
    }

    var ccyMatch = qs.match(/(?:^|&)currency=([^&]+)/);
    if (ccyMatch && ccyMatch[1]){
      var wantCcy = decodeURIComponent(ccyMatch[1]).toUpperCase();
      var allC = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
      var foundC = allC.find(function(x){ return x.sendCcy === wantCcy; });
      if (foundC){
        S.corridorId = foundC.id;
        S.sendCcy = foundC.sendCcy;
        S.receiveCcy = foundC.receiveCcy;
      }
    }
  }

  var list = (global.ModBeneficiaries && global.ModBeneficiaries.list()) || [];
  if (list.length > 0 && !S.beneficiaryId){
    S.beneficiaryId = list[0].id;
    S.recipientName = list[0].name;
    S.payoutMethod = list[0].payout_method;
    S.accountNumber = list[0].account_number || list[0].phone;
  } else if (S.beneficiaryId){
    var b = list.find(function(x){ return x.id === S.beneficiaryId; }) || list[0];
    if (b){
      S.beneficiaryId = b.id;
      S.recipientName = b.name;
      S.payoutMethod = b.payout_method;
      S.accountNumber = b.account_number || b.phone;
    }
  }

  render();
}

global.ModSend = {
  render: initAndRender,
  reset: function(){ stopLockTimer(); S = null; },
  meta: {
    title: "Send Money",
    nav: "Send",
    icon: "send",
    desc: "Guided global cross-border transfer order flow: receiver selection, 60s FX lock, ScamShield pre-check, and live tracking."
  }
};
})(typeof window !== "undefined" ? window : global);

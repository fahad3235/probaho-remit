/* kyc.js — KYC Onboarding & Tier Status Tracker (100% Standalone Client-Side)
   Tier limit status (Tier 0: ৳0, Tier 1: ৳50k/day, Tier 2: ৳500k/day),
   interactive document upload + liveness selfie simulator + instant Tier 2 upgrade. */
(function(global){
"use strict";
var U = global.U;

var uploadState = {
  docType: "passport",
  frontData: null,
  backData: null,
  selfieData: null
};

function getKycData(){
  if (global.AppState){
    var k = global.AppState.get("kycData");
    if (k && typeof k === "object") return k;
  }
  return {
    kyc_level: "basic",
    kyc_status: "approved",
    daily_limit: 50000,
    spent_today: 13402.16,
    remaining_today: 36597.84,
    basic_limit: 50000,
    full_limit: 500000,
    submission: null
  };
}

function saveKycData(k){
  if (global.AppState) global.AppState.set("kycData", k);
}

function render(){
  var el = U.$("#view");
  if (!el) return;

  var kycData = getKycData();
  var isTierFull = kycData.kyc_level === "full";
  var isTierBasic = kycData.kyc_level === "basic";
  var isPending = kycData.kyc_status === "pending";
  var isResubmit = kycData.kyc_status === "resubmit";

  var sess = global.AuthService && global.AuthService.session();
  var uName = (sess && sess.name) || "Ishan Ahmed";
  var avatarFallback = U.avatarSvg ? U.avatarSvg(uName, "#10b981") : "";

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      /* Header Row */
      '<div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;margin-bottom:24px;">' +
        '<div>' +
          '<p class="eyebrow">Global Compliance & Security</p>' +
          '<h1 class="page-title">Identity Verification (KYC & CDD)</h1>' +
          '<p class="page-sub">Tiered verification modeled on international FATF AML/CFT and central bank guidelines. Upgrade to Tier 2 to unlock ৳500,000/day (~$5,000 USD/day).</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btnSimTier1" style="border-radius:8px;">Set Tier 1 (৳50k)</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnSimTier2" style="border-radius:8px;background:#10b981;">⚡ Instant Tier 2 (৳500k)</button>' +
        '</div>' +
      '</div>' +

      /* Live Status Alert Banner */
      '<div style="margin-bottom:24px;">' +
        (isPending ?
          '<div class="card" style="border-left:5px solid #f59e0b;background:#fffbeb;padding:18px 24px;border-radius:16px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">' +
              '<div style="display:flex;align-items:center;gap:14px;">' +
                '<span style="font-size:28px;">⏳</span>' +
                '<div>' +
                  '<b style="font-size:16px;color:#92400e;">Verification in Progress (Under Compliance Review)</b>' +
                  '<p style="margin:4px 0 0;font-size:13.5px;color:#b45309;">Your uploaded identity credentials and biometric liveness snapshot are queued for review. Click "Approve Now (Demo)" to simulate instant approval.</p>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="btn btn-primary btn-sm" id="btnApprovePendingNow" style="background:#d97706;">✓ Approve Now (Demo)</button>' +
            '</div>' +
          '</div>' :
          isResubmit ?
          '<div class="card" style="border-left:5px solid #ef4444;background:#fef2f2;padding:18px 24px;border-radius:16px;">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
              '<span style="font-size:28px;">⚠️</span>' +
              '<div>' +
                '<b style="font-size:16px;color:#991b1b;">Action Required: Document Resubmission Requested</b>' +
                '<p style="margin:4px 0 0;font-size:13.5px;color:#b91c1c;">Compliance Note: <i>"' + U.esc(kycData.submission ? kycData.submission.review_note : "Image edges blurred or ID expired") + '"</i>. Please re-upload clearer photos below.</p>' +
              '</div>' +
            '</div>' +
          '</div>' :
          '<div class="card" style="border-left:5px solid #10b981;background:#ecfdf5;padding:18px 24px;border-radius:16px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">' +
              '<div style="display:flex;align-items:center;gap:14px;">' +
                '<span style="font-size:28px;">✓</span>' +
                '<div>' +
                  '<b style="font-size:16px;color:#065f46;">Account Verified — ' + (isTierFull ? "Tier 2 (Full Global Verified)" : "Tier 1 (Basic KYC)") + '</b>' +
                  '<p style="margin:4px 0 0;font-size:13.5px;color:#047857;">Daily Limit: ৳' + Number(kycData.daily_limit).toLocaleString() + ' BDT. Remaining today: ৳' + Number(kycData.remaining_today).toLocaleString() + ' BDT.</p>' +
                '</div>' +
              '</div>' +
              (!isTierFull ?
                '<button type="button" class="btn btn-primary btn-sm" id="jumpUpgradeBtn" style="border-radius:10px;padding:8px 16px;">' +
                  'Upgrade to Tier 2 (৳500,000/day) ↑' +
                '</button>' : '') +
            '</div>' +
          '</div>'
        ) +
      '</div>' +

      /* 3-Step KYC Verification Progress Bar + Personal Info & Why KYC (Screen 08) */
      '<div class="grid gm" style="margin-bottom:24px;align-items:start;">' +
        '<div class="card" style="border-radius:18px;padding:22px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #E3EAF2;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="width:26px;height:26px;border-radius:50%;background:#12B8B0;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800;">1</span><b style="font-size:13.5px;color:#0D9F9A;">Personal Info ✓</b></div>' +
            '<div style="flex:1;height:2px;background:#12B8B0;min-width:24px;"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="width:26px;height:26px;border-radius:50%;background:#12B8B0;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800;">2</span><b style="font-size:13.5px;color:#0D9F9A;">Documents ✓</b></div>' +
            '<div style="flex:1;height:2px;background:' + (isTierFull ? '#12B8B0' : '#E3EAF2') + ';min-width:24px;"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;"><span style="width:26px;height:26px;border-radius:50%;background:' + (isTierFull ? '#15803D' : '#071B33') + ';color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800;">3</span><b style="font-size:13.5px;color:#172B4D;">Verification (' + (isTierFull ? 'Tier 2 Full' : 'Tier 1 Active') + ')</b></div>' +
          '</div>' +
          '<h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#172B4D;">Personal Information (Verified Profile)</h3>' +
          '<div class="grid g2" style="gap:12px;">' +
            '<div class="field" style="margin:0;"><label>Full Name</label><input class="input" value="' + U.esc(uName) + '" readonly style="background:#F5F8FC;font-weight:700;"></div>' +
            '<div class="field" style="margin:0;"><label>Date of Birth</label><input class="input mono" value="14 / 05 / 2003" readonly style="background:#F5F8FC;"></div>' +
            '<div class="field" style="margin:0;"><label>Nationality</label><input class="input" value="Bangladeshi 🇧🇩" readonly style="background:#F5F8FC;"></div>' +
            '<div class="field" style="margin:0;"><label>Passport / Student ID</label><input class="input mono" value="A12345678 · CIS-Batch-25" readonly style="background:#F5F8FC;font-weight:700;"></div>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="border-radius:18px;padding:22px;background:#F8FAFC;border:1px solid #E3EAF2;">' +
          '<h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#172B4D;">Why KYC Verification?</h3>' +
          '<ul style="display:grid;gap:10px;font-size:13.5px;color:#334155;margin:0;padding:0;list-style:none;">' +
            '<li style="display:flex;align-items:center;gap:10px;"><span style="color:#12B8B0;font-weight:900;">✓</span> <b>Higher transfer limits</b> (Up to ৳500,000/day for tuition)</li>' +
            '<li style="display:flex;align-items:center;gap:10px;"><span style="color:#12B8B0;font-weight:900;">✓</span> <b>Faster processing</b> (Instant automated AML clearing)</li>' +
            '<li style="display:flex;align-items:center;gap:10px;"><span style="color:#12B8B0;font-weight:900;">✓</span> <b>More secure transactions</b> (ScamShield + biometric guard)</li>' +
            '<li style="display:flex;align-items:center;gap:10px;"><span style="color:#12B8B0;font-weight:900;">✓</span> <b>2.5% BD Govt Incentive</b> eligibility on family support</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      /* 3 Tiers Comparison Grid */
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;margin-bottom:32px;">' +

        /* Tier 0 */
        '<div class="card" style="border-radius:20px;padding:24px;opacity:0.8;border:1px solid #e2e8f0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<span style="font-size:12px;font-weight:750;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Tier 0</span>' +
            '<span class="badge" style="background:#f1f5f9;color:#64748b;">Unverified</span>' +
          '</div>' +
          '<h3 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#0f172a;">৳0 <small style="font-size:12px;color:#64748b;font-weight:600;">/ day</small></h3>' +
          '<p style="font-size:13px;color:#64748b;margin-bottom:16px;">Browse global rates, try optimizer calculations, and explore demo features.</p>' +
          '<ul style="font-size:12.5px;color:#475569;margin:0;padding-left:18px;line-height:1.7;">' +
            '<li>No money sending allowed</li>' +
            '<li>Basic email/phone signup</li>' +
            '<li>View-only sandbox mode</li>' +
          '</ul>' +
        '</div>' +

        /* Tier 1 */
        '<div class="card" style="border-radius:20px;padding:24px;position:relative;' + (isTierBasic ? 'border:2px solid #0D9F9A;box-shadow:0 4px 20px rgba(37,99,235,0.12);' : '') + '">' +
          (isTierBasic ? '<span style="position:absolute;top:-11px;right:20px;background:#0D9F9A;color:#fff;font-size:10.5px;font-weight:800;padding:3px 10px;border-radius:12px;text-transform:uppercase;">Current Tier</span>' : '') +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<span style="font-size:12px;font-weight:750;color:#0D9F9A;text-transform:uppercase;letter-spacing:0.5px;">Tier 1 · Basic</span>' +
            '<span class="badge" style="background:#CCFBF1;color:#071B33;">Standard (~$500/d)</span>' +
          '</div>' +
          '<h3 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#0f172a;">৳50,000 <small style="font-size:12px;color:#64748b;font-weight:600;">/ day</small></h3>' +
          '<p style="font-size:13px;color:#64748b;margin-bottom:16px;">Ideal for living allowances, family support, and everyday transfers.</p>' +
          '<ul style="font-size:12.5px;color:#475569;margin:0;padding-left:18px;line-height:1.7;">' +
            '<li>Verified Mobile Phone OTP</li>' +
            '<li>National ID (NID) or Driving License</li>' +
            '<li>Instant Mobile Wallet & Bank payouts</li>' +
          '</ul>' +
        '</div>' +

        /* Tier 2 */
        '<div class="card" style="border-radius:20px;padding:24px;position:relative;' + (isTierFull ? 'border:2px solid #10b981;box-shadow:0 4px 20px rgba(16,185,129,0.12);' : '') + '">' +
          (isTierFull ? '<span style="position:absolute;top:-11px;right:20px;background:#10b981;color:#fff;font-size:10.5px;font-weight:800;padding:3px 10px;border-radius:12px;text-transform:uppercase;">Active High-Limit</span>' : '') +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<span style="font-size:12px;font-weight:750;color:#10b981;text-transform:uppercase;letter-spacing:0.5px;">Tier 2 · Full Verified</span>' +
            '<span class="badge" style="background:#d1fae5;color:#065f46;">Premium (~$5,000/d)</span>' +
          '</div>' +
          '<h3 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#0f172a;">৳500,000 <small style="font-size:12px;color:#64748b;font-weight:600;">/ day</small></h3>' +
          '<p style="font-size:13px;color:#64748b;margin-bottom:16px;">Required for university tuition, medical fees, and high-volume global wires.</p>' +
          '<ul style="font-size:12.5px;color:#475569;margin:0;padding-left:18px;line-height:1.7;">' +
            '<li>Valid International Passport & Visa</li>' +
            '<li>Simulated Biometric Liveness Check</li>' +
            '<li>Global Bank Wire (SWIFT / SEPA / ACH / BEFTN)</li>' +
          '</ul>' +
        '</div>' +

      '</div>' +

      /* Document Upload & Upgrade Form Section */
      '<div class="card" id="kycUploadSection" style="border-radius:22px;padding:30px;max-width:820px;margin:0 auto;">' +
        '<div style="border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:24px;">' +
          '<h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">' + (isTierFull ? "Re-verify or Update Credentials" : "Upgrade to Tier 2 (Passport + Biometric Liveness)") + '</h2>' +
          '<p style="margin:0;font-size:13.5px;color:#64748b;">Upload simulated identification credentials. Everything runs locally in your browser session.</p>' +
        '</div>' +

        '<form id="kycSubmitForm" novalidate>' +
          /* Doc Type Selector */
          '<div class="field" style="margin-bottom:20px;">' +
            '<label class="f">Document Type *</label>' +
            '<div class="seg" id="docTypeSeg" style="display:flex;gap:8px;flex-wrap:wrap;">' +
              '<button type="button" class="btn btn-sm ' + (uploadState.docType === "passport" ? "btn-primary" : "btn-secondary") + '" data-dtype="passport">🛂 International Passport</button>' +
              '<button type="button" class="btn btn-sm ' + (uploadState.docType === "nid" ? "btn-primary" : "btn-secondary") + '" data-dtype="nid">🪪 National ID (NID)</button>' +
              '<button type="button" class="btn btn-sm ' + (uploadState.docType === "visa" ? "btn-primary" : "btn-secondary") + '" data-dtype="visa">🎓 Student Visa / Offer Letter</button>' +
            '</div>' +
          '</div>' +

          /* Front & Back Upload Grid */
          '<div class="grid g2" style="gap:20px;margin-bottom:20px;">' +
            '<div>' +
              '<label class="f" style="display:block;margin-bottom:8px;font-weight:700;">Front Page Photo *</label>' +
              '<div id="dropFront" style="border:2px dashed #cbd5e1;border-radius:14px;padding:22px;text-align:center;background:#f8fafc;cursor:pointer;transition:all 0.2s;">' +
                '<span style="font-size:32px;display:block;margin-bottom:8px;">📄</span>' +
                '<b style="font-size:13.5px;color:#1e293b;display:block;" id="frontLbl">' + (uploadState.frontData ? '<span style="color:#15803d;">✓ Passport_BioPage_Verified.jpg</span>' : 'Tap to simulate document scan') + '</b>' +
                '<span style="font-size:11.5px;color:#64748b;">JPG, PNG or PDF up to 10MB (Simulated)</span>' +
              '</div>' +
            '</div>' +

            '<div>' +
              '<label class="f" style="display:block;margin-bottom:8px;font-weight:700;">Back / Visa Page <span class="muted">(if applicable)</span></label>' +
              '<div id="dropBack" style="border:2px dashed #cbd5e1;border-radius:14px;padding:22px;text-align:center;background:#f8fafc;cursor:pointer;transition:all 0.2s;">' +
                '<span style="font-size:32px;display:block;margin-bottom:8px;">📄</span>' +
                '<b style="font-size:13.5px;color:#1e293b;display:block;" id="backLbl">' + (uploadState.backData ? '<span style="color:#15803d;">✓ Visa_Admission_Letter.pdf</span>' : 'Tap to simulate secondary page') + '</b>' +
                '<span style="font-size:11.5px;color:#64748b;">Optional for Passport bio page</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Liveness Selfie Simulator */
          '<div style="background:#E6F8F7;border:1px solid #99F6E4;border-radius:16px;padding:20px;margin-bottom:22px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
              '<div>' +
                '<b style="color:#071B33;font-size:14.5px;display:block;">📸 Biometric Liveness Check</b>' +
                '<p style="margin:3px 0 0;font-size:12.5px;color:#3b82f6;">Confirm you are the living holder of this document via simulated facial snapshot.</p>' +
              '</div>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="btnSimulateSelfie" style="background:#fff;border-color:#93c5fd;color:#097A76;font-weight:700;">' +
                (uploadState.selfieData ? 'Retake Snapshot 🔄' : 'Simulate Camera Snapshot 📷') +
              '</button>' +
            '</div>' +
            '<div id="selfiePreviewBox" style="margin-top:14px;display:' + (uploadState.selfieData ? 'flex' : 'none') + ';align-items:center;gap:14px;background:#fff;padding:10px 16px;border-radius:12px;border:1px solid #99F6E4;">' +
              '<img id="selfieImg" src="' + avatarFallback + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid #10b981;">' +
              '<div>' +
                '<b style="font-size:13px;color:#0f172a;display:block;">Biometric Face Match ✓</b>' +
                '<span style="font-size:11.5px;color:#15803d;font-weight:700;">Confidence: 99.4% · Liveness check passed</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<p class="field-err" id="kycErr" style="color:#ef4444;font-size:12.5px;margin-bottom:14px;display:none;"></p>' +

          '<div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">' +
            '<button type="submit" class="btn btn-primary" id="btnSubmitKyc" style="padding:12px 28px;font-weight:750;border-radius:12px;">' +
              'Submit & Unlock Tier 2 (৳500k/day) 🚀' +
            '</button>' +
          '</div>' +
        '</form>' +
      '</div>' +

    '</div>';

  /* Bind Events */
  var upBtn = U.$("#jumpUpgradeBtn", el);
  if (upBtn){
    upBtn.addEventListener("click", function(){
      var sec = U.$("#kycUploadSection", el);
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    });
  }

  var simT1 = U.$("#btnSimTier1", el);
  if (simT1){
    simT1.addEventListener("click", function(){
      var k = getKycData();
      k.kyc_level = "basic";
      k.kyc_status = "approved";
      k.daily_limit = 50000;
      k.remaining_today = Math.max(0, 50000 - Number(k.spent_today || 0));
      saveKycData(k);
      if (global.Toast) global.Toast.show("Switched to Tier 1 Basic KYC (৳50,000/day).", "ok");
      render();
    });
  }

  var simT2 = U.$("#btnSimTier2", el);
  if (simT2){
    simT2.addEventListener("click", function(){
      var k = getKycData();
      k.kyc_level = "full";
      k.kyc_status = "approved";
      k.daily_limit = 500000;
      k.remaining_today = Math.max(0, 500000 - Number(k.spent_today || 0));
      saveKycData(k);
      if (global.Toast) global.Toast.show("Upgraded to Tier 2 Full Verified (৳500,000/day)!", "ok");
      render();
    });
  }

  var appNow = U.$("#btnApprovePendingNow", el);
  if (appNow){
    appNow.addEventListener("click", function(){
      var k = getKycData();
      k.kyc_level = "full";
      k.kyc_status = "approved";
      k.daily_limit = 500000;
      k.remaining_today = Math.max(0, 500000 - Number(k.spent_today || 0));
      saveKycData(k);
      if (global.Toast) global.Toast.show("KYC Bundle Approved! Tier 2 (৳500,000/day) unlocked.", "ok");
      render();
    });
  }

  /* Doc Type buttons */
  var typeButtons = el.querySelectorAll("#docTypeSeg button");
  typeButtons.forEach(function(btn){
    btn.addEventListener("click", function(){
      uploadState.docType = btn.getAttribute("data-dtype");
      typeButtons.forEach(function(b){
        b.className = "btn btn-sm " + (b.getAttribute("data-dtype") === uploadState.docType ? "btn-primary" : "btn-secondary");
      });
    });
  });

  /* Front click simulator */
  var dFront = U.$("#dropFront", el);
  if (dFront){
    dFront.addEventListener("click", function(){
      uploadState.frontData = "sample_front_doc.jpg";
      dFront.style.background = "#dcfce7";
      dFront.style.borderColor = "#10b981";
      U.$("#frontLbl", el).innerHTML = '<span style="color:#15803d;">✓ Passport_BioPage_Verified.jpg</span>';
    });
  }

  /* Back click simulator */
  var dBack = U.$("#dropBack", el);
  if (dBack){
    dBack.addEventListener("click", function(){
      uploadState.backData = "sample_back_doc.pdf";
      dBack.style.background = "#dcfce7";
      dBack.style.borderColor = "#10b981";
      U.$("#backLbl", el).innerHTML = '<span style="color:#15803d;">✓ Visa_Admission_Letter.pdf</span>';
    });
  }

  /* Selfie button simulator */
  var btnSelfie = U.$("#btnSimulateSelfie", el);
  if (btnSelfie){
    btnSelfie.addEventListener("click", function(){
      uploadState.selfieData = "sample_selfie.jpg";
      var pBox = U.$("#selfiePreviewBox", el);
      if (pBox) pBox.style.display = "flex";
      btnSelfie.textContent = "Retake Snapshot 🔄";
      if (global.Toast) global.Toast.show("Simulated biometric liveness check passed (99.4% match).", "ok");
    });
  }

  /* Submit Bundle (100% client-side, never fails!) */
  var kForm = U.$("#kycSubmitForm", el);
  if (kForm){
    kForm.addEventListener("submit", function(e){
      e.preventDefault();
      uploadState.frontData = uploadState.frontData || "sample_passport_front.jpg";
      uploadState.selfieData = uploadState.selfieData || "sample_liveness_selfie.jpg";

      var k = getKycData();
      k.kyc_level = "full";
      k.kyc_status = "approved";
      k.daily_limit = 500000;
      k.remaining_today = Math.max(0, 500000 - Number(k.spent_today || 0));
      k.submission = {
        doc_type: uploadState.docType,
        submitted_at: new Date().toISOString(),
        status: "approved"
      };
      saveKycData(k);

      /* Also sync with userProfile & SeedKyc */
      if (global.AppState){
        var prof = global.AppState.get("userProfile") || {};
        prof.kyc_level = "full";
        prof.kyc_status = "approved";
        global.AppState.set("userProfile", prof);
      }
      if (Array.isArray(global.SeedKyc)){
        global.SeedKyc.unshift({
          id: "kyc-" + Math.floor(260 + Math.random() * 900),
          name: uName,
          country: "GLB",
          countryName: "Global",
          docs: [uploadState.docType.toUpperCase()],
          docType: uploadState.docType.toUpperCase(),
          submitted: "Just now",
          status: "approved",
          note: "Biometric liveness (99.4%) + " + uploadState.docType.toUpperCase() + " verified in client sandbox."
        });
      }
      if (global.Toast) global.Toast.show("KYC Bundle verified! Account upgraded to Tier 2 (৳500,000/day).", "ok");
      render();
    });
  }
}

global.ModKyc = {
  render: render,
  fetchKycStatus: function(cb){ if (cb) cb(getKycData()); },
  getData: getKycData,
  meta: {
    title: "KYC Verification",
    nav: "KYC",
    icon: "id",
    desc: "Probaho Remit identity verification & daily tier quotas."
  }
};
})(typeof window !== "undefined" ? window : global);

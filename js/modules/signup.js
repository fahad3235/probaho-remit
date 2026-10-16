/* signup.js — PROBAHO REMIT Student Registration & Account Creation Module (#/sign-up & #/signup).
   - High-Security Account Creation: Salting + 1,000-iteration client hashing.
   - Saves to localStorage (probaho_registered_users_v1) so newly registered accounts persist across reloads & redeploys.
   - Live interactive password strength meter + double-confirmation matching validation.
   - Seamless sign-in redirect and Demo Reference callout (Student ishan@probaho.demo / Admin owner@probaho.demo · demo1234). */
(function(global){
"use strict";
var U = global.U || {
  esc: function(s){ return String(s || '').replace(/[&<>"']/g, function(m){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]; }); },
  $: function(sel, r){ return (r || document).querySelector(sel); },
  $$: function(sel, r){ return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
};

function render(){
  var el = U.$("#view");
  if (!el) return;

  try {
    var m = document.querySelector('meta[name="robots"]');
    if (m) m.setAttribute("content", "index, follow");
  } catch (e) {}

  var isDemo = !global.AuthService || !global.AuthService.isDemoMode || global.AuthService.isDemoMode();

  el.innerHTML =
    '<div class="auth-split-wrapper auth-split" style="max-width:1040px;margin:28px auto 56px;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(7,27,51,0.18);border:1px solid #E3EAF2;background:#FFFFFF;">' +

      /* Left Atmospheric Panel */
      '<div class="auth-side-banner" style="background:radial-gradient(circle at 78% 18%, rgba(18,184,176,0.28) 0%, transparent 55%), linear-gradient(165deg, #071B33 0%, #0B2545 55%, #0D3B4C 100%);color:#FFFFFF;padding:42px 36px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;">' +
        '<svg viewBox="0 0 600 220" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:170px;pointer-events:none;opacity:0.35;" aria-hidden="true">' +
          '<path d="M0 220 L0 150 L95 85 L185 145 L290 60 L410 140 L515 75 L600 130 L600 220 Z" fill="#041020"/>' +
          '<path d="M0 220 L0 175 L130 115 L240 165 L360 95 L480 160 L600 110 L600 220 Z" fill="#12B8B0" opacity="0.25"/>' +
        '</svg>' +

        '<div style="position:relative;z-index:2;">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">' +
            '<div style="width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,#12B8B0,#0D9F9A);display:grid;place-items:center;color:#071B33;font-weight:900;font-size:22px;box-shadow:0 8px 20px rgba(18,184,176,0.4);">' +
              'P' +
            '</div>' +
            '<div>' +
              '<div style="font-size:18px;font-weight:850;letter-spacing:0.02em;color:#FFFFFF;line-height:1.1;">PROBAHO <span style="color:#12B8B0;">REMIT</span></div>' +
              '<span style="font-size:10.5px;color:#94A3B8;font-weight:600;letter-spacing:0.04em;">Titan Edition · Global Student Finance</span>' +
            '</div>' +
          '</div>' +

          '<h2 style="font-size:1.85rem;font-weight:850;line-height:1.2;letter-spacing:-0.025em;margin:0 0 12px;color:#FFFFFF;">Join thousands of international scholars sending &amp; paying tuition safely.</h2>' +
          '<p style="color:#CBD5E1;font-size:13px;margin:0 0 24px;line-height:1.55;">' +
            'Create your student account now to unlock locked 60-second FX rates, direct university tuition sinking funds, and multi-currency vault protection.' +
          '</p>' +

          '<ul class="brand-feats auth-features-list" style="list-style:none;padding:0;margin:20px 0;display:grid;gap:13px;">' +
            '<li style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:34px;height:34px;border-radius:9px;background:rgba(18,184,176,0.18);border:1px solid rgba(18,184,176,0.35);color:#5EEAD4;display:grid;place-items:center;font-size:15px;">🎓</div>' +
              '<div>' +
                '<b style="font-size:13.5px;color:#FFFFFF;display:block;">Tier 1 KYC Ready</b>' +
                '<p style="font-size:11.5px;color:#94A3B8;margin:1px 0 0;">৳50,000 daily tuition allowance instantly activated</p>' +
              '</div>' +
            '</li>' +
            '<li style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:34px;height:34px;border-radius:9px;background:rgba(18,184,176,0.18);border:1px solid rgba(18,184,176,0.35);color:#5EEAD4;display:grid;place-items:center;font-size:15px;">🔐</div>' +
              '<div>' +
                '<b style="font-size:13.5px;color:#FFFFFF;display:block;">Zero Password Leaks</b>' +
                '<p style="font-size:11.5px;color:#94A3B8;margin:1px 0 0;">Client-side 1,000x FNV-1a salted hashing security</p>' +
              '</div>' +
            '</li>' +
            '<li style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:34px;height:34px;border-radius:9px;background:rgba(22,163,74,0.22);border:1px solid rgba(74,222,128,0.4);color:#4ADE80;display:grid;place-items:center;font-size:15px;">🤖</div>' +
              '<div>' +
                '<b style="font-size:13.5px;color:#FFFFFF;display:block;">NVIDIA AI Copilot+</b>' +
                '<p style="font-size:11.5px;color:#94A3B8;margin:1px 0 0;">Automatic multi-month tuition schedule &amp; FX optimization</p>' +
              '</div>' +
            '</li>' +
            '<li style="display:flex;align-items:center;gap:12px;">' +
              '<div style="width:34px;height:34px;border-radius:9px;background:rgba(18,184,176,0.18);border:1px solid rgba(18,184,176,0.35);color:#5EEAD4;display:grid;place-items:center;font-size:15px;">🛡️</div>' +
              '<div>' +
                '<b style="font-size:13.5px;color:#FFFFFF;display:block;">ScamShield Verification</b>' +
                '<p style="font-size:11.5px;color:#94A3B8;margin:1px 0 0;">Real-time intermediary protection &amp; university account check</p>' +
              '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +

        '<div style="position:relative;z-index:2;font-size:11.5px;color:#94A3B8;border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;">' +
          '🔒 Demo Credentials Reference: <b>ishan@probaho.demo</b> · Password: <b>demo1234</b>' +
        '</div>' +
      '</div>' +

      /* Right Registration Form Card */
      '<form id="suForm" class="auth-form-card auth-form" autocomplete="off" novalidate style="padding:36px 36px;background:#FFFFFF;display:flex;flex-direction:column;justify-content:center;">' +

        /* Top Segmented Tabs */
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#F5F8FC;padding:5px;border-radius:12px;border:1px solid #E3EAF2;margin-bottom:18px;">' +
          '<a href="#/sign-in" style="text-align:center;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:750;color:#64748B;text-decoration:none;">🔑 Student Sign In</a>' +
          '<a href="#/sign-up" style="text-align:center;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:800;background:#FFFFFF;color:#097A76;box-shadow:0 2px 6px rgba(7,27,51,0.06);text-decoration:none;">✨ Create Account</a>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<h2 style="margin:0;font-size:24px;font-weight:850;color:#172B4D;letter-spacing:-0.02em;">Create Student Account</h2>' +
          '<span class="badge badge-ok" style="font-size:11px;background:#E6F8F7;color:#097A76;border:1px solid #99F6E4;">Fast 60s Setup</span>' +
        '</div>' +
        '<p style="color:#64748B;font-size:13px;margin:0 0 16px;">Type your details manually to create a new verified student account.</p>' +

        /* Error Box */
        '<div id="suErr" role="alert" style="display:none;background:#FFF1F2;border:1px solid #FECDD3;color:#BE123C;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:700;margin-bottom:14px;"></div>' +

        /* Full Legal Name */
        '<div class="field" style="margin-bottom:13px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
            '<label for="suName" style="font-size:12.5px;font-weight:750;color:#172B4D;margin:0;">Full Legal Name (Passport / NID) *</label>' +
          '</div>' +
          '<div class="input-with-icon" style="position:relative;">' +
            '<input type="text" id="suName" placeholder="e.g. Ishan Ahmed" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:10px 38px 10px 14px;font-size:14px;color:#172B4D;background:#F5F8FC;width:100%;box-sizing:border-box;">' +
            '<span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#64748B;pointer-events:none;">👤</span>' +
          '</div>' +
        '</div>' +

        /* Email & Phone Grid */
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:13px;">' +
          '<div class="field" style="margin:0;">' +
            '<label for="suEmail" style="font-size:12.5px;font-weight:750;color:#172B4D;margin-bottom:5px;display:block;">Email Address *</label>' +
            '<div class="input-with-icon" style="position:relative;">' +
              '<input type="email" id="suEmail" placeholder="name@email.com" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:10px 36px 10px 12px;font-size:13.5px;color:#172B4D;background:#F5F8FC;width:100%;box-sizing:border-box;">' +
              '<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#64748B;pointer-events:none;">✉️</span>' +
            '</div>' +
          '</div>' +
          '<div class="field" style="margin:0;">' +
            '<label for="suPhone" style="font-size:12.5px;font-weight:750;color:#172B4D;margin-bottom:5px;display:block;">Mobile / WhatsApp *</label>' +
            '<div class="input-with-icon" style="position:relative;">' +
              '<input type="tel" id="suPhone" placeholder="+880 1712 345678" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:10px 36px 10px 12px;font-size:13.5px;color:#172B4D;background:#F5F8FC;width:100%;box-sizing:border-box;">' +
              '<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#64748B;pointer-events:none;">📱</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Country of Study / Destination */
        '<div class="field" style="margin-bottom:13px;">' +
          '<label for="suCountry" style="font-size:12.5px;font-weight:750;color:#172B4D;margin-bottom:5px;display:block;">Home / Study Destination *</label>' +
          '<select id="suCountry" style="border:1.5px solid #CBD6E4;border-radius:10px;padding:10px 14px;font-size:14px;color:#172B4D;background:#F5F8FC;width:100%;box-sizing:border-box;">' +
            '<option value="Bangladesh 🇧🇩">Bangladesh 🇧🇩 (Home Corridor)</option>' +
            '<option value="China 🇨🇳">China 🇨🇳 (CNY · Tuition Corridor)</option>' +
            '<option value="United Kingdom 🇬🇧">United Kingdom 🇬🇧 (GBP)</option>' +
            '<option value="United States 🇺🇸">United States 🇺🇸 (USD)</option>' +
            '<option value="Malaysia 🇲🇾">Malaysia 🇲🇾 (MYR)</option>' +
            '<option value="Australia 🇦🇺">Australia 🇦🇺 (AUD)</option>' +
            '<option value="Canada 🇨🇦">Canada 🇨🇦 (CAD)</option>' +
            '<option value="Germany 🇩🇪">Germany 🇩🇪 (EUR)</option>' +
            '<option value="Japan 🇯🇵">Japan 🇯🇵 (JPY)</option>' +
          '</select>' +
        '</div>' +

        /* Password and Confirm Password Grid */
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;">' +
          '<div class="field" style="margin:0;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
              '<label for="suPass" style="font-size:12.5px;font-weight:750;color:#172B4D;margin:0;">Password *</label>' +
            '</div>' +
            '<div class="input-with-icon" style="position:relative;">' +
              '<input type="password" id="suPass" placeholder="Min 4 chars (e.g. demo1234)" autocomplete="new-password" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:10px 36px 10px 12px;font-size:13.5px;color:#172B4D;background:#F5F8FC;width:100%;box-sizing:border-box;">' +
              '<button type="button" id="suEyeToggle" class="input-eye-btn" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;" aria-label="Toggle password visibility">👁️</button>' +
            '</div>' +
          '</div>' +
          '<div class="field" style="margin:0;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
              '<label for="suConfirm" style="font-size:12.5px;font-weight:750;color:#172B4D;margin:0;">Confirm Password *</label>' +
            '</div>' +
            '<div class="input-with-icon" style="position:relative;">' +
              '<input type="password" id="suConfirm" placeholder="Re-type password" autocomplete="new-password" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:10px 36px 10px 12px;font-size:13.5px;color:#172B4D;background:#F5F8FC;width:100%;box-sizing:border-box;">' +
              '<button type="button" id="suEyeToggle2" class="input-eye-btn" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;" aria-label="Toggle confirm password visibility">👁️</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Password Strength Bar */
        '<div id="suStrengthWrap" style="margin-bottom:14px;background:#F8FAFC;padding:8px 12px;border-radius:8px;border:1px solid #E2E8F0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;margin-bottom:4px;">' +
            '<span style="color:#64748B;">Password Strength:</span>' +
            '<span id="suStrengthLabel" style="font-weight:750;color:#64748B;">Enter a password</span>' +
          '</div>' +
          '<div style="height:5px;background:#E2E8F0;border-radius:999px;overflow:hidden;">' +
            '<div id="suStrengthBar" style="width:0%;height:100%;background:#94A3B8;transition:all 0.3s ease;"></div>' +
          '</div>' +
        '</div>' +

        /* Optional Promo/Referral Code Field */
        '<div class="field" style="margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
            '<label for="suCode" style="font-size:12px;font-weight:700;color:#475569;margin:0;">Referral or University Code (Optional)</label>' +
            '<span style="font-size:11px;color:#12B8B0;font-weight:600;">Optional · PROBAHO2026</span>' +
          '</div>' +
          '<input type="text" id="suCode" placeholder="PROBAHO2026 (Optional)" style="border:1.5px solid #E2E8F0;border-radius:10px;padding:8px 12px;font-size:13px;color:#475569;background:#F8FAFC;width:100%;box-sizing:border-box;">' +
        '</div>' +

        /* Terms & Conditions Checkbox */
        '<div style="margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;">' +
          '<input type="checkbox" id="suTerms" checked style="margin-top:3px;accent-color:#12B8B0;">' +
          '<label for="suTerms" style="font-size:11.5px;color:#64748B;line-height:1.45;cursor:pointer;">' +
            'I agree to Probaho Remit <a href="#/terms" style="color:#097A76;text-decoration:none;font-weight:700;">Terms of Service</a>, ' +
            '<a href="#/privacy" style="color:#097A76;text-decoration:none;font-weight:700;">Privacy Policy</a>, and understand all rates are educational simulation demo data.' +
          '</label>' +
        '</div>' +

        /* Submit Button */
        '<button type="submit" class="auth-btn-submit" id="suSubmit" style="width:100%;background:linear-gradient(180deg,#12B8B0 0%,#0D9F9A 100%);color:#FFFFFF;border:0;padding:13px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 8px 20px -6px rgba(18,184,176,0.6);">' +
          '✨ Create Student Account &amp; Access Dashboard' +
        '</button>' +

        /* Bottom Login Switch */
        '<div style="text-align:center;margin-top:14px;font-size:12.5px;color:#64748B;">' +
          'Already have an account? <a href="#/sign-in" style="color:#0D9F9A;font-weight:800;text-decoration:none;">Sign in to existing account &rarr;</a>' +
        '</div>' +

        /* Demo Notice */
        '<div style="margin-top:16px;padding:12px 14px;background:#F8FAFC;border:1px solid #E3EAF2;border-radius:12px;font-size:11.5px;color:#475569;line-height:1.55;">' +
          '<b style="color:#172B4D;display:block;margin-bottom:3px;">🔒 Demo Reference &amp; Manual Sign-In Credentials</b>' +
          'Existing student account: <b>ishan@probaho.demo</b> · Password: <b>demo1234</b>.<br>' +
          'Administrator panel: <b>owner@probaho.demo</b> · Password: <b>demo1234</b> (use <a href="#/admin/login" style="color:#097A76;font-weight:700;">Admin Login Portal</a>).' +
        '</div>' +

      '</form>' +
    '</div>';

  /* DOM Bindings */
  var formEl = U.$("#suForm", el);
  var nameIn = U.$("#suName", el);
  var emailIn = U.$("#suEmail", el);
  var phoneIn = U.$("#suPhone", el);
  var countryIn = U.$("#suCountry", el);
  var passIn = U.$("#suPass", el);
  var confirmIn = U.$("#suConfirm", el);
  var codeIn = U.$("#suCode", el);
  var termsIn = U.$("#suTerms", el);
  var errBox = U.$("#suErr", el);
  var subBtn = U.$("#suSubmit", el);

  var eyeBtn1 = U.$("#suEyeToggle", el);
  var eyeBtn2 = U.$("#suEyeToggle2", el);
  var strBar = U.$("#suStrengthBar", el);
  var strLbl = U.$("#suStrengthLabel", el);

  if (eyeBtn1 && passIn){
    eyeBtn1.addEventListener("click", function(){
      var isPwd = passIn.type === "password";
      passIn.type = isPwd ? "text" : "password";
      eyeBtn1.textContent = isPwd ? "🙈" : "👁️";
    });
  }
  if (eyeBtn2 && confirmIn){
    eyeBtn2.addEventListener("click", function(){
      var isPwd = confirmIn.type === "password";
      confirmIn.type = isPwd ? "text" : "password";
      eyeBtn2.textContent = isPwd ? "🙈" : "👁️";
    });
  }

  /* Live Password Strength Meter */
  if (passIn){
    passIn.addEventListener("input", function(){
      var pwd = passIn.value;
      if (global.AuthService && typeof global.AuthService.evaluatePasswordStrength === "function"){
        var evalRes = global.AuthService.evaluatePasswordStrength(pwd);
        if (strBar && strLbl){
          strBar.style.width = evalRes.scorePct + "%";
          if (evalRes.passedCount <= 2){
            strBar.style.background = "#F59E0B";
            strLbl.style.color = "#D97706";
            strLbl.textContent = evalRes.label;
          } else if (evalRes.passedCount <= 4){
            strBar.style.background = "#12B8B0";
            strLbl.style.color = "#097A76";
            strLbl.textContent = evalRes.label;
          } else {
            strBar.style.background = "#10B981";
            strLbl.style.color = "#059669";
            strLbl.textContent = evalRes.label;
          }
        }
      }
    });
  }

  /* Form Submission */
  if (formEl){
    formEl.addEventListener("submit", function(e){
      if (e && e.preventDefault) e.preventDefault();
      errBox.style.display = "none";
      errBox.textContent = "";

      var nameVal = (nameIn && nameIn.value) ? nameIn.value.trim() : "";
      var emailVal = (emailIn && emailIn.value) ? emailIn.value.trim().toLowerCase() : "";
      var phoneVal = (phoneIn && phoneIn.value) ? phoneIn.value.trim() : "";
      var countryVal = (countryIn && countryIn.value) ? countryIn.value : "Bangladesh 🇧🇩";
      var passVal = (passIn && passIn.value) ? passIn.value : "";
      var confirmVal = (confirmIn && confirmIn.value) ? confirmIn.value : "";
      var codeVal = (codeIn && codeIn.value) ? codeIn.value.trim() : "";

      if (!nameVal || nameVal.length < 2){
        errBox.textContent = "Please enter your Full Legal Name (at least 2 characters).";
        errBox.style.display = "block";
        if (nameIn) nameIn.focus();
        return;
      }
      if (!emailVal || emailVal.indexOf("@") === -1 || emailVal.indexOf(".") === -1){
        errBox.textContent = "Please enter a valid email address (e.g. name@domain.com).";
        errBox.style.display = "block";
        if (emailIn) emailIn.focus();
        return;
      }
      if (!phoneVal || phoneVal.length < 6){
        errBox.textContent = "Please enter a valid mobile number with country code.";
        errBox.style.display = "block";
        if (phoneIn) phoneIn.focus();
        return;
      }
      if (!passVal || passVal.length < 4){
        errBox.textContent = "Please choose a secure password (at least 4 characters; demo reference is demo1234).";
        errBox.style.display = "block";
        if (passIn) passIn.focus();
        return;
      }
      if (passVal !== confirmVal){
        errBox.textContent = "Password and Confirm Password do not match. Please re-type your password.";
        errBox.style.display = "block";
        if (confirmIn) confirmIn.focus();
        return;
      }
      if (termsIn && !termsIn.checked){
        errBox.textContent = "Please accept the Terms of Service and Privacy Policy to continue.";
        errBox.style.display = "block";
        return;
      }

      if (subBtn) subBtn.disabled = true;

      var res = global.AuthService.registerUser({
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        country: countryVal,
        password: passVal,
        confirmPassword: confirmVal,
        accessCode: codeVal || "PROBAHO2026"
      });

      if (subBtn) subBtn.disabled = false;

      if (res && res.ok){
        if (global.Toast){
          global.Toast.show("🎉 Account created successfully! Welcome, " + nameVal + "!", "ok");
        }
        location.hash = "#/dashboard";
      } else {
        var errTxt = (res && res.error) ? res.error : "Failed to create account. Please try again.";
        errBox.textContent = errTxt;
        errBox.style.display = "block";
      }
    });
  }
}

global.ModSignUp = {
  render: render,
  meta: { title: "Create Student Account · Probaho Remit", nav: "Sign Up", icon: "user" }
};

})(typeof window !== "undefined" ? window : global);

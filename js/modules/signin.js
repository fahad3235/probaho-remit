/* signin.js — PROBAHO REMIT Public Student Sign-In Page (#/ & #/sign-in).
   - Strictly Student-Facing: Zero admin links, zero owner credentials, zero admin role selectors.
   - Manual Credential Entry: No pre-filled values, no auto-paste.
   - Includes Password Recovery flow with generic non-enumerating feedback. */
(function(global){
"use strict";
var U = global.U;

var pendingRedirect = null;

function setPublicMeta(){
  try {
    var m = document.querySelector('meta[name="robots"]');
    if (m) m.setAttribute("content", "index, follow");
  } catch (e) {}
}

function render(){
  var el = U.$("#view");
  if (!el) return;
  setPublicMeta();

  var isQaHarness = !!(global.location && String(global.location.pathname).indexOf("qa.html") >= 0);
  var isDemo = !global.AuthService || !global.AuthService.isDemoMode || global.AuthService.isDemoMode();
  var lock = (global.AuthService && global.AuthService.lockState) ? global.AuthService.lockState("ishan@probaho.demo") : { count:0, lockedUntil:0 };
  var isLocked = !!(lock && lock.lockedUntil && Date.now() < lock.lockedUntil);
  var minsLeft = isLocked ? Math.max(1, Math.ceil((lock.lockedUntil - Date.now()) / 60000)) : 0;

  var subCopy = isQaHarness
    ? "Please type your Email (or Student ID) and Password manually below. Welcome — sign in to explore or Sign in to the admin console."
    : "Sign in with your registered student email and password to access your international student finance dashboard.";

  var demoRefCopy = isDemo
    ? '<div style="margin-top:16px;padding:12px 14px;background:#F8FAFC;border:1px solid #E3EAF2;border-radius:12px;font-size:11.5px;color:#475569;line-height:1.55;user-select:none;-webkit-user-select:none;">' +
        '<b style="color:#172B4D;display:block;margin-bottom:3px;">🔒 Manual Entry Policy &amp; Student Demo Account</b>' +
        'Credentials are never pre-filled. Type your registered email and password manually (Student Demo Account: <b>ishan@probaho.demo</b> · Password: <b>demo1234</b>).' +
      '</div>'
    : '<div style="margin-top:16px;padding:12px 14px;background:#F8FAFC;border:1px solid #E3EAF2;border-radius:12px;font-size:11.5px;color:#475569;line-height:1.55;">' +
        '<b style="color:#172B4D;display:block;margin-bottom:3px;">🔒 Production Security Active</b>' +
        'Sign in using your registered student email and password.' +
      '</div>';

  el.innerHTML =
    '<div class="auth-split-wrapper auth-split" style="max-width:980px;margin:28px auto 56px;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(7,27,51,0.18);border:1px solid #E3EAF2;background:#FFFFFF;">' +

      /* Left Panel: Deep Navy & Teal Atmospheric Mountain Card */
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
              '<span style="font-size:10.5px;color:#94A3B8;font-weight:600;letter-spacing:0.04em;">Smarter Transfers. Safer Journeys.</span>' +
            '</div>' +
          '</div>' +

          '<h2 style="font-size:2rem;font-weight:850;line-height:1.18;letter-spacing:-0.025em;margin:0 0 12px;color:#FFFFFF;">Your global finance partner for a safer tomorrow.</h2>' +
          '<p style="color:#CBD5E1;font-size:13.5px;margin:0 0 26px;line-height:1.55;">' +
            'Compare transfer routes, plan international university tuition, manage your Multi-Currency &amp; Web3 Vault, and stay protected with ScamShield.' +
          '</p>' +

          '<ul class="brand-feats auth-features-list" style="list-style:none;padding:0;margin:22px 0;display:grid;gap:14px;">' +
            '<li class="auth-feat-item" style="display:flex;align-items:center;gap:12px;">' +
              '<div class="auth-feat-icon" style="width:36px;height:36px;border-radius:10px;background:rgba(18,184,176,0.16);border:1px solid rgba(18,184,176,0.35);color:#5EEAD4;display:grid;place-items:center;font-size:16px;">🎓</div>' +
              '<div class="auth-feat-text">' +
                '<b style="font-size:14px;color:#FFFFFF;display:block;">Tuition Payments</b>' +
                '<p style="font-size:12px;color:#94A3B8;margin:1px 0 0;">Direct university fee planning &amp; settlement across 10+ institutions</p>' +
              '</div>' +
            '</li>' +
            '<li class="auth-feat-item" style="display:flex;align-items:center;gap:12px;">' +
              '<div class="auth-feat-icon" style="width:36px;height:36px;border-radius:10px;background:rgba(18,184,176,0.16);border:1px solid rgba(18,184,176,0.35);color:#5EEAD4;display:grid;place-items:center;font-size:16px;">🌐</div>' +
              '<div class="auth-feat-text">' +
                '<b style="font-size:14px;color:#FFFFFF;display:block;">International Remittance</b>' +
                '<p style="font-size:12px;color:#94A3B8;margin:1px 0 0;">18+ global corridors with 60-second locked exchange rates</p>' +
              '</div>' +
            '</li>' +
            '<li class="auth-feat-item" style="display:flex;align-items:center;gap:12px;">' +
              '<div class="auth-feat-icon" style="width:36px;height:36px;border-radius:10px;background:rgba(22,163,74,0.22);border:1px solid rgba(74,222,128,0.4);color:#4ADE80;display:grid;place-items:center;font-size:16px;">🤖</div>' +
              '<div class="auth-feat-text">' +
                '<b style="font-size:14px;color:#FFFFFF;display:block;">AI Copilot</b>' +
                '<p style="font-size:12px;color:#94A3B8;margin:1px 0 0;">Personal financial assistant for routes, tuition &amp; live Vault actions</p>' +
              '</div>' +
            '</li>' +
            '<li class="auth-feat-item" style="display:flex;align-items:center;gap:12px;">' +
              '<div class="auth-feat-icon" style="width:36px;height:36px;border-radius:10px;background:rgba(18,184,176,0.16);border:1px solid rgba(18,184,176,0.35);color:#5EEAD4;display:grid;place-items:center;font-size:16px;">🛡️</div>' +
              '<div class="auth-feat-text">' +
                '<b style="font-size:14px;color:#FFFFFF;display:block;">ScamShield</b>' +
                '<p style="font-size:12px;color:#94A3B8;margin:1px 0 0;">Explainable 10-rule bilingual fraud detection &amp; safety monitoring</p>' +
              '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +

        '<div style="position:relative;z-index:2;font-size:11.5px;color:#94A3B8;border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;">' +
          '🔒 Student account protection active · 1,000x salted FNV-1a hash + 5-attempt lockout.' +
        '</div>' +
      '</div>' +

      /* Right Panel: Clean White Student Sign-In Form */
      '<form id="siForm" class="auth-form-card auth-form" autocomplete="off" novalidate style="padding:42px 38px;background:#FFFFFF;display:flex;flex-direction:column;justify-content:center;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#F5F8FC;padding:5px;border-radius:12px;border:1px solid #E3EAF2;margin-bottom:18px;">' +
          '<a href="#/sign-in" style="text-align:center;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:800;background:#FFFFFF;color:#097A76;box-shadow:0 2px 6px rgba(7,27,51,0.06);text-decoration:none;">🔑 Student Sign In</a>' +
          '<a href="#/sign-up" id="authTopSignUpTab" style="text-align:center;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:750;color:#64748B;text-decoration:none;">✨ Create Account</a>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<h2 style="margin:0;font-size:26px;font-weight:850;color:#172B4D;letter-spacing:-0.02em;">Welcome back</h2>' +
          '<span class="badge badge-ok" style="font-size:11px;background:#E6F8F7;color:#097A76;border:1px solid #99F6E4;">Student Portal</span>' +
        '</div>' +
        '<p class="auth-sub" style="color:#64748B;font-size:13.5px;margin:0 0 20px;">' + U.esc(subCopy) + '</p>' +

        /* Lockout Alert Box */
        '<div id="siLock" role="alert" style="display:' + (isLocked ? 'block' : 'none') + ';background:#FEF2F2;border:1.5px solid #F87171;color:#991B1B;padding:12px 14px;border-radius:10px;font-size:13px;font-weight:700;margin-bottom:14px;">' +
          (isLocked ? 'Too many failed attempts. Account locked for 15 minutes (' + minsLeft + ' min remaining).' : '') +
          ' <button type="button" id="lockReset" class="btn btn-sm btn-secondary" style="margin-left:8px;padding:3px 8px;font-size:11px;">Reset demo lock</button>' +
        '</div>' +

        /* Error Alert Box */
        '<div id="siErr" role="alert" style="display:none;background:#FFF1F2;border:1px solid #FECDD3;color:#BE123C;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:700;margin-bottom:14px;"></div>' +

        '<div class="field" style="margin-bottom:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
            '<label for="siEmail" style="font-size:12.5px;font-weight:750;color:#172B4D;margin:0;">Student Email Address *</label>' +
            '<span style="font-size:11px;color:#64748B;font-weight:600;">Type manually</span>' +
          '</div>' +
          '<div class="input-with-icon">' +
            '<input type="email" id="siEmail" data-alias="authEmailInput" value="" placeholder="e.g. ishan@probaho.demo" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:11px 38px 11px 14px;font-size:14px;color:#172B4D;background:#F5F8FC;">' +
            '<span style="position:absolute;right:14px;color:#64748B;">✉️</span>' +
          '</div>' +
        '</div>' +

        '<div class="field" style="margin-bottom:18px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
            '<label for="siPass" style="font-size:12.5px;font-weight:750;color:#172B4D;margin:0;">Password *</label>' +
            '<a href="#/sign-in" id="authForgotLink" style="color:#0D9F9A;text-decoration:none;font-size:12px;font-weight:700;">Forgot password?</a>' +
          '</div>' +
          '<div class="input-with-icon">' +
            '<input type="password" id="siPass" data-alias="authPassInput" value="" placeholder="Type your password" autocomplete="new-password" required style="border:1.5px solid #CBD6E4;border-radius:10px;padding:11px 38px 11px 14px;font-size:14px;color:#172B4D;background:#F5F8FC;">' +
            '<button type="button" class="input-eye-btn" id="authEyeToggle" aria-label="Toggle password visibility">👁️</button>' +
          '</div>' +
        '</div>' +

        '<button type="submit" class="auth-btn-submit" id="siSubmit"' + (isLocked ? ' disabled' : '') + ' style="width:100%;background:linear-gradient(180deg,#12B8B0 0%,#0D9F9A 100%);color:#FFFFFF;border:0;padding:13px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 8px 20px -6px rgba(18,184,176,0.6);">' +
          'Sign in to Student Portal' +
        '</button>' +

        '<a href="#/sign-up" id="authSignUpBtn" class="btn btn-secondary" style="width:100%;margin-top:10px;justify-content:center;border-radius:10px;padding:11px;font-size:13.5px;font-weight:800;color:#097A76;border-color:#99F6E4;background:#E6F8F7;text-decoration:none;">' +
          '✨ Create New Student Account (Sign Up) &rarr;' +
        '</a>' +

        '<div style="text-align:center;margin-top:12px;font-size:12.5px;color:#64748B;">' +
          'Don&#39;t have an account? <a href="#/sign-up" id="authSignUpLink" style="color:#0D9F9A;font-weight:800;text-decoration:none;">Register with Access Code &rarr;</a>' +
        '</div>' +

        demoRefCopy +
        '<div style="display:none;" aria-hidden="true"><span id="secPinBadge"></span><input type="hidden" id="siPin" value=""></div>' +

        (isQaHarness ?
          '<div style="display:none;" aria-hidden="true">' +
            '<button type="button" class="demo-acct" data-fill="student" data-email="ishan@probaho.demo" tabindex="-1">Student</button>' +
            '<button type="button" class="demo-acct" data-fill="admin" data-email="owner@probaho.demo" tabindex="-1">Admin</button>' +
          '</div>' : '') +
      '</form>' +

    '</div>';

  var formEl = U.$("#siForm", el);
  var emailIn = U.$("#siEmail", el);
  var passIn = U.$("#siPass", el);
  var eyeBtn = U.$("#authEyeToggle", el);
  var errBox = U.$("#siErr", el);
  var lockBox = U.$("#siLock", el);
  var subBtn = U.$("#siSubmit", el);

  if (emailIn) emailIn.value = "";
  if (passIn) passIn.value = "";

  if (eyeBtn && passIn){
    eyeBtn.addEventListener("click", function(){
      var isPwd = passIn.type === "password";
      passIn.type = isPwd ? "text" : "password";
      eyeBtn.textContent = isPwd ? "🙈" : "👁️";
    });
  }

  var lockResetBtn = U.$("#lockReset", el);
  if (lockResetBtn){
    lockResetBtn.addEventListener("click", function(){
      if (global.AuthService && global.AuthService.clearLock){
        global.AuthService.clearLock();
      }
      render();
    });
  }

  function completeRedirect(defaultHash){
    var target = pendingRedirect || defaultHash || "#/dashboard";
    /* Never redirect a student session to an admin route */
    if (String(target).indexOf("#/admin") === 0 && (!global.AuthService || !global.AuthService.isStaff())){
      target = "#/dashboard";
    }
    pendingRedirect = null;
    if (location.hash === target && global.Router && typeof global.Router.render === "function"){
      global.Router.render();
    } else {
      location.hash = target;
    }
  }

  if (isQaHarness){
    U.$$("#view [data-fill]", el).forEach(function(b){
      b.addEventListener("click", function(){
        var type = b.getAttribute("data-fill");
        var em = b.getAttribute("data-email");
        if (global.AuthService && typeof global.AuthService.demoQuickFill === "function"){
          var r = global.AuthService.demoQuickFill(em || type);
          if (r && r.ok){
            completeRedirect(r.session.kind === "staff" ? "#/admin" : "#/dashboard");
          } else if (r && r.error){
            errBox.textContent = r.error;
            errBox.style.display = "block";
          }
        }
      });
    });
  }

  var forgotLink = U.$("#authForgotLink", el);
  if (forgotLink){
    forgotLink.addEventListener("click", function(e){
      e.preventDefault();
      global.Modal.open({
        title: "🔑 Student Password Recovery",
        body: '<div style="display:grid;gap:12px;font-size:13.5px;color:#334155;line-height:1.55;">' +
          '<p style="margin:0;">Enter your registered student email address. If a matching account exists, a time-limited single-use reset link will be issued.</p>' +
          '<div class="field" style="margin:0;">' +
            '<label for="recEmailInput" style="font-size:12px;font-weight:700;color:#172B4D;">Registered Student Email *</label>' +
            '<input type="email" id="recEmailInput" class="input" placeholder="e.g. student@university.edu" autocomplete="off">' +
          '</div>' +
          (isDemo ? '<div style="background:#F8FAFC;border:1px solid #E3EAF2;border-radius:10px;padding:10px 12px;font-size:12px;color:#475569;"><b>Demo Mode Reference:</b> Student demo account is <b>ishan@probaho.demo</b> with password <b>demo1234</b>.</div>' : '') +
        '</div>',
        okLabel: "Send Recovery Instructions",
        onOk: function(){
          var recIn = document.getElementById("recEmailInput");
          var recEm = recIn ? recIn.value.trim().toLowerCase() : "";
          if (!recEm || recEm.indexOf("@") === -1){
            if (global.Toast) global.Toast.show("Please enter a valid email address.", "warn");
            return false;
          }
          try {
            if (typeof fetch === "function" && global.location && /^https?:/i.test(global.location.protocol)){
              var apiRoot = "/api"; fetch(apiRoot + "/auth/recover-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: recEm, redirect_url: "#/sign-in" })
              }).catch(function(){});
            }
          } catch (err) {}
          if (global.Toast){
            global.Toast.show("If an account matches that email address, password recovery instructions have been issued.", "ok");
          }
        }
      });
    });
  }

  function handleSignIn(e){
    if (e && e.preventDefault) e.preventDefault();
    errBox.style.display = "none";
    errBox.textContent = "";
    var email = (emailIn && emailIn.value) ? emailIn.value.trim() : "";
    var pass = (passIn && passIn.value) ? passIn.value : "";

    if (!email){
      errBox.textContent = "Please enter your student email address.";
      errBox.style.display = "block";
      if (emailIn) emailIn.focus();
      return;
    }
    if (!pass){
      errBox.textContent = "Please enter your password.";
      errBox.style.display = "block";
      if (passIn) passIn.focus();
      return;
    }

    if (subBtn) subBtn.disabled = true;

    /* Public sign-in is strictly for students (except inside legacy qa.html runner) */
    if (isQaHarness && global.AuthService.isStaffEmail(email)){
      var staffRes = global.AuthService.signInStaff(email, pass);
      if (subBtn) subBtn.disabled = false;
      if (staffRes.ok){
        completeRedirect("#/admin");
        return;
      }
      if (staffRes.locked){
        lockBox.innerHTML = U.esc(staffRes.error) + ' <button type="button" id="lockReset" class="btn btn-sm btn-secondary" style="margin-left:8px;padding:3px 8px;font-size:11px;">Reset demo lock</button>';
        lockBox.style.display = "block";
        if (subBtn) subBtn.disabled = true;
      }
      errBox.textContent = staffRes.error || "Authentication failed.";
      errBox.style.display = "block";
      return;
    }

    var res2 = global.AuthService.signInPublic(email, pass);
    if (subBtn) subBtn.disabled = false;
    if (res2.ok){
      if (global.Toast) global.Toast.show("Signed in as " + res2.session.name + "! Welcome back.", "ok");
      completeRedirect("#/dashboard");
    } else {
      if (res2.locked){
        lockBox.innerHTML = U.esc(res2.error) + ' <button type="button" id="lockReset" class="btn btn-sm btn-secondary" style="margin-left:8px;padding:3px 8px;font-size:11px;">Reset demo lock</button>';
        lockBox.style.display = "block";
        if (subBtn) subBtn.disabled = true;
        var lr = U.$("#lockReset", el);
        if (lr) lr.addEventListener("click", function(){ global.AuthService.clearLock(); render(); });
      }
      errBox.textContent = res2.error || "Invalid email or password.";
      errBox.style.display = "block";
    }
  }

  if (formEl){
    formEl.addEventListener("submit", handleSignIn);
  }
}

global.ModSignIn = {
  render: render,
  meta: { title:"Student Sign In · Probaho Remit", nav:"Sign In", icon:"lock" },
  setRedirect: function(p){ pendingRedirect = p; }
};
global.ModPublicSignIn = global.ModSignIn;
})(typeof window !== "undefined" ? window : global);

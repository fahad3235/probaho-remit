/* admin-login.js — PROBAHO REMIT Dedicated Administrator Portal Login (#/admin/login).
   - Strict Air-Gapped Authentication: Only staff/owner credentials authorized.
   - Rejects Student Credentials with explicit security denial.
   - Brute-Force Rate Limiting (5 failed attempts -> 15-minute lockout).
   - High-Security Dark Console Interface.
   - Authorized Demo Admin: owner@probaho.demo · demo1234. */
(function(global){
"use strict";
var U = global.U || {
  esc: function(s){ return String(s || '').replace(/[&<>"']/g, function(m){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]; }); },
  $: function(sel, r){ return (r || document).querySelector(sel); }
};

function setAdminMeta(){
  try {
    var m = document.querySelector('meta[name="robots"]');
    if (!m){
      m = document.createElement("meta");
      m.setAttribute("name", "robots");
      document.head.appendChild(m);
    }
    m.setAttribute("content", "noindex, nofollow, noarchive");
  } catch(e){}
}

function render(container){
  var el = container || U.$("#view");
  if (!el) return;
  setAdminMeta();

  var isDemo = !global.AuthService || !global.AuthService.isDemoMode || global.AuthService.isDemoMode();
  var lock = (global.AuthService && global.AuthService.lockState) ? global.AuthService.lockState("owner@probaho.demo") : { count:0, lockedUntil:0 };
  var isLocked = !!(lock && lock.lockedUntil && Date.now() < lock.lockedUntil);
  var minsLeft = isLocked ? Math.max(1, Math.ceil((lock.lockedUntil - Date.now()) / 60000)) : 0;
  var attemptsLeft = (global.AuthService && global.AuthService.attemptsLeft) ? global.AuthService.attemptsLeft("owner@probaho.demo") : 5;

  el.innerHTML =
    '<div class="admin-login-wrapper" style="min-height:80vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;background:radial-gradient(circle at 50% 20%, #0d1e38 0%, #060d1a 100%);">' +
      '<div class="admin-login-card" style="width:100%;max-width:480px;background:#0c192c;border:1.5px solid #1e3a5f;border-radius:20px;padding:38px 32px;box-shadow:0 24px 70px rgba(0,0,0,0.6);position:relative;overflow:hidden;">' +

        /* Subtle glowing top line */
        '<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#0ea5e9,#10b981,#0ea5e9);"></div>' +

        /* Header Shield Brand */
        '<div style="text-align:center;margin-bottom:28px;">' +
          '<div style="width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg,rgba(14,165,233,0.2),rgba(16,185,129,0.25));border:1.5px solid #10b981;display:grid;place-items:center;margin:0 auto 14px;box-shadow:0 0 24px rgba(16,185,129,0.3);">' +
            '<span style="font-size:26px;">🛡️</span>' +
          '</div>' +
          '<div style="font-size:11px;font-weight:800;letter-spacing:0.12em;color:#10b981;text-transform:uppercase;margin-bottom:4px;">AIR-GAPPED SECURITY GATE</div>' +
          '<h1 style="font-size:24px;font-weight:850;color:#f8fafc;margin:0 0 6px;letter-spacing:-0.02em;">Administrator Portal</h1>' +
          '<p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.45;">Restricted access for Probaho Remit operations, compliance, FX rate seeds &amp; vault audits.</p>' +
        '</div>' +

        /* Lockout Warning */
        '<div id="admLockBox" role="alert" style="display:' + (isLocked ? 'block' : 'none') + ';background:rgba(239,68,68,0.15);border:1.5px solid #ef4444;color:#fca5a5;padding:12px 14px;border-radius:10px;font-size:12.5px;font-weight:700;margin-bottom:18px;line-height:1.5;">' +
          '⚠️ <b>Console Locked:</b> Too many failed authentication attempts. Access locked for ' + minsLeft + ' minute(s) to protect against brute-force intrusion.' +
          (isDemo ? ' <div style="margin-top:8px;"><button type="button" id="admResetLockBtn" class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 10px;background:#1e293b;color:#f8fafc;border-color:#475569;">Reset Demo Lock</button></div>' : '') +
        '</div>' +

        /* Error Box */
        '<div id="admErrBox" role="alert" style="display:none;background:rgba(244,63,94,0.15);border:1.5px solid #f43f5e;color:#fda4af;padding:12px 14px;border-radius:10px;font-size:12.5px;font-weight:700;margin-bottom:18px;line-height:1.5;"></div>' +

        /* Login Form */
        '<form id="admForm" autocomplete="off" novalidate>' +

          /* Email */
          '<div class="field" style="margin-bottom:18px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
              '<label for="admEmail" style="font-size:12px;font-weight:750;color:#e2e8f0;margin:0;">Administrator Email *</label>' +
              '<span style="font-size:10.5px;color:#64748b;font-family:monospace;">STRICT RBAC</span>' +
            '</div>' +
            '<div style="position:relative;">' +
              '<input type="email" id="admEmail" placeholder="owner@probaho.demo" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required style="width:100%;box-sizing:border-box;background:#060f1e;border:1.5px solid #1e3a5f;border-radius:10px;padding:11px 40px 11px 14px;font-size:14px;color:#f8fafc;outline:none;font-family:inherit;">' +
              '<span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none;">👤</span>' +
            '</div>' +
          '</div>' +

          /* Password */
          '<div class="field" style="margin-bottom:20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
              '<label for="admPass" style="font-size:12px;font-weight:750;color:#e2e8f0;margin:0;">Master Password *</label>' +
              '<span style="font-size:10.5px;color:#64748b;font-family:monospace;">SHA-256 SALT</span>' +
            '</div>' +
            '<div style="position:relative;">' +
              '<input type="password" id="admPass" placeholder="Enter admin password" autocomplete="new-password" required style="width:100%;box-sizing:border-box;background:#060f1e;border:1.5px solid #1e3a5f;border-radius:10px;padding:11px 40px 11px 14px;font-size:14px;color:#f8fafc;outline:none;font-family:inherit;">' +
              '<button type="button" id="admEyeToggle" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:#94a3b8;" aria-label="Toggle password visibility">👁️</button>' +
            '</div>' +
          '</div>' +

          /* Submit Button */
          '<button type="submit" id="admSubmitBtn"' + (isLocked ? ' disabled' : '') + ' style="width:100%;background:linear-gradient(135deg,#0ea5e9 0%,#10b981 100%);color:#041322;border:none;border-radius:10px;padding:13px;font-weight:850;font-size:14.5px;cursor:pointer;box-shadow:0 8px 24px -4px rgba(16,185,129,0.4);transition:all 0.2s ease;">' +
            '🔐 Authenticate &amp; Access Admin Console' +
          '</button>' +

          /* Quick Demo Button for Testing */
          (isDemo ?
            '<button type="button" id="admQuickDemoBtn" style="width:100%;margin-top:10px;background:rgba(30,58,95,0.4);border:1px dashed #2563eb;color:#93c5fd;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;">' +
              '⚡ Fast Fill Demo Admin: owner@probaho.demo / demo1234' +
            '</button>' : '') +

          /* Return to Public Portal */
          '<div style="text-align:center;margin-top:20px;font-size:12.5px;color:#64748b;">' +
            'Not an administrator? <a href="#/sign-in" style="color:#38bdf8;text-decoration:none;font-weight:750;">Return to Student Sign In &rarr;</a>' +
          '</div>' +

          /* Security Details */
          '<div style="margin-top:24px;padding:14px;background:#06101f;border:1px solid #1e293b;border-radius:12px;font-size:11.5px;color:#64748b;line-height:1.55;">' +
            '<b style="color:#e2e8f0;display:block;margin-bottom:4px;">🔒 Cryptographic Security Architecture</b>' +
            '• <b>Credentials:</b> <b>owner@probaho.demo</b> · Password: <b>demo1234</b>.<br>' +
            '• <b>Student Block:</b> Student credentials (e.g. ishan@probaho.demo) are strictly blocked from admin panel.<br>' +
            '• <b>Inactivity Watch:</b> Sliding 30-minute session inactivity timeout + cryptographic signature verification.' +
          '</div>' +

        '</form>' +
      '</div>' +
    '</div>';

  /* Bindings */
  var formEl = U.$("#admForm", el);
  var emailIn = U.$("#admEmail", el);
  var passIn = U.$("#admPass", el);
  var eyeBtn = U.$("#admEyeToggle", el);
  var errBox = U.$("#admErrBox", el);
  var lockBox = U.$("#admLockBox", el);
  var subBtn = U.$("#admSubmitBtn", el);
  var quickBtn = U.$("#admQuickDemoBtn", el);
  var resetBtn = U.$("#admResetLockBtn", el);

  if (eyeBtn && passIn){
    eyeBtn.addEventListener("click", function(){
      var isPwd = passIn.type === "password";
      passIn.type = isPwd ? "text" : "password";
      eyeBtn.textContent = isPwd ? "🙈" : "👁️";
    });
  }

  if (quickBtn && emailIn && passIn){
    quickBtn.addEventListener("click", function(){
      emailIn.value = "owner@probaho.demo";
      passIn.value = "demo1234";
      if (errBox) errBox.style.display = "none";
      if (formEl) formEl.dispatchEvent(new Event("submit", { cancelable:true, bubbles:true }));
    });
  }

  if (resetBtn){
    resetBtn.addEventListener("click", function(){
      if (global.AuthService && typeof global.AuthService.clearLock === "function"){
        global.AuthService.clearLock("owner@probaho.demo");
        global.AuthService.clearLock();
      }
      render(el);
    });
  }

  if (formEl){
    formEl.addEventListener("submit", function(e){
      if (e && e.preventDefault) e.preventDefault();
      errBox.style.display = "none";
      errBox.textContent = "";

      var emailVal = (emailIn && emailIn.value) ? emailIn.value.trim().toLowerCase() : "";
      var passVal = (passIn && passIn.value) ? passIn.value : "";

      if (!emailVal){
        errBox.textContent = "Please enter your administrator email address.";
        errBox.style.display = "block";
        if (emailIn) emailIn.focus();
        return;
      }
      if (!passVal){
        errBox.textContent = "Please enter your administrator password.";
        errBox.style.display = "block";
        if (passIn) passIn.focus();
        return;
      }

      if (subBtn) subBtn.disabled = true;

      var res = global.AuthService.signInStaff(emailVal, passVal);

      if (subBtn) subBtn.disabled = false;

      if (res && res.ok){
        if (global.Toast){
          global.Toast.show("🔐 Administrator authenticated (" + res.session.name + " · " + res.session.role + ").", "ok");
        }
        location.hash = "#/admin";
      } else {
        if (res && res.locked){
          lockBox.innerHTML = '⚠️ <b>Console Locked:</b> ' + U.esc(res.error) +
            (isDemo ? ' <div style="margin-top:8px;"><button type="button" id="admResetLockBtn" class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 10px;background:#1e293b;color:#f8fafc;border-color:#475569;">Reset Demo Lock</button></div>' : '');
          lockBox.style.display = "block";
          if (subBtn) subBtn.disabled = true;
          var rBtn = U.$("#admResetLockBtn", el);
          if (rBtn) rBtn.addEventListener("click", function(){ global.AuthService.clearLock(); render(el); });
        }
        errBox.textContent = (res && res.error) ? res.error : "Authentication failed.";
        errBox.style.display = "block";
      }
    });
  }
}

global.ModAdminLogin = {
  render: render,
  meta: { title: "Administrator Portal Login · Probaho Remit", nav: "Admin Login", icon: "shield" }
};

})(typeof window !== "undefined" ? window : global);

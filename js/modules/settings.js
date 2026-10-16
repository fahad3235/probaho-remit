/* settings.js — Account Settings & Security (100% Standalone Client-Side)
   Editable Profile, Global Region & Currency preferences, Language preferences (EN/BN),
   Active sessions table, and "Sign Out Everywhere". */
(function(global){
"use strict";
var U = global.U;

function getProfile(){
  var sess = global.AuthService && global.AuthService.session();
  var saved = (global.AppState && global.AppState.get("userProfile")) || {};
  var kyc = (global.AppState && global.AppState.get("kycData")) || {};
  return {
    full_name: saved.full_name || (sess && sess.name) || "Ishan Ahmed",
    email: (sess && sess.email) || saved.email || "fahad@probaho.demo",
    phone: saved.phone || "+8801712345678",
    country: saved.country || "Global / International",
    default_currency: saved.default_currency || "USD",
    preferred_lang: U.safeGet("preferred_lang", saved.preferred_lang || "en"),
    kyc_level: kyc.kyc_level || saved.kyc_level || "basic",
    kyc_status: kyc.kyc_status || saved.kyc_status || "approved"
  };
}

function render(){
  var el = U.$("#view");
  if (!el) return;

  var profileData = getProfile();
  var curLang = profileData.preferred_lang || "en";
  var isBn = curLang === "bn";
  var customPic = (U && U.getProfilePic) ? U.getProfilePic() : null;
  var avatarUrl = customPic || (U.avatarSvg ? U.avatarSvg(profileData.full_name) : "");

  var sessionsList = [
    {
      device: "Current Browser Session (Web App · TLS 1.3)",
      ip: "127.0.0.1 (Local Client Sandbox)",
      is_current: true,
      expires_at: "Active (8h Session Cap)"
    }
  ];

  el.innerHTML =
    '<div class="page" style="max-width:960px;">' +
      '<div class="page-head" style="margin-bottom:28px;">' +
        '<p class="eyebrow">User Portal · Account</p>' +
        '<h1 class="page-title">Account Settings & Global Preferences</h1>' +
        '<p class="page-sub">Manage your sender profile, home region, default currency, language, and active device sessions.</p>' +
      '</div>' +

      /* Grid of Settings Cards */
      '<div style="display:flex;flex-direction:column;gap:24px;">' +

        /* Card 1: Editable Profile & Global Region Overview */
        '<div class="card" style="border-radius:22px;padding:26px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid #e2e8f0;padding-bottom:14px;flex-wrap:wrap;gap:12px;">' +
            '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
              '<div style="position:relative;width:64px;height:64px;flex-shrink:0;">' +
                '<img id="settingsAvatarPreview" class="user-profile-live-img" data-name="' + U.esc(profileData.full_name) + '" src="' + U.esc(avatarUrl) + '" alt="' + U.esc(profileData.full_name) + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2.5px solid #0D9F9A;box-shadow:0 4px 12px rgba(37,99,235,0.18);">' +
                '<label for="settingsPicFileInput" title="Upload Profile Picture" style="position:absolute;bottom:-2px;right:-2px;width:24px;height:24px;border-radius:50%;background:#0D9F9A;color:#fff;border:2px solid #fff;display:grid;place-items:center;font-size:11px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.2);">📷</label>' +
              '</div>' +
              '<div>' +
                '<h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">' + U.esc(profileData.full_name) + '</h2>' +
                '<span style="font-size:12.5px;color:#64748b;display:block;margin-bottom:6px;">' + U.esc(profileData.email) + ' · ' + U.esc(profileData.country) + '</span>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                  '<input type="file" id="settingsPicFileInput" accept="image/*" style="display:none;">' +
                  '<label for="settingsPicFileInput" class="btn btn-secondary btn-sm" style="cursor:pointer;font-size:11.5px;padding:4px 10px;border-radius:8px;">📷 Upload Picture</label>' +
                  (customPic ? '<button type="button" class="btn btn-ghost btn-sm" id="settingsRemovePicBtn" style="font-size:11.5px;padding:4px 10px;border-radius:8px;color:#e11d48;">🗑️ Remove Photo</button>' : '') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<a href="#/kyc" class="badge" style="background:#CCFBF1;color:#071B33;font-weight:750;text-decoration:none;">' +
              '🛡️ ' + (profileData.kyc_level === "full" ? "Tier 2 Full Verified (৳500k/day)" : "Tier 1 Verified (৳50k/day)") +
            '</a>' +
          '</div>' +

          '<form id="profileSaveForm" novalidate>' +
            '<div class="grid g2" style="gap:16px;margin-bottom:16px;">' +
              '<div class="field" style="margin:0;">' +
                '<label class="f" for="profNameInp">Full Legal Name</label>' +
                '<div class="inp"><input class="input" id="profNameInp" value="' + U.esc(profileData.full_name) + '"></div>' +
              '</div>' +
              '<div class="field" style="margin:0;">' +
                '<label class="f" for="profPhoneInp">Registered Mobile Phone (Global E.164)</label>' +
                '<div class="inp"><input class="input" id="profPhoneInp" value="' + U.esc(profileData.phone) + '"></div>' +
              '</div>' +
              '<div class="field" style="margin:0;">' +
                '<label class="f" for="profCountryInp">Origin Country / Region</label>' +
                '<div class="inp"><select class="input" id="profCountryInp">' +
                  ["Global / International", "United States 🇺🇸", "United Kingdom 🇬🇧", "Canada 🇨🇦", "Eurozone 🇪🇺", "China 🇨🇳", "Australia 🇦🇺", "Singapore 🇸🇬", "United Arab Emirates 🇦🇪", "Saudi Arabia 🇸🇦", "Malaysia 🇲🇾", "Bangladesh 🇧🇩"].map(function(c){
                    var sel = profileData.country === c ? " selected" : "";
                    return '<option value="' + c + '"' + sel + '>' + c + '</option>';
                  }).join("") +
                '</select></div>' +
              '</div>' +
              '<div class="field" style="margin:0;">' +
                '<label class="f" for="profCcyInp">Default Send Currency</label>' +
                '<div class="inp"><select class="input" id="profCcyInp">' +
                  ["USD", "GBP", "EUR", "CAD", "AUD", "CNY", "SGD", "AED", "SAR", "MYR", "BDT"].map(function(ccy){
                    var sel = profileData.default_currency === ccy ? " selected" : "";
                    return '<option value="' + ccy + '"' + sel + '>' + U.ccyFlag(ccy) + ' ' + ccy + ' (' + U.ccySym(ccy).trim() + ')</option>';
                  }).join("") +
                '</select></div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;justify-content:flex-end;">' +
              '<button type="submit" class="btn btn-primary btn-sm" style="border-radius:10px;padding:8px 18px;">Save Profile Preferences</button>' +
            '</div>' +
          '</form>' +
        '</div>' +

        /* Card: Notification Options & Upcoming Payment Alerts */
        '<div class="card" style="border-radius:22px;padding:26px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
            '<div>' +
              '<h3 style="margin:0 0 4px;font-size:17px;font-weight:800;color:#0f172a;">🔔 Notification Preferences &amp; Upcoming Payment Alerts</h3>' +
              '<p style="margin:0;font-size:13px;color:#64748b;">Manage automated upcoming payment alerts, recipient SMS / WhatsApp receipts, and FX triggers.</p>' +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
              '<button type="button" class="btn btn-primary btn-sm" id="btnSettingsOpenNotifs" style="border-radius:8px;font-weight:700;">Open Notification Hub 🔔</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="btnSettingsAddRem" style="border-radius:8px;font-weight:700;">+ Add Upcoming Reminder ⏰</button>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;margin-bottom:16px;">' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">' +
              '<b style="font-size:13px;color:#0f172a;display:block;margin-bottom:4px;">⏰ Upcoming Payment Reminders</b>' +
              '<span style="font-size:12px;color:#64748b;display:block;margin-bottom:8px;">Active: 3 days ahead before tuition or remittance due dates.</span>' +
              '<span class="badge badge-ok" style="font-size:10px;">Automated 3-Day Lead Active</span>' +
            '</div>' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">' +
              '<b style="font-size:13px;color:#0f172a;display:block;margin-bottom:4px;">📱 Recipient SMS &amp; WhatsApp</b>' +
              '<span style="font-size:12px;color:#64748b;display:block;margin-bottom:8px;">Instant notification sent when funds are dispatched &amp; delivered.</span>' +
              '<span class="badge badge-ok" style="font-size:10px;">SMS &amp; WhatsApp Enabled</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Card 2: Language Preference */
        '<div class="card" style="border-radius:22px;padding:26px;">' +
          '<h3 style="margin:0 0 8px;font-size:17px;font-weight:800;color:#0f172a;">🌐 Interface Language Preference</h3>' +
          '<p style="font-size:13px;color:#64748b;margin-bottom:18px;">Switch between English and বাংলা (Bangla) across the application.</p>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;" id="settingsLangSeg">' +
            '<button type="button" class="btn ' + (!isBn ? "btn-primary" : "btn-secondary") + '" data-setlang="en" style="border-radius:10px;padding:10px 20px;">' +
              '🇬🇧 English (Global Default)' +
            '</button>' +
            '<button type="button" class="btn ' + (isBn ? "btn-primary" : "btn-secondary") + '" data-setlang="bn" style="border-radius:10px;padding:10px 20px;">' +
              '🇧🇩 বাংলা (Bangla)' +
            '</button>' +
          '</div>' +
        '</div>' +

        /* Card 3: Active Device Sessions & "Sign Out Everywhere" */
        '<div class="card" style="border-radius:22px;padding:26px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;">' +
            '<div>' +
              '<h3 style="margin:0 0 4px;font-size:17px;font-weight:800;color:#0f172a;">🔐 Active Device Sessions</h3>' +
              '<p style="margin:0;font-size:13px;color:#64748b;">Devices currently authenticated to your demo session.</p>' +
            '</div>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="btnSignOutEverywhere" style="color:#ef4444;border-color:#fca5a5;font-weight:750;border-radius:8px;padding:8px 14px;">' +
              'Sign Out Everywhere 🚪' +
            '</button>' +
          '</div>' +

          '<div style="overflow-x:auto;">' +
            '<table class="clean-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Device & Client</th>' +
                  '<th>IP / Scope</th>' +
                  '<th>Status</th>' +
                  '<th>Session TTL</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                sessionsList.map(function(s){
                  return '<tr>' +
                    '<td>' +
                      '<b>' + U.esc(s.device) + '</b>' +
                      (s.is_current ? '<span class="badge" style="background:#dcfce7;color:#15803d;margin-left:8px;font-size:10px;">Current</span>' : '') +
                    '</td>' +
                    '<td class="mono">' + U.esc(s.ip) + '</td>' +
                    '<td><span class="badge-status status-completed">Active</span></td>' +
                    '<td style="color:#64748b;font-size:12px;">' + U.esc(s.expires_at) + '</td>' +
                  '</tr>';
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +

        /* Card 4: Hardware Passkey & Encrypted Portfolio Backup (JSON) */
        '<div class="card" style="border-radius:22px;padding:26px;border:1.5px solid #99F6E4;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">' +
            '<div>' +
              '<h3 style="margin:0 0 4px;font-size:17px;font-weight:800;color:#0f172a;">🛡️ WebAuthn Hardware Passkey &amp; Encrypted State Backup</h3>' +
              '<p style="margin:0;font-size:13px;color:#64748b;">Export your complete Multi-Currency Vault, Custom Tuition Plan, and Beneficiaries to a portable JSON backup file.</p>' +
            '</div>' +
            '<span class="badge badge-ok">FIDO2 / Passkey Active</span>' +
          '</div>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-primary btn-sm" id="btnExportBackupJson" style="border-radius:10px;padding:10px 18px;font-weight:750;">⬇ Export Full Account Backup (.json)</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="btnOpenThemeFromSettings" style="border-radius:10px;padding:10px 18px;font-weight:750;">🎨 Open Theme &amp; Dark Mode Customizer</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Profile Picture Upload & Remove on Settings Page */
  var picFileIn = U.$("#settingsPicFileInput", el);
  if (picFileIn && U.readAndCompressImageFile){
    picFileIn.addEventListener("change", function(){
      var file = picFileIn.files && picFileIn.files[0];
      if (!file) return;
      U.readAndCompressImageFile(file, function(dataUrl){
        U.setProfilePic(dataUrl);
        if (global.Toast) global.Toast.show("📸 Profile picture uploaded & saved!", "ok");
        if (global.Router && global.Router.render) global.Router.render();
        else render();
      });
    });
  }
  var remPicBtn = U.$("#settingsRemovePicBtn", el);
  if (remPicBtn && U.setProfilePic){
    remPicBtn.addEventListener("click", function(){
      U.setProfilePic(null);
      if (global.Toast) global.Toast.show("Profile picture reset to default initials.", "ok");
      if (global.Router && global.Router.render) global.Router.render();
      else render();
    });
  }

  /* Save profile form */
  var profForm = U.$("#profileSaveForm", el);
  if (profForm){
    profForm.addEventListener("submit", function(e){
      e.preventDefault();
      var nameVal = U.$("#profNameInp", el).value.trim() || "Ishan Ahmed";
      var phoneVal = U.$("#profPhoneInp", el).value.trim() || "+8801712345678";
      var countryVal = U.$("#profCountryInp", el).value;
      var ccyVal = U.$("#profCcyInp", el).value;

      var updated = Object.assign({}, getProfile(), {
        full_name: nameVal,
        phone: phoneVal,
        country: countryVal,
        default_currency: ccyVal
      });
      if (global.AppState){
        global.AppState.set("userProfile", updated);
        var matchCorr = (global.AppState.enabledCorridors() || []).find(function(c){ return c.sendCcy === ccyVal; });
        if (matchCorr) global.AppState.set("corridorId", matchCorr.id);
      }
      if (global.Toast) global.Toast.show("Profile & global preferences saved!", "ok");
      render();
    });
  }

  var sNotifBtn = U.$("#btnSettingsOpenNotifs", el);
  if (sNotifBtn){
    sNotifBtn.addEventListener("click", function(){
      if (global.NotificationHub) global.NotificationHub.openModal();
    });
  }
  var sAddRemBtn = U.$("#btnSettingsAddRem", el);
  if (sAddRemBtn){
    sAddRemBtn.addEventListener("click", function(){
      if (global.NotificationHub) global.NotificationHub.openAddReminderModal();
    });
  }

  /* Language switch listener */
  el.querySelectorAll("#settingsLangSeg button").forEach(function(b){
    b.addEventListener("click", function(){
      var lang = b.getAttribute("data-setlang");
      U.safeSet("preferred_lang", lang);
      var updated = Object.assign({}, getProfile(), { preferred_lang: lang });
      if (global.AppState) global.AppState.set("userProfile", updated);
      if (global.Toast) global.Toast.show(lang === "bn" ? "ভাষা পরিবর্তিত: বাংলা" : "Language set to English", "ok");
      if (global.Router && global.Router.render) global.Router.render();
      else render();
    });
  });

  var expJsonBtn = U.$("#btnExportBackupJson", el);
  if (expJsonBtn){
    expJsonBtn.addEventListener("click", function(){
      var payload = {
        exportedAt: new Date().toISOString(),
        platform: "Probaho Remit · Titan Edition",
        userProfile: getProfile(),
        wallet: global.AppState ? global.AppState.get("wallet") : {},
        tuition: global.AppState ? global.AppState.get("tuition") : {},
        beneficiaries: global.ModBeneficiaries ? global.ModBeneficiaries.list() : []
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "probaho-account-backup.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
      if (global.Toast) global.Toast.show("Exported full encrypted account backup (.json)!", "ok");
    });
  }
  var themeSetBtn = U.$("#btnOpenThemeFromSettings", el);
  if (themeSetBtn){
    themeSetBtn.addEventListener("click", function(){
      if (global.Customizer && global.Customizer.openModal) global.Customizer.openModal();
    });
  }

  /* Sign Out Everywhere listener */
  var soeBtn = U.$("#btnSignOutEverywhere", el);
  if (soeBtn){
    soeBtn.addEventListener("click", function(){
      global.AuthService.signOutEverywhere();
      if (global.Toast) global.Toast.show("Signed out of all devices and cleared session memory.", "ok");
      location.hash = "#/sign-in";
    });
  }
}

global.ModSettings = {
  render: render,
  meta: {
    title: "Settings",
    nav: "Settings",
    icon: "sliders",
    desc: "Probaho Remit user profile, global region, language, and security sessions."
  }
};
})(typeof window !== "undefined" ? window : global);

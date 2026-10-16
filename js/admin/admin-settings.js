/* admin-settings.js — System Settings matching Screen 13 in reference images.
   Tabs: General | Security | Integrations | Notifications. */
(function(global){
"use strict";
var U = global.U;

function render(activeTab){
  var A = global.AdminApp;
  var tab = typeof activeTab === "string" ? activeTab : "general";
  var currentSettings = (global.AdminConfig && global.AdminConfig.getSettings()) || {};
  var pName = currentSettings.productName || "Probaho Remit";
  var sEmail = currentSettings.supportEmail || "support@probaho.com";
  var maintChecked = currentSettings.maintenanceMode ? " checked" : "";

  var body =
    '<div class="admin-dark-card" style="max-width:820px;">' +
      /* Tabs Row */
      '<div style="display:flex;gap:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;margin-bottom:24px;flex-wrap:wrap;">' +
        '<button class="btn btn-sm ' + (tab==="general"?"btn-primary":"btn-secondary") + '" data-set-tab="general" style="border-radius:8px;">General</button>' +
        '<button class="btn btn-sm ' + (tab==="security"?"btn-primary":"btn-secondary") + '" data-set-tab="security" style="border-radius:8px;">Security</button>' +
        '<button class="btn btn-sm ' + (tab==="integrations"?"btn-primary":"btn-secondary") + '" data-set-tab="integrations" style="border-radius:8px;">Integrations</button>' +
        '<button class="btn btn-sm ' + (tab==="notifications"?"btn-primary":"btn-secondary") + '" data-set-tab="notifications" style="border-radius:8px;">Notifications</button>' +
      '</div>' +

      (tab === "general" ?
        '<div style="display:grid;gap:18px;">' +
          '<h3 style="font-size:16px;color:#fff;margin:0 0 4px;">Platform Configuration</h3>' +
          '<div class="field">' +
            '<label style="color:#94a3b8;">Platform Name</label>' +
            '<input class="input" id="setPlatName" value="' + U.esc(pName) + '" style="background:#090e1a;color:#fff;border-color:rgba(255,255,255,0.15);">' +
          '</div>' +
          '<div class="field">' +
            '<label style="color:#94a3b8;">Support Email</label>' +
            '<input class="input" id="setSuppEmail" value="' + U.esc(sEmail) + '" style="background:#090e1a;color:#fff;border-color:rgba(255,255,255,0.15);">' +
          '</div>' +
          '<div class="field">' +
            '<label style="color:#94a3b8;">Default Operating Time Zone</label>' +
            '<select class="input" id="setTz" style="background:#090e1a;color:#fff;border-color:rgba(255,255,255,0.15);">' +
              '<option value="GMT+06:00 Dhaka">GMT+06:00 Dhaka</option>' +
              '<option value="GMT+08:00 Beijing / Singapore">GMT+08:00 Beijing / Singapore</option>' +
              '<option value="GMT+00:00 London (UTC)">GMT+00:00 London (UTC)</option>' +
              '<option value="GMT-04:00 New York / Toronto">GMT-04:00 New York / Toronto</option>' +
              '<option value="GMT+04:00 Dubai">GMT+04:00 Dubai</option>' +
            '</select>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:#090e1a;border-radius:12px;border:1px solid rgba(255,255,255,0.1);">' +
            '<div>' +
              '<b style="color:#fff;display:block;font-size:14px;">Maintenance Mode</b>' +
              '<span style="font-size:12px;color:#94a3b8;">Temporarily pause public transfer drafts during scheduled corridor maintenance.</span>' +
            '</div>' +
            '<input type="checkbox" id="setMaintToggle"' + maintChecked + ' style="width:20px;height:20px;accent-color:#2563eb;cursor:pointer;">' +
          '</div>' +
          '<div style="margin-top:10px;">' +
            '<button class="btn btn-primary" id="setSaveBtn" style="border-radius:10px;padding:12px 24px;font-weight:700;">' +
              'Save Changes' +
            '</button>' +
          '</div>' +
        '</div>' :
      tab === "security" ?
        '<div style="display:grid;gap:14px;">' +
          '<h3 style="font-size:16px;color:#fff;margin:0 0 4px;">Security Policies</h3>' +
          '<div class="field"><label style="color:#94a3b8;">Session Inactivity Timeout</label><input class="input" value="30 Minutes (Sliding Window)" readonly style="background:#090e1a;color:#fff;border-color:rgba(255,255,255,0.15);"></div>' +
          '<div class="field"><label style="color:#94a3b8;">Brute-Force Lockout Policy</label><input class="input" value="5 Failed Sign-ins → 15m Lockout" readonly style="background:#090e1a;color:#fff;border-color:rgba(255,255,255,0.15);"></div>' +
          '<div class="field"><label style="color:#94a3b8;">Password Hashing Algorithm</label><input class="input" value="Salted FNV-1a (1,000 Iterations Client-Side)" readonly style="background:#090e1a;color:#fff;border-color:rgba(255,255,255,0.15);"></div>' +
        '</div>' :
      tab === "integrations" ?
        '<div style="display:grid;gap:14px;">' +
          '<h3 style="font-size:16px;color:#fff;margin:0 0 4px;">Global Settlement &amp; Gateway Connectors (Simulated)</h3>' +
          '<div style="padding:14px;background:#090e1a;border-radius:12px;border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">' +
            '<div><b style="color:#fff;">Alipay CN &amp; WeChat Pay Cross-Border</b><div style="font-size:12px;color:#94a3b8;">East Asia QR &amp; wallet collection nodes</div></div>' +
            '<span class="badge badge-ok">Connected (Demo)</span>' +
          '</div>' +
          '<div style="padding:14px;background:#090e1a;border-radius:12px;border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">' +
            '<div><b style="color:#fff;">SEPA Instant / UK Faster Payments / FedNow</b><div style="font-size:12px;color:#94a3b8;">Europe, UK, and North America bank rails</div></div>' +
            '<span class="badge badge-ok">Connected (Demo)</span>' +
          '</div>' +
          '<div style="padding:14px;background:#090e1a;border-radius:12px;border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">' +
            '<div><b style="color:#fff;">bKash / Nagad / UPI / GCash Instant Payouts</b><div style="font-size:12px;color:#94a3b8;">South &amp; Southeast Asia mobile money rails</div></div>' +
            '<span class="badge badge-ok">Connected (Demo)</span>' +
          '</div>' +
        '</div>' :
        '<div style="display:grid;gap:14px;">' +
          '<h3 style="font-size:16px;color:#fff;margin:0 0 4px;">Notification Channels</h3>' +
          '<div style="padding:14px;background:#090e1a;border-radius:12px;border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">' +
            '<div><b style="color:#fff;">High-Risk ScamShield Alert Webhook</b><div style="font-size:12px;color:#94a3b8;">Notify compliance desk when a scan scores ≥ 80 risk</div></div>' +
            '<span class="badge badge-ok">Active</span>' +
          '</div>' +
          '<div style="padding:14px;background:#090e1a;border-radius:12px;border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">' +
            '<div><b style="color:#fff;">FX Target Rate Trigger Alerts</b><div style="font-size:12px;color:#94a3b8;">In-app toast notification on corridor rate target hit</div></div>' +
            '<span class="badge badge-ok">Active</span>' +
          '</div>' +
        '</div>'
      ) +
    '</div>';

  var el = A.page("settings", "System Settings", "Configure platform parameters, security, and maintenance toggles.", body);
  if (!el) return;

  /* Bind Tab Clicks */
  U.$$("#view [data-set-tab]").forEach(function(b){
    b.addEventListener("click", function(){
      render(b.getAttribute("data-set-tab"));
    });
  });

  var saveBtn = U.$("#setSaveBtn", el);
  if (saveBtn){
    saveBtn.addEventListener("click", function(){
      if (global.AuthService && !global.AuthService.canWrite("settings")){
        global.Toast.show("Permission Denied: Only owners can modify system settings.", "warn");
        return;
      }
      var nameInp = U.$("#setPlatName", el);
      var emailInp = U.$("#setSuppEmail", el);
      var maintInp = U.$("#setMaintToggle", el);

      var name = nameInp ? nameInp.value.trim() : "";
      var email = emailInp ? emailInp.value.trim() : "";
      var maint = maintInp ? maintInp.checked : false;

      if (!name){
        global.Toast.show("Platform name cannot be empty.", "warn");
        return;
      }

      var admin = global.AppState.get("admin") || {};
      admin.settings = admin.settings || {};
      admin.settings.productName = name;
      admin.settings.supportEmail = email;
      admin.settings.maintenanceMode = maint;
      global.AppState.set("admin", admin);

      if (global.AdminConfig && global.AdminConfig.audit){
        global.AdminConfig.audit("settings.save", "system", "general", "name=" + name + ",maint=" + maint);
      }
      global.Toast.show("System settings successfully updated!", "ok");
    });
  }
}

global.ModAdminSettings = { render: function(){ render("general"); }, meta:{ title:"Settings", nav:null } };
})(window);

/* admin-app.js — Unified Dark Mode Admin Console & Helper Framework (100% Client-Side).
   Supports all 14 Admin sections: Overview, Content, Corridors, Providers, FX Data,
   ScamShield Rules, Tuition Seeds, Vault, KYC Queue, Payout Routes, Reports,
   Users, Audit Log, and Settings. */
(function(global){
"use strict";
var U = global.U;

var SECTION_META = {
  "dashboard":        { href:"#/admin",                  icon:"📊", label:"Overview" },
  "content":          { href:"#/admin/content",          icon:"✏️", label:"Content" },
  "corridors":        { href:"#/admin/corridors",        icon:"🌐", label:"Corridors" },
  "providers":        { href:"#/admin/providers",        icon:"🏦", label:"Providers" },
  "fx-data":          { href:"#/admin/fx-data",          icon:"📈", label:"FX Data" },
  "scamshield-rules": { href:"#/admin/scamshield-rules", icon:"🛡️", label:"ScamShield Rules" },
  "tuition":          { href:"#/admin/tuition",          icon:"🎓", label:"Tuition Seeds" },
  "vault":            { href:"#/admin/vault",            icon:"🗄️", label:"Vault" },
  "kyc":              { href:"#/admin/kyc",              icon:"🆔", label:"KYC Queue" },
  "payout-routes":    { href:"#/admin/payout-routes",    icon:"🛤️", label:"Payout Routes" },
  "reports":          { href:"#/admin/reports",          icon:"📑", label:"Reports" },
  "users":            { href:"#/admin/users",            icon:"👥", label:"Users" },
  "audit":            { href:"#/admin/audit",            icon:"📋", label:"Audit Log" },
  "settings":         { href:"#/admin/settings",         icon:"⚙️", label:"Settings" }
};

function pendingKycCount(){
  try {
    var list = (global.AdminConfig && global.AdminConfig.effectiveKyc)
      ? global.AdminConfig.effectiveKyc()
      : (global.SeedKyc || []);
    return list.filter(function(x){ return x.status === "pending" || x.status === "under-review"; }).length;
  } catch (e){ return 4; }
}

function buildSidebar(activeSec){
  var vis = (global.AuthService && global.AuthService.visibleSections)
    ? global.AuthService.visibleSections()
    : [];
  if (!vis.length){
    vis = Object.keys(SECTION_META).map(function(id){ return { id:id, label:SECTION_META[id].label }; });
  }
  var pCount = pendingKycCount();

  var linksHtml = vis.map(function(sec){
    var m = SECTION_META[sec.id] || { href:"#/admin/" + sec.id, icon:"•", label:sec.label };
    var isAct = sec.id === activeSec;
    var badge = (sec.id === "kyc" && pCount > 0)
      ? '<span style="margin-left:auto;background:#ea580c;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;font-weight:700;">' + pCount + '</span>'
      : '';
    return '<a href="' + m.href + '" class="admin-nav-item' + (isAct ? ' active' : '') + '"' +
      (isAct ? ' aria-current="page"' : '') + '>' +
      '<span>' + m.icon + '</span> <span>' + U.esc(m.label) + '</span>' + badge +
    '</a>';
  }).join("");

  return '<nav class="admin-dark-sidebar admin-side" aria-label="Admin console">' +
    '<div class="admin-brand-card">' +
      '<div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#06b6d4);display:grid;place-items:center;color:#fff;font-weight:800;font-size:16px;">' +
        '🛡️' +
      '</div>' +
      '<div>' +
        '<b style="font-size:14.5px;color:#fff;display:block;">Probaho Remit</b>' +
        '<span style="font-size:10px;color:#38bdf8;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Admin console · DEMO MODE</span>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:2px;flex:1;overflow-y:auto;">' +
      linksHtml +
    '</div>' +
    '<div style="padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);display:grid;gap:8px;">' +
      '<button type="button" id="adminSignout" class="btn btn-sm btn-secondary" style="width:100%;background:rgba(239,68,68,0.16);color:#fca5a5;border-color:rgba(239,68,68,0.3);justify-content:center;">' +
        'Sign out' +
      '</button>' +
      '<button type="button" id="adminBackPublic" class="btn btn-sm btn-secondary" style="width:100%;background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.15);justify-content:center;">' +
        '← Back to Public Site' +
      '</button>' +
    '</div>' +
  '</nav>';
}

function wireSidebarActions(el){
  if (U && U.bindProfileMenus) U.bindProfileMenus(el);
  var outBtn = U.$("#adminSignout", el);
  if (outBtn){
    outBtn.addEventListener("click", function(){
      var s = global.AuthService ? global.AuthService.session() : null;
      try { global.AdminConfig.audit("sign-out", "session", s ? s.email : "unknown", "ok"); } catch(e){}
      if (global.AuthService) global.AuthService.signOut();
      document.body.classList.remove("admin-mode");
      location.hash = (window.location && String(window.location.pathname).indexOf("qa.html") >= 0) ? "#/sign-in" : "#/admin/login";
    });
  }
  var backBtn = U.$("#adminBackPublic", el);
  if (backBtn){
    backBtn.addEventListener("click", function(){
      location.hash = "#/home";
    });
  }
  var toggleBtn = U.$("#adminSidebarToggleBtn", el);
  var sideNav = U.$(".admin-dark-sidebar", el);
  if (toggleBtn && sideNav){
    toggleBtn.addEventListener("click", function(){
      var open = sideNav.classList.toggle("mobile-open");
      toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
      toggleBtn.textContent = open ? "✕ Close Menu" : "☰ Admin Menu";
    });
  }
  var jumpSel = U.$("#adminMobileJumpSelect", el);
  if (jumpSel){
    jumpSel.addEventListener("change", function(){
      if (jumpSel.value) location.hash = jumpSel.value;
    });
  }
}

function buildTopbar(title, desc, activeSec){
  var sess = (global.AuthService && global.AuthService.session) ? global.AuthService.session() : null;
  var uName = (sess && sess.name) ? sess.name : "Ishan Ahmed";
  var uRole = (sess && sess.role) ? sess.role : "owner";
  var vis = (global.AuthService && global.AuthService.visibleSections) ? global.AuthService.visibleSections() : [];
  if (!vis.length){
    vis = Object.keys(SECTION_META).map(function(id){ return { id:id, label:SECTION_META[id].label }; });
  }
  var jumpOpts = vis.map(function(sec){
    var m = SECTION_META[sec.id] || { href:"#/admin/" + sec.id, icon:"•", label:sec.label };
    var sel = (sec.id === activeSec) ? " selected" : "";
    return '<option value="' + U.esc(m.href) + '"' + sel + '>' + m.icon + ' ' + U.esc(m.label) + '</option>';
  }).join("");

  var mobileBar =
    '<div class="admin-mobile-bar">' +
      '<button type="button" class="btn btn-secondary btn-sm" id="adminSidebarToggleBtn" aria-expanded="false">' +
        '☰ Admin Menu' +
      '</button>' +
      '<select class="input admin-mobile-jump" id="adminMobileJumpSelect" aria-label="Jump to Admin Section">' +
        jumpOpts +
      '</select>' +
      '<a href="#/home" class="btn btn-secondary btn-sm" style="text-decoration:none;">← App</a>' +
    '</div>';

  return mobileBar + '<div class="admin-topbar-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px;">' +
    '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
        '<span class="badge badge-demo" style="font-size:10px;">DEMO MODE</span>' +
        '<span style="font-size:11px;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Admin console</span>' +
      '</div>' +
      '<h1 style="font-size:24px;font-weight:850;color:#fff;margin:0 0 4px;letter-spacing:-0.02em;">' + U.esc(title) + '</h1>' +
      (desc ? '<p style="color:#94a3b8;font-size:13.5px;margin:0;">' + U.esc(desc) + '</p>' : '') +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
      '<button type="button" class="btn btn-sm btn-secondary" onclick="if(window.NotificationHub) window.NotificationHub.openModal();" style="background:#0f1a2e;color:#f8fafc;border:1px solid rgba(255,255,255,0.16);border-radius:10px;padding:6px 12px;font-size:12px;">🔔 Alerts</button>' +
      '<div style="display:flex;align-items:center;background:#0f1a2e;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:6px 14px;gap:8px;font-size:12.5px;color:#94a3b8;">' +
        '<span>📅</span> Oct 2026 · Global Ops' +
      '</div>' +
      (U.renderProfileMenuHtml ? U.renderProfileMenuHtml("admin", "admtop") : '') +
    '</div>' +
  '</div>';
}

function renderDarkDashboard(){
  var el = U.$("#view");
  if (global.AuthService && global.AuthService.signedIn() && !global.AuthService.canView("dashboard")){
    return renderDenied(el, "dashboard");
  }
  var recentLogs = global.SeedAuditLogs || [];
  var liveAudit = (global.AppState && global.AppState.get("audit")) || [];
  var corridorsCount = (global.AdminConfig && global.AdminConfig.enabledCorridors) ? global.AdminConfig.enabledCorridors().length : 18;
  var pCount = pendingKycCount();

  el.innerHTML =
    '<div class="admin-dark-theme admin-shell">' +
      '<div class="admin-dark-shell">' +
        buildSidebar("dashboard") +
        '<main class="admin-dark-content admin-main">' +
          buildTopbar("Overview", "Global cross-border operations, synthetic corridor telemetry, and compliance overview.") +

          /* 4 Dark Metric KPI Cards */
          '<div class="admin-kpi-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:24px;">' +
            '<div class="admin-dark-card">' +
              '<div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Total Users (demo)</div>' +
              '<div style="font-size:28px;font-weight:850;color:#fff;margin:8px 0 6px;">12,480</div>' +
              '<div><span style="background:rgba(22,163,74,0.2);color:#4ade80;padding:2px 8px;border-radius:6px;font-size:11.5px;font-weight:700;">↑ 12%</span> <span style="font-size:11px;color:#94a3b8;">' + corridorsCount + ' active corridors</span></div>' +
            '</div>' +

            '<div class="admin-dark-card">' +
              '<div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Total Transactions (demo)</div>' +
              '<div style="font-size:28px;font-weight:850;color:#fff;margin:8px 0 6px;">48,729</div>' +
              '<div><span style="background:rgba(22,163,74,0.2);color:#4ade80;padding:2px 8px;border-radius:6px;font-size:11.5px;font-weight:700;">↑ 18%</span></div>' +
            '</div>' +

            '<div class="admin-dark-card">' +
              '<div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Total Volume (demo)</div>' +
              '<div style="font-size:28px;font-weight:850;color:#fff;margin:8px 0 6px;">$2,480,680</div>' +
              '<div><span style="background:rgba(22,163,74,0.2);color:#4ade80;padding:2px 8px;border-radius:6px;font-size:11.5px;font-weight:700;">↑ 15%</span></div>' +
            '</div>' +

            '<div class="admin-dark-card">' +
              '<div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Pending KYC (demo)</div>' +
              '<div style="font-size:28px;font-weight:850;color:#fff;margin:8px 0 6px;">' + pCount + '</div>' +
              '<div><a href="#/admin/kyc" style="color:#38bdf8;font-size:11.5px;font-weight:700;text-decoration:none;">Review Queue →</a></div>' +
            '</div>' +
          '</div>' +

          /* Middle Row: Volume Area Chart & Types Donut */
          '<div class="admin-charts-grid" style="display:grid;grid-template-columns:1.5fr 1fr;gap:20px;margin-bottom:24px;">' +
            '<div class="admin-dark-card">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
                '<h3 style="font-size:16px;font-weight:800;color:#fff;margin:0;">Transaction Volume</h3>' +
                '<span style="font-size:12px;color:#38bdf8;font-weight:700;">Last 30 Days</span>' +
              '</div>' +
              '<svg viewBox="0 0 600 220" width="100%" height="210">' +
                '<defs>' +
                  '<linearGradient id="darkAreaGrad" x1="0" y1="0" x2="0" y2="1">' +
                    '<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35"/>' +
                    '<stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>' +
                  '</linearGradient>' +
                '</defs>' +
                '<line x1="40" y1="40" x2="570" y2="40" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4 4"/>' +
                '<line x1="40" y1="90" x2="570" y2="90" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4 4"/>' +
                '<line x1="40" y1="140" x2="570" y2="140" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4 4"/>' +
                '<line x1="40" y1="190" x2="570" y2="190" stroke="rgba(255,255,255,0.1)"/>' +
                '<path d="M 50 160 Q 140 120, 230 145 T 410 70 T 560 45 L 560 190 L 50 190 Z" fill="url(#darkAreaGrad)"/>' +
                '<path d="M 50 160 Q 140 120, 230 145 T 410 70 T 560 45" fill="none" stroke="#06b6d4" stroke-width="3"/>' +
                '<circle cx="560" cy="45" r="5" fill="#06b6d4" stroke="#fff" stroke-width="2"/>' +
              '</svg>' +
            '</div>' +

            '<div class="admin-dark-card">' +
              '<h3 style="font-size:16px;font-weight:800;color:#fff;margin:0 0 16px;">Transaction Types</h3>' +
              '<div style="display:flex;align-items:center;justify-content:space-around;gap:20px;flex-wrap:wrap;">' +
                '<div style="position:relative;width:130px;height:130px;">' +
                  '<svg viewBox="0 0 140 140" width="130" height="130">' +
                    '<circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="18"/>' +
                    '<circle cx="70" cy="70" r="54" fill="none" stroke="#2563eb" stroke-width="18" stroke-dasharray="142.5 339.3" stroke-dashoffset="0" transform="rotate(-90 70 70)"/>' +
                    '<circle cx="70" cy="70" r="54" fill="none" stroke="#8b5cf6" stroke-width="18" stroke-dasharray="95.0 339.3" stroke-dashoffset="-142.5" transform="rotate(-90 70 70)"/>' +
                    '<circle cx="70" cy="70" r="54" fill="none" stroke="#06b6d4" stroke-width="18" stroke-dasharray="61.0 339.3" stroke-dashoffset="-237.5" transform="rotate(-90 70 70)"/>' +
                    '<circle cx="70" cy="70" r="54" fill="none" stroke="#10b981" stroke-width="18" stroke-dasharray="40.7 339.3" stroke-dashoffset="-298.5" transform="rotate(-90 70 70)"/>' +
                  '</svg>' +
                  '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
                    '<b style="font-size:16px;color:#fff;">48,729</b>' +
                    '<span style="font-size:10px;color:#94a3b8;">Total</span>' +
                  '</div>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:8px;font-size:12.5px;">' +
                  '<div style="display:flex;align-items:center;gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:#2563eb;"></span> Deposit <b>42%</b></div>' +
                  '<div style="display:flex;align-items:center;gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:#8b5cf6;"></span> Withdrawal <b>28%</b></div>' +
                  '<div style="display:flex;align-items:center;gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:#06b6d4;"></span> Transfer <b>18%</b></div>' +
                  '<div style="display:flex;align-items:center;gap:8px;"><span style="width:8px;height:8px;border-radius:50%;background:#10b981;"></span> Payment <b>12%</b></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Recent Users & Verification Status (Matching Screen 24 Admin — Owner) */
          '<div class="admin-dark-card" style="margin-bottom:24px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">' +
              '<div>' +
                '<h3 style="font-size:16px;font-weight:800;color:#fff;margin:0;">Recent Users &amp; Verification Status</h3>' +
                '<span style="font-size:12px;color:#94a3b8;">Latest registered students and administrators across global corridors</span>' +
              '</div>' +
              '<a href="#/admin/users" style="color:#12B8B0;font-size:12.5px;font-weight:750;text-decoration:none;">Manage All Users &rsaquo;</a>' +
            '</div>' +
            '<div class="table-wrap"><table class="clean-table">' +
              '<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th style="text-align:right;">Action</th></tr></thead>' +
              '<tbody>' +
                '<tr><td><b style="color:#fff;">Ishan Ahmed</b></td><td class="mono" style="color:#94a3b8;">ishan@probaho.demo</td><td><span class="role-pill">Owner / Admin</span></td><td><span class="badge badge-ok">Verified</span></td><td style="color:#94a3b8;">16 Oct</td><td style="text-align:right;"><a href="#/admin/users" class="btn btn-sm btn-secondary">Inspect</a></td></tr>' +
                '<tr><td><b style="color:#fff;">Rahman Uddin</b></td><td class="mono" style="color:#94a3b8;">rahman@probaho.demo</td><td><span class="role-pill">Student</span></td><td><span class="badge badge-ok">Verified</span></td><td style="color:#94a3b8;">16 Oct</td><td style="text-align:right;"><a href="#/admin/users" class="btn btn-sm btn-secondary">Inspect</a></td></tr>' +
                '<tr><td><b style="color:#fff;">Tania Akter</b></td><td class="mono" style="color:#94a3b8;">tania@probaho.demo</td><td><span class="role-pill">Student</span></td><td><span class="badge badge-ok">Verified</span></td><td style="color:#94a3b8;">15 Oct</td><td style="text-align:right;"><a href="#/admin/users" class="btn btn-sm btn-secondary">Inspect</a></td></tr>' +
                '<tr><td><b style="color:#fff;">Sabbir Hossain</b></td><td class="mono" style="color:#94a3b8;">sabbir@probaho.demo</td><td><span class="role-pill">Student</span></td><td><span class="badge badge-warn">Pending</span></td><td style="color:#94a3b8;">14 Oct</td><td style="text-align:right;"><a href="#/admin/kyc" class="btn btn-sm btn-primary">Review KYC</a></td></tr>' +
              '</tbody>' +
            '</table></div>' +
          '</div>' +

          /* Global Treasury & Multi-Rail Liquidity Pool Monitor */
          '<div class="admin-dark-card" style="margin-bottom:24px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
              '<div>' +
                '<h3 style="font-size:16px;font-weight:800;color:#fff;margin:0;">🏦 Global Settlement Liquidity Pools &amp; Web3 Hot Vault</h3>' +
                '<span style="font-size:12px;color:#94a3b8;">Real-time treasury reserve health across Fiat Bank Rails, Mobile Money, and Blockchain Nodes</span>' +
              '</div>' +
              '<button type="button" class="btn btn-sm btn-primary" id="btnRebalancePools" style="border-radius:8px;">⚡ Rebalance Liquidity Pools</button>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:14px;">' +
              '<div style="background:#0b1324;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#94a3b8;font-weight:700;"><span>🇺🇸 USD FEDWIRE / ACH</span><span style="color:#34d399;">98% Optimal</span></div>' +
                '<div style="font-size:20px;font-weight:850;color:#fff;margin:6px 0;">$1,450,000 USD</div>' +
                '<div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;"><div style="width:88%;height:100%;background:#3b82f6;border-radius:3px;"></div></div>' +
              '</div>' +
              '<div style="background:#0b1324;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#94a3b8;font-weight:700;"><span>🇧🇩 BDT BKASH / NPSB</span><span style="color:#34d399;">96% Optimal</span></div>' +
                '<div style="font-size:20px;font-weight:850;color:#fff;margin:6px 0;">৳48,200,000 BDT</div>' +
                '<div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;"><div style="width:84%;height:100%;background:#10b981;border-radius:3px;"></div></div>' +
              '</div>' +
              '<div style="background:#0b1324;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#94a3b8;font-weight:700;"><span>🇨🇳 CNY ALIPAY / CNAPS</span><span style="color:#34d399;">94% Optimal</span></div>' +
                '<div style="font-size:20px;font-weight:850;color:#fff;margin:6px 0;">¥6,850,000 CNY</div>' +
                '<div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;"><div style="width:79%;height:100%;background:#f59e0b;border-radius:3px;"></div></div>' +
              '</div>' +
              '<div style="background:#0b1324;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#94a3b8;font-weight:700;"><span>🪙 WEB3 USDT / BTC / ETH</span><span style="color:#38bdf8;">Hot + Cold Vault</span></div>' +
                '<div style="font-size:20px;font-weight:850;color:#fff;margin:6px 0;">₮890,400 USDT</div>' +
                '<div style="width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;"><div style="width:92%;height:100%;background:#06b6d4;border-radius:3px;"></div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* 12-Module Quick Command Center Grid */
          '<div class="admin-dark-card" style="margin-bottom:24px;">' +
            '<h3 style="font-size:16px;font-weight:800;color:#fff;margin:0 0 14px;">⚡ Admin Console Command Modules</h3>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(195px, 1fr));gap:10px;">' +
              [
                { href:"#/admin/corridors", icon:"🌐", title:"Corridors (" + corridorsCount + ")", sub:"Edit rates & FX seeds" },
                { href:"#/admin/providers", icon:"🏦", title:"Providers (5)", sub:"Edit fees & spreads" },
                { href:"#/admin/payout-routes", icon:"🛤️", title:"Payout Routes", sub:"bKash, Bank, Wallet" },
                { href:"#/admin/fx-data", icon:"📈", title:"90-Day FX Seeds", sub:"Reseed deterministic FX" },
                { href:"#/admin/scamshield-rules", icon:"🛡️", title:"ScamShield Rules", sub:"Tune 10 risk weights" },
                { href:"#/admin/tuition", icon:"🎓", title:"Tuition Seeds", sub:"Deadlines & checklists" },
                { href:"#/admin/content", icon:"✏️", title:"Landing Copy", sub:"Hero & card wording" },
                { href:"#/admin/vault", icon:"🗄️", title:"Vault Ledger", sub:"Export CSV & drafts" },
                { href:"#/admin/kyc", icon:"🆔", title:"KYC Queue (" + pCount + ")", sub:"Approve/reject IDs" },
                { href:"#/admin/reports", icon:"📑", title:"Scans & Tickets", sub:"Support inbox" },
                { href:"#/admin/users", icon:"👥", title:"Users & RBAC", sub:"Manage accounts" },
                { href:"#/admin/settings", icon:"⚙️", title:"System Settings", sub:"Maintenance & security" }
              ].map(function(m){
                return '<a href="' + m.href + '" style="background:#0b1324;border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:12px 14px;text-decoration:none;display:flex;align-items:center;gap:10px;transition:all 0.15s;">' +
                  '<span style="font-size:20px;">' + m.icon + '</span>' +
                  '<div><b style="color:#f8fafc;font-size:13px;display:block;">' + m.title + '</b><span style="color:#94a3b8;font-size:11px;">' + m.sub + '</span></div>' +
                '</a>';
              }).join("") +
            '</div>' +
          '</div>' +

          /* Recent Activity Table */
          '<div class="admin-dark-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
              '<h3 style="font-size:16px;font-weight:800;color:#fff;margin:0;">Recent Activity (' + (liveAudit.length + recentLogs.length) + ' events)</h3>' +
              '<a href="#/admin/audit" style="color:#38bdf8;font-size:12.5px;font-weight:700;text-decoration:none;">View Full Audit Log →</a>' +
            '</div>' +
            '<div class="table-wrap"><table class="clean-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Time</th>' +
                  '<th>User</th>' +
                  '<th>Action</th>' +
                  '<th>IP / Target</th>' +
                  '<th>Status</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                recentLogs.slice(0, 5).map(function(lg){
                  return '<tr>' +
                    '<td style="color:#94a3b8;font-size:12px;">' + U.esc(lg.time) + '</td>' +
                    '<td><b style="color:#fff;">' + U.esc(lg.user) + '</b></td>' +
                    '<td>' + U.esc(lg.action) + '</td>' +
                    '<td style="font-family:monospace;color:#94a3b8;">' + U.esc(lg.ip) + '</td>' +
                    '<td><span style="background:rgba(22,163,74,0.2);color:#4ade80;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">' + U.esc(lg.status) + '</span></td>' +
                  '</tr>';
                }).join("") +
              '</tbody>' +
            '</table></div>' +
          '</div>' +

        '</main>' +
      '</div>' +
    '</div>';

  wireSidebarActions(el);
  var rebBtn = U.$("#btnRebalancePools", el);
  if (rebBtn){
    rebBtn.addEventListener("click", function(){
      if (global.AdminConfig && global.AdminConfig.audit){
        global.AdminConfig.audit("treasury.rebalance", "liquidity-pools", "all-rails", "ok");
      }
      if (global.Toast) global.Toast.show("Global Fiat & Web3 Liquidity Pools rebalanced to 100% optimal capacity!", "ok");
    });
  }
  return el;
}

function renderDenied(el, sec){
  el.innerHTML =
    '<div class="admin-dark-theme admin-shell">' +
      '<div class="admin-dark-shell">' +
        buildSidebar(sec) +
        '<main class="admin-dark-content admin-main">' +
          '<div class="admin-dark-card" style="max-width:540px;margin:60px auto;text-align:center;padding:32px 24px;">' +
            '<div style="font-size:36px;margin-bottom:12px">🔒</div>' +
            '<h2 style="color:#fff;margin:0 0 8px;">Access denied (demo)</h2>' +
            '<p style="color:#94a3b8;margin-top:8px">Your role (<code>' + U.esc((global.AuthService && global.AuthService.role()) || "viewer") + '</code>) does not have permission to view the <code>' + U.esc(sec) + '</code> section.</p>' +
            '<p style="margin-top:20px"><a class="btn btn-primary" href="#/admin">Return to Admin Overview</a></p>' +
          '</div>' +
        '</main>' +
      '</div>' +
    '</div>';
  wireSidebarActions(el);
  return null;
}

global.AdminApp = {
  renderDarkDashboard: renderDarkDashboard,
  sidebar: buildSidebar,
  wireSidebar: wireSidebarActions,
  topbar: buildTopbar,

  kpi: function(label, val, sub){
    return '<div class="kpi">' +
      '<span class="kpi-label">' + U.esc(label) + '</span>' +
      '<span class="kpi-val">' + U.esc(val) + '</span>' +
      (sub ? '<span class="kpi-sub">' + U.esc(sub) + '</span>' : '') +
    '</div>';
  },

  field: function(label, controlHtml, hint){
    return '<div class="field" style="margin-bottom:14px;">' +
      '<label style="display:block;font-weight:700;margin-bottom:6px;">' + U.esc(label) + '</label>' +
      controlHtml +
      (hint ? '<div class="hint tiny muted" style="margin-top:4px;">' + U.esc(hint) + '</div>' : '') +
    '</div>';
  },

  input: function(id, val, extraAttrs){
    return '<input class="input" id="' + U.esc(id) + '" value="' + U.esc(val == null ? "" : String(val)) + '"' +
      (extraAttrs ? " " + extraAttrs : "") + '>';
  },

  textarea: function(id, val, rows){
    return '<textarea class="input" id="' + U.esc(id) + '" rows="' + (rows || 3) + '">' +
      U.esc(val == null ? "" : String(val)) + '</textarea>';
  },

  saveBar: function(sec){
    var canW = global.AuthService && global.AuthService.canWrite(sec);
    if (canW){
      return '<div class="save-bar">' +
        '<button class="btn btn-primary" data-act="save">Save changes</button>' +
        '<button class="btn btn-ghost" data-act="reset-defaults">Restore defaults</button>' +
        '<span class="save-msg" role="status"></span>' +
      '</div>';
    }
    var r = (global.AuthService && global.AuthService.role()) || "viewer";
    return '<div class="perm-note">' +
      U.icon("info") +
      '<span>Read-only for your role (<code>' + U.esc(r) + '</code>). Sign in as <code>owner@probaho.demo</code> to modify this section.</span>' +
    '</div>';
  },

  confirm: function(title, message, okLabel, onOk){
    global.Modal.open({
      title: title,
      body: '<p style="font-size:14px;color:#334155;line-height:1.5;margin:0;">' + U.esc(message) + '</p>',
      okLabel: okLabel || "Confirm",
      onOk: onOk
    });
  },

  page: function(sec, title, desc, body){
    var el = U.$("#view");
    if (global.AuthService && global.AuthService.signedIn() && !global.AuthService.canView(sec)){
      return renderDenied(el, sec);
    }
    if (sec === "dashboard" && !body){
      return renderDarkDashboard();
    }
    el.innerHTML =
      '<div class="admin-dark-theme admin-shell">' +
        '<div class="admin-dark-shell">' +
          buildSidebar(sec) +
          '<main class="admin-dark-content admin-main">' +
            buildTopbar(title, desc, sec) +
            '<div class="admin-work-area">' + (body || "") + '</div>' +
          '</main>' +
        '</div>' +
      '</div>';
    wireSidebarActions(el);
    return el;
  }
};

global.ModAdminDashboard = { render: renderDarkDashboard, meta:{ title:"Admin Portal", nav:null } };
})(window);

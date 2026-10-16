/* router.js — High-Security Hash Router.
   100% Mandatory Sign-In Gate: Users cannot access any website route without signing in first.
   Theme Customizer, Navigation Bar, Mobile Tabs, Notifications, and Floating Copilot work seamlessly. */
(function(global){
"use strict";
var U = global.U;

var ROUTES = [
  /* High-Security Sign-In & Account Creation Gate (Entry Points) */
  { path:"/",                   mod:"ModSignIn",            label:"Sign In", entry:true },
  { path:"/sign-in",            mod:"ModSignIn",            label:"Sign In", entry:true },
  { path:"/signin",             mod:"ModSignIn",            label:"Sign In", entry:true },
  { path:"/sign-up",            mod:"ModSignUp",            label:"Sign Up", entry:true },
  { path:"/signup",             mod:"ModSignUp",            label:"Sign Up", entry:true },

  /* Authenticated User Portal Routes (Protected by Mandatory Sign-In Gate) */
  { path:"/home",               mod:"ModHome",              label:"Home" },
  { path:"/notifications",      mod:"ModNotifications",     label:"🔔 Notifications" },
  { path:"/alerts",             mod:"ModNotifications",     label:"🔔 Alerts" },
  { path:"/fees",               mod:"ModFees",              label:"Fees & Pricing" },
  { path:"/corridors",          mod:"ModCorridors",         label:"Corridors" },
  { path:"/terms",              mod:"ModTerms",             label:"Terms of Service" },
  { path:"/privacy",            mod:"ModPrivacy",           label:"Privacy Policy" },
  { path:"/refunds",            mod:"ModRefunds",           label:"Refund Policy" },
  { path:"/cookies",            mod:"ModCookies",           label:"Cookie Notice" },
  { path:"/dashboard",          mod:"ModDashboard",         label:"Dashboard" },
  { path:"/corridor-optimizer", mod:"ModOptimizer",         label:"Optimizer" },
  { path:"/send",               mod:"ModSend",              label:"Send Money" },
  { path:"/beneficiaries",      mod:"ModBeneficiaries",     label:"Beneficiaries" },
  { path:"/kyc",                mod:"ModKyc",               label:"KYC Verification" },
  { path:"/settings",           mod:"ModSettings",          label:"Settings" },
  { path:"/rates",              mod:"ModRates",             label:"FX Rates" },
  { path:"/fx-advisor",         mod:"ModFx",                label:"FX Advisor" },
  { path:"/tuition-planner",    mod:"ModTuition",           label:"Tuition" },
  { path:"/scamshield",         mod:"ModScam",              label:"ScamShield" },
  { path:"/ask-probaho",        mod:"ModCopilot",           label:"Ask Probaho" },
  { path:"/copilot",            mod:"ModCopilot",           label:"AI Copilot" },
  { path:"/payment-vault",      mod:"ModVault",             label:"Vault & Wallet" },
  { path:"/vault",              mod:"ModVault",             label:"Vault & Wallet" },
  { path:"/wallet",             mod:"ModVault",             label:"Crypto Wallet" },
  { path:"/transactions",       mod:"ModTransactions",      label:"Transactions" },
  { path:"/analytics",          mod:"ModAnalytics",         label:"Analytics" },
  { path:"/design-studio",      mod:"ModDesignStudio",      label:"✨ 4 UI Designs" },
  { path:"/student-journey",    mod:"ModStudentJourney",    label:"🧭 Student Journey" },
  { path:"/evaluation",         mod:"ModEvaluation",        label:"📊 Evaluation" },
  { path:"/help",               mod:"ModHelp",              label:"Help" },

  /* Dedicated Hidden Administrator Login & Console Routes */
  { path:"/admin/login",            mod:"ModAdminLogin",      label:"Administrator Portal Login", adminLogin:true, hidden:true },
  { path:"/admin",                  mod:"ModAdminDashboard",  label:"Admin Portal",      admin:true },
  { path:"/admin/users",            mod:"ModAdminUsers",      label:"Admin Users",       admin:true },
  { path:"/admin/kyc",              mod:"ModAdminKyc",        label:"KYC Queue",         admin:true },
  { path:"/admin/audit",            mod:"ModAdminAudit",      label:"Audit Logs",        admin:true },
  { path:"/admin/settings",         mod:"ModAdminSettings",   label:"Settings",          admin:true },
  { path:"/admin/content",          mod:"ModAdminContent",    label:"Admin Content",     admin:true },
  { path:"/admin/corridors",        mod:"ModAdminCorridors",  label:"Corridors",         admin:true },
  { path:"/admin/providers",        mod:"ModAdminProviders",  label:"Providers",         admin:true },
  { path:"/admin/fx-data",          mod:"ModAdminFx",         label:"FX Control",        admin:true },
  { path:"/admin/scamshield-rules", mod:"ModAdminRules",      label:"ScamShield Rules",  admin:true },
  { path:"/admin/tuition",          mod:"ModAdminTuition",    label:"Tuition Rules",     admin:true },
  { path:"/admin/vault",            mod:"ModAdminVault",      label:"Vault Storage",     admin:true },
  { path:"/admin/payout-routes",    mod:"ModAdminPayout",     label:"Payout Routes",     admin:true },
  { path:"/admin/reports",          mod:"ModAdminReports",    label:"Reports",           admin:true },
  { path:"/users",                  mod:"ModUsers",           label:"Users",             admin:true }
];

function current(){
  var rawHash = location.hash.replace(/^#/, "");
  if (!rawHash && typeof location.pathname === "string" && location.pathname.indexOf("/admin") === 0){
    rawHash = location.pathname;
  }
  var h = rawHash || "/";
  var q = h.indexOf("?");
  if (q >= 0) h = h.slice(0, q);
  if (h.length > 1 && h.charAt(h.length - 1) === "/") h = h.slice(0, -1);
  for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].path === h) return ROUTES[i];
  return null;
}

function renderNotFound(){
  var signedIn = global.AuthService && global.AuthService.signedIn();
  if (!signedIn){
    location.hash = "#/";
    return;
  }
  U.$("#view").innerHTML =
    '<div class="notfound"><p class="eyebrow">Nothing here</p>' +
    '<h1>404</h1><p class="muted" style="margin:10px 0 20px">That page does not exist.</p>' +
    '<a class="btn btn-primary" href="#/home">Back to Home</a></div>';
  setNav(null);
}

function setNav(activePath){
  var signedIn = global.AuthService && global.AuthService.signedIn();
  var isStaff = global.AuthService && global.AuthService.isStaff();
  var lang = U.safeGet("preferred_lang", "en");
  var isBn = lang === "bn";

  /* Toggle body.is-authenticated for desktop left navy sidebar layout (hide sidebar on Sign-In screen & public alerts) */
  var isPublicNavScreen = (activePath === "/" || activePath === "/sign-in" || activePath === "/signin" || activePath === "/sign-up" || activePath === "/signup" || activePath === "/admin/login" || (!signedIn && (activePath === "/notifications" || activePath === "/alerts")));
  if (document.body){
    document.body.classList.toggle("is-authenticated", !!(signedIn && !isPublicNavScreen));
    document.body.classList.toggle("is-signin-screen", !!isPublicNavScreen);
  }
  var helpHdrBtn = U.$("#btnHeaderHelp");
  if (helpHdrBtn) helpHdrBtn.style.display = signedIn ? "inline-flex" : "none";

  var hdrSearchIn = U.$("#headerGlobalSearchInput");
  if (hdrSearchIn && !hdrSearchIn._bound){
    hdrSearchIn._bound = true;
    hdrSearchIn.addEventListener("keydown", function(e){
      if (e.key === "Enter"){
        e.preventDefault();
        var q = hdrSearchIn.value.trim().toLowerCase();
        if (!q) { if (global.GlobalCommand) global.GlobalCommand.open(); return; }
        if (q.indexOf("notif") >= 0 || q.indexOf("alert") >= 0 || q.indexOf("remind") >= 0) location.hash = "#/notifications";
        else if (q.indexOf("signup") >= 0 || q.indexOf("sign up") >= 0 || q.indexOf("create account") >= 0 || q.indexOf("register") >= 0) location.hash = "#/sign-up";
        else if (q.indexOf("send") >= 0) location.hash = "#/send";
        else if (q.indexOf("benef") >= 0 || q.indexOf("rahim") >= 0 || q.indexOf("fatema") >= 0) location.hash = "#/beneficiaries";
        else if (q.indexOf("tuition") >= 0 || q.indexOf("univ") >= 0) location.hash = "#/tuition-planner";
        else if (q.indexOf("journey") >= 0) location.hash = "#/student-journey";
        else if (q.indexOf("vault") >= 0 || q.indexOf("card") >= 0 || q.indexOf("crypto") >= 0) location.hash = "#/payment-vault";
        else if (q.indexOf("scam") >= 0 || q.indexOf("safe") >= 0) location.hash = "#/scamshield";
        else if (q.indexOf("rate") >= 0 || q.indexOf("fx") >= 0) location.hash = "#/rates";
        else if (q.indexOf("kyc") >= 0) location.hash = "#/kyc";
        else if (q.indexOf("copilot") >= 0 || q.indexOf("ai") >= 0) location.hash = "#/copilot";
        else if (q.indexOf("optim") >= 0) location.hash = "#/corridor-optimizer";
        else if (q.indexOf("tx") >= 0 || q.indexOf("trans") >= 0) location.hash = "#/transactions";
        else if (global.GlobalCommand) global.GlobalCommand.open();
      }
    });
  }
  /* Hamburger button visible ONLY when signed in */
  var hb = U.$("#hamburger");
  if (hb) hb.style.display = signedIn ? "" : "none";

  /* Theme Customizer & Global Command buttons visible when signed in */
  var themeBtn = U.$("#btnOpenCustomizer");
  if (themeBtn) themeBtn.style.display = signedIn ? "inline-flex" : "none";
  var cmdBtn = U.$("#btnGlobalCommand");
  if (cmdBtn) cmdBtn.style.display = signedIn ? "inline-flex" : "none";
  var notifBtn = U.$("#btnOpenNotifications");
  if (notifBtn) notifBtn.style.display = "inline-flex";
  if (global.NotificationHub){
    if (typeof global.NotificationHub.updateBadge === "function") global.NotificationHub.updateBadge();
    if (signedIn && typeof global.NotificationHub.checkAndShowWelcomeAlert === "function") global.NotificationHub.checkAndShowWelcomeAlert();
  }

  /* Floating AI Copilot visible ONLY when signed in */
  if (global.FloatingCopilot && typeof global.FloatingCopilot.syncVisibility === "function"){
    global.FloatingCopilot.syncVisibility();
  } else {
    var fCopilot = document.getElementById("floatingCopilotRoot");
    if (fCopilot) fCopilot.style.display = signedIn ? "" : "none";
  }

  /* Footer navigation links visible ONLY when signed in */
  var footerNav = document.querySelector(".footer-meta nav");
  if (footerNav) footerNav.style.display = signedIn ? "flex" : "none";

  var visibleNavs = [];
  if (signedIn) {
    visibleNavs = [
      { path:"/home", label: isBn ? "হোম" : "Home" },
      { path:"/dashboard", label: isBn ? "ড্যাশবোর্ড" : "Dashboard" },
      { path:"/notifications", label: isBn ? "🔔 নোটিফিকেশন" : "🔔 Notifications" },
      { path:"/student-journey", label: isBn ? "🧭 স্টুডেন্ট জার্নি" : "🧭 Student Journey" },
      { path:"/send", label: isBn ? "টাকা পাঠান" : "Send Money" },
      { path:"/copilot", label: isBn ? "🤖 এআই কোপাইলট" : "🤖 AI Copilot" },
      { path:"/beneficiaries", label: isBn ? "প্রাপক তালিকা" : "Beneficiaries" },
      { path:"/payment-vault", label: isBn ? "ভল্ট ও ক্রিপ্টো" : "Vault & Crypto" },
      { path:"/kyc", label: isBn ? "ভেরিফিকেশন" : "KYC Quotas" },
      { path:"/corridor-optimizer", label: isBn ? "অপ্টিমাইজার" : "Optimizer" },
      { path:"/rates", label: isBn ? "এফএক্স রেট" : "Rates" },
      { path:"/fx-advisor", label: isBn ? "এফএক্স অ্যাডভাইজার" : "FX Advisor" },
      { path:"/scamshield", label: isBn ? "স্ক্যামশিল্ড" : "ScamShield" },
      { path:"/tuition-planner", label: isBn ? "টিউশন প্ল্যানার" : "Tuition Planner" },
      { path:"/evaluation", label: isBn ? "📊 ইভ্যালুয়েশন" : "📊 Evaluation" },
      { path:"/design-studio", label: isBn ? "✨ ইউআই ডিজাইন" : "✨ 4 UI Skins" },
      { path:"/help", label: isBn ? "সাপোর্ট" : "Support" }
    ];

    /* Admin portal is hidden from public navigation */
  }

  var drawerNavs = visibleNavs.slice();
  if (signedIn) {
    drawerNavs.push(
      { path:"/fees", label: isBn ? "ফি তালিকা" : "Fees & Pricing" },
      { path:"/corridors", label: isBn ? "করিডোর" : "Corridors" },
      { path:"/settings", label: isBn ? "সেটিংস" : "Settings" },
      { path:"/transactions", label: isBn ? "লেনদেন" : "Transactions" },
      { path:"/analytics", label: isBn ? "অ্যানালিটিক্স" : "Analytics" },
      { path:"/sign-up", label: isBn ? "✨ নতুন অ্যাকাউন্ট" : "✨ Create Account" }
    );
  }

  var mainNav = U.$("#mainNav");
  if (mainNav) {
    mainNav.innerHTML = visibleNavs.map(function(r){
      var cur = r.path === activePath;
      return '<a href="#' + r.path + '"' + (cur ? ' aria-current="page"' : '') + '>' +
        U.esc(r.label) + '</a>';
    }).join("");
  }

  var appSidebarNav = U.$("#appSidebarNav");
  if (appSidebarNav){
    if (!signedIn){
      appSidebarNav.innerHTML = "";
    } else {
      var unreadBadgeCount = 2;
      try {
        if (global.NotificationHub && typeof global.NotificationHub.list === "function"){
          unreadBadgeCount = global.NotificationHub.list().filter(function(n){ return n.unread !== false; }).length;
        }
      } catch(e){}
      var sbPrimary = [
        { path:"/dashboard",          icon:"home",    label: isBn ? "ওভারভিউ" : "Overview" },
        { path:"/notifications",      icon:"bell",    label: isBn ? "নোটিফিকেশন ও অ্যালার্ট" : "Notifications", notifCount: unreadBadgeCount },
        { path:"/student-journey",    icon:"book",    label: isBn ? "স্টুডেন্ট জার্নি" : "Student Journey" },
        { path:"/send",               icon:"send",    label: isBn ? "টাকা পাঠান" : "Send Money" },
        { path:"/beneficiaries",      icon:"users",   label: isBn ? "প্রাপক তালিকা" : "Beneficiaries" },
        { path:"/corridor-optimizer", icon:"route",   label: isBn ? "করিডোর অপ্টিমাইজার" : "Corridor Optimizer" },
        { path:"/tuition-planner",    icon:"book",    label: isBn ? "টিউশন প্ল্যানার" : "Tuition Planner" },
        { path:"/payment-vault",      icon:"vault",   label: isBn ? "পেমেন্ট ভল্ট" : "Payment Vault" },
        { path:"/kyc",                icon:"id",      label: isBn ? "কেওয়াইসি যাচাই" : "KYC Verification" },
        { path:"/scamshield",         icon:"shield",  label: isBn ? "স্ক্যামশিল্ড" : "ScamShield" },
        { path:"/copilot",            icon:"chat",    label: isBn ? "এআই কোপাইলট" : "AI Copilot", copilot:true }
      ];
      var sbSecondary = [
        { path:"/transactions",       icon:"list",    label: isBn ? "লেনদেন" : "Transactions" },
        { path:"/analytics",          icon:"chart",   label: isBn ? "অ্যানালিটিক্স" : "Analytics" },
        { path:"/rates",              icon:"globe",   label: isBn ? "এক্সচেঞ্জ রেট" : "Exchange Rates" },
        { path:"/fx-advisor",         icon:"chart",   label: isBn ? "এফএক্স অ্যাডভাইজার" : "FX Advisor" },
        { path:"/fees",               icon:"tag",     label: isBn ? "ফি তালিকা" : "Fees" },
        { path:"/corridors",          icon:"globe",   label: isBn ? "করিডোর" : "Corridors" },
        { path:"/home",               icon:"home",    label: isBn ? "ল্যান্ডিং হোম" : "Public Home" }
      ];
      var sbBottom = [
        { path:"/settings",           icon:"sliders", label: isBn ? "সেটিংস" : "Settings" },
        { path:"/help",               icon:"info",    label: isBn ? "সাপোর্ট" : "Help & Support" },
        { path:"/terms",              icon:"report",  label: isBn ? "শর্তাবলী" : "Terms & Privacy" },
        { path:"/refunds",            icon:"report",  label: isBn ? "রিফান্ড" : "Refunds" },
        { path:"/cookies",            icon:"lock",    label: isBn ? "কুকিজ" : "Cookies" },
        { path:"/sign-up",            icon:"user",    label: isBn ? "নতুন অ্যাকাউন্ট" : "Create Account" },
        { path:"/sign-in",            icon:"lock",    label: "Sign-In Screen" }
      ];
      function renderSbGroup(items){
        return items.map(function(item){
          var cur = item.path === activePath || (item.path === "/copilot" && activePath === "/ask-probaho") || (item.path === "/payment-vault" && (activePath === "/vault" || activePath === "/wallet")) || (item.path === "/notifications" && activePath === "/alerts");
          var copAttr = (item.copilot ? ' data-copilot-link="1"' : '');
          var dot = item.copilot
            ? '<span style="margin-left:auto;width:8px;height:8px;border-radius:50%;background:#16A34A;box-shadow:0 0 8px #16A34A;"></span>'
            : (item.notifCount ? '<span class="live-notif-unread-count" style="margin-left:auto;background:#ef4444;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px;">' + item.notifCount + '</span>' : '');
          return '<a href="#' + item.path + '"' + (cur ? ' aria-current="page"' : '') + copAttr + '>' +
            '<span class="sb-ic">' + (U.icon ? U.icon(item.icon, 17) : '') + '</span>' +
            '<span>' + U.esc(item.label) + '</span>' + dot +
          '</a>';
        }).join("");
      }
      appSidebarNav.innerHTML =
        renderSbGroup(sbPrimary) +
        '<div class="app-sidebar-divider"></div>' +
        renderSbGroup(sbSecondary) +
        '<div class="app-sidebar-divider"></div>' +
        renderSbGroup(sbBottom);
    }
  }

  var drawerNav = U.$("#drawerNav");
  if (drawerNav) {
    drawerNav.innerHTML = drawerNavs.map(function(r){
      var cur = r.path === activePath;
      return '<a href="#' + r.path + '"' + (cur ? ' aria-current="page"' : '') + '>' +
        U.esc(r.label) + '</a>';
    }).join("");
  }

  if (activePath) closeDrawer();
}

function updateHeaderAuth(){
  var btn = U.$("#headerSignout");
  var container = U.$("#headerAuthTools");
  var themeBtn = U.$("#btnOpenCustomizer");
  var s = global.AuthService && global.AuthService.session();

  if (themeBtn){
    themeBtn.style.display = s ? "inline-flex" : "none";
  }

  if (btn){
    /* Keep #headerSignout hidden in the header bar; Sign Out lives cleanly inside the Profile Popover */
    btn.style.display = "none";
    btn.innerHTML = "";
  }

  if (container){
    if (s){
      container.style.display = "inline-flex";
      container.innerHTML = (U.renderProfileMenuHtml ? U.renderProfileMenuHtml("public", "hdr") : "");
      if (U.bindProfileMenus) U.bindProfileMenus(container);
    } else {
      container.style.display = "none";
      container.innerHTML = "";
    }
  }

  var langBtn = U.$("#langToggleBtn");
  var langLbl = U.$("#langLabel");
  var curLang = U.safeGet("preferred_lang", "en");
  if (langLbl) langLbl.textContent = curLang === "bn" ? "English" : "বাংলা";

  if (langBtn && !langBtn._bound){
    langBtn._bound = true;
    langBtn.addEventListener("click", function(){
      var now = U.safeGet("preferred_lang", "en");
      var next = now === "bn" ? "en" : "bn";
      U.safeSet("preferred_lang", next);
      if (global.AppState){
        var prof = global.AppState.get("userProfile") || {};
        prof.preferred_lang = next;
        global.AppState.set("userProfile", prof);
      }
      if (langLbl) langLbl.textContent = next === "bn" ? "English" : "বাংলা";
      if (global.Toast) global.Toast.show(next === "bn" ? "ভাষা পরিবর্তিত: বাংলা" : "Language switched to English", "ok");
      render();
    });
  }
}

function freshView(){
  var old = U.$("#view");
  if (!old) return;
  var fresh = old.cloneNode(false);
  old.parentNode.replaceChild(fresh, old);
}

var lastRenderedHash = null;
var lastRenderTs = 0;

function render(){
  lastRenderedHash = location.hash;
  lastRenderTs = Date.now();
  var signedIn = global.AuthService && global.AuthService.signedIn();
  var r = current();

  var isQaHarness = !!(global.location && String(global.location.pathname).indexOf("qa.html") >= 0);

  /* Allow /admin/login directly without bouncing to student sign-in */
  if (r && r.path === "/admin/login"){
    document.body.classList.remove("admin-mode");
    document.body.classList.remove("has-tabs");
    setNav("/admin/login");
    updateHeaderAuth();
    freshView();
    if (global.ModAdminLogin && typeof global.ModAdminLogin.render === "function"){
      global.ModAdminLogin.render(U.$("#view"));
    }
    document.title = "Administrator Portal Login · Probaho Remit";
    return;
  }

  /* If an unauthenticated visitor hits /admin or /admin/*, route to /admin/login (or in qa.html render sign-in guard) */
  var isAdminTarget = r && ((r.path.indexOf("/admin") === 0) || r.path === "/users" || !!r.admin);
  if (!signedIn && isAdminTarget){
    document.body.classList.remove("admin-mode");
    document.body.classList.remove("has-tabs");
    if (isQaHarness){
      if (global.ModSignIn && typeof global.ModSignIn.setRedirect === "function") global.ModSignIn.setRedirect("#" + r.path);
      setNav("/");
      updateHeaderAuth();
      freshView();
      global.ModSignIn.render(U.$("#view"));
      return;
    }
    location.hash = "#/admin/login";
    return;
  }

  /* STRICT AUTHENTICATION GATE:
     Allow entry/auth screens + public demonstration notifications & alerts. All other financial modules require sign in. */
  var isPublicRoute = r && (r.path === "/" || r.path === "/sign-in" || r.path === "/signin" || r.path === "/sign-up" || r.path === "/signup" || r.path === "/admin/login" || r.path === "/notifications" || r.path === "/alerts");
  if (!signedIn && !isPublicRoute){
    if (r && global.ModSignIn && typeof global.ModSignIn.setRedirect === "function"){
      global.ModSignIn.setRedirect("#" + r.path);
    }
    if (global.Toast){
      global.Toast.show("🔒 Please sign in first to access the student portal.", "warn");
    }
    document.body.classList.remove("admin-mode");
    document.body.classList.remove("has-tabs");
    setNav("/");
    updateHeaderAuth();
    if (location.hash !== "#/" && location.hash !== "#/sign-in"){
      location.hash = "#/";
      return;
    }
    freshView();
    global.ModSignIn.render(U.$("#view"));
    return;
  }

  if (!r){ renderNotFound(); document.title = "Not found · Probaho Remit"; return; }

  /* HIGH-SECURITY BARRIER: Protect all Admin routes strictly (Deny authenticated students!) */
  var isAdminRoute = (r.path.indexOf("/admin") === 0) || r.path === "/users" || !!r.admin;
  if (isAdminRoute){
    try {
      var m = document.querySelector('meta[name="robots"]');
      if (!m){ m = document.createElement("meta"); m.setAttribute("name", "robots"); document.head.appendChild(m); }
      m.setAttribute("content", "noindex, nofollow");
    } catch (e) {}

    if (!global.AuthService || !global.AuthService.isStaff()){
      document.body.classList.remove("admin-mode");
      if (isQaHarness){
        location.hash = "#/sign-in";
        return;
      }
      freshView();
      U.$("#view").innerHTML =
        '<div class="card" style="max-width:540px;margin:60px auto;text-align:center;padding:34px 26px;border:1.5px solid #FCA5A5;background:#FFF1F2;">' +
          '<div style="font-size:38px;margin-bottom:10px;">🔒</div>' +
          '<span class="badge badge-crit" style="margin-bottom:8px;">403 FORBIDDEN · ACCESS DENIED</span>' +
          '<h2 class="section-title" style="color:#991B1B;">Administrator Authorization Required</h2>' +
          '<p style="color:#7F1D1D;font-size:13.5px;margin-top:8px;line-height:1.55;">Your current account does not have administrator permissions to view this resource.</p>' +
          '<div style="margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
            '<a class="btn btn-primary" href="#/dashboard">Return to Student Dashboard</a>' +
          '</div>' +
        '</div>';
      setNav("/dashboard");
      updateHeaderAuth();
      return;
    }
    var sectionKey = r.path.replace(/^\/admin\/?/, "") || "dashboard";
    if (r.path === "/users") sectionKey = "users";
    if (global.AuthService.canView && !global.AuthService.canView(sectionKey)){
      freshView();
      U.$("#view").innerHTML =
        '<div class="card" style="max-width:540px;margin:60px auto;text-align:center;padding:32px 24px;">' +
        '<div style="font-size:36px;margin-bottom:12px">🔒</div>' +
        '<h2 class="section-title">Access denied (demo)</h2>' +
        '<p class="muted" style="margin-top:8px">Your role (<code>' + U.esc(global.AuthService.role() || "viewer") + '</code>) does not have permission to view the <code>' + U.esc(sectionKey) + '</code> section.</p>' +
        '<p style="margin-top:20px"><a class="btn btn-primary" href="#/admin">Return to Admin Overview</a></p>' +
        '</div>';
      setNav(r.path);
      updateHeaderAuth();
      return;
    }
  }

  document.body.classList.toggle("admin-mode", isAdminRoute);

  freshView();
  var mod = global[r.mod];
  if (!mod || typeof mod.render !== "function"){ renderNotFound(); return; }
  try {
    var v = U.$("#view");
    mod.render(v);
  } catch (err){
    U.$("#view").innerHTML =
      '<div class="card"><h2 class="section-title">Something went wrong rendering this module.</h2>' +
      '<p class="muted" style="margin-top:8px">Error: ' + U.esc(err.message || err) + '</p>' +
      '<p style="margin-top:14px"><a class="btn btn-secondary" href="#/home">Back to Home</a></p></div>';
  }
  setNav(r.path);
  updateMobileTabs(r);

  document.title = (mod.meta ? mod.meta.title : r.label) + " · Probaho Remit — Titan Edition";
  var view = U.$("#view");
  if (view && (!global.Modal || !global.Modal.isOpen())) view.focus({ preventScroll:true });
  window.scrollTo(0, 0);
  updateHeaderAuth();
}

function openDrawer(){
  if (!global.AuthService || !global.AuthService.signedIn()) return;
  U.$("#drawer").classList.add("open");
  U.$("#drawerBg").classList.add("open");
  U.$("#hamburger").setAttribute("aria-expanded", "true");
}
function closeDrawer(){
  var d = U.$("#drawer"); if (!d) return;
  d.classList.remove("open");
  U.$("#drawerBg").classList.remove("open");
  U.$("#hamburger").setAttribute("aria-expanded", "false");
}

function init(){
  window.addEventListener("hashchange", function(){
    if (lastRenderedHash === location.hash && (Date.now() - lastRenderTs) < 60) return;
    render();
  });
  U.$("#hamburger").addEventListener("click", function(){
    U.$("#drawer").classList.contains("open") ? closeDrawer() : openDrawer();
  });
  U.$("#drawerClose").addEventListener("click", closeDrawer);
  U.$("#drawerBg").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeDrawer(); });
  render();
}

function updateMobileTabs(r){
  var tabs = document.getElementById("mobileTabs");
  if (!tabs) return;
  var isAdminRoute = r && ((r.path.indexOf("/admin") === 0) || r.path === "/users" || !!r.admin);
  var show = !!(r && !r.hidden && !r.entry && !isAdminRoute && global.AuthService && global.AuthService.signedIn());
  document.body.classList.toggle("has-tabs", show);
  if (!show) return;
  var links = tabs.querySelectorAll("a");
  for (var i = 0; i < links.length; i++){
    if (links[i].getAttribute("href") === "#" + r.path) links[i].setAttribute("aria-current", "page");
    else links[i].removeAttribute("aria-current");
  }
}

global.Router = { init:init, routes:ROUTES, current:current, closeDrawer:closeDrawer, render:render };
})(typeof window !== "undefined" ? window : global);

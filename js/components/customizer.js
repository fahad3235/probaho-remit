/* customizer.js — Interactive Live Control Panel & Automatic Chrome Viewport Adaptation.
   Allows the user to customize:
   1. User Profile & Platform Branding
   2. Currency Corridors & Target Country (USD->BDT, USD->CNY, USD->INR, etc.)
   3. Tuition Planner School & Annual Fee
   4. Interface Mode (Light / Midnight Dark) & Accent Palette
   Automatically detects viewport & device geometry directly from Chrome. */
(function(global){
"use strict";
var U = global.U;

var PREF_KEY = "titan_user_customizations_v1";

function defaultPrefs(){
  return {
    userName: "Ishan Ahmed",
    userRole: "Administrator",
    brandName: "Probaho Remit",
    brandEdition: "Titan Edition · 2026",
    fromCurrency: "USD",
    toCurrency: "BDT",
    exchangeRate: 119.50,
    university: "University of Toronto",
    program: "Computer Science",
    tuitionAnnualCAD: 45000,
    tuitionFundedPct: 72,
    geminiApiKey: "",
    themeColor: "blue", // blue, cyan, green, purple, gold, rose
    displayMode: "light" // light | dark
  };
}

function getPrefs(){
  var defaults = defaultPrefs();
  try {
    var raw = localStorage.getItem(PREF_KEY);
    if (raw){
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object"){
        for (var k in parsed){
          if (Object.prototype.hasOwnProperty.call(parsed, k) && k !== "deviceLayoutMode"){
            defaults[k] = parsed[k];
          }
        }
      }
    }
  } catch(e){}
  defaults.geminiApiKey = ""; // Memory-only security guarantee
  return defaults;
}

function savePrefs(p){
  var safeP = Object.assign({}, defaultPrefs(), p || {});
  delete safeP.geminiApiKey;
  delete safeP.deviceLayoutMode;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(safeP));
  } catch(e){}
  applyPrefs(safeP);
}

/* Automatic Chrome Viewport & Device Sensor (zero manual toggles needed) */
function syncChromeViewportAutoDetect(){
  try {
    var vv = global.visualViewport;
    var w = Math.round((vv && vv.width) || global.innerWidth || document.documentElement.clientWidth || 1280);
    var h = Math.round((vv && vv.height) || global.innerHeight || document.documentElement.clientHeight || 800);
    var isTouch = false;
    try {
      isTouch = (navigator.maxTouchPoints > 0) ||
                (global.matchMedia && global.matchMedia("(pointer: coarse)").matches) ||
                (navigator.userAgentData && navigator.userAgentData.mobile);
    } catch(_){}

    var autoDevice = "pc";
    if (w <= 640) autoDevice = "phone";
    else if (w <= 1024) autoDevice = "tablet";
    else if (w <= 1366) autoDevice = "laptop";

    var root = document.documentElement;
    if (root && root.style){
      root.style.setProperty("--app-vw", w + "px");
      root.style.setProperty("--app-vh", h + "px");
    }
    if (document.body){
      document.body.removeAttribute("data-device-mode");
      document.body.setAttribute("data-chrome-device", autoDevice);
      document.body.classList.toggle("is-phone-viewport", autoDevice === "phone");
      document.body.classList.toggle("is-tablet-viewport", autoDevice === "tablet");
      document.body.classList.toggle("is-touch-device", !!isTouch);
    }
    var b = document.getElementById("deviceDetectBadge");
    if (b){
      b.textContent = "⚡ Auto-Fit (" + w + "×" + h + ")";
    }
  } catch(e){}
}

function applyPrefs(p){
  if (!p || typeof p !== "object") p = defaultPrefs();

  /* Update in-memory session */
  if (global.AuthService && global.AuthService.session()){
    var s = global.AuthService.session();
    if (p.userName) s.name = p.userName;
    if (p.userRole) s.role = p.userRole;
  }

  /* Update SeedTuition if present */
  if (global.SeedTuition){
    if (p.university) global.SeedTuition.university = p.university;
    if (p.program) global.SeedTuition.program = p.program;
    if (isFinite(p.tuitionAnnualCAD) && p.tuitionAnnualCAD > 0) global.SeedTuition.annualTuition = Number(p.tuitionAnnualCAD);
    var pct = isFinite(p.tuitionFundedPct) ? Math.max(0, Math.min(100, Number(p.tuitionFundedPct))) : 72;
    global.SeedTuition.fundedRatio = (pct / 100);
  }

  /* Apply Light vs Titan Midnight Dark Mode & Chrome Auto-Fit */
  if (document.body) {
    document.body.classList.toggle("titan-dark-mode", p.displayMode === "dark");
  }
  syncChromeViewportAutoDetect();

  /* Apply theme CSS variables if customized */
  var root = document.documentElement;
  if (root && root.style && typeof root.style.setProperty === "function"){
    if (p.themeColor === "cyan"){
      root.style.setProperty("--primary", "#06b6d4");
      root.style.setProperty("--primary-hover", "#0891b2");
    } else if (p.themeColor === "green"){
      root.style.setProperty("--primary", "#10b981");
      root.style.setProperty("--primary-hover", "#059669");
    } else if (p.themeColor === "purple"){
      root.style.setProperty("--primary", "#8b5cf6");
      root.style.setProperty("--primary-hover", "#7c3aed");
    } else if (p.themeColor === "gold"){
      root.style.setProperty("--primary", "#d97706");
      root.style.setProperty("--primary-hover", "#b45309");
    } else if (p.themeColor === "rose"){
      root.style.setProperty("--primary", "#e11d48");
      root.style.setProperty("--primary-hover", "#be123c");
    } else {
      root.style.setProperty("--primary", "#12B8B0");
      root.style.setProperty("--primary-hover", "#0D9F9A");
    }
  }

  /* Update brand titles on page */
  var bTitles = document.querySelectorAll(".brand-title");
  bTitles.forEach(function(bt){
    bt.innerHTML = U.esc(p.brandName) + '<small>' + U.esc(p.brandEdition) + '</small>';
  });

  /* Re-render current route to reflect updates */
  if (global.Router && typeof global.Router.render === "function"){
    global.Router.render();
  }
}

function openModal(){
  var p = getPrefs();

  var bodyHtml =
    '<div style="display:flex;flex-direction:column;gap:14px;max-height:70vh;overflow-y:auto;padding-right:4px;">' +
      
      /* Section 1: User & Brand */
      '<div style="background:#f8fafc;padding:14px;border-radius:14px;border:1px solid #e2e8f0;">' +
        '<b style="display:block;font-size:13.5px;color:#0f172a;margin-bottom:10px;">👤 1. User Profile &amp; Platform Branding</b>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px;">' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Your Name</label>' +
            '<input class="input" id="cfgUserName" value="' + U.esc(p.userName) + '" placeholder="e.g. Ishan Ahmed">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Platform Brand Name</label>' +
            '<input class="input" id="cfgBrandName" value="' + U.esc(p.brandName) + '" placeholder="e.g. Probaho Remit">' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Section 2: Currency Corridor */
      '<div style="background:#f8fafc;padding:14px;border-radius:14px;border:1px solid #e2e8f0;">' +
        '<b style="display:block;font-size:13.5px;color:#0f172a;margin-bottom:10px;">💱 2. Currency Corridor &amp; Target Country</b>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr));gap:10px;">' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">From Currency</label>' +
            '<select class="input" id="cfgFromCur">' +
              '<option value="USD"' + (p.fromCurrency==="USD"?" selected":"") + '>USD ($)</option>' +
              '<option value="EUR"' + (p.fromCurrency==="EUR"?" selected":"") + '>EUR (€)</option>' +
              '<option value="GBP"' + (p.fromCurrency==="GBP"?" selected":"") + '>GBP (£)</option>' +
              '<option value="CAD"' + (p.fromCurrency==="CAD"?" selected":"") + '>CAD ($)</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">To Currency (Recipient)</label>' +
            '<select class="input" id="cfgToCur">' +
              '<option value="BDT"' + (p.toCurrency==="BDT"?" selected":"") + '>BDT (Bangladesh ৳)</option>' +
              '<option value="CNY"' + (p.toCurrency==="CNY"?" selected":"") + '>CNY (China ¥)</option>' +
              '<option value="INR"' + (p.toCurrency==="INR"?" selected":"") + '>INR (India ₹)</option>' +
              '<option value="PKR"' + (p.toCurrency==="PKR"?" selected":"") + '>PKR (Pakistan ₨)</option>' +
              '<option value="PHP"' + (p.toCurrency==="PHP"?" selected":"") + '>PHP (Philippines ₱)</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Base Exchange Rate</label>' +
            '<input class="input" type="number" step="0.01" id="cfgRate" value="' + p.exchangeRate + '">' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Section 3: Tuition Target */
      '<div style="background:#f8fafc;padding:14px;border-radius:14px;border:1px solid #e2e8f0;">' +
        '<b style="display:block;font-size:13.5px;color:#0f172a;margin-bottom:10px;">🎓 3. Target University &amp; Tuition Plan</b>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px;margin-bottom:10px;">' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">University Name</label>' +
            '<input class="input" id="cfgUniv" value="' + U.esc(p.university) + '" placeholder="e.g. Tsinghua University">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Degree / Program</label>' +
            '<input class="input" id="cfgProg" value="' + U.esc(p.program) + '" placeholder="e.g. Financial Technology">' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:10px;">' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Annual Cost ($ CAD)</label>' +
            '<input class="input" type="number" id="cfgTuition" value="' + p.tuitionAnnualCAD + '">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:12px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Funded Progress (%)</label>' +
            '<input class="input" type="number" min="0" max="100" id="cfgFunded" value="' + p.tuitionFundedPct + '">' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Section 4: Theme Style */
      '<div style="background:#f8fafc;padding:14px;border-radius:14px;border:1px solid #e2e8f0;">' +
        '<b style="display:block;font-size:13.5px;color:#0f172a;margin-bottom:10px;">🎨 4. Interface Mode (Light / Midnight Dark) &amp; Accent Palette</b>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed #cbd5e1;">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;cursor:pointer;"><input type="radio" name="cfgMode" value="light"' + (p.displayMode!=="dark"?" checked":"") + '> ☀️ Crisp Light Mode</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;cursor:pointer;"><input type="radio" name="cfgMode" value="dark"' + (p.displayMode==="dark"?" checked":"") + '> 🌙 Titan Midnight Dark Mode</label>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;cursor:pointer;">' +
            '<input type="radio" name="cfgTheme" value="blue"' + (p.themeColor==="blue"?" checked":"") + '> 🔵 Titan Navy Blue' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;cursor:pointer;">' +
            '<input type="radio" name="cfgTheme" value="cyan"' + (p.themeColor==="cyan"?" checked":"") + '> 💠 Shenzhen Tech Cyan' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;cursor:pointer;">' +
            '<input type="radio" name="cfgTheme" value="green"' + (p.themeColor==="green"?" checked":"") + '> 🟢 Emerald Green' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;cursor:pointer;">' +
            '<input type="radio" name="cfgTheme" value="purple"' + (p.themeColor==="purple"?" checked":"") + '> 🟣 Cyber Violet' +
          '</label>' +
        '</div>' +
      '</div>' +

    '</div>';

  var footHtml =
    '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:8px;flex-wrap:wrap;">' +
      '<button class="btn btn-secondary" data-close="1">Cancel</button>' +
      '<button class="btn btn-primary" id="btnApplyCustomizer" style="font-weight:700;padding:10px 20px;">⚡ Save &amp; Apply Live</button>' +
    '</div>';

  var dlg = global.Modal.open({
    title: "⚡ Platform Customizer & Control Center",
    body: bodyHtml,
    footer: footHtml
  });

  var applyBtn = dlg.querySelector("#btnApplyCustomizer");
  if (applyBtn){
    applyBtn.addEventListener("click", function(){
      var themeEl = dlg.querySelector("input[name='cfgTheme']:checked");
      var modeEl = dlg.querySelector("input[name='cfgMode']:checked");
      var updated = {
        userName: dlg.querySelector("#cfgUserName").value.trim() || "Ishan Ahmed",
        userRole: "Administrator",
        brandName: dlg.querySelector("#cfgBrandName").value.trim() || "Probaho Remit",
        brandEdition: "Titan Edition · 2026",
        fromCurrency: dlg.querySelector("#cfgFromCur").value,
        toCurrency: dlg.querySelector("#cfgToCur").value,
        exchangeRate: parseFloat(dlg.querySelector("#cfgRate").value) || 119.50,
        university: dlg.querySelector("#cfgUniv").value.trim() || "University of Toronto",
        program: dlg.querySelector("#cfgProg").value.trim() || "Computer Science",
        tuitionAnnualCAD: parseFloat(dlg.querySelector("#cfgTuition").value) || 45000,
        tuitionFundedPct: parseFloat(dlg.querySelector("#cfgFunded").value) || 72,
        geminiApiKey: "",
        themeColor: themeEl ? themeEl.value : "blue",
        displayMode: modeEl ? modeEl.value : "light"
      };
      savePrefs(updated);
      global.Modal.close();
      if (global.Toast) global.Toast.show("Platform customized and applied instantly!", "ok");
    });
  }
}

if (global.addEventListener){
  global.addEventListener("resize", syncChromeViewportAutoDetect);
  global.addEventListener("orientationchange", syncChromeViewportAutoDetect);
  if (global.visualViewport && global.visualViewport.addEventListener){
    global.visualViewport.addEventListener("resize", syncChromeViewportAutoDetect);
  }
}

/* Run initial apply on load */
applyPrefs(getPrefs());

global.Customizer = {
  getPrefs: getPrefs,
  savePrefs: savePrefs,
  openModal: openModal,
  syncViewport: syncChromeViewportAutoDetect
};
})(typeof window !== "undefined" ? window : global);

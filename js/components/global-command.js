/* ============================================================
   global-command.js — Universal Global Command Palette (Ctrl+K / Cmd+K),
   22-Currency & Crypto Instant Calculator, 8-Language Localization Hub,
   and Comfort Reading Accessibility Mode.
   ============================================================ */
(function(global){
"use strict";
var U = global.U;

var GLOBAL_LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English",    native: "English" },
  { code: "bn", flag: "🇧🇩", name: "Bengali",    native: "বাংলা" },
  { code: "zh", flag: "🇨🇳", name: "Chinese",    native: "中文" },
  { code: "ar", flag: "🇦🇪", name: "Arabic",     native: "العربية" },
  { code: "es", flag: "🇪🇸", name: "Spanish",    native: "Español" },
  { code: "fr", flag: "🇫🇷", name: "French",     native: "Français" },
  { code: "hi", flag: "🇮🇳", name: "Hindi",      native: "हिन्दी" },
  { code: "ja", flag: "🇯🇵", name: "Japanese",   native: "日本語" }
];

var QUICK_ROUTES = [
  { icon: "🧭", title: "Connected Student Journey (4-Act Pitch)", sub: "End-to-end tuition + family remittance + savings plan", href: "#/student-journey", tags: "student journey plan pitch story 4 months family" },
  { icon: "📊", title: "Evaluation & Measurable Results (117/117)", sub: "Accuracy, Optimizer, Bilingual ScamShield F1 & Roadmap", href: "#/evaluation", tags: "evaluation metrics benchmark f1 accuracy qa" },
  { icon: "🏠", title: "Home & Global Calculator",        sub: "Overview, live calculator & global features",         href: "#/home",               tags: "home landing start calculator" },
  { icon: "📊", title: "User Dashboard",                  sub: "KPI metrics, recent transfers & portfolio overview",  href: "#/dashboard",          tags: "dashboard overview metrics kpi" },
  { icon: "💸", title: "Send Money Globally",             sub: "4-step transfer wizard with 60s FX rate lock",        href: "#/send",               tags: "send transfer money remit pay" },
  { icon: "🪙", title: "Multi-Currency & Crypto Vault",   sub: "16 Fiat/Web3 wallets, QR deposit, swap, APY, cards",  href: "#/payment-vault",      tags: "vault wallet crypto usdt btc eth swap deposit card tax" },
  { icon: "🎓", title: "Custom University Tuition Studio",sub: "Any university, currency, scholarship & installments",href: "#/tuition-planner",    tags: "tuition university student school fee college" },
  { icon: "🤖", title: "Ask Probaho Copilot+ (Nemotron)", sub: "OpenRouter NVIDIA Nemotron 3 Ultra 550B + live tracker",href:"#/copilot",           tags: "copilot ai chat nemotron assistant agent" },
  { icon: "✨", title: "4 Global Luxury UI/UX Designs",   sub: "Geneva Gold, Obsidian Quantum, Emerald & Tokyo Bento",href: "#/design-studio",      tags: "design studio ui ux skin theme luxury" },
  { icon: "⚡", title: "Global Corridor Optimizer",       sub: "Compare 5 providers across 18+ global routes",        href: "#/corridor-optimizer", tags: "optimizer compare wise remitly worldremit fee" },
  { icon: "👥", title: "Saved Beneficiaries",             sub: "Manage verified global bank, bKash, Nagad & Alipay",  href: "#/beneficiaries",      tags: "beneficiaries recipients contacts rahim fatema" },
  { icon: "📈", title: "Live FX Rates & Alerts",          sub: "Multi-currency exchange board & target rate alerts",  href: "#/rates",              tags: "rates fx exchange currency alert" },
  { icon: "🧭", title: "FX Timing Advisor",               sub: "90-day moving averages & buy/hold timing signal",     href: "#/fx-advisor",         tags: "fx advisor chart history signal" },
  { icon: "🛡️", title: "ScamShield Fraud Scanner",        sub: "Explainable rule-based payment safety analysis",      href: "#/scamshield",         tags: "scamshield fraud safety risk security" },
  { icon: "🆔", title: "KYC Verification & Quotas",       sub: "Upgrade from Tier 1 (৳50k) to Tier 2 (৳500k/day)",    href: "#/kyc",                tags: "kyc verification limit quota tier passport" },
  { icon: "📜", title: "Transactions Ledger",             sub: "Searchable cross-border transfer history & receipts", href: "#/transactions",       tags: "transactions history ledger receipts" },
];

var CURRENCY_LIST = [
  "USD", "BDT", "CNY", "EUR", "GBP", "CAD", "AUD", "SGD",
  "AED", "SAR", "JPY", "INR", "PKR", "PHP", "CHF", "BRL", "KRW",
  "USDT", "USDC", "BTC", "ETH", "SOL"
];

function getComfortText(){
  try { return localStorage.getItem("probaho_comfort_text") === "1"; } catch(e){ return false; }
}

function setComfortText(on){
  try {
    if (on) localStorage.setItem("probaho_comfort_text", "1");
    else localStorage.removeItem("probaho_comfort_text");
    if (document.documentElement){
      document.documentElement.style.fontSize = on ? "107%" : "";
    }
  } catch(e){}
}

setComfortText(getComfortText());

function openPalette(){
  if (global.AuthService && !global.AuthService.signedIn()){
    if (global.Toast) global.Toast.show("Please sign in first to use Global Search & Quick Convert.", "warn");
    return;
  }

  var FE = global.FinancialEngine;
  var curLang = (U && U.safeGet) ? U.safeGet("preferred_lang", "en") : "en";
  var curSkin = (global.ModDesignStudio && global.ModDesignStudio.getActiveSkin) ? global.ModDesignStudio.getActiveSkin() : "titan-default";
  var comfortOn = getComfortText();

  var ccyOptsFrom = CURRENCY_LIST.map(function(c){
    return '<option value="' + c + '"' + (c === "USD" ? " selected" : "") + '>' + (FE && FE.symbols && FE.symbols[c] ? FE.symbols[c] + " " : "") + c + '</option>';
  }).join("");
  var ccyOptsTo = CURRENCY_LIST.map(function(c){
    return '<option value="' + c + '"' + (c === "BDT" ? " selected" : "") + '>' + (FE && FE.symbols && FE.symbols[c] ? FE.symbols[c] + " " : "") + c + '</option>';
  }).join("");

  var langButtons = GLOBAL_LANGUAGES.map(function(l){
    var act = l.code === curLang;
    return '<button type="button" class="btn btn-sm ' + (act ? 'btn-primary' : 'btn-secondary') + '" data-set-lang="' + l.code + '" style="border-radius:999px;font-size:11.5px;padding:4px 10px;">' +
      l.flag + ' ' + U.esc(l.native) +
    '</button>';
  }).join("");

  var bodyHtml =
    '<div style="display:flex;flex-direction:column;gap:16px;">' +
      /* 1. Instant Global 22-Currency & Crypto Calculator */
      '<div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;border-radius:16px;padding:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;">' +
          '<span style="font-size:11px;font-weight:800;color:#38bdf8;letter-spacing:0.06em;text-transform:uppercase;">⚡ Instant 22-Currency &amp; Crypto Global Converter</span>' +
          '<span style="font-size:11px;color:#93c5fd;">Americas · Europe · Asia · Middle East · Web3</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:8px;align-items:center;">' +
          '<input type="number" id="gCmdAmt" class="input" value="1000" step="any" style="background:#0b1324;color:#fff;border-color:rgba(255,255,255,0.2);font-weight:800;">' +
          '<select id="gCmdFrom" class="input" style="background:#0b1324;color:#fff;border-color:rgba(255,255,255,0.2);font-weight:700;">' + ccyOptsFrom + '</select>' +
          '<select id="gCmdTo" class="input" style="background:#0b1324;color:#fff;border-color:rgba(255,255,255,0.2);font-weight:700;">' + ccyOptsTo + '</select>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.14);">' +
          '<div id="gCmdResultText" style="font-size:16px;font-weight:900;color:#4ade80;">1,000.00 USD = ৳ 119,500.00 BDT</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button type="button" class="btn btn-sm btn-primary" id="gCmdExecSwap" style="font-size:11.5px;padding:5px 12px;">⇄ Swap in Vault</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" id="gCmdGoSend" style="font-size:11.5px;padding:5px 12px;background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);">🚀 Send Money</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* 2. Global Language & Accessibility Bar */
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">' +
          '<b style="font-size:12.5px;color:#0f172a;">🌍 Global Language &amp; Reading Comfort (8 Languages)</b>' +
          '<button type="button" class="btn btn-sm ' + (comfortOn ? 'btn-primary' : 'btn-secondary') + '" id="gCmdComfortBtn" style="font-size:11px;padding:3px 10px;border-radius:999px;">🔍 Comfort Large Text (A+): ' + (comfortOn ? 'ON' : 'OFF') + '</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + langButtons + '</div>' +
      '</div>' +

      /* 3. Instant Screen & Feature Search */
      '<div>' +
        '<input type="text" id="gCmdSearchInput" class="input" placeholder="🔍 Search any feature, screen, or type a command (e.g. Vault, Tuition, Wise, Admin, UI Skins)..." style="margin-bottom:10px;">' +
        '<div id="gCmdRoutesList" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:8px;max-height:240px;overflow-y:auto;padding-right:4px;"></div>' +
      '</div>' +
    '</div>';

  var footHtml =
    '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">' +
      '<span class="tiny muted">Shortcut: Press <code>Ctrl + K</code> or <code>⌘ + K</code> anywhere on the website</span>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-close="1">Close</button>' +
    '</div>';

  var dlg = global.Modal.open({
    title: "🌍 Global Command Hub · Search, 22-Currency Convert & 8 Languages",
    body: bodyHtml,
    footer: footHtml
  });

  function updateCalc(){
    var amtEl = dlg.querySelector("#gCmdAmt");
    var fromEl = dlg.querySelector("#gCmdFrom");
    var toEl = dlg.querySelector("#gCmdTo");
    var resEl = dlg.querySelector("#gCmdResultText");
    if (!amtEl || !fromEl || !toEl || !resEl || !FE) return;
    var a = parseFloat(amtEl.value) || 0;
    var f = fromEl.value;
    var t = toEl.value;
    try {
      var out = FE.convert(a, f, t, 0);
      resEl.textContent = FE.format(a, f) + " = " + FE.format(out, t);
    } catch(e){
      resEl.textContent = "Select valid currencies";
    }
  }

  function renderRoutes(q){
    var listEl = dlg.querySelector("#gCmdRoutesList");
    if (!listEl) return;
    var query = String(q || "").toLowerCase().trim();
    var matches = QUICK_ROUTES.filter(function(r){
      if (!query) return true;
      return r.title.toLowerCase().indexOf(query) !== -1 ||
             r.sub.toLowerCase().indexOf(query) !== -1 ||
             r.tags.indexOf(query) !== -1;
    });
    listEl.innerHTML = matches.map(function(r){
      return '<a href="' + r.href + '" data-cmd-nav="1" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;text-decoration:none;color:#0f172a;transition:all 0.15s ease;">' +
        '<span style="font-size:18px;line-height:1.2;">' + r.icon + '</span>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:13px;font-weight:800;color:#0f172a;">' + U.esc(r.title) + '</div>' +
          '<div style="font-size:11px;color:#64748b;line-height:1.35;">' + U.esc(r.sub) + '</div>' +
        '</div>' +
      '</a>';
    }).join("");

    listEl.querySelectorAll("[data-cmd-nav]").forEach(function(a){
      a.addEventListener("click", function(){
        global.Modal.close();
      });
    });
  }

  updateCalc();
  renderRoutes("");

  var amtIn = dlg.querySelector("#gCmdAmt");
  var fromIn = dlg.querySelector("#gCmdFrom");
  var toIn = dlg.querySelector("#gCmdTo");
  if (amtIn) amtIn.addEventListener("input", updateCalc);
  if (fromIn) fromIn.addEventListener("change", updateCalc);
  if (toIn) toIn.addEventListener("change", updateCalc);

  var swapBtn = dlg.querySelector("#gCmdExecSwap");
  if (swapBtn){
    swapBtn.addEventListener("click", function(){
      var a = parseFloat(amtIn.value) || 100;
      var f = fromIn.value;
      var t = toIn.value;
      if (global.ProbahoLocalLLM && typeof global.ProbahoLocalLLM.executeAction === "function"){
        var res = global.ProbahoLocalLLM.executeAction({ type: "VAULT_SWAP", amount: a, from: f, to: t });
        if (global.Toast) global.Toast.show(res && res.summary ? res.summary : "Swap executed in Vault!", "ok");
      }
      global.Modal.close();
      location.hash = "#/payment-vault";
    });
  }

  var sendBtn = dlg.querySelector("#gCmdGoSend");
  if (sendBtn){
    sendBtn.addEventListener("click", function(){
      var a = parseFloat(amtIn.value) || 500;
      var f = fromIn.value;
      if (global.AppState) global.AppState.set("amount", a);
      global.Modal.close();
      location.hash = "#/send?amount=" + a + "&currency=" + f;
    });
  }

  var searchIn = dlg.querySelector("#gCmdSearchInput");
  if (searchIn){
    searchIn.addEventListener("input", function(){
      renderRoutes(searchIn.value);
    });
    setTimeout(function(){ searchIn.focus(); }, 60);
  }

  dlg.querySelectorAll("[data-set-lang]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var code = btn.getAttribute("data-set-lang");
      var langObj = GLOBAL_LANGUAGES.filter(function(x){ return x.code === code; })[0] || GLOBAL_LANGUAGES[0];
      if (U && U.safeSet) U.safeSet("preferred_lang", code);
      var lbl = document.getElementById("langLabel");
      if (lbl) lbl.textContent = langObj.native;
      if (global.ProbahoLocalLLM && typeof global.ProbahoLocalLLM.recordEvent === "function"){
        global.ProbahoLocalLLM.recordEvent("LANGUAGE", "Switched Global Language to " + langObj.name + " (" + langObj.native + ")", "Interface localization updated.", location.hash);
      }
      if (global.Toast) global.Toast.show("🌍 Language switched to " + langObj.flag + " " + langObj.name + " (" + langObj.native + ")", "ok");
      global.Modal.close();
      if (global.Router && typeof global.Router.render === "function") global.Router.render();
    });
  });

  var comfortBtn = dlg.querySelector("#gCmdComfortBtn");
  if (comfortBtn){
    comfortBtn.addEventListener("click", function(){
      var next = !getComfortText();
      setComfortText(next);
      comfortBtn.textContent = "🔍 Comfort Large Text (A+): " + (next ? "ON" : "OFF");
      comfortBtn.className = "btn btn-sm " + (next ? "btn-primary" : "btn-secondary");
      if (global.Toast) global.Toast.show(next ? "🔍 Comfort Large Text enabled for easier reading!" : "Standard text size restored.", "ok");
    });
  }
}

/* Bind Ctrl+K / Cmd+K global keyboard shortcut */
if (global.document && global.document.addEventListener){
  global.document.addEventListener("keydown", function(e){
    if ((e.ctrlKey || e.metaKey) && String(e.key || "").toLowerCase() === "k"){
      e.preventDefault();
      openPalette();
    }
  });
}

global.GlobalCommand = {
  open: openPalette,
  languages: GLOBAL_LANGUAGES,
  currencies: CURRENCY_LIST
};
})(typeof window !== "undefined" ? window : global);

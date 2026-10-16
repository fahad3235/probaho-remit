/* ============================================================
   design-studio.js — Global UI/UX Design & Full-Stack Architecture Studio (#/design-studio)
   Provides 4 complete, interactive, production-grade Frontend + Backend sample designs:
   1. Geneva Private Wealth (Swiss Ivory & Sapphire Gold)
   2. Obsidian Quantum Web3 (Deep Space Glass & Neon Cyan)
   3. Singapore Emerald Executive (Jade & Frosted Pearl)
   4. Tokyo Neo-Bento Super-App (Airy Snow & Electric Violet-Rose)
   ============================================================ */
(function(global){
"use strict";
var U = global.U;

var SKIN_STORAGE_KEY = "probaho_active_ui_skin_v1";

var DESIGN_SAMPLES = [
  {
    id: "geneva-gold",
    number: "Sample Design 01",
    name: "Geneva Private Wealth",
    subtitle: "Swiss Alabaster Ivory, Royal Sapphire & Imperial Gold",
    inspiration: "Stripe Treasury · Pictet Swiss Private Bank · Wise Priority",
    mode: "light",
    themeColor: "gold",
    badge: "LUXURY PRIVATE BANKING",
    palette: ["#FAF7F2", "#FFFFFF", "#1E3A8A", "#B45309", "#D97706"],
    cardPreviewBg: "linear-gradient(135deg, #1E3A8A 0%, #0F172A 65%, #78350F 100%)",
    accentHex: "#B45309",
    primaryHex: "#1E3A8A",
    surfaceHex: "#FAF7F2",
    uxHighlights: [
      "Warm Swiss alabaster canvas (#FAF7F2) eliminates eye strain during institutional treasury and tuition planning sessions.",
      "High-contrast Royal Sapphire (#1E3A8A) primary actions paired with Champagne Gold (#B45309) yield & verification badges.",
      "Multi-layered ambient card elevation with 18px editorial corner radii and tabular numeric alignment."
    ],
    frontendStack: "CSS Custom Properties (--bg: #FAF7F2, --primary: #1E3A8A, --teal: #B45309) + Responsive Bento Grid + SVG Radial Gauges",
    backendStack: "Supabase PostgreSQL Multi-Currency ACID Ledger + Fedwire/SWIFT ISO-20022 Reconciliation + OpenRouter Nemotron 3 Ultra (550B) Copilot+"
  },
  {
    id: "obsidian-quantum",
    number: "Sample Design 02",
    name: "Obsidian Quantum Web3",
    subtitle: "Deep Space Glassmorphism, Electric Cyan & Royal Indigo",
    inspiration: "Revolut Ultra · Linear App · Phantom Web3 Vault",
    mode: "dark",
    themeColor: "cyan",
    badge: "DARK GLASS WEB3 VAULT",
    palette: ["#050814", "#0B1226", "#06B6D4", "#6366F1", "#10B981"],
    cardPreviewBg: "linear-gradient(135deg, #050814 0%, #0F1E42 55%, #06B6D4 100%)",
    accentHex: "#06B6D4",
    primaryHex: "#38BDF8",
    surfaceHex: "#0B1226",
    uxHighlights: [
      "True OLED/Deep-Space Obsidian backdrop (#050814) with translucent frosted glass cards (backdrop-filter: blur(20px)).",
      "Luminous 1px neon cyan borders (rgba(56,189,248,0.25)) that highlight active Web3 crypto sub-wallets (USDT, BTC, ETH) and live FX charts.",
      "Zero-glare dark mode engineered for 24/7 crypto trading, on-chain QR scanning, and Admin liquidity pool monitoring."
    ],
    frontendStack: "Dark Glassmorphic Token System (--bg: #050814, --surface: rgba(11,18,38,0.88)) + Real-Time WebSocket/Event Stream UI",
    backendStack: "Multi-Chain HD Wallet Address Indexer (TRC20/ERC20/BEP20/Bitcoin) + Atomic Swap Engine + OpenRouter Nemotron 550B Agentic Executor"
  },
  {
    id: "emerald-sovereign",
    number: "Sample Design 03",
    name: "Singapore Emerald Executive",
    subtitle: "Frosted Pearl White, Sovereign Jade & Forest Emerald",
    inspiration: "Standard Chartered Priority · Wise Green · MAS SGFinDex",
    mode: "light",
    themeColor: "green",
    badge: "GLOBAL REMITTANCE & TUITION",
    palette: ["#F2FAF6", "#FFFFFF", "#047857", "#10B981", "#065F46"],
    cardPreviewBg: "linear-gradient(135deg, #022C22 0%, #047857 60%, #10B981 100%)",
    accentHex: "#10B981",
    primaryHex: "#047857",
    surfaceHex: "#F2FAF6",
    uxHighlights: [
      "Refreshing Frosted Pearl & Mint canvas (#F2FAF6) that communicates immediate financial safety, savings, and regulatory compliance.",
      "Deep Forest Emerald (#047857) call-to-action buttons with instant visual hierarchy for 'Best Value' provider badges and 2.5% BD Cash Incentive.",
      "Ideal for cross-border family remittances (bKash, Nagad, Alipay, WeChat Pay) and university tuition milestone tracking."
    ],
    frontendStack: "Sovereign Emerald Token Palette (--bg: #F2FAF6, --primary: #047857) + 4-Step Guided Wizard + ScamShield Risk Dial",
    backendStack: "Canonical Fee-Agreement Quote Engine (FinancialEngine.canonicalQuote) + Bangladesh Bank 2.5% Incentive Tax Certificate Generator"
  },
  {
    id: "tokyo-bento",
    number: "Sample Design 04",
    name: "Tokyo Neo-Bento Super-App",
    subtitle: "Airy Snow Canvas, Electric Violet & Rose-Quartz Bento Grid",
    inspiration: "Apple Pay · Monzo · PayPay / Alipay+ Super-App",
    mode: "light",
    themeColor: "purple",
    badge: "NEXT-GEN SUPER-APP BENTO",
    palette: ["#FDFBFF", "#FFFFFF", "#7C3AED", "#E11D48", "#9333EA"],
    cardPreviewBg: "linear-gradient(135deg, #831843 0%, #6D28D9 55%, #4F46E5 100%)",
    accentHex: "#E11D48",
    primaryHex: "#7C3AED",
    surfaceHex: "#FDFBFF",
    uxHighlights: [
      "Tactile 26px super-rounded Bento-grid architecture with pill-shaped buttons (border-radius: 999px) and vibrant Rose-to-Violet gradients.",
      "Designed for thumb-friendly mobile & tablet super-app navigation alongside spacious desktop multi-widget dashboards.",
      "Puts Virtual Visa/Mastercard cards, P2P Payment Links, and Ask Probaho Copilot+ front and center."
    ],
    frontendStack: "Neo-Bento Spatial System (26px radius cards, pill CTAs, fluid minmax(min(100%,280px),1fr) grids) + Mobile Bottom Dock",
    backendStack: "Instant P2P Payment Link & QR Invoice Service + Virtual Card Issuing Engine + Real-Time Copilot+ State Mutation Stream"
  }
];

var activeArchTab = "frontend"; // frontend | database | api

function getActiveSkin(){
  try {
    return localStorage.getItem(SKIN_STORAGE_KEY) || "titan-default";
  } catch (e) {
    return "titan-default";
  }
}

function applySkin(skinId, silent){
  try {
    if (!skinId || skinId === "titan-default"){
      localStorage.removeItem(SKIN_STORAGE_KEY);
      if (document.body){
        document.body.removeAttribute("data-ui-skin");
        document.body.classList.remove("titan-dark-mode");
      }
    } else {
      localStorage.setItem(SKIN_STORAGE_KEY, skinId);
      var found = DESIGN_SAMPLES.filter(function(d){ return d.id === skinId; })[0];
      if (document.body){
        document.body.setAttribute("data-ui-skin", skinId);
        document.body.classList.toggle("titan-dark-mode", !!(found && found.mode === "dark"));
      }
      if (found && global.Customizer && typeof global.Customizer.getPrefs === "function"){
        var p = global.Customizer.getPrefs();
        p.displayMode = found.mode;
        p.themeColor = found.themeColor;
        try { localStorage.setItem("titan_user_customizations_v1", JSON.stringify(p)); } catch(e){}
      }
    }
    if (!silent){
      if (global.ProbahoLocalLLM && typeof global.ProbahoLocalLLM.recordEvent === "function"){
        global.ProbahoLocalLLM.recordEvent(
          "UI/UX SKIN",
          "Applied Global UI/UX Design: " + skinId,
          "Live website theme transformed to '" + skinId + "' across all 36 User & Admin screens.",
          "#/design-studio"
        );
      }
      if (global.Toast){
        global.Toast.show("✨ Applied '" + skinId + "' UI/UX design across the entire website!", "ok");
      }
    }
  } catch (e) {}
}

/* Auto-apply saved skin on boot */
applySkin(getActiveSkin(), true);

function render(){
  var el = U.$("#view");
  if (!el) return;
  var curSkin = getActiveSkin();

  var cardsHtml = DESIGN_SAMPLES.map(function(d){
    var isCurrent = curSkin === d.id;
    var swatches = d.palette.map(function(hex){
      return '<span title="' + hex + '" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;background:#f8fafc;border:1px solid #cbd5e1;padding:3px 8px;border-radius:999px;color:#0f172a;">' +
        '<i style="width:12px;height:12px;border-radius:50%;background:' + hex + ';border:1px solid rgba(0,0,0,0.15);display:inline-block;"></i>' +
        '<span class="mono">' + hex + '</span>' +
      '</span>';
    }).join("");

    return '<div class="card" style="padding:0;overflow:hidden;border:2px solid ' + (isCurrent ? d.accentHex : 'var(--line,#e2e8f0)') + ';display:flex;flex-direction:column;">' +
      /* Interactive Live Mockup Header */
      '<div style="background:' + d.cardPreviewBg + ';padding:22px 20px;color:#fff;position:relative;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;">' +
          '<span style="font-size:10.5px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;background:rgba(255,255,255,0.16);padding:4px 10px;border-radius:999px;backdrop-filter:blur(6px);">' + U.esc(d.number) + ' · ' + U.esc(d.badge) + '</span>' +
          (isCurrent ? '<span style="font-size:10.5px;font-weight:800;background:#10b981;color:#fff;padding:4px 10px;border-radius:999px;">✓ ACTIVE LIVE</span>' : '') +
        '</div>' +
        '<h2 style="font-size:21px;font-weight:900;margin:0 0 4px;color:#fff;letter-spacing:-0.02em;">' + U.esc(d.name) + '</h2>' +
        '<p style="font-size:12.5px;color:rgba(255,255,255,0.85);margin:0 0 16px;">' + U.esc(d.subtitle) + '</p>' +

        /* Mini Interactive UI Component Preview inside the card */
        '<div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.22);border-radius:14px;padding:12px 14px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;">' +
          '<div>' +
            '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.75);font-weight:700;">Multi-Currency &amp; Web3 Vault</div>' +
            '<div style="font-size:18px;font-weight:900;color:#fff;margin-top:2px;">$48,493.24 <span style="font-size:11px;color:#4ade80;font-weight:700;">+8.2% APY</span></div>' +
            '<div style="font-size:10.5px;color:rgba(255,255,255,0.8);margin-top:2px;">USD · BDT · CNY · USDT · BTC · ETH</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span style="display:inline-block;background:#fff;color:#0f172a;font-size:11px;font-weight:800;padding:6px 12px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,0.2);">1 USD = 120.15 ৳</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Card Body */
      '<div style="padding:20px;display:flex;flex-direction:column;gap:14px;flex:1;">' +
        '<div style="font-size:12px;color:var(--ink-2,#475569);font-weight:600;"><b>Design Inspiration:</b> ' + U.esc(d.inspiration) + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + swatches + '</div>' +
        '<ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--ink-2,#334155);line-height:1.55;display:grid;gap:6px;">' +
          d.uxHighlights.map(function(h){ return '<li>' + U.esc(h) + '</li>'; }).join("") +
        '</ul>' +
        '<div style="background:var(--surface-2,#f8fafc);border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:10px 12px;font-size:11.5px;line-height:1.5;">' +
          '<div><b style="color:var(--ink,#0f172a);">Frontend UX:</b> ' + U.esc(d.frontendStack) + '</div>' +
          
        '</div>' +

        /* Action Buttons */
        '<div style="margin-top:auto;padding-top:8px;display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn ' + (isCurrent ? 'btn-secondary' : 'btn-primary') + '" data-apply-skin="' + U.esc(d.id) + '" style="flex:1;justify-content:center;font-weight:800;">' +
            (isCurrent ? '✓ Currently Active Skin' : '✨ Apply Design Live') +
          '</button>' +
          '<a href="#/payment-vault" class="btn btn-secondary btn-sm" data-preview-vault="' + U.esc(d.id) + '" style="text-decoration:none;font-weight:700;">Preview in Vault →</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");

  var archContentHtml = "";
  if (activeArchTab === "frontend"){
    archContentHtml =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;">' +
        '<div style="background:#0f172a;color:#f8fafc;border-radius:14px;padding:16px;">' +
          '<div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;margin-bottom:6px;">1. Adaptive CSS Token Engine (css/luxury-skins.css)</div>' +
          '<pre class="mono" style="margin:0;font-size:11.5px;line-height:1.5;color:#e2e8f0;white-space:pre-wrap;">body[data-ui-skin="geneva-gold"] {\n  --bg: #FAF7F2;\n  --surface: #FFFFFF;\n  --primary: #1E3A8A;\n  --teal: #B45309;\n}\nbody[data-ui-skin="obsidian-quantum"] {\n  --bg: #050814;\n  --surface: rgba(11,18,38,0.88);\n  --primary: #06B6D4;\n}</pre>' +
        '</div>' +
        '<div style="background:#0f172a;color:#f8fafc;border-radius:14px;padding:16px;">' +
          '<div style="font-size:11px;font-weight:800;color:#4ade80;text-transform:uppercase;margin-bottom:6px;">2. Universal Multi-Device Breakpoints (PC, Laptop, Tablet, Phone)</div>' +
          '<pre class="mono" style="margin:0;font-size:11.5px;line-height:1.5;color:#e2e8f0;white-space:pre-wrap;">• >= 1440px: Ultrawide 1360px 4-col Bento\n• 1025–1439px: Laptop fluid split panels\n• 640–1024px: Tablet drawer + Admin Quick Bar\n• 320–639px: Mobile 6-tab dock + 16px zoom-safe inputs + bottom-sheet Copilot+</pre>' +
        '</div>' +
      '</div>';
  } else if (activeArchTab === "database"){
    archContentHtml =
      '<div style="background:#0f172a;color:#f8fafc;border-radius:14px;padding:16px;">' +
        '<div style="font-size:11px;font-weight:800;color:#fbbf24;text-transform:uppercase;margin-bottom:6px;">Production Supabase PostgreSQL Multi-Currency &amp; Crypto Vault Schema (supabase/schema.sql)</div>' +
        '<pre class="mono" style="margin:0;font-size:11.5px;line-height:1.5;color:#e2e8f0;white-space:pre-wrap;">CREATE TABLE public.wallet_balances (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,\n  currency VARCHAR(10) NOT NULL, -- USD, BDT, CNY, USDT, BTC, ETH\n  balance NUMERIC(28, 8) DEFAULT 0 CHECK (balance >= 0),\n  locked_in_vault NUMERIC(28, 8) DEFAULT 0 CHECK (locked_in_vault >= 0),\n  available_balance NUMERIC(28, 8) GENERATED ALWAYS AS (balance - locked_in_vault) STORED,\n  UNIQUE(wallet_id, currency)\n);</pre>' +
      '</div>';
  } else {
    archContentHtml =
      '<div style="background:#0f172a;color:#f8fafc;border-radius:14px;padding:16px;">' +
        '<div style="font-size:11px;font-weight:800;color:#c084fc;text-transform:uppercase;margin-bottom:6px;">OpenRouter NVIDIA Nemotron 3 Ultra (550B) Copilot+ &amp; Settlement APIs (netlify/functions/*)</div>' +
        '<pre class="mono" style="margin:0;font-size:11.5px;line-height:1.5;color:#e2e8f0;white-space:pre-wrap;">POST https://openrouter.ai/api/v1/chat/completions\nHeaders: Authorization: Bearer $OPENROUTER_API_KEY\nBody: {\n  "model": "nvidia/nemotron-3-ultra-550b-a55b",\n  "messages": [ { "role": "system", "content": buildLiveWebsiteSnapshot() }, ... ]\n}\n// Plus <agent_action> real-time execution for Vault Deposits, Swaps, Staking & Tuition</pre>' +
      '</div>';
  }

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      /* Header Banner */
      '<div class="page-head" style="text-align:center;max-width:860px;margin:0 auto 26px;">' +
        '<div style="display:inline-flex;align-items:center;gap:8px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;padding:5px 14px;border-radius:999px;font-size:11.5px;font-weight:800;margin-bottom:10px;">' +
          '<span>✨ GLOBAL FINTECH UI/UX DESIGN STUDIO · 4 COMPLETE FRONTEND + BACKEND DESIGNS</span>' +
        '</div>' +
        '<h1 class="page-title">Premium Global UI/UX Sample Designs</h1>' +
        '<p class="page-sub">Choose from 4 award-winning global fintech &amp; Web3 UI/UX skins below. Click <b>"✨ Apply Design Live"</b> on any sample to transform the entire website immediately, or reset to the default Titan Royal theme.</p>' +

        /* Quick Skin Switcher Pill Bar */
        '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:16px;">' +
          '<button type="button" class="btn btn-sm ' + (curSkin === "titan-default" ? "btn-primary" : "btn-secondary") + '" data-apply-skin="titan-default" style="border-radius:999px;">🔵 Default Titan Royal</button>' +
          DESIGN_SAMPLES.map(function(d){
            return '<button type="button" class="btn btn-sm ' + (curSkin === d.id ? "btn-primary" : "btn-secondary") + '" data-apply-skin="' + U.esc(d.id) + '" style="border-radius:999px;">✨ ' + U.esc(d.name) + '</button>';
          }).join("") +
        '</div>' +
      '</div>' +

      /* 4 Sample Design Cards Grid */
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 300px), 1fr));gap:22px;margin-bottom:32px;">' +
        cardsHtml +
      '</div>' +


      /* 12-Screen Full-Website Interactive Map ("The Full Website in One Picture") */
      '<div class="card" style="padding:24px;margin-bottom:28px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
          '<div>' +
            '<span class="badge badge-blue" style="margin-bottom:6px;">THE FULL WEBSITE IN ONE PICTURE · 12 CORE SCREENS</span>' +
            '<h2 style="font-size:19px;font-weight:900;margin:0;">Interactive 12-Screen Platform Map (Active Skin: <code>' + U.esc(curSkin) + '</code>)</h2>' +
            '<p class="muted small" style="margin:2px 0 0;">Click any of the 12 screens below to jump directly to that live module in your currently selected UI/UX design skin.</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;">' +
          [
            { num:"01", label:"Sign-In Gate", sub:"High-security mandatory auth gate", href:"#/sign-in" },
            { num:"02", label:"Landing → Security Gate", sub:"Zero-bypass route protection", href:"#/" },
            { num:"03", label:"Landing — Send Money Home", sub:"Hero + live 18-corridor calculator", href:"#/home" },
            { num:"04", label:"Dashboard — Student", sub:"KPI strip, quick send & FX board", href:"#/dashboard" },
            { num:"05", label:"Send Money — Step 1", sub:"4-step guided transfer & 60s lock", href:"#/send" },
            { num:"06", label:"Corridor Optimizer", sub:"5 providers & canonical fee math", href:"#/corridor-optimizer" },
            { num:"07", label:"Tuition Planner", sub:"100% custom university & BDT budget", href:"#/tuition-planner" },
            { num:"08", label:"ScamShield", sub:"Explainable fraud score & rules", href:"#/scamshield" },
            { num:"09", label:"Payment Vault & Crypto", sub:"16 Fiat/Web3 wallets, QR, Swap, APY", href:"#/payment-vault" },
            { num:"10", label:"Transactions Ledger", sub:"Searchable transfers & receipts", href:"#/transactions" },
            { num:"11", label:"Copilot+ (Nemotron 550B)", sub:"OpenRouter AI + real-time tracker", href:"#/copilot" },
            { num:"12", label:"Evaluation & Metrics", sub:"117/117 QA & ScamShield F1 benchmark", href:"#/evaluation" }
          ].map(function(s){
            return '<a href="' + s.href + '" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:var(--surface-2,#f8fafc);border:1px solid var(--line,#e2e8f0);text-decoration:none;color:var(--ink,#0f172a);transition:transform 0.15s ease;">' +
              '<span class="mono" style="width:32px;height:32px;border-radius:9px;background:var(--primary,#2563eb);color:#fff;display:grid;place-items:center;font-size:12px;font-weight:900;flex-shrink:0;">' + s.num + '</span>' +
              '<div style="min-width:0;">' +
                '<div style="font-size:13px;font-weight:800;color:var(--ink,#0f172a);">' + U.esc(s.label) + '</div>' +
                '<div style="font-size:11px;color:var(--ink-2,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + U.esc(s.sub) + '</div>' +
              '</div>' +
            '</a>';
          }).join("") +
        '</div>' +
      '</div>' +

      
    '</div>';

  el.querySelectorAll("[data-apply-skin]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var sId = btn.getAttribute("data-apply-skin");
      applySkin(sId, false);
      render();
    });
  });

  el.querySelectorAll("[data-preview-vault]").forEach(function(a){
    a.addEventListener("click", function(){
      var sId = a.getAttribute("data-preview-vault");
      applySkin(sId, false);
    });
  });

  el.querySelectorAll("[data-arch-tab]").forEach(function(btn){
    btn.addEventListener("click", function(){
      activeArchTab = btn.getAttribute("data-arch-tab");
      render();
    });
  });
}

global.ModDesignStudio = {
  render: render,
  applySkin: applySkin,
  getActiveSkin: getActiveSkin,
  samples: DESIGN_SAMPLES,
  meta: { title: "Global UI/UX Design Studio", nav: "UI Designs" }
};
})(typeof window !== "undefined" ? window : global);

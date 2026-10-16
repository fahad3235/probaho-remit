/**
 * js/modules/home.js — Ungated Global Public Landing Page with Multi-Currency Calculator,
 * Bangla/English Toggle, Admin Content Override Integration, How It Works, and KYC Tiers.
 */
(function(global){
"use strict";

var U = global.U;

var I18N = {
  en: {
    heroTag: "Probaho Remit · Global Titan Edition",
    titleLine1: "Smarter Transfers.",
    titleLine2: "Safer Journeys.",
    titleLine3: "Brighter Futures.",
    subtitle: "Global AI-powered cross-border financial companion for international students, expat families, and global earners across 18+ corridors. Lower fees, 60s locked rates, and ScamShield fraud defense.",
    getStarted: "Compare Global Rates & Send →",
    watchDemo: "▶ Platform Tour",
    pillLowFee: "Low & Transparent Fees",
    pillLowFeeSub: "0% promo on direct wallets",
    pillFast: "Global Instant Rails",
    pillFastSub: "Minutes to wallets & SEPA/FPS",
    pillSecurity: "ScamShield AI Defense",
    pillSecuritySub: "10-rule heuristic protection",
    calcTitle: "Global Cross-Border Calculator",
    calcBadge: "60s Rate Lock",
    calcSendLabel: "You send",
    calcRecvLabel: "Recipient gets (estimated)",
    calcDelivery: "Delivery: Instant to Wallets / 1–2d Bank (Simulated)",
    calcFee: "Fee: 0% promo on direct wallet routes",
    calcBtn: "Compare 5 Providers & Send →",
    trustStudents: "Built for international students, global professionals & expat families worldwide",
    modulesTag: "COMPLETE GLOBAL FINTECH ECOSYSTEM",
    modulesTitle: "Ten Integrated Cross-Border Financial Modules",
    modulesSubtitle: "From real-time multi-corridor provider rankings to 4-year university tuition planning and local ScamShield fraud analysis.",
    howItWorksTag: "HOW IT WORKS",
    howItWorksTitle: "Three Simple Steps to Send Money Worldwide",
    step1Title: "1. Verify Identity (KYC)",
    step1Desc: "Select your origin country and upload your Passport or National ID with a quick liveness check.",
    step2Title: "2. Compare & Lock Rate",
    step2Desc: "Compare 5 global providers side-by-side, lock your exchange rate for 60 seconds, and run ScamShield.",
    step3Title: "3. Track & Download Receipt",
    step3Desc: "Track settlement milestones in real time from funding to payout, and print your itemized receipt.",
    kycTag: "GLOBAL COMPLIANCE TIERS",
    kycTitle: "Tiered Daily Quotas Modeled on International Standards",
    kycBasicTitle: "Tier 1: Standard Verification",
    kycBasicLimit: "৳50,000 / Day (~$500 USD)",
    kycBasicDesc: "National ID or Driving License + Phone OTP. Instant automated check for family support and living allowances.",
    kycFullTitle: "Tier 2: Enhanced Global Tier",
    kycFullLimit: "৳500,000 / Day (~$5,000 USD)",
    kycFullDesc: "Passport + Biometric Liveness + University Offer Letter. Designed for semester tuition & high-value wires.",
    ctaTag: "START YOUR GLOBAL TRANSFER",
    ctaTitle: "Experience Transparent Cross-Border Finance Today",
    ctaDesc: "Zero hidden spread markups. 18+ global corridors. 100% client-side interactive simulation.",
    trustBlockTitle: "Institutional Compliance & Competition Disclosure",
    trustEntity: "Probaho Remit Global (Titan Edition Prototype)",
    trustLicense: "2026 Shenzhen International FinTech Competition · Topic C",
    trustAddress: "Global Corridors: Americas, Europe, Asia-Pacific, Middle East & South Asia",
    trustSupport: "24/7 Demo Helpdesk via #/help"
  },
  bn: {
    heroTag: "প্রবাহ রেমিট · গ্লোবাল টাইটান এডিশন",
    titleLine1: "সহজ রেমিট্যান্স।",
    titleLine2: "নিরাপদ যাত্রা।",
    titleLine3: "উজ্জ্বল ভবিষ্যৎ।",
    subtitle: "আন্তর্জাতিক শিক্ষার্থী, প্রবাসী পরিবার ও বিশ্বজনীন অর্জকদের জন্য ১৮+ বৈশ্বিক করিডোরে ক্রস-বর্ডার আর্থিক সহযোগী। স্বল্প ফি, ৬০ সেকেন্ড লকড রেট এবং স্ক্যামশিল্ড নিরাপত্তা।",
    getStarted: "রেট তুলনা করুন ও পাঠান →",
    watchDemo: "▶ প্ল্যাটফর্ম ট্যুর",
    pillLowFee: "স্বচ্ছ ও সর্বনিম্ন ফি",
    pillLowFeeSub: "ওয়ালেটে ০% প্রোমো ফি",
    pillFast: "দ্রুত বৈশ্বিক ডেলিভারি",
    pillFastSub: "ওয়ালেট ও ব্যাংকে দ্রুত জমা",
    pillSecurity: "স্ক্যামশিল্ড এআই সুরক্ষা",
    pillSecuritySub: "১০টি রুল-ভিত্তিক যাচাই",
    calcTitle: "গ্লোবাল রেমিট্যান্স ক্যালকুলেটর",
    calcBadge: "৬০ সে. রেট লক",
    calcSendLabel: "আপনি পাঠাবেন",
    calcRecvLabel: "প্রাপক পাবেন (আনুমানিক)",
    calcDelivery: "ডেলিভারি: ওয়ালেট ও ব্যাংকে জমা (সিমুলেটেড)",
    calcFee: "ফি: সরাসরি ওয়ালেটে প্ল্যাটফর্ম ফি শূন্য",
    calcBtn: "৫টি প্রোভাইডার তুলনা করুন →",
    trustStudents: "বিশ্বজুড়ে আন্তর্জাতিক শিক্ষার্থী, পেশাজীবী ও প্রবাসী পরিবারের জন্য নির্মিত",
    modulesTag: "সম্পূর্ণ ফিনটেক ইকোসিস্টেম",
    modulesTitle: "দশটি সমন্বিত গ্লোবাল ফিনটেক মডিউল",
    modulesSubtitle: "স্বচ্ছ করিডোর চার্জ থেকে শুরু করে বিশ্ববিদ্যালয়ের টিউশন প্ল্যানার ও এআই স্ক্যামশিল্ড সুরক্ষা।",
    howItWorksTag: "কার্যপদ্ধতি",
    howItWorksTitle: "বিশ্বজুড়ে টাকা পাঠানোর ৩টি সহজ ধাপ",
    step1Title: "১. পরিচয় যাচাই (KYC)",
    step1Desc: "আপনার পাসপোর্ট বা এনআইডি এবং লাইভনেস সেলফি দিয়ে দ্রুত যাচাই সম্পন্ন করুন।",
    step2Title: "২. রেট লক ও তুলনা",
    step2Desc: "৫টি প্রোভাইডারের রেট তুলনা করুন, ৬০ সেকেন্ডের জন্য রেট লক করুন এবং স্ক্যামশিল্ড চেক করুন।",
    step3Title: "৩. লাইভ ট্র্যাকিং ও রসিদ",
    step3Desc: "টাকা পাঠানো থেকে প্রাপকের একাউন্টে পৌঁছানো পর্যন্ত ট্র্যাক করুন এবং পিডিএফ রসিদ প্রিন্ট করুন।",
    kycTag: "লেনদেন সীমা ও নীতিমালা",
    kycTitle: "স্তরভিত্তিক বৈশ্বিক লেনদেন সীমা",
    kycBasicTitle: "টায়ার ১: স্ট্যান্ডার্ড ভেরিফিকেশন",
    kycBasicLimit: "৫০,০০০ টাকা / দিন (~$500 USD)",
    kycBasicDesc: "জাতীয় পরিচয়পত্র (NID) বা ড্রাইভিং লাইসেন্স দিয়ে তাৎক্ষণিক যাচাই। পরিবারের খরচের জন্য উপযোগী।",
    kycFullTitle: "টায়ার ২: ফুল গ্লোবাল ভেরিফিকেশন",
    kycFullLimit: "৫,০০,০০০ টাকা / দিন (~$5,000 USD)",
    kycFullDesc: "পাসপোর্ট ও বিশ্ববিদ্যালয়ের ভর্তি প্রমাণপত্র। আন্তর্জাতিক টিউশন ফি প্রেরণের জন্য উপযোগী।",
    ctaTag: "নিরাপদ রেমিট্যান্স শুরু করুন",
    ctaTitle: "আজই শুরু করুন সম্পূর্ণ স্বচ্ছ বৈশ্বিক লেনদেন",
    ctaDesc: "কোনো গোপন চার্জ নেই। ১৮+ আন্তর্জাতিক করিডোর। সম্পূর্ণ ইন্টারঅ্যাক্টিভ ডেমো।",
    trustBlockTitle: "প্রাতিষ্ঠানিক তথ্য ও প্রোটোটাইপ পরিচিতি",
    trustEntity: "প্রবাহ রেমিট গ্লোবাল (টাইটান এডিশন প্রোটোটাইপ)",
    trustLicense: "২০২৬ শেনজেন ইন্টারন্যাশনাল ফিনটেক কম্পিটিশন · টপিক সি",
    trustAddress: "বৈশ্বিক করিডোর: আমেরিকা, ইউরোপ, এশিয়া-প্যাসিফিক, মধ্যপ্রাচ্য ও দক্ষিণ এশিয়া",
    trustSupport: "যোগাযোগ করুন #/help পেজের মাধ্যমে"
  }
};

var MODULES = [
  { key:"optimizer", route:"#/corridor-optimizer", icon:"sliders", title:"Transfer Optimizer", desc:"Compare 5 global providers across 18+ corridors with transparent fees, spreads and best value ranking." },
  { key:"fees", route:"#/fees", icon:"tag", title:"Fee Schedules", desc:"Illustrative corridor fee %, FX margins, and global payout channels." },
  { key:"corridors", route:"#/corridors", icon:"globe", title:"Global Corridors", desc:"18+ supported routes across the US, UK, EU, Canada, Australia, China, Singapore, UAE, India, Philippines & Bangladesh." },
  { key:"tuition", route:"#/tuition-planner", icon:"book", title:"Tuition Planner", desc:"Multi-year global university tuition calculator (Harvard, MIT, Oxford, Toronto, Tsinghua, NUS) with funding dial." },
  { key:"scamshield", route:"#/scamshield", icon:"shield", title:"ScamShield", desc:"Safety Score meter (higher = safer), recent alerts, safety tips and 10-rule heuristic scam scanner." },
  { key:"rates", route:"#/rates", icon:"chart", title:"Rates & FX Board", desc:"Multi-currency exchange rate board (USD, EUR, GBP, CAD, AUD, CNY, SGD, AED, SAR, MYR, INR, PHP) with alerts." },
  { key:"fx", route:"#/fx-advisor", icon:"chart", title:"FX Timing Advisor", desc:"90-day seeded FX series with 7-day moving averages and SEND NOW / WAIT / HOLD signals." },
  { key:"vault", route:"#/payment-vault", icon:"vault", title:"Payment & Document Vault", desc:"Track transfer timelines, print itemized receipts, file disputes, and manage verified identity documents." },
  { key:"copilot", route:"#/ask-probaho", icon:"chat", title:"Ask Probaho (AI Copilot)", desc:"On-device AI financial assistant grounded in your profile, beneficiaries, corridors, and scam rules." },
  { key:"journey", route:"#/student-journey", icon:"book", title:"Student Journey", desc:"End-to-end 4-month student tuition sinking fund, living budget, and family remittance planner." }
];

function render(){
  var el = U.$("#view");
  if (!el) return;
  var lang = U.safeGet('preferred_lang', 'en');
  var t = I18N[lang] || I18N.en;
  var contentOver = (global.AppState && global.AppState.content && global.AppState.content()) || {};
  var adminOver = (global.AppState && global.AppState.get("admin") && global.AppState.get("admin").content) || {};

  var corridors = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
  var activeCorrId = (global.AppState && global.AppState.get("corridorId")) || "us-dhaka";
  var activeCorr = corridors.find(function(c){ return c.id === activeCorrId; }) || corridors[0] || {
    id:"us-dhaka", label:"United States → Bangladesh", sendCcy:"USD", receiveCcy:"BDT", midRate:119.50, flagFrom:"🇺🇸", flagTo:"🇧🇩"
  };

  /* Respect Admin Content Overrides if set */
  var hasCustomHeroTitle = typeof adminOver.heroTitle === "string" && adminOver.heroTitle.trim().length > 0;
  var heroHeadingHtml = hasCustomHeroTitle
    ? U.esc(adminOver.heroTitle)
    : (t.titleLine1 + '<br>' + t.titleLine2 + '<br><span class="gradient-text">' + t.titleLine3 + '</span>');
  var heroSubText = (typeof adminOver.heroSub === "string" && adminOver.heroSub.trim()) ? adminOver.heroSub : t.subtitle;
  var primaryCtaText = (typeof adminOver.ctaPrimary === "string" && adminOver.ctaPrimary.trim()) ? adminOver.ctaPrimary : t.getStarted;

  var defaultSendAmt = 1000;
  var initialRecv = (defaultSendAmt * activeCorr.midRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  el.innerHTML =
    '<div class="landing-page-wrap">' +

    /* HERO SECTION (Note: .hero class added alongside .hero-cosmic for QA compatibility) */
    '<section class="hero-cosmic hero" aria-label="Probaho Remit Hero">' +
      '<div class="hero-container">' +
        '<div class="hero-left">' +
          '<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,0.25);border:1px solid rgba(56,189,248,0.4);padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:18px;letter-spacing:0.08em;text-transform:uppercase;">' +
            '<span style="width:7px;height:7px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span> ' + U.esc(t.heroTag) +
          '</div>' +
          '<h1>' + heroHeadingHtml + '</h1>' +
          '<p class="hero-subtitle">' + U.esc(heroSubText) + '</p>' +
          '<div class="hero-btn-row">' +
            '<a class="btn-hero-primary" href="#/corridor-optimizer">' +
              U.esc(primaryCtaText) +
            '</a>' +
            '<button type="button" class="btn-hero-secondary" id="heroWatchDemo">' +
              U.esc(t.watchDemo) +
            '</button>' +
            '<a class="btn-hero-secondary" href="#/sign-up" style="border-color:rgba(94,234,212,0.5);color:#5EEAD4;">' +
              '✨ ' + (lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account') +
            '</a>' +
            '<button type="button" class="btn-hero-secondary" id="heroOpenNotifBtn" style="border-color:rgba(251,191,36,0.5);color:#FDE68A;">' +
              '🔔 ' + (lang === 'bn' ? 'নোটিফিকেশন ও অ্যালার্ট' : 'Notifications & Alerts') +
            '</button>' +
          '</div>' +

          /* 3 Floating Badges */
          '<div class="hero-floating-pills">' +
            '<div class="hero-pill-badge">' +
              '<div class="pill-icon">💰</div>' +
              '<div><b>' + t.pillLowFee + '</b><span>' + t.pillLowFeeSub + '</span></div>' +
            '</div>' +
            '<div class="hero-pill-badge">' +
              '<div class="pill-icon">⚡</div>' +
              '<div><b>' + t.pillFast + '</b><span>' + t.pillFastSub + '</span></div>' +
            '</div>' +
            '<div class="hero-pill-badge">' +
              '<div class="pill-icon">🛡️</div>' +
              '<div><b>' + t.pillSecurity + '</b><span>' + t.pillSecuritySub + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Hero Right: Global Multi-Corridor Calculator Card */
        '<div class="hero-right">' +
          '<div class="hero-calc-card">' +
            '<div class="hero-calc-head">' +
              '<h3>' + t.calcTitle + '</h3>' +
              '<span class="badge-rate-tag">' + t.calcBadge + '</span>' +
            '</div>' +

            /* Global Corridor Selector */
            '<div style="margin-bottom:12px;">' +
              '<label for="heroCorridorSelect" style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Select Global Corridor (' + corridors.length + ' Active Routes)</label>' +
              '<select id="heroCorridorSelect" class="input" style="font-size:13px;font-weight:700;padding:8px 12px;min-height:40px;background:#f8fafc;color:#0f172a;border-color:#cbd5e1;">' +
                corridors.map(function(c){
                  var sel = c.id === activeCorr.id ? " selected" : "";
                  var f1 = c.flagFrom || U.ccyFlag(c.sendCcy);
                  var f2 = c.flagTo || U.ccyFlag(c.receiveCcy);
                  return '<option value="' + U.esc(c.id) + '"' + sel + '>' + f1 + ' ' + U.esc(c.label) + ' (' + c.sendCcy + ' → ' + c.receiveCcy + ') ' + f2 + '</option>';
                }).join("") +
              '</select>' +
            '</div>' +

            '<div class="calc-input-box">' +
              '<div class="calc-input-label">' + t.calcSendLabel + '</div>' +
              '<div class="calc-input-row">' +
                '<input type="number" id="heroSendInput" value="' + defaultSendAmt + '" min="1" max="1000000" aria-label="You send amount">' +
                '<div class="calc-currency-tag" id="heroSendTag">' + (activeCorr.flagFrom || U.ccyFlag(activeCorr.sendCcy)) + ' ' + U.esc(activeCorr.sendCcy) + '</div>' +
              '</div>' +
            '</div>' +

            '<div class="calc-swap-arrow" id="heroRateLine" style="font-weight:700;font-size:12.5px;">' +
              '↓ 1 ' + U.esc(activeCorr.sendCcy) + ' = ' + Number(activeCorr.midRate).toFixed(activeCorr.midRate < 1 ? 4 : 2) + ' ' + U.esc(activeCorr.receiveCcy) + ' (Locked 60s)' +
            '</div>' +

            '<div class="calc-input-box" style="background:#E6F8F7;border-color:#99F6E4;">' +
              '<div class="calc-input-label" style="color:#097A76;">' + t.calcRecvLabel + '</div>' +
              '<div class="calc-input-row">' +
                '<input type="text" id="heroRecvOutput" value="' + initialRecv + '" readonly style="color:#097A76;" aria-label="Recipient gets amount">' +
                '<div class="calc-currency-tag" id="heroRecvTag" style="background:#CCFBF1;color:#071B33;">' + (activeCorr.flagTo || U.ccyFlag(activeCorr.receiveCcy)) + ' ' + U.esc(activeCorr.receiveCcy) + '</div>' +
              '</div>' +
            '</div>' +

            '<div class="calc-meta-row">' +
              '<span>' + t.calcDelivery + '</span>' +
              '<span>' + t.calcFee + '</span>' +
            '</div>' +

            /* +2.5% Bangladesh Govt Remittance Cash Incentive Banner */
            '<div id="heroIncentiveBox" style="display:' + (activeCorr.receiveCcy === "BDT" ? "flex" : "none") + ';align-items:center;justify-content:space-between;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#166534;">' +
              '<span>🇧🇩 <b>+2.5% BD Govt Incentive:</b></span>' +
              '<b id="heroIncentiveVal">+৳' + (defaultSendAmt * activeCorr.midRate * 0.025).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' BDT Bonus</b>' +
            '</div>' +

            '<button type="button" class="calc-btn-start" id="heroStartTransferBtn">' +
              t.calcBtn +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Social Proof Bar */
      '<div class="trust-bar">' +
        '<div class="trust-bar-text">' + t.trustStudents + '</div>' +
        '<div class="trust-logos">' +
          '<div class="trust-logo-item">🏛️ HARVARD</div>' +
          '<div class="trust-logo-item">🏛️ MIT</div>' +
          '<div class="trust-logo-item">🏛️ OXFORD</div>' +
          '<div class="trust-logo-item">🏛️ TORONTO</div>' +
          '<div class="trust-logo-item">🏛️ TSINGHUA</div>' +
          '<div class="trust-logo-item">🏛️ MELBOURNE</div>' +
        '</div>' +
      '</div>' +
    '</section>' +

    /* HOW IT WORKS 3-STEP FLOW */
    '<div class="page" style="padding-top:40px;">' +
      '<section style="margin-bottom:50px;">' +
        '<div class="page-head" style="text-align:center;max-width:760px;margin:0 auto 30px;">' +
          '<p class="eyebrow" style="justify-content:center;">' + t.howItWorksTag + '</p>' +
          '<h2 style="font-size:2rem;font-weight:800;letter-spacing:-0.03em;color:#0f172a;">' + t.howItWorksTitle + '</h2>' +
        '</div>' +
        '<div class="steps">' +
          '<div class="step" style="border-radius:18px;border-top:4px solid var(--teal,#0D9F9A);">' +
            '<span class="n">STEP 1</span>' +
            '<h3>' + t.step1Title + '</h3>' +
            '<p>' + t.step1Desc + '</p>' +
          '</div>' +
          '<div class="step" style="border-radius:18px;border-top:4px solid var(--ok,#10b981);">' +
            '<span class="n">STEP 2</span>' +
            '<h3>' + t.step2Title + '</h3>' +
            '<p>' + t.step2Desc + '</p>' +
          '</div>' +
          '<div class="step" style="border-radius:18px;border-top:4px solid var(--indigo,#4f46e5);">' +
            '<span class="n">STEP 3</span>' +
            '<h3>' + t.step3Title + '</h3>' +
            '<p>' + t.step3Desc + '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* KYC TIERS EXPLAINER */
      '<section style="margin-bottom:60px;">' +
        '<div class="page-head" style="text-align:center;max-width:760px;margin:0 auto 30px;">' +
          '<p class="eyebrow" style="justify-content:center;">' + t.kycTag + '</p>' +
          '<h2 style="font-size:2rem;font-weight:800;letter-spacing:-0.03em;color:#0f172a;">' + t.kycTitle + '</h2>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 275px), 1fr));gap:24px;">' +
          '<div class="card" style="padding:28px;border-left:5px solid #0284c7;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<span class="badge badge-info">TIER 1</span>' +
              '<b style="color:var(--ink-2,#64748b);font-size:12px;">Automated 3-min Check</b>' +
            '</div>' +
            '<h3 style="font-size:20px;font-weight:800;color:var(--ink,#0f172a);margin-bottom:6px;">' + t.kycBasicTitle + '</h3>' +
            '<div style="font-size:24px;font-weight:900;color:#0284c7;margin-bottom:10px;">' + t.kycBasicLimit + '</div>' +
            '<p style="color:var(--ink-2,#64748b);font-size:14px;line-height:1.6;margin-bottom:16px;">' + t.kycBasicDesc + '</p>' +
            '<div style="font-size:12.5px;color:var(--ink-2,#64748b);">Required: Valid National ID / Driving License + Phone OTP verification</div>' +
          '</div>' +
          '<div class="card" style="padding:28px;border-left:5px solid #10b981;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<span class="badge badge-ok">TIER 2</span>' +
              '<b style="color:var(--ink-2,#64748b);font-size:12px;">Full Global Student & Family Tier</b>' +
            '</div>' +
            '<h3 style="font-size:20px;font-weight:800;color:var(--ink,#0f172a);margin-bottom:6px;">' + t.kycFullTitle + '</h3>' +
            '<div style="font-size:24px;font-weight:900;color:#10b981;margin-bottom:10px;">' + t.kycFullLimit + '</div>' +
            '<p style="color:var(--ink-2,#64748b);font-size:14px;line-height:1.6;margin-bottom:16px;">' + t.kycFullDesc + '</p>' +
            '<div style="font-size:12.5px;color:var(--ink-2,#64748b);">Required: Passport + Biometric Liveness match + University admission letter</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* 10 MODULES SHOWCASE GRID */
      '<section style="margin-bottom:60px;">' +
        '<div class="page-head" style="text-align:center;max-width:760px;margin:0 auto 30px;">' +
          '<p class="eyebrow" style="justify-content:center;">' + t.modulesTag + '</p>' +
          '<h2 style="font-size:2rem;font-weight:800;letter-spacing:-0.03em;color:#0f172a;">' + t.modulesTitle + '</h2>' +
          '<p style="color:#64748b;font-size:15px;margin-top:6px;">' + t.modulesSubtitle + '</p>' +
        '</div>' +

        '<div class="module-cards" style="grid-template-columns:repeat(auto-fit,minmax(280px, 1fr));">' +
          MODULES.map(function(m){
            var cardDesc = (contentOver.cards && contentOver.cards[m.key]) ? contentOver.cards[m.key] : m.desc;
            return '<a class="mcard" href="' + m.route + '" style="border-radius:18px;">' +
              '<span class="ic">' + U.icon(m.icon, 22) + '</span>' +
              '<h3>' + U.esc(m.title) + '</h3>' +
              '<p>' + U.esc(cardDesc) + '</p>' +
              '<span class="go">' + (lang === 'bn' ? 'মডিউল খুলুন ' : 'Open Module ') + U.icon("arrow", 14) + '</span>' +
            '</a>';
          }).join("") +
        '</div>' +
      '</section>' +

      /* TRUST & COMPLIANCE INSTITUTIONAL BLOCK */
      '<section class="card" style="margin-bottom:50px;padding:32px;background:rgba(15,23,42,0.03);border:1px solid var(--line,#e2e8f0);border-radius:20px;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
          '<span style="font-size:28px;">🏛️</span>' +
          '<div>' +
            '<h3 style="font-size:18px;font-weight:800;color:var(--ink,#0f172a);margin:0;">' + t.trustBlockTitle + '</h3>' +
            '<p style="font-size:13px;color:var(--ink-2,#64748b);margin:2px 0 0;">' + U.esc(contentOver.disclaimer || "Demonstration remittance prototype engineered for global competition evaluation and compliance modeling.") + '</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;font-size:13.5px;padding-top:12px;border-top:1px solid var(--line,#e2e8f0);">' +
          '<div><b>Entity:</b><br><span style="color:var(--ink-2,#64748b);">' + t.trustEntity + '</span></div>' +
          '<div><b>Competition Track:</b><br><span style="color:var(--ink-2,#64748b);">' + t.trustLicense + '</span></div>' +
          '<div><b>Global Coverage:</b><br><span style="color:var(--ink-2,#64748b);">' + t.trustAddress + '</span></div>' +
          '<div><b>Support Desk:</b><br><a href="#/help" style="color:var(--teal-deep,#0D9F9A);font-weight:700;">' + t.trustSupport + '</a></div>' +
        '</div>' +
        '<div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">' +
          '<a href="#/terms" class="btn btn-sm btn-secondary">Terms of Service</a>' +
          '<a href="#/privacy" class="btn btn-sm btn-secondary">Privacy Policy</a>' +
          '<a href="#/refunds" class="btn btn-sm btn-secondary">Refund Policy</a>' +
          '<a href="#/cookies" class="btn btn-sm btn-secondary">Cookie Notice</a>' +
          '<a href="#/fees" class="btn btn-sm btn-secondary">Fee Tables</a>' +
          '<a href="#/corridors" class="btn btn-sm btn-secondary">Global Corridors</a>' +
        '</div>' +
      '</section>' +

      /* BOTTOM CTA BANNER (No Admin Link!) */
      '<section class="card" style="margin-bottom:40px;background:linear-gradient(135deg,#071B33,#0D3B4C);color:#fff;border:0;border-radius:24px;padding:36px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px;">' +
        '<div style="max-width:680px;">' +
          '<span style="background:rgba(56,189,248,0.2);color:#38bdf8;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">' + t.ctaTag + '</span>' +
          '<h2 style="font-size:1.8rem;letter-spacing:-0.02em;margin:10px 0 8px;">' + t.ctaTitle + '</h2>' +
          '<p style="color:#cbd5e1;font-size:14.5px;margin:0;">' + t.ctaDesc + '</p>' +
        '</div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
          '<a class="btn btn-primary" href="#/corridor-optimizer" style="padding:12px 24px;font-size:14.5px;">' + t.getStarted + '</a>' +
          '<a class="btn btn-secondary" href="#/sign-up" style="background:rgba(18,184,176,0.22);color:#5EEAD4;border-color:rgba(94,234,212,0.45);padding:12px 20px;font-weight:800;">✨ ' + (lang === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Create Account') + '</a>' +
          '<a class="btn btn-secondary" href="#/notifications" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.25);padding:12px 20px;">🔔 ' + (lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications') + '</a>' +
          '<a class="btn btn-secondary" href="#/sign-in" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.25);padding:12px 20px;">' + (lang === 'bn' ? 'সাইন ইন পোর্টাল' : 'Sign In Portal') + '</a>' +
        '</div>' +
      '</section>' +
    '</div>' +
  '</div>';

  /* Bind Global Calculator Events */
  var corrSel = U.$("#heroCorridorSelect", el);
  var sendInput = U.$("#heroSendInput", el);
  var recvOutput = U.$("#heroRecvOutput", el);
  var sendTag = U.$("#heroSendTag", el);
  var recvTag = U.$("#heroRecvTag", el);
  var rateLine = U.$("#heroRateLine", el);
  var startBtn = U.$("#heroStartTransferBtn", el);

  function recalcHero(){
    var selId = corrSel ? corrSel.value : activeCorr.id;
    var c = corridors.find(function(x){ return x.id === selId; }) || activeCorr;
    var val = Math.max(0, parseFloat(sendInput ? sendInput.value : 1000) || 0);
    var recv = (val * c.midRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (recvOutput) recvOutput.value = recv;
    if (sendTag) sendTag.textContent = (c.flagFrom || U.ccyFlag(c.sendCcy)) + " " + c.sendCcy;
    if (recvTag) recvTag.textContent = (c.flagTo || U.ccyFlag(c.receiveCcy)) + " " + c.receiveCcy;
    if (rateLine) rateLine.textContent = "↓ 1 " + c.sendCcy + " = " + Number(c.midRate).toFixed(c.midRate < 1 ? 4 : 2) + " " + c.receiveCcy + " (Locked 60s)";
    var incBox = U.$("#heroIncentiveBox", el), incVal = U.$("#heroIncentiveVal", el);
    if (incBox) incBox.style.display = c.receiveCcy === "BDT" ? "flex" : "none";
    if (incVal && c.receiveCcy === "BDT") incVal.textContent = "+৳" + (val * c.midRate * 0.025).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " BDT Bonus";
  }

  if (corrSel) corrSel.addEventListener("change", recalcHero);
  if (sendInput) sendInput.addEventListener("input", recalcHero);

  if (startBtn){
    startBtn.addEventListener("click", function(){
      var selId = corrSel ? corrSel.value : activeCorr.id;
      var val = parseFloat(sendInput && sendInput.value) || 1000;
      global.AppState.set("amount", val);
      global.AppState.set("corridorId", selId);
      location.hash = "#/corridor-optimizer";
    });
  }

  var heroNotifBtn = U.$("#heroOpenNotifBtn", el);
  if (heroNotifBtn){
    heroNotifBtn.addEventListener("click", function(){
      if (global.NotificationHub && typeof global.NotificationHub.openModal === "function"){
        global.NotificationHub.openModal("all");
      } else {
        location.hash = "#/notifications";
      }
    });
  }
  var demoBtn = U.$("#heroWatchDemo", el);
  if (demoBtn){
    demoBtn.addEventListener("click", function(){
      global.Modal.open({
        title: "Probaho Remit · Global Platform Tour",
        body: '<div style="padding:10px;text-align:center;">' +
          '<div style="width:100%;height:190px;background:linear-gradient(135deg,#071B33,#0D3B4C);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;margin-bottom:16px;">' +
            '<div style="text-align:center;padding:0 16px;">' +
              '<div style="width:54px;height:54px;border-radius:50%;background:#0D9F9A;display:grid;place-items:center;margin:0 auto 12px;font-size:22px;box-shadow:0 8px 24px rgba(37,99,235,0.5);">🌐</div>' +
              '<b style="font-size:16px;">Global Cross-Border Remittance & AI Copilot</b>' +
              '<p style="font-size:12px;color:#93c5fd;margin:4px 0 0;">18+ Corridors · 60s Rate Lock · ScamShield AI · Multi-Year Tuition Planner</p>' +
            '</div>' +
          '</div>' +
          '<p style="font-size:14px;color:#334155;line-height:1.6;text-align:left;">' +
            'Probaho Remit empowers students, expatriates, and families across the Americas, Europe, Asia-Pacific, Middle East, and South Asia. ' +
            'Compare 5 providers transparently, lock exchange rates for 60 seconds, scan invoices with ScamShield, and track settlements end-to-end.' +
          '</p>' +
        '</div>',
        okLabel: "Explore Optimizer",
        onOk: function(){ location.hash = "#/corridor-optimizer"; }
      });
    });
  }
}

global.ModHome = {
  render: render,
  meta: {
    title: "Smarter Transfers, Safer Journeys — Probaho Remit",
    nav: "Home",
    icon: "home"
  }
};

})(typeof window !== "undefined" ? window : global);

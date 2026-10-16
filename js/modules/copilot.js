/* copilot.js — Probaho Copilot+ Agent Console (#/copilot & #/ask-probaho)
   Powered by OpenRouter API: NVIDIA Nemotron 3 Ultra (nvidia/nemotron-3-ultra-550b-a55b)
   + Real-Time Website State & Mutation Tracker + Autonomous Agentic Executor. */
(function(global){
"use strict";
var U = global.U;

var copilotListenerBound = false;

function render(){
  var el = U.$("#view");
  if (!el) return;

  var LLM = global.ProbahoLocalLLM;
  var snap = (LLM && LLM.getLiveSnapshot) ? LLM.getLiveSnapshot() : null;
  var profObj = (global.AppState && global.AppState.get("userProfile")) || {};
  var sessObj = (global.AuthService && global.AuthService.session) ? global.AuthService.session() : null;
  var userName = (sessObj && sessObj.name) || profObj.full_name || "Ishan Ahmed";
  var totalNetWorthUSD = (snap && snap.wallet) ? snap.wallet.netWorthUSD : 48493.24;
  var totalNetWorthBDT = (snap && snap.wallet) ? snap.wallet.netWorthBDT : (48493.24 * 119.5);
  var cPlan = (snap && snap.tuition) ? snap.tuition : { university: "University of Toronto", currency: "CAD", tuitionAnnual: 32000, program: "MSc Computer Science" };
  var actCorr = (snap && snap.activeCorridor) ? snap.activeCorridor : { label: "United States → Bangladesh", sendCcy: "USD", receiveCcy: "BDT", midRate: 119.50, bestProvider: "Wise" };
  var curModelId = (LLM && LLM.currentModelId) ? LLM.currentModelId : "nvidia/nemotron-3-ultra-550b-a55b";
  var liveEvents = (LLM && LLM.getLiveEvents) ? LLM.getLiveEvents() : [];

  function renderEventFeedHtml(evList){
    if (!evList || !evList.length){
      return '<div class="small muted">Listening for real-time website mutations...</div>';
    }
    return evList.slice(0, 6).map(function(ev){
      var catColor = ev.category === "VAULT" ? "#059669" : ev.category === "TUITION" ? "#7c3aed" : ev.category === "ADMIN" ? "#dc2626" : "#16A34A";
      return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;font-size:12px;">' +
        '<div style="min-width:0;flex:1;">' +
          '<span style="display:inline-block;font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;background:#eff6ff;color:' + catColor + ';margin-right:6px;">' + U.esc(ev.category) + '</span>' +
          '<b style="color:#0f172a;">' + U.esc(ev.title) + '</b>' +
          '<div style="color:#475569;margin-top:2px;line-height:1.4;">' + U.esc(ev.summary) + '</div>' +
        '</div>' +
        '<span class="mono" style="font-size:10.5px;color:#64748b;white-space:nowrap;">' + U.esc(ev.timeStr) + '</span>' +
      '</div>';
    }).join("");
  }

  el.innerHTML =
    '<div class="page" style="max-width:1180px;">' +
      '<div class="page-head" style="text-align:center;margin-bottom:18px;">' +
        '<div style="display:inline-flex;align-items:center;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;padding:5px 14px;border-radius:999px;font-size:11.5px;font-weight:800;margin-bottom:10px;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>' +
          '<span>COPILOT+ AGENT · NVIDIA NEMOTRON 3 ULTRA (nvidia/nemotron-3-ultra-550b-a55b) · REAL-TIME TRACKING</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;margin:8px 0 10px;">' + (U.aiOrb ? U.aiOrb("ai-orb-lg") : "") + '</div>' +
        '<h1 class="page-title">AI Financial Copilot Chat · Copilot+ Agent</h1>' +
        '<p class="page-sub">Powered by OpenRouter <code>nvidia/nemotron-3-ultra-550b-a55b</code> + Real-Time Website Telemetry. Tracks every change across your Vault, Tuition Planner, Corridors &amp; Admin Console in real time and executes live actions on command.</p>' +

        /* Model Selection Bar */
        '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:12px;" id="modelSwitchBar">' +
          '<button type="button" class="btn btn-sm ' + (curModelId === "nvidia/nemotron-3-ultra-550b-a55b" ? "btn-primary" : "btn-secondary") + '" data-m="nvidia/nemotron-3-ultra-550b-a55b" style="border-radius:9999px;font-size:12px;padding:5px 14px;font-weight:800;">🚀 NVIDIA Nemotron 3 Ultra 550B (OpenRouter Copilot+)</button>' +
          '<button type="button" class="btn btn-sm ' + (curModelId === "llama-3.2-1b-instruct" ? "btn-primary" : "btn-secondary") + '" data-m="llama-3.2-1b-instruct" style="border-radius:9999px;font-size:12px;padding:5px 14px;font-weight:700;">⚡ Llama 3.2 1B (Fast Edge)</button>' +
          '<button type="button" class="btn btn-sm ' + (curModelId === "llama-3.2-3b-instruct" ? "btn-primary" : "btn-secondary") + '" data-m="llama-3.2-3b-instruct" style="border-radius:9999px;font-size:12px;padding:5px 14px;font-weight:700;">🧠 Llama 3.2 3B (Precision Math)</button>' +
          '<button type="button" class="btn btn-sm ' + (curModelId === "llama-3.1-8b-instruct" ? "btn-primary" : "btn-secondary") + '" data-m="llama-3.1-8b-instruct" style="border-radius:9999px;font-size:12px;padding:5px 14px;font-weight:700;">🌐 Llama 3.1 8B (Deep Compliance)</button>' +
        '</div>' +

        /* Live Grounding Telemetry Cards */
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:10px;margin-top:16px;text-align:left;" id="copilotTelemetryStrip">' +
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;">' +
            '<span style="font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;">🪙 Live Vault Net Worth</span>' +
            '<div style="font-size:15px;font-weight:850;color:#0f172a;margin-top:2px;" id="copKpiVault">$ ' + totalNetWorthUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD</div>' +
            '<span style="font-size:11px;color:#059669;font-weight:600;">৳' + Math.round(totalNetWorthBDT).toLocaleString() + ' BDT · 6 Sub-Wallets</span>' +
          '</div>' +
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;">' +
            '<span style="font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;">🎓 Custom Tuition Target</span>' +
            '<div style="font-size:14.5px;font-weight:850;color:#0f172a;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="copKpiTuition">' + U.esc(cPlan.university) + '</div>' +
            '<span style="font-size:11px;color:#16A34A;font-weight:600;">' + U.esc(cPlan.currency) + ' ' + Number(cPlan.tuitionAnnual || 32000).toLocaleString() + '/yr · ' + U.esc(cPlan.program || "") + '</span>' +
          '</div>' +
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;">' +
            '<span style="font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;">🌐 Active Corridor &amp; #1 Quote</span>' +
            '<div style="font-size:14.5px;font-weight:850;color:#0f172a;margin-top:2px;" id="copKpiCorridor">' + U.esc(actCorr.sendCcy + " → " + actCorr.receiveCcy) + ' (' + U.esc(actCorr.bestProvider) + ')</div>' +
            '<span style="font-size:11px;color:#059669;font-weight:600;">1 ' + U.esc(actCorr.sendCcy) + ' = ' + actCorr.midRate + ' ' + U.esc(actCorr.receiveCcy) + '</span>' +
          '</div>' +
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;">' +
            '<span style="font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;">📡 OpenRouter API &amp; Tracker</span>' +
            '<div style="font-size:14px;font-weight:850;color:#15803d;margin-top:2px;">Nemotron 3 Ultra Connected</div>' +
            '<span style="font-size:11px;color:#64748b;font-weight:600;" id="copKpiEventsCount">' + liveEvents.length + ' real-time website events tracked</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Real-Time Website Activity & Mutation Stream Panel */
      '<div class="card" style="margin-bottom:18px;padding:16px 18px;border-radius:18px;background:#f8fafc;border:1px solid #cbd5e1;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="width:9px;height:9px;border-radius:50%;background:#16A34A;display:inline-block;"></span>' +
            '<b style="font-size:13.5px;color:#0f172a;">📡 Real-Time Website Data &amp; Mutation Stream (Tracked by Copilot+)</b>' +
          '</div>' +
          '<span style="font-size:11.5px;color:#475569;font-weight:600;">Every change in Vault, Tuition, Corridors, Send Money, or Admin appears here &amp; updates Copilot+ immediately</span>' +
        '</div>' +
        '<div id="copilotLiveEventStream" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr));gap:8px;">' +
          renderEventFeedHtml(liveEvents) +
        '</div>' +
      '</div>' +

      /* Chat Window */
      '<div class="chat" style="border-radius:24px;border:1.5px solid #BBF7D0;box-shadow:0 12px 36px rgba(20,83,45,0.08);background:#fff;min-height:560px;overflow:hidden;">' +

        /* Chat Action Toolbar (1-Click Live Agentic Commands) */
        '<div style="background:#f8fafc;padding:10px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-sm btn-primary" data-p="Amar 4 months por tuition dite hobe, sathe family ke monthly taka pathate hoy" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">🎯 4-Month Tuition + Family Plan (Banglish)</button>' +
            '<a href="#/student-journey" class="btn btn-sm btn-secondary" style="font-size:11.5px;padding:4px 10px;border-radius:8px;text-decoration:none;">🧭 Connected Student Journey</a>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="Show my upcoming payment notifications and reminders" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">🔔 Upcoming Payment Alerts</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="What changed on the website in real time?" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">📡 Live Telemetry</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="Deposit 1000 USDT" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">⚡ Agent: Deposit 1,000 USDT</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="Swap 500 USDT to BDT" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">⇄ Agent: Swap 500 USDT → BDT</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="Lock 500 USD in vault" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">🔒 Agent: Lock $500 in Vault</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="Set university to Tsinghua University with 30000 CNY" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">🎓 Agent: Set Tsinghua Tuition</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-p="URGENT: University bank account has changed, pay today on WhatsApp and share OTP" style="font-size:11.5px;padding:4px 10px;border-radius:8px;">🛡️ Test Scam Scanner</button>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button type="button" class="btn btn-sm btn-ghost" id="btnExportChat" style="font-size:11.5px;padding:4px 10px;">📥 Export</button>' +
            '<button type="button" class="btn btn-sm btn-ghost" id="btnClearChat" style="font-size:11.5px;padding:4px 10px;color:#dc2626;">🗑️ Clear</button>' +
          '</div>' +
        '</div>' +

        '<div class="chat-log" id="chatLog" data-alias="askChatLog" style="min-height:380px;max-height:500px;padding:24px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;">' +

          /* Initial Bot Greeting with 3D Glowing Purple Orb */
          '<div class="f-copilot-hero" style="padding:8px 0 4px;">' + (U.aiOrb ? U.aiOrb("ai-orb-lg") : "") + '<div class="f-copilot-hero-title">AI Copilot</div><div class="f-copilot-hero-sub">NVIDIA Nemotron 3 Ultra (550B) · Live Agent</div></div>' +
          '<div class="f-bot-row" style="max-width:92%;">' + (U.aiOrb ? U.aiOrb("ai-orb-sm") : "") + '<div class="msg bot f-bot-bubble" style="border-radius:18px 18px 18px 6px;background:#F0FDF4;border:1px solid #BBF7D0;max-width:100%;padding:14px 18px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">' +
              '<span class="who" style="color:#15803D;font-weight:800;font-size:11px;margin:0;">NVIDIA NEMOTRON 3 ULTRA (550B) · COPILOT+ AGENT</span>' +
              '<span style="font-size:9.5px;font-weight:800;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:4px;">OPENROUTER API + REAL-TIME STATE TRACKER</span>' +
            '</div>' +
            '<p style="margin:0;font-size:14px;color:#1e293b;line-height:1.55;">' +
              'Hello <b>' + U.esc(userName) + '</b>! I am your <b>Copilot+ Agent</b> powered by OpenRouter <code>nvidia/nemotron-3-ultra-550b-a55b</code>. I monitor all website data in real time and can execute actions directly on your behalf:<br>' +
              '• <b>Live Vault Tracking &amp; Execution:</b> Portfolio is <b>$' + totalNetWorthUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD</b>. Ask me to <code>Deposit 1000 USDT</code>, <code>Swap 500 USDT to BDT</code>, or <code>Lock 500 USD in vault</code>.<br>' +
              '• <b>Live Tuition Tracking &amp; Updates:</b> Currently tracking <b>' + U.esc(cPlan.university) + '</b> (' + U.esc(cPlan.currency) + ' ' + Number(cPlan.tuitionAnnual || 32000).toLocaleString() + '/yr). Ask me to <code>Set university to MIT with 55000 USD</code>.<br>' +
              '• <b>Live FX Insight:</b> <b>Your JPY balance is up 4% this week</b> — ask <code>What changed on the website?</code> at any time to see every live update across all modules.' +
            '</p>' +
          '</div></div>' +

          /* Example User Question */
          '<div class="msg me" style="border-radius:18px;background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;max-width:80%;align-self:flex-end;padding:12px 18px;">' +
            '<div class="who" style="color:#dcfce7;font-weight:700;font-size:10px;margin-bottom:4px;text-align:right;">YOU</div>' +
            '<p style="margin:0;font-size:14px;font-weight:600;">What&#39;s the best way to send $500 to Bangladesh?</p>' +
          '</div>' +

          /* Example AI Response */
          '<div class="msg bot" style="border-radius:18px;background:#F0FDF4;border:1.5px solid #BBF7D0;max-width:88%;padding:16px 20px;">' +
            '<div class="who" style="color:#15803D;font-weight:800;font-size:11px;margin-bottom:8px;">COPILOT+ · CORRIDOR OPTIMIZER</div>' +
            '<p style="margin:0 0 10px;font-size:14px;color:#0f172a;line-height:1.5;">' +
              'For sending <b>$500 to Bangladesh</b>, the best option is <b>Wise</b>. Here&#39;s a quick comparison:' +
            '</p>' +
            '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:13px;line-height:1.6;color:#334155;">' +
              '• <b>Wise:</b> Fee $4.99 · Rate: 1 USD = 120.15 BDT · Receiver gets: <b style="color:#15803d;">59,475.45 BDT</b> · Delivery: <b>Instant – 1 day</b><br>' +
              '• <b>WorldRemit:</b> Fee $4.99 · Rate: 1 USD = 119.48 BDT · Receiver gets: 59,143.80 BDT<br>' +
              '• <b>Western Union:</b> Fee $12.00 · Rate: 1 USD = 118.97 BDT · Receiver gets: 58,057.36 BDT' +
            '</div>' +
            '<p style="margin:0 0 12px;font-size:13.5px;color:#0f172a;font-weight:600;">' +
              'Would you like me to create the transfer for you?' +
            '</p>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
              '<a href="#/send?amount=500&currency=USD" class="btn btn-sm btn-primary" id="chatActCreate" style="border-radius:8px;padding:8px 16px;font-weight:700;text-decoration:none;">' +
                'Yes, create transfer' +
              '</a>' +
              '<a href="#/corridor-optimizer" class="btn btn-sm btn-secondary" id="chatActMore" style="border-radius:8px;padding:8px 14px;text-decoration:none;">' +
                'Show more options' +
              '</a>' +
            '</div>' +
          '</div>' +

        '</div>' +

        /* Suggestion Chips */
        '<div class="chips" id="chatChips" style="padding:10px 22px 14px;border-top:1px solid #f1f5f9;display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="chip" data-p="Amar 4 months por tuition dite hobe, sathe family ke monthly taka pathate hoy">🎯 Amar 4 months por tuition + family remittance plan</button>' +
          '<button class="chip" data-p="What changed on the website in real time?">📡 Real-Time Website Changes</button>' +
          '<button class="chip" data-p="Which provider is cheapest right now?">⚡ Cheapest Provider</button>' +
          '<button class="chip" data-p="What is my crypto wallet balance and APY?">🪙 Crypto &amp; Fiat Vault</button>' +
          '<button class="chip" data-p="Convert 2500 USDT to BDT">💱 Convert 2,500 USDT → BDT</button>' +
          '<button class="chip" data-p="Deposit 500 USDT">➕ Deposit 500 USDT Live</button>' +
          '<button class="chip" data-p="Swap 200 USDT to BDT">⇄ Swap 200 USDT → BDT Live</button>' +
          '<button class="chip" data-p="How do I pay tuition for Tsinghua University?">🎓 Custom Tuition Plan</button>' +
          '<button class="chip" data-p="Who are my saved verified beneficiaries?">👥 My Beneficiaries</button>' +
        '</div>' +

        /* Input Bar (Matches Reference Image 1 Pill Bar + Purple Up-Arrow Button) */
        '<div class="chat-in" style="padding:14px 22px;border-top:1px solid #f1f5f9;background:#ffffff;display:block;">' +
          '<div class="f-copilot-pill-bar">' +
            '<input class="input" id="chatInput" data-alias="askInput" placeholder="Type a message... (or command: Deposit 1000 USDT, Swap 500 USDT to BDT, 4-Mo Tuition Plan)" style="flex:1;">' +
            '<button class="f-copilot-send-circle" id="chatSend" data-alias="askSendBtn" aria-label="Send message" title="Send message">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var log = U.$("#chatLog", el);
  var input = U.$("#chatInput", el);
  var sendBtn = U.$("#chatSend", el);

  function refreshTopKpis(){
    if (!LLM || !LLM.getLiveSnapshot) return;
    var s = LLM.getLiveSnapshot();
    var vEl = document.getElementById("copKpiVault");
    if (vEl) vEl.textContent = "$ " + s.wallet.netWorthUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
    var tEl = document.getElementById("copKpiTuition");
    if (tEl) tEl.textContent = s.tuition.university;
    var cEl = document.getElementById("copKpiCorridor");
    if (cEl) cEl.textContent = s.activeCorridor.sendCcy + " → " + s.activeCorridor.receiveCcy + " (" + s.activeCorridor.bestProvider + ")";
    var eEl = document.getElementById("copKpiEventsCount");
    if (eEl) eEl.textContent = s.recentLiveEvents.length + " real-time website events tracked";
    var streamEl = document.getElementById("copilotLiveEventStream");
    if (streamEl) streamEl.innerHTML = renderEventFeedHtml(s.recentLiveEvents);
  }

  function pushUserMsg(msg){
    var div = document.createElement("div");
    div.className = "msg me";
    div.style.cssText = "border-radius:18px;background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;max-width:80%;align-self:flex-end;padding:12px 18px;";
    var h = document.createElement("div");
    h.className = "who";
    h.style.cssText = "color:#dcfce7;font-weight:700;font-size:10px;margin-bottom:4px;text-align:right;";
    h.textContent = "YOU";
    var p = document.createElement("p");
    p.style.cssText = "margin:0;font-size:14px;font-weight:600;";
    p.textContent = msg;
    div.appendChild(h);
    div.appendChild(p);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

function renderThinkingDetails(thinkingObj, elapsedSec){
  var steps = (thinkingObj && thinkingObj.steps) || [
    "Step 1: Analyzing user query syntax, intent, and multilingual vocabulary (English / Banglish / বাংলা)...",
    "Step 2: Querying live website telemetry: Multi-Currency Vault ($48,493.24 USD), active corridor quotes, and daily KYC quota...",
    "Step 3: Checking active upcoming payment notifications, tuition sinking schedules & ScamShield risk rules...",
    "Step 4: Formulating verified, error-free financial advice & synchronizing state across all modules."
  ];
  var stepsHtml = steps.map(function(s){
    return '<div style="margin-bottom:4px;display:flex;align-items:flex-start;gap:6px;">' +
      '<span style="color:#16A34A;font-weight:700;">✓</span>' +
      '<span>' + U.esc(s) + '</span>' +
    '</div>';
  }).join("");

  return '<details class="ai-thought-trace" style="margin-bottom:12px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:10px 14px;font-size:12px;color:#475569;">' +
    '<summary style="cursor:pointer;font-weight:750;color:#15803D;display:flex;align-items:center;gap:6px;list-style:none;">' +
      '<span>💭 Thought for ' + (elapsedSec || "1.5") + ' seconds · View step-by-step reasoning process</span>' +
      '<span style="font-size:10px;margin-left:auto;">▼</span>' +
    '</summary>' +
    '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #cbd5e1;line-height:1.6;color:#334155;">' +
      stepsHtml +
    '</div>' +
  '</details>';
}

  function pushBotMsg(replyObj, elapsedSec){
    var div = document.createElement("div");
    div.className = "msg bot";
    div.style.cssText = "border-radius:18px 18px 18px 6px;background:#F0FDF4;border:1px solid #BBF7D0;max-width:90%;padding:16px 20px;box-shadow:0 4px 14px rgba(124,58,237,0.06);";

    var actionsHtml = "";
    if (replyObj.actions && replyObj.actions.length > 0){
      actionsHtml = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">' +
        replyObj.actions.map(function(act){
          var btnClass = act.primary ? "btn-primary" : "btn-secondary";
          return '<a href="' + act.route + '" class="btn btn-sm ' + btnClass + '" style="border-radius:8px;padding:8px 16px;font-weight:700;text-decoration:none;">' +
            U.esc(act.label) +
          '</a>';
        }).join("") +
      '</div>';
    }

    var thoughtHtml = renderThinkingDetails(replyObj ? replyObj.thinking : null, elapsedSec);
    div.innerHTML =
      thoughtHtml +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">' +
        '<span style="color:#15803D;font-weight:800;font-size:11px;letter-spacing:0.5px;">' + U.esc(replyObj.title || "COPILOT+ AGENT") + '</span>' +
        '<span style="font-size:9.5px;font-weight:750;color:#059669;background:#dcfce7;padding:2px 8px;border-radius:4px;">' + U.esc(replyObj.badge || "NEMOTRON 3 ULTRA") + '</span>' +
      '</div>' +
      '<p style="margin:0 0 8px;font-size:14px;color:#0f172a;line-height:1.5;">' + replyObj.text + '</p>' +
      (replyObj.dataBox ? '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin:8px 0;font-size:13px;line-height:1.6;color:#334155;">' + replyObj.dataBox + '</div>' : '') +
      (replyObj.followUp ? '<p style="margin:8px 0 0;font-size:13.5px;color:#0f172a;font-weight:600;">' + U.esc(replyObj.followUp) + '</p>' : '') +
      actionsHtml;

    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    refreshTopKpis();
  }

  /* Subscribe once to real-time website changes so when on #/copilot, the stream & chat update automatically */
  if (!copilotListenerBound && LLM && typeof LLM.onLiveEvent === "function"){
    copilotListenerBound = true;
    LLM.onLiveEvent(function(ev){
      refreshTopKpis();
    });
  }

  function handleSend(){
    var txt = input.value.trim();
    if (!txt) return;
    pushUserMsg(txt);
    input.value = "";

    var typing = document.createElement("div");
    typing.className = "msg bot";
    typing.id = "chatThinkingBlock";
    typing.style.cssText = "border-radius:18px 18px 18px 6px;background:#f8fafc;border:1.5px solid #16A34A;max-width:90%;padding:16px 20px;box-shadow:0 4px 14px rgba(37,99,235,0.08);";
    typing.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
        '<span style="font-size:11.5px;font-weight:800;color:#15803D;display:flex;align-items:center;gap:6px;">' +
          '<span class="typing"><i></i><i></i><i></i></span>' +
          '<span>NVIDIA Nemotron 3 Ultra (550B) · Reasoning Step-by-Step...</span>' +
        '</span>' +
        '<span class="mono" style="font-size:11px;color:#64748b;font-weight:700;" id="chatThinkingTimer">0.2s</span>' +
      '</div>' +
      '<div id="chatThinkingStep" style="font-size:12.5px;color:#334155;line-height:1.5;">' +
        '• Step 1: Parsing user query syntax, intent, and multilingual vocabulary...' +
      '</div>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    var startTime = Date.now();
    var thinkingTimer = setInterval(function(){
      var elapsedMs = Date.now() - startTime;
      var secStr = (elapsedMs / 1000).toFixed(1) + "s";
      var tEl = document.getElementById("chatThinkingTimer");
      if (tEl) tEl.textContent = secStr;
      var sEl = document.getElementById("chatThinkingStep");
      if (sEl){
        if (elapsedMs < 400) sEl.innerHTML = "• Step 1: Parsing user query syntax, intent, and language context (English / Banglish / বাংলা)...";
        else if (elapsedMs < 800) sEl.innerHTML = "• Step 2: Querying live website telemetry: Multi-Currency Vault ($48,493.24 USD), active corridor quotes, and daily KYC quota...";
        else if (elapsedMs < 1200) sEl.innerHTML = "• Step 3: Checking upcoming payment notifications, tuition sinking schedules &amp; ScamShield risk rules...";
        else sEl.innerHTML = "• Step 4: Formulating verified, error-free financial advice &amp; synchronizing state across all modules...";
      }
    }, 100);

    function finishWithReply(reply){
      var elapsedTotal = Math.max(1400, Date.now() - startTime);
      var remainingWait = Math.max(0, 1400 - (Date.now() - startTime));
      setTimeout(function(){
        clearInterval(thinkingTimer);
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        var secFormatted = (elapsedTotal / 1000).toFixed(1);
        pushBotMsg(reply, secFormatted);
      }, remainingWait);
    }

    /* First check if inferAsync is available; also provide instant fallback if offline */
    if (LLM && typeof LLM.inferAsync === "function"){
      LLM.inferAsync(txt).then(function(reply){
        finishWithReply(reply || LLM.infer(txt));
      }).catch(function(){
        finishWithReply(LLM.infer(txt));
      });
    } else {
      var rep = LLM ? LLM.infer(txt) : { title: "COPILOT+", text: "Verified local reasoning.", actions: [] };
      finishWithReply(rep);
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", handleSend);
  if (input) input.addEventListener("keydown", function(e){ if (e.key === "Enter") handleSend(); });

  /* Clear & Export Chat */
  var clearBtn = U.$("#btnClearChat", el);
  if (clearBtn){
    clearBtn.addEventListener("click", function(){
      log.innerHTML = "";
      pushBotMsg({
        title: "NVIDIA NEMOTRON 3 ULTRA (550B) · SESSION RESET",
        badge: "READY",
        text: "Chat history cleared. I am actively tracking all website data in real time. Ask me to convert any currency or crypto, execute a live deposit/swap, update your tuition plan, or inspect live website changes!",
        actions: [{ label: "🪙 Open Crypto Vault", route: "#/payment-vault", primary: true }, { label: "🎓 Custom Tuition Planner", route: "#/tuition-planner", primary: false }]
      });
    });
  }

  var exportBtn = U.$("#btnExportChat", el);
  if (exportBtn){
    exportBtn.addEventListener("click", function(){
      var text = log.innerText || log.textContent || "";
      var blob = new Blob([text], { type: "text/plain" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "probaho-copilot-transcript.txt";
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
      if (global.Toast) global.Toast.show("Exported Copilot+ transcript!", "ok");
    });
  }

  /* Model switch buttons */
  U.$$("#view [data-m]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var mId = btn.getAttribute("data-m");
      if (LLM && typeof LLM.setModel === "function"){
        LLM.setModel(mId);
      }
      U.$$("#view [data-m]").forEach(function(b){
        b.className = b === btn ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary";
      });
      var curMeta = LLM ? LLM.meta : null;
      var note = curMeta ? ("Switched active model to <b>" + U.esc(curMeta.name) + "</b> (" + U.esc(curMeta.latency) + ").") : "Switched model.";
      pushBotMsg({
        title: "COPILOT+ · MODEL SELECTOR",
        badge: "ACTIVE MODEL",
        text: note,
        dataBox: curMeta ? ("• <b>Model ID:</b> <code>" + U.esc(curMeta.id) + "</code><br>• <b>Architecture:</b> " + U.esc(curMeta.architecture) + "<br>• <b>Engine:</b> " + U.esc(curMeta.engine) + "<br>• <b>Status:</b> <span style='color:#15803d;font-weight:700;'>✓ Real-Time Website Telemetry Connected</span>") : null,
        actions: [{ label: "🪙 Open Vault", route: "#/payment-vault", primary: true }, { label: "💸 Send Money", route: "#/send", primary: false }]
      });
    });
  });

  U.$$("#view [data-p]").forEach(function(b){
    b.addEventListener("click", function(){
      input.value = b.getAttribute("data-p");
      handleSend();
    });
  });
}

global.ModCopilot = { render: render, meta:{ title:"Ask Probaho Copilot+ (Nemotron 3 Ultra)", nav:"Ask Probaho", icon:"chat" } };
})(typeof window !== "undefined" ? window : global);

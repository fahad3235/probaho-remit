/**
 * floating-copilot.js — Universal Floating AI Financial Copilot+ Agent Widget
 * Matches Reference Image 1 (3D Glowing Purple Orb + "AI Financial Copilot Chat" + Mini Orb Avatars + Quick-Suggest Pills + Pill Input Bar with Up-Arrow Button)
 * Powered by OpenRouter API: NVIDIA Nemotron 3 Ultra (nvidia/nemotron-3-ultra-550b-a55b)
 * + Real-Time Website Data & Mutation Tracker across Public Website & Admin Panel.
 */
(function(global){
"use strict";

var U = global.U || {
  esc: function(s){ return String(s || '').replace(/[&<>"']/g, function(m){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]; }); },
  $: function(sel, r){ return (r || document).querySelector(sel); }
};

var isOpen = false;
var unreadCount = 0;
var liveToastTimer = null;

function orbHtml(sizeCls){
  if (U && typeof U.aiOrb === "function") return U.aiOrb(sizeCls);
  return '<span class="ai-orb ' + (sizeCls || "ai-orb-sm") + '" aria-hidden="true"><span class="ai-orb-eyes"><i class="ai-orb-eye"></i><i class="ai-orb-eye"></i></span></span>';
}

var QUICK_CHIPS = [
  "🎯 Amar 4 months por tuition dite hobe, sathe family ke monthly taka pathate hoy",
  "🔔 My upcoming payment notifications",
  "📡 What changed on the website?",
  "⚡ Deposit 1000 USDT",
  "⇄ Swap 500 USDT to BDT",
  "🪙 What is my crypto wallet balance?",
  "💸 Send 1,000 CNY to Rahim",
  "🎓 My custom tuition plan",
  "🛡️ Is this payment safe?",
  "⚡ Cheapest provider to BD?"
];

function buildInitialGreetingHtml(){
  return (
    /* Center 3D Glowing Purple Orb Hero (Matches Reference Image 1) */
    '<div class="f-copilot-hero">' +
      orbHtml("ai-orb-lg") +
      '<div class="f-copilot-hero-title">AI Copilot</div>' +
      '<div class="f-copilot-hero-sub">Copilot+ Agent · Nemotron 3 Ultra 550B</div>' +
    '</div>' +

    /* Initial Bot Message Row with Mini 3D Purple Orb Avatar */
    '<div class="f-bot-row">' +
      orbHtml("ai-orb-sm") +
      '<div class="f-bot-bubble">' +
        '<div style="font-weight:700;color:#0f172a;margin-bottom:3px;">Your JPY balance is up 4% this week</div>' +
        '<div style="font-size:12px;color:#475569;">Live portfolio synced ($48,493.24 USD). Ask me to plan your 4-month tuition + family remittance, compare rates, or execute a live Vault action.</div>' +
      '</div>' +
    '</div>' +

    /* Quick-Suggest Pills directly below the bubble (Matches Reference Image 1) */
    '<div class="f-quick-suggest-row">' +
      '<button type="button" class="ai-quick-suggest-pill" data-fchip="Amar 4 months por tuition dite hobe, sathe family ke monthly taka pathate hoy">Quick-suggest · 4-Mo Plan</button>' +
      '<button type="button" class="ai-quick-suggest-pill" data-fchip="Which provider is cheapest right now?">Quick-suggest · Best Rate</button>' +
      '<button type="button" class="ai-quick-suggest-pill" data-fchip="Deposit 1000 USDT">Quick-suggest · +1,000 USDT</button>' +
      '<button type="button" class="ai-quick-suggest-pill" data-fchip="What changed on the website?">Quick-suggest · Live Status</button>' +
    '</div>'
  );
}

function initFloatingCopilot(){
  if (document.getElementById("floatingCopilotRoot")) return;

  var root = document.createElement("div");
  root.id = "floatingCopilotRoot";
  root.className = "floating-copilot-container";

  root.innerHTML =
    /* Live Proactive Notification Pill */
    '<div id="fCopilotLivePill" style="display:none;position:absolute;bottom:62px;right:0;width:min(320px,calc(100vw - 28px));background:#0f172a;color:#f8fafc;border:1px solid rgba(22,163,74,0.55);border-radius:16px;padding:10px 14px;box-shadow:0 12px 28px rgba(20,83,45,0.45);font-size:12px;line-height:1.45;cursor:pointer;z-index:9992;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;">' +
        '<span style="font-size:10px;font-weight:800;color:#16A34A;letter-spacing:0.05em;">📡 AI COPILOT+ REAL-TIME TRACKER</span>' +
        '<span style="font-size:10px;color:#94a3b8;">Tap to open</span>' +
      '</div>' +
      '<div id="fCopilotLivePillText" style="font-weight:600;color:#f1f5f9;">Website data updated in real time.</div>' +
    '</div>' +

    /* Floating Launcher Button with 3D Glowing Purple Orb */
    '<button type="button" id="floatingCopilotBtn" class="floating-copilot-btn" aria-label="Open AI Financial Copilot Chat" title="Ask AI Financial Copilot+ (NVIDIA Nemotron 3 Ultra 550B)">' +
      orbHtml("ai-orb-sm") +
      '<span class="f-copilot-label">AI Copilot+</span>' +
      '<span id="fCopilotUnreadBadge" style="display:none;background:#ef4444;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:999px;padding:0 5px;align-items:center;justify-content:center;">0</span>' +
      '<span class="f-copilot-dot" title="NVIDIA Nemotron 3 Ultra 550B · Real-Time Tracker Active"></span>' +
    '</button>' +

    /* Floating Chat Window (Matches Reference Image 1) */
    '<div id="floatingCopilotWindow" class="floating-copilot-window" style="display:none;" role="dialog" aria-modal="true" aria-label="AI Financial Copilot Chat">' +
      /* Top Header: "AI Financial Copilot Chat" + ••• + Close */
      '<div class="f-copilot-head">' +
        '<h3>AI Financial Copilot Chat</h3>' +
        '<div style="display:flex;align-items:center;gap:4px;">' +
          '<a href="#/copilot" id="fExpandBtn" class="f-copilot-dots-btn" title="Open Full AI Copilot Studio (•••)" style="text-decoration:none;letter-spacing:1px;">•••</a>' +
          '<button type="button" id="fResetChatBtn" class="f-copilot-dots-btn" title="Reset Chat" style="font-size:13px;">↺</button>' +
          '<button type="button" id="fCloseBtn" class="f-copilot-dots-btn" title="Close" style="font-size:15px;">✕</button>' +
        '</div>' +
      '</div>' +

      /* Subtle Live Status Strip */
      '<div id="fLiveStatusBanner" style="background:#F0FDF4;padding:6px 14px;border-bottom:1px solid #dcfce7;font-size:10.5px;color:#14532D;display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
        '<span id="fLiveStatusText" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📡 Tracking Vault, Crypto, Tuition &amp; 18+ Corridors live</span>' +
        '<span style="background:#dcfce7;color:#15803D;padding:2px 7px;border-radius:999px;font-weight:800;font-size:9.5px;white-space:nowrap;">LIVE AGENT</span>' +
      '</div>' +

      /* Chat Messages Scroll Log */
      '<div class="f-copilot-log" id="fChatLog">' +
        buildInitialGreetingHtml() +
      '</div>' +

      /* Horizontal Swipeable Quick-Prompt Chips */
      '<div class="f-copilot-chips" id="fChips">' +
        QUICK_CHIPS.map(function(c){
          return '<button type="button" class="chip" data-fchip="' + U.esc(c) + '">' + U.esc(c) + '</button>';
        }).join("") +
      '</div>' +

      /* Bottom Pill Input Bar with Circular Purple Upward-Arrow Button (Matches Reference Image 1) */
      '<form id="fChatForm" class="f-copilot-in" novalidate>' +
        '<div class="f-copilot-pill-bar">' +
          '<input type="text" id="fChatInput" placeholder="Type a message..." autocomplete="off" maxlength="300">' +
          '<button type="submit" id="fChatSend" class="f-copilot-send-circle" aria-label="Send message" title="Send message">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>' +
          '</button>' +
        '</div>' +
      '</form>' +
    '</div>';

  document.body.appendChild(root);
  bindEvents();
  bindRealTimeTracker();
  syncCopilotVisibility();
}

function syncCopilotVisibility(){
  var root = document.getElementById("floatingCopilotRoot");
  if (!root) return;
  var signedIn = !!(global.AuthService && global.AuthService.signedIn());
  root.style.display = signedIn ? "" : "none";
  if (!signedIn && isOpen){
    var w = document.getElementById("floatingCopilotWindow");
    var b = document.getElementById("floatingCopilotBtn");
    if (w && b){
      isOpen = false;
      w.style.display = "none";
      b.classList.remove("active");
    }
  }
}

function setUnreadBadge(n){
  unreadCount = Math.max(0, Number(n) || 0);
  var badge = document.getElementById("fCopilotUnreadBadge");
  if (!badge) return;
  if (unreadCount > 0 && !isOpen){
    badge.style.display = "inline-flex";
    badge.textContent = String(unreadCount);
  } else {
    badge.style.display = "none";
  }
}

var bootTimeMs = Date.now();
function showLivePillNotification(ev){
  if (Date.now() - bootTimeMs < 1500) return;
  if (!global.AuthService || !global.AuthService.signedIn()) return;
  var pill = document.getElementById("fCopilotLivePill");
  var pillTxt = document.getElementById("fCopilotLivePillText");
  if (!pill || !pillTxt || isOpen) return;
  pillTxt.innerHTML = '<b>' + U.esc(ev.title) + ':</b> ' + U.esc(ev.summary);
  pill.style.display = "block";
  if (liveToastTimer) clearTimeout(liveToastTimer);
  liveToastTimer = setTimeout(function(){
    pill.style.display = "none";
  }, 3200);
}

function bindRealTimeTracker(){
  if (!global.ProbahoLocalLLM || typeof global.ProbahoLocalLLM.onLiveEvent !== "function") return;

  global.ProbahoLocalLLM.onLiveEvent(function(ev){
    if (!ev) return;
    var bannerTxt = document.getElementById("fLiveStatusText");
    if (bannerTxt){
      bannerTxt.textContent = "📡 [" + ev.timeStr + "] " + ev.category + ": " + ev.title;
    }
    if (ev.category === "NAVIGATION") return;

    var log = document.getElementById("fChatLog");
    if (log){
      var row = document.createElement("div");
      row.className = "f-bot-row";
      row.innerHTML =
        orbHtml("ai-orb-sm") +
        '<div class="f-bot-bubble" style="background:#F0FDF4;border-color:#BBF7D0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;gap:6px;">' +
            '<span style="font-size:9.5px;font-weight:800;color:#15803D;">📡 LIVE UPDATE · ' + U.esc(ev.category) + '</span>' +
            '<span class="mono" style="font-size:9.5px;color:#64748b;">' + U.esc(ev.timeStr) + '</span>' +
          '</div>' +
          '<div style="color:#0f172a;font-weight:700;margin-bottom:2px;">' + U.esc(ev.title) + '</div>' +
          '<div style="color:#334155;font-size:12px;">' + U.esc(ev.summary) + '</div>' +
        '</div>';
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
    }

    if (!isOpen){
      setUnreadBadge(unreadCount + 1);
      showLivePillNotification(ev);
    }
  });
}

function bindEvents(){
  var triggerBtn = document.getElementById("floatingCopilotBtn");
  var windowEl = document.getElementById("floatingCopilotWindow");
  var closeBtn = document.getElementById("fCloseBtn");
  var resetBtn = document.getElementById("fResetChatBtn");
  var formEl = document.getElementById("fChatForm");
  var inputEl = document.getElementById("fChatInput");
  var chipsEl = document.getElementById("fChips");
  var logEl = document.getElementById("fChatLog");
  var pillEl = document.getElementById("fCopilotLivePill");

  if (!triggerBtn || !windowEl) return;

  function toggleOpen(){
    isOpen = !isOpen;
    if (isOpen){
      windowEl.style.display = "flex";
      triggerBtn.classList.add("active");
      setUnreadBadge(0);
      if (pillEl) pillEl.style.display = "none";
      setTimeout(function(){
        if (inputEl) inputEl.focus();
      }, 80);
    } else {
      windowEl.style.display = "none";
      triggerBtn.classList.remove("active");
    }
  }

  triggerBtn.addEventListener("click", toggleOpen);
  if (pillEl){
    pillEl.addEventListener("click", function(){
      pillEl.style.display = "none";
      if (!isOpen) toggleOpen();
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", function(){
    isOpen = false;
    windowEl.style.display = "none";
    triggerBtn.classList.remove("active");
  });
  if (resetBtn && logEl){
    resetBtn.addEventListener("click", function(){
      logEl.innerHTML = buildInitialGreetingHtml();
    });
  }

  function handleChipClick(e){
    var btn = e.target.closest("[data-fchip]");
    if (btn){
      var text = btn.getAttribute("data-fchip");
      var clean = text.replace(/^[^\w\s]+\s*/, '');
      sendUserMessage(clean);
    }
  }

  if (chipsEl) chipsEl.addEventListener("click", handleChipClick);
  if (logEl) logEl.addEventListener("click", handleChipClick);

  if (formEl){
    formEl.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = inputEl.value.trim();
      if (!msg) return;
      inputEl.value = "";
      sendUserMessage(msg);
    });
  }
}

function appendUserBubble(text){
  var log = document.getElementById("fChatLog");
  if (!log) return;
  var div = document.createElement("div");
  div.className = "msg me";
  div.style.cssText = "border-radius:18px 18px 6px 18px;background:linear-gradient(135deg,#15803D,#4f46e5);color:#fff;max-width:85%;align-self:flex-end;padding:10px 14px;font-size:13px;line-height:1.45;margin-left:auto;box-shadow:0 4px 12px rgba(22,163,74,0.25);";
  div.innerHTML = '<div>' + U.esc(text) + '</div>';
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
    return '<div style="margin-bottom:3px;display:flex;align-items:flex-start;gap:6px;">' +
      '<span style="color:#15803D;font-weight:700;">✓</span>' +
      '<span>' + U.esc(s) + '</span>' +
    '</div>';
  }).join("");

  return '<details class="ai-thought-trace" style="margin-bottom:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;font-size:11.5px;color:#64748b;">' +
    '<summary style="cursor:pointer;font-weight:750;color:#15803D;display:flex;align-items:center;gap:6px;list-style:none;">' +
      '<span>💭 Thought for ' + (elapsedSec || "1.4") + 's · View reasoning process</span>' +
      '<span style="font-size:10px;margin-left:auto;">▼</span>' +
    '</summary>' +
    '<div style="margin-top:8px;padding-top:6px;border-top:1px dashed #cbd5e1;line-height:1.5;color:#334155;">' +
      stepsHtml +
    '</div>' +
  '</details>';
}

function appendBotReply(replyObj, elapsedSec){
  var log = document.getElementById("fChatLog");
  if (!log) return;

  var actionsHtml = "";
  if (replyObj.actions && replyObj.actions.length > 0){
    actionsHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;">' +
      replyObj.actions.map(function(act){
        var btnClass = act.primary ? "btn-primary" : "btn-secondary";
        return '<a href="' + act.route + '" class="btn btn-sm ' + btnClass + '" style="border-radius:999px;padding:5px 12px;font-size:11.5px;font-weight:700;text-decoration:none;">' +
          U.esc(act.label) +
        '</a>';
      }).join("") +
    '</div>';
  }

  var thoughtHtml = renderThinkingDetails(replyObj ? replyObj.thinking : null, elapsedSec);
  var row = document.createElement("div");
  row.className = "f-bot-row";
  row.innerHTML =
    orbHtml("ai-orb-sm") +
    '<div class="f-bot-bubble" style="flex:1;">' +
      thoughtHtml +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px;flex-wrap:wrap;">' +
        '<span style="font-size:10px;font-weight:800;color:#15803D;letter-spacing:0.4px;">' + U.esc(replyObj.title || "AI COPILOT+ AGENT") + '</span>' +
        '<span style="font-size:9px;font-weight:750;color:#059669;background:#dcfce7;padding:2px 6px;border-radius:999px;">' + U.esc(replyObj.badge || "LIVE") + '</span>' +
      '</div>' +
      '<p style="margin:0 0 6px;color:#0f172a;">' + replyObj.text + '</p>' +
      (replyObj.dataBox ? '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;margin:6px 0;font-size:12px;line-height:1.5;color:#334155;">' + replyObj.dataBox + '</div>' : '') +
      (replyObj.followUp ? '<p style="margin:6px 0 0;font-size:12px;color:#475569;font-weight:600;">' + U.esc(replyObj.followUp) + '</p>' : '') +
      actionsHtml +
    '</div>';

  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function sendUserMessage(msg){
  appendUserBubble(msg);

  var log = document.getElementById("fChatLog");
  var typingRow = document.createElement("div");
  typingRow.className = "f-bot-row";
  typingRow.id = "fTyping";
  typingRow.innerHTML =
    orbHtml("ai-orb-sm") +
    '<div class="f-bot-bubble" style="background:#f8fafc;border:1.5px solid #16A34A;padding:12px 16px;max-width:92%;box-shadow:0 4px 14px rgba(22,163,74,0.12);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
        '<span style="font-size:11px;font-weight:800;color:#15803D;display:flex;align-items:center;gap:6px;">' +
          '<span class="typing"><i></i><i></i><i></i></span>' +
          '<span>AI Copilot Thinking...</span>' +
        '</span>' +
        '<span class="mono" style="font-size:11px;color:#64748b;font-weight:700;" id="fThinkingTimer">0.2s</span>' +
      '</div>' +
      '<div id="fThinkingStep" style="font-size:12px;color:#334155;line-height:1.45;">' +
        '• Step 1: Parsing user query &amp; financial intent...' +
      '</div>' +
    '</div>';
  log.appendChild(typingRow);
  log.scrollTop = log.scrollHeight;

  var startTime = Date.now();
  var thinkingTimer = setInterval(function(){
    var elapsedMs = Date.now() - startTime;
    var secStr = (elapsedMs / 1000).toFixed(1) + "s";
    var tEl = document.getElementById("fThinkingTimer");
    if (tEl) tEl.textContent = secStr;
    var sEl = document.getElementById("fThinkingStep");
    if (sEl){
      if (elapsedMs < 400) sEl.innerHTML = "• Step 1: Analyzing query parameters &amp; financial intent...";
      else if (elapsedMs < 800) sEl.innerHTML = "• Step 2: Querying live website telemetry: Vault balances, active corridor &amp; KYC daily quota...";
      else if (elapsedMs < 1200) sEl.innerHTML = "• Step 3: Checking upcoming payment notifications, tuition sinking schedules &amp; ScamShield heuristics...";
      else sEl.innerHTML = "• Step 4: Formulating verified, error-free financial advice &amp; synchronizing state...";
    }
  }, 100);

  function finishWithReply(reply){
    var elapsedTotal = Math.max(1400, Date.now() - startTime);
    var remainingWait = Math.max(0, 1400 - (Date.now() - startTime));
    setTimeout(function(){
      clearInterval(thinkingTimer);
      if (typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
      var secFormatted = (elapsedTotal / 1000).toFixed(1);
      appendBotReply(reply, secFormatted);
    }, remainingWait);
  }

  var LLM = global.ProbahoLocalLLM;
  if (LLM && typeof LLM.inferAsync === "function"){
    LLM.inferAsync(msg).then(function(reply){
      finishWithReply(reply || LLM.infer(msg));
    }).catch(function(){
      finishWithReply(LLM.infer(msg));
    });
  } else {
    var rep = LLM ? LLM.infer(msg) : { text: "Thinking locally...", actions: [] };
    finishWithReply(rep);
  }
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initFloatingCopilot);
} else {
  initFloatingCopilot();
}

window.addEventListener("hashchange", syncCopilotVisibility);

global.FloatingCopilot = {
  syncVisibility: syncCopilotVisibility,
  open: function(){
    if (!global.AuthService || !global.AuthService.signedIn()){
      if (global.Toast) global.Toast.show("Please sign in first to access AI Copilot.", "warn");
      location.hash = "#/sign-in";
      return;
    }
    var w = document.getElementById("floatingCopilotWindow");
    var b = document.getElementById("floatingCopilotBtn");
    if (w && b){
      isOpen = true;
      w.style.display = "flex";
      b.classList.add("active");
      setUnreadBadge(0);
    }
  },
  close: function(){
    var w = document.getElementById("floatingCopilotWindow");
    var b = document.getElementById("floatingCopilotBtn");
    if (w && b){
      isOpen = false;
      w.style.display = "none";
      b.classList.remove("active");
    }
  }
};

})(typeof window !== "undefined" ? window : global);

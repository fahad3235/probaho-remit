/* rates.js — Global Currency Rate Board matching Screen 6.
   Currency table: 12 global currencies. Tabs: Live Rates, History, Alerts (persisted in AppState). */
(function(global){
"use strict";
var U = global.U;

function renderFXView(activeTab){
  var el = U.$("#view");
  if (!el) return;
  var rates = global.SeedLiveRates || [];
  var tab = activeTab || "live";
  var alerts = (global.AppState && global.AppState.get("rateAlerts")) || [];

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      '<div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">' +
        '<div>' +
          '<p class="eyebrow">Module 3 · Global Rate Board</p>' +
          '<h1 class="page-title">Global FX Rates & Alerts</h1>' +
          '<p class="page-sub">Synthetic reference exchange rates across 12 global currencies with 60s rate-lock handoff and custom target alerts.</p>' +
        '</div>' +
        '<a href="#/fx-advisor" class="btn btn-secondary btn-sm" style="border-radius:10px;">📈 Open 90-Day Statistical FX Advisor →</a>' +
      '</div>' +

      /* Tabs Row: Live Rates | History | Alerts */
      '<div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid #e2e8f0;padding-bottom:10px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-sm ' + (tab==="live"?"btn-primary":"btn-secondary") + '" id="fxTabLive" style="border-radius:8px;">Global Rate Board (' + rates.length + ')</button>' +
        '<button type="button" class="btn btn-sm ' + (tab==="history"?"btn-primary":"btn-secondary") + '" id="fxTabHistory" style="border-radius:8px;">90-Day Trend</button>' +
        '<button type="button" class="btn btn-sm ' + (tab==="alerts"?"btn-primary":"btn-secondary") + '" id="fxTabAlerts" style="border-radius:8px;">Rate Alerts (' + alerts.length + ')</button>' +
      '</div>' +

      (tab === "live" ?
        /* TAB 1: LIVE RATES (Screen 6) */
        '<div class="grid gm" style="grid-template-columns: 1.45fr 0.85fr; gap: 24px;">' +
          /* Left: Currency Table */
          '<div class="card" style="border-radius:20px;padding:22px;">' +
            '<div class="card-head"><h2>Illustrative Global Exchange Rates (Synthetic Reference)</h2><span class="badge badge-demo">SYNTHETIC RATES · NOT LIVE QUOTES</span></div>' +
            '<div style="overflow-x:auto;">' +
              '<table class="clean-table data">' +
                '<thead>' +
                  '<tr>' +
                    '<th>Currency</th>' +
                    '<th>Region</th>' +
                    '<th>vs USD</th>' +
                    '<th>vs BDT (Buy / Sell)</th>' +
                    '<th>24h Change</th>' +
                    '<th style="text-align:right;">Action</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  rates.map(function(r){
                    var chgClass = r.change > 0 ? "trend-up" : r.change < 0 ? "trend-down" : "";
                    var chgSign = r.change > 0 ? "+" : "";
                    return '<tr>' +
                      '<td>' +
                        '<div style="display:flex;align-items:center;gap:10px;">' +
                          '<span style="font-size:18px;">' + r.flag + '</span>' +
                          '<div>' +
                            '<b style="font-size:14px;color:#0f172a;">' + U.esc(r.ccy) + '</b>' +
                            '<span style="display:block;font-size:11px;color:#64748b;">' + U.esc(r.name) + '</span>' +
                          '</div>' +
                        '</div>' +
                      '</td>' +
                      '<td><span class="badge badge-neutral" style="font-size:10.5px;">' + U.esc(r.region || "Global") + '</span></td>' +
                      '<td class="mono" style="font-weight:600;color:#475569;">' + (r.usdRate ? r.usdRate.toFixed(4) : "—") + '</td>' +
                      '<td class="mono" style="font-weight:700;font-size:13.5px;">৳' + r.buy.toFixed(2) + ' / ৳' + r.sell.toFixed(2) + '</td>' +
                      '<td>' +
                        '<span class="trend-pill ' + chgClass + '">' + chgSign + r.change.toFixed(2) + '%</span>' +
                      '</td>' +
                      '<td style="text-align:right;">' +
                        '<button type="button" class="btn btn-sm btn-secondary" data-rate-corr="' + U.esc(r.corridorId || "us-dhaka") + '" style="padding:4px 10px;font-size:12px;">Send →</button>' +
                      '</td>' +
                    '</tr>';
                  }).join("") +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +

          /* Right: Market Insight Card + Multi-Currency Converter */
          '<div style="display:grid;gap:20px;align-content:start;">' +
            '<div class="card" style="border-radius:20px;padding:24px;background:linear-gradient(135deg,#E6F8F7,#CCFBF1);border:1px solid #99F6E4;">' +
              '<span style="font-size:11px;font-weight:800;color:#071B33;text-transform:uppercase;letter-spacing:0.08em;">GLOBAL MARKET INSIGHT</span>' +
              '<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:8px 0;">USD & CNY showing strength across Asian corridors</h3>' +
              '<p style="font-size:13.5px;color:#334155;line-height:1.5;margin:0 0 16px;">' +
                'Simulated 90-day moving averages indicate favorable sender conditions on USD, GBP, and CNY corridors. ' +
                'Use the 60-second rate lock during checkout or inspect the 90-day timing signal.' +
              '</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button type="button" class="btn btn-primary btn-sm" id="fxViewAnalysisBtn" style="border-radius:10px;">View 90-Day Chart</button>' +
                '<a href="#/fx-advisor" class="btn btn-secondary btn-sm" style="border-radius:10px;">Signal Advisor →</a>' +
              '</div>' +
            '</div>' +

            '<div class="card" style="border-radius:20px;padding:22px;">' +
              '<div class="card-head"><h2>Quick Multi-Currency Converter</h2></div>' +
              '<div style="font-size:13px;color:#64748b;margin-bottom:12px;">Instant conversion against synthetic mid-market reference:</div>' +
              '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:10px;">' +
                '<input class="input mono" type="number" id="quickFxInput" value="1000" style="font-weight:700;">' +
                '<select class="input" id="quickFxCcy" style="width:110px;font-weight:700;">' +
                  rates.map(function(r){ return '<option value="' + r.buy + '" data-ccy="' + r.ccy + '">' + r.flag + ' ' + r.ccy + '</option>'; }).join("") +
                '</select>' +
              '</div>' +
              '<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="font-size:12.5px;color:#64748b;">Converted Value:</span>' +
                '<b style="font-size:18px;color:#0D9F9A;" id="quickFxResult">৳119,500.00 BDT</b>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' :

        tab === "history" ?
        /* TAB 2: HISTORY 90-DAY CHART */
        '<div class="card" style="border-radius:20px;padding:26px;">' +
          '<div class="card-head">' +
            '<h2>90-Day Exchange Rate Trend · USD to BDT</h2>' +
            '<span class="badge badge-demo">7-DAY MOVING AVERAGE</span>' +
          '</div>' +
          '<div style="height:280px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;margin:16px 0;">' +
            '<svg viewBox="0 0 700 240" width="100%" height="240">' +
              '<defs>' +
                '<linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">' +
                  '<stop offset="0%" stop-color="#0D9F9A" stop-opacity="0.3"/>' +
                  '<stop offset="100%" stop-color="#0D9F9A" stop-opacity="0.0"/>' +
                '</linearGradient>' +
              '</defs>' +
              '<line x1="50" y1="50" x2="660" y2="50" stroke="#e2e8f0" stroke-dasharray="4 4"/>' +
              '<line x1="50" y1="120" x2="660" y2="120" stroke="#e2e8f0" stroke-dasharray="4 4"/>' +
              '<line x1="50" y1="190" x2="660" y2="190" stroke="#e2e8f0"/>' +
              '<path d="M 60 170 Q 150 140, 240 160 T 420 100 T 600 70 L 600 190 L 60 190 Z" fill="url(#fxGrad)"/>' +
              '<path d="M 60 170 Q 150 140, 240 160 T 420 100 T 600 70" fill="none" stroke="#0D9F9A" stroke-width="3"/>' +
              '<path d="M 60 165 Q 150 145, 240 155 T 420 110 T 600 80" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="4 4"/>' +
            '</svg>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#64748b;flex-wrap:wrap;gap:10px;">' +
            '<span>90 Days Ago: 117.80 BDT</span>' +
            '<span>Highest: 120.40 BDT</span>' +
            '<b style="color:#0D9F9A;">Current: 119.50 BDT</b>' +
            '<a href="#/fx-advisor" class="btn btn-primary btn-sm">Open Interactive Corridor FX Advisor →</a>' +
          '</div>' +
        '</div>' :

        /* TAB 3: ALERTS */
        '<div class="grid g2">' +
          '<div class="card" style="border-radius:20px;padding:26px;">' +
            '<div class="card-head"><h2>Create Rate Alert</h2><span class="badge badge-demo">LOCAL ALERT</span></div>' +
            '<p style="font-size:13.5px;color:#64748b;">Get notified in your dashboard when a global currency pair reaches your target rate.</p>' +
            '<div class="field" style="margin-top:14px;">' +
              '<label for="fxAlertPair">Currency Pair</label>' +
              '<select class="input" id="fxAlertPair">' +
                '<option value="USD / BDT">🇺🇸 USD / 🇧🇩 BDT (Current: 119.50)</option>' +
                '<option value="GBP / BDT">🇬🇧 GBP / 🇧🇩 BDT (Current: 151.80)</option>' +
                '<option value="EUR / BDT">🇪🇺 EUR / 🇧🇩 BDT (Current: 130.80)</option>' +
                '<option value="CNY / BDT">🇨🇳 CNY / 🇧🇩 BDT (Current: 16.75)</option>' +
                '<option value="CAD / BDT">🇨🇦 CAD / 🇧🇩 BDT (Current: 86.80)</option>' +
                '<option value="USD / INR">🇺🇸 USD / 🇮🇳 INR (Current: 83.90)</option>' +
                '<option value="USD / PHP">🇺🇸 USD / 🇵🇭 PHP (Current: 57.40)</option>' +
              '</select>' +
            '</div>' +
            '<div class="field">' +
              '<label for="fxAlertRate">Target Rate</label>' +
              '<input class="input mono" type="number" step="0.01" id="fxAlertRate" value="120.50">' +
            '</div>' +
            '<button type="button" class="btn btn-primary" id="fxCreateAlertBtn" style="margin-top:8px;border-radius:10px;width:100%;">+ Create Rate Alert</button>' +
          '</div>' +

          '<div class="card" style="border-radius:20px;padding:26px;">' +
            '<div class="card-head"><h2>Active Rate Alerts (' + alerts.length + ')</h2></div>' +
            (alerts.length === 0 ?
              '<p class="muted" style="padding:20px 0;">No active rate alerts. Create one on the left.</p>' :
              '<div style="display:grid;gap:10px;margin-top:12px;">' +
                alerts.map(function(a){
                  return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">' +
                    '<div>' +
                      '<b style="font-size:14px;color:#0f172a;display:block;">' + U.esc(a.pair) + ' ≥ ' + Number(a.target).toFixed(2) + '</b>' +
                      '<small style="color:#64748b;">Created: ' + U.esc(a.created || "Today") + '</small>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                      '<span class="badge badge-ok">Active</span>' +
                      '<button type="button" class="btn btn-ghost btn-sm" data-del-alert="' + U.esc(a.id) + '" style="color:#ef4444;">✕</button>' +
                    '</div>' +
                  '</div>';
                }).join("") +
              '</div>') +
          '</div>' +
        '</div>'
      ) +

    '</div>';

  /* Event Listeners */
  var tabLive = U.$("#fxTabLive", el);
  var tabHist = U.$("#fxTabHistory", el);
  var tabAlrt = U.$("#fxTabAlerts", el);

  if (tabLive) tabLive.addEventListener("click", function(){ renderFXView("live"); });
  if (tabHist) tabHist.addEventListener("click", function(){ renderFXView("history"); });
  if (tabAlrt) tabAlrt.addEventListener("click", function(){ renderFXView("alerts"); });

  var viewAnalysis = U.$("#fxViewAnalysisBtn", el);
  if (viewAnalysis) viewAnalysis.addEventListener("click", function(){ renderFXView("history"); });

  el.querySelectorAll("[data-rate-corr]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var cid = btn.getAttribute("data-rate-corr");
      if (global.AppState) global.AppState.set("corridorId", cid);
      location.hash = "#/corridor-optimizer";
    });
  });

  var quickIn = U.$("#quickFxInput", el);
  var quickCcy = U.$("#quickFxCcy", el);
  var quickOut = U.$("#quickFxResult", el);
  function updateQuickConv(){
    if (!quickIn || !quickOut) return;
    var v = Math.max(0, parseFloat(quickIn.value) || 0);
    var r = quickCcy ? (parseFloat(quickCcy.value) || 119.50) : 119.50;
    quickOut.textContent = "৳" + (v * r).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " BDT";
  }
  if (quickIn) quickIn.addEventListener("input", updateQuickConv);
  if (quickCcy) quickCcy.addEventListener("change", updateQuickConv);

  var alertBtn = U.$("#fxCreateAlertBtn", el);
  var alertRateIn = U.$("#fxAlertRate", el);
  var alertPairIn = U.$("#fxAlertPair", el);
  if (alertBtn){
    alertBtn.addEventListener("click", function(){
      var rateVal = alertRateIn ? parseFloat(alertRateIn.value) : 120.50;
      var pairVal = alertPairIn ? alertPairIn.value : "USD / BDT";
      if (!rateVal || rateVal <= 0 || !isFinite(rateVal)) {
        global.Toast.show("Please enter a valid positive target rate.", "warn");
        return;
      }
      var list = (global.AppState && global.AppState.get("rateAlerts") ? global.AppState.get("rateAlerts") : []).slice();
      list.unshift({
        id: "alrt-" + Date.now(),
        pair: pairVal,
        target: rateVal,
        direction: "above",
        active: true,
        created: "Just now"
      });
      if (global.AppState) global.AppState.set("rateAlerts", list);
      if (global.NotificationHub && typeof global.NotificationHub.addNotification === "function"){
        global.NotificationHub.addNotification({
          category: "RATE_ALERT",
          title: "📈 FX Rate Alert Active: " + pairVal + " ≥ " + rateVal.toFixed(2),
          message: "You will be notified immediately when " + pairVal + " reaches " + rateVal.toFixed(2) + " on the global market board.",
          actionLabel: "Open Optimizer",
          actionRoute: "#/corridor-optimizer",
          amount: rateVal.toFixed(2)
        }, false);
      }
      global.Toast.show("Rate alert created for " + pairVal + " at " + rateVal.toFixed(2) + "!", "ok");
      renderFXView("alerts");
    });
  }

  el.querySelectorAll("[data-del-alert]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.getAttribute("data-del-alert");
      var list = ((global.AppState && global.AppState.get("rateAlerts")) || []).filter(function(x){ return x.id !== id; });
      if (global.AppState) global.AppState.set("rateAlerts", list);
      global.Toast.show("Rate alert removed.", "ok");
      renderFXView("alerts");
    });
  });
}

global.ModRates = { render: function(){ renderFXView("live"); }, meta:{ title:"Rates", nav:"Rates", icon:"chart" } };
})(typeof window !== "undefined" ? window : global);

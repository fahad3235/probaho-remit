/* analytics.js — Interactive Executive Analytics & Global Corridor Intelligence Center.
   Dynamic timeframe selector (7D, 30D, 90D, 1Y), live Vault & Transfer telemetry,
   Corridor Performance Breakdown Table, and 1-Click CSV & Print Export. */
(function(global){
"use strict";
var U = global.U;

var activeRange = "30d";

var RANGE_DATA = {
  "7d":  { rev: "$6,420",   tx: "4,210",  users: "1,203", conv: "3.4%", saved: "$1,180", inc: "৳42,500",  trend: "+12%", pts: [165, 145, 152, 110, 85, 68], labels: ["Oct 8", "Oct 9", "Oct 10", "Oct 11", "Oct 12", "Oct 14"] },
  "30d": { rev: "$24,680",  tx: "18,429", users: "3,840", conv: "3.8%", saved: "$4,920", inc: "৳184,200", trend: "+15%", pts: [170, 140, 155, 100, 75, 55], labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Now"] },
  "90d": { rev: "$71,450",  tx: "52,910", users: "8,920", conv: "4.1%", saved: "$14,300",inc: "৳512,800", trend: "+22%", pts: [175, 150, 130, 115, 80, 48], labels: ["Aug", "Late Aug", "Sep", "Late Sep", "Oct", "Now"] },
  "1y":  { rev: "$284,900", tx: "214,600",users: "12,480",conv: "4.5%", saved: "$58,400",inc: "৳2,140,000",trend: "+34%",pts: [180, 160, 135, 105, 70, 42], labels: ["Q1", "Q2", "Summer", "Autumn", "Winter", "2026"] }
};

function render(){
  var el = U.$("#view");
  if (!el) return;
  var d = RANGE_DATA[activeRange] || RANGE_DATA["30d"];
  var corridors = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors().slice(0, 8) : [];

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      '<div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">' +
        '<div>' +
          '<p class="eyebrow">Intelligence &amp; Telemetry</p>' +
          '<h1 class="page-title">Executive Analytics &amp; Corridor Performance</h1>' +
          '<p class="page-sub">Real-time cross-border volume, fee savings vs. traditional SWIFT banks, and 2.5% statutory remittance incentive telemetry.</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
          '<div style="display:flex;gap:4px;background:#f1f5f9;padding:4px;border-radius:10px;">' +
            [["7d","7 Days"],["30d","30 Days"],["90d","90 Days"],["1y","Full Year"]].map(function(pair){
              var isAct = activeRange === pair[0];
              return '<button type="button" class="btn btn-sm ' + (isAct ? 'btn-primary' : 'btn-ghost') + '" data-an-range="' + pair[0] + '" style="border-radius:8px;padding:6px 12px;font-size:12px;">' + pair[1] + '</button>';
            }).join("") +
          '</div>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btnExportAnalyticsCsv" style="border-radius:10px;">⬇ Export CSV</button>' +
        '</div>' +
      '</div>' +

      /* 4 Metric Cards */
      '<div class="stat-cards-grid">' +
        '<div class="metric-card-box">' +
          '<div class="metric-card-head">' +
            '<span class="metric-card-title">Total Remittance Volume</span>' +
            '<div class="metric-icon-bubble icon-blue">💰</div>' +
          '</div>' +
          '<div class="metric-card-val">' + d.rev + '</div>' +
          '<div><span class="trend-pill trend-up">↑ ' + d.trend + '</span><span class="trend-context">vs prior period</span></div>' +
        '</div>' +

        '<div class="metric-card-box">' +
          '<div class="metric-card-head">' +
            '<span class="metric-card-title">Total Transactions</span>' +
            '<div class="metric-icon-bubble icon-cyan">💳</div>' +
          '</div>' +
          '<div class="metric-card-val">' + d.tx + '</div>' +
          '<div><span class="trend-pill trend-up">↑ 99.8%</span><span class="trend-context">instant settlement</span></div>' +
        '</div>' +

        '<div class="metric-card-box">' +
          '<div class="metric-card-head">' +
            '<span class="metric-card-title">Customer Spread Saved</span>' +
            '<div class="metric-icon-bubble icon-emerald">🛡️</div>' +
          '</div>' +
          '<div class="metric-card-val">' + d.saved + '</div>' +
          '<div><span class="trend-pill trend-up">Saved</span><span class="trend-context">vs 3.35% bank spread</span></div>' +
        '</div>' +

        '<div class="metric-card-box">' +
          '<div class="metric-card-head">' +
            '<span class="metric-card-title">2.5% BD Govt Incentive</span>' +
            '<div class="metric-icon-bubble icon-gold">🇧🇩</div>' +
          '</div>' +
          '<div class="metric-card-val">' + d.inc + '</div>' +
          '<div><span class="trend-pill trend-up">Tax-Free</span><span class="trend-context">credited to receivers</span></div>' +
        '</div>' +
      '</div>' +

      /* Charts Grid */
      '<div class="dash-middle-grid">' +
        '<div class="dash-card">' +
          '<div class="dash-card-head">' +
            '<h3>Cross-Border Volume &amp; Liquidity Growth (' + activeRange.toUpperCase() + ')</h3>' +
            '<span style="font-size:12px;color:#16a34a;font-weight:700;">▲ ' + d.trend + ' growth</span>' +
          '</div>' +
          '<svg viewBox="0 0 600 230" width="100%" height="220">' +
            '<defs>' +
              '<linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">' +
                '<stop offset="0%" stop-color="#0D9F9A" stop-opacity="0.28"/>' +
                '<stop offset="100%" stop-color="#0D9F9A" stop-opacity="0.0"/>' +
              '</linearGradient>' +
            '</defs>' +
            '<line x1="40" y1="50" x2="570" y2="50" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
            '<text x="25" y="54" font-size="11" fill="#94a3b8" text-anchor="end">High</text>' +
            '<line x1="40" y1="125" x2="570" y2="125" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
            '<text x="25" y="129" font-size="11" fill="#94a3b8" text-anchor="end">Mid</text>' +
            '<line x1="40" y1="200" x2="570" y2="200" stroke="#e2e8f0" stroke-width="1.5"/>' +
            '<path d="M 50 ' + d.pts[0] + ' Q 150 ' + d.pts[1] + ', 250 ' + d.pts[2] + ' T 450 ' + d.pts[4] + ' T 550 ' + d.pts[5] + ' L 550 200 L 50 200 Z" fill="url(#revGrad)"/>' +
            '<path d="M 50 ' + d.pts[0] + ' Q 150 ' + d.pts[1] + ', 250 ' + d.pts[2] + ' T 450 ' + d.pts[4] + ' T 550 ' + d.pts[5] + '" fill="none" stroke="#0D9F9A" stroke-width="3.5" stroke-linecap="round"/>' +
            '<circle cx="550" cy="' + d.pts[5] + '" r="5.5" fill="#0D9F9A"/>' +
            d.labels.map(function(lbl, idx){
              return '<text x="' + (50 + idx * 100) + '" y="220" font-size="11" fill="#94a3b8" text-anchor="middle">' + lbl + '</text>';
            }).join("") +
          '</svg>' +
        '</div>' +

        '<div class="dash-card">' +
          '<div class="dash-card-head">' +
            '<h3>Settlement Rail Distribution</h3>' +
          '</div>' +
          '<div class="donut-center-group">' +
            '<div style="position:relative;width:140px;height:140px;">' +
              '<svg viewBox="0 0 140 140" width="140" height="140">' +
                '<circle cx="70" cy="70" r="54" fill="none" stroke="#0D9F9A" stroke-width="18" stroke-dasharray="142.5 339.3" stroke-dashoffset="0" transform="rotate(-90 70 70)"/>' +
                '<circle cx="70" cy="70" r="54" fill="none" stroke="#8b5cf6" stroke-width="18" stroke-dasharray="95.0 339.3" stroke-dashoffset="-142.5" transform="rotate(-90 70 70)"/>' +
                '<circle cx="70" cy="70" r="54" fill="none" stroke="#06b6d4" stroke-width="18" stroke-dasharray="61.0 339.3" stroke-dashoffset="-237.5" transform="rotate(-90 70 70)"/>' +
                '<circle cx="70" cy="70" r="54" fill="none" stroke="#10b981" stroke-width="18" stroke-dasharray="40.7 339.3" stroke-dashoffset="-298.5" transform="rotate(-90 70 70)"/>' +
              '</svg>' +
              '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
                '<b style="font-size:17px;font-weight:850;color:#0f172a;">' + d.tx + '</b>' +
                '<span style="font-size:11px;color:#64748b;">Settled</span>' +
              '</div>' +
            '</div>' +
            '<div class="donut-legend-col">' +
              '<div class="donut-legend-item"><span class="color-dot" style="background:#0D9F9A;"></span> Mobile Wallets (bKash/Alipay) <b>42%</b></div>' +
              '<div class="donut-legend-item"><span class="color-dot" style="background:#8b5cf6;"></span> Direct Bank / IBAN / NPSB <b>28%</b></div>' +
              '<div class="donut-legend-item"><span class="color-dot" style="background:#06b6d4;"></span> Web3 Crypto (USDT/BTC/ETH) <b>18%</b></div>' +
              '<div class="donut-legend-item"><span class="color-dot" style="background:#10b981;"></span> University Tuition SWIFT <b>12%</b></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Corridor Performance Breakdown Table */
      '<div class="dash-card" style="margin-top:24px;">' +
        '<div class="dash-card-head">' +
          '<h3>Top Global Corridors Telemetry</h3>' +
          '<a href="#/corridor-optimizer" class="btn btn-sm btn-primary" style="border-radius:8px;text-decoration:none;">Compare All 18 Corridors →</a>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table class="clean-table">' +
            '<thead><tr><th>Corridor</th><th>Pair</th><th>Reference Mid-Rate</th><th>Avg Payout Speed</th><th>2.5% BD Govt Bonus</th><th style="text-align:right;">Action</th></tr></thead>' +
            '<tbody>' +
              corridors.map(function(c){
                var hasBonus = c.receiveCcy === "BDT";
                return '<tr>' +
                  '<td><b>' + (c.flagFrom || "") + ' ' + U.esc(c.label) + ' ' + (c.flagTo || "") + '</b></td>' +
                  '<td class="mono">' + U.esc(c.sendCcy) + ' → ' + U.esc(c.receiveCcy) + '</td>' +
                  '<td class="mono" style="font-weight:700;color:#0D9F9A;">1 ' + U.esc(c.sendCcy) + ' = ' + c.midRate + ' ' + U.esc(c.receiveCcy) + '</td>' +
                  '<td><span class="badge badge-ok">⚡ 2.4 mins (Wallet/RTP)</span></td>' +
                  '<td>' + (hasBonus ? '<span class="badge badge-ok">+2.5% Eligible</span>' : '<span class="tiny muted">Outbound Tuition</span>') + '</td>' +
                  '<td style="text-align:right;"><a href="#/send?corridor=' + U.esc(c.id) + '" class="btn btn-sm btn-secondary" style="border-radius:8px;text-decoration:none;">Send →</a></td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  U.$$("[data-an-range]", el).forEach(function(btn){
    btn.addEventListener("click", function(){
      activeRange = btn.getAttribute("data-an-range");
      render();
    });
  });

  var expBtn = U.$("#btnExportAnalyticsCsv", el);
  if (expBtn){
    expBtn.addEventListener("click", function(){
      var csv = "corridor,send_ccy,receive_ccy,mid_rate,range,volume,transactions\n" +
        corridors.map(function(c){ return [c.id, c.sendCcy, c.receiveCcy, c.midRate, activeRange, d.rev, d.tx].join(","); }).join("\n");
      var blob = new Blob([csv], { type: "text/csv" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "probaho-analytics-" + activeRange + ".csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
      if (global.Toast) global.Toast.show("Exported Executive Analytics CSV (" + activeRange.toUpperCase() + ")!", "ok");
    });
  }
}

global.ModAnalytics = { render: render, meta:{ title:"Analytics & Telemetry", nav:"Analytics", icon:"chart" } };
})(typeof window !== "undefined" ? window : global);

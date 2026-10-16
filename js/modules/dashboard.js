/* dashboard.js — User Dashboard matching Screen 2 (100% Standalone Client-Side).
   - Live KYC Tier Daily Limit Gauge from AppState
   - Saved Beneficiaries 1-Tap Quick-Send Bar
   - Active Transfers from AppState.get("transfers")
   - 4 Stat KPI Cards & Smooth Charts
   - Working Search Filter + Recent Transactions with "Send Again" and Receipt view */
(function(global){
"use strict";
var U = global.U;
var dashSearch = "";

function renderSmoothLineChart(timeframe){
  var points = timeframe === "12m" 
    ? [ { x: 50, y: 160 }, { x: 130, y: 130 }, { x: 210, y: 150 }, { x: 290, y: 90 }, { x: 370, y: 70 }, { x: 450, y: 100 }, { x: 530, y: 55 } ]
    : [ { x: 50, y: 165 }, { x: 140, y: 140 }, { x: 230, y: 160 }, { x: 320, y: 105 }, { x: 410, y: 80 }, { x: 500, y: 95 }, { x: 550, y: 65 } ];

  var dPath = "M " + points[0].x + " " + points[0].y;
  for (var i = 1; i < points.length; i++) {
    var prev = points[i - 1];
    var curr = points[i];
    var cx1 = prev.x + (curr.x - prev.x) / 2;
    var cy1 = prev.y;
    var cx2 = prev.x + (curr.x - prev.x) / 2;
    var cy2 = curr.y;
    dPath += " C " + cx1 + " " + cy1 + ", " + cx2 + " " + cy2 + ", " + curr.x + " " + curr.y;
  }
  var dArea = dPath + " L " + points[points.length-1].x + " 200 L " + points[0].x + " 200 Z";

  var xLabels = timeframe === "12m"
    ? ["Jan", "Mar", "May", "Jul", "Sep", "Nov", "Dec"]
    : ["Oct 6", "Oct 7", "Oct 8", "Oct 9", "Oct 10", "Oct 11", "Oct 12"];

  return '<svg viewBox="0 0 600 230" width="100%" height="220" style="overflow:visible;">' +
    '<defs>' +
      '<linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#0D9F9A" stop-opacity="0.28"/>' +
        '<stop offset="100%" stop-color="#0D9F9A" stop-opacity="0.0"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<line x1="40" y1="50" x2="570" y2="50" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<text x="25" y="54" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="end">30k</text>' +
    '<line x1="40" y1="100" x2="570" y2="100" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<text x="25" y="104" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="end">20k</text>' +
    '<line x1="40" y1="150" x2="570" y2="150" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<text x="25" y="154" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="end">10k</text>' +
    '<line x1="40" y1="200" x2="570" y2="200" stroke="#e2e8f0" stroke-width="1.5"/>' +
    '<text x="25" y="204" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="end">0k</text>' +
    '<path d="' + dArea + '" fill="url(#lineGrad)"/>' +
    '<path d="' + dPath + '" fill="none" stroke="#0D9F9A" stroke-width="3.5" stroke-linecap="round"/>' +
    points.map(function(p){
      return '<circle cx="' + p.x + '" cy="' + p.y + '" r="4.5" fill="#fff" stroke="#0D9F9A" stroke-width="2.5"/>';
    }).join("") +
    xLabels.map(function(lbl, idx){
      var x = 50 + idx * 83;
      return '<text x="' + x + '" y="222" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="middle">' + lbl + '</text>';
    }).join("") +
  '</svg>';
}

function renderDonutChart(){
  var segs = [
    { label: "Tuition", pct: 45, color: "#0D9F9A" },
    { label: "Family Support", pct: 30, color: "#8b5cf6" },
    { label: "Living Allowance", pct: 15, color: "#06b6d4" },
    { label: "Emergency", pct: 10, color: "#10b981" }
  ];

  var R = 54, C = 2 * Math.PI * R, off = 0;
  var arcs = segs.map(function(sg){
    var frac = sg.pct / 100;
    var arc = '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + sg.color + '" ' +
      'stroke-width="18" stroke-dasharray="' + (frac * C).toFixed(1) + ' ' + C.toFixed(1) + '" ' +
      'stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 70 70)"></circle>';
    off += frac * C;
    return arc;
  }).join("");

  var legend = segs.map(function(sg){
    return '<div class="donut-legend-item">' +
      '<span class="color-dot" style="background:' + sg.color + '"></span>' +
      '<span>' + sg.label + '</span>' +
      '<b>' + sg.pct + '%</b>' +
    '</div>';
  }).join("");

  return '<div class="donut-center-group">' +
    '<div style="position:relative;width:140px;height:140px;flex-shrink:0;">' +
      '<svg viewBox="0 0 140 140" width="140" height="140">' +
        '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="#f1f5f9" stroke-width="18"/>' +
        arcs +
      '</svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;">' +
        '<b style="font-size:18px;font-weight:850;color:#0f172a;">100%</b>' +
        '<span style="font-size:11px;color:#64748b;font-weight:700;">Compliant</span>' +
      '</div>' +
    '</div>' +
    '<div class="donut-legend-col">' + legend + '</div>' +
  '</div>';
}

function openDashboardReceipt(tx){
  var pspRef = tx.psp_reference || (tx.id ? tx.id.slice(0, 10) : "TX-DEMO");
  var sendCcy = tx.send_currency || "USD";
  var recvCcy = tx.receive_currency || "BDT";
  var sendAmt = Number(tx.send_amount || 0).toFixed(2);
  var recAmt = Number(tx.receive_amount || 0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
  var rate = Number(tx.fx_rate || 119.50).toFixed(4);
  var fee = Number(tx.fee_amount || 0).toFixed(2);

  global.Modal.open({
    title: "Official Remittance Advice · " + pspRef,
    body: '<div style="display:grid;gap:12px;font-size:13px;">' +
      '<div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Reference ID:</span><b class="mono">' + U.esc(pspRef) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Recipient:</span><b>' + U.esc(tx.recipient_name || "Beneficiary") + ' (' + U.esc((tx.payout_method || "bkash").toUpperCase()) + ')</b></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Sent Amount:</span><b>' + U.ccySym(sendCcy) + sendAmt + ' ' + U.esc(sendCcy) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Transfer Fee:</span><b style="color:#059669;">' + U.ccySym(sendCcy) + fee + ' (FREE)</b></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Effective Exchange Rate:</span><b>1 ' + U.esc(sendCcy) + ' = ' + rate + ' ' + U.esc(recvCcy) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:8px;"><span style="font-weight:700;">Credited Amount:</span><b style="color:#15803d;font-size:15px;">' + U.ccySym(recvCcy) + recAmt + ' ' + U.esc(recvCcy) + '</b></div>' +
      '</div>' +
      '<div style="text-align:center;font-size:11.5px;color:#64748b;">Demonstration Remittance Advice · SIMULATED RECORD</div>' +
    '</div>',
    okLabel: "Print / Save PDF 🖨️",
    onOk: function(){ window.print(); }
  });
}

function render(){
  var el = U.$("#view");
  if (!el) return;

  var sess = global.AuthService && global.AuthService.session();
  var prof = (global.AppState && global.AppState.get("userProfile")) || {};
  var userName = (sess && sess.name) || prof.full_name || "Ishan Ahmed";
  var bens = (global.ModBeneficiaries && global.ModBeneficiaries.list()) || [];
  var userKyc = (global.AppState && global.AppState.get("kycData")) || {
    kyc_level: "basic",
    daily_limit: 50000,
    spent_today: 13402.16,
    remaining_today: 36597.84
  };
  var realTransfers = (global.AppState && global.AppState.get("transfers")) || [];

  var dailyLimit = Number(userKyc.daily_limit || 50000);
  var spentToday = Number(userKyc.spent_today || 0);
  var remainingToday = Math.max(0, dailyLimit - spentToday);
  var usedPct = Math.min(100, Math.round((spentToday / dailyLimit) * 100));

  var hour = new Date().getHours();
  var greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  var dateBadge = new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  var filteredTransfers = realTransfers.filter(function(t){
    if (!dashSearch) return true;
    var q = dashSearch.toLowerCase();
    var mRef = (t.psp_reference || t.id || "").toLowerCase().indexOf(q) !== -1;
    var mRec = (t.recipient_name || "").toLowerCase().indexOf(q) !== -1;
    var mCor = (t.corridor || "").toLowerCase().indexOf(q) !== -1;
    return mRef || mRec || mCor;
  });

  var displayCompleted = realTransfers.length + 15;
  var avatarFallback = U.avatarSvg ? U.avatarSvg(userName) : "";

  /* Live Vault & Crypto Wallet Balances */
  var liveWallet = (global.AppState && global.AppState.get("wallet")) || (global.ModVault && global.ModVault.state) || null;
  if (!liveWallet || !liveWallet.balances){
    liveWallet = {
      balances: {
        USD:  { total: 12450.00,   locked: 2000.00 },
        BDT:  { total: 158200.00,  locked: 50000.00 },
        CNY:  { total: 32000.00,   locked: 10000.00 },
        USDT: { total: 4210.50,    locked: 1500.00 },
        BTC:  { total: 0.28540000, locked: 0.10000000 },
        ETH:  { total: 1.842000,   locked: 0.000000 }
      }
    };
    if (global.AppState) global.AppState.set("wallet", liveWallet);
  }
  var FE = global.FinancialEngine;
  var totalNetWorthUSD = 0;
  var totalLockedUSD = 0;
  Object.keys(liveWallet.balances).forEach(function(ccy){
    var bObj = liveWallet.balances[ccy] || { total:0, locked:0 };
    var uVal = (FE && FE.toUSD) ? FE.toUSD(bObj.total, ccy) : Number(bObj.total || 0);
    var lVal = (FE && FE.toUSD) ? FE.toUSD(bObj.locked, ccy) : 0;
    totalNetWorthUSD += uVal;
    totalLockedUSD += lVal;
  });
  var bdtWalletTotal = (liveWallet.balances.BDT && liveWallet.balances.BDT.total) ? Number(liveWallet.balances.BDT.total) : 158200;
  var usdtWalletTotal = (liveWallet.balances.USDT && liveWallet.balances.USDT.total) ? Number(liveWallet.balances.USDT.total) : 4210.50;
  var btcWalletTotal = (liveWallet.balances.BTC && liveWallet.balances.BTC.total) ? Number(liveWallet.balances.BTC.total) : 0.2854;

  el.innerHTML =
    '<div class="dash-shell">' +
      '<div class="dash-container">' +

        /* Greet Bar (Exact Match to Reference Image 17.17.01.jpeg) */
        '<div class="dash-greet-bar" style="margin-bottom:20px;padding:4px 2px;">' +
          '<div>' +
            '<h2 style="font-size:28px;font-weight:850;color:#172B4D;margin:0;letter-spacing:-0.025em;">' + greeting + ', ' + U.esc(userName.split(" ")[0]) + '</h2>' +
            '<p style="color:#64748B;font-size:14.5px;margin:4px 0 0;">Your international student finances, in one place.</p>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="dashOpenNotifBtn" style="border-radius:10px;padding:9px 14px;font-weight:750;background:#FFFFFF;border:1px solid #E3EAF2;">' +
              '🔔 Alerts &amp; Reminders' +
            '</button>' +
            '<a href="#/send" class="btn btn-primary" id="dashNewTxnBtn" style="background:linear-gradient(180deg,#12B8B0,#0D9F9A);border-radius:12px;padding:11px 22px;font-weight:800;font-size:14px;text-decoration:none;box-shadow:0 8px 20px -8px rgba(18,184,176,0.7);">✈️ Send money &rsaquo;</a>' +
          '</div>' +
        '</div>' +

        /* 4 STAT METRIC CARDS (Matching Reference Image 17.17.01.jpeg) */
        '<div class="stat-cards-grid kpi-row">' +
          '<div class="metric-card-box kpi" style="border-color:#99F6E4;">' +
            '<div class="metric-card-head">' +
              '<div class="metric-icon-bubble" style="background:#E6F8F7;color:#0D9F9A;">🪙</div>' +
              '<span class="metric-card-title" style="margin-right:auto;margin-left:10px;">Vault &amp; Crypto Balance</span>' +
              '<a href="#/payment-vault" title="Open Multi-Currency &amp; Crypto Vault" style="color:#0D9F9A;font-size:11.5px;font-weight:800;text-decoration:none;">Vault &rsaquo;</a>' +
            '</div>' +
            '<div class="metric-card-val num">৳ ' + bdtWalletTotal.toLocaleString("en-US") + '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<span class="trend-pill trend-up">$' + totalNetWorthUSD.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' USD</span>' +
              '<span class="trend-context" style="margin:0;">₮' + usdtWalletTotal.toLocaleString("en-US") + ' · ₿' + btcWalletTotal + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="metric-card-box kpi">' +
            '<div class="metric-card-head">' +
              '<div class="metric-icon-bubble icon-blue">🕒</div>' +
              '<span class="metric-card-title" style="margin-right:auto;margin-left:10px;">Pending transfers</span>' +
              '<span title="Active transfers in progress" style="color:#94A3B8;font-size:12px;">ⓘ</span>' +
            '</div>' +
            '<div class="metric-card-val num">2</div>' +
            '<div>' +
              '<span class="trend-context" style="margin-left:0;color:#475569;font-weight:600;">1 in review, 1 processing</span>' +
            '</div>' +
          '</div>' +

          '<div class="metric-card-box kpi">' +
            '<div class="metric-card-head">' +
              '<div class="metric-icon-bubble" style="background:#EEF2FF;color:#4F46E5;">⇄</div>' +
              '<span class="metric-card-title" style="margin-right:auto;margin-left:10px;">Total sent this month</span>' +
              '<span title="Monthly remittance & tuition volume" style="color:#94A3B8;font-size:12px;">ⓘ</span>' +
            '</div>' +
            '<div class="metric-card-val num">৳ 1,24,500</div>' +
            '<div>' +
              '<span class="trend-pill trend-up">↗ +28%</span>' +
              '<span class="trend-context">vs last month (' + displayCompleted + ' transfers)</span>' +
            '</div>' +
          '</div>' +

          '<div class="metric-card-box kpi">' +
            '<div class="metric-card-head">' +
              '<div class="metric-icon-bubble icon-emerald">⚡</div>' +
              '<span class="metric-card-title" style="margin-right:auto;margin-left:10px;">Average delivery</span>' +
              '<span title="Average settlement speed across rails" style="color:#94A3B8;font-size:12px;">ⓘ</span>' +
            '</div>' +
            '<div class="metric-card-val num">18 min</div>' +
            '<div>' +
              '<span class="trend-pill trend-up">↘ -42%</span>' +
              '<span class="trend-context">faster vs last month</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* PROMINENT MULTI-CURRENCY & WEB3 CRYPTO VAULT BALANCES CARD (Top of Dashboard) */
        (function(){
          var assetMeta = {
            USD:  { icon:"🇺🇸", name:"US Dollar",          rail:"Fedwire / ACH",      color:"#097A76", bg:"#E6F8F7" },
            BDT:  { icon:"🇧🇩", name:"Bangladeshi Taka",   rail:"bKash / Nagad / NPSB",color:"#047857", bg:"#ECFDF5" },
            CNY:  { icon:"🇨🇳", name:"Chinese Yuan (RMB)", rail:"Alipay / UnionPay",  color:"#C2410C", bg:"#FFF7ED" },
            USDT: { icon:"₮",  name:"Tether USD (Web3)",  rail:"TRC20 / ERC20",      color:"#0F766E", bg:"#F0FDFA" },
            BTC:  { icon:"₿",  name:"Bitcoin",            rail:"Bitcoin Mainnet",    color:"#B45309", bg:"#FFFBEB" },
            ETH:  { icon:"Ξ",  name:"Ethereum",           rail:"ERC20 Mainnet",      color:"#4338CA", bg:"#EEF2FF" }
          };
          var walletCards = ["USD", "BDT", "CNY", "USDT", "BTC", "ETH"].map(function(c){
            var b = (liveWallet.balances && liveWallet.balances[c]) || { total: 0, locked: 0 };
            var m = assetMeta[c] || { icon:"🪙", name:c, rail:"Live Rail", color:"#097A76", bg:"#E6F8F7" };
            var avail = Math.max(0, Number(b.total || 0) - Number(b.locked || 0));
            var usdEq = (FE && FE.toUSD) ? FE.toUSD(b.total, c) : Number(b.total || 0);
            var fmtTotal = (FE && FE.format) ? FE.format(b.total, c) : (b.total + " " + c);
            var fmtAvail = (FE && FE.format) ? FE.format(avail, c) : (avail + " " + c);
            var fmtLocked = (FE && FE.format) ? FE.format(b.locked, c) : (b.locked + " " + c);
            return '<a href="#/payment-vault" style="background:#F8FAFC;border:1px solid #E3EAF2;border-radius:14px;padding:13px 15px;text-decoration:none;color:inherit;display:flex;flex-direction:column;justify-content:space-between;gap:6px;transition:transform 0.15s, border-color 0.15s;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<span style="width:28px;height:28px;border-radius:8px;background:' + m.bg + ';color:' + m.color + ';font-weight:900;font-size:13px;display:grid;place-items:center;">' + m.icon + '</span>' +
                  '<div><b style="font-size:13px;color:#172B4D;display:block;line-height:1.1;">' + c + '</b><span style="font-size:10.5px;color:#64748B;">' + m.name + '</span></div>' +
                '</div>' +
                '<span style="font-size:10px;font-weight:750;color:#059669;background:#DCFCE7;padding:2px 7px;border-radius:999px;">' + m.rail + '</span>' +
              '</div>' +
              '<div class="num" style="font-size:16.5px;font-weight:850;color:#172B4D;margin-top:2px;">' + fmtTotal + '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748B;border-top:1px dashed #E2E8F0;padding-top:5px;">' +
                '<span>≈ $' + usdEq.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' USD</span>' +
                (Number(b.locked) > 0 ? '<span style="color:#D97706;font-weight:700;">🔒 ' + fmtLocked + ' APY</span>' : '<span style="color:#0D9F9A;font-weight:700;">Avail: ' + fmtAvail + '</span>') +
              '</div>' +
            '</a>';
          }).join("");

          return '<div class="dash-card" style="margin-bottom:22px;padding:20px 22px;border:1.5px solid #99F6E4;background:linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">' +
              '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
                '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#071B33,#0D9F9A);color:#FFFFFF;display:grid;place-items:center;font-size:20px;">🪙</div>' +
                '<div>' +
                  '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                    '<h3 style="margin:0;font-size:17px;font-weight:850;color:#172B4D;">Multi-Currency &amp; Web3 Crypto Vault Balances</h3>' +
                    '<span class="badge badge-ok" style="font-size:11px;">Net Worth: $' + totalNetWorthUSD.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' USD</span>' +
                    '<span class="badge badge-info" style="font-size:11px;background:#FEF3C7;color:#B45309;">🔒 Locked APY: $' + totalLockedUSD.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' USD</span>' +
                  '</div>' +
                  '<span style="font-size:12.5px;color:#64748B;">Live balances across USD $, BDT ৳, CNY ¥, USDT ₮ (TRC20/ERC20), BTC ₿, and ETH Ξ</span>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<a href="#/payment-vault" class="btn btn-sm btn-primary" style="border-radius:9px;text-decoration:none;font-weight:750;">📥 Deposit / Receive</a>' +
                '<a href="#/payment-vault" class="btn btn-sm btn-secondary" style="border-radius:9px;text-decoration:none;font-weight:750;">⇄ Instant Swap</a>' +
                '<a href="#/payment-vault" class="btn btn-sm btn-secondary" style="border-radius:9px;text-decoration:none;font-weight:750;">🔒 Vault (5.5%–8.2% APY)</a>' +
                '<a href="#/payment-vault" class="btn btn-sm btn-secondary" style="border-radius:9px;text-decoration:none;font-weight:750;">💳 Virtual Cards</a>' +
              '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:12px;">' + walletCards + '</div>' +
          '</div>';
        })() +

        /* 2-COLUMN STUDENT OVERVIEW + RIGHT RAIL (ScamShield Protection + Green AI Copilot + Tuition Callout) */
        '<div class="dash-middle-grid" style="grid-template-columns:1.68fr 1fr;gap:20px;margin-bottom:24px;align-items:start;">' +
          /* Left Column: Student Journey 3-Step Card + Top Corridors Breakdown */
          '<div style="display:grid;gap:20px;">' +
            '<div class="dash-card" style="padding:22px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:16px;">' +
                '<div>' +
                  '<h3 style="margin:0;font-size:17px;font-weight:850;color:#172B4D;">Student Journey</h3>' +
                  '<p style="margin:3px 0 0;font-size:13px;color:#64748B;">Plan, pay and track your education journey &mdash; all in one place.</p>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<span class="badge badge-info" style="background:#DBEAFE;color:#1D4ED8;">In progress</span>' +
                  '<a href="#/student-journey" style="font-size:13px;font-weight:750;color:#0D9F9A;text-decoration:none;">View all &rsaquo;</a>' +
                '</div>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;">' +
                '<a href="#/tuition-planner" style="background:#F8FAFC;border:1px solid #E3EAF2;border-radius:14px;padding:16px;text-decoration:none;color:inherit;display:flex;flex-direction:column;justify-content:space-between;gap:10px;transition:border-color 0.15s;">' +
                  '<div>' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                      '<span style="width:24px;height:24px;border-radius:50%;background:#E6F8F7;color:#0D9F9A;font-size:12px;font-weight:800;display:grid;place-items:center;">1</span>' +
                      '<span style="font-size:22px;">🎓</span>' +
                      '<span style="color:#94A3B8;font-weight:700;">&rarr;</span>' +
                    '</div>' +
                    '<b style="font-size:14.5px;color:#172B4D;display:block;margin-bottom:4px;">Plan tuition</b>' +
                    '<span style="font-size:12px;color:#64748B;line-height:1.45;display:block;">Set your tuition amount and choose your destination.</span>' +
                  '</div>' +
                  '<div><span style="display:inline-flex;align-items:center;gap:5px;background:#DCFCE7;color:#15803D;font-size:11.5px;font-weight:750;padding:4px 10px;border-radius:999px;">✓ Completed</span></div>' +
                '</a>' +
                '<a href="#/corridor-optimizer" style="background:#F8FAFC;border:1px solid #E3EAF2;border-radius:14px;padding:16px;text-decoration:none;color:inherit;display:flex;flex-direction:column;justify-content:space-between;gap:10px;transition:border-color 0.15s;">' +
                  '<div>' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                      '<span style="width:24px;height:24px;border-radius:50%;background:#E6F8F7;color:#0D9F9A;font-size:12px;font-weight:800;display:grid;place-items:center;">2</span>' +
                      '<span style="font-size:22px;">🔀</span>' +
                      '<span style="color:#94A3B8;font-weight:700;">&rarr;</span>' +
                    '</div>' +
                    '<b style="font-size:14.5px;color:#172B4D;display:block;margin-bottom:4px;">Compare transfer routes</b>' +
                    '<span style="font-size:12px;color:#64748B;line-height:1.45;display:block;">Get the best rates, lowest fees and fastest delivery.</span>' +
                  '</div>' +
                  '<div><span style="display:inline-flex;align-items:center;gap:5px;background:#DCFCE7;color:#15803D;font-size:11.5px;font-weight:750;padding:4px 10px;border-radius:999px;">✓ Completed</span></div>' +
                '</a>' +
                '<a href="#/payment-vault" style="background:#F8FAFC;border:1px solid #E3EAF2;border-radius:14px;padding:16px;text-decoration:none;color:inherit;display:flex;flex-direction:column;justify-content:space-between;gap:10px;transition:border-color 0.15s;">' +
                  '<div>' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                      '<span style="width:24px;height:24px;border-radius:50%;background:#E6F8F7;color:#0D9F9A;font-size:12px;font-weight:800;display:grid;place-items:center;">3</span>' +
                      '<span style="font-size:22px;">🧾</span>' +
                      '<span style="color:#94A3B8;font-weight:700;">&rarr;</span>' +
                    '</div>' +
                    '<b style="font-size:14.5px;color:#172B4D;display:block;margin-bottom:4px;">Track payment</b>' +
                    '<span style="font-size:12px;color:#64748B;line-height:1.45;display:block;">Monitor your transfer in real-time until it reaches the university.</span>' +
                  '</div>' +
                  '<div><span style="display:inline-flex;align-items:center;gap:5px;background:#DBEAFE;color:#1D4ED8;font-size:11.5px;font-weight:750;padding:4px 10px;border-radius:999px;">⏱ In progress</span></div>' +
                '</a>' +
              '</div>' +
            '</div>' +

            /* Transfer activity Table Card (Exact match to Reference Image 17.17.01.jpeg + Live Transfers) */
            '<div class="dash-card" style="padding:22px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
                '<div>' +
                  '<h3 style="margin:0;font-size:17px;font-weight:850;color:#172B4D;">Transfer activity</h3>' +
                  '<p style="margin:3px 0 0;font-size:13px;color:#64748B;">Track your recent and ongoing transfers.</p>' +
                '</div>' +
                '<a href="#/transactions" style="font-size:13px;font-weight:750;color:#0D9F9A;text-decoration:none;">View all &rsaquo;</a>' +
              '</div>' +
              '<div style="overflow-x:auto;">' +
                '<table class="clean-table">' +
                  '<thead>' +
                    '<tr>' +
                      '<th>Date &amp; Time</th>' +
                      '<th>Recipient</th>' +
                      '<th>Destination</th>' +
                      '<th>Amount</th>' +
                      '<th>Status</th>' +
                      '<th>Delivery ETA</th>' +
                      '<th style="text-align:right;"></th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' +
                    [
                      { dt:"16 Oct 2026, 14:32", init:"S", name:"Samiya Rahman", sub:"University Tuition", flag:"🇬🇧", country:"United Kingdom", ccy:"UK", amt:"৳ 62,000", st:"Completed", eta:"Today, 18:15" },
                      { dt:"14 Oct 2026, 10:21", init:"M", name:"Md. Rafiul Islam", sub:"Family Support", flag:"🇨🇦", country:"Canada", ccy:"CAD", amt:"৳ 45,000", st:"Processing", eta:"Est. 2h 14m" },
                      { dt:"12 Oct 2026, 16:45", init:"A", name:"Ayesha Islam", sub:"University Tuition", flag:"🇦🇺", country:"Australia", ccy:"AUD", amt:"৳ 38,500", st:"Completed", eta:"Today, 16:40" },
                      { dt:"10 Oct 2026, 11:12", init:"T", name:"Tanzim Ahmed", sub:"Living Expenses", flag:"🇬🇧", country:"United Kingdom", ccy:"GBP", amt:"৳ 25,000", st:"Processing", eta:"Est. 4h 32m" },
                      { dt:"08 Oct 2026, 09:33", init:"N", name:"Nusrat Jahan", sub:"Tuition Fee", flag:"🇨🇦", country:"Canada", ccy:"CAD", amt:"৳ 95,000", st:"Completed", eta:"Yesterday, 17:28" }
                    ].map(function(row){
                      var isComp = row.st === "Completed";
                      var stPill = isComp
                        ? '<span style="display:inline-flex;align-items:center;gap:5px;background:#DCFCE7;color:#15803D;font-size:11.5px;font-weight:750;padding:4px 10px;border-radius:999px;">✓ Completed</span>'
                        : '<span style="display:inline-flex;align-items:center;gap:5px;background:#DBEAFE;color:#1D4ED8;font-size:11.5px;font-weight:750;padding:4px 10px;border-radius:999px;">⏱ Processing</span>';
                      return '<tr>' +
                        '<td style="color:#475569;font-size:12.5px;white-space:nowrap;">' + row.dt + '</td>' +
                        '<td>' +
                          '<div style="display:flex;align-items:center;gap:10px;">' +
                            '<span style="width:32px;height:32px;border-radius:50%;background:#E6F8F7;color:#097A76;font-weight:800;font-size:12.5px;display:grid;place-items:center;flex-shrink:0;">' + row.init + '</span>' +
                            '<div><b style="color:#172B4D;font-size:13px;display:block;line-height:1.2;">' + row.name + '</b><span style="color:#64748B;font-size:11.5px;">' + row.sub + '</span></div>' +
                          '</div>' +
                        '</td>' +
                        '<td>' +
                          '<div style="display:flex;align-items:center;gap:8px;">' +
                            '<span style="font-size:18px;">' + row.flag + '</span>' +
                            '<div><b style="color:#172B4D;font-size:12.5px;display:block;line-height:1.2;">' + row.country + '</b><span style="color:#64748B;font-size:11px;">' + row.ccy + '</span></div>' +
                          '</div>' +
                        '</td>' +
                        '<td class="num" style="font-weight:800;color:#172B4D;font-size:13.5px;">' + row.amt + '</td>' +
                        '<td>' + stPill + '</td>' +
                        '<td style="color:#475569;font-size:12.5px;white-space:nowrap;">' + row.eta + '</td>' +
                        '<td style="text-align:right;"><a href="#/send" title="Send again" style="color:#64748B;text-decoration:none;font-weight:800;padding:4px 8px;">⋮</a></td>' +
                      '</tr>';
                    }).join("") +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
            /* Top Corridors Progress Breakdown (Matching Screen 04 Dashboard) */
            '<div class="dash-card" style="padding:20px 22px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
                '<h3 style="margin:0;font-size:16px;font-weight:850;color:#172B4D;">Top Student &amp; Family Corridors</h3>' +
                '<a href="#/corridors" style="font-size:12.5px;font-weight:750;color:#0D9F9A;text-decoration:none;">Explore 18+ Routes &rsaquo;</a>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;">' +
                [
                  { label:"🇧🇩 Bangladesh → 🇬🇧 UK", pct:45, color:"#12B8B0" },
                  { label:"🇧🇩 Bangladesh → 🇨🇦 Canada", pct:27, color:"#2563EB" },
                  { label:"🇧🇩 Bangladesh → 🇦🇺 Australia", pct:18, color:"#0D9F9A" },
                  { label:"🇺🇸 USA / 🇨🇳 China → 🇧🇩 BD", pct:10, color:"#16A34A" }
                ].map(function(cr){
                  return '<div style="background:#F8FAFC;border:1px solid #E3EAF2;border-radius:12px;padding:10px 14px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:#172B4D;margin-bottom:6px;"><span>' + cr.label + '</span><span>' + cr.pct + '%</span></div>' +
                    '<div style="height:6px;background:#E3EAF2;border-radius:999px;overflow:hidden;"><div style="width:' + cr.pct + '%;height:100%;background:' + cr.color + ';border-radius:999px;"></div></div>' +
                  '</div>';
                }).join("") +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Right Rail: ScamShield Protection Card + Green AI Copilot Card + Tuition Callout */
          '<div style="display:grid;gap:16px;">' +
            /* 1. ScamShield Protection Card */
            '<div style="background:linear-gradient(135deg,#071B33 0%,#0E3A4C 100%);color:#FFFFFF;border-radius:18px;padding:20px;box-shadow:0 10px 26px rgba(7,27,51,0.18);border:1px solid rgba(18,184,176,0.28);">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<span style="width:28px;height:28px;border-radius:8px;background:rgba(18,184,176,0.2);color:#12B8B0;display:grid;place-items:center;font-weight:900;">🛡️</span>' +
                  '<b style="font-size:14.5px;color:#FFFFFF;">ScamShield protection</b>' +
                '</div>' +
                '<a href="#/scamshield" style="color:#5EEAD4;font-size:12px;font-weight:750;text-decoration:none;">Scan &rsaquo;</a>' +
              '</div>' +
              '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">' +
                '<div style="width:44px;height:44px;border-radius:50%;background:rgba(18,184,176,0.22);border:2px solid #12B8B0;color:#5EEAD4;display:grid;place-items:center;font-size:20px;font-weight:900;flex-shrink:0;">✓</div>' +
                '<div>' +
                  '<b style="font-size:16px;color:#FFFFFF;display:block;margin-bottom:3px;">You&#39;re protected</b>' +
                  '<span style="font-size:12.5px;color:#CBD5E1;line-height:1.45;display:block;">We&#39;re monitoring your transactions and keeping your account safe (Safety Score: 92/100).</span>' +
                '</div>' +
              '</div>' +
              '<div style="padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);font-size:11.5px;color:#94A3B8;display:flex;align-items:center;gap:6px;">' +
                '<span>🕒 Last security check:</span> <b style="color:#E2E8F0;">16 Oct 2026, 14:28</b>' +
              '</div>' +
            '</div>' +

            /* 2. AI Copilot Card — GREEN VISUAL ACCENTS (Section 5) */
            '<div style="background:#FFFFFF;border:1.5px solid #BBF7D0;border-radius:18px;padding:18px;box-shadow:0 6px 20px rgba(20,83,45,0.06);">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  (U.aiOrb ? U.aiOrb("ai-orb-sm") : '<span style="width:30px;height:30px;border-radius:50%;background:#16A34A;color:#fff;display:grid;place-items:center;">✨</span>') +
                  '<div>' +
                    '<b style="font-size:14.5px;color:#14532D;display:block;line-height:1.15;">AI Copilot</b>' +
                    '<span style="font-size:11.5px;color:#15803D;font-weight:600;">Your personal financial assistant</span>' +
                  '</div>' +
                '</div>' +
                '<a href="#/copilot" style="font-size:12.5px;font-weight:800;color:#16A34A;text-decoration:none;">Open chat &rsaquo;</a>' +
              '</div>' +
              '<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:11px 14px;margin-bottom:10px;font-size:13px;color:#14532D;">' +
                '<b style="display:block;margin-bottom:2px;">Hi ' + U.esc(userName.split(" ")[0]) + '! 👋</b>' +
                '<span>How can I help you today?</span>' +
              '</div>' +
              '<div style="display:grid;gap:7px;">' +
                '<button type="button" class="btn btn-sm" data-dash-copilot-q="Which provider is cheapest right now?" style="justify-content:flex-start;background:#F0FDF4;border:1px solid #BBF7D0;color:#14532D;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:650;">📈 Find the lowest-fee route</button>' +
                '<button type="button" class="btn btn-sm" data-dash-copilot-q="Amar 4 months por tuition dite hobe, sathe family ke monthly taka pathate hoy" style="justify-content:flex-start;background:#F0FDF4;border:1px solid #BBF7D0;color:#14532D;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:650;">📅 Plan my next tuition payment</button>' +
                '<button type="button" class="btn btn-sm" data-dash-copilot-q="What are the live exchange rates right now?" style="justify-content:flex-start;background:#F0FDF4;border:1px solid #BBF7D0;color:#14532D;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:650;">💱 Check exchange rates</button>' +
                '<button type="button" class="btn btn-sm" data-dash-copilot-q="Is this transaction safe?" style="justify-content:flex-start;background:#F0FDF4;border:1px solid #BBF7D0;color:#14532D;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:650;">🛡️ Is this transaction safe?</button>' +
              '</div>' +
            '</div>' +

            /* 3. Need help with tuition? Callout Card */
            '<div style="background:linear-gradient(135deg,#E6F8F7 0%,#CCFBF1 100%);border:1px solid #99F6E4;border-radius:18px;padding:16px 18px;display:flex;align-items:flex-start;gap:12px;">' +
              '<div style="width:38px;height:38px;border-radius:50%;background:#12B8B0;color:#FFFFFF;display:grid;place-items:center;font-size:18px;flex-shrink:0;">🎓</div>' +
              '<div>' +
                '<b style="font-size:14px;color:#0F172A;display:block;margin-bottom:3px;">Need help with tuition?</b>' +
                '<span style="font-size:12px;color:#334155;line-height:1.45;display:block;margin-bottom:8px;">Get the best rates and pay directly to your university.</span>' +
                '<a href="#/tuition-planner" style="font-size:12.5px;font-weight:800;color:#097A76;text-decoration:none;">Explore Tuition Planner &rsaquo;</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Live Notification Alerts & Upcoming Payment Reminders Banner */
        (function(){
          var NH = global.NotificationHub;
          var rems = (NH && typeof NH.getUpcomingReminders === "function") ? NH.getUpcomingReminders() : [];
          var notifs = (NH && typeof NH.list === "function") ? NH.list() : [];
          var unread = notifs.filter(function(n){ return n.unread !== false; }).length;
          return '<div class="card" style="border-radius:18px;padding:16px 20px;margin-bottom:20px;background:linear-gradient(135deg,#E6F8F7 0%,#f0fdf4 100%);border:1.5px solid #93c5fd;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
              '<div style="display:flex;align-items:center;gap:12px;">' +
                '<div style="width:42px;height:42px;border-radius:12px;background:#0D9F9A;color:#fff;display:grid;place-items:center;font-size:20px;flex-shrink:0;">🔔</div>' +
                '<div>' +
                  '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                    '<b style="font-size:14.5px;color:#0f172a;">Active Notification Alerts &amp; Upcoming Payment Reminders</b>' +
                    '<span class="badge badge-info" style="font-size:10.5px;">' + unread + ' Unread · ' + rems.length + ' Scheduled</span>' +
                  '</div>' +
                  '<div style="font-size:12.5px;color:#334155;margin-top:2px;">' +
                    (rems[0] ? ('Next Due: <b>' + U.esc(rems[0].title) + '</b> (' + U.esc(rems[0].amount) + ') on <b class="mono">' + U.esc(rems[0].dueDate) + '</b>') : 'All upcoming tuition &amp; remittance alerts are active.') +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<button type="button" class="btn btn-sm btn-primary" id="dashBannerOpenNotifs" style="border-radius:8px;font-weight:750;">🔔 View Alerts (' + notifs.length + ')</button>' +
                '<button type="button" class="btn btn-sm btn-secondary" id="dashBannerOpenReminders" style="border-radius:8px;font-weight:750;">⏰ Upcoming (' + rems.length + ')</button>' +
                '<button type="button" class="btn btn-sm btn-secondary" id="dashBannerTestAlert" style="border-radius:8px;font-weight:750;color:#b45309;border-color:#fcd34d;background:#fffbeb;">⚡ Test Alert</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        })() +

        /* KYC DAILY LIMIT GAUGE CARD */
        '<div class="card" style="border-radius:20px;padding:22px 26px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;margin-bottom:24px;box-shadow:0 4px 20px rgba(15,23,42,0.15);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;margin-bottom:12px;">' +
            '<div>' +
              '<span style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Today\'s Regulatory Remittance Quota (' + (userKyc.kyc_level === "full" ? "Tier 2 Full" : "Tier 1 Basic") + ')</span>' +
              '<h3 style="margin:2px 0 0;font-size:20px;color:#fff;font-weight:850;">' +
                '৳' + spentToday.toLocaleString() + ' <small style="font-size:13px;color:#94a3b8;font-weight:600;">spent of ৳' + dailyLimit.toLocaleString() + ' BDT equivalent</small>' +
              '</h3>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
              '<span style="font-size:13px;color:#34d399;font-weight:750;">৳' + remainingToday.toLocaleString() + ' Remaining Today</span>' +
              (userKyc.kyc_level !== "full" ?
                '<a href="#/kyc" class="btn btn-primary btn-sm" style="background:#0D9F9A;border-color:#0D9F9A;font-weight:750;border-radius:8px;padding:6px 14px;text-decoration:none;">' +
                  'Upgrade to Tier 2 (৳500k) ↑' +
                '</a>' : '') +
            '</div>' +
          '</div>' +
          /* Progress Bar */
          '<div style="width:100%;height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;">' +
            '<div style="width:' + usedPct + '%;height:100%;background:' + (usedPct > 70 ? '#f59e0b' : '#10b981') + ';transition:width 0.4s ease;"></div>' +
          '</div>' +
        '</div>' +

        /* SAVED BENEFICIARIES 1-TAP SEND CAROUSEL */
        (bens.length > 0 ?
          '<div style="margin-bottom:26px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">Quick Send to Saved Beneficiaries</h3>' +
              '<a href="#/beneficiaries" style="font-size:12.5px;font-weight:750;color:#0D9F9A;text-decoration:none;">View all (' + bens.length + ') →</a>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:12px;">' +
              bens.slice(0, 5).map(function(b){
                var isBkash = b.payout_method === "bkash";
                var icon = isBkash ? "📱" : b.payout_method === "nagad" ? "⚡" : b.payout_method === "wallet" ? "🌐" : "🏦";
                return '<div class="card" style="border-radius:16px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #e2e8f0;margin:0;">' +
                  '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
                    '<span style="font-size:20px;flex-shrink:0;">' + icon + '</span>' +
                    '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
                      '<b style="font-size:13.5px;color:#0f172a;display:block;overflow:hidden;text-overflow:ellipsis;">' + U.esc(b.name) + '</b>' +
                      '<small style="color:#64748b;font-size:11px;">' + U.esc(b.payout_method.toUpperCase()) + '</small>' +
                    '</div>' +
                  '</div>' +
                  '<a href="#/send?beneficiary_id=' + encodeURIComponent(b.id) + '" class="btn btn-primary btn-sm" style="padding:5px 10px;font-size:11.5px;border-radius:8px;text-decoration:none;font-weight:750;flex-shrink:0;">' +
                    'Send' +
                  '</a>' +
                '</div>';
              }).join("") +
            '</div>' +
          '</div>' : ''
        ) +

        /* Recurring Auto-Remit Schedules */
        (function(){
          var scheds = (global.AppState && global.AppState.get("autoRemitSchedules")) || [
            { id: "SCH-101", title: "Monthly Family Allowance → Fatema Begum", corridor: "CNY → BDT (City Bank)", amount: "1,000 CNY", freq: "1st of every month", status: "ACTIVE" },
            { id: "SCH-102", title: "Target Rate Auto-Swap (USDT → BDT)", corridor: "Vault Swap @ ≥120.00 BDT", amount: "500 USDT", freq: "Rate-Triggered", status: "ACTIVE" },
            { id: "SCH-103", title: "Semester Tuition Reserve → Univ. of Toronto", corridor: "BDT → CAD (Wise)", amount: "2,000 CAD", freq: "Quarterly", status: "PAUSED" }
          ];

          return '<div class="dash-card" style="margin-bottom:24px;">' +
            '<div class="dash-card-head">' +
              '<div><h3 style="margin:0;">⏱️ Automated Recurring Remittances &amp; Rate-Triggered Rules</h3><span style="font-size:12px;color:#64748b;">Set-and-forget family allowances, tuition reserves, and target FX rate swaps</span></div>' +
              '<button type="button" class="btn btn-sm btn-secondary" id="btnAddAutoSchedule" style="border-radius:8px;">+ New Auto-Remit Rule</button>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;">' +
              scheds.map(function(sc, idx){
                var isAct = sc.status === "ACTIVE";
                return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">' +
                  '<div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                      '<span style="font-size:11px;font-weight:800;color:#0D9F9A;">' + U.esc(sc.freq) + '</span>' +
                      '<span class="badge ' + (isAct ? 'badge-ok' : 'badge-warn') + '">' + U.esc(sc.status) + '</span>' +
                    '</div>' +
                    '<b style="font-size:13.5px;color:#0f172a;display:block;">' + U.esc(sc.title) + '</b>' +
                    '<span style="font-size:12px;color:#64748b;">' + U.esc(sc.corridor) + ' · <b>' + U.esc(sc.amount) + '</b></span>' +
                  '</div>' +
                  '<div style="display:flex;gap:8px;">' +
                    '<button type="button" class="btn btn-sm btn-secondary" data-toggle-sched="' + idx + '" style="flex:1;border-radius:8px;justify-content:center;font-size:11.5px;">' + (isAct ? '⏸️ Pause' : '▶️ Resume') + '</button>' +
                    '<a href="#/send" class="btn btn-sm btn-primary" style="flex:1;border-radius:8px;justify-content:center;font-size:11.5px;text-decoration:none;">⚡ Run Now</a>' +
                  '</div>' +
                '</div>';
              }).join("") +
            '</div>' +
          '</div>';
        })() +

        /* Middle Grid: Charts */
        '<div class="dash-middle-grid">' +
          '<div class="dash-card">' +
            '<div class="dash-card-head">' +
              '<h3>Global Transfer Volume Overview</h3>' +
              '<select class="select-range-btn" id="dashChartRange">' +
                '<option value="7d">Last 7 days</option>' +
                '<option value="12m">Last 12 months</option>' +
              '</select>' +
            '</div>' +
            '<div id="dashChartContainer">' +
              renderSmoothLineChart("7d") +
            '</div>' +
          '</div>' +

          '<div class="dash-card">' +
            '<div class="dash-card-head">' +
              '<h3>Remittance Purpose Breakdown</h3>' +
            '</div>' +
            renderDonutChart() +
          '</div>' +
        '</div>' +

        /* Recent Transactions Table */
        '<div class="dash-card" style="margin-top:24px;">' +
          '<div class="dash-card-head" style="flex-wrap:wrap;gap:10px;">' +
            '<h3>Recent Transfers &amp; History (' + filteredTransfers.length + ')</h3>' +
            '<div style="display:flex;align-items:center;gap:12px;margin-left:auto;">' +
              '<div class="dash-search-box" style="width:240px;padding:5px 10px;"><span style="font-size:12px;">🔍</span><input type="text" id="dashSearchInput" value="' + U.esc(dashSearch) + '" placeholder="Filter transfers..." aria-label="Search"></div>' +
              '<a href="#/payment-vault" style="font-size:12.5px;font-weight:700;color:#0D9F9A;text-decoration:none;">View all in Vault &rarr;</a>' +
            '</div>' +
          '</div>' +
          '<div style="overflow-x:auto;">' +
            '<table class="clean-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Ref ID</th>' +
                  '<th>Recipient</th>' +
                  '<th>Corridor / Method</th>' +
                  '<th>Sent Amount</th>' +
                  '<th>Received</th>' +
                  '<th>Status</th>' +
                  '<th>Action</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                (filteredTransfers.length === 0 ?
                  '<tr><td colspan="7" style="text-align:center;padding:32px;color:#64748b;">No transfers match your filter. Click "+ Send Money" to initiate a transfer.</td></tr>' :
                  filteredTransfers.slice(0, 8).map(function(t){
                    var isPaid = t.status === "paid_out";
                    var badgeColor = isPaid ? "#15803d" : "#097A76";
                    var badgeBg = isPaid ? "#dcfce7" : "#CCFBF1";
                    var statusLabel = isPaid ? "Delivered" : "In Transit";
                    var sendCcy = t.send_currency || "USD";
                    var recvCcy = t.receive_currency || "BDT";

                    return '<tr>' +
                      '<td style="font-family:monospace;font-weight:750;color:#0D9F9A;">' + U.esc(t.psp_reference || t.id.slice(0, 10)) + '</td>' +
                      '<td><b>' + U.esc(t.recipient_name || "Beneficiary") + '</b></td>' +
                      '<td>' + U.esc((t.corridor || "US-BD") + " · " + (t.payout_method ? t.payout_method.toUpperCase() : "WALLET")) + '</td>' +
                      '<td style="font-weight:700;">' + U.ccySym(sendCcy) + Number(t.send_amount || 0).toFixed(2) + ' ' + U.esc(sendCcy) + '</td>' +
                      '<td style="font-weight:800;color:#059669;">' + U.ccySym(recvCcy) + Number(t.receive_amount || 0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + U.esc(recvCcy) + '</td>' +
                      '<td><span class="badge" style="background:' + badgeBg + ';color:' + badgeColor + ';font-weight:750;">' + statusLabel + '</span></td>' +
                      '<td>' +
                        '<div style="display:flex;gap:6px;">' +
                          '<a href="#/send?beneficiary_id=' + encodeURIComponent(t.beneficiary_id || "") + '" class="btn btn-secondary btn-sm" style="text-decoration:none;font-size:11.5px;padding:4px 8px;border-radius:6px;">' +
                            'Send Again 🔄' +
                          '</a>' +
                          '<button type="button" class="btn btn-secondary btn-sm" data-dash-receipt="' + U.esc(t.id) + '" style="font-size:11.5px;padding:4px 8px;border-radius:6px;">' +
                            'Receipt 🧾' +
                          '</button>' +
                        '</div>' +
                      '</td>' +
                    '</tr>';
                  }).join("")
                ) +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div>';

  if (U.bindProfileMenus) U.bindProfileMenus(el);

  var dNotifBtn = U.$("#dashOpenNotifBtn", el);
  if (dNotifBtn) dNotifBtn.addEventListener("click", function(){ if (global.NotificationHub) global.NotificationHub.openModal("all"); });
  var dBanNotif = U.$("#dashBannerOpenNotifs", el);
  if (dBanNotif) dBanNotif.addEventListener("click", function(){ if (global.NotificationHub) global.NotificationHub.openModal("all"); });
  var dBanRem = U.$("#dashBannerOpenReminders", el);
  if (dBanRem) dBanRem.addEventListener("click", function(){ if (global.NotificationHub) global.NotificationHub.openModal("reminders"); });
  var dBanTest = U.$("#dashBannerTestAlert", el);
  if (dBanTest){
    dBanTest.addEventListener("click", function(){
      if (global.NotificationHub){
        global.NotificationHub.addNotification({
          category: "UPCOMING_PAYMENT",
          title: "⏰ Live Upcoming Payment Alert Triggered!",
          message: "University of Toronto Tuition ($6,000 CAD) & Monthly Family Remittance (৳41,195 BDT) alerts are active.",
          actionLabel: "Open Send Money",
          actionRoute: "#/send",
          amount: "6,000 CAD"
        }, true);
        render();
      }
    });
  }

  /* Dashboard AI Copilot quick-prompt buttons */
  el.querySelectorAll("[data-dash-copilot-q]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var q = btn.getAttribute("data-dash-copilot-q");
      if (global.FloatingCopilot && typeof global.FloatingCopilot.open === "function"){
        global.FloatingCopilot.open();
        var fIn = document.getElementById("fChatInput");
        var fForm = document.getElementById("fChatForm");
        if (fIn && fForm){
          fIn.value = q;
          fForm.dispatchEvent(new Event("submit", { cancelable: true }));
          return;
        }
      }
      location.hash = "#/copilot";
    });
  });

  /* Search input listener */
  var searchInp = U.$("#dashSearchInput", el);
  if (searchInp){
    searchInp.addEventListener("input", U.debounce(function(){
      dashSearch = searchInp.value.trim();
      render();
    }, 250));
  }

  /* Chart range listener */
  var rangeSel = U.$("#dashChartRange", el);
  if (rangeSel){
    rangeSel.addEventListener("change", function(){
      var box = U.$("#dashChartContainer", el);
      if (box) box.innerHTML = renderSmoothLineChart(rangeSel.value);
    });
  }

  /* Auto-Remit Schedule Events */
  el.querySelectorAll("[data-toggle-sched]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var idx = parseInt(btn.getAttribute("data-toggle-sched"), 10);
      var list = (global.AppState && global.AppState.get("autoRemitSchedules")) || [
        { id: "SCH-101", title: "Monthly Family Allowance → Fatema Begum", corridor: "CNY → BDT (City Bank)", amount: "1,000 CNY", freq: "1st of every month", status: "ACTIVE" },
        { id: "SCH-102", title: "Target Rate Auto-Swap (USDT → BDT)", corridor: "Vault Swap @ ≥120.00 BDT", amount: "500 USDT", freq: "Rate-Triggered", status: "ACTIVE" },
        { id: "SCH-103", title: "Semester Tuition Reserve → Univ. of Toronto", corridor: "BDT → CAD (Wise)", amount: "2,000 CAD", freq: "Quarterly", status: "PAUSED" }
      ];
      if (list[idx]){
        list[idx].status = list[idx].status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        if (global.AppState) global.AppState.set("autoRemitSchedules", list);
        global.Toast.show("Schedule " + list[idx].status.toLowerCase() + ".", "ok");
        render();
      }
    });
  });
  var addSchedBtn = U.$("#btnAddAutoSchedule", el);
  if (addSchedBtn){
    addSchedBtn.addEventListener("click", function(){
      global.Modal.open({
        title: "⏱️ Create Automated Remittance / Rate-Trigger Rule",
        body: '<div style="display:grid;gap:12px;">' +
          '<div class="field"><label>Rule Title</label><input class="input" id="schTitle" placeholder="e.g. Monthly Allowance to Rahim (bKash)"></div>' +
          '<div class="grid g2">' +
            '<div class="field"><label>Corridor / Action</label><input class="input" id="schCorr" value="USD → BDT (bKash Instant)"></div>' +
            '<div class="field"><label>Amount</label><input class="input" id="schAmt" value="250 USD"></div>' +
          '</div>' +
          '<div class="field"><label>Trigger Frequency</label><select class="input" id="schFreq"><option>1st of every month</option><option>Every Friday (Weekly)</option><option>When FX Rate hits target</option><option>Quarterly Tuition Date</option></select></div>' +
        '</div>',
        okLabel: "Save Auto-Remit Rule",
        onOk: function(){
          var title = document.getElementById("schTitle").value.trim() || "Automated Remittance";
          var corr = document.getElementById("schCorr").value.trim() || "USD → BDT";
          var amt = document.getElementById("schAmt").value.trim() || "250 USD";
          var freq = document.getElementById("schFreq").value;
          var list = (global.AppState && global.AppState.get("autoRemitSchedules")) || [
            { id: "SCH-101", title: "Monthly Family Allowance → Fatema Begum", corridor: "CNY → BDT (City Bank)", amount: "1,000 CNY", freq: "1st of every month", status: "ACTIVE" },
            { id: "SCH-102", title: "Target Rate Auto-Swap (USDT → BDT)", corridor: "Vault Swap @ ≥120.00 BDT", amount: "500 USDT", freq: "Rate-Triggered", status: "ACTIVE" }
          ];
          list.unshift({ id: "SCH-" + Math.floor(100 + Math.random()*900), title: title, corridor: corr, amount: amt, freq: freq, status: "ACTIVE" });
          if (global.AppState) global.AppState.set("autoRemitSchedules", list);
          global.Toast.show("Automated rule created!", "ok");
          render();
        }
      });
    });
  }

  /* Receipt modals */
  el.querySelectorAll("[data-dash-receipt]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.getAttribute("data-dash-receipt");
      var tx = realTransfers.find(function(x){ return x.id === id; });
      if (tx) openDashboardReceipt(tx);
    });
  });
}

global.ModDashboard = {
  render: render,
  meta: {
    title: "User Dashboard",
    nav: "Dashboard",
    icon: "grid",
    desc: "Probaho Remit overview: daily KYC quotas, active transfer tracking, and quick send."
  }
};
})(typeof window !== "undefined" ? window : global);

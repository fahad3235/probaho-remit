/**
 * js/modules/fees.js — Transparent Global Fee Schedule & Margin Breakdown
 * Dynamically reads enabled corridors and providers from AppState / AdminConfig (zero backend needed).
 */
(function(global){
"use strict";

var U = global.U;

function render(el) {
  el = el || (U && U.$("#view")) || document.getElementById("view");
  if (!el) return;
  var lang = U.safeGet('preferred_lang', 'en');
  var isBn = lang === 'bn';

  var corridors = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
  var providers = (global.AppState && global.AppState.enabledProviders) ? global.AppState.enabledProviders() : (global.SeedProviders || []);
  var topProv = providers[0] || { name: "WorldRemit", flatFee: 4.99, pctFee: 0.0, spreadPct: 0.02, delivery: "1-2 days" };

  var html =
    '<div class="page-container" style="max-width:1240px;margin:0 auto;padding:28px 16px;">' +
      '<div style="text-align:center;margin-bottom:32px;">' +
        '<span class="badge badge-info" style="margin-bottom:8px;">' + (isBn ? 'স্বচ্ছ ফি তালিকা' : 'GLOBAL ILLUSTRATIVE PRICING') + '</span>' +
        '<h1 style="font-size:2.2rem;font-weight:800;color:var(--ink,#0f172a);margin-bottom:10px;">' +
          (isBn ? 'সম্পূর্ণ স্বচ্ছ বৈশ্বিক রেমিট্যান্স ফি ও মার্জিন (ডেমো)' : 'Global Corridor Fee & FX Margin Schedule') +
        '</h1>' +
        '<p style="color:var(--ink-2,#64748b);max-width:720px;margin:0 auto;font-size:15px;">' +
          (isBn
            ? 'সিমুলেটেড ডেমো কাঠামো। কোনো গোপন চার্জ নেই। প্রতিটি আন্তর্জাতিক করিডোরে স্বচ্ছ ডেমো রেট ও স্পষ্ট ফি মডেল।'
            : 'Simulated demo pricing across all ' + corridors.length + ' active global corridors. Zero hidden charges, exact two-step rounding via FinancialEngine, and transparent FX spread disclosure.') +
        '</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:32px;">' +
        '<div class="card" style="padding:20px;border-left:4px solid #0D9F9A;">' +
          '<div style="font-size:12px;color:var(--ink-2,#64748b);font-weight:700;text-transform:uppercase;">' + (isBn ? 'ডিজিটাল ওয়ালেট প্রোমো ফি' : 'Direct Wallet Promo Fee') + '</div>' +
          '<div style="font-size:24px;font-weight:800;color:#0D9F9A;margin:6px 0;">0.00% / FREE</div>' +
          '<div style="font-size:13px;color:var(--ink-2,#64748b);">' + (isBn ? 'নির্বাচিত ওয়ালেট ট্রান্সফারে প্ল্যাটফর্ম ফি শূন্য' : 'Zero platform transfer fee on direct mobile wallet settlements in the Send Money flow.') + '</div>' +
        '</div>' +
        '<div class="card" style="padding:20px;border-left:4px solid #10b981;">' +
          '<div style="font-size:12px;color:var(--ink-2,#64748b);font-weight:700;text-transform:uppercase;">' + (isBn ? 'এফএক্স রেট লক' : 'Guaranteed FX Rate Lock') + '</div>' +
          '<div style="font-size:24px;font-weight:800;color:#10b981;margin:6px 0;">60 Seconds</div>' +
          '<div style="font-size:13px;color:var(--ink-2,#64748b);">' + (isBn ? 'পেমেন্ট সম্পন্ন করার জন্য ৬০ সেকেন্ড গ্যারান্টিযুক্ত লক' : 'Quoted exchange rate is held for a 60-second window during checkout with zero slippage.') + '</div>' +
        '</div>' +
        '<div class="card" style="padding:20px;border-left:4px solid #4f46e5;">' +
          '<div style="font-size:12px;color:var(--ink-2,#64748b);font-weight:700;text-transform:uppercase;">' + (isBn ? 'গ্লোবাল ডেলিভারি গতি' : 'Global Delivery Speed') + '</div>' +
          '<div style="font-size:24px;font-weight:800;color:#4f46e5;margin:6px 0;">Instant ~ 24h</div>' +
          '<div style="font-size:13px;color:var(--ink-2,#64748b);">' + (isBn ? 'ওয়ালেটে তাৎক্ষণিক, ব্যাংক একাউন্টে কয়েক ঘণ্টার মধ্যে' : 'Near-instant for mobile wallets & RTP/SEPA/FPS; 1–2 business days for international bank wires.') + '</div>' +
        '</div>' +
      '</div>' +

      /* Provider Fee Matrix */
      '<div class="card" style="padding:24px;overflow-x:auto;margin-bottom:28px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
          '<h3 style="font-size:18px;font-weight:800;margin:0;color:var(--ink,#0f172a);">' + (isBn ? 'প্রোভাইডার ফি ও স্প্রেড তুলনা' : 'Provider Fee & Spread Structure (All Corridors)') + '</h3>' +
          '<span class="badge badge-demo">SHARED FINANCIAL ENGINE</span>' +
        '</div>' +
        '<table class="clean-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Provider</th>' +
              '<th>Flat Fee</th>' +
              '<th>Percentage Fee</th>' +
              '<th>FX Spread vs Mid</th>' +
              '<th>Est. Delivery</th>' +
              '<th>Specialty</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            providers.map(function(p){
              return '<tr>' +
                '<td><b>' + U.esc(p.name) + '</b> ' + (p.badge ? '<span class="badge badge-info" style="font-size:10px;margin-left:6px;">' + U.esc(p.badge) + '</span>' : '') + '</td>' +
                '<td class="mono" style="font-weight:700;">' + Number(p.flatFee).toFixed(2) + ' (send ccy)</td>' +
                '<td class="mono" style="font-weight:700;">' + Number(p.pctFee).toFixed(2) + '%</td>' +
                '<td class="mono" style="color:#0284c7;font-weight:700;">' + Number(p.spreadPct).toFixed(2) + '%</td>' +
                '<td><span style="color:#059669;font-weight:700;">' + U.esc(p.delivery) + '</span></td>' +
                '<td style="color:#64748b;font-size:12.5px;">' + U.esc(p.note || "Global cross-border route") + '</td>' +
              '</tr>';
            }).join("") +
          '</tbody>' +
        '</table>' +
      '</div>' +

      /* Corridor-by-Corridor Schedule */
      '<div class="card" style="padding:24px;overflow-x:auto;">' +
        '<h3 style="font-size:18px;font-weight:800;margin-bottom:16px;color:var(--ink,#0f172a);">' + (isBn ? 'করিডোর ভিত্তিক রেফারেন্স রেট ও সীমা' : 'Corridor Reference Rates & Transfer Limits (' + corridors.length + ' Corridors)') + '</h3>' +
        '<table class="clean-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Corridor</th>' +
              '<th>Region</th>' +
              '<th>Currency Pair</th>' +
              '<th>Reference Mid-Rate</th>' +
              '<th>Direct Wallet Fee</th>' +
              '<th>Top Optimizer Provider</th>' +
              '<th style="text-align:right;">Action</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            corridors.map(function(c){
              var sym = U.ccySym(c.sendCcy);
              var minA = c.minAmount || 10;
              var maxA = c.maxAmount || (global.DemoConfig && global.DemoConfig.maxPerTx[c.sendCcy]) || 50000;
              var f1 = c.flagFrom || U.ccyFlag(c.sendCcy);
              var f2 = c.flagTo || U.ccyFlag(c.receiveCcy);
              return '<tr>' +
                '<td style="font-weight:700;color:var(--ink,#0f172a);">' +
                  f1 + ' ' + U.esc(c.label) + ' ' + f2 +
                  '<br><small style="color:#64748b;font-weight:500;">Limits: ' + sym + minA.toLocaleString() + ' – ' + sym + maxA.toLocaleString() + '</small>' +
                '</td>' +
                '<td><span class="badge badge-neutral" style="font-size:11px;">' + U.esc(c.region || "Global") + '</span></td>' +
                '<td class="mono" style="font-weight:700;">' + U.esc(c.sendCcy) + ' → ' + U.esc(c.receiveCcy) + '</td>' +
                '<td class="mono" style="font-weight:700;color:#0D9F9A;">1 ' + U.esc(c.sendCcy) + ' = ' + Number(c.midRate).toFixed(c.midRate < 1 ? 4 : 2) + ' ' + U.esc(c.receiveCcy) + '</td>' +
                '<td style="font-weight:700;color:#059669;">FREE (0.00%)</td>' +
                '<td><span class="badge badge-info">' + U.esc(topProv.name) + '</span></td>' +
                '<td style="text-align:right;">' +
                  '<button type="button" class="btn btn-sm btn-primary" data-fee-corr="' + U.esc(c.id) + '" style="padding:6px 12px;font-size:12px;">' +
                    (isBn ? 'হিসাব করুন →' : 'Compare →') +
                  '</button>' +
                '</td>' +
              '</tr>';
            }).join("") +
          '</tbody>' +
        '</table>' +
      '</div>' +

      '<div style="margin-top:32px;text-align:center;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">' +
        '<a href="#/corridor-optimizer" class="btn btn-primary">' + (isBn ? 'ট্রান্সফার অপ্টিমাইজার খুলুন' : 'Open Corridor Optimizer') + '</a>' +
        '<a href="#/home" class="btn btn-secondary">' + (isBn ? 'মূল পাতায় ফিরুন' : 'Back to Home') + '</a>' +
      '</div>' +
    '</div>';

  el.innerHTML = html;

  el.querySelectorAll("[data-fee-corr]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var cid = btn.getAttribute("data-fee-corr");
      if (global.AppState) global.AppState.set("corridorId", cid);
      location.hash = "#/corridor-optimizer";
    });
  });
}

global.ModFees = {
  render: render,
  meta: {
    title: 'Global Remittance Fees & Pricing',
    nav: 'Fees',
    icon: 'tag'
  }
};

})(typeof window !== "undefined" ? window : global);

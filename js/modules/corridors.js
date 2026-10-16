/**
 * js/modules/corridors.js — Supported Global Corridors & Payout Routes
 * Displays live corridor status, region filtering, supported payout channels, and compliance limits.
 */
(function(global){
"use strict";

var U = global.U;
var activeRegion = "All";

function render(el) {
  el = el || (U && U.$("#view")) || document.getElementById("view");
  if (!el) return;
  var lang = U.safeGet('preferred_lang', 'en');
  var isBn = lang === 'bn';

  var allCorridors = (global.AppState && global.AppState.enabledCorridors) ? global.AppState.enabledCorridors() : (global.SeedCorridors || []);
  var regions = ["All", "Global", "Americas", "Europe", "Asia-Pacific", "Middle East"];

  var filtered = allCorridors.filter(function(c){
    if (activeRegion === "All") return true;
    return (c.region || "Global") === activeRegion;
  });

  var html =
    '<div class="page-container" style="max-width:1240px;margin:0 auto;padding:28px 16px;">' +
      '<div style="text-align:center;margin-bottom:28px;">' +
        '<span class="badge badge-info" style="margin-bottom:8px;">' + (isBn ? 'সক্রিয় বৈশ্বিক করিডোরসমূহ' : 'GLOBAL CORRIDOR NETWORK') + '</span>' +
        '<h1 style="font-size:2.2rem;font-weight:800;color:var(--ink,#0f172a);margin-bottom:10px;">' +
          (isBn ? 'বৈশ্বিক রেমিট্যান্স করিডোর নেটওয়ার্ক (' + allCorridors.length + 'টি রুট)' : 'Global Remittance Corridor Network (' + allCorridors.length + ' Active Routes)') +
        '</h1>' +
        '<p style="color:var(--ink-2,#64748b);max-width:700px;margin:0 auto 20px;font-size:15px;">' +
          (isBn
            ? 'উত্তর আমেরিকা, ইউরোপ, এশিয়া-প্যাসিফিক, মধ্যপ্রাচ্য এবং দক্ষিণ এশিয়ায় তাৎক্ষণিক ব্যাংক ও মোবাইল ওয়ালেট ট্রান্সফার।'
            : 'Cross-border remittance routes connecting North America, Europe, Asia-Pacific, Middle East, and South Asia with instant mobile wallet and bank clearing.') +
        '</p>' +

        /* Region Filter Pills */
        '<div style="display:inline-flex;gap:8px;flex-wrap:wrap;justify-content:center;" id="corrRegionFilter">' +
          regions.map(function(reg){
            var isAct = activeRegion === reg;
            return '<button type="button" class="btn btn-sm ' + (isAct ? 'btn-primary' : 'btn-secondary') + '" data-reg="' + U.esc(reg) + '" style="border-radius:999px;">' +
              U.esc(reg === "All" ? "🌍 All Regions (" + allCorridors.length + ")" : reg) +
            '</button>';
          }).join("") +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%, 275px), 1fr));gap:20px;margin-bottom:36px;">';

  filtered.forEach(function(c){
    var f1 = c.flagFrom || U.ccyFlag(c.sendCcy);
    var f2 = c.flagTo || U.ccyFlag(c.receiveCcy);
    var sym = U.ccySym(c.sendCcy);
    var minA = c.minAmount || 10;
    var maxA = c.maxAmount || (global.DemoConfig && global.DemoConfig.maxPerTx[c.sendCcy]) || 50000;
    var methods = c.payoutMethods || ["bank", "wallet", "bkash"];

    var methodsBadge = methods.map(function(m){
      var label = m.toUpperCase();
      if (m === 'bkash') label = 'bKash Wallet';
      else if (m === 'nagad') label = 'Nagad Wallet';
      else if (m === 'rocket') label = 'Rocket';
      else if (m === 'bank') label = 'Direct Bank / IBAN / ACH';
      else if (m === 'wallet') label = 'Instant Mobile Wallet';
      else if (m === 'cash_pickup') label = 'Cash Pickup';
      return '<span class="badge badge-neutral" style="font-size:11px;margin:2px;">' + U.esc(label) + '</span>';
    }).join('');

    html +=
      '<div class="card" style="padding:24px;display:flex;flex-direction:column;justify-content:space-between;border-top:3px solid #0D9F9A;">' +
        '<div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<span style="font-size:28px;">' + f1 + ' → ' + f2 + '</span>' +
            '<span class="badge badge-ok">' + (isBn ? 'সক্রিয় রুট' : 'ACTIVE · ' + U.esc(c.sendCcy + '/' + c.receiveCcy)) + '</span>' +
          '</div>' +
          '<h3 style="font-size:17.5px;font-weight:800;color:var(--ink,#0f172a);margin-bottom:4px;">' +
            U.esc(c.label) +
          '</h3>' +
          '<p style="font-size:12.5px;color:#64748b;margin-bottom:10px;">' + U.esc(c.blurb || "") + '</p>' +
          '<div style="font-size:13px;color:var(--ink-2,#475569);margin-bottom:6px;">' +
            '<b>' + (isBn ? 'রেফারেন্স রেট:' : 'Ref Mid-Rate:') + '</b> <span class="mono" style="color:#0D9F9A;font-weight:700;">1 ' + U.esc(c.sendCcy) + ' = ' + Number(c.midRate).toFixed(c.midRate < 1 ? 4 : 2) + ' ' + U.esc(c.receiveCcy) + '</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--ink-2,#475569);margin-bottom:14px;">' +
            '<b>' + (isBn ? 'লেনদেন সীমা:' : 'Transfer Limit:') + '</b> ' + sym + minA.toLocaleString() + ' – ' + sym + maxA.toLocaleString() +
          '</div>' +
          '<div style="margin-bottom:18px;">' +
            '<div style="font-size:11px;color:var(--ink-2,#64748b);font-weight:700;margin-bottom:4px;text-transform:uppercase;">' +
              (isBn ? 'অনুমোদিত পেআউট মাধ্যম:' : 'Supported Payout Rails:') +
            '</div>' +
            '<div>' + methodsBadge + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="btn btn-primary btn-sm" data-pick-corr="' + U.esc(c.id) + '" style="flex:1;justify-content:center;">' +
            (isBn ? 'তুলনা করুন →' : 'Compare Providers →') +
          '</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-send-corr="' + U.esc(c.id) + '">' +
            (isBn ? 'পাঠান' : 'Send 💸') +
          '</button>' +
        '</div>' +
      '</div>';
  });

  html +=
      '</div>' +

      '<div class="card" style="padding:24px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border:0;border-radius:20px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">' +
          '<div>' +
            '<h4 style="font-size:17px;font-weight:800;color:#fff;margin-bottom:6px;">' +
              (isBn ? 'কাস্টম গ্লোবাল করিডোর কনফিগারেশন' : 'Need a Custom Global Corridor or Rate?') +
            '</h4>' +
            '<p style="font-size:13.5px;color:#cbd5e1;margin:0;">' +
              (isBn
                ? 'আপনি থিম কাস্টমাইজার বা অ্যাডমিন পোর্টাল থেকে যেকোনো করিডোর রেট কাস্টমাইজ করতে পারেন।'
                : 'Use the top 🎨 Theme Customizer or Admin Corridors console to configure custom currency pairs and reference rates live.') +
            '</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="corrOpenCustBtn" style="background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.25);">🎨 Customize Corridor</button>' +
            '<a href="#/help" class="btn btn-primary btn-sm">' + (isBn ? 'যোগাযোগ করুন' : 'Contact Support') + '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  el.innerHTML = html;

  el.querySelectorAll("#corrRegionFilter button").forEach(function(btn){
    btn.addEventListener("click", function(){
      activeRegion = btn.getAttribute("data-reg");
      render(el);
    });
  });

  el.querySelectorAll("[data-pick-corr]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var cid = btn.getAttribute("data-pick-corr");
      if (global.AppState) global.AppState.set("corridorId", cid);
      location.hash = "#/corridor-optimizer";
    });
  });

  el.querySelectorAll("[data-send-corr]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var cid = btn.getAttribute("data-send-corr");
      if (global.AppState) global.AppState.set("corridorId", cid);
      location.hash = "#/send?corridor=" + encodeURIComponent(cid);
    });
  });

  var custBtn = U.$("#corrOpenCustBtn", el);
  if (custBtn && global.Customizer){
    custBtn.addEventListener("click", function(){ global.Customizer.openModal(); });
  }
}

global.ModCorridors = {
  render: render,
  meta: {
    title: 'Supported Global Remittance Corridors',
    nav: 'Corridors',
    icon: 'globe'
  }
};

})(typeof window !== "undefined" ? window : global);

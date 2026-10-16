/* corridor-optimizer.js — Smarter Global Transfer Optimizer (#/corridor-optimizer).
   Features:
   - Connected Student Financial Journey Pipeline Bar
   - Exact FinancialEngine.canonicalQuote math (Upfront Fee + Hidden FX Spread + Net Converted Principal)
   - Visible Recommendation Reasoning Panel ("Why This Route Wins" — Net Payout, Delivery Time & Composite Utility Score)
   - Transparent Fee & Spread Deduction Breakdown on every provider row */
(function(global){
"use strict";
var U = global.U, FE = global.FinancialEngine;

function corridor(){ return global.AppState.corridor(); }

function parseSpeedScore(daysStr){
  var s = String(daysStr || "").toLowerCase();
  if (s.indexOf("instant") !== -1) return { score: 99, label: "Instant (< 2 mins)", mins: 2 };
  if (s.indexOf("min") !== -1) return { score: 94, label: daysStr + " (Near-Instant)", mins: 10 };
  if (s.indexOf("hour") !== -1) return { score: 85, label: daysStr, mins: 120 };
  if (s.indexOf("1-2") !== -1 || s.indexOf("1–2") !== -1) return { score: 76, label: daysStr + " (Standard ACH/Bank)", mins: 1440 };
  return { score: 65, label: daysStr || "2–3 days", mins: 2880 };
}

function render(){
  var el = U.$("#view");
  if (!el) return;
  var filter = "all"; // all | best | lowest | fastest

  function computeOffers(amt, currFilter, c){
    var baseRate = c.midRate || 119.50;
    var safeAmt = Math.max(0.01, Number(amt) || 1000);
    var rawProviders = (global.AppState && global.AppState.enabledProviders)
      ? global.AppState.enabledProviders()
      : (global.SeedProviders || []);

    var idealMidRecv = safeAmt * baseRate;

    var mapped = rawProviders.map(function(o){
      var spreadPct = Number(o.spreadPct || 0);
      var rate = baseRate * (1 - spreadPct / 100);
      var q = FE.canonicalQuote(safeAmt, o.flatFee || 0, o.pctFee || 0, rate);
      var netPrincipal = Math.max(0, safeAmt - q.fee);
      /* Hidden FX spread cost in send currency & receive currency */
      var spreadCostSend = netPrincipal * (spreadPct / 100);
      var spreadCostRecv = Math.max(0, (netPrincipal * baseRate) - q.receive);
      var totalTrueCostSend = q.fee + spreadCostSend;
      var totalLossRecv = Math.max(0, idealMidRecv - q.receive);
      var sp = parseSpeedScore(o.delivery || "1-2 days");

      return {
        id: o.id,
        name: o.name,
        flatFee: Number(o.flatFee || 0),
        pctFee: Number(o.pctFee || 0),
        spreadPct: spreadPct,
        totalFee: q.fee,
        netPrincipal: netPrincipal,
        spreadCostSend: spreadCostSend,
        spreadCostRecv: spreadCostRecv,
        totalTrueCostSend: totalTrueCostSend,
        totalLossRecv: totalLossRecv,
        rate: rate,
        receive: q.receive,
        days: o.delivery || "1-2 days",
        speedMeta: sp,
        badge: o.badge || "",
        note: o.note || "",
        best: false,
        fastestWinner: false,
        lowestFeeWinner: false,
        overallScore: 85
      };
    });

    /* Compute normalized Composite Route Score (60% Net Payout + 25% Delivery Speed + 15% Fee Transparency) */
    var maxRecv = Math.max.apply(null, mapped.map(function(x){ return x.receive; })) || 1;
    var minRecv = Math.min.apply(null, mapped.map(function(x){ return x.receive; })) || 0;
    var recvRange = Math.max(0.01, maxRecv - minRecv);

    mapped.forEach(function(m){
      var payoutNorm = ((m.receive - minRecv) / recvRange) * 100;
      var feeNorm = Math.max(0, 100 - (m.totalTrueCostSend / safeAmt) * 1200);
      m.overallScore = Math.round(0.60 * payoutNorm + 0.25 * m.speedMeta.score + 0.15 * feeNorm);
      m.overallScore = Math.max(62, Math.min(99, m.overallScore));
    });

    var byPayout = mapped.slice().sort(function(a, b){
      if (b.receive !== a.receive) return b.receive - a.receive;
      return a.totalFee - b.totalFee;
    });
    var bestOffer = byPayout[0];
    var secondBestOffer = byPayout[1] || byPayout[0];
    if (bestOffer) {
      bestOffer.best = true;
      if (!bestOffer.badge) bestOffer.badge = "Best Net Payout";
    }

    var bySpeed = mapped.slice().sort(function(a, b){
      if (a.speedMeta.mins !== b.speedMeta.mins) return a.speedMeta.mins - b.speedMeta.mins;
      return b.receive - a.receive;
    });
    if (bySpeed[0]) bySpeed[0].fastestWinner = true;

    var byLowestFee = mapped.slice().sort(function(a, b){ return a.totalFee - b.totalFee; });
    if (byLowestFee[0]) byLowestFee[0].lowestFeeWinner = true;

    if (currFilter === "lowest") {
      mapped.sort(function(a, b){ return a.totalFee - b.totalFee; });
    } else if (currFilter === "fastest") {
      mapped.sort(function(a, b){
        if (a.speedMeta.mins !== b.speedMeta.mins) return a.speedMeta.mins - b.speedMeta.mins;
        return b.receive - a.receive;
      });
    } else {
      mapped.sort(function(a, b){ return b.receive - a.receive; });
    }

    /* Synthetic Bank Benchmark for honest savings comparison */
    var bCfg = (global.DemoConfig && global.DemoConfig.benchmark) || { flatFee: 12.00, pctFee: 1.20, spreadPct: 3.50, name: "Bank wire benchmark", delivery: "2–3 days" };
    var benchRate = baseRate * (1 - (bCfg.spreadPct || 3.5) / 100);
    var benchQ = FE.canonicalQuote(safeAmt, bCfg.flatFee || 12, bCfg.pctFee || 1.2, benchRate);
    var benchmark = {
      name: bCfg.name,
      totalFee: benchQ.fee,
      spreadPct: bCfg.spreadPct || 3.5,
      rate: benchRate,
      receive: benchQ.receive,
      days: bCfg.delivery || "2–3 days",
      savings: bestOffer ? (bestOffer.receive - benchQ.receive) : 0,
      vsSecondBest: (bestOffer && secondBestOffer) ? (bestOffer.receive - secondBestOffer.receive) : 0
    };

    return {
      list: mapped,
      best: bestOffer || mapped[0],
      secondBest: secondBestOffer || mapped[0],
      fastest: bySpeed[0] || mapped[0],
      lowestFee: byLowestFee[0] || mapped[0],
      benchmark: benchmark
    };
  }

  function renderView(){
    var c = corridor();
    var allCorridors = global.AppState.enabledCorridors();
    var sendAmt = Number(global.AppState.get("amount")) || 1000;
    var res = computeOffers(sendAmt, filter, c);
    var offers = res.list;
    var best = res.best;
    var fastest = res.fastest;
    var bench = res.benchmark;
    var rateDecimals = c.midRate < 1 ? 4 : 2;
    var topRecv = (best ? best.receive : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    /* Determine active recommendation based on selected filter tab */
    var activeRec = filter === "fastest" ? fastest : filter === "lowest" ? res.lowestFee : best;
    var activeRecReason = "";
    if (filter === "fastest"){
      activeRecReason = "You selected <b>Fastest Delivery</b>. <b>" + U.esc(activeRec.name) + "</b> settles in <b>" + U.esc(activeRec.days) + "</b> while delivering <b>" + U.ccySym(c.receiveCcy) + activeRec.receive.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + " " + U.esc(c.receiveCcy) + "</b> after all fees.";
    } else if (filter === "lowest"){
      activeRecReason = "You selected <b>Lowest Upfront Fee</b>. <b>" + U.esc(activeRec.name) + "</b> charges only <b>" + U.ccySym(c.sendCcy) + activeRec.totalFee.toFixed(2) + "</b> upfront, though remember to check net recipient payout after FX spread.";
    } else {
      activeRecReason = "<b>" + U.esc(best.name) + "</b> is our #1 recommended route because after deducting both the <b>upfront fee (" + U.ccySym(c.sendCcy) + best.totalFee.toFixed(2) + ")</b> and the <b>FX rate spread (" + best.spreadPct.toFixed(2) + "% = " + U.ccySym(c.sendCcy) + best.spreadCostSend.toFixed(2) + ")</b>, your recipient receives <b>" + U.ccySym(c.receiveCcy) + topRecv + " " + U.esc(c.receiveCcy) + "</b> in their hand — beating the #2 provider (" + U.esc(res.secondBest.name) + ") by <b>+" + U.ccySym(c.receiveCcy) + bench.vsSecondBest.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + " " + U.esc(c.receiveCcy) + "</b> and beating traditional bank wires by <b>+" + U.ccySym(c.receiveCcy) + Math.max(0, bench.savings).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + " " + U.esc(c.receiveCcy) + "</b> with <b>" + U.esc(best.days) + "</b> delivery.";
    }

    el.innerHTML =
      '<div class="page" style="max-width:1320px;">' +
        /* Connected Student Journey Pipeline Bar */
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:linear-gradient(90deg,#071B33,#0D3B4C);color:#fff;padding:12px 18px;border-radius:16px;margin-bottom:20px;">' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
            '<span style="background:#4ade80;color:#0f172a;font-size:10.5px;font-weight:900;padding:3px 9px;border-radius:999px;">CONNECTED STUDENT JOURNEY</span>' +
            '<span style="font-size:13px;font-weight:700;">Step 3 of 4: Smarter Route Selection (All Fees + FX Spread Deducted)</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<a href="#/student-journey" class="btn btn-sm btn-secondary" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);text-decoration:none;font-size:11.5px;">🎯 1. Student Journey</a>' +
            '<a href="#/tuition-planner" class="btn btn-sm btn-secondary" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);text-decoration:none;font-size:11.5px;">🎓 2. Tuition Planner</a>' +
            '<a href="#/scamshield" class="btn btn-sm btn-secondary" style="background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);text-decoration:none;font-size:11.5px;">🛡️ 4. ScamShield Verify</a>' +
            '<a href="#/copilot" class="btn btn-sm btn-primary" style="text-decoration:none;font-size:11.5px;">🤖 Ask Copilot+</a>' +
          '</div>' +
        '</div>' +

        /* Header */
        '<div style="margin-bottom:22px;">' +
          '<div class="page-head" style="text-align:center;margin-bottom:14px;">' +
            '<h1 class="page-title">Smarter Global Transfer Optimizer</h1>' +
            '<p class="page-sub">Transparent net-payout comparison across ' + allCorridors.length + ' global corridors — showing exact upfront fees, hidden FX spread costs, delivery time SLAs, and explainable recommendation reasoning.</p>' +
          '</div>' +
        '</div>' +

        /* Quick Corridor Pills */
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:22px;" id="corrSeg">' +
          allCorridors.slice(0, 8).map(function(cr){
            var act = cr.id === c.id;
            var f1 = cr.flagFrom || U.ccyFlag(cr.sendCcy);
            var f2 = cr.flagTo || U.ccyFlag(cr.receiveCcy);
            return '<button type="button" class="btn btn-sm ' + (act ? 'btn-primary' : 'btn-secondary') + '" data-cid="' + U.esc(cr.id) + '" style="border-radius:999px;font-size:12px;">' +
              f1 + ' ' + U.esc(cr.sendCcy + ' → ' + cr.receiveCcy) + ' ' + f2 +
            '</button>';
          }).join("") +
        '</div>' +

        '<div class="grid gm" style="grid-template-columns: 0.9fr 1.3fr; gap: 24px;">' +

          /* Left Panel: Transfer Form & Net Deduction Math */
          '<div class="card" style="border-radius:20px;padding:26px;">' +
            '<div class="card-head"><h2>Transfer Parameters</h2><span class="badge badge-demo">CANONICAL QUOTE</span></div>' +

            '<div class="field" style="margin-top:14px;">' +
              '<label for="optCorridorSelect">Global Corridor (' + allCorridors.length + ' Active Routes)</label>' +
              '<select class="input" id="optCorridorSelect">' +
                allCorridors.map(function(cr){
                  var sel = cr.id === c.id ? " selected" : "";
                  var f1 = cr.flagFrom || U.ccyFlag(cr.sendCcy);
                  var f2 = cr.flagTo || U.ccyFlag(cr.receiveCcy);
                  return '<option value="' + U.esc(cr.id) + '"' + sel + '>' + f1 + ' ' + U.esc(cr.label) + ' (' + cr.sendCcy + ' → ' + cr.receiveCcy + ') ' + f2 + '</option>';
                }).join("") +
              '</select>' +
            '</div>' +

            '<div class="field" style="margin-top:14px;">' +
              '<label for="optSendAmt">You send (' + U.esc(c.sendCcy) + ')</label>' +
              '<div class="input-row">' +
                '<input class="input mono" id="optSendAmt" type="number" min="1" step="any" value="' + sendAmt + '" style="font-size:20px;font-weight:800;">' +
                '<span class="ccy-tag" style="background:#f1f5f9;font-weight:800;">' + (c.flagFrom || U.ccyFlag(c.sendCcy)) + ' ' + U.esc(c.sendCcy) + '</span>' +
              '</div>' +
              '<p class="field-err" id="amtErr" role="alert"></p>' +
            '</div>' +

            '<div class="field" style="margin-top:14px;">' +
              '<label for="optRecvAmt">Recipient gets exactly (after all fees &amp; spread)</label>' +
              '<div class="input-row">' +
                '<input class="input mono" id="optRecvAmt" type="text" value="' + topRecv + '" readonly style="font-size:20px;font-weight:800;color:#071B33;background:#E6F8F7;">' +
                '<span class="ccy-tag" style="background:#CCFBF1;color:#071B33;font-weight:800;">' + (c.flagTo || U.ccyFlag(c.receiveCcy)) + ' ' + U.esc(c.receiveCcy) + '</span>' +
              '</div>' +
            '</div>' +

            /* Transparent Step-by-Step Math Box for Best Provider */
            (best ? (
              '<div style="margin-top:16px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:14px;padding:14px;">' +
                '<div style="font-size:11px;font-weight:800;color:#071B33;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">📐 Exact Net Payout Formula (' + U.esc(best.name) + ')</div>' +
                '<div style="display:grid;gap:5px;font-size:12.5px;color:#334155;">' +
                  '<div style="display:flex;justify-content:space-between;"><span>1. Gross Amount Sent:</span><b class="mono">' + U.ccySym(c.sendCcy) + sendAmt.toFixed(2) + ' ' + U.esc(c.sendCcy) + '</b></div>' +
                  '<div style="display:flex;justify-content:space-between;color:#dc2626;"><span>2. Less Upfront Fee (' + U.ccySym(c.sendCcy) + best.flatFee.toFixed(2) + ' + ' + best.pctFee.toFixed(2) + '%):</span><b class="mono">− ' + U.ccySym(c.sendCcy) + best.totalFee.toFixed(2) + ' ' + U.esc(c.sendCcy) + '</b></div>' +
                  '<div style="display:flex;justify-content:space-between;"><span>3. Net Principal Converted:</span><b class="mono">' + U.ccySym(c.sendCcy) + best.netPrincipal.toFixed(2) + ' ' + U.esc(c.sendCcy) + '</b></div>' +
                  '<div style="display:flex;justify-content:space-between;color:#d97706;"><span>4. Effective Rate (Mid ' + Number(c.midRate).toFixed(rateDecimals) + ' − ' + best.spreadPct.toFixed(2) + '% spread):</span><b class="mono">' + best.rate.toFixed(rateDecimals) + ' ' + U.esc(c.receiveCcy) + '</b></div>' +
                  '<div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #cbd5e1;font-size:13.5px;color:#15803d;"><span><b>5. Exact Recipient Payout:</b></span><b class="mono">' + U.ccySym(c.receiveCcy) + topRecv + ' ' + U.esc(c.receiveCcy) + '</b></div>' +
                  (c.receiveCcy === "BDT" ? '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#047857;"><span>+ 2.5% BD Govt Incentive (Family Remit):</span><b class="mono">+ ৳' + (best.receive * 0.025).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' BDT</b></div>' : '') +
                '</div>' +
              '</div>'
            ) : '') +

            '<div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;font-size:12.5px;color:#065f46;" id="optSavingsBox">' +
              '💡 <b>Save ' + U.ccySym(c.receiveCcy) + Math.max(0, bench.savings).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + U.esc(c.receiveCcy) + '</b> with <b>' + U.esc(best ? best.name : "Best Provider") + '</b> vs. bank wire benchmark (' + U.ccySym(c.receiveCcy) + bench.receive.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + U.esc(c.receiveCcy) + ').' +
            '</div>' +

            '<button type="button" class="btn btn-primary" id="optFindBtn" style="width:100%;margin-top:16px;padding:13px;border-radius:12px;font-weight:800;">' +
              'Recalculate &amp; Compare Routes' +
            '</button>' +
          '</div>' +

          /* Right Panel: Visible Recommendation Reasoning + Provider Comparison */
          '<div>' +
            /* Visible Recommendation Reasoning Card ("Why This Route Wins") */
            (activeRec ? (
              '<div class="card" style="border-radius:20px;padding:20px 22px;margin-bottom:18px;background:linear-gradient(135deg,#E6F8F7 0%,#f0fdf4 100%);border:2px solid #0D9F9A;">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:8px;">' +
                  '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<span style="font-size:22px;">🧠</span>' +
                    '<div>' +
                      '<span style="font-size:10.5px;font-weight:900;color:#097A76;text-transform:uppercase;letter-spacing:0.06em;">EXPLAINABLE OPTIMIZER RECOMMENDATION</span>' +
                      '<h3 style="margin:2px 0 0;font-size:16.5px;font-weight:900;color:#0f172a;">Why ' + U.esc(activeRec.name) + ' Is Recommended for Your Transfer</h3>' +
                    '</div>' +
                  '</div>' +
                  '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                    '<span style="background:#097A76;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;">Route Score: ' + activeRec.overallScore + '/100</span>' +
                    '<span style="background:#047857;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;">⏱️ ' + U.esc(activeRec.days) + '</span>' +
                  '</div>' +
                '</div>' +
                '<p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#1e293b;">' + activeRecReason + '</p>' +
                '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;font-size:12px;">' +
                  '<div style="background:#fff;border:1px solid #99F6E4;border-radius:10px;padding:8px 10px;">' +
                    '<span style="color:#64748b;font-size:10.5px;font-weight:700;display:block;">BEST NET PAYOUT</span>' +
                    '<b style="color:#0f172a;">' + U.esc(best.name) + ' (' + U.ccySym(c.receiveCcy) + topRecv + ')</b>' +
                  '</div>' +
                  '<div style="background:#fff;border:1px solid #99F6E4;border-radius:10px;padding:8px 10px;">' +
                    '<span style="color:#64748b;font-size:10.5px;font-weight:700;display:block;">FASTEST DELIVERY</span>' +
                    '<b style="color:#0f172a;">' + U.esc(fastest.name) + ' (' + U.esc(fastest.days) + ')</b>' +
                  '</div>' +
                  '<div style="background:#fff;border:1px solid #99F6E4;border-radius:10px;padding:8px 10px;">' +
                    '<span style="color:#64748b;font-size:10.5px;font-weight:700;display:block;">TRUE COST (FEE + SPREAD)</span>' +
                    '<b style="color:#15803d;">' + U.ccySym(c.sendCcy) + activeRec.totalTrueCostSend.toFixed(2) + ' (' + ((activeRec.totalTrueCostSend / sendAmt) * 100).toFixed(2) + '%)</b>' +
                  '</div>' +
                '</div>' +
              '</div>'
            ) : '') +

            '<div class="card" style="border-radius:20px;padding:24px;">' +
              '<div class="card-head" style="margin-bottom:16px;">' +
                '<div>' +
                  '<h2>All Routes Compared · ' + U.esc(c.label) + '</h2>' +
                  '<span style="font-size:12px;color:#64748b;">Mid-market reference: 1 ' + U.esc(c.sendCcy) + ' = ' + Number(c.midRate).toFixed(rateDecimals) + ' ' + U.esc(c.receiveCcy) + ' · All fees &amp; FX spreads deducted</span>' +
                '</div>' +
                /* Filter Pills */
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-sm ' + (filter==="all"?"btn-primary":"btn-secondary") + '" data-flt="all">Best Net Payout</button>' +
                  '<button type="button" class="btn btn-sm ' + (filter==="fastest"?"btn-primary":"btn-secondary") + '" data-flt="fastest">Fastest Speed</button>' +
                  '<button type="button" class="btn btn-sm ' + (filter==="lowest"?"btn-primary":"btn-secondary") + '" data-flt="lowest">Lowest Upfront Fee</button>' +
                '</div>' +
              '</div>' +

              /* Provider Cards List */
              '<div style="display:grid;gap:12px;" id="optOffersList">' +
                offers.map(function(o){
                  var isBest = o.best;
                  var recvStr = o.receive.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  var diffFromBest = best ? (best.receive - o.receive) : 0;
                  return '<div style="padding:16px 18px;border-radius:16px;border:1.5px solid ' + (isBest ? '#0D9F9A' : '#e2e8f0') + ';background:' + (isBest ? '#E6F8F7' : '#fff') + ';box-shadow:0 2px 6px rgba(0,0,0,0.03);">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
                      '<div style="display:flex;align-items:center;gap:12px;">' +
                        '<div style="width:42px;height:42px;border-radius:12px;background:' + (isBest ? '#0D9F9A' : '#f1f5f9') + ';color:' + (isBest ? '#fff' : '#1e293b') + ';display:grid;place-items:center;font-weight:800;font-size:15px;">' +
                          U.esc(o.name.charAt(0)) +
                        '</div>' +
                        '<div>' +
                          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                            '<b style="font-size:15px;color:#0f172a;">' + U.esc(o.name) + '</b>' +
                            (isBest ? '<span style="font-size:10px;font-weight:800;background:#0D9F9A;color:#fff;padding:2px 8px;border-radius:6px;">🏆 #1 HIGHEST RECIPIENT PAYOUT</span>' : '') +
                            (o.fastestWinner ? '<span style="font-size:10px;font-weight:800;background:#059669;color:#fff;padding:2px 8px;border-radius:6px;">⚡ FASTEST (' + U.esc(o.days) + ')</span>' : '') +
                            '<span style="font-size:10px;font-weight:700;background:#f1f5f9;color:#334155;padding:2px 7px;border-radius:6px;">Score: ' + o.overallScore + '/100</span>' +
                          '</div>' +
                          '<span style="font-size:12px;color:#475569;display:block;margin-top:2px;">Upfront Fee: <b>' + U.ccySym(c.sendCcy) + o.totalFee.toFixed(2) + '</b> · FX Spread: <b>' + o.spreadPct.toFixed(2) + '% (' + U.ccySym(c.sendCcy) + o.spreadCostSend.toFixed(2) + ')</b> · Rate: <b>1 ' + c.sendCcy + ' = ' + o.rate.toFixed(rateDecimals) + ' ' + c.receiveCcy + '</b></span>' +
                        '</div>' +
                      '</div>' +

                      '<div style="text-align:right;margin-left:auto;">' +
                        '<div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;">Recipient Gets Exactly</div>' +
                        '<div style="font-size:18px;font-weight:900;color:' + (isBest ? '#071B33' : '#0f172a') + ';">' + U.ccySym(c.receiveCcy) + recvStr + ' ' + c.receiveCcy + '</div>' +
                        '<span style="font-size:11.5px;color:' + (isBest ? '#059669' : '#64748b') + ';font-weight:700;">⏱️ ' + U.esc(o.days) + (diffFromBest > 0 ? ' · (−' + U.ccySym(c.receiveCcy) + diffFromBest.toFixed(2) + ' vs #1)' : ' · Maximum Value') + '</span>' +
                      '</div>' +

                      '<button type="button" class="btn btn-sm ' + (isBest ? 'btn-primary' : 'btn-secondary') + '" data-select-prov="' + U.esc(o.id) + '" style="border-radius:10px;padding:8px 16px;font-weight:800;">' +
                        'Select Route' +
                      '</button>' +
                    '</div>' +
                  '</div>';
                }).join("") +

                /* Synthetic Benchmark Row */
                '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 18px;border-radius:14px;border:1px dashed #cbd5e1;background:#f8fafc;opacity:0.9;flex-wrap:wrap;">' +
                  '<div>' +
                    '<b style="font-size:13.5px;color:#475569;">🏦 ' + U.esc(bench.name) + ' (Traditional Bank Wire Baseline)</b>' +
                    '<span style="display:block;font-size:11.5px;color:#64748b;">Upfront Fee: ' + U.ccySym(c.sendCcy) + bench.totalFee.toFixed(2) + ' · FX Spread: ' + bench.spreadPct.toFixed(2) + '% · Rate: 1 ' + c.sendCcy + ' = ' + bench.rate.toFixed(rateDecimals) + ' ' + c.receiveCcy + '</span>' +
                  '</div>' +
                  '<div style="text-align:right;">' +
                    '<b style="font-size:14.5px;color:#dc2626;">' + U.ccySym(c.receiveCcy) + bench.receive.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + c.receiveCcy + '</b>' +
                    '<span style="display:block;font-size:11px;color:#64748b;">⏱️ ' + U.esc(bench.days) + ' · Loses ' + U.ccySym(c.receiveCcy) + Math.max(0, bench.savings).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              /* Rate Trend Chart Box */
              '<div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px;">' +
                  '<b style="font-size:13px;color:#334155;">Rate Trend · ' + U.esc(c.sendCcy + '/' + c.receiveCcy) + ' (Last 7 Days)</b>' +
                  '<a href="#/fx-advisor" style="font-size:12px;color:#0D9F9A;font-weight:700;text-decoration:none;">Open 90-Day FX Timing Advisor →</a>' +
                '</div>' +
                '<svg viewBox="0 0 400 60" width="100%" height="50">' +
                  '<polyline points="10,45 70,40 130,42 190,30 250,25 310,28 370,12" fill="none" stroke="#0D9F9A" stroke-width="2.5" stroke-linecap="round"/>' +
                  '<circle cx="370" cy="12" r="4" fill="#0D9F9A"/>' +
                '</svg>' +
              '</div>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    /* Event Listeners */
    var corrSel = U.$("#optCorridorSelect", el);
    if (corrSel){
      corrSel.addEventListener("change", function(){
        global.AppState.set("corridorId", corrSel.value);
        global.AppState.set("fxCorridorId", corrSel.value);
        renderView();
      });
    }

    U.$$("#corrSeg [data-cid]", el).forEach(function(b){
      b.addEventListener("click", function(){
        var cid = b.getAttribute("data-cid");
        global.AppState.set("corridorId", cid);
        global.AppState.set("fxCorridorId", cid);
        renderView();
      });
    });

    var amtInput = U.$("#optSendAmt", el);
    var errEl = U.$("#amtErr", el);
    if (amtInput){
      amtInput.addEventListener("input", U.debounce(function(){
        if (!document.body.contains(amtInput)) return;
        var vCheck = FE.validateAmount(amtInput.value, c.sendCcy);
        if (!vCheck.ok){
          if (errEl){ errEl.textContent = vCheck.error; errEl.classList.add("show"); }
          return;
        }
        if (errEl){ errEl.textContent = ""; errEl.classList.remove("show"); }
        sendAmt = vCheck.minor / 100;
        global.AppState.set("amount", sendAmt);
        renderView();
      }, 280));
    }

    var findBtn = U.$("#optFindBtn", el);
    if (findBtn){
      findBtn.addEventListener("click", function(){
        if (amtInput){
          var vCheck = FE.validateAmount(amtInput.value, c.sendCcy);
          if (!vCheck.ok){
            if (errEl){ errEl.textContent = vCheck.error; errEl.classList.add("show"); }
            return;
          }
          sendAmt = vCheck.minor / 100;
          global.AppState.set("amount", sendAmt);
        }
        renderView();
      });
    }

    U.$$("#view [data-flt]").forEach(function(b){
      b.addEventListener("click", function(){
        filter = b.getAttribute("data-flt");
        renderView();
      });
    });

    U.$$("#view [data-select-prov]").forEach(function(b){
      b.addEventListener("click", function(){
        var provId = b.getAttribute("data-select-prov");
        var selected = offers.filter(function(o){ return o.id === provId; })[0];
        if (selected) openReviewModal(selected, sendAmt, c);
      });
    });
  }

  function openReviewModal(prov, amt, cr){
    var rateDecimals = cr.midRate < 1 ? 4 : 2;
    var recv = prov.receive.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    global.Modal.open({
      title: "Step 3: Review Transparent Route Breakdown (" + cr.label + ")",
      body: '<div style="display:grid;gap:14px;">' +
        '<div style="background:#E6F8F7;padding:16px;border-radius:12px;border:1px solid #99F6E4;">' +
          '<div style="font-size:12px;color:#071B33;font-weight:700;">SELECTED ROUTE · SCORE ' + prov.overallScore + '/100</div>' +
          '<div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;">' + U.esc(prov.name) + '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-top:4px;">Estimated Delivery: ' + U.esc(prov.days) + '</div>' +
        '</div>' +
        '<div class="kv">' +
          '<div class="r"><span>Corridor</span><span>' + U.esc(cr.label) + '</span></div>' +
          '<div class="r"><span>Gross Sending Amount</span><span>' + U.ccySym(cr.sendCcy) + amt.toFixed(2) + ' ' + cr.sendCcy + '</span></div>' +
          '<div class="r"><span>Upfront Fee (' + U.ccySym(cr.sendCcy) + prov.flatFee.toFixed(2) + ' + ' + prov.pctFee.toFixed(2) + '%)</span><span>− ' + U.ccySym(cr.sendCcy) + prov.totalFee.toFixed(2) + ' ' + cr.sendCcy + '</span></div>' +
          '<div class="r"><span>Net Converted Principal</span><span>' + U.ccySym(cr.sendCcy) + prov.netPrincipal.toFixed(2) + ' ' + cr.sendCcy + '</span></div>' +
          '<div class="r"><span>Effective Rate (Spread ' + prov.spreadPct.toFixed(2) + '%)</span><span>1 ' + cr.sendCcy + ' = ' + prov.rate.toFixed(rateDecimals) + ' ' + cr.receiveCcy + '</span></div>' +
          '<div class="r total"><span>Exact Recipient Payout</span><span>' + U.ccySym(cr.receiveCcy) + recv + ' ' + cr.receiveCcy + '</span></div>' +
        '</div>' +
        '<div class="field" style="margin-top:10px;">' +
          '<label for="draftRecvName">Recipient Full Name</label>' +
          '<input class="input" id="draftRecvName" value="Rahim Ahmed">' +
        '</div>' +
        '<div class="field">' +
          '<label for="draftPurpose">Transfer Purpose</label>' +
          '<input class="input" id="draftPurpose" value="University Tuition & Family Support">' +
        '</div>' +
      '</div>',
      okLabel: "Confirm & Save Transfer Draft",
      onOk: function(){
        var seq = (global.AppState.get("draftSeq") || 0) + 1;
        global.AppState.set("draftSeq", seq);
        var principalMinor = Math.round(amt * 100);
        var ref = FE.draftRef(FE.canonicalDraft(cr.id, prov.id, principalMinor, seq));
        var recName = document.getElementById("draftRecvName") ? document.getElementById("draftRecvName").value.trim() : "Rahim Ahmed";
        var purp = document.getElementById("draftPurpose") ? document.getElementById("draftPurpose").value.trim() : "Tuition";
        var nowIso = new Date().toISOString();

        var drafts = (global.AppState.get("drafts") || []).slice();
        drafts.unshift({
          ref: ref,
          createdISO: nowIso,
          corridorId: cr.id,
          providerId: prov.id,
          providerName: prov.name,
          principalMinor: principalMinor,
          sendCcy: cr.sendCcy,
          sendSym: cr.sendSym || U.ccySym(cr.sendCcy),
          flatMinor: Math.round(prov.flatFee * 100),
          pctMinor: Math.round((prov.totalFee - prov.flatFee) * 100),
          customerRate: prov.rate,
          receiveMinor: Math.round(prov.receive * 100),
          receiveCcy: cr.receiveCcy,
          receiveSym: cr.receiveSym || U.ccySym(cr.receiveCcy),
          delivery: prov.days,
          recipientName: recName || "Rahim Ahmed",
          purpose: purp || "Tuition"
        });
        global.AppState.set("drafts", drafts);

        var transfers = (global.AppState.get("transfers") || []).slice();
        transfers.unshift({
          id: "draft_" + seq + "_" + Date.now(),
          psp_reference: ref,
          recipient_name: recName || "Rahim Ahmed",
          payout_method: prov.name.toLowerCase(),
          account_number: "Verified Route (" + prov.name + ")",
          corridor: cr.code || cr.id,
          send_currency: cr.sendCcy,
          send_amount: amt,
          receive_currency: cr.receiveCcy,
          receive_amount: prov.receive,
          fx_rate: prov.rate,
          fee_amount: prov.totalFee,
          purpose: purp || "Tuition",
          payment_method: prov.name,
          status: "dispatched",
          created_at: nowIso,
          events: [
            { status: "draft", detail: "Optimizer draft " + ref + " created via " + prov.name, created_at: nowIso },
            { status: "funded", detail: "Simulated funding confirmed (" + U.ccySym(cr.sendCcy) + amt.toFixed(2) + " " + cr.sendCcy + ")", created_at: nowIso },
            { status: "dispatched", detail: "Queued on " + prov.name + " settlement rail (" + prov.days + ")", created_at: nowIso }
          ]
        });
        global.AppState.set("transfers", transfers);

        if (global.Toast) global.Toast.show("Draft " + ref + " created! Viewable in Payment Vault.", "ok");
        location.hash = "#/payment-vault";
      }
    });
  }

  renderView();
}

global.ModOptimizer = { render: render, meta:{ title:"Smarter Transfer Optimizer", nav:"Optimizer", icon:"sliders" } };
})(typeof window !== "undefined" ? window : global);

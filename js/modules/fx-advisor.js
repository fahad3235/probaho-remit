/* fx-advisor.js — seeded 90-day FX history, KPIs and illustrative signals. */
(function(global){
"use strict";

function corridor(){
  var id = global.AppState.get("fxCorridorId") || "dhaka-london";
  var list = global.AppState.corridors();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  var en = global.AppState.enabledCorridors();
  return en[0] || list[0];
}

function render(){
  var el = U.$("#view");
  var c = corridor();
  var k = global.FxEngine.kpis(c);
  var ma = global.FxEngine.movingAverage(k.series, 7);
  var sig = global.FxEngine.signal(c);

  var dirNote = "For this corridor a <b>higher</b> rate means more " + U.esc(c.receiveCcy) +
    " per 1 " + U.esc(c.sendCcy) + " — better for the sender.";

  var segBtns = global.AppState.enabledCorridors().map(function(x){
    return '<button data-cid="' + U.esc(x.id) + '" aria-pressed="' + (x.id === c.id) + '">' +
      U.esc(x.label) + '</button>';
  }).join("");

  var labels = k.series.map(function(p, i){
    return { label: U.fmtDate(p.dateISO), rate: p.rate };
  });

  var chartHtml = global.Chart.line({
    series: labels,
    ma: ma,
    height: 270,
    ariaLabel: "Simulated 90-day exchange rate for " + c.label + " with 7-day moving average",
    yFmt: function(v){ return v.toFixed(4) + " " + c.receiveCcy; }
  });

  var sigClass = sig.signal === "SEND_NOW" ? "" : sig.signal === "WAIT" ? "wait" : "hold";
  var sigLabel = { SEND_NOW:"SEND NOW", WAIT:"WAIT", HOLD:"HOLD" }[sig.signal];
  var sigBadge = sig.signal === "SEND_NOW" ? "badge-ok" : sig.signal === "WAIT" ? "badge-warn" : "badge-crit";

  el.innerHTML =
    '<div class="page-head"><p class="eyebrow">Module 3 · FX Timing Advisor</p>' +
    '<h1 class="page-title">Read the trend. Respect the uncertainty.</h1>' +
    '<p class="page-sub">Ninety days of deterministic seeded rates with a 7-day moving average and ' +
    'illustrative timing signals. ' + dirNote + '</p></div>' +

    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>SIMULATED FX HISTORY — NOT LIVE MARKET DATA.</b> Signals are illustrative decision rules, ' +
    'not predictions. This demo cannot forecast future market conditions.</span></div>' +

    '<div class="toolbar"><div class="seg" role="group" aria-label="Corridor" id="fxSeg">' + segBtns + '</div></div>' +

    '<div class="grid g4" style="margin-bottom:18px">' +
      kpi("Current simulated rate", '<span class="num">' + k.current.toFixed(4) + '</span>',
          '<span class="num">' + c.receiveCcy + ' per 1 ' + c.sendCcy + '</span>', "chart") +
      kpi("7-day change", '<span class="num">' + (k.change7Pct >= 0 ? "+" : "") + k.change7Pct.toFixed(2) + '%</span>',
          k.change7Pct >= 0 ? "up" : "down", "chart") +
      kpi("90-day best (seeded)", '<span class="num">' + k.best90.toFixed(4) + '</span>',
          "highest simulated rate in range", "chart") +
      kpi("Spread vs synthetic mid", '<span class="num">' + k.spreadVsMidPct.toFixed(2) + '%</span>',
          "reference mid: " + c.midRate, "chart") +
    '</div>' +

    '<div class="grid gm">' +
      '<div class="card fx-chart-card"><div class="card-head"><h2>90-day simulated rate · ' + U.esc(c.label) + '</h2>' +
      '<span class="badge badge-demo">SIMULATED</span></div>' + chartHtml +
      '<div class="fx-legend"><span><i style="background:#0B8F86"></i>Simulated daily rate</span>' +
      '<span><i style="background:#B7791F"></i>7-day moving average</span></div></div>' +
      '<div class="card signal-card ' + sigClass + '"><div class="card-head"><h2>Illustrative signal</h2>' +
      '<span class="badge ' + sigBadge + '">' + sigLabel + '</span></div>' +
      '<p class="small" style="margin-top:10px">' + U.esc(sig.reason) + '</p>' +
      '<div class="demo-note" style="margin-top:14px;margin-bottom:0">' + U.icon("info") +
      '<span>' + U.esc(sig.note) + '</span></div></div>' +
    '</div>' +

    '<div style="margin-top:18px"><a class="btn btn-secondary" href="#/corridor-optimizer">Back to the Optimizer</a></div>';

  U.$("#fxSeg", el).addEventListener("click", function(e){
    var b = e.target.closest("[data-cid]");
    if (!b) return;
    global.AppState.set("fxCorridorId", b.getAttribute("data-cid"));
    render();
  });
}

function kpi(k, v, d, icon){
  var cls = d === "up" ? "up" : d === "down" ? "down" : "";
  var dtxt = cls ? (d === "up" ? "▲ rising" : "▼ falling") : d;
  return '<div class="kpi"><p class="k">' + U.icon(icon, 14) + ' ' + U.esc(k) + '</p>' +
    '<p class="v">' + v + '</p><p class="d ' + cls + '">' + dtxt + '</p></div>';
}

global.ModFx = { render: render, meta:{ title:"FX Timing Advisor", sub:"Seeded FX trends", nav:"FX Advisor", icon:"chart" } };
})(window);

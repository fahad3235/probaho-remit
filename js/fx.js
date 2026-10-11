/* ============================================================
   Probaho Remit — Module 4: FX Timing Advisor
   Renders into window.PM.fx.render(el).
   No network, no randomness — all data from DemoData.
   ============================================================ */
(function () {
  'use strict';

  var RATE_COLOR = '#0c3a5e';
  var MA_COLOR = '#0bbf9a';
  var GRID_COLOR = '#e2e8f1';
  var TEXT_COLOR = '#3d526b';
  var CHART_HEIGHT = 320;
  var X_LABEL_EVERY = 15;
  var RESIZE_DEBOUNCE_MS = 200;

  window.PM = window.PM || {};

  function corridorOptions(selectedId) {
    return DemoData.corridors.map(function (c) {
      var sel = (c.id === selectedId) ? ' selected' : '';
      return '<option value="' + c.id + '"' + sel + '>' +
        c.from + ' &rarr; ' + c.to + ' &middot; ' + c.fromCur + '&rarr;' + c.toCur +
        '</option>';
    }).join('');
  }

  function kpi(label, value, sub) {
    return '<div class="kpi"><div class="k-label">' + label + '</div>' +
      '<div class="k-value">' + value + '</div>' +
      '<div class="k-sub">' + sub + '</div></div>';
  }

  function drawChart(el, corridorId) {
    var canvas = el.querySelector('#fx-canvas');
    if (!canvas || !el.isConnected) return;
    var ctx = (typeof canvas.getContext === 'function') ? canvas.getContext('2d') : null;
    if (!ctx) throw new Error('canvas unsupported');

    var series = DemoData.fxSeries(corridorId) || [];
    var note = el.querySelector('#fx-chart-note');
    if (!series.length) {
      if (note) {
        note.style.display = 'block';
        note.textContent = 'No rate data available for this corridor.';
      }
      return;
    }
    if (note) note.style.display = 'none';

    var wrap = canvas.parentElement;
    var w = (wrap && wrap.clientWidth) ? wrap.clientWidth : 0;
    if (!(w > 0) || !isFinite(w)) return; // hidden container: skip, keep prior frame

    var h = CHART_HEIGHT;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = '100%';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var rates = series.map(function (p) { return p.rate; });
    var ma = DemoData.movingAverage(series, 7);
    var min = Math.min.apply(null, rates);
    var max = Math.max.apply(null, rates);
    var range = max - min;
    if (!(range > 0)) range = (Math.abs(max) * 0.02) || 1; // guard flat series
    var pad = range * 0.05;
    var lo = min - pad;
    var hi = max + pad;

    var mL = 68, mR = 18, mT = 30, mB = 32;
    var plotW = Math.max(10, w - mL - mR);
    var plotH = Math.max(10, h - mT - mB);
    var denom = Math.max(1, series.length - 1);

    function x(i) { return mL + (i / denom) * plotW; }
    function y(v) { return mT + (1 - (v - lo) / (hi - lo)) * plotH; }

    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    // Horizontal grid lines + Y ticks
    var ticks = 5;
    for (var t = 0; t < ticks; t++) {
      var tv = lo + (hi - lo) * (t / (ticks - 1));
      var ty = y(tv);
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mL, ty);
      ctx.lineTo(mL + plotW, ty);
      ctx.stroke();
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'right';
      ctx.fillText(DemoData.fmtRate(tv), mL - 8, ty);
    }

    // X labels every 15 days
    ctx.textAlign = 'center';
    for (var i = 0; i < series.length; i += X_LABEL_EVERY) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(series[i].label, x(i), mT + plotH + 18);
    }

    function drawLine(values, color, width, dashed) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      for (var k = 0; k < values.length; k++) {
        var px = x(k), py = y(values[k]);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawLine(rates, RATE_COLOR, 2.5, false);
    drawLine(ma, MA_COLOR, 2, true);

    // Min / max markers with labels
    var iMin = rates.indexOf(min);
    var iMax = rates.indexOf(max);
    ctx.textAlign = 'center';
    function marker(idx, v, tag, above) {
      var mx = x(idx), my = y(v);
      ctx.fillStyle = RATE_COLOR;
      ctx.beginPath();
      ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = RATE_COLOR;
      ctx.font = '700 11px Inter, system-ui, sans-serif';
      ctx.fillText(tag + ' ' + DemoData.fmtRate(v), mx, above ? my - 14 : my + 15);
      ctx.font = '11px Inter, system-ui, sans-serif';
    }
    marker(iMax, max, 'High', true);
    if (iMin !== iMax) marker(iMin, min, 'Low', false);

    // Legend (top-right of plot area)
    ctx.textAlign = 'left';
    var lx = mL + plotW - 176, ly = 10;
    ctx.strokeStyle = RATE_COLOR;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 22, ly); ctx.stroke();
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('Rate', lx + 28, ly);
    ctx.strokeStyle = MA_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(lx + 92, ly); ctx.lineTo(lx + 114, ly); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('7-day MA', lx + 120, ly);
  }

  function updateModule(el, corridorId) {
    var c = DemoData.getCorridor(corridorId);
    var series = DemoData.fxSeries(corridorId) || [];
    var sig = DemoData.fxSignal(corridorId);

    // Signal banner
    var sigCard = el.querySelector('#fx-signal-card');
    if (sigCard) {
      sigCard.innerHTML =
        '<div class="fx-signal-row"><span class="signal signal-' + sig.level + '">' + sig.text + '</span></div>' +
        '<p class="fx-signal-reason">' + sig.reason + '</p>';
    }

    // KPIs
    var kpis = el.querySelector('#fx-kpis');
    if (kpis) {
      if (!series.length) {
        kpis.innerHTML = '';
      } else {
        var rates = series.map(function (p) { return p.rate; });
        var cur = rates[rates.length - 1];
        var ma = DemoData.movingAverage(series, 7);
        var avg7 = ma.length ? ma[ma.length - 1] : cur;
        var hi = Math.max.apply(null, rates);
        var lo = Math.min.apply(null, rates);
        var unit = c.toCur + ' per ' + c.fromCur;
        kpis.innerHTML =
          kpi('Current rate', DemoData.fmtRate(cur), unit) +
          kpi('7-day average', DemoData.fmtRate(avg7), unit) +
          kpi('90-day high', DemoData.fmtRate(hi), unit) +
          kpi('90-day low', DemoData.fmtRate(lo), unit);
      }
    }

    // Chart (guarded: KPIs + signal survive a canvas failure)
    try {
      drawChart(el, corridorId);
    } catch (err) {
      var card = el.querySelector('#fx-chart-card');
      if (card) card.style.display = 'none';
    }
  }

  function render(el) {
    if (typeof DemoData === 'undefined') {
      el.innerHTML = '<p class="muted">Data engine unavailable.</p>';
      return;
    }
    if (typeof el._cleanup === 'function') {
      try { el._cleanup(); } catch (e) { /* ignore */ }
    }

    var corridorId = DemoData.corridors[0].id;

    el.innerHTML =
      '<section class="section"><div class="wrap"><div class="fx-module">' +
        '<span class="badge-demo">DEMO DATA</span>' +
        '<h2 class="fx-title">FX Timing Advisor</h2>' +
        '<p class="section-sub">Ninety days of synthetic rate history per corridor, with a 7-day moving-average overlay and a plain-language timing signal. Higher rate = better for the recipient.</p>' +
        '<div class="toolbar fx-controls">' +
          '<div>' +
            '<label class="label" for="fx-corridor">Corridor</label>' +
            '<select class="select" id="fx-corridor">' + corridorOptions(corridorId) + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="card" id="fx-signal-card"></div>' +
        '<div class="kpis" id="fx-kpis"></div>' +
        '<div class="card fx-chart-card" id="fx-chart-card">' +
          '<h3>90-day rate history</h3>' +
          '<div class="fx-chart-wrap"><canvas id="fx-canvas" class="fx-canvas"></canvas></div>' +
          '<p class="muted small" id="fx-chart-note" style="display:none"></p>' +
        '</div>' +
        '<p class="muted small mt">Synthetic random-walk data, seeded for reproducibility. Not live market rates.</p>' +
      '</div></div></section>';

    var select = el.querySelector('#fx-corridor');

    function onChange() {
      corridorId = select.value;
      updateModule(el, corridorId);
    }
    select.addEventListener('change', onChange);
    updateModule(el, corridorId);

    var resizeTimer = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!el.isConnected) return; // router discarded el: guard detached canvas
        try { drawChart(el, corridorId); } catch (err) { /* keep prior frame */ }
      }, RESIZE_DEBOUNCE_MS);
    }
    window.addEventListener('resize', onResize);

    el._cleanup = function () {
      window.removeEventListener('resize', onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (select) select.removeEventListener('change', onChange);
    };
  }

  window.PM.fx = {
    nav: {
      label: 'FX Timing Advisor',
      blurb: '90-day rate intelligence with send-now / wait signals.'
    },
    render: render
  };
})();

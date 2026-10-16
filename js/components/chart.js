/* chart.js — dependency-free SVG line chart with moving-average overlay,
   hover tooltips, keyboard-focusable points summary, and text fallback. */
(function(global){
"use strict";

function lineChart(opts){
  // opts: { series:[{label, rate}], ma:[numbers], height, color, maColor, ariaLabel, yFmt }
  var W = 760, H = opts.height || 260, P = { l:56, r:14, t:14, b:30 };
  var s = opts.series, n = s.length;
  var min = Infinity, max = -Infinity, i;
  for (i = 0; i < n; i++){
    var r = s[i].rate;
    if (r < min) min = r; if (r > max) max = r;
    var m = opts.ma[i]; if (m < min) min = m; if (m > max) max = m;
  }
  var pad = (max - min) * 0.12 || max * 0.01 || 1;
  min -= pad; max += pad;
  var X = function(i){ return P.l + (i / (n - 1)) * (W - P.l - P.r); };
  var Y = function(v){ return P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b); };
  var yFmt = opts.yFmt || function(v){ return v.toFixed(4); };

  function path(vals){
    var d = "";
    for (var k = 0; k < vals.length; k++) d += (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(vals[k]).toFixed(1);
    return d;
  }
  var rates = s.map(function(p){ return p.rate; });

  var ticks = 4, grid = "";
  for (var t = 0; t <= ticks; t++){
    var v = min + (max - min) * t / ticks, y = Y(v);
    grid += '<line x1="'+P.l+'" y1="'+y.toFixed(1)+'" x2="'+(W-P.r)+'" y2="'+y.toFixed(1)+'" stroke="#E2E8F0" stroke-width="1"/>' +
      '<text x="'+(P.l-8)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="10" fill="#64748B">'+U.esc(yFmt(v))+'</text>';
  }
  var x0 = s[0].label, x1 = s[n-1].label;
  grid += '<text x="'+P.l+'" y="'+(H-8)+'" font-size="10" fill="#64748B">'+U.esc(x0)+'</text>' +
          '<text x="'+(W-P.r)+'" y="'+(H-8)+'" text-anchor="end" font-size="10" fill="#64748B">'+U.esc(x1)+'</text>';

  /* sparse hover targets (every 5th point) with <title> tooltips */
  var dots = "";
  for (var dI = 0; dI < n; dI += 5){
    dots += '<circle cx="'+X(dI).toFixed(1)+'" cy="'+Y(s[dI].rate).toFixed(1)+'" r="7" fill="transparent">' +
      '<title>'+U.esc(s[dI].label)+': '+U.esc(yFmt(s[dI].rate))+'</title></circle>';
  }

  var svg =
    '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+U.esc(opts.ariaLabel || "Line chart")+'">' +
    grid +
    '<path d="'+path(rates)+'" fill="none" stroke="'+(opts.color||"#0B8F86")+'" stroke-width="2.2"/>' +
    '<path d="'+path(opts.ma)+'" fill="none" stroke="'+(opts.maColor||"#B7791F")+'" stroke-width="1.6" stroke-dasharray="6 4"/>' +
    dots + '</svg>';

  /* Text summary for screen readers + no-JS-failure fallback */
  var first = s[0].rate, last = s[n-1].rate;
  var summary = '<p class="tiny muted" style="margin-top:8px">Series: ' + n + ' simulated daily points, ' +
    U.esc(x0) + ' → ' + U.esc(x1) + '. Range ' + U.esc(yFmt(min+pad)) + ' – ' + U.esc(yFmt(max-pad)) +
    '; latest ' + U.esc(yFmt(last)) + ' (' + (last >= first ? "+" : "") +
    ((last-first)/first*100).toFixed(2) + '% vs series start).</p>';

  return '<div style="position:relative">' + svg + '</div>' + summary;
}

global.Chart = { line: lineChart };
})(window);

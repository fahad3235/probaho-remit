/* admin-fx.js — inspect the seeded 90-day FX series per corridor,
   regenerate it deterministically from a chosen seed, or restore the
   original seed. No uncontrolled randomness: the same seed always
   produces the same series. */
(function(global){
"use strict";
var U = global.U;

function seedDefault(id){
  var seeds = global.SeedCorridors || [];
  for (var i = 0; i < seeds.length; i++) if (seeds[i].id === id) return seeds[i].fxSeed;
  return 0;
}

function render(){
  var A = global.AdminApp;
  var corridors = global.AdminConfig.effectiveCorridors();
  var canWrite = global.AuthService.canWrite("fx-data");

  var opts = corridors.map(function(c){
    return '<option value="' + U.esc(c.id) + '">' + U.esc(c.label) + ' (' + U.esc(c.sendCcy) + ' → ' + U.esc(c.receiveCcy) + ')</option>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Deterministic data.</b> Each series is generated from its seed — the same seed always ' +
    'yields the same 90 days. Nothing here is a market quote.</span></div>' +
    '<div class="card"><div class="card-head"><h2>FX dataset (' + corridors.length + ' global corridors)</h2></div>' +
    '<div class="grid g2">' +
      A.field("Corridor", '<select class="input" id="fxCorr">' + opts + '</select>') +
      A.field("Active seed", '<div class="mono" id="fxSeedNow" style="padding:10px 0"></div>',
        "Seed driving the series below.") +
    '</div>' +
    '<div id="fxSummary" style="margin-top:6px"></div>' +
    '<div id="fxMini" class="fx-mini" aria-hidden="true"></div>' +
    '</div>' +

    (canWrite ?
    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Regenerate / restore</h2></div>' +
      A.field("New seed", A.input("fxNewSeed", "", 'inputmode="numeric" placeholder="e.g. 90210"'),
        "Non-negative integer. Regenerating replaces the 90-day series for this corridor only.") +
      '<div class="save-bar">' +
        '<button class="btn btn-primary" data-act="regen">Regenerate from seed</button>' +
        '<button class="btn btn-ghost" data-act="restore">Restore original seed</button>' +
        '<span class="save-msg" role="status"></span></div>' +
    '</div>'
    : A.saveBar("fx-data"));

  var el = A.page("fx-data", "FX Data",
    "Inspect and reseed the synthetic 90-day FX series behind the FX Timing Advisor.",
    body);
  if (!el) return;

  var sel = U.$("#fxCorr", el);
  function paint(){
    var c = corridors.filter(function(x){ return x.id === sel.value; })[0] || corridors[0];
    var def = seedDefault(c.id);
    var k = global.FxEngine.kpis(c);
    var chg7 = typeof k.change7Pct === "number" ? k.change7Pct : (k.change7 || 0);
    var bestVal = typeof k.best90 === "number" ? k.best90 : (k.best || k.current);
    U.$("#fxSeedNow", el).textContent = String(c.fxSeed) +
      (c.fxSeed !== def ? "  (overridden — seeded default " + def + ")" : "  (seeded default)");
    U.$("#fxSummary", el).innerHTML =
      '<div class="kpi-row">' +
      A.kpi("Current rate", k.current.toFixed(5), c.receiveCcy + " per 1 " + c.sendCcy) +
      A.kpi("7-day change", (chg7 >= 0 ? "+" : "") + chg7.toFixed(2) + "%", "illustrative") +
      A.kpi("90-day best", bestVal.toFixed(5), "for the sender") +
      A.kpi("Points", String(k.series.length), "daily closes") +
      '</div>';
    /* Sparkline of the series. */
    var w = 560, h = 90, rates = k.series.map(function(p){ return p.rate; });
    var mn = Math.min.apply(null, rates), mx = Math.max.apply(null, rates), rg = (mx - mn) || 1;
    var pts = rates.map(function(r, i){
      return (i / (rates.length - 1) * w).toFixed(1) + "," + (h - 6 - ((r - mn) / rg) * (h - 12)).toFixed(1);
    }).join(" ");
    U.$("#fxMini", el).innerHTML =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto;display:block" role="img" ' +
      'aria-label="90-day synthetic rate series"><polyline points="' + pts +
      '" fill="none" stroke="var(--teal)" stroke-width="2"/></svg>';
  }
  sel.addEventListener("change", paint);
  paint();
  if (!canWrite) return;

  el.addEventListener("click", function(e){
    var act = e.target.closest("[data-act]");
    if (!act) return;
    var msg = U.$(".save-msg", el);
    var c = corridors.filter(function(x){ return x.id === sel.value; })[0] || corridors[0];
    var admin = global.AppState.get("admin");

    if (act.getAttribute("data-act") === "regen"){
      var raw = U.$("#fxNewSeed", el).value.trim();
      var n = Number(raw);
      if (!raw || !isFinite(n) || n < 0 || Math.round(n) !== n){
        msg.textContent = "Enter a non-negative integer seed.";
        msg.className = "save-msg err"; return;
      }
      admin.corridors = admin.corridors || {};
      var o = admin.corridors[c.id] || {};
      o.fxSeed = Math.round(n);
      admin.corridors[c.id] = o;
      global.AppState.set("admin", admin);
      global.AdminConfig.audit("fx.reseed", "corridor", c.id, "seed=" + Math.round(n));
      msg.textContent = "Series regenerated deterministically from seed " + Math.round(n) + ".";
      msg.className = "save-msg ok";
      global.Toast.show("FX series regenerated.");
      render();
    } else if (act.getAttribute("data-act") === "restore"){
      A.confirm("Restore the original seed?",
        "The corridor returns to its seeded FX series (" + seedDefault(c.id) + ").",
        "Restore", function(){
          admin.corridors = admin.corridors || {};
          var o = admin.corridors[c.id];
          if (o){ delete o.fxSeed; if (!Object.keys(o).length) delete admin.corridors[c.id]; }
          global.AppState.set("admin", admin);
          global.AdminConfig.audit("fx.restore-seed", "corridor", c.id, "ok");
          render();
          global.Toast.show("Original FX seed restored.");
        });
    }
  });
}

global.ModAdminFx = { render: render, meta:{ title:"Admin · FX Data", nav:null } };
})(window);

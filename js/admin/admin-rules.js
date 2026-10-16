/* admin-rules.js — ScamShield rule management.
   Weights are editable within 0–30; rules can be toggled. Every edit
   shows a live preview of both sample scores computed through the
   central RiskEngine before anything is saved. Scores stay clamped
   0–100 and severity bands unchanged. */
(function(global){
"use strict";

function sampleScores(weights, disabled){
  var scam = global.RiskEngine.analyze(global.RiskEngine.SAMPLE_SCAM, { weights:weights, disabled:disabled });
  var legit = global.RiskEngine.analyze(global.RiskEngine.SAMPLE_LEGIT, { weights:weights, disabled:disabled });
  return { scam: scam.score, legit: legit.score };
}

function render(){
  var A = global.AdminApp;
  var canWrite = global.AuthService.canWrite("scamshield-rules");
  var curW = global.AdminConfig.getRiskWeights();
  var curD = global.AdminConfig.getRiskDisabled();

  var rows = global.RiskEngine.RULES.map(function(r){
    var w = (typeof curW[r.id] === "number") ? curW[r.id] : r.weight;
    var dis = !!curD[r.id];
    var edited = (w !== r.weight || dis) ? ' <span class="tiny muted">(edited)</span>' : "";
    return '<tr>' +
      '<td class="mono"><b>' + U.esc(r.id) + '</b>' + edited + '</td>' +
      '<td><b>' + U.esc(r.label) + '</b><br><span class="tiny muted">' + U.esc(r.why) + '</span></td>' +
      '<td>' + (canWrite
          ? '<input class="input mono" style="width:76px" data-w="' + U.esc(r.id) + '" value="' + U.esc(String(w)) +
            '" inputmode="numeric" aria-label="Weight for ' + U.esc(r.id) + '">'
          : '<span class="mono">' + U.esc(String(w)) + '</span>') + '</td>' +
      '<td class="tiny muted mono">default ' + r.weight + '</td>' +
      '<td>' + (canWrite
          ? '<button class="btn btn-ghost btn-sm" data-toggle="' + U.esc(r.id) + '">' +
            (dis ? "Enable" : "Disable") + '</button>'
          : (dis ? '<span class="badge badge-warn">Disabled</span>' : '<span class="badge badge-ok">On</span>')) + '</td>' +
      '</tr>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Rule-based educational demonstration</b> — not a production fraud model. ' +
    'Edits change the demo\u2019s warning math only.</span></div>' +
    '<div class="card"><div class="card-head"><h2>Sample-score preview</h2>' +
    '<span class="tiny muted">recomputed live through the risk engine</span></div>' +
    '<div class="kpi-row" id="rulePreview"></div>' +
    '<p class="tiny muted" id="ruleWarn" style="margin-top:8px"></p></div>' +
    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>' +
    global.RiskEngine.RULES.length + ' risk rules</h2></div>' +
    '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th scope="col">Rule</th><th scope="col">Signal</th><th scope="col">Weight</th>' +
    '<th scope="col">Seed</th><th scope="col">Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
    (canWrite
      ? '<div class="save-bar">' +
        '<button class="btn btn-primary" data-act="save">Save rule changes</button>' +
        '<button class="btn btn-ghost" data-act="reset-defaults">Restore default rules</button>' +
        '<span class="save-msg" role="status"></span></div>'
      : A.saveBar("scamshield-rules"));

  var el = A.page("scamshield-rules", "ScamShield Rules",
    "Tune the demo's risk weights. The preview shows exactly how the two reference samples would score before you save.",
    body);
  if (!el) return;

  function draftState(){
    var w = {}, d = {};
    global.RiskEngine.RULES.forEach(function(r){
      var inp = U.$('[data-w="' + r.id + '"]', el);
      w[r.id] = inp ? Number(inp.value) : curW[r.id];
      d[r.id] = !!curD[r.id];
    });
    /* toggles applied immediately below mutate curD — re-read live */
    return { w:w, d:liveDisabled() };
  }
  function liveDisabled(){
    var d = {};
    global.RiskEngine.RULES.forEach(function(r){ d[r.id] = !!disabledNow[r.id]; });
    return d;
  }
  var disabledNow = {};
  global.RiskEngine.RULES.forEach(function(r){ disabledNow[r.id] = !!curD[r.id]; });

  function paintPreview(){
    var st = draftState();
    var bad = null;
    global.RiskEngine.RULES.forEach(function(r){
      var err = global.AdminValidation.weight(st.w[r.id]);
      if (err && !bad) bad = r.id + ": " + err;
    });
    var pv = U.$("#rulePreview", el), warn = U.$("#ruleWarn", el);
    if (bad){
      pv.innerHTML = A.kpi("Preview", "—", "fix invalid weights");
      warn.textContent = bad;
      return;
    }
    var s = sampleScores(st.w, st.d);
    pv.innerHTML =
      A.kpi("Synthetic scam sample", s.scam + " / 100", s.scam <= 15 ? "meets ≤ 15 reference (low safety)" : "ABOVE the 15 reference") +
      A.kpi("Legitimate sample", s.legit + " / 100", s.legit >= 90 ? "meets ≥ 90 reference (high safety)" : "BELOW the 90 reference");
    warn.textContent = (s.scam > 15 || s.legit < 90)
      ? "Warning: these weights move a reference sample outside its expected band. The public ScamShield page will show the new scores honestly — a high safety score is never proof of safety."
      : "Both reference samples stay inside their expected bands.";
  }
  paintPreview();

  if (!canWrite) return;

  el.addEventListener("input", function(e){
    if (e.target.hasAttribute("data-w")) paintPreview();
  });

  el.addEventListener("click", function(e){
    var tgl = e.target.closest("[data-toggle]");
    if (tgl){
      var id = tgl.getAttribute("data-toggle");
      disabledNow[id] = !disabledNow[id];
      var admin = global.AppState.get("admin");
      admin.riskDisabled = admin.riskDisabled || {};
      if (disabledNow[id]) admin.riskDisabled[id] = true; else delete admin.riskDisabled[id];
      global.AppState.set("admin", admin);
      global.AdminConfig.audit(disabledNow[id] ? "rule.disable" : "rule.enable", "rule", id, "ok");
      render();
      global.Toast.show("Rule " + (disabledNow[id] ? "disabled" : "enabled") + ".");
      return;
    }
    var act = e.target.closest("[data-act]");
    if (!act) return;
    var msg = U.$(".save-msg", el);
    if (act.getAttribute("data-act") === "save"){
      var st = draftState(), bad = null;
      global.RiskEngine.RULES.forEach(function(r){
        var err = global.AdminValidation.weight(st.w[r.id]);
        if (err && !bad) bad = r.id + ": " + err;
      });
      if (bad){ msg.textContent = bad; msg.className = "save-msg err"; return; }
      var admin = global.AppState.get("admin");
      var next = {};
      global.RiskEngine.RULES.forEach(function(r){
        var seedW = global.RiskEngine.RULES.filter(function(x){ return x.id === r.id; })[0].weight;
        if (st.w[r.id] !== seedW) next[r.id] = st.w[r.id];
      });
      admin.riskWeights = next;
      global.AppState.set("admin", admin);
      var s = sampleScores(st.w, st.d);
      global.AdminConfig.audit("rule.update-weights", "rule", "all",
        "ok scam-sample=" + s.scam + " legit-sample=" + s.legit);
      msg.textContent = "Saved. Scam sample now scores " + s.scam + ", legitimate sample " + s.legit + ".";
      msg.className = "save-msg ok";
      global.Toast.show("Risk weights saved.");
      render();
    } else if (act.getAttribute("data-act") === "reset-defaults"){
      A.confirm("Restore default rules?",
        "Clears all weight and enabled-state overrides. The synthetic scam sample returns to 96/100 and the legitimate sample to 0/100.",
        "Restore", function(){
          var admin = global.AppState.get("admin");
          admin.riskWeights = {}; admin.riskDisabled = {};
          global.AppState.set("admin", admin);
          global.AdminConfig.audit("rule.restore-defaults", "rule", "all", "ok");
          render();
          global.Toast.show("Risk rules restored to defaults.");
        });
    }
  });
}

global.ModAdminRules = { render: render, meta:{ title:"Admin · ScamShield Rules", nav:null } };
})(window);

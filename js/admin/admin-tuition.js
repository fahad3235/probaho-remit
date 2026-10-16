/* admin-tuition.js — manage the synthetic tuition demonstration
   defaults. Editing seeds changes what a planner RESET restores; it
   never silently overwrites the live planner. An explicit, confirmed
   "reset live planner" action exists separately. */
(function(global){
"use strict";

function render(){
  var A = global.AdminApp;
  var canWrite = global.AuthService.canWrite("tuition");
  var seeds = global.AdminConfig.getTuitionSeeds();
  var b = seeds.budget;

  var dlRows = seeds.deadlines.map(function(d, i){
    return '<tr><td><b>' + U.esc(d.title) + '</b><br><span class="tiny muted">' + U.esc(d.institution) + '</span></td>' +
      '<td class="num mono">' + U.esc(String(d.amount)) + ' ' + U.esc(d.ccy) + '</td>' +
      '<td class="mono">' + U.esc(d.due) + '</td>' +
      '<td class="row-actions">' + (canWrite
        ? '<button class="btn btn-ghost btn-sm" data-dl-edit="' + i + '">Edit</button>' +
          '<button class="btn btn-ghost btn-sm" data-dl-del="' + i + '">Remove</button>'
        : '<span class="tiny muted">read-only</span>') + '</td></tr>';
  }).join("");

  var ckRows = seeds.checklist.map(function(c, i){
    return '<tr><td><b>' + U.esc(c.label) + '</b><br><span class="tiny muted">' + U.esc(c.text) + '</span></td>' +
      '<td class="row-actions">' + (canWrite
        ? '<button class="btn btn-ghost btn-sm" data-ck-edit="' + i + '">Edit</button>'
        : '<span class="tiny muted">read-only</span>') + '</td></tr>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Seeds, not live data.</b> These defaults decide what the planner\u2019s <i>Reset</i> restores. ' +
    'The visitor\u2019s current planner is untouched until you explicitly reset it below.</span></div>' +

    '<div class="card"><div class="card-head"><h2>Budget defaults (BDT)</h2></div>' +
    '<div class="grid g2">' +
      A.field("Total budget", A.input("tb-budget", b.budgetBDT, 'inputmode="numeric"')) +
      A.field("Planned tuition", A.input("tb-tuition", b.plannedTuitionBDT, 'inputmode="numeric"')) +
      A.field("Planned fees", A.input("tb-fees", b.plannedFeesBDT, 'inputmode="numeric"')) +
      A.field("Already paid", A.input("tb-paid", b.paidBDT, 'inputmode="numeric"')) +
    '</div></div>' +

    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Example deadlines</h2>' +
      (canWrite ? '<button class="btn btn-secondary btn-sm" data-dl-add="1">Add deadline</button>' : '') + '</div>' +
    '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th scope="col">Deadline</th><th scope="col" class="num">Amount</th><th scope="col">Due</th><th scope="col">Actions</th>' +
    '</tr></thead><tbody>' + dlRows + '</tbody></table></div></div>' +

    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Document checklist labels</h2></div>' +
    '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th scope="col">Item</th><th scope="col">Actions</th>' +
    '</tr></thead><tbody>' + ckRows + '</tbody></table></div></div>' +

    (canWrite
      ? '<div class="save-bar">' +
        '<button class="btn btn-primary" data-act="save">Save seed defaults</button>' +
        '<button class="btn btn-ghost" data-act="reset-defaults">Restore seeded defaults</button>' +
        '<span class="save-msg" role="status"></span></div>' +
        '<div class="card danger-zone" style="margin-top:18px"><div class="card-head"><h2>Live planner</h2></div>' +
        '<p class="muted" style="margin-bottom:12px">Replace the visitor\u2019s current planner state with the seed ' +
        'defaults above. This is the only action here that touches live planner data — it asks first.</p>' +
        '<button class="btn btn-secondary" data-act="reset-live">Reset live planner to these seeds</button></div>'
      : A.saveBar("tuition"));

  var el = A.page("tuition", "Tuition Seeds",
    "Synthetic demonstration defaults for the Tuition Planner. Editing seeds never touches the live planner silently.",
    body);
  if (!el || !canWrite) return;

  el.addEventListener("click", function(e){
    var msg = U.$(".save-msg", el);
    var de = e.target.closest("[data-dl-edit],[data-dl-del],[data-dl-add]");
    if (de){
      if (de.hasAttribute("data-dl-add")) openDeadlineEditor(-1);
      else if (de.hasAttribute("data-dl-edit")) openDeadlineEditor(Number(de.getAttribute("data-dl-edit")));
      else {
        var idx = Number(de.getAttribute("data-dl-del"));
        A.confirm("Remove this seed deadline?",
          "It will no longer be restored by planner resets.",
          "Remove", function(){
            var s = getWorkingSeeds(el);
            s.deadlines.splice(idx, 1);
            saveSeeds(s, "tuition.deadline-remove", "deadline-" + idx);
            render();
          });
      }
      return;
    }
    var ce = e.target.closest("[data-ck-edit]");
    if (ce){ openChecklistEditor(Number(ce.getAttribute("data-ck-edit"))); return; }

    var act = e.target.closest("[data-act]");
    if (!act) return;
    var a = act.getAttribute("data-act");

    if (a === "save"){
      var s = getWorkingSeeds(el);
      var bad = validateSeeds(s);
      if (bad){ msg.textContent = bad; msg.className = "save-msg err"; return; }
      saveSeeds(s, "tuition.update-seeds", "seeds");
      msg.textContent = "Seed defaults saved. Planner resets will now restore these.";
      msg.className = "save-msg ok";
      global.Toast.show("Tuition seeds saved.");
      render();
    } else if (a === "reset-defaults"){
      A.confirm("Restore seeded tuition defaults?",
        "Clears every tuition seed override.",
        "Restore", function(){
          var admin = global.AppState.get("admin");
          admin.tuitionSeeds = null;
          global.AppState.set("admin", admin);
          global.AdminConfig.audit("tuition.restore-defaults", "tuition", "seeds", "ok");
          render();
          global.Toast.show("Tuition seeds restored.");
        });
    } else if (a === "reset-live"){
      A.confirm("Reset the live planner?",
        "The visitor\u2019s current deadlines, checklist and budget will be replaced with the seed defaults above. This cannot be undone.",
        "Reset planner", function(){
          global.AppState.set("tuition", (function(){
            var s = global.AdminConfig.getTuitionSeeds();
            return {
              deadlines: JSON.parse(JSON.stringify(s.deadlines)),
              checklist: s.checklist.map(function(c){ return { id:c.id, done:false }; }),
              budget: JSON.parse(JSON.stringify(s.budget))
            };
          })());
          global.AdminConfig.audit("tuition.reset-live", "tuition", "live-planner", "ok");
          global.Toast.show("Live planner reset to seed defaults.");
        });
    }
  });

  function openDeadlineEditor(idx){
    var s = getWorkingSeeds(el);
    var d = idx >= 0 ? s.deadlines[idx] : { id:"td-custom-" + Date.now(), title:"", institution:"", amount:"", ccy:"BDT", due:"2027-03-01", note:"", status:"upcoming" };
    var bh =
      A.field("Title", A.input("dl-title", d.title)) +
      A.field("Institution", A.input("dl-inst", d.institution)) +
      '<div class="grid g3">' +
      A.field("Amount", A.input("dl-amt", d.amount, 'inputmode="numeric"')) +
      A.field("Currency", A.input("dl-ccy", d.ccy, 'maxlength="3" style="text-transform:uppercase"')) +
      A.field("Due (YYYY-MM-DD)", A.input("dl-due", d.due, 'placeholder="2027-03-01"')) + '</div>' +
      A.field("Note", A.textarea("dl-note", d.note || "", 2)) +
      '<p class="field-err" id="dlErr" role="alert"></p>';
    var foot = document.createElement("div");
    var save = document.createElement("button");
    save.className = "btn btn-primary"; save.textContent = idx >= 0 ? "Save deadline" : "Add deadline";
    save.addEventListener("click", function(){
      var g = function(i){ return document.getElementById(i).value.trim(); };
      var nd = { id: d.id, title: g("dl-title"), institution: g("dl-inst"),
        amount: Number(g("dl-amt")), ccy: g("dl-ccy").toUpperCase(), due: g("dl-due"),
        note: g("dl-note"), status: "upcoming" };
      if (!nd.title){ document.getElementById("dlErr").textContent = "Title is required."; return; }
      if (!isFinite(nd.amount) || nd.amount <= 0){ document.getElementById("dlErr").textContent = "Amount must be positive."; return; }
      if (!/^[A-Z]{3}$/.test(nd.ccy)){ document.getElementById("dlErr").textContent = "Currency must be a 3-letter code."; return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nd.due)){ document.getElementById("dlErr").textContent = "Due date must be YYYY-MM-DD."; return; }
      if (idx >= 0) s.deadlines[idx] = nd; else s.deadlines.push(nd);
      persistDraftSeeds(s);
      saveSeeds(s, idx >= 0 ? "tuition.deadline-edit" : "tuition.deadline-add", nd.id);
      global.Modal.close();
      render();
    });
    foot.appendChild(save);
    global.Modal.open({ title: idx >= 0 ? "Edit seed deadline" : "Add seed deadline", body: bh, footer: foot });
  }

  function openChecklistEditor(idx){
    var s = getWorkingSeeds(el);
    var c = s.checklist[idx];
    var bh = A.field("Label", '<input class="input" id="ck-label" value="' + U.esc(c.label) + '">') +
             A.field("Help text", '<textarea class="input" id="ck-text" rows="2">' + U.esc(c.text) + '</textarea>') +
             '<p class="field-err" id="ckErr" role="alert"></p>';
    var foot = document.createElement("div");
    var save = document.createElement("button");
    save.className = "btn btn-primary"; save.textContent = "Save item";
    save.addEventListener("click", function(){
      var label = document.getElementById("ck-label").value.trim();
      var text = document.getElementById("ck-text").value.trim();
      if (!label){ document.getElementById("ckErr").textContent = "Label is required."; return; }
      s.checklist[idx] = { id: c.id, label: label, text: text };
      persistDraftSeeds(s);
      saveSeeds(s, "tuition.checklist-edit", c.id);
      global.Modal.close();
      render();
    });
    foot.appendChild(save);
    global.Modal.open({ title:"Edit checklist item", body: bh, footer: foot });
  }

  /* Reads the current form values plus any modal-persisted structural edits. */
  function getWorkingSeeds(root){
    var draft = root._seedDraft || global.AdminConfig.getTuitionSeeds();
    var g = function(id){ var n = U.$("#" + id, root); return n ? Number(n.value) : 0; };
    draft = JSON.parse(JSON.stringify(draft));
    draft.budget = { budgetBDT: g("tb-budget"), plannedTuitionBDT: g("tb-tuition"),
      plannedFeesBDT: g("tb-fees"), paidBDT: g("tb-paid") };
    return draft;
  }
  function persistDraftSeeds(s){ el._seedDraft = JSON.parse(JSON.stringify(s)); }
  function validateSeeds(s){
    var vals = [s.budget.budgetBDT, s.budget.plannedTuitionBDT, s.budget.plannedFeesBDT, s.budget.paidBDT];
    if (vals.some(function(v){ return !isFinite(v) || v < 0; })) return "Budget figures must be non-negative numbers.";
    return null;
  }
  function saveSeeds(s, action, target){
    var admin = global.AppState.get("admin");
    admin.tuitionSeeds = { deadlines: s.deadlines, checklist: s.checklist, budget: s.budget };
    global.AppState.set("admin", admin);
    global.AdminConfig.audit(action, "tuition", target, "ok");
  }
}

global.ModAdminTuition = { render: render, meta:{ title:"Admin · Tuition Seeds", nav:null } };
})(window);

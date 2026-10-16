/* admin-corridors.js — Corridor Management Console (ModAdminCorridors).
   Supports editing seeded corridors, enabling/disabling corridors, adding new custom corridors,
   and restoring defaults with full high-contrast Dark Admin UI. */
(function(global){
"use strict";
var U = global.U;

function render(){
  var A = global.AdminApp;
  var list = global.AdminConfig.effectiveCorridors();
  var canWrite = global.AuthService.canWrite("corridors");
  var over = (global.AppState.get("admin") || {}).corridors || {};
  var enabledCount = list.filter(function(c){ return c.enabled !== false; }).length;

  var rows = list.map(function(c){
    var edited = over[c.id] ? ' <span class="badge badge-blue" style="margin-left:4px;">overridden</span>' : "";
    var isCustom = c.custom ? ' <span class="badge badge-purple" style="margin-left:4px;">custom</span>' : "";
    return '<tr>' +
      '<td>' +
        '<div style="font-weight:800;color:#f8fafc;">' + U.esc((c.flagFrom || "🌐") + " → " + (c.flagTo || "🌐") + " " + c.label) + edited + isCustom + '</div>' +
        '<span class="tiny muted mono">' + U.esc(c.id) + ' · ' + U.esc(c.blurb || "") + '</span>' +
      '</td>' +
      '<td><span class="badge badge-blue">' + U.esc(c.sendCcy) + '</span> → <span class="badge badge-ok">' + U.esc(c.receiveCcy) + '</span></td>' +
      '<td class="mono" style="font-weight:800;color:#60a5fa;">1 ' + U.esc(c.sendCcy) + ' = ' + Number(c.midRate).toFixed(4) + ' ' + U.esc(c.receiveCcy) + '</td>' +
      '<td class="mono">' + U.esc(String(c.fxSeed)) + '</td>' +
      '<td>' + (c.enabled !== false
          ? '<span class="badge badge-ok">Enabled</span>'
          : '<span class="badge badge-warn">Disabled</span>') + '</td>' +
      '<td class="row-actions">' + (canWrite
        ? '<button class="btn btn-secondary btn-sm" data-edit="' + U.esc(c.id) + '">Edit</button>' +
          '<button class="btn btn-ghost btn-sm" data-toggle="' + U.esc(c.id) + '">' +
            (c.enabled !== false ? "Disable" : "Enable") + '</button>'
        : '<span class="tiny muted">read-only</span>') + '</td>' +
    '</tr>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Live Corridor Control.</b> Changes to reference mid-rates, FX seeds, or enabled status flow immediately into the Corridor Optimizer, Send Money, FX Advisor, and Tuition Planner.</span></div>' +

    '<div class="kpi-row" style="margin-bottom:16px;">' +
      A.kpi("Total Corridors", String(list.length), "Global & regional routes") +
      A.kpi("Active Corridors", enabledCount + " / " + list.length, "Live in public calculators") +
      A.kpi("Active Overrides", String(Object.keys(over).length), "Stored in local state") +
      A.kpi("Supported Rails", "Bank · Mobile · Web3", "bKash, Nagad, Alipay, SWIFT, USDT") +
    '</div>' +

    '<div class="card">' +
      '<div class="card-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h2>Configured Corridors (' + list.length + ')</h2>' +
          '<p class="muted small" style="margin:2px 0 0;">Manage send/receive currency pairs, synthetic reference rates, and 90-day FX seeds.</p>' +
        '</div>' +
        (canWrite ? '<button class="btn btn-primary btn-sm" id="btnAddCorridor">+ Add Custom Corridor</button>' : '') +
      '</div>' +
      '<div class="table-wrap"><table class="data">' +
        '<thead><tr>' +
          '<th scope="col">Corridor</th>' +
          '<th scope="col">Pair</th>' +
          '<th scope="col">Mid-Market Rate</th>' +
          '<th scope="col">FX Seed</th>' +
          '<th scope="col">Status</th>' +
          '<th scope="col">Actions</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</div>' +
    (canWrite
      ? '<div class="save-bar">' +
          '<button class="btn btn-ghost" data-act="reset-defaults">Restore seeded corridors</button>' +
          '<span class="save-msg" role="status"></span>' +
        '</div>'
      : A.saveBar("corridors"));

  var el = A.page("corridors", "Corridors",
    "Enable, disable, add, or tune cross-border remittance & tuition corridors.",
    body);
  if (!el || !canWrite) return;

  var addBtn = U.$("#btnAddCorridor", el);
  if (addBtn){
    addBtn.addEventListener("click", function(){ openAddModal(); });
  }

  el.addEventListener("click", function(e){
    var t = e.target.closest("[data-edit],[data-toggle],[data-act]");
    if (!t) return;
    if (t.hasAttribute("data-edit")){
      openEditModal(t.getAttribute("data-edit"));
      return;
    }
    if (t.hasAttribute("data-toggle")){
      var id = t.getAttribute("data-toggle");
      var cur = global.AdminConfig.effectiveCorridors().filter(function(x){ return x.id === id; })[0];
      if (!cur) return;
      var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
      admin.corridors = admin.corridors || {};
      admin.corridors[id] = Object.assign({}, admin.corridors[id] || {}, { enabled: !(cur.enabled !== false) });
      global.AppState.set("admin", admin);
      global.AdminConfig.audit("corridor.toggle", "corridor", id, "ok");
      global.Toast.show("Corridor status updated.", "ok");
      render();
      return;
    }
    if (t.getAttribute("data-act") === "reset-defaults"){
      A.confirm("Restore seeded corridors?",
        "All corridor rate overrides and custom corridors will be reset to the factory seed dataset.",
        "Restore", function(){
          var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
          admin.corridors = {};
          admin.customCorridors = [];
          global.AppState.set("admin", admin);
          global.AdminConfig.audit("corridor.restore-defaults", "corridors", "*", "ok");
          global.Toast.show("Seeded corridors restored.", "ok");
          render();
        });
    }
  });
}

function openEditModal(id){
  var c = global.AdminConfig.effectiveCorridors().filter(function(x){ return x.id === id; })[0];
  if (!c) return;
  var bodyHtml =
    '<p class="muted">Editing corridor <code>' + U.esc(c.id) + '</code>.</p>' +
    '<div class="field"><label class="f" for="coLabel">Display label</label>' +
      '<div class="inp"><input id="coLabel" class="input" maxlength="60" value="' + U.esc(c.label) + '"></div>' +
      '<p class="field-err" id="coErr"></p>' +
    '</div>' +
    '<div class="grid g2">' +
      '<div class="field"><label class="f" for="coSend">Send currency (ISO 3)</label>' +
        '<div class="inp"><input id="coSend" class="input" maxlength="3" value="' + U.esc(c.sendCcy) + '"></div></div>' +
      '<div class="field"><label class="f" for="coRecv">Receive currency (ISO 3)</label>' +
        '<div class="inp"><input id="coRecv" class="input" maxlength="3" value="' + U.esc(c.receiveCcy) + '"></div></div>' +
    '</div>' +
    '<div class="grid g2">' +
      '<div class="field"><label class="f" for="coRate">Reference mid-rate</label>' +
        '<div class="inp"><input id="coRate" class="input" inputmode="decimal" value="' + U.esc(String(c.midRate)) + '"></div></div>' +
      '<div class="field"><label class="f" for="coSeed">90-day FX seed</label>' +
        '<div class="inp"><input id="coSeed" class="input" inputmode="numeric" value="' + U.esc(String(c.fxSeed)) + '"></div></div>' +
    '</div>' +
    '<div class="field"><label class="f" for="coBlurb">Corridor description / note</label>' +
      '<div class="inp"><input id="coBlurb" class="input" maxlength="120" value="' + U.esc(c.blurb || "") + '"></div>' +
    '</div>';

  var foot = document.createElement("div");
  var cancel = document.createElement("button");
  cancel.className = "btn btn-secondary"; cancel.textContent = "Cancel";
  cancel.setAttribute("data-close", "1");
  var save = document.createElement("button");
  save.className = "btn btn-primary"; save.textContent = "Save changes";
  foot.appendChild(cancel); foot.appendChild(save);

  save.addEventListener("click", function(){
    var vals = {
      label: document.getElementById("coLabel").value.trim(),
      sendCcy: document.getElementById("coSend").value.trim().toUpperCase(),
      receiveCcy: document.getElementById("coRecv").value.trim().toUpperCase(),
      midRate: document.getElementById("coRate").value.trim(),
      fxSeed: document.getElementById("coSeed").value.trim(),
      blurb: document.getElementById("coBlurb").value.trim()
    };
    var errs = global.AdminValidation.corridor(vals);
    var errEl = document.getElementById("coErr");
    if (errs.length){ errEl.textContent = errs[0]; errEl.classList.add("show"); return; }

    var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
    admin.corridors = admin.corridors || {};
    admin.corridors[id] = Object.assign({}, admin.corridors[id] || {}, {
      label: vals.label,
      sendCcy: vals.sendCcy,
      receiveCcy: vals.receiveCcy,
      midRate: Number(vals.midRate),
      fxSeed: Math.round(Number(vals.fxSeed)),
      blurb: vals.blurb
    });
    global.AppState.set("admin", admin);
    global.AdminConfig.audit("corridor.edit", "corridor", id, "rate=" + vals.midRate);
    global.Modal.close();
    global.Toast.show("Corridor updated.", "ok");
    render();
  });

  global.Modal.open({ title: "Edit Corridor · " + c.label, body: bodyHtml, footer: foot });
}

function openAddModal(){
  var bodyHtml =
    '<p class="muted">Create a new cross-border corridor for Compare, Send Money, and FX Advisor.</p>' +
    '<div class="field"><label class="f" for="newCoLabel">Corridor display name</label>' +
      '<div class="inp"><input id="newCoLabel" class="input" maxlength="60" placeholder="e.g. Japan → Bangladesh" value="Japan → Bangladesh"></div>' +
      '<p class="field-err" id="newCoErr"></p>' +
    '</div>' +
    '<div class="grid g2">' +
      '<div class="field"><label class="f" for="newCoSend">Send currency (ISO 3)</label>' +
        '<div class="inp"><input id="newCoSend" class="input" maxlength="3" value="JPY"></div></div>' +
      '<div class="field"><label class="f" for="newCoRecv">Receive currency (ISO 3)</label>' +
        '<div class="inp"><input id="newCoRecv" class="input" maxlength="3" value="BDT"></div></div>' +
    '</div>' +
    '<div class="grid g2">' +
      '<div class="field"><label class="f" for="newCoRate">Reference mid-rate</label>' +
        '<div class="inp"><input id="newCoRate" class="input" inputmode="decimal" value="0.7850"></div></div>' +
      '<div class="field"><label class="f" for="newCoSeed">90-day FX seed</label>' +
        '<div class="inp"><input id="newCoSeed" class="input" inputmode="numeric" value="7788"></div></div>' +
    '</div>' +
    '<div class="field"><label class="f" for="newCoBlurb">Description / settlement notes</label>' +
      '<div class="inp"><input id="newCoBlurb" class="input" maxlength="120" value="Tokyo to Dhaka bank & bKash instant settlement corridor."></div>' +
    '</div>';

  var foot = document.createElement("div");
  var cancel = document.createElement("button");
  cancel.className = "btn btn-secondary"; cancel.textContent = "Cancel";
  cancel.setAttribute("data-close", "1");
  var save = document.createElement("button");
  save.className = "btn btn-primary"; save.textContent = "Create Corridor";
  foot.appendChild(cancel); foot.appendChild(save);

  save.addEventListener("click", function(){
    var vals = {
      label: document.getElementById("newCoLabel").value.trim(),
      sendCcy: document.getElementById("newCoSend").value.trim().toUpperCase(),
      receiveCcy: document.getElementById("newCoRecv").value.trim().toUpperCase(),
      midRate: document.getElementById("newCoRate").value.trim(),
      fxSeed: document.getElementById("newCoSeed").value.trim(),
      blurb: document.getElementById("newCoBlurb").value.trim()
    };
    var errs = global.AdminValidation.corridor(vals);
    var errEl = document.getElementById("newCoErr");
    if (errs.length){ errEl.textContent = errs[0]; errEl.classList.add("show"); return; }

    var id = (vals.sendCcy + "-" + vals.receiveCcy).toLowerCase() + "-" + Date.now().toString(36).slice(-3);
    var newCor = {
      id: id,
      code: vals.sendCcy + "-" + vals.receiveCcy,
      region: "Global",
      flagFrom: "🌐",
      flagTo: "🇧🇩",
      label: vals.label,
      from: vals.sendCcy,
      to: vals.receiveCcy,
      sendCcy: vals.sendCcy,
      sendSym: vals.sendCcy + " ",
      receiveCcy: vals.receiveCcy,
      receiveSym: vals.receiveCcy + " ",
      midRate: Number(vals.midRate),
      defaultSend: 500,
      minAmount: 10,
      maxAmount: 100000,
      payoutMethods: ["bkash", "nagad", "bank"],
      fxSeed: Math.round(Number(vals.fxSeed)),
      blurb: vals.blurb,
      enabled: true,
      custom: true
    };
    var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
    admin.customCorridors = Array.isArray(admin.customCorridors) ? admin.customCorridors : [];
    admin.customCorridors.push(newCor);
    global.AppState.set("admin", admin);
    global.AdminConfig.audit("corridor.create", "corridor", id, vals.label);
    global.Modal.close();
    global.Toast.show("Created corridor " + vals.label, "ok");
    render();
  });

  global.Modal.open({ title: "Add Custom Corridor", body: bodyHtml, footer: foot });
}

global.ModAdminCorridors = { render: render, meta:{ title:"Admin · Corridors", nav:null } };
})(window);

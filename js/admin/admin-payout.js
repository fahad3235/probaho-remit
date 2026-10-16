/* admin-payout.js — manage illustrative payout methods per corridor.
   Edits flow into the public Send flow through the shared override layer. */
(function(global){
"use strict";
var U = global.U;

function corridorLabel(id){
  var list = global.AdminConfig.effectiveCorridors();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
  return id;
}

function trustDots(t){
  var out = "";
  for (var i = 1; i <= 5; i++) out += '<span class="tdot' + (i <= t ? " on" : "") + '"></span>';
  return '<span class="tdots" aria-label="Trust ' + t + ' of 5">' + out + '</span>';
}

function render(){
  var A = global.AdminApp;
  var list = global.AdminConfig.effectivePayoutRoutes();
  var canWrite = global.AuthService.canWrite("payout-routes");

  var groups = {};
  list.forEach(function(r){ (groups[r.corridorId] = groups[r.corridorId] || []).push(r); });

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Illustrative payout options.</b> Edits appear in the public Send flow — the same ' +
    'demo data the customer sees.</span></div>' +
    Object.keys(groups).map(function(cid){
      var rows = groups[cid].map(function(r){
        var edited = (global.AppState.get("admin").payoutRoutes || {})[r.id]
          ? ' <span class="tiny muted">(edited)</span>' : "";
        return '<tr>' +
          '<td><b>' + U.esc(r.name) + '</b>' + edited + '<br><span class="tiny muted">' + U.esc(r.kind) + '</span></td>' +
          '<td>' + U.esc(r.hours) + '</td>' +
          '<td>' + trustDots(r.trust) + '</td>' +
          '<td>' + (r.enabled !== false
              ? '<span class="badge badge-ok">Enabled</span>'
              : '<span class="badge badge-warn">Disabled</span>') + '</td>' +
          '<td class="row-actions">' + (canWrite
            ? '<button class="btn btn-ghost btn-sm" data-edit="' + U.esc(r.id) + '">Edit</button>' +
              '<button class="btn btn-ghost btn-sm" data-toggle="' + U.esc(r.id) + '">' +
              (r.enabled !== false ? "Disable" : "Enable") + '</button>'
            : '<span class="tiny muted">read-only</span>') + '</td></tr>';
      }).join("");
      return '<div class="card" style="margin-bottom:18px"><div class="card-head"><h2>' +
        U.esc(corridorLabel(cid)) + '</h2><span class="badge badge-demo">' + groups[cid].length + ' routes</span></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr>' +
        '<th scope="col">Method</th><th scope="col">Timing</th><th scope="col">Trust</th>' +
        '<th scope="col">Status</th><th scope="col">Actions</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join("") +
    (canWrite
      ? '<div class="save-bar"><button class="btn btn-ghost" data-act="reset-defaults">Restore seeded payout routes</button>' +
        '<span class="save-msg" role="status"></span></div>'
      : A.saveBar("payout-routes"));

  var el = A.page("payout-routes", "Payout Routes",
    "Illustrative payout methods per corridor. Disabling a method removes it from the public Send flow.",
    body);
  if (!el || !canWrite) return;

  el.addEventListener("click", function(e){
    var t = e.target.closest("[data-edit],[data-toggle],[data-act]");
    if (!t) return;
    if (t.hasAttribute("data-edit")){ openEditor(t.getAttribute("data-edit")); return; }
    if (t.hasAttribute("data-toggle")){
      var id = t.getAttribute("data-toggle");
      var cur = global.AdminConfig.effectivePayoutRoutes().filter(function(r){ return r.id === id; })[0];
      global.AdminConfig.setPayoutRouteOverride(id, { enabled: !(cur && cur.enabled !== false) });
      global.AdminConfig.audit("payout-route.toggle", "payout-route", id, "ok");
      global.Toast.show("Payout route updated.", "ok");
      render(); return;
    }
    if (t.getAttribute("data-act") === "reset-defaults"){
      var admin = JSON.parse(JSON.stringify(global.AppState.get("admin")));
      admin.payoutRoutes = {};
      global.AppState.set("admin", admin);
      global.AdminConfig.audit("payout-route.restore-defaults", "payout-routes", "*", "ok");
      global.Toast.show("Seeded payout routes restored.", "ok");
      render();
    }
  });
}

function openEditor(id){
  var r = global.AdminConfig.effectivePayoutRoutes().filter(function(x){ return x.id === id; })[0];
  if (!r) return;
  var bodyHtml =
    '<p class="muted">Editing <b>' + U.esc(r.name) + '</b> on ' + U.esc(corridorLabel(r.corridorId)) + '.</p>' +
    '<div class="field"><label class="f" for="prName">Method name</label>' +
    '<div class="inp"><input id="prName" maxlength="40" value="' + U.esc(r.name) + '"></div><p class="field-err" id="prErr"></p></div>' +
    '<div class="grid g2">' +
    '<div class="field"><label class="f" for="prHours">Delivery timing</label>' +
    '<div class="inp"><input id="prHours" maxlength="40" value="' + U.esc(r.hours) + '"></div></div>' +
    '<div class="field"><label class="f" for="prTrust">Illustrative trust (1–5)</label>' +
    '<div class="inp"><input id="prTrust" inputmode="numeric" value="' + U.esc(String(r.trust)) + '"></div></div>' +
    '</div>' +
    '<div class="field"><label class="f" for="prNote">Note shown to customers</label>' +
    '<div class="inp"><textarea id="prNote" rows="2" maxlength="160">' + U.esc(r.note || "") + '</textarea></div></div>';
  var foot = document.createElement("div");
  var cancel = document.createElement("button");
  cancel.className = "btn btn-secondary"; cancel.textContent = "Cancel";
  cancel.setAttribute("data-close", "1");
  var save = document.createElement("button");
  save.className = "btn btn-primary"; save.textContent = "Save changes";
  foot.appendChild(cancel); foot.appendChild(save);
  save.addEventListener("click", function(){
    var vals = { name: document.getElementById("prName").value.trim(),
                 hours: document.getElementById("prHours").value.trim(),
                 trust: document.getElementById("prTrust").value.trim(),
                 note: document.getElementById("prNote").value.trim() };
    var errs = global.AdminValidation.payoutRoute(vals);
    var errEl = document.getElementById("prErr");
    if (errs.length){ errEl.textContent = errs[0]; errEl.classList.add("show"); return; }
    global.AdminConfig.setPayoutRouteOverride(id, { name: vals.name, hours: vals.hours,
      trust: Number(vals.trust), note: vals.note });
    global.AdminConfig.audit("payout-route.edit", "payout-route", id, "ok");
    global.Modal.close();
    global.Toast.show("Payout route saved.", "ok");
    render();
  });
  global.Modal.open({ title: "Edit payout route", body: bodyHtml, footer: foot });
}

global.ModAdminPayout = { render: render };
})(window);

/* admin-providers.js — Remittance & Settlement Provider Console (ModAdminProviders).
   Supports editing fee/spread models, enabling/disabling providers, adding new custom providers,
   and restoring defaults with full high-contrast Dark Admin UI. */
(function(global){
"use strict";
var U = global.U;

function render(){
  var A = global.AdminApp;
  var list = global.AdminConfig.effectiveProviders();
  var canWrite = global.AuthService.canWrite("providers");
  var over = (global.AppState.get("admin") || {}).providers || {};
  var enabledCount = list.filter(function(p){ return p.enabled !== false; }).length;

  var rows = list.map(function(p){
    var edited = over[p.id] ? ' <span class="badge badge-blue" style="margin-left:4px;">overridden</span>' : "";
    var isCustom = p.custom ? ' <span class="badge badge-purple" style="margin-left:4px;">custom</span>' : "";
    var badgePill = p.badge ? ' <span class="badge badge-ok" style="margin-left:4px;">' + U.esc(p.badge) + '</span>' : "";
    return '<tr>' +
      '<td>' +
        '<div style="font-weight:800;color:#f8fafc;">' + U.esc(p.name) + badgePill + edited + isCustom + '</div>' +
        '<span class="tiny muted">' + U.esc(p.note || "") + '</span>' +
      '</td>' +
      '<td class="mono" style="color:#93c5fd;font-weight:700;">$' + Number(p.flatFee).toFixed(2) + '</td>' +
      '<td class="mono" style="color:#4ade80;font-weight:700;">' + Number(p.pctFee).toFixed(2) + '%</td>' +
      '<td class="mono" style="color:#fbbf24;font-weight:700;">' + Number(p.spreadPct).toFixed(2) + '%</td>' +
      '<td>' + U.esc(p.delivery) + '</td>' +
      '<td>' + (p.enabled !== false
          ? '<span class="badge badge-ok">Enabled</span>'
          : '<span class="badge badge-warn">Disabled</span>') + '</td>' +
      '<td class="row-actions">' + (canWrite
        ? '<button class="btn btn-secondary btn-sm" data-edit="' + U.esc(p.id) + '">Edit</button>' +
          '<button class="btn btn-ghost btn-sm" data-toggle="' + U.esc(p.id) + '">' +
            (p.enabled !== false ? "Disable" : "Enable") + '</button>'
        : '<span class="tiny muted">read-only</span>') + '</td>' +
    '</tr>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Canonical Fee &amp; Spread Model.</b> Every provider quote in the Corridor Optimizer and Send Money flow uses <code>FinancialEngine.canonicalQuote</code> with the parameters configured here.</span></div>' +

    '<div class="kpi-row" style="margin-bottom:16px;">' +
      A.kpi("Total Providers", String(list.length), "Bank, Mobile & Web3 rails") +
      A.kpi("Active in Quotes", enabledCount + " / " + list.length, "Included in live comparisons") +
      A.kpi("Lowest Flat Fee", "$" + Math.min.apply(null, list.map(function(x){ return Number(x.flatFee)||0; })).toFixed(2), "Across active providers") +
      A.kpi("Tightest FX Spread", Math.min.apply(null, list.map(function(x){ return Number(x.spreadPct)||0; })).toFixed(2) + "%", "Mid-market benchmark") +
    '</div>' +

    '<div class="card">' +
      '<div class="card-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h2>Configured Providers (' + list.length + ')</h2>' +
          '<p class="muted small" style="margin:2px 0 0;">Adjust flat fees, percentage fees, FX spreads, delivery speed, and promotional badges.</p>' +
        '</div>' +
        (canWrite ? '<button class="btn btn-primary btn-sm" id="btnAddProvider">+ Add New Provider</button>' : '') +
      '</div>' +
      '<div class="table-wrap"><table class="data">' +
        '<thead><tr>' +
          '<th scope="col">Provider</th>' +
          '<th scope="col">Flat Fee</th>' +
          '<th scope="col">Pct Fee</th>' +
          '<th scope="col">FX Spread</th>' +
          '<th scope="col">Delivery</th>' +
          '<th scope="col">Status</th>' +
          '<th scope="col">Actions</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</div>' +
    (canWrite
      ? '<div class="save-bar">' +
          '<button class="btn btn-ghost" data-act="reset-defaults">Restore seeded providers</button>' +
          '<span class="save-msg" role="status"></span>' +
        '</div>'
      : A.saveBar("providers"));

  var el = A.page("providers", "Providers",
    "Tune remittance provider pricing, FX spreads, delivery SLAs, and active status.",
    body);
  if (!el || !canWrite) return;

  var addBtn = U.$("#btnAddProvider", el);
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
      var cur = global.AdminConfig.effectiveProviders().filter(function(x){ return x.id === id; })[0];
      if (!cur) return;
      var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
      admin.providers = admin.providers || {};
      admin.providers[id] = Object.assign({}, admin.providers[id] || {}, { enabled: !(cur.enabled !== false) });
      global.AppState.set("admin", admin);
      global.AdminConfig.audit("provider.toggle", "provider", id, "ok");
      global.Toast.show("Provider status updated.", "ok");
      render();
      return;
    }
    if (t.getAttribute("data-act") === "reset-defaults"){
      A.confirm("Restore seeded providers?",
        "All provider fee/spread overrides and custom providers will be reset to the factory seed dataset.",
        "Restore", function(){
          var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
          admin.providers = {};
          admin.customProviders = [];
          global.AppState.set("admin", admin);
          global.AdminConfig.audit("provider.restore-defaults", "providers", "*", "ok");
          global.Toast.show("Seeded providers restored.", "ok");
          render();
        });
    }
  });
}

function openEditModal(id){
  var p = global.AdminConfig.effectiveProviders().filter(function(x){ return x.id === id; })[0];
  if (!p) return;
  var bodyHtml =
    '<p class="muted">Editing pricing model for <b>' + U.esc(p.name) + '</b>.</p>' +
    '<div class="grid g2">' +
      '<div class="field"><label class="f" for="pvName">Provider name</label>' +
        '<div class="inp"><input id="pvName" class="input" maxlength="40" value="' + U.esc(p.name) + '"></div></div>' +
      '<div class="field"><label class="f" for="pvBadge">Badge (optional)</label>' +
        '<div class="inp"><input id="pvBadge" class="input" maxlength="24" value="' + U.esc(p.badge || "") + '" placeholder="e.g. Best Value, Fastest"></div></div>' +
    '</div>' +
    '<p class="field-err" id="pvErr"></p>' +
    '<div class="grid g3">' +
      '<div class="field"><label class="f" for="pvFlat">Flat fee ($)</label>' +
        '<div class="inp"><input id="pvFlat" class="input" inputmode="decimal" value="' + U.esc(String(p.flatFee)) + '"></div></div>' +
      '<div class="field"><label class="f" for="pvPct">Percent fee (%)</label>' +
        '<div class="inp"><input id="pvPct" class="input" inputmode="decimal" value="' + U.esc(String(p.pctFee)) + '"></div></div>' +
      '<div class="field"><label class="f" for="pvSpread">FX Spread (%)</label>' +
        '<div class="inp"><input id="pvSpread" class="input" inputmode="decimal" value="' + U.esc(String(p.spreadPct)) + '"></div></div>' +
    '</div>' +
    '<div class="field"><label class="f" for="pvDeliv">Delivery speed</label>' +
      '<div class="inp"><input id="pvDeliv" class="input" maxlength="40" value="' + U.esc(p.delivery) + '"></div></div>' +
    '<div class="field"><label class="f" for="pvNote">Customer note</label>' +
      '<div class="inp"><input id="pvNote" class="input" maxlength="140" value="' + U.esc(p.note || "") + '"></div></div>';

  var foot = document.createElement("div");
  var cancel = document.createElement("button");
  cancel.className = "btn btn-secondary"; cancel.textContent = "Cancel";
  cancel.setAttribute("data-close", "1");
  var save = document.createElement("button");
  save.className = "btn btn-primary"; save.textContent = "Save changes";
  foot.appendChild(cancel); foot.appendChild(save);

  save.addEventListener("click", function(){
    var vals = {
      name: document.getElementById("pvName").value.trim(),
      badge: document.getElementById("pvBadge").value.trim(),
      flatFee: document.getElementById("pvFlat").value.trim(),
      pctFee: document.getElementById("pvPct").value.trim(),
      spreadPct: document.getElementById("pvSpread").value.trim(),
      delivery: document.getElementById("pvDeliv").value.trim(),
      note: document.getElementById("pvNote").value.trim()
    };
    var errs = global.AdminValidation.provider(vals);
    var errEl = document.getElementById("pvErr");
    if (errs.length){ errEl.textContent = errs[0]; errEl.classList.add("show"); return; }

    var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
    admin.providers = admin.providers || {};
    admin.providers[id] = Object.assign({}, admin.providers[id] || {}, {
      name: vals.name,
      badge: vals.badge,
      flatFee: Number(vals.flatFee),
      pctFee: Number(vals.pctFee),
      spreadPct: Number(vals.spreadPct),
      delivery: vals.delivery,
      note: vals.note
    });
    global.AppState.set("admin", admin);
    global.AdminConfig.audit("provider.edit", "provider", id, "flat=" + vals.flatFee + ",spread=" + vals.spreadPct);
    global.Modal.close();
    global.Toast.show("Provider updated.", "ok");
    render();
  });

  global.Modal.open({ title: "Edit Provider · " + p.name, body: bodyHtml, footer: foot });
}

function openAddModal(){
  var bodyHtml =
    '<p class="muted">Add a new settlement provider to the Corridor Optimizer and Send Money quote engine.</p>' +
    '<div class="grid g2">' +
      '<div class="field"><label class="f" for="newPvName">Provider name</label>' +
        '<div class="inp"><input id="newPvName" class="input" maxlength="40" value="Probaho Web3 / Alipay Bridge"></div></div>' +
      '<div class="field"><label class="f" for="newPvBadge">Badge (optional)</label>' +
        '<div class="inp"><input id="newPvBadge" class="input" maxlength="24" value="Web3 & Alipay"></div></div>' +
    '</div>' +
    '<p class="field-err" id="newPvErr"></p>' +
    '<div class="grid g3">' +
      '<div class="field"><label class="f" for="newPvFlat">Flat fee ($)</label>' +
        '<div class="inp"><input id="newPvFlat" class="input" inputmode="decimal" value="1.50"></div></div>' +
      '<div class="field"><label class="f" for="newPvPct">Percent fee (%)</label>' +
        '<div class="inp"><input id="newPvPct" class="input" inputmode="decimal" value="0.15"></div></div>' +
      '<div class="field"><label class="f" for="newPvSpread">FX Spread (%)</label>' +
        '<div class="inp"><input id="newPvSpread" class="input" inputmode="decimal" value="0.05"></div></div>' +
    '</div>' +
    '<div class="field"><label class="f" for="newPvDeliv">Delivery speed</label>' +
      '<div class="inp"><input id="newPvDeliv" class="input" maxlength="40" value="Instant (2 mins)"></div></div>' +
    '<div class="field"><label class="f" for="newPvNote">Customer note</label>' +
      '<div class="inp"><input id="newPvNote" class="input" maxlength="140" value="Instant USDT TRC20, Alipay, WeChat Pay & bKash multi-rail settlement."></div></div>';

  var foot = document.createElement("div");
  var cancel = document.createElement("button");
  cancel.className = "btn btn-secondary"; cancel.textContent = "Cancel";
  cancel.setAttribute("data-close", "1");
  var save = document.createElement("button");
  save.className = "btn btn-primary"; save.textContent = "Create Provider";
  foot.appendChild(cancel); foot.appendChild(save);

  save.addEventListener("click", function(){
    var vals = {
      name: document.getElementById("newPvName").value.trim(),
      badge: document.getElementById("newPvBadge").value.trim(),
      flatFee: document.getElementById("newPvFlat").value.trim(),
      pctFee: document.getElementById("newPvPct").value.trim(),
      spreadPct: document.getElementById("newPvSpread").value.trim(),
      delivery: document.getElementById("newPvDeliv").value.trim(),
      note: document.getElementById("newPvNote").value.trim()
    };
    var errs = global.AdminValidation.provider(vals);
    var errEl = document.getElementById("newPvErr");
    if (errs.length){ errEl.textContent = errs[0]; errEl.classList.add("show"); return; }

    var id = vals.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36).slice(-3);
    var newProv = {
      id: id,
      name: vals.name,
      badge: vals.badge,
      flatFee: Number(vals.flatFee),
      pctFee: Number(vals.pctFee),
      spreadPct: Number(vals.spreadPct),
      delivery: vals.delivery,
      note: vals.note,
      enabled: true,
      custom: true
    };
    var admin = JSON.parse(JSON.stringify(global.AppState.get("admin") || {}));
    admin.customProviders = Array.isArray(admin.customProviders) ? admin.customProviders : [];
    admin.customProviders.push(newProv);
    global.AppState.set("admin", admin);
    global.AdminConfig.audit("provider.create", "provider", id, vals.name);
    global.Modal.close();
    global.Toast.show("Added provider " + vals.name, "ok");
    render();
  });

  global.Modal.open({ title: "Add New Provider", body: bodyHtml, footer: foot });
}

global.ModAdminProviders = { render: render, meta:{ title:"Admin · Providers", nav:null } };
})(window);

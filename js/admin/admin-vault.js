/* admin-vault.js — review the synthetic ledger and simulated drafts.
   Read, filter, open receipts, and reset demo records. There is no
   "execute payment" or "settle" action anywhere: this console cannot
   move money, and it must never imply that it can. */
(function(global){
"use strict";

function allRecords(){
  var out = (global.SeedLedger || []).map(function(e){
    return { ref:e.ref, date:e.date, corridorId:e.corridorId, provider:e.providerId,
      send:e.send, sendCcy:e.sendCcy, receive:e.receive, receiveCcy:e.receiveCcy,
      status:e.status, kind:"seed" };
  });
  (global.AppState.get("drafts") || []).forEach(function(d){
    out.unshift({ ref:d.ref, date:d.createdISO.slice(0, 10), corridorId:d.corridorId,
      provider:d.providerName, send:d.principalMinor / 100, sendCcy:d.sendCcy,
      receive:d.receiveMinor / 100, receiveCcy:d.receiveCcy, status:"draft", kind:"draft" });
  });
  return out;
}

function render(){
  var A = global.AdminApp;
  var canWrite = global.AuthService.canWrite("vault");
  var recs = allRecords();
  var drafts = recs.filter(function(r){ return r.kind === "draft"; }).length;

  var rows = recs.map(function(r){
    return '<tr>' +
      '<td class="mono"><b>' + U.esc(r.ref) + '</b></td>' +
      '<td class="mono">' + U.esc(r.date) + '</td>' +
      '<td>' + U.esc(r.corridorId) + '</td>' +
      '<td>' + U.esc(r.provider) + '</td>' +
      '<td class="num mono">' + U.esc(r.sendCcy) + ' ' + U.esc(String(r.send)) + '</td>' +
      '<td class="num mono">' + U.esc(r.receiveCcy) + ' ' + U.esc(String(r.receive)) + '</td>' +
      '<td><span class="badge ' + (r.status === "draft" ? "badge-warn" : "badge-ok") + '">' +
        U.esc(r.status) + ' (simulated)</span></td>' +
      '<td class="tiny muted">' + r.kind + '</td></tr>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Simulated records only.</b> Every row is synthetic. This console can inspect and ' +
    'reset demo records — it cannot execute, settle or reverse a real transfer, because none exists.</span></div>' +
    '<div class="kpi-row">' +
      A.kpi("Total records", String(recs.length), "seeded + drafts") +
      A.kpi("Simulated drafts", String(drafts), "created on the public site") +
      A.kpi("Seeded records", String(recs.length - drafts), "synthetic history") +
    '</div>' +
    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Demo ledger</h2>' +
    '<button class="btn btn-secondary btn-sm" data-act="export-csv">Export CSV</button></div>' +
    '<div class="field" style="max-width:340px"><label for="vaSearch">Filter</label>' +
    '<input class="input mono" id="vaSearch" placeholder="Filter by reference, provider, corridor\u2026"></div>' +
    '<div class="table-wrap"><table class="data" id="vaTable"><thead><tr>' +
    '<th scope="col">Reference</th><th scope="col">Date</th><th scope="col">Corridor</th>' +
    '<th scope="col">Provider</th><th scope="col" class="num">Sent</th><th scope="col" class="num">Received</th>' +
    '<th scope="col">Status</th><th scope="col">Kind</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
    (canWrite
      ? '<div class="card danger-zone" style="margin-top:18px"><div class="card-head"><h2>Reset demo records</h2></div>' +
        '<p class="muted" style="margin-bottom:12px">Clears all simulated drafts created on the public site. ' +
        'Seeded records are fixed demo history and stay. This deletes local demo rows only — ' +
        'there is no real transaction to reverse.</p>' +
        '<button class="btn btn-secondary" data-act="reset-drafts">Clear simulated drafts</button></div>'
      : A.saveBar("vault"));

  var el = A.page("vault", "Vault",
    "Inspect the synthetic ledger and simulated drafts. Read-only for your role unless you are the demo owner.",
    body);
  if (!el) return;

  var q = U.$("#vaSearch", el);
  if (q) q.addEventListener("input", function(){
    var needle = q.value.trim().toLowerCase();
    U.$$("#vaTable tbody tr", el).forEach(function(tr){
      tr.style.display = !needle || tr.textContent.toLowerCase().indexOf(needle) >= 0 ? "" : "none";
    });
  });

  el.addEventListener("click", function(e){
    var act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.getAttribute("data-act") === "export-csv"){
      var needle = (q && q.value) ? q.value.trim().toLowerCase() : "";
      exportCsv(needle);
      return;
    }
    if (act.getAttribute("data-act") === "reset-drafts"){
      if (!canWrite){
        global.Toast.show("Your role is read-only for this action.", "warn");
        return;
      }
      A.confirm("Clear all simulated drafts?",
        "Drafts created on the public site will be removed from this browser\u2019s demo data. Seeded records stay.",
        "Clear drafts", function(){
          global.AppState.set("drafts", []);
          global.AppState.set("draftSeq", 0);
          global.AdminConfig.audit("vault.clear-drafts", "vault", "drafts", "ok");
          global.Toast.show("Simulated drafts cleared.");
          render();
        });
    }
  });
}

function csvCell(v){
  var s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function exportCsv(needle){
  var recs = allRecords();
  if (needle){
    recs = recs.filter(function(r){
      var str = (r.ref + " " + r.date + " " + r.corridorId + " " + r.provider + " " + r.sendCcy + " " + r.status + " " + r.kind).toLowerCase();
      return str.indexOf(needle) >= 0;
    });
  }
  var lines = ["ref,date,corridor,provider,sent,send_ccy,received,receive_ccy,status,kind,demo"];
  recs.forEach(function(r){
    lines.push([r.ref, r.date, r.corridorId, r.provider, r.send, r.sendCcy,
      r.receive, r.receiveCcy, r.status, r.kind, "synthetic-demo"].map(csvCell).join(","));
  });
  var blob = new Blob([lines.join("\n")], { type: "text/csv" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "probaho-remit-demo-ledger.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  global.AdminConfig.audit("vault.export-csv", "vault", recs.length + " rows", "ok");
  global.Toast.show("Demo ledger exported (" + recs.length + " rows).", "ok");
}

global.ModAdminVault = { render: render, meta:{ title:"Admin · Vault", nav:null } };
})(window);

/* admin-reports.js — two local demo queues: ScamShield session scans
   (metadata only) and support tickets from the Help page. */
(function(global){
"use strict";
var U = global.U;
var TAB = "scans";

function sevPill(s){
  var cls = s === "CRITICAL" ? "badge-crit" : s === "HIGH" ? "badge-warn" : s === "MEDIUM" ? "badge-demo" : "badge-ok";
  return '<span class="badge ' + cls + '">' + U.esc(s) + '</span>';
}

function scansTable(){
  var scans = (global.AppState.get("scamScans") || []).slice().reverse();
  if (!scans.length) return '<div class="empty">' + U.icon("shield", 40) +
    '<p>No ScamShield checks this session. Run one on the public ScamShield page.</p></div>';
  var rows = scans.map(function(s){
    return '<tr><td class="mono">' + U.esc(s.at.slice(11, 19)) + '</td>' +
      '<td class="num"><b>' + s.score + ' / 100</b></td>' +
      '<td>' + sevPill(s.severity) + '</td>' +
      '<td class="mono">' + (s.rules.length ? s.rules.map(U.esc).join(", ") : "—") + '</td></tr>';
  }).join("");
  return '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th scope="col">Time</th><th scope="col">Score</th><th scope="col">Severity</th>' +
    '<th scope="col">Rules fired</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="hint">Message text is never stored — only scores, severities and rule ids.</p>';
}

function ticketsTable(canWrite){
  var tickets = global.AppState.get("tickets") || [];
  if (!tickets.length) return '<div class="empty">' + U.icon("chat", 40) +
    '<p>No support tickets yet. Submit one from the public Help page.</p></div>';
  var rows = tickets.map(function(t){
    return '<tr>' +
      '<td><span class="mono">' + U.esc(t.id) + '</span><div class="tiny muted">' + U.esc(t.ts.slice(0, 16).replace("T", " ")) + '</div></td>' +
      '<td><b>' + U.esc(t.subject) + '</b><div class="tiny muted">' + U.esc(t.name || "") + '</div>' +
      '<div class="tiny" style="margin-top:6px;max-width:44ch">' + U.esc(t.message) + '</div></td>' +
      '<td>' + (t.status === "open" ? '<span class="badge badge-demo">Open</span>' : '<span class="badge badge-ok">Resolved</span>') + '</td>' +
      '<td class="row-actions">' + (canWrite
        ? '<button class="btn btn-ghost btn-sm" data-ticket="' + U.esc(t.id) + '">' +
          (t.status === "open" ? "Mark resolved" : "Reopen") + '</button>'
        : '<span class="tiny muted">read-only</span>') + '</td></tr>';
  }).join("");
  return '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th scope="col">Ticket</th><th scope="col">Subject &amp; message</th>' +
    '<th scope="col">Status</th><th scope="col">Actions</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function render(){
  var A = global.AdminApp;
  var canWrite = global.AuthService.canWrite("reports");
  var nScans = (global.AppState.get("scamScans") || []).length;
  var nTickets = (global.AppState.get("tickets") || []).filter(function(t){ return t.status === "open"; }).length;

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Local demo queues.</b> Scans show scores and rule ids only — never message text. ' +
    'Tickets are stored in this browser.</span></div>' +
    '<div class="seg" id="repTabs" style="max-width:440px;margin-bottom:18px">' +
    '<button type="button" data-tab="scans" aria-pressed="' + (TAB === "scans") + '">ScamShield scans (' + nScans + ')</button>' +
    '<button type="button" data-tab="tickets" aria-pressed="' + (TAB === "tickets") + '">Support tickets (' + nTickets + ' open)</button>' +
    '</div>' +
    '<div class="card"><div class="card-head"><h2>' +
    (TAB === "scans" ? "Session scans" : "Support tickets") + '</h2></div>' +
    '<div id="repBody">' + (TAB === "scans" ? scansTable() : ticketsTable(canWrite)) + '</div></div>';

  var el = A.page("reports", "Reports",
    "ScamShield assessments from this session and support tickets from the Help page — all local demo data.",
    body);
  if (!el) return;

  U.$("#repTabs", el).addEventListener("click", function(e){
    var b = e.target.closest("[data-tab]"); if (!b) return;
    TAB = b.getAttribute("data-tab"); render();
  });
  if (!canWrite) return;
  el.addEventListener("click", function(e){
    var b = e.target.closest("[data-ticket]"); if (!b) return;
    var id = b.getAttribute("data-ticket");
    var tickets = global.AppState.get("tickets").slice();
    for (var i = 0; i < tickets.length; i++){
      if (tickets[i].id === id){
        tickets[i] = Object.assign({}, tickets[i],
          { status: tickets[i].status === "open" ? "resolved" : "open" });
      }
    }
    global.AppState.set("tickets", tickets);
    global.AdminConfig.audit("ticket.status", "ticket", id, "ok");
    global.Toast.show("Ticket updated.", "ok");
    render();
  });
}

global.ModAdminReports = { render: render };
})(window);

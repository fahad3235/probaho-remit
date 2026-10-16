/* admin-audit.js — Audit Logs matching Screen 12 in reference images + live session audit events. */
(function(global){
"use strict";
var U = global.U;

function render(){
  var A = global.AdminApp;
  var live = (global.AppState && global.AppState.get("audit")) || [];
  var seeds = (global.SeedAuditLogs || []).map(function(s){
    return {
      ts: s.time,
      actor: s.user,
      action: s.action,
      targetType: "system",
      targetId: s.ip,
      result: s.status || "Success",
      demo: true
    };
  });
  var allLogs = live.concat(seeds);

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Local demo audit log.</b> Every administrative change in this session is recorded below alongside seeded security telemetry. Passwords and secrets are never logged.</span></div>' +
    '<div class="admin-dark-card"><div class="table-wrap">' +
      '<table class="clean-table data" id="auTable">' +
        '<thead>' +
          '<tr>' +
            '<th>Time</th>' +
            '<th>User / Actor</th>' +
            '<th>Action</th>' +
            '<th>Target / IP</th>' +
            '<th>Mode</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          allLogs.map(function(lg){
            var timeStr = String(lg.ts || lg.time || "").replace("T", " ").slice(0, 19);
            return '<tr>' +
              '<td style="color:#94a3b8;font-size:12.5px;" class="mono">' + U.esc(timeStr) + '</td>' +
              '<td><b style="color:#fff;">' + U.esc(lg.actor || lg.user) + '</b></td>' +
              '<td><span style="color:#38bdf8;font-weight:600;">' + U.esc(lg.action) + '</span></td>' +
              '<td style="font-family:monospace;color:#94a3b8;">' + U.esc((lg.targetType ? lg.targetType + ":" : "") + (lg.targetId || lg.ip || "")) + '</td>' +
              '<td><span class="badge badge-demo">DEMO · ' + U.esc(lg.result || "ok") + '</span></td>' +
            '</tr>';
          }).join("") +
        '</tbody>' +
      '</table></div>' +
    '</div>';

  A.page("audit", "Audit Logs", "Track all system activities and security events across the platform.", body);
}

global.ModAdminAudit = { render: render, meta:{ title:"Audit Logs", nav:null } };
})(window);

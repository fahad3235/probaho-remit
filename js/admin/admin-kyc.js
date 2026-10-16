/* admin-kyc.js — KYC Queue matching Screen 11 in reference images + full AdminConfig integration. */
(function(global){
"use strict";
var U = global.U;

function render(){
  var A = global.AdminApp;
  var queue = (global.AdminConfig && global.AdminConfig.effectiveKyc)
    ? global.AdminConfig.effectiveKyc()
    : (global.SeedKyc || []);
  var canWrite = !global.AuthService || global.AuthService.canWrite("kyc");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>SIMULATED identity reviews.</b> Synthetic applicants only — approving or rejecting here ' +
    'updates the browser override state and local audit log.</span></div>' +

    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
      '<div class="dash-search-box" style="background:#0f1a2e;border-color:rgba(255,255,255,0.12);width:min(340px,100%);flex:1 1 240px;">' +
        '<span>🔍</span>' +
        '<input type="text" id="kycSearchInput" placeholder="Search by applicant name, country, or ID..." style="color:#fff;">' +
      '</div>' +
    '</div>' +

    '<div class="admin-dark-card"><div class="table-wrap">' +
      '<table class="clean-table" id="kycQueueTable">' +
        '<thead>' +
          '<tr>' +
            '<th>User</th>' +
            '<th>Country</th>' +
            '<th>Document Type</th>' +
            '<th>Status</th>' +
            '<th>Submitted</th>' +
            '<th style="text-align:right;">Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          queue.map(function(k){
            var stBadge = k.status === "approved"
              ? '<span style="background:rgba(22,163,74,0.2);color:#4ade80;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">Approved</span>'
              : k.status === "rejected"
              ? '<span style="background:rgba(220,38,38,0.2);color:#f87171;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">Rejected</span>'
              : k.status === "under-review"
              ? '<span style="background:rgba(6,182,212,0.2);color:#38bdf8;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">Under Review</span>'
              : '<span style="background:rgba(234,88,12,0.2);color:#fb923c;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">Pending</span>';

            return '<tr>' +
              '<td><b style="color:#fff;font-size:14px;">' + U.esc(k.name) + '</b><div class="tiny muted mono">' + U.esc(k.id) + '</div></td>' +
              '<td><span style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:11.5px;font-weight:700;">' + U.esc(k.country) + '</span></td>' +
              '<td>' + U.esc(k.docType || (k.docs && k.docs[0]) || "Passport") + '</td>' +
              '<td>' + stBadge + '</td>' +
              '<td style="color:#94a3b8;font-size:12px;">' + U.esc(k.submitted) + '</td>' +
              '<td style="text-align:right;display:flex;gap:6px;justify-content:flex-end;">' +
                (canWrite && k.status !== "approved"
                  ? '<button class="btn btn-sm btn-secondary" data-approve="' + U.esc(k.id) + '" style="border-radius:8px;padding:4px 10px;font-size:11.5px;color:#4ade80;border-color:rgba(74,222,128,0.3);background:rgba(22,163,74,0.12);">Approve</button>'
                  : '') +
                '<button class="btn btn-sm btn-primary" data-review-kyc="' + U.esc(k.id) + '" style="border-radius:8px;padding:4px 12px;font-size:12px;">' +
                  (k.status === "approved" ? "View" : "Review") +
                '</button>' +
              '</td>' +
            '</tr>';
          }).join("") +
        '</tbody>' +
      '</table></div>' +
    '</div>';

  var el = A.page("kyc", "KYC Queue", "Review and verify user identity documents (SIMULATED identity reviews).", body);
  if (!el) return;

  var sInp = U.$("#kycSearchInput", el);
  if (sInp){
    sInp.addEventListener("input", function(){
      var q = sInp.value.trim().toLowerCase();
      U.$$("#kycQueueTable tbody tr", el).forEach(function(tr){
        tr.style.display = (!q || tr.textContent.toLowerCase().indexOf(q) >= 0) ? "" : "none";
      });
    });
  }

  /* Quick Approve buttons */
  U.$$("#view [data-approve]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-approve");
      var k = queue.filter(function(x){ return x.id === id; })[0];
      if (!k || !canWrite) return;
      if (global.AdminConfig && global.AdminConfig.setKycDecision){
        global.AdminConfig.setKycDecision(k.id, "approved", "Approved via quick review");
        global.AdminConfig.audit("kyc.approve", "kyc", k.id, "ok");
      }
      global.Toast.show(k.name + " approved.", "ok");
      render();
    });
  });

  /* Detailed Review Modal */
  U.$$("#view [data-review-kyc]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-review-kyc");
      var k = queue.filter(function(x){ return x.id === id; })[0];
      if (k){
        global.Modal.open({
          title: "KYC Verification · " + k.name,
          body: '<div style="display:grid;gap:12px;">' +
            '<div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">' +
              '<span style="font-size:32px;">🪪</span>' +
              '<b style="display:block;margin-top:6px;font-size:15px;color:#0f172a;">' + U.esc(k.docType || "Passport") + ' (' + U.esc(k.countryName || k.country) + ')</b>' +
              '<span style="font-size:12px;color:#64748b;">Document Photo Verification Preview (Simulated)</span>' +
            '</div>' +
            '<p style="font-size:13px;color:#334155;line-height:1.5;">' + U.esc(k.note || "") + '</p>' +
            '<div class="field">' +
              '<label style="color:#0f172a;">Review Decision Note</label>' +
              '<input class="input" id="adminKycNote" value="Identity and institutional verification confirmed.">' +
            '</div>' +
            (canWrite ?
              '<div style="display:flex;gap:10px;margin-top:8px;">' +
                '<button type="button" class="btn btn-sm btn-secondary" id="btnRejectKyc" style="color:#dc2626;border-color:#fca5a5;">Reject Document</button>' +
              '</div>' : '') +
          '</div>',
          okLabel: canWrite ? "Approve Applicant" : "Close",
          onOk: function(){
            if (!canWrite) return;
            var noteInp = document.getElementById("adminKycNote");
            var reason = noteInp ? noteInp.value : "Approved in demo review.";
            if (global.AdminConfig && global.AdminConfig.setKycDecision){
              global.AdminConfig.setKycDecision(k.id, "approved", reason);
              global.AdminConfig.audit("kyc.approve", "kyc", k.id, "ok");
            }
            global.Toast.show(k.name + " approved successfully!", "ok");
            render();
          }
        });

        var rejBtn = document.getElementById("btnRejectKyc");
        if (rejBtn){
          rejBtn.addEventListener("click", function(){
            var noteInp = document.getElementById("adminKycNote");
            var reason = noteInp ? noteInp.value : "Document rejected.";
            if (global.AdminConfig && global.AdminConfig.setKycDecision){
              global.AdminConfig.setKycDecision(k.id, "rejected", reason);
              global.AdminConfig.audit("kyc.reject", "kyc", k.id, "ok");
            }
            global.Toast.show(k.name + " rejected.", "warn");
            global.Modal.close();
            render();
          });
        }
      }
    });
  });
}

global.ModAdminKyc = { render: render, meta:{ title:"KYC Queue", nav:null } };
})(window);

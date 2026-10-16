/* transactions.js — Transactions Page matching Image 1 Screen 4.
   Fixed 8-column alignment (ID, User, Type, Sent, Received, Status, Date, Action),
   live user transfers + SeedLedger, search/filter, CSV export, and printable receipt modal. */
(function(global){
"use strict";
var U = global.U;

function getCombinedTransactions(){
  var seeds = (global.SeedLedger || []).slice();
  var userTx = (global.AppState && global.AppState.get("transfers")) || [];
  var mappedUser = userTx.map(function(t){
    return {
      ref: t.psp_reference || (t.id ? t.id.slice(0, 10) : "TX-DEMO"),
      user: t.recipient_name || "Beneficiary",
      userEmail: (t.payout_method || "wallet").toUpperCase() + (t.account_number ? " · " + t.account_number : ""),
      type: "Transfer",
      avatar: U.avatarSvg ? U.avatarSvg(t.recipient_name || "U") : "",
      date: t.created_at ? t.created_at.slice(0, 16).replace("T", " ") : "Oct 13, 2026",
      corridorId: t.corridor || "US-BD",
      send: Number(t.send_amount || 0),
      sendCcy: t.send_currency || "USD",
      flatFee: Number(t.fee_amount || 0),
      pctFee: 0,
      rate: Number(t.fx_rate || 119.50),
      receive: Number(t.receive_amount || 0),
      receiveCcy: t.receive_currency || "BDT",
      status: t.status === "paid_out" ? "Completed" : "Pending"
    };
  });
  return mappedUser.concat(seeds);
}

function render(typeFilter, statusFilter){
  var el = U.$("#view");
  if (!el) return;
  var allTxns = getCombinedTransactions();
  var selType = typeFilter || "all";
  var selStatus = statusFilter || "all";

  var filtered = allTxns.filter(function(t){
    if (selType !== "all" && t.type !== selType) return false;
    if (selStatus !== "all" && t.status !== selStatus) return false;
    return true;
  });

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      '<div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">' +
        '<div>' +
          '<p class="eyebrow">Global Financial Operations</p>' +
          '<h1 class="page-title">Transactions Ledger</h1>' +
          '<p class="page-sub">View, filter, and export all global transactions, settlements, and university tuition payouts.</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button type="button" class="btn btn-secondary" id="txnExportBtn" style="border-radius:10px;padding:10px 18px;font-weight:700;">' +
            '📥 Export CSV' +
          '</button>' +
          '<button type="button" class="btn btn-primary" id="txnNewBtn" style="border-radius:10px;padding:10px 20px;font-weight:700;">' +
            '+ New Transaction' +
          '</button>' +
        '</div>' +
      '</div>' +

      /* Filter Toolbar Card */
      '<div class="card" style="border-radius:20px;padding:24px;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;align-items:center;margin-bottom:20px;">' +
          '<div class="dash-search-box" style="width:100%;">' +
            '<span>🔍</span>' +
            '<input type="text" id="txnSearchInput" placeholder="Search by reference, name, currency...">' +
          '</div>' +
          '<select class="input" id="txnTypeSelect">' +
            '<option value="all">All Types</option>' +
            '<option value="Transfer">Transfer</option>' +
            '<option value="Deposit">Deposit</option>' +
            '<option value="Withdrawal">Withdrawal</option>' +
            '<option value="Payment">Payment</option>' +
          '</select>' +
          '<select class="input" id="txnStatusSelect">' +
            '<option value="all">All Status</option>' +
            '<option value="Completed">Completed</option>' +
            '<option value="Pending">Pending</option>' +
          '</select>' +
          '<div style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;padding:10px 12px;border-radius:10px;font-size:12.5px;color:#334155;">' +
            '<span>📅</span>' +
            '<b>Oct 6, 2026 – Oct 14, 2026</b>' +
          '</div>' +
        '</div>' +

        /* Transactions Table (All 8 columns strictly aligned!) */
        '<div style="overflow-x:auto;">' +
          '<table class="clean-table">' +
            '<thead>' +
              '<tr>' +
                '<th>ID</th>' +
                '<th>User / Recipient</th>' +
                '<th>Type</th>' +
                '<th>Sent</th>' +
                '<th>Received</th>' +
                '<th>Status</th>' +
                '<th>Date</th>' +
                '<th style="text-align:right;">Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              filtered.map(function(t){
                var stClass = t.status === "Completed" ? "status-completed" : "status-pending";
                var sym = U.ccySym ? U.ccySym(t.sendCcy) : (t.sendCcy + " ");
                var recvCcy = t.receiveCcy || "BDT";
                var recvSym = U.ccySym ? U.ccySym(recvCcy) : "৳";
                var fallbackAv = U.avatarSvg ? U.avatarSvg(t.user) : "";
                return '<tr style="cursor:pointer;" data-txn-ref="' + U.esc(t.ref) + '">' +
                  '<td style="font-weight:800;font-family:monospace;color:#0D9F9A;">' + U.esc(t.ref) + '</td>' +
                  '<td>' +
                    '<div style="display:flex;align-items:center;gap:10px;">' +
                      '<img src="' + U.esc(t.avatar || fallbackAv) + '" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover;" onerror="this.src=\'' + fallbackAv + '\'">' +
                      '<div>' +
                        '<b style="font-size:13.5px;color:#0f172a;display:block;">' + U.esc(t.user) + '</b>' +
                        '<small style="font-size:11px;color:#64748b;">' + U.esc(t.userEmail || "") + '</small>' +
                      '</div>' +
                    '</div>' +
                  '</td>' +
                  '<td><span class="badge badge-neutral" style="font-size:11px;">' + U.esc(t.type || "Transfer") + '</span></td>' +
                  '<td style="font-weight:800;font-size:13.5px;">' + sym + U.money(t.send, "", 2) + ' ' + U.esc(t.sendCcy) + '</td>' +
                  '<td style="font-weight:800;font-size:13.5px;color:#059669;">' + recvSym + U.money(t.receive, "", 2) + ' ' + U.esc(recvCcy) + '</td>' +
                  '<td><span class="badge-status ' + stClass + '">' + U.esc(t.status) + '</span></td>' +
                  '<td style="color:#64748b;font-size:12px;">' + U.esc(t.date) + '</td>' +
                  '<td style="text-align:right;">' +
                    '<button type="button" class="btn btn-sm btn-ghost" data-view-receipt="' + U.esc(t.ref) + '" style="font-size:12px;padding:4px 8px;">Receipt 🧾</button>' +
                  '</td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +

        /* Pagination */
        '<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:22px;padding-top:16px;border-top:1px solid #f1f5f9;">' +
          '<span style="font-size:12px;color:#64748b;margin-right:auto;">Showing ' + filtered.length + ' of ' + allTxns.length + ' transactions</span>' +
          '<button type="button" class="btn btn-sm btn-primary" style="border-radius:8px;padding:4px 10px;">1</button>' +
        '</div>' +
      '</div>' +

    '</div>';

  /* Event Listeners */
  var typeSel = U.$("#txnTypeSelect", el);
  var statusSel = U.$("#txnStatusSelect", el);
  var searchInp = U.$("#txnSearchInput", el);

  if (typeSel && statusSel){
    typeSel.value = selType;
    statusSel.value = selStatus;
    typeSel.addEventListener("change", function(){ render(typeSel.value, statusSel.value); });
    statusSel.addEventListener("change", function(){ render(typeSel.value, statusSel.value); });
  }

  if (searchInp){
    searchInp.addEventListener("input", U.debounce(function(){
      var q = searchInp.value.trim().toLowerCase();
      U.$$("#view table tbody tr").forEach(function(row){
        var text = row.textContent.toLowerCase();
        row.style.display = (!q || text.indexOf(q) >= 0) ? "" : "none";
      });
    }, 200));
  }

  /* Receipt modals */
  U.$$("#view [data-txn-ref]").forEach(function(tr){
    tr.addEventListener("click", function(){
      var ref = tr.getAttribute("data-txn-ref");
      var t = allTxns.find(function(x){ return x.ref === ref; });
      if (!t) return;
      var totalFee = ((t.flatFee || 0) + (t.send * (t.pctFee || 0) / 100)).toFixed(2);
      var sym = U.ccySym ? U.ccySym(t.sendCcy) : (t.sendCcy + " ");
      var recvCcy = t.receiveCcy || "BDT";
      var recvSym = U.ccySym ? U.ccySym(recvCcy) : "৳";
      global.Modal.open({
        title: "Official Remittance Advice · " + t.ref,
        body: '<div style="display:grid;gap:12px;font-size:13px;">' +
          '<div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Reference ID:</span><b class="mono">' + U.esc(t.ref) + '</b></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>User / Recipient:</span><b>' + U.esc(t.user) + '</b></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Account / Email:</span><span class="mono">' + U.esc(t.userEmail) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Transaction Type:</span><b>' + U.esc(t.type || "Transfer") + '</b></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Sent Amount:</span><b>' + sym + U.money(t.send, "", 2) + ' ' + U.esc(t.sendCcy) + '</b></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Total Fee:</span><b>' + sym + totalFee + '</b></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Effective Exchange Rate:</span><b>1 ' + U.esc(t.sendCcy) + ' = ' + t.rate + ' ' + U.esc(recvCcy) + '</b></div>' +
            '<div style="display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:8px;"><span style="font-weight:700;">Recipient Receives:</span><b style="color:#15803d;font-size:15px;">' + recvSym + U.money(t.receive, "", 2) + ' ' + U.esc(recvCcy) + '</b></div>' +
          '</div>' +
          '<div style="text-align:center;font-size:11.5px;color:#64748b;">SIMULATED RECORD — Demonstration transfer receipt.</div>' +
        '</div>',
        okLabel: "Print / Save PDF 🖨️",
        onOk: function(){ window.print(); }
      });
    });
  });

  var expBtn = U.$("#txnExportBtn", el);
  if (expBtn){
    expBtn.addEventListener("click", function(){
      var csv = "ID,User,Email,Type,Send_Amount,Currency,Fee,Rate,Receive_Amount,Receive_Currency,Status,Date\n" +
        filtered.map(function(t){
          var fee = ((t.flatFee || 0) + (t.send * (t.pctFee || 0) / 100)).toFixed(2);
          return [t.ref, '"' + String(t.user || "").replace(/"/g, '""') + '"', '"' + String(t.userEmail || "").replace(/"/g, '""') + '"', t.type, t.send, t.sendCcy, fee, t.rate, t.receive, t.receiveCcy || "BDT", t.status, '"' + t.date + '"'].join(",");
        }).join("\n");
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "probaho_transactions_" + Date.now() + ".csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
      global.Toast.show("Exported " + filtered.length + " transactions to CSV!", "ok");
    });
  }

  var newBtn = U.$("#txnNewBtn", el);
  if (newBtn){
    newBtn.addEventListener("click", function(){
      location.hash = "#/send";
    });
  }
}

global.ModTransactions = { render: function(){ render("all", "all"); }, meta:{ title:"Transactions", nav:"Transactions", icon:"send" } };
})(typeof window !== "undefined" ? window : global);

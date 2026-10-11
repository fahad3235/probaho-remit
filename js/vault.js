/* ============================================================
   Probaho Remit — MODULE 7: Payment Vault (demo ledger + receipts)
   Static demo UI built on the DemoData contract. English only,
   no network calls, all figures computed via DemoData.calc().
   ============================================================ */
'use strict';

window.PM = window.PM || {};

window.PM.vault = (function () {

  /* ---------- helpers ---------- */

  // Escape text interpolated into HTML strings.
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // '2026-10-09' -> '9 Oct 2026' (parsed with explicit components: no TZ drift)
  function fmtDate(iso) {
    var parts = String(iso || '').split('-');
    if (parts.length !== 3) return String(iso || '');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function statusPill(status) {
    if (status === 'Pending') return '<span class="badge badge-info">Pending</span>';
    return '<span class="badge badge-best">Completed</span>';
  }

  function data() {
    return (typeof DemoData !== 'undefined' && DemoData) ? DemoData : null;
  }

  function defRow(label, valueHtml) {
    return '<div class="vault-def-row"><span class="vault-def-label">' + esc(label) +
           '</span><span class="vault-def-value">' + valueHtml + '</span></div>';
  }

  /* ---------- receipt modal ---------- */

  function openReceipt(t) {
    var D = data();
    if (!D || !t) return;

    var q = D.calc(t.corridorId, t.providerId, t.sendAmount);
    var c = q.corridor;
    var p = q.provider;

    var feeLine = esc(D.fmtMoney(q.flat, c.fromCur)) + ' + ' +
                  esc(D.fmtPct(p.feePct)) + ' = ' +
                  esc(D.fmtMoney(q.fee, c.fromCur));

    var rows =
      defRow('Reference', '<span class="vault-ref">' + esc(t.id) + '</span>') +
      defRow('Date', esc(fmtDate(t.date))) +
      defRow('Route', esc(c.from) + ' &rarr; ' + esc(c.to)) +
      defRow('Provider', esc(p.name) + ' &middot; ' + esc(p.method) + ' &middot; ' + esc(p.speed)) +
      defRow('Sent amount', esc(D.fmtMoney(t.sendAmount, c.fromCur))) +
      defRow('Fee (flat + %)', feeLine) +
      defRow('Effective FX rate', esc(D.fmtRate(q.rate)) + ' ' + esc(c.toCur) + ' per ' + esc(c.fromCur)) +
      defRow('FX spread', esc(D.fmtPct(q.spreadPct))) +
      defRow('Recipient receives', '<span class="vault-amount">' + esc(D.fmtMoney(q.recipientGets, c.toCur)) + '</span>') +
      defRow('Total cost', esc(D.fmtPct(q.totalCostPct))) +
      defRow('Status', statusPill(t.status));

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Transfer receipt">' +
        '<div class="vault-modal-head">' +
          '<h3>Transfer receipt</h3>' +
          '<span class="badge-demo">DEMO DATA</span>' +
        '</div>' +
        '<div class="vault-def">' + rows + '</div>' +
        '<p class="muted small">Synthetic demo record. No real funds moved. ' +
        'Verify at demo.probaho.remit/receipts/' + esc(t.id) + ' (fictional).</p>' +
        '<div class="vault-modal-foot">' +
          '<button type="button" class="btn btn-outline btn-sm vault-close">Close</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }
    function onKey(e) {
      if (e && (e.key === 'Escape' || e.key === 'Esc')) close();
    }

    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    var closeBtn = backdrop.querySelector('.vault-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (closeBtn) closeBtn.focus();
  }

  /* ---------- main render ---------- */

  function render(el) {
    if (!el) return;
    var D = data();
    if (!D) {
      el.innerHTML = '<p class="muted">Demo data unavailable.</p>';
      return;
    }

    var transfers = D.vaultTransfers || [];
    var completed = transfers.filter(function (t) { return t.status === 'Completed'; }).length;
    var corridorSet = {};
    transfers.forEach(function (t) { corridorSet[t.corridorId] = true; });
    var corridorsCovered = Object.keys(corridorSet).length;

    var rowsHtml = transfers.map(function (t) {
      var q = D.calc(t.corridorId, t.providerId, t.sendAmount);
      var c = q.corridor;
      var p = q.provider;
      return '<tr class="vault-row" data-tx="' + esc(t.id) + '" tabindex="0" title="View receipt">' +
        '<td>' + esc(fmtDate(t.date)) + '</td>' +
        '<td><span class="vault-ref small">' + esc(t.id) + '</span></td>' +
        '<td>' + esc(c.from) + ' &rarr; ' + esc(c.to) + '</td>' +
        '<td>' + esc(p.name) + '</td>' +
        '<td>' + esc(D.fmtMoney(t.sendAmount, c.fromCur)) + '</td>' +
        '<td>' + esc(D.fmtMoney(q.recipientGets, c.toCur)) + '</td>' +
        '<td>' + statusPill(t.status) + '</td>' +
        '<td><button type="button" class="btn btn-outline btn-sm vault-receipt-btn" data-tx="' + esc(t.id) + '">Receipt</button></td>' +
      '</tr>';
    }).join('');

    el.innerHTML =
      '<section class="section">' +
        '<div class="wrap">' +
          '<span class="badge-demo">DEMO DATA</span>' +
          '<h2 class="section-title" style="margin-top:.5em">Payment Vault</h2>' +
          '<p class="section-sub">Every demo transfer, logged with a verifiable receipt. Click any row for the full breakdown.</p>' +
          '<div class="kpis vault-kpis">' +
            '<div class="kpi"><div class="k-label">Transfers logged</div><div class="k-value">' + transfers.length + '</div></div>' +
            '<div class="kpi"><div class="k-label">Completed</div><div class="k-value">' + completed + '</div></div>' +
            '<div class="kpi"><div class="k-label">Corridors covered</div><div class="k-value">' + corridorsCovered + '</div></div>' +
          '</div>' +
          '<div class="table-wrap">' +
            '<table class="table">' +
              '<thead><tr>' +
                '<th>Date</th><th>Reference</th><th>Route</th><th>Provider</th>' +
                '<th>Sent</th><th>Recipient gets</th><th>Status</th><th></th>' +
              '</tr></thead>' +
              '<tbody>' + rowsHtml + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</section>';

    // Row clicks and Receipt buttons both open the receipt modal.
    var tbody = el.querySelector('tbody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var target = e.target;
        var row = target && target.closest ? target.closest('tr.vault-row') : null;
        if (!row) return;
        var id = row.getAttribute('data-tx');
        var t = transfers.filter(function (x) { return x.id === id; })[0];
        if (t) openReceipt(t);
      });
      tbody.addEventListener('keydown', function (e) {
        if (e && (e.key === 'Enter' || e.key === ' ')) {
          var target = e.target;
          var row = target && target.closest ? target.closest('tr.vault-row') : null;
          if (row && row === target) {
            e.preventDefault();
            var id = row.getAttribute('data-tx');
            var t = transfers.filter(function (x) { return x.id === id; })[0];
            if (t) openReceipt(t);
          }
        }
      });
    }
  }

  return {
    nav: {
      label: 'Payment Vault',
      blurb: 'Ledger of demo transfers with verifiable receipts.'
    },
    render: render
  };

})();

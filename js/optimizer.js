/* ============================================================
   Probaho Remit — MODULE 2: Corridor Optimizer (hero demo)
   Compares 5 synthetic providers fee-by-fee for a corridor and
   amount, shows KPIs + comparison table, and drafts a transfer.
   Contract:
     window.PM.optimizer = {
       nav: { label, blurb },
       render: function (el) { ... }
     }
   Uses design-system classes + opt- prefixed classes only.
   No network. Deterministic on top of DemoData.
   ============================================================ */
'use strict';

(function () {
  /* ---- tiny helpers ---- */
  function el(tag, cls, text) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text !== undefined && text !== null) d.textContent = text;
    return d;
  }
  function defaultAmount(fromCur) {
    if (fromCur === 'BDT') return 250000;
    if (fromCur === 'SAR') return 5000;
    if (fromCur === 'MYR') return 6000;
    return 1000;
  }
  /* deterministic reference code from corridor+provider+amount */
  function refCode(corridorId, providerId, amount) {
    var s = corridorId + '|' + providerId + '|' + String(amount);
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h = h >>> 0;
    return 'TX-DEMO-' + (1000 + (h % 9000));
  }
  /* escape-free text setter is used everywhere; this is for nothing else */

  /* ---- state per render instance ---- */
  function buildState(corridorId, amount) {
    var c = DemoData.getCorridor(corridorId);
    var rows = DemoData.compareAll(c.id, amount); // sorted cheapest first
    var best = rows.length ? rows[0] : null;
    var worst = rows.length ? rows[rows.length - 1] : null;
    return { corridor: c, rows: rows, best: best, worst: worst };
  }

  function renderResults(host, state, amount) {
    // host: container inside el
    host.innerHTML = '';
    if (!state.rows.length || !(amount > 0)) {
      var w = el('div', 'alert alert-warn', 'Enter an amount greater than zero.');
      host.appendChild(w);
      return;
    }
    var c = state.corridor, best = state.best, worst = state.worst;

    /* ---- KPI row ---- */
    var kpis = el('div', 'kpis');
    var kpiDefs = [
      { label: 'Cheapest provider', value: best.provider.name },
      { label: 'Recipient gets', value: DemoData.fmtMoney(best.recipientGets, c.toCur) },
      { label: 'Total cost', value: DemoData.fmtPct(best.totalCostPct) },
      { label: 'You save vs priciest', value: DemoData.fmtMoney(worst.totalCost - best.totalCost, c.fromCur) }
    ];
    kpiDefs.forEach(function (k) {
      var card = el('div', 'kpi');
      card.appendChild(el('div', 'k-label', k.label));
      card.appendChild(el('div', 'k-value', k.value));
      card.appendChild(el('div', 'k-sub', 'vs ' + (state.rows.length - 1) + ' other providers'));
      kpis.appendChild(card);
    });
    host.appendChild(kpis);

    /* ---- comparison table ---- */
    var tw = el('div', 'table-wrap');
    var table = el('table', 'table');
    var thead = el('thead');
    var hr = el('tr');
    ['Provider', 'Fee', 'FX rate', 'Spread', 'Recipient gets', 'Total cost', ''].forEach(function (h) {
      hr.appendChild(el('th', null, h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el('tbody');
    state.rows.forEach(function (r, idx) {
      var tr = el('tr', idx === 0 ? 'best-row' : '');
      // provider cell
      var tdP = el('td');
      tdP.appendChild(el('span', 'opt-provider', r.provider.name));
      if (idx === 0) {
        tdP.appendChild(document.createTextNode(' '));
        tdP.appendChild(el('span', 'badge badge-best', 'BEST'));
      } else if (r.provider.tag) {
        tdP.appendChild(document.createTextNode(' '));
        tdP.appendChild(el('span', 'badge badge-info', r.provider.tag));
      }
      tdP.appendChild(el('div', 'opt-sub', r.provider.method + ' · ' + r.provider.speed));
      tr.appendChild(tdP);
      // fee
      tr.appendChild(el('td', null, DemoData.fmtMoney(r.fee, c.fromCur)));
      // fx rate
      tr.appendChild(el('td', null, DemoData.fmtRate(r.rate) + ' ' + c.toCur + ' / ' + c.fromCur));
      // spread
      tr.appendChild(el('td', null, DemoData.fmtPct(r.spreadPct)));
      // recipient gets (bold)
      var tdR = el('td');
      var b = el('strong', null, DemoData.fmtMoney(r.recipientGets, c.toCur));
      tdR.appendChild(b);
      tr.appendChild(tdR);
      // total cost
      tr.appendChild(el('td', null, DemoData.fmtPct(r.totalCostPct)));
      // action
      var tdA = el('td');
      var btn = el('button', 'btn btn-outline btn-sm', 'Draft');
      btn.type = 'button';
      btn.dataset.corridorId = c.id;
      btn.dataset.providerId = r.provider.id;
      btn.dataset.amount = String(amount);
      btn.addEventListener('click', function () {
        openDraftModal(host, c, r, amount);
      });
      tdA.appendChild(btn);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tw.appendChild(table);
    host.appendChild(tw);
  }

  /* ---- draft modal ---- */
  function openDraftModal(root, corridor, quote, amount) {
    closeModal(root); // only one at a time
    var backdrop = el('div', 'modal-backdrop');
    var modal = el('div', 'modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Draft transfer');

    function fillSummary() {
      modal.innerHTML = '';
      modal.appendChild(el('h3', null, 'Draft transfer'));
      var code = refCode(corridor.id, quote.provider.id, amount);
      var lines = [
        ['Corridor', corridor.from + ' → ' + corridor.to + ' (' + corridor.fromCur + ' → ' + corridor.toCur + ')'],
        ['Provider', quote.provider.name + ' — ' + quote.provider.method + ' (' + quote.provider.speed + ')'],
        ['Send amount', DemoData.fmtMoney(amount, corridor.fromCur)],
        ['Fee breakdown', 'Flat ' + DemoData.fmtMoney(quote.flat, corridor.fromCur) + ' + ' + DemoData.fmtPct(quote.provider.feePct) + ' = ' + DemoData.fmtMoney(quote.fee, corridor.fromCur)],
        ['Effective FX rate', DemoData.fmtRate(quote.rate) + ' ' + corridor.toCur + ' per ' + corridor.fromCur],
        ['FX spread', DemoData.fmtPct(quote.spreadPct)],
        ['Recipient gets', DemoData.fmtMoney(quote.recipientGets, corridor.toCur)],
        ['Total cost', DemoData.fmtPct(quote.totalCostPct)],
        ['Reference', code]
      ];
      var dl = el('dl', 'opt-summary');
      lines.forEach(function (pair) {
        var dt = el('dt', null, pair[0]);
        var dd = el('dd', null, pair[1]);
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      modal.appendChild(dl);
      var actions = el('div', 'opt-actions');
      var confirm = el('button', 'btn btn-primary', 'Confirm draft');
      confirm.type = 'button';
      var cancel = el('button', 'btn btn-outline', 'Cancel');
      cancel.type = 'button';
      confirm.addEventListener('click', function () {
        modal.innerHTML = '';
        modal.appendChild(el('h3', null, 'Draft transfer'));
        modal.appendChild(el('div', 'alert alert-ok', 'Draft saved (demo). No money moved — this is a simulation.'));
        var close = el('button', 'btn btn-dark', 'Close');
        close.type = 'button';
        close.addEventListener('click', function () { closeModal(root); });
        var wrap = el('div', 'opt-actions');
        wrap.appendChild(close);
        modal.appendChild(wrap);
        close.focus();
      });
      cancel.addEventListener('click', function () { closeModal(root); });
      actions.appendChild(confirm);
      actions.appendChild(cancel);
      modal.appendChild(actions);
      confirm.focus();
    }
    fillSummary();

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal(root);
    });
    backdrop.appendChild(modal);
    root._optModal = backdrop;
    root.appendChild(backdrop);

    // store escape handler so we can remove it on close
    var onKey = function (e) {
      if (e.key === 'Escape') closeModal(root);
    };
    backdrop._optKeyHandler = onKey;
    document.addEventListener('keydown', onKey);
  }

  function closeModal(root) {
    var existing = root && root._optModal ? root._optModal : null;
    if (!existing) return;
    if (existing._optKeyHandler) {
      document.removeEventListener('keydown', existing._optKeyHandler);
    }
    existing.remove();
    if (root) root._optModal = null;
  }

  /* ---- main render ---- */
  function render(elm) {
    if (!elm) return;
    var DD = (typeof window.DemoData !== 'undefined') ? window.DemoData : (typeof DemoData !== 'undefined' ? DemoData : null);
    if (!DD) return;
    /* use the resolved engine everywhere below */
    var DemoData = DD;
    elm.innerHTML = '';

    var section = el('section', 'section');
    var wrap = el('div', 'wrap');

    // header
    wrap.appendChild(el('span', 'badge-demo', 'DEMO DATA'));
    wrap.appendChild(el('h2', 'section-title', 'Corridor Optimizer'));
    wrap.appendChild(el('p', 'section-sub',
      'Pick a corridor and amount. The engine compares five synthetic providers — fee, FX spread and speed — and drafts your transfer. All figures are simulated.'));

    // controls
    var toolbar = el('div', 'toolbar');

    var cWrap = el('div');
    var cLabel = el('label', 'label', 'Corridor');
    cLabel.setAttribute('for', 'opt-corridor');
    cWrap.appendChild(cLabel);
    var select = el('select', 'select');
    select.id = 'opt-corridor';
    DemoData.corridors.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.from + ' → ' + c.to + ' · ' + c.fromCur + '→' + c.toCur;
      select.appendChild(o);
    });
    cWrap.appendChild(select);
    toolbar.appendChild(cWrap);

    var aWrap = el('div');
    var aLabel = el('label', 'label', 'Amount');
    aLabel.setAttribute('for', 'opt-amount');
    aWrap.appendChild(aLabel);
    var input = el('input', 'input');
    input.id = 'opt-amount';
    input.type = 'number';
    input.min = '1';
    input.step = '1';
    aWrap.appendChild(input);
    toolbar.appendChild(aWrap);

    var bWrap = el('div', 'opt-btn-wrap');
    var cmp = el('button', 'btn btn-primary', 'Compare');
    cmp.type = 'button';
    bWrap.appendChild(cmp);
    toolbar.appendChild(bWrap);

    wrap.appendChild(toolbar);

    // results host
    var results = el('div', 'opt-results');
    wrap.appendChild(results);

    // footnote
    wrap.appendChild(el('p', 'muted small', 'Synthetic provider data for demonstration only. Rates are illustrative, not live.'));

    section.appendChild(wrap);
    elm.appendChild(section);

    // guards
    if (!select || !input || !cmp || !results) return;

    function currentAmount() {
      var v = Number(input.value);
      return (isFinite(v) && v > 0) ? v : 0;
    }

    function refresh() {
      var amt = currentAmount();
      var state = buildState(select.value, amt);
      renderResults(results, state, amt);
    }

    function syncAmountDefault() {
      var c = DemoData.getCorridor(select.value);
      input.value = String(defaultAmount(c.fromCur));
    }

    select.addEventListener('change', function () {
      syncAmountDefault();
      refresh();
    });
    input.addEventListener('input', refresh);
    cmp.addEventListener('click', refresh);

    // init
    if (DemoData.corridors.length) select.value = DemoData.corridors[0].id;
    syncAmountDefault();
    refresh();
  }

  window.PM = window.PM || {};
  window.PM.optimizer = {
    nav: {
      label: 'Corridor Optimizer',
      blurb: 'Compare 5 providers fee-by-fee and find the cheapest way to send.'
    },
    render: render
  };
})();

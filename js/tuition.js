/* ============================================================
   Probaho Remit — MODULE 5: Tuition Planner
   Static demo MVP. All state in-memory; copies of DemoData
   are used so the seed arrays are never mutated.
   ============================================================ */
'use strict';

window.PM = window.PM || {};
window.PM.tuition = (function () {

  /* Fixed demo "today": 11 Oct 2026 (deterministic, matches data.js) */
  var DEMO_TODAY = new Date(2026, 9, 11);

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Parse 'YYYY-MM-DD' as a local date (avoids UTC-shift bugs) */
  function parseDate(s) {
    var p = String(s).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  function fmtDate(s) {
    try {
      return parseDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return String(s); }
  }

  function dayDiff(fromDate, toDateStr) {
    var a = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    var d = parseDate(toDateStr);
    var b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((b - a) / 86400000);
  }

  function daysInfo(dateStr) {
    var diff = dayDiff(DEMO_TODAY, dateStr);
    if (diff === 0)  return { text: 'today', overdue: false };
    if (diff > 0)    return { text: 'in ' + diff + (diff === 1 ? ' day' : ' days'), overdue: false };
    var n = Math.abs(diff);
    return { text: 'overdue by ' + n + (n === 1 ? ' day' : ' days'), overdue: true };
  }

  function displayAmount(a) {
    if (a === null || a === undefined || a === '') return '—';
    if (typeof a === 'number' || !isNaN(Number(String(a).replace(/[£, ]/g, '')))) {
      var num = typeof a === 'number' ? a : Number(String(a).replace(/[£, ]/g, ''));
      if (isNaN(num)) return '—';
      return DemoData.fmtMoney(num, 'GBP');
    }
    return String(a); // verbatim for strings like '—'
  }

  function clampPct(p) {
    if (isNaN(p)) return 0;
    return Math.max(0, Math.min(100, p));
  }

  /* ---------- module state (fresh copies of demo data) ---------- */

  function freshState() {
    return {
      deadlines: DemoData.tuitionDeadlines.slice().map(function (d) {
        return { id: d.id, title: d.title, date: d.date, amount: d.amount };
      }),
      docs: DemoData.tuitionDocs.slice(),
      checked: {},
      budget: 12000,
      spent: 4250,
      uid: 0
    };
  }

  /* ---------- render ---------- */

  function render(el) {
    var state = freshState();

    el.innerHTML =
      '<div class="section" style="padding-top:32px">' +
        '<div class="wrap">' +
          '<span class="badge-demo">DEMO DATA</span>' +
          '<h2 class="section-title mt" style="margin-top:12px">Tuition Planner</h2>' +
          '<p class="section-sub">Deadlines, paperwork and budget for one academic term — everything a student sending money abroad needs in one place.</p>' +
          '<div class="grid grid-2">' +

            /* LEFT: deadlines */
            '<div class="card">' +
              '<h3>Payment deadlines</h3>' +
              '<p class="desc">Upcoming tuition payments, sorted by due date.</p>' +
              '<div class="tuit-list" data-ref="deadlineList"></div>' +
              '<hr class="tuit-hr">' +
              '<h4 class="tuit-h4">Add a deadline</h4>' +
              '<div class="tuit-add">' +
                '<div><label class="label">Title</label><input class="input" type="text" data-ref="newTitle" placeholder="e.g. Spring tuition installment"></div>' +
                '<div class="form-row">' +
                  '<div><label class="label">Date</label><input class="input" type="date" data-ref="newDate"></div>' +
                  '<div><label class="label">Amount (GBP)</label><input class="input" type="number" min="0" step="0.01" data-ref="newAmount" placeholder="e.g. 4250"></div>' +
                '</div>' +
                '<div class="tuit-warn small" data-ref="addWarn" hidden></div>' +
                '<div><button class="btn btn-primary btn-sm" data-ref="addBtn">Add deadline</button></div>' +
              '</div>' +
            '</div>' +

            /* RIGHT: checklist + budget */
            '<div class="tuit-stack">' +
              '<div class="card">' +
                '<h3>Document checklist</h3>' +
                '<p class="desc" data-ref="docCount"></p>' +
                '<div class="progress mt"><div data-ref="docBar"></div></div>' +
                '<div class="mt" data-ref="docList"></div>' +
              '</div>' +
              '<div class="card">' +
                '<h3>Term budget</h3>' +
                '<div class="form-row">' +
                  '<div><label class="label">Term budget (GBP)</label><input class="input" type="number" min="0" step="0.01" data-ref="budgetIn" value="12000"></div>' +
                  '<div><label class="label">Spent so far (GBP)</label><input class="input" type="number" min="0" step="0.01" data-ref="spentIn" value="4250"></div>' +
                '</div>' +
                '<div class="progress mt"><div data-ref="budgetBar"></div></div>' +
                '<div class="tuit-budget-meta mt" data-ref="budgetMeta"></div>' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</div>';

    var q = function (name) { return el.querySelector('[data-ref="' + name + '"]'); };

    /* ----- deadlines ----- */
    function renderDeadlines() {
      var list = q('deadlineList');
      var sorted = state.deadlines.slice().sort(function (a, b) {
        return parseDate(a.date) - parseDate(b.date);
      });
      if (!sorted.length) {
        list.innerHTML = '<p class="muted small">No deadlines yet — add one below.</p>';
        return;
      }
      list.innerHTML = sorted.map(function (d) {
        var info = daysInfo(d.date);
        return '<div class="tuit-row">' +
          '<div class="tuit-row-info">' +
            '<div class="tuit-row-title">' + esc(d.title) + '</div>' +
            '<div class="small muted">' + esc(fmtDate(d.date)) + ' · ' + esc(displayAmount(d.amount)) + '</div>' +
          '</div>' +
          '<div class="tuit-row-side">' +
            '<span class="small ' + (info.overdue ? 'tuit-overdue' : '') + '">' + esc(info.text) + '</span>' +
            '<button class="btn btn-outline btn-sm" data-del="' + esc(d.id) + '">Remove</button>' +
          '</div>' +
        '</div>';
      }).join('');

      list.querySelectorAll('button[data-del]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-del');
          state.deadlines = state.deadlines.filter(function (d) { return d.id !== id; });
          renderDeadlines();
        });
      });
    }

    function showWarn(msg) {
      var w = q('addWarn');
      w.hidden = false;
      w.textContent = msg;
    }
    function hideWarn() { q('addWarn').hidden = true; }

    q('addBtn').addEventListener('click', function () {
      var title = q('newTitle').value.trim();
      var date = q('newDate').value;
      var amountRaw = q('newAmount').value;
      if (!title || !date) {
        showWarn('Title and date are required to add a deadline.');
        return;
      }
      hideWarn();
      state.uid += 1;
      state.deadlines.push({
        id: 'dl-user-' + Date.now() + '-' + state.uid,
        title: title,
        date: date,
        amount: amountRaw !== '' ? Number(amountRaw) : '—'
      });
      q('newTitle').value = '';
      q('newDate').value = '';
      q('newAmount').value = '';
      renderDeadlines();
    });

    /* ----- checklist ----- */
    function renderDocs() {
      var total = state.docs.length;
      var done = state.docs.filter(function (_, i) { return state.checked[i]; }).length;
      q('docCount').textContent = done + ' of ' + total + ' documents ready';
      q('docBar').style.width = (total ? (done / total) * 100 : 0) + '%';
      var list = q('docList');
      list.innerHTML = state.docs.map(function (doc, i) {
        var c = state.checked[i] ? ' done' : '';
        var checked = state.checked[i] ? ' checked' : '';
        return '<label class="check' + c + '"><input type="checkbox" data-doc="' + i + '"' + checked + '><span>' + esc(doc) + '</span></label>';
      }).join('');
      list.querySelectorAll('input[data-doc]').forEach(function (box) {
        box.addEventListener('change', function () {
          state.checked[Number(box.getAttribute('data-doc'))] = box.checked;
          renderDocs();
        });
      });
    }

    /* ----- budget ----- */
    function renderBudget() {
      var budget = Math.max(0, Number(q('budgetIn').value) || 0);
      var spent = Math.max(0, Number(q('spentIn').value) || 0);
      var pct = budget > 0 ? (spent / budget) * 100 : 0;
      pct = clampPct(pct);
      q('budgetBar').style.width = pct + '%';
      var remaining = budget - spent;
      q('budgetMeta').innerHTML =
        '<div class="kpis tuit-kpis">' +
          '<div class="kpi"><div class="k-label">Remaining</div><div class="k-value">' + esc(DemoData.fmtMoney(remaining, 'GBP')) + '</div></div>' +
          '<div class="kpi"><div class="k-label">Used</div><div class="k-value">' + pct.toFixed(1) + '%</div><div class="k-sub">' + esc(DemoData.fmtMoney(spent, 'GBP')) + ' of ' + esc(DemoData.fmtMoney(budget, 'GBP')) + '</div></div>' +
        '</div>';
    }

    q('budgetIn').addEventListener('input', renderBudget);
    q('spentIn').addEventListener('input', renderBudget);

    /* initial paint */
    renderDeadlines();
    renderDocs();
    renderBudget();
  }

  return {
    nav: {
      label: 'Tuition Planner',
      blurb: 'Deadlines, document checklists and budgets for students abroad.'
    },
    render: render
  };
})();

/* ---- wiring hint (the shell decides if/how to include this file) ---- */

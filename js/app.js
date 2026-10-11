/* ============================================================
   Probaho Remit — Shell: hash router + landing view
   Each module registers window.PM.<key> = { nav:{label, blurb}, render(el) }.
   This file never depends on module internals: it reads only the
   registered metadata and calls render(appEl).
   ============================================================ */
'use strict';

(function () {

  /* Ordered module keys — drives nav highlighting + landing cards. */
  var MODULE_KEYS = ['optimizer', 'scamshield', 'fx', 'tuition', 'copilot', 'vault'];

  /* Fallback nav metadata if a module script failed to load before render. */
  var FALLBACK_META = {
    optimizer:  { label: 'Corridor Optimizer',  blurb: 'Compare 5 providers fee-by-fee and find the cheapest way to send.' },
    scamshield: { label: 'ScamShield',          blurb: 'AI fraud screening for payment instructions, explained in plain language.' },
    fx:         { label: 'FX Timing Advisor',   blurb: '90-day rate intelligence with send-now / wait signals.' },
    tuition:    { label: 'Tuition Planner',     blurb: 'Deadlines, document checklists and budgets for students abroad.' },
    copilot:    { label: 'Ask Probaho',         blurb: 'Conversational copilot for cross-border money questions.' },
    vault:      { label: 'Payment Vault',       blurb: 'Ledger of demo transfers with verifiable receipts.' }
  };

  var appEl = null;

  function pm() {
    return (window.PM && typeof window.PM === 'object') ? window.PM : {};
  }

  function getMeta(key) {
    var mod = pm()[key];
    if (mod && mod.nav && mod.nav.label) {
      return {
        label: String(mod.nav.label),
        blurb: String(mod.nav.blurb || (FALLBACK_META[key] && FALLBACK_META[key].blurb) || '')
      };
    }
    return FALLBACK_META[key];
  }

  /* ---------- routing ---------- */

  function parseRoute() {
    // Accepted: '', '#/', '#/optimizer' (also '#optimizer' for robustness)
    var h = (location.hash || '').replace(/^#\/?/, '').split(/[?#]/)[0].trim();
    if (MODULE_KEYS.indexOf(h) !== -1) return h;
    return '';
  }

  function setActiveNav(route) {
    var links = document.querySelectorAll('.nav-links a[data-route]');
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getAttribute('data-route') || '';
      links[i].classList.toggle('active', r === route);
    }
  }

  function renderModuleNotFound(key) {
    appEl.innerHTML =
      '<section class="section"><div class="wrap">' +
      '<div class="alert alert-warn"><b>Module not found.</b> The "' + escapeHtml(key) + '" tool is not available in this build.</div>' +
      '<p class="mt"><a class="btn btn-dark" href="#/">Back to home</a></p>' +
      '</div></section>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- landing view ---------- */

  function landingView() {
    var frag = document.createDocumentFragment();

    /* Hero */
    var hero = document.createElement('section');
    hero.className = 'hero';
    var corridorPills = (typeof DemoData !== 'undefined' ? DemoData.corridors : []).map(function (c) {
      return '<span class="corridor-pill">' + escapeHtml(c.from) +
             ' <span class="arrow">&#8594;</span> ' + escapeHtml(c.to) + '</span>';
    }).join('');
    hero.innerHTML =
      '<div class="wrap">' +
        '<span class="badge-demo">Demo</span>' +
        '<h1 style="margin-top:.4em">Money across borders, <span class="accent">the smart way.</span></h1>' +
        '<p class="lead">An AI financial participant that moves money across borders the cheapest, safest way possible.</p>' +
        '<p class="lead small">Built for the 2026 Shenzhen International FinTech Competition — International Track, Topic C. Theme: AI as a Financial Participant.</p>' +
        '<div class="hero-cta">' +
          '<a class="btn btn-primary" href="#/optimizer">Try the Corridor Optimizer</a>' +
          '<a class="btn btn-ghost" href="#/scamshield">See ScamShield in action</a>' +
        '</div>' +
        '<div class="hero-stats">' +
          '<div class="stat"><b>4</b><span>corridors</span></div>' +
          '<div class="stat"><b>5</b><span>providers compared</span></div>' +
          '<div class="stat"><b>90-day</b><span>FX intelligence</span></div>' +
          '<div class="stat"><b>100%</b><span>synthetic demo data</span></div>' +
        '</div>' +
        '<div class="corridor-strip" aria-label="Supported demo corridors">' + corridorPills + '</div>' +
      '</div>';
    frag.appendChild(hero);

    /* Six tools, one copilot */
    var tools = document.createElement('section');
    tools.className = 'section';
    var cards = MODULE_KEYS.map(function (key) {
      var meta = getMeta(key);
      return '<a href="#/' + key + '" style="text-decoration:none;color:inherit">' +
             '<div class="card mod-card">' +
             '<h3>' + escapeHtml(meta.label) + '</h3>' +
             '<p class="desc">' + escapeHtml(meta.blurb) + '</p>' +
             '<span class="go">Open tool &rarr;</span>' +
             '</div></a>';
    }).join('');
    tools.innerHTML =
      '<div class="wrap">' +
        '<h2 class="section-title">Six tools, one copilot</h2>' +
        '<p class="section-sub">Every tool works on the same synthetic demo dataset — compare, screen, time, plan, ask, and verify.</p>' +
        '<div class="grid grid-3">' + cards + '</div>' +
      '</div>';
    frag.appendChild(tools);

    /* How the demo works */
    var steps = document.createElement('section');
    steps.className = 'section';
    steps.style.paddingTop = '0';
    steps.innerHTML =
      '<div class="wrap">' +
        '<h2 class="section-title">How the demo works</h2>' +
        '<p class="section-sub">Three steps, end to end — all demo data, no real money.</p>' +
        '<div class="grid grid-3">' +
          '<div class="card"><span class="step-num">1</span><h3>Compare corridors</h3>' +
            '<p class="desc">Pick a corridor and send amount. The optimizer quotes all 5 providers fee-by-fee and ranks the cheapest total cost.</p></div>' +
          '<div class="card"><span class="step-num">2</span><h3>Screen for scams</h3>' +
            '<p class="desc">Paste any payment instruction into ScamShield. It flags the classic fraud tells and explains each one in plain language.</p></div>' +
          '<div class="card"><span class="step-num">3</span><h3>Time your transfer</h3>' +
            '<p class="desc">The FX Timing Advisor reads 90 days of rate history and gives a send-now / wait / hold signal against the 7-day average.</p></div>' +
        '</div>' +
      '</div>';
    frag.appendChild(steps);

    appEl.appendChild(frag);
  }

  /* ---------- route dispatch ---------- */

  function route() {
    var key = parseRoute();
    appEl.innerHTML = '';
    window.scrollTo(0, 0);
    setActiveNav(key);

    if (key === '') {
      landingView();
      return;
    }
    var mod = pm()[key];
    if (mod && typeof mod.render === 'function') {
      try {
        mod.render(appEl);
      } catch (e) {
        appEl.innerHTML =
          '<section class="section"><div class="wrap">' +
          '<div class="alert alert-bad"><b>Something went wrong</b> loading the "' + escapeHtml(key) + '" tool.</div>' +
          '<p class="mt"><a class="btn btn-dark" href="#/">Back to home</a></p>' +
          '</div></section>';
        if (window.console && console.error) console.error('[Probaho Remit] render error for route "' + key + '":', e);
      }
    } else {
      // Module script failed to load or did not register — graceful fallback.
      renderModuleNotFound(key);
    }
  }

  function init() {
    appEl = document.getElementById('app');
    if (!appEl) return;
    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

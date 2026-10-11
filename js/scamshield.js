/* ============================================================
   Probaho Remit — Module 3: ScamShield (AI fraud screening)
   Deterministic rule-based demo engine. No randomness, no network.
   The scorer (ScamShield.analyze / RULES) is pure and DOM-free so it
   can be unit-tested in node.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Rule table (order = display order) ---------------- */
  var RULES = [
    {
      key: 'urgency',
      weight: 20,
      explanation: 'Creates false urgency to stop you thinking.',
      re: /urgent|immediately|asap|a\.s\.a\.p|within 24 hours|today only|act now/i
    },
    {
      key: 'bank-change',
      weight: 25,
      explanation: 'Asks you to send money to new bank details — a classic interception scam.',
      re: /bank detail|account number|new account|updated detail|changed (our|the) bank/i
    },
    {
      key: 'beneficiary-mismatch',
      weight: 15,
      explanation: 'Beneficiary does not match the expected recipient.',
      re: /different name|third part|my cousin|another person|on behalf of/i
    },
    {
      key: 'too-good-rate',
      weight: 15,
      explanation: 'Promises unrealistic rates or fees — bait used by fraudsters.',
      re: /(zero|no)\s*(transfer\s*)?fee|best rate guaranteed|guaranteed.*rate|double your money/i
    },
    {
      key: 'unofficial-channel',
      weight: 20,
      explanation: 'Pushes you to unofficial or irreversible payment channels.',
      re: /whatsapp|telegram|crypto|gift card|western union.*agent/i
    },
    {
      key: 'secrecy',
      weight: 10,
      explanation: 'Asks for secrecy — legitimate providers never do.',
      re: /don'?t tell|keep (it|this) secret|confidential|between us/i
    }
  ];

  var BAND_META = {
    low:  { label: 'LOW',      cls: 'risk-low',  action: 'Proceed with normal verification.' },
    mod:  { label: 'MODERATE', cls: 'risk-mod',  action: 'Double-check the sender through a known phone number before paying.' },
    high: { label: 'HIGH',     cls: 'risk-high', action: 'Do not send money yet — verify via the official website or branch.' },
    crit: { label: 'CRITICAL', cls: 'risk-crit', action: 'Do not send money or share details. This matches known scam patterns.' }
  };

  function bandFor(score) {
    if (score <= 24) return 'low';
    if (score <= 49) return 'mod';
    if (score <= 74) return 'high';
    return 'crit';
  }

  /* Pure scorer: text in -> { score, band, bandLabel, flags[] } */
  function analyze(text) {
    var t = String(text == null ? '' : text);
    var flags = [];
    var score = 0;
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(t)) {
        flags.push({
          key: RULES[i].key,
          weight: RULES[i].weight,
          explanation: RULES[i].explanation
        });
        score += RULES[i].weight;
      }
    }
    if (score > 100) score = 100;
    var band = bandFor(score);
    return {
      score: score,
      band: band,
      bandLabel: BAND_META[band].label,
      bandClass: BAND_META[band].cls,
      action: BAND_META[band].action,
      flags: flags
    };
  }

  /* ---------------- Demo samples ---------------- */
  var SAMPLE_SCAM = 'URGENT: We have changed our bank details. Please send your tuition fee of £4,250 to our NEW ACCOUNT NUMBER 88230011 immediately — within 24 hours — or your admission will be cancelled. Do not tell anyone, keep this confidential. Contact us only on WhatsApp +44 7000 000000. Best rate guaranteed, zero transfer fee!';

  var SAMPLE_LEGIT = 'Please process my spring tuition payment of £4,250 to the University of Manchester, student reference STU-2026-8841, from my Probaho Remit account ending 4471. Confirm once the transfer is scheduled.';

  /* ---------------- Rendering ---------------- */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderResult(resultEl, text) {
    var t = String(text == null ? '' : text);
    if (!t.trim()) {
      resultEl.innerHTML =
        '<div class="alert alert-warn">Paste an instruction first, or try a sample.</div>';
      return;
    }
    var r = analyze(t);
    var html = '';
    html += '<div class="scam-result-top">';
    html +=   '<div class="scam-score-block">';
    html +=     '<div class="label">Fraud risk score</div>';
    html +=     '<div class="scam-score scam-score-' + r.band + '">' + r.score + '<span class="scam-score-max">/100</span></div>';
    html +=     '<span class="risk ' + r.bandClass + '">' + r.bandLabel + '</span>';
    html +=   '</div>';
    html +=   '<div class="scam-action-block">';
    html +=     '<div class="label">Recommended action</div>';
    html +=     '<p class="scam-action">' + esc(r.action) + '</p>';
    html +=   '</div>';
    html += '</div>';
    if (r.flags.length === 0) {
      html += '<div class="alert alert-ok">No fraud indicators found. Still verify recipient details through an official channel.</div>';
    } else {
      html += '<div class="label scam-flags-label">Triggered flags</div>';
      html += '<ul class="scam-flags">';
      for (var i = 0; i < r.flags.length; i++) {
        html += '<li class="scam-flag"><span class="scam-flag-weight">+' + r.flags[i].weight +
                '</span><span class="scam-flag-text">' + esc(r.flags[i].explanation) + '</span></li>';
      }
      html += '</ul>';
    }
    resultEl.innerHTML = html;
  }

  function render(el) {
    var host = document.createElement('div');
    host.className = 'wrap scam-wrap';
    host.innerHTML =
      '<span class="badge-demo">DEMO DATA</span>' +
      '<h2 class="section-title" style="margin-top:.6em">ScamShield</h2>' +
      '<p class="section-sub">Paste any payment instruction, email or message. The deterministic demo engine scores fraud risk and explains every flag in plain language.</p>' +
      '<div class="card">' +
        '<label class="label" for="scam-input">Payment instruction to screen</label>' +
        '<textarea class="textarea" id="scam-input" placeholder="Paste the email, SMS or instruction here&hellip;"></textarea>' +
        '<div class="toolbar" style="margin-top:14px;margin-bottom:0">' +
          '<div style="flex:0 0 auto"><button type="button" class="btn btn-primary" id="scam-analyze">Analyze</button></div>' +
          '<div style="flex:0 0 auto"><button type="button" class="btn btn-outline btn-sm" id="scam-sample-scam">Sample scam email</button></div>' +
          '<div style="flex:0 0 auto"><button type="button" class="btn btn-outline btn-sm" id="scam-sample-legit">Sample legit instruction</button></div>' +
        '</div>' +
        '<div id="scam-result" class="scam-result" aria-live="polite"></div>' +
      '</div>';
    el.appendChild(host);

    var textarea = host.querySelector('#scam-input');
    var resultEl = host.querySelector('#scam-result');

    function doAnalyze() {
      renderResult(resultEl, textarea.value);
    }

    host.querySelector('#scam-analyze').addEventListener('click', doAnalyze);
    host.querySelector('#scam-sample-scam').addEventListener('click', function () {
      textarea.value = SAMPLE_SCAM;
      doAnalyze();
    });
    host.querySelector('#scam-sample-legit').addEventListener('click', function () {
      textarea.value = SAMPLE_LEGIT;
      doAnalyze();
    });
  }

  /* ---------------- Integration contract ---------------- */
  window.PM = window.PM || {};
  window.PM.scamshield = {
    nav: {
      label: 'ScamShield',
      blurb: 'AI fraud screening for payment instructions, explained in plain language.'
    },
    render: render,
    /* Exposed for unit testing (pure, no DOM): */
    analyze: analyze,
    rules: RULES,
    samples: { scam: SAMPLE_SCAM, legit: SAMPLE_LEGIT }
  };
})();

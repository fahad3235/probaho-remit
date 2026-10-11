/* ============================================================
   Probaho Remit — MODULE 6: Ask Probaho (conversational copilot)
   Static demo MVP. Deterministic local brain answers from the
   same synthetic DemoData engine as the other tools.
   Optional Gemini API key: kept ONLY in this page's memory —
   never persisted (no localStorage/sessionStorage/cookies).
   ============================================================ */
'use strict';

window.PM = window.PM || {};

(function () {
  var geminiKey = ''; /* module scope only — never persisted anywhere */

  /* ---------- Pure deterministic brain: keyword matching ---------- */
  function answerFor(question) {
    var q = String(question || '').toLowerCase();

    /* Cheapest corridor / comparison */
    if (/\b(corridor|compare|cheapest|best|way to send|send money|which provider)\b/.test(q)) {
      var rows = DemoData.compareAll('dhk-lon', 250000);
      var best = rows[0];
      return 'For Dhaka to London (demo quote on ' +
        DemoData.fmtMoney(250000, 'BDT') + '), the cheapest provider is <b>' +
        best.provider.name + '</b> at a total cost of ' +
        DemoData.fmtPct(best.totalCostPct) + ' — the recipient would get ' +
        DemoData.fmtMoney(best.recipientGets, 'GBP') +
        '. This demo compares 4 corridors: Dhaka to London, Dhaka to New York, Riyadh to Dhaka, and Kuala Lumpur to Dhaka. Try the comparison tool to see every provider side by side.';
    }

    /* Fees and FX spread */
    if (/\b(fee|fees|spread|cost|expensive|markup|charge)\b/.test(q)) {
      var ex = DemoData.calc('dhk-lon', 'pexp', 250000);
      return 'The total cost has two parts: the <b>fee</b> (what the provider charges) and the <b>FX spread</b> (the markup on the exchange rate). For example, Probaho Express on Dhaka to London with ' +
        DemoData.fmtMoney(250000, 'BDT') + ' charges a fee of ' +
        DemoData.fmtMoney(ex.fee, 'BDT') + ' (' +
        DemoData.fmtPct(ex.provider.feePct) + ') plus a ' +
        DemoData.fmtPct(ex.spreadPct) + ' spread, for a total cost of ' +
        DemoData.fmtMoney(ex.totalCost, 'BDT') + ' (' +
        DemoData.fmtPct(ex.totalCostPct) + '). Flat fees matter more on small amounts — that is why the demo quotes providers side by side.';
    }

    /* ScamShield */
    if (/\b(scam|fraud|safe|safety|scamshield|protect|phishing)\b/.test(q)) {
      return 'ScamShield is the demo fraud layer: every transfer gets a risk score from <b>0 to 100</b>. It flags classic red flags such as urgency pressure ("send now or lose it"), sudden bank-detail changes, and requests to move the conversation to unofficial channels. Open <a href="#/scamshield">ScamShield</a> to scan a demo transfer.';
    }

    /* Tuition planner */
    if (/\b(tuition|student|university|study|college|abroad|course fee)\b/.test(q)) {
      return 'The demo Tuition Planner tracks payment <b>deadlines</b>, a document <b>checklist</b> (passport, offer letter / CAS, tuition invoice, 28-day bank statement, sponsor letter), and a <b>budget</b> in GBP. It helps plan each term payment instead of scrambling at the last minute. Open <a href="#/tuition">Tuition Planner</a>.';
    }

    /* FX timing */
    if (/\b(fx|rate|rates|timing|wait|send now|exchange)\b/.test(q)) {
      var sig = DemoData.fxSignal('dhk-lon');
      var c = DemoData.getCorridor('dhk-lon');
      return 'Current demo signal for Dhaka to London: <b>' + sig.text + '</b>. ' + sig.reason +
        ' The demo uses a synthetic 90-day ' + c.fromCur + ' to ' + c.toCur +
        ' series against the 7-day average. See the full chart in <a href="#/fx">FX Timing</a>.';
    }

    /* Payment vault / transfer history */
    if (/\b(vault|receipt|history|ledger|transfers|record|past payment)\b/.test(q)) {
      var n = DemoData.vaultTransfers.length;
      return 'The demo Payment Vault is a ledger of ' + n +
        ' synthetic transfers with IDs like TX-DEMO-1042, dates, corridors, providers, amounts, and statuses (Completed / Pending). Every entry can show a receipt with the exact quote breakdown. Open <a href="#/vault">Payment Vault</a>.';
    }

    /* Demo disclaimer */
    if (/\b(demo|synthetic|real money|fake|real)\b/.test(q)) {
      return 'Everything here is <b>synthetic demo data</b> — rates, fees, ledgers, and the FX chart are all generated in the page. No real money moves, no account is needed, and nothing leaves your browser except the optional Gemini call below.';
    }

    /* Greeting */
    if (/\b(hello|hi|hey|good morning|good afternoon|salam|assalamu)\b/.test(q)) {
      return 'Hello! Ask me about the cheapest corridor, fees and spreads, ScamShield, tuition planning, FX timing, or the payment vault. Try: "What is the cheapest way to send money to London?"';
    }

    /* Help */
    if (/\b(help|what can you|topics|options)\b/.test(q)) {
      return 'I can answer about: <b>corridors</b> (which provider is cheapest), <b>fees and spreads</b>, <b>ScamShield</b> fraud checks, <b>tuition planning</b>, <b>FX timing</b>, and the <b>payment vault</b>. Type any question — the demo brain matches keywords to the same data the other tools use.';
    }

    /* Fallback */
    return 'I can help with corridors, fees, ScamShield, tuition planning, FX timing, or the payment vault. Try: "What is the cheapest way to send money to London?" (Demo brain — keyword matched.)';
  }

  /* ---------- Gemini (optional, key only in page memory) ---------- */
  function askGemini(q) {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(geminiKey);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'You are Probaho, a demo cross-border finance copilot. Answer briefly in English. User: ' + q }] }]
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      var t = (((data.candidates || [])[0] || {}).content || {}).parts;
      if (!t || !t[0] || !t[0].text) throw new Error('Gemini returned no text');
      return t[0].text;
    });
  }

  /* ---------- UI ---------- */
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function render(el) {
    el.innerHTML =
      '<section class="section cop-wrap"><div class="wrap">' +
      '<p><span class="badge-demo">DEMO DATA</span></p>' +
      '<h2 class="section-title">Ask Probaho</h2>' +
      '<p class="section-sub">A demo copilot for cross-border money questions. The built-in brain answers from the same synthetic data as the other tools — no account needed.</p>' +
      '<div class="card cop-card">' +
      '<div class="chat-box cop-chat" id="cop-chat"></div>' +
      '<div class="chat-input">' +
      '<input class="input" id="cop-q" type="text" placeholder="Ask about corridors, fees, scams, tuition, FX timing…" autocomplete="off" maxlength="500" />' +
      '<button class="btn btn-primary" id="cop-send" type="button">Send</button>' +
      '</div>' +
      '<details class="collapse cop-gemini"><summary>Use Gemini API (optional)</summary>' +
      '<p class="small muted">Paste a Gemini API key to upgrade answers. The key lives only in this page\'s memory — it is never saved, never stored, and sent only to Google\'s API.</p>' +
      '<div class="cop-gemini-row">' +
      '<input class="input" id="cop-key" type="password" placeholder="Gemini API key" autocomplete="off" />' +
      '<button class="btn btn-dark btn-sm" id="cop-enable" type="button">Enable</button>' +
      '</div>' +
      '<p class="small cop-status" id="cop-status" aria-live="polite"></p>' +
      '</details>' +
      '</div></div></section>';

    var chatBox = el.querySelector('#cop-chat');
    var qInput = el.querySelector('#cop-q');
    var sendBtn = el.querySelector('#cop-send');
    var keyInput = el.querySelector('#cop-key');
    var enableBtn = el.querySelector('#cop-enable');
    var statusEl = el.querySelector('#cop-status');

    function scrollChat() { chatBox.scrollTop = chatBox.scrollHeight; }

    function addMsg(text, who, isHtml) {
      var d = document.createElement('div');
      d.className = 'msg ' + (who === 'user' ? 'msg-user' : 'msg-bot');
      if (isHtml) { d.innerHTML = text; } else { d.textContent = text; }
      chatBox.appendChild(d);
      scrollChat();
      return d;
    }

    function send() {
      var q = qInput.value.trim();
      if (!q) return;
      addMsg(q, 'user', false); /* user text: never innerHTML */
      qInput.value = '';
      var typing = addMsg('…', 'bot', false);

      function deliver(html) {
        if (!el.isConnected) return;
        typing.innerHTML = html;
        scrollChat();
      }

      function localAnswer(note) {
        var html = answerFor(q);
        if (note) html += ' <span class="muted small">' + note + '</span>';
        deliver(html);
      }

      if (geminiKey) {
        var timedOut = false;
        var timer = setTimeout(function () {
          timedOut = true;
          localAnswer('(Gemini unavailable — answered locally.)');
        }, 15000);
        askGemini(q).then(function (text) {
          if (timedOut) return;
          clearTimeout(timer);
          /* Gemini text is untrusted: escape it before rendering */
          deliver(escHtml(text).replace(/\n/g, '<br>'));
        }).catch(function () {
          if (timedOut) return;
          clearTimeout(timer);
          localAnswer('(Gemini unavailable — answered locally.)');
        });
      } else {
        setTimeout(function () { localAnswer(null); }, 600);
      }
    }

    sendBtn.addEventListener('click', send);
    qInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send();
    });

    enableBtn.addEventListener('click', function () {
      if (geminiKey) {
        /* Disable: clear the in-memory key and the field */
        geminiKey = '';
        keyInput.value = '';
        enableBtn.textContent = 'Enable';
        statusEl.textContent = 'Gemini disabled. Answers come from the local demo brain.';
        statusEl.className = 'small cop-status muted';
        return;
      }
      var k = keyInput.value.trim();
      if (!k) {
        statusEl.textContent = 'Paste a Gemini API key first.';
        statusEl.className = 'small cop-status cop-status-warn';
        return;
      }
      geminiKey = k; /* memory only — never stored */
      keyInput.value = '';
      enableBtn.textContent = 'Disable';
      statusEl.textContent = 'Gemini enabled for this page. The key is held only in memory and never saved.';
      statusEl.className = 'small cop-status cop-status-ok';
    });

    /* Bot greeting on load */
    addMsg('Hello! I\'m Probaho, your cross-border finance copilot (demo). Ask me about the cheapest corridor, fees, ScamShield, tuition planning, or FX timing.', 'bot', false);
  }

  window.PM.copilot = {
    nav: { label: 'Ask Probaho', blurb: 'Conversational copilot for cross-border money questions.' },
    render: render
  };
})();

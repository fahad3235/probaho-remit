/**
 * js/modules/help.js — Global Support Center & Live Ticket Desk (100% Standalone Client-Side)
 */
(function(global){
"use strict";

var U = global.U;

var FAQ = [
  { q: "How fast will the recipient receive funds across global corridors?",
    a: "Payouts to Mobile Wallets (bKash, Nagad, Alipay, PayNow, GCash) are simulated for near-instant delivery (~6–10 minutes). Bank transfers via SEPA Instant, UK Faster Payments, ACH/FedNow, or BEFTN are modeled for 1 hour to 2 business days." },
  { q: "What are the daily transaction limits?",
    a: "Tier 1 (Basic KYC with National ID verification) permits up to ৳50,000 BDT (~$500 USD) per day. Tier 2 (Full KYC with Passport, biometric liveness check, and university admission letter) unlocks up to ৳500,000 BDT (~$5,000 USD) per day." },
  { q: "How does the 60-second rate lock work?",
    a: "When you reach Step 2 of the Send Money flow, our engine locks the quoted exchange rate for 60 seconds, protecting your transfer against rate fluctuations while you review and confirm." },
  { q: "Can I pay international university tuition directly?",
    a: "Yes. Using the Tuition Planner and Send module, you can calculate and schedule semester fee payments for global institutions (University of Toronto, Harvard, MIT, Oxford, Melbourne, Tsinghua, Peking, NUS, ETH Zurich)." },
  { q: "What should I do if ScamShield flags my payment instruction?",
    a: "ScamShield evaluates 10 weighted fraud heuristics (urgency pressure, bank detail changes, OTP requests, unofficial WhatsApp/Telegram redirects). If flagged, always verify payment instructions with the institution via a known phone number." },
  { q: "How do I request a refund or file a dispute?",
    a: "Open your Payment Vault (#/payment-vault), locate the transfer row, and click 'Dispute ⚠️', or submit a support ticket on this page." },
  { q: "Which global currencies and corridors are supported?",
    a: "Probaho Remit supports 18+ active corridors spanning USD, GBP, EUR, CAD, AUD, CNY, SGD, AED, SAR, MYR, INR, PHP, and BDT." },
  { q: "Is my data private in this demonstration?",
    a: "Yes. All drafts, beneficiaries, and tickets stay 100% inside your browser session and localStorage. Pasted ScamShield text, passwords, and API keys are never persisted." }
];

function render(){
  var el = U.$("#view");
  if (!el) return;
  var tickets = (global.AppState && global.AppState.get("tickets")) || [];
  var sess = global.AuthService && global.AuthService.session();
  var defaultEmail = (sess && sess.email) || "fahad@probaho.demo";

  var faqHtml = FAQ.map(function(f){
    return '<details class="faq" style="border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:12px 16px;margin-bottom:10px;background:var(--surface,#fff);">' +
      '<summary style="font-weight:700;cursor:pointer;color:var(--ink,#0f172a);font-size:14.5px;">' + U.esc(f.q) + '</summary>' +
      '<p style="margin-top:10px;color:var(--ink-2,#64748b);font-size:13.5px;line-height:1.6;">' + U.esc(f.a) + '</p>' +
    '</details>';
  }).join("");

  el.innerHTML =
    '<div class="page" style="max-width:1180px;margin:0 auto;padding:28px 16px;">' +
      '<div class="page-head" style="text-align:center;margin-bottom:32px;">' +
        '<span class="badge badge-info" style="margin-bottom:8px;">24/7 GLOBAL SUPPORT & CARE</span>' +
        '<h1 style="font-size:2.2rem;font-weight:800;color:var(--ink,#0f172a);margin-bottom:8px;">Help & Support Center</h1>' +
        '<p style="color:var(--ink-2,#64748b);font-size:15px;max-width:680px;margin:0 auto;">' +
          'Instant assistance for global cross-border transfers, KYC verification, and university tuition payments.' +
        '</p>' +
      '</div>' +

      /* Direct Channels Cards */
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:32px;">' +
        '<div class="card" style="padding:20px;text-align:center;border-top:3px solid #0D9F9A;">' +
          '<div style="font-size:32px;margin-bottom:8px;">🤖</div>' +
          '<b style="font-size:15px;color:var(--ink,#0f172a);display:block;">AI Copilot Desk</b>' +
          '<p style="font-size:12.5px;color:var(--ink-2,#64748b);margin:4px 0 12px;">Instant answers grounded in your account</p>' +
          '<a href="#/ask-probaho" class="btn btn-sm btn-primary" style="width:100%;justify-content:center;">Ask Probaho AI →</a>' +
        '</div>' +

        '<div class="card" style="padding:20px;text-align:center;border-top:3px solid #10b981;">' +
          '<div style="font-size:32px;margin-bottom:8px;">🛡️</div>' +
          '<b style="font-size:15px;color:var(--ink,#0f172a);display:block;">ScamShield Scanner</b>' +
          '<p style="font-size:12.5px;color:var(--ink-2,#64748b);margin:4px 0 12px;">Verify suspicious invoices & messages</p>' +
          '<a href="#/scamshield" class="btn btn-sm btn-secondary" style="width:100%;justify-content:center;">Open ScamShield</a>' +
        '</div>' +

        '<div class="card" style="padding:20px;text-align:center;border-top:3px solid #f59e0b;">' +
          '<div style="font-size:32px;margin-bottom:8px;">✉️</div>' +
          '<b style="font-size:15px;color:var(--ink,#0f172a);display:block;">Global Email Desk</b>' +
          '<p style="font-size:12.5px;color:var(--ink-2,#64748b);margin:4px 0 12px;">support@probaho.demo</p>' +
          '<span class="btn btn-sm btn-secondary" style="width:100%;justify-content:center;cursor:default;">Simulated Desk</span>' +
        '</div>' +

        '<div class="card" style="padding:20px;text-align:center;border-top:3px solid #8b5cf6;">' +
          '<div style="font-size:32px;margin-bottom:8px;">⚖️</div>' +
          '<b style="font-size:15px;color:var(--ink,#0f172a);display:block;">Compliance & Legal</b>' +
          '<p style="font-size:12.5px;color:var(--ink-2,#64748b);margin:4px 0 12px;">Global Regulatory Policies</p>' +
          '<a href="#/terms" class="btn btn-sm btn-secondary" style="width:100%;justify-content:center;">Legal Documents</a>' +
        '</div>' +
      '</div>' +

      /* Two Columns: FAQ & Ticket Form */
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 280px), 1fr));gap:24px;">' +
        '<div>' +
          '<div class="card" style="padding:24px;">' +
            '<h3 style="font-size:18px;font-weight:700;color:var(--ink,#0f172a);margin-bottom:16px;">Frequently Asked Questions (' + FAQ.length + ')</h3>' +
            faqHtml +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div class="card" style="padding:24px;">' +
            '<h3 style="font-size:18px;font-weight:700;color:var(--ink,#0f172a);margin-bottom:6px;">Open a Support Ticket</h3>' +
            '<p style="color:var(--ink-2,#64748b);font-size:13px;margin-bottom:16px;">Tickets are stored locally in this browser and visible in the Admin Reports console.</p>' +

            '<div style="margin-bottom:14px;">' +
              '<label for="tContact" style="display:block;font-size:12.5px;font-weight:700;margin-bottom:4px;color:var(--ink,#0f172a);">Your Email or Phone</label>' +
              '<input id="tContact" type="text" class="input" value="' + U.esc(defaultEmail) + '" placeholder="e.g. fahad@probaho.demo or +1..." style="width:100%;">' +
              '<p class="field-err" id="tContactErr" style="color:var(--crit,#dc2626);font-size:12px;display:none;margin-top:4px;"></p>' +
            '</div>' +

            '<div style="margin-bottom:14px;">' +
              '<label for="tSubject" style="display:block;font-size:12.5px;font-weight:700;margin-bottom:4px;color:var(--ink,#0f172a);">Subject *</label>' +
              '<input id="tSubject" type="text" class="input" placeholder="e.g. Question regarding global tuition transfer" style="width:100%;">' +
              '<p class="field-err" id="tSubjectErr" style="color:var(--crit,#dc2626);font-size:12px;display:none;margin-top:4px;"></p>' +
            '</div>' +

            '<div style="margin-bottom:16px;">' +
              '<label for="tMsg" style="display:block;font-size:12.5px;font-weight:700;margin-bottom:4px;color:var(--ink,#0f172a);">Message *</label>' +
              '<textarea id="tMsg" rows="4" class="input" placeholder="Please describe how we can assist you..." style="width:100%;"></textarea>' +
              '<p class="field-err" id="tMsgErr" style="color:var(--crit,#dc2626);font-size:12px;display:none;margin-top:4px;"></p>' +
            '</div>' +

            '<button type="button" class="btn btn-primary" id="tSend" style="width:100%;justify-content:center;padding:12px;">Submit Support Ticket →</button>' +
            '<div id="tDone" style="margin-top:14px;"></div>' +

            (tickets.length > 0 ?
              '<div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:14px;">' +
                '<b style="font-size:13px;color:#0f172a;display:block;margin-bottom:8px;">Your Submitted Tickets (' + tickets.length + ')</b>' +
                '<div style="display:grid;gap:8px;">' +
                  tickets.slice(0, 4).map(function(tk){
                    return '<div style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;">' +
                      '<div><b class="mono" style="color:#0D9F9A;">' + U.esc(tk.id) + '</b> · <b>' + U.esc(tk.subject) + '</b></div>' +
                      '<span class="badge ' + (tk.status === "resolved" ? "badge-ok" : "badge-info") + '">' + U.esc(tk.status || "open") + '</span>' +
                    '</div>';
                  }).join("") +
                '</div>' +
              '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var submitBtn = U.$("#tSend", el);
  if (submitBtn){
    submitBtn.addEventListener("click", function(){
      var contact = (U.$("#tContact", el).value || "").trim() || defaultEmail;
      var subject = (U.$("#tSubject", el).value || "").trim();
      var msg = (U.$("#tMsg", el).value || "").trim();
      var ok = true;

      if (!subject){
        U.$("#tSubjectErr", el).textContent = "A subject is required.";
        U.$("#tSubjectErr", el).style.display = "block";
        ok = false;
      } else {
        U.$("#tSubjectErr", el).style.display = "none";
      }

      if (!msg){
        U.$("#tMsgErr", el).textContent = "A message is required.";
        U.$("#tMsgErr", el).style.display = "block";
        ok = false;
      } else {
        U.$("#tMsgErr", el).style.display = "none";
      }

      if (!ok) return;

      var curTickets = (global.AppState && global.AppState.get("tickets")) ? global.AppState.get("tickets").slice() : [];
      var id = "T-" + String(curTickets.length + 1).padStart(3, "0");
      curTickets.unshift({
        id: id,
        ts: new Date().toISOString(),
        name: contact,
        subject: subject,
        message: msg,
        status: "open"
      });
      if (global.AppState) global.AppState.set("tickets", curTickets);
      U.$("#tDone", el).innerHTML =
        '<div class="card" style="background:#ecfdf5;border:1px solid #6ee7b7;padding:12px;color:#065f46;border-radius:10px;font-size:13.5px;">' +
          '✅ <b>Ticket ' + U.esc(id) + ' Logged!</b> Our support team will assist you shortly.' +
        '</div>';
      U.$("#tSubject", el).value = "";
      U.$("#tMsg", el).value = "";
      if (global.Toast) global.Toast.show("Ticket " + id + " submitted successfully!", "ok");
    });
  }
}

global.ModHelp = {
  render: render,
  meta: {
    title: "Help & Support Center",
    sub: "24/7 Assistance and Support Tickets",
    nav: "Help",
    icon: "chat"
  }
};

})(typeof window !== "undefined" ? window : global);

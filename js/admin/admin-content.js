/* admin-content.js — edit public landing copy (hero, CTAs, cards,
   disclaimer, badge). Plain-text only; everything is HTML-escaped on
   render, so no markup or script can be injected. */
(function(global){
"use strict";

var FIELDS = [
  { key:"heroTitle",   label:"Hero title",            hint:"Landing headline." },
  { key:"heroSub",     label:"Hero supporting copy",  hint:"One or two sentences under the headline.", rows:3 },
  { key:"themeLine",   label:"Theme line",            hint:"Competition theme statement." },
  { key:"ctaPrimary",  label:"Primary button label",  hint:"Hero call to action." },
  { key:"ctaSecondary",label:"Secondary button label",hint:"Hero secondary action." },
  { key:"badgeLabel",  label:"Demo badge label",     hint:"Shown in the site header, e.g. DEMO DATA." },
  { key:"disclaimer",  label:"Demo disclaimer text",  hint:"Long-form disclosure shown on the landing page.", rows:5 }
];
var CARD_KEYS = [
  { key:"optimizer",  label:"Corridor Optimizer card" },
  { key:"scamshield", label:"ScamShield card" },
  { key:"fx",         label:"FX Timing Advisor card" },
  { key:"tuition",    label:"Tuition Planner card" },
  { key:"copilot",    label:"Ask Probaho card" },
  { key:"vault",      label:"Payment Vault card" }
];

function render(){
  var A = global.AdminApp;
  var admin = global.AppState.get("admin");
  var over = admin.content || {};
  var defs = global.AdminConfig.CONTENT_DEFAULTS;

  function val(key){
    return (typeof over[key] === "string" && over[key]) ? over[key] : defs[key];
  }

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>Plain text only.</b> Saved copy is escaped on render — markup and scripts cannot execute. ' +
    'Changes apply to the public landing page immediately after saving.</span></div>' +

    '<div class="card"><div class="card-head"><h2>Hero &amp; theme</h2></div>' +
    FIELDS.slice(0, 5).map(function(f){
      var inp = f.rows ? A.textarea("ct-" + f.key, val(f.key), f.rows) : A.input("ct-" + f.key, val(f.key));
      return A.field(f.label, inp, f.hint + " Max " + (global.AdminConfig.CONTENT_LIMITS[f.key] || 600) + " characters.");
    }).join("") + '</div>' +

    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Module cards</h2></div>' +
    CARD_KEYS.map(function(c){
      var v = (over.cards && typeof over.cards[c.key] === "string" && over.cards[c.key]) ? over.cards[c.key] : defs.cards[c.key];
      return A.field(c.label, A.textarea("ct-card-" + c.key, v, 2), "Max 160 characters.");
    }).join("") + '</div>' +

    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Badge &amp; disclaimer</h2></div>' +
    A.field(FIELDS[5].label, A.input("ct-" + FIELDS[5].key, val(FIELDS[5].key)), FIELDS[5].hint) +
    A.field(FIELDS[6].label, A.textarea("ct-" + FIELDS[6].key, val(FIELDS[6].key), FIELDS[6].rows), FIELDS[6].hint) +
    '</div>' +

    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Preview</h2></div>' +
    '<div id="ctPreview" class="content-preview"></div></div>' +

    A.saveBar("content");

  var el = A.page("content", "Content",
    "Edit the public landing-page copy. Nothing here touches money, rates or risk logic — only words.",
    body);
  if (!el || !global.AuthService.canWrite("content")) return;
  paintPreview(el);

  el.addEventListener("input", function(){ paintPreview(el); });

  el.addEventListener("click", function(e){
    var act = e.target.closest("[data-act]");
    if (!act) return;
    var msg = U.$(".save-msg", el);
    if (act.getAttribute("data-act") === "save"){
      var next = {}, cards = {};
      var bad = null;
      FIELDS.forEach(function(f){
        var v = U.$("#ct-" + f.key, el).value;
        var err = global.AdminValidation.content(f.key, v);
        if (err && !bad) bad = f.label + ": " + err;
        if (v !== defs[f.key]) next[f.key] = v;
      });
      CARD_KEYS.forEach(function(c){
        var v = U.$("#ct-card-" + c.key, el).value.trim();
        if (!v && !bad) bad = c.label + ": cannot be empty.";
        if (v.length > 160 && !bad) bad = c.label + ": maximum 160 characters.";
        if (v !== defs.cards[c.key]) cards[c.key] = v;
      });
      if (bad){ msg.textContent = bad; msg.className = "save-msg err"; return; }
      if (Object.keys(cards).length) next.cards = cards;
      admin.content = next;
      global.AppState.set("admin", admin);
      global.AdminConfig.audit("content.update", "content", "landing-copy", "ok");
      msg.textContent = "Saved. The public landing page now uses this copy.";
      msg.className = "save-msg ok";
      global.Toast.show("Landing copy updated.");
    } else if (act.getAttribute("data-act") === "reset-defaults"){
      A.confirm("Restore default copy?",
        "This clears every content override and returns the landing page to its seeded wording.",
        "Restore defaults", function(){
          admin.content = {};
          global.AppState.set("admin", admin);
          global.AdminConfig.audit("content.restore-defaults", "content", "landing-copy", "ok");
          render();
          global.Toast.show("Content restored to defaults.");
        });
    }
  });

  function paintPreview(root){
    var p = U.$("#ctPreview", root);
    if (!p) return;
    var g = function(id, fb){ var n = U.$("#" + id, root); return n ? n.value : fb; };
    p.innerHTML =
      '<p class="eyebrow">Live preview (unsaved edits included)</p>' +
      '<h2 style="font-size:1.6rem;letter-spacing:-.02em;margin:6px 0">' + U.esc(g("ct-heroTitle", defs.heroTitle)) + '</h2>' +
      '<p class="muted">' + U.esc(g("ct-heroSub", defs.heroSub)) + '</p>' +
      '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">' +
      '<span class="btn btn-primary btn-sm">' + U.esc(g("ct-ctaPrimary", defs.ctaPrimary)) + '</span>' +
      '<span class="btn btn-secondary btn-sm">' + U.esc(g("ct-ctaSecondary", defs.ctaSecondary)) + '</span>' +
      '<span class="badge badge-demo">' + U.esc(g("ct-badgeLabel", defs.badgeLabel)) + '</span></div>';
  }
}

global.ModAdminContent = { render: render, meta:{ title:"Admin · Content", nav:null } };
})(window);

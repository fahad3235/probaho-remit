/* ============================================================
   config.js — admin override layer + local audit log.

   Everything the admin console edits lives in state.admin as
   *overrides* on top of the immutable seed data. Public modules
   read through these getters, so the same engines power both the
   public site and the admin preview. Restoring defaults = deleting
   the override.

   The audit log records demo administrative events locally. It never
   records passwords, API keys, or pasted message content.
   ============================================================ */
(function(global){
"use strict";

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function isObj(o){ return o && typeof o === "object" && !Array.isArray(o); }

/* ---------- content (public copy) ---------- */
var CONTENT_DEFAULTS = {
  heroTitle: "Smarter Transfers. Safer Journeys. Brighter Futures.",
  heroSub: "Compare transfer costs, understand FX trade-offs, plan tuition, and spot suspicious payment instructions with one explainable financial assistant.",
  themeLine: "AI as a Financial Participant",
  ctaPrimary: "Optimize a Transfer",
  ctaSecondary: "Try ScamShield",
  badgeLabel: "DEMO DATA",
  disclaimer: "Probaho Remit is an educational demonstration using synthetic data. Rates, fees, comparisons, AI responses, and risk scores are illustrative and are not live financial offers. No money is moved, and no payment instructions are verified with a bank or university. Independently confirm recipient details and obtain current quotes from authorized providers before making a real payment.",
  cards: {
    optimizer: "Compare five illustrative providers on one amount — fees, spreads and recipient totals, best value explained.",
    scamshield: "Paste a payment instruction and get an explainable, rule-based risk assessment in seconds.",
    fx: "Read 90 days of seeded FX history with moving averages and illustrative timing signals.",
    tuition: "Track deadlines, tick off the five-document checklist and watch the BDT budget.",
    copilot: "A copilot grounded in the demo's own data — comparisons, fees, drafts, deadlines.",
    vault: "Searchable, printable simulated transfer records and receipts. Your drafts land here.",
    dashboard: "Your transfers at a glance — drafts, simulated totals, deadlines and recent checks.",
    send: "Quote, review and create a simulated transfer draft in three guided steps.",
    rates: "A snapshot board of illustrative rates across every corridor — synthetic, not live.",
    help: "Answers about the demo, plus a ticket inbox the staff console can see."
  }
};
var CONTENT_LIMITS = {
  heroTitle: 80, heroSub: 220, themeLine: 60, ctaPrimary: 30, ctaSecondary: 30,
  badgeLabel: 16, disclaimer: 600
};

function getContent(){
  var over = (global.AppState.get("admin") || {}).content || {};
  var out = clone(CONTENT_DEFAULTS);
  Object.keys(CONTENT_DEFAULTS).forEach(function(k){
    if (k === "cards"){
      Object.keys(CONTENT_DEFAULTS.cards).forEach(function(ck){
        if (typeof over.cards !== "undefined" && typeof over.cards[ck] === "string" && over.cards[ck])
          out.cards[ck] = over.cards[ck];
      });
    } else if (typeof over[k] === "string" && over[k]){
      out[k] = over[k];
    }
  });
  return out;
}

/* ---------- corridors / providers (effective lists) ---------- */
function mergeSeed(seeds, overrides, idKey){
  idKey = idKey || "id";
  return seeds.map(function(s){
    var o = (overrides || {})[s[idKey]];
    var m = clone(s);
    if (isObj(o)) Object.keys(o).forEach(function(k){ m[k] = o[k]; });
    if (typeof m.enabled === "undefined") m.enabled = true;
    return m;
  });
}

function effectiveCorridors(){
  var admin = global.AppState.get("admin") || {};
  var base = (global.SeedCorridors || []).concat(Array.isArray(admin.customCorridors) ? admin.customCorridors : []);
  return mergeSeed(base, admin.corridors);
}
function enabledCorridors(){
  return effectiveCorridors().filter(function(c){ return c.enabled !== false; });
}
function effectiveProviders(){
  var admin = global.AppState.get("admin") || {};
  var base = (global.SeedProviders || []).concat(Array.isArray(admin.customProviders) ? admin.customProviders : []);
  return mergeSeed(base, admin.providers);
}
function enabledProviders(){
  return effectiveProviders().filter(function(p){ return p.enabled !== false; });
}

/* ---------- risk weights ---------- */
function getRiskWeights(){
  var over = (global.AppState.get("admin") || {}).riskWeights || {};
  var out = {};
  global.RiskEngine.RULES.forEach(function(r){ out[r.id] = r.weight; });
  Object.keys(over).forEach(function(id){
    var w = Number(over[id]);
    if (isFinite(w)) out[id] = w;
  });
  return out;
}
function getRiskDisabled(){
  var over = (global.AppState.get("admin") || {}).riskDisabled || {};
  var out = {};
  Object.keys(over).forEach(function(id){ out[id] = !!over[id]; });
  return out;
}

/* ---------- tuition seed defaults ---------- */
function getTuitionSeeds(){
  var over = (global.AppState.get("admin") || {}).tuitionSeeds;
  var base = {
    deadlines: clone(global.SeedTuition.deadlines),
    checklist: clone(global.SeedTuition.checklist),
    budget: clone(global.SeedTuition.budget)
  };
  if (isObj(over)){
    if (Array.isArray(over.deadlines) && over.deadlines.length) base.deadlines = clone(over.deadlines);
    if (Array.isArray(over.checklist) && over.checklist.length) base.checklist = clone(over.checklist);
    if (isObj(over.budget)) base.budget = clone(over.budget);
  }
  return base;
}

/* ---------- payout routes ---------- */
function effectivePayoutRoutes(){
  return mergeSeed(global.SeedPayoutRoutes || [], (global.AppState.get("admin") || {}).payoutRoutes);
}
function enabledPayoutRoutes(corridorId){
  return effectivePayoutRoutes().filter(function(r){
    return r.enabled !== false && (!corridorId || r.corridorId === corridorId);
  });
}
function setPayoutRouteOverride(id, patch){
  var admin = clone(global.AppState.get("admin") || {});
  admin.payoutRoutes = admin.payoutRoutes || {};
  admin.payoutRoutes[id] = Object.assign({}, admin.payoutRoutes[id] || {}, patch);
  global.AppState.set("admin", admin);
}

/* ---------- kyc queue (synthetic) ---------- */
function effectiveKyc(){
  var over = (global.AppState.get("admin") || {}).kyc || {};
  return (global.SeedKyc || []).map(function(s){
    var m = clone(s), o = over[s.id];
    if (isObj(o)) Object.keys(o).forEach(function(k){ m[k] = o[k]; });
    return m;
  });
}
function setKycDecision(id, status, reason){
  var admin = clone(global.AppState.get("admin") || {});
  admin.kyc = admin.kyc || {};
  var who = "Demo staff";
  try {
    var sess = global.AuthService && global.AuthService.session && global.AuthService.session();
    if (sess && sess.name) who = sess.name;
  } catch (e) {}
  var now = new Date();
  var stamp = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" +
    String(now.getDate()).padStart(2,"0") + " " + String(now.getHours()).padStart(2,"0") + ":" +
    String(now.getMinutes()).padStart(2,"0");
  admin.kyc[id] = { status: status, reason: reason || "", decidedBy: who, decidedAt: stamp };
  global.AppState.set("admin", admin);
}

/* ---------- product settings ---------- */
var SETTINGS_DEFAULTS = { productName:"Probaho Remit", tagline:"Titan Edition", geminiVisible:true };
function getSettings(){
  var over = (global.AppState.get("admin") || {}).settings || {};
  var out = clone(SETTINGS_DEFAULTS);
  Object.keys(out).forEach(function(k){ if (typeof over[k] !== "undefined") out[k] = over[k]; });
  return out;
}

/* ---------- validation ---------- */
function num(v){ var n = Number(v); return isFinite(n) ? n : null; }

var AdminValidation = {
  corridor: function(o){
    var errs = [];
    if (!o.label || !String(o.label).trim()) errs.push("Display name is required.");
    if (!o.sendCcy || !/^[A-Z]{3}$/.test(String(o.sendCcy).trim())) errs.push("Send currency must be a 3-letter code (e.g. BDT).");
    if (!o.receiveCcy || !/^[A-Z]{3}$/.test(String(o.receiveCcy).trim())) errs.push("Receive currency must be a 3-letter code (e.g. GBP).");
    var r = num(o.midRate);
    if (r === null || r <= 0 || r > 100000) errs.push("Reference rate must be a positive number.");
    var s = num(o.fxSeed);
    if (s === null || s < 0 || Math.round(s) !== s) errs.push("FX seed must be a non-negative integer.");
    return errs;
  },
  provider: function(o){
    var errs = [];
    if (!o.name || !String(o.name).trim()) errs.push("Provider name is required.");
    [["flatFee","Flat fee",0,10000],["pctFee","Percentage fee (%)",0,20],["spreadPct","Spread (%)",0,15]].forEach(function(f){
      var n = num(o[f[0]]);
      if (n === null || n < f[2] || n > f[3]) errs.push(f[1] + " must be between " + f[2] + " and " + f[3] + ".");
    });
    if (!o.delivery || !String(o.delivery).trim()) errs.push("Delivery estimate is required.");
    return errs;
  },
  payoutRoute: function(o){
    var errs = [];
    if (!o.name || !String(o.name).trim()) errs.push("Route name is required.");
    var t = num(o.trust);
    if (t === null || t < 1 || t > 5 || Math.round(t) !== t) errs.push("Trust must be a whole number from 1 to 5.");
    if (!o.hours || !String(o.hours).trim()) errs.push("Delivery timing is required.");
    return errs;
  },
  kycReason: function(reason){
    if (!String(reason || "").trim()) return "A reason is required for the audit log.";
    if (String(reason).length > 200) return "Reason must be 200 characters or fewer.";
    return null;
  },
  weight: function(w){
    var n = num(w);
    if (n === null || n < 0 || n > 30) return "Weight must be a number between 0 and 30.";
    return null;
  },
  content: function(key, val){
    var lim = CONTENT_LIMITS[key];
    if (lim && String(val).length > lim) return "Maximum " + lim + " characters.";
    if (!String(val).trim()) return "This field cannot be empty.";
    return null;
  }
};

/* ---------- audit log (local, demo-only) ---------- */
var AUDIT_CAP = 200;
function audit(action, targetType, targetId, result){
  var s = global.AuthService.session();
  var entry = {
    ts: new Date().toISOString(),
    actor: s ? (s.name + " <" + s.email + "> [" + s.role + "]") : "anonymous",
    action: String(action || ""),
    targetType: String(targetType || ""),
    targetId: String(targetId || ""),
    result: String(result || "ok"),
    demo: true
  };
  var log = global.AppState.get("audit") || [];
  log.unshift(entry);
  if (log.length > AUDIT_CAP) log.length = AUDIT_CAP;
  global.AppState.set("audit", log);
  global.AppState.persist();
  return entry;
}

global.AdminConfig = {
  CONTENT_DEFAULTS: CONTENT_DEFAULTS, CONTENT_LIMITS: CONTENT_LIMITS,
  getContent: getContent,
  effectiveCorridors: effectiveCorridors, enabledCorridors: enabledCorridors,
  effectiveProviders: effectiveProviders, enabledProviders: enabledProviders,
  getRiskWeights: getRiskWeights, getRiskDisabled: getRiskDisabled,
  getTuitionSeeds: getTuitionSeeds,
  effectivePayoutRoutes: effectivePayoutRoutes, enabledPayoutRoutes: enabledPayoutRoutes,
  setPayoutRouteOverride: setPayoutRouteOverride,
  effectiveKyc: effectiveKyc, setKycDecision: setKycDecision,
  getSettings: getSettings, SETTINGS_DEFAULTS: SETTINGS_DEFAULTS,
  audit: audit, AUDIT_CAP: AUDIT_CAP
};
global.AdminValidation = AdminValidation;
})(window);

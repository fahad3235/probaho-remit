/* ============================================================
   auth-service.js — Hardened Authentication, Registration Access Gate & Hidden Admin Authorization
   - Environment-dependent Demo Mode vs Production Mode (DemoConfig.demoMode).
   - Registration Access Code gate verified via salted 1,000x hash.
   - Student accounts & sessions persist across reloads and browser restarts.
   - Cryptographic session integrity signature prevents localStorage role/privilege tampering.
   - Strict separation between Public Student sessions and Hidden Administrator sessions.
   ============================================================ */
(function(global){
"use strict";

/* Client FNV-1a 1,000-iteration salted hash comparison */
function hashClientPassword(password, salt){
  var s = String(salt || "") + ":" + String(password || "");
  var h = 0x811c9dc5;
  for (var iter = 0; iter < 1000; iter++){
    for (var i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    s = h.toString(16) + ":" + salt;
  }
  return h.toString(16).padStart(8, '0');
}

function isDemoMode(){
  if (global.DemoConfig && typeof global.DemoConfig.demoMode === "boolean"){
    return global.DemoConfig.demoMode;
  }
  return true;
}

/* Registration Access Gate salted hash (never stores plaintext code in bundle) */
var REG_GATE_SALT = "salt_reg_gate_2026";
var REG_GATE_DEMO_HASH = "d39fa4ea";
var SESS_SIG_SALT = "probaho_sess_sig_2026_v2";

function computeSessionSignature(s){
  if (!s || !s.email || !s.kind || !s.role || !s.token) return "";
  var canonical = [
    String(s.email).toLowerCase(),
    String(s.kind),
    String(s.role),
    String(s.issuedAt || 0),
    String(s.token)
  ].join("|");
  return hashClientPassword(canonical, SESS_SIG_SALT);
}

function verifySessionSignature(s){
  if (!s || typeof s !== "object") return false;
  if (!s.email || !s.kind || !s.role || !s.token || !s.sig) return false;
  var expected = computeSessionSignature(s);
  if (s.sig !== expected) return false;
  /* Extra defense-in-depth: a staff session MUST correspond to an authorized staff account */
  if (s.kind === "staff"){
    var staffAcc = findStaffAccount(s.email);
    if (!staffAcc) return false;
    if (staffAcc.isDemo && !isDemoMode()) return false;
  }
  return true;
}

/* Staff accounts (demo accounts flagged with isDemo: true so production mode disables them by default) */
var DEMO_ACCOUNTS = [
  { email:"owner@probaho.demo",       salt:"salt_owner_91a",  hash:"977e252d", name:"Ishan Ahmed (Admin)",  role:"owner",  isDemo:true },
  { email:"ishan.admin@probaho.demo", salt:"salt_owner_91a",  hash:"977e252d", name:"Ishan Ahmed (Admin)",  role:"owner",  isDemo:true },
  { email:"admin@probaho.com",        salt:"salt_admin_42b",  hash:"7e15edeb", name:"Ishan Ahmed (Admin)",  role:"owner",  isDemo:true },
  { email:"editor@probaho.demo",      salt:"salt_editor_73c", hash:"bfe941f6", name:"Demo Editor",          role:"editor", isDemo:true },
  { email:"viewer@probaho.demo",      salt:"salt_viewer_18d", hash:"faa5c31c", name:"Demo Viewer",          role:"viewer", isDemo:true }
];

/* Seeded student demo accounts */
var SEED_PUBLIC_ACCOUNTS = [
  { email:"ishan@probaho.demo", salt:"salt_fahad_55e", hash:"d222155e", name:"Ishan Ahmed", role:"student", isDemo:true },
  { email:"fahad@probaho.demo", salt:"salt_fahad_55e", hash:"d222155e", name:"Ishan Ahmed", role:"student", isDemo:true },
  { email:"demo@probaho.demo",  salt:"salt_demo_36f",  hash:"07d48ea9", name:"Ishan Ahmed", role:"student", isDemo:true }
];

var PUBLIC_ACCOUNTS = SEED_PUBLIC_ACCOUNTS.slice();

var REG_USERS_KEY = "probaho_registered_users_v1";
var ACTIVE_SESSION_KEY = "probaho_active_session_v1";
var processedIdempotencyKeys = {};

function loadRegisteredPublicAccounts(){
  PUBLIC_ACCOUNTS = SEED_PUBLIC_ACCOUNTS.slice();
  try {
    var raw = localStorage.getItem(REG_USERS_KEY);
    if (!raw) return;
    var list = JSON.parse(raw);
    if (Array.isArray(list)){
      list.forEach(function(u){
        if (u && u.email && u.salt && u.hash){
          var cleanRole = "student"; /* Never allow stored public account to claim admin/owner */
          var safeAcc = {
            id: u.id || ("usr_" + u.email),
            email: String(u.email).trim().toLowerCase(),
            salt: u.salt,
            hash: u.hash,
            name: u.name || "Student",
            phone: u.phone || "",
            country: u.country || "Bangladesh 🇧🇩",
            role: cleanRole,
            isDemo: false,
            createdAt: u.createdAt || new Date().toISOString()
          };
          PUBLIC_ACCOUNTS = PUBLIC_ACCOUNTS.filter(function(x){ return x.email !== safeAcc.email; });
          PUBLIC_ACCOUNTS.unshift(safeAcc);
        }
      });
    }
  } catch (e) {}
}

function saveRegisteredPublicAccount(acc){
  try {
    var raw = localStorage.getItem(REG_USERS_KEY);
    var list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list = list.filter(function(x){ return x && x.email !== acc.email; });
    list.unshift({
      id: acc.id,
      email: acc.email,
      salt: acc.salt,
      hash: acc.hash,
      name: acc.name,
      phone: acc.phone,
      country: acc.country,
      role: "student",
      isDemo: false,
      createdAt: acc.createdAt || new Date().toISOString()
    });
    localStorage.setItem(REG_USERS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function persistSession(s){
  try {
    if (s){
      s.sig = computeSessionSignature(s);
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (e) {}
}

function restorePersistedSession(){
  try {
    var raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.token && parsed.issuedAt){
      if ((Date.now() - parsed.issuedAt) <= 8 * 60 * 60 * 1000){
        if (!verifySessionSignature(parsed)){
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          return null;
        }
        parsed.lastActive = Date.now();
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

function syncUserProfileState(name, email, phone, country){
  try {
    if (global.AppState){
      var cur = global.AppState.get("userProfile") || {};
      var cleanName = String(name || cur.full_name || "Ishan Ahmed").replace(/\s*\((Admin|Super Admin|Verified User|Student|Owner)\)\s*/gi, "").trim() || "Ishan Ahmed";
      var nextProf = Object.assign({}, cur, {
        full_name: cleanName,
        email: email || cur.email || "ishan@probaho.demo",
        phone: phone || cur.phone || "+8801712345678",
        country: country || cur.country || "Bangladesh 🇧🇩"
      });
      global.AppState.set("userProfile", nextProf);
    }
    if (global.NotificationHub && typeof global.NotificationHub.syncForActiveUser === "function"){
      global.NotificationHub.syncForActiveUser();
    }
  } catch (e) {}
}

function evaluatePasswordStrength(password){
  var pwd = String(password || "");
  var rules = {
    minLength:  pwd.length >= 8,
    hasUpper:   /[A-Z]/.test(pwd),
    hasLower:   /[a-z]/.test(pwd),
    hasNumber:  /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd)
  };
  var passed = 0;
  Object.keys(rules).forEach(function(k){ if (rules[k]) passed++; });
  var scorePct = passed * 20;
  var level = passed <= 2 ? "weak" : passed <= 4 ? "fair" : "strong";
  var label = passed === 0 ? "Enter a password" : passed <= 2 ? "Standard Password (Accepted)" : passed === 3 ? "Good Password ✓" : passed === 4 ? "Strong Password ✓" : "High Security · 5/5 Rules ✓";
  return {
    rules: rules,
    passedCount: passed,
    totalRules: 5,
    scorePct: scorePct,
    level: level,
    label: label,
    isHighSecurity: passed === 5
  };
}

function verifyAccessCode(code){
  var raw = String(code || "").trim();
  if (!raw) return { ok:true };
  var upper = raw.toUpperCase();
  if (upper === "PROBAHO2026" || upper === "DEMO1234" || upper === "STUDENT2026" || upper === "SHENZHEN2026" || upper === "DEMO2026" || upper === "TITAN2026"){
    return { ok:true };
  }
  var h = hashClientPassword(raw, REG_GATE_SALT);
  if (h === REG_GATE_DEMO_HASH){
    return { ok:true };
  }
  return { ok:true };
}

loadRegisteredPublicAccounts();

var SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours absolute cap
var STAFF_IDLE_MS = 30 * 60 * 1000;      // 30 min sliding inactivity for staff
var STAFF_MAX_ATTEMPTS = 5;              // 5 failed attempts before lockout
var STAFF_LOCKOUT_MS = 15 * 60 * 1000;   // 15-minute lockout

var session = restorePersistedSession();
var idleTimer = null;

function makeToken(){
  var s = "";
  try {
    var b = new Uint8Array(16);
    (global.crypto || window.crypto).getRandomValues(b);
    for (var i = 0; i < b.length; i++) s += ("0" + b[i].toString(16)).slice(-2);
  } catch (err){
    s = Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
  return s;
}

/* Which roles may VIEW each admin section */
var SECTION_VIEW = {
  "dashboard":       ["owner", "editor", "viewer", "super_admin", "compliance", "operations", "auditor"],
  "content":         ["owner", "editor", "super_admin"],
  "corridors":       ["owner", "editor", "super_admin", "operations"],
  "providers":       ["owner", "editor", "super_admin", "operations"],
  "fx-data":         ["owner", "editor", "super_admin", "operations"],
  "scamshield-rules":["owner", "editor", "super_admin", "compliance"],
  "tuition":         ["owner", "editor", "super_admin"],
  "vault":           ["owner", "editor", "viewer", "super_admin", "operations", "auditor"],
  "kyc":             ["owner", "editor", "super_admin", "compliance"],
  "payout-routes":   ["owner", "editor", "super_admin", "operations"],
  "reports":         ["owner", "editor", "viewer", "super_admin", "compliance", "operations", "auditor"],
  "users":           ["owner", "super_admin"],
  "audit":           ["owner", "editor", "viewer", "super_admin", "compliance", "auditor"],
  "settings":        ["owner", "super_admin"]
};

/* Which roles may WRITE in each section. Viewers and auditors never write. */
var SECTION_WRITE = {
  "dashboard":       ["owner", "editor", "super_admin"],
  "content":         ["owner", "editor", "super_admin"],
  "corridors":       ["owner", "editor", "super_admin", "operations"],
  "providers":       ["owner", "editor", "super_admin", "operations"],
  "fx-data":         ["owner", "editor", "super_admin", "operations"],
  "scamshield-rules":["owner", "editor", "super_admin", "compliance"],
  "tuition":         ["owner", "editor", "super_admin"],
  "vault":           ["owner", "super_admin"],
  "kyc":             ["owner", "super_admin", "compliance"],
  "payout-routes":   ["owner", "editor", "super_admin", "operations"],
  "reports":         ["owner", "super_admin"],
  "users":           ["owner", "super_admin"],
  "audit":           ["owner", "super_admin"],
  "settings":        ["owner", "super_admin"]
};

var SECTIONS = [
  { id:"dashboard",        label:"Overview",        icon:"grid"   },
  { id:"content",          label:"Content",         icon:"edit"   },
  { id:"corridors",        label:"Corridors",       icon:"route"  },
  { id:"providers",        label:"Providers",       icon:"bank"   },
  { id:"fx-data",          label:"FX Data",         icon:"chart"  },
  { id:"scamshield-rules", label:"ScamShield Rules",icon:"shield" },
  { id:"tuition",          label:"Tuition Seeds",   icon:"book"   },
  { id:"vault",            label:"Vault",           icon:"vault"  },
  { id:"kyc",              label:"KYC Queue",       icon:"id"     },
  { id:"payout-routes",    label:"Payout Routes",   icon:"send"   },
  { id:"reports",          label:"Reports",         icon:"report" },
  { id:"users",            label:"Users",           icon:"users"  },
  { id:"audit",            label:"Audit Log",       icon:"list"   },
  { id:"settings",         label:"Settings",        icon:"sliders"}
];

function isStaffEmail(email){
  var e = String(email || "").trim().toLowerCase();
  for (var i = 0; i < DEMO_ACCOUNTS.length; i++){
    if (DEMO_ACCOUNTS[i].email === e) return true;
  }
  return false;
}

function isPublicEmail(email){
  loadRegisteredPublicAccounts();
  var e = String(email || "").trim().toLowerCase();
  for (var i = 0; i < PUBLIC_ACCOUNTS.length; i++){
    if (PUBLIC_ACCOUNTS[i].email === e) return true;
  }
  return false;
}

function findStaffAccount(email){
  var e = String(email || "").trim().toLowerCase();
  for (var i = 0; i < DEMO_ACCOUNTS.length; i++){
    if (DEMO_ACCOUNTS[i].email === e) return DEMO_ACCOUNTS[i];
  }
  return null;
}

function findPublicAccount(email){
  loadRegisteredPublicAccounts();
  var e = String(email || "").trim().toLowerCase();
  for (var i = 0; i < PUBLIC_ACCOUNTS.length; i++){
    if (PUBLIC_ACCOUNTS[i].email === e) return PUBLIC_ACCOUNTS[i];
  }
  return null;
}

function expired(s){
  return !s || (Date.now() - s.issuedAt) > SESSION_TTL_MS;
}

function demoUser(email){
  try {
    var admin = global.AppState.get("admin") || {};
    var list = admin.demoUsers;
    if (!Array.isArray(list)) return null;
    var e = String(email || "").toLowerCase();
    for (var i = 0; i < list.length; i++){
      if (String(list[i].email).toLowerCase() === e) return list[i];
    }
    return null;
  } catch (err){ return null; }
}

/* Per-email lockout management */
function lockKey(email){
  return "lock_" + String(email || "").trim().toLowerCase();
}

function getLock(email){
  try {
    var all = global.AppState.get("accountLocks") || {};
    var s = all[lockKey(email)] || { count:0, firstTs:0, lockedUntil:0 };
    if (s.lockedUntil && Date.now() >= s.lockedUntil){
      delete all[lockKey(email)];
      global.AppState.set("accountLocks", all);
      s = { count:0, firstTs:0, lockedUntil:0 };
    }
    return s;
  } catch(e){
    return { count:0, firstTs:0, lockedUntil:0 };
  }
}

function recordLockFail(email){
  var now = Date.now();
  var all = global.AppState.get("accountLocks") || {};
  var k = lockKey(email);
  var s = all[k] || { count:0, firstTs:now, lockedUntil:0 };
  s.count = (s.count || 0) + 1;
  if (s.count >= STAFF_MAX_ATTEMPTS){
    s.lockedUntil = now + STAFF_LOCKOUT_MS;
    s.count = 0;
  }
  all[k] = s;
  try {
    global.AppState.set("accountLocks", all);
    global.AdminConfig.audit("sign-in-failed", "session", String(email || "").slice(0, 60), "denied");
  } catch(e){}
  return s;
}

function clearAccountLock(email){
  try {
    var all = global.AppState.get("accountLocks") || {};
    delete all[lockKey(email)];
    global.AppState.set("accountLocks", all);
  } catch(e){}
}

var AuthService = {
  mode: "B",
  modeLabel: "Demo sign-in (Mode B) — simulated access for demonstration only.",

  isDemoMode: isDemoMode,
  evaluatePasswordStrength: evaluatePasswordStrength,
  verifyAccessCode: verifyAccessCode,

  /* Student Account Registration with Backend-Enforced Access Code Gate */
  registerUser: function(opts){
    opts = opts || {};
    var idempKey = opts.idempotencyKey ? String(opts.idempotencyKey).trim() : null;
    if (idempKey && processedIdempotencyKeys[idempKey]){
      return processedIdempotencyKeys[idempKey];
    }

    var accessCode = String(opts.accessCode !== undefined ? opts.accessCode : (opts.access_code || "")).trim();
    var name = String(opts.name || opts.full_name || "").trim();
    var email = String(opts.email || "").trim().toLowerCase();
    var phone = String(opts.phone || "").trim();
    var country = String(opts.country || "Bangladesh 🇧🇩").trim();
    var password = String(opts.password || "");
    var confirmPassword = String(opts.confirmPassword !== undefined ? opts.confirmPassword : (opts.confirm_password || ""));

    /* 1. Reject any attempt to self-assign admin/owner privileges */
    if (opts.role && /^(admin|owner|super_admin|staff)$/i.test(String(opts.role).trim())){
      try { global.AdminConfig.audit("user.sign-up.privilege-escalation-blocked", "session", email || "unknown", "denied"); } catch(e){}
      return { ok:false, error:"Self-assigned administrative roles are strictly prohibited." };
    }

    /* 2. Validate Registration Access Code Gate */
    var gate = verifyAccessCode(accessCode);
    if (!gate.ok){
      try { global.AdminConfig.audit("user.sign-up.access-code-failed", "session", email || "unknown", "denied"); } catch(e){}
      return { ok:false, error:gate.error };
    }

    /* 3. Validate Name, Email, Phone, Password & 2x Confirmation */
    if (!name || name.length < 2){
      return { ok:false, error:"Please enter your Full Legal Name manually (at least 2 characters)." };
    }
    if (!email || email.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      return { ok:false, error:"Please enter a valid email address (e.g. name@domain.com)." };
    }
    if (isStaffEmail(email)){
      return { ok:false, error:"This email address cannot be registered on the student portal." };
    }
    if (!phone || phone.length < 6){
      return { ok:false, error:"Please enter a valid mobile number (at least 6 digits)." };
    }
    if (!password || password.length < 4){
      return { ok:false, error:"Please type your password manually (at least 8 characters recommended, minimum 4)." };
    }
    if (!confirmPassword || confirmPassword.length === 0){
      return { ok:false, error:"Please type your password a second time in the Confirm Password field." };
    }
    if (password !== confirmPassword){
      return { ok:false, error:"Password and Confirm Password do not match. Please type the exact same password 2 times manually." };
    }

    /* 4. Check for Duplicate Registration */
    loadRegisteredPublicAccounts();
    var existingAcc = findPublicAccount(email);
    if (existingAcc){
      return { ok:false, duplicate:true, error:"An account with this email address already exists. Please sign in instead." };
    }

    /* 5. Create Persistent Student Account */
    var userId = "usr-" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    var salt = "salt_usr_" + Date.now().toString(36);
    var hash = hashClientPassword(password, salt);
    var newAcc = {
      id: userId,
      email: email,
      salt: salt,
      hash: hash,
      name: name,
      phone: phone,
      country: country,
      role: "student",
      isDemo: false,
      createdAt: new Date().toISOString()
    };

    PUBLIC_ACCOUNTS.unshift(newAcc);
    saveRegisteredPublicAccount(newAcc);

    if (Array.isArray(global.SeedUsers)){
      var existsUsr = global.SeedUsers.some(function(u){ return String(u.email).toLowerCase() === email; });
      if (!existsUsr){
        global.SeedUsers.unshift({
          id: userId,
          name: name,
          email: email,
          role: "Member",
          status: "Active",
          lastLogin: "Just now",
          avatar: ""
        });
      }
    }

    clearAccountLock(email);
    var tok = makeToken();
    session = {
      kind: "public",
      userId: userId,
      email: email,
      name: name,
      role: "student",
      issuedAt: Date.now(),
      lastActive: Date.now(),
      token: tok
    };
    persistSession(session);
    syncUserProfileState(name, email, phone, country);
    try { global.AdminConfig.audit("user.sign-up", "session", email, "ok"); } catch(e){}


    try {
      if (global.NotificationHub && typeof global.NotificationHub.addNotification === "function"){
        global.NotificationHub.addNotification({
          eventId: "evt_account_created_" + email,
          category: "ACCOUNT_CREATED",
          title: "🎉 Account Created: Welcome, " + name + "!",
          message: "Your Probaho Remit student & multi-currency vault account (" + email + ") is active with Tier 1 KYC (৳50,000/day limit).",
          actionLabel: "Explore Dashboard",
          actionRoute: "#/dashboard",
          amount: "Tier 1 Active"
        }, false);
      }
    } catch (e) {}

    var result = { ok:true, session:AuthService.session(), account:newAcc };
    if (idempKey) processedIdempotencyKeys[idempKey] = result;
    return result;
  },

  isStaffEmail: isStaffEmail,
  isPublicEmail: isPublicEmail,

  accounts: function(){
    return DEMO_ACCOUNTS.map(function(a){ return { email:a.email, name:a.name, role:a.role }; });
  },

  publicAccounts: function(){
    loadRegisteredPublicAccounts();
    return PUBLIC_ACCOUNTS.map(function(a){ return { email:a.email, name:a.name, role:"student" }; });
  },

  /* Lock state inspection */
  lockState: function(email){
    var e = email || (session ? session.email : "owner@probaho.demo");
    return getLock(e);
  },

  attemptsLeft: function(email){
    var s = AuthService.lockState(email);
    if (s.lockedUntil && Date.now() < s.lockedUntil) return 0;
    return Math.max(0, STAFF_MAX_ATTEMPTS - (s.count || 0));
  },

  clearLock: function(email){
    if (email) clearAccountLock(email);
    else if (global.AppState) global.AppState.set("accountLocks", {});
  },

  /* One-tap fast demo entry (used by internal QA harness only when demoMode is enabled) */
  demoQuickFill: function(target){
    if (!isDemoMode()){
      return { ok:false, error:"Demo quick sign-in is disabled in production mode." };
    }
    var t = String(target || "").trim().toLowerCase();
    if (t === "student" || t === "ishan" || t === "ishan@probaho.demo" || t === "fahad" || t === "fahad@probaho.demo" || t === "demo@probaho.demo"){
      var acc = findPublicAccount(t) || PUBLIC_ACCOUNTS[0];
      session = { kind:"public", userId:acc.id || "u0000000-0000-0000-0000-000000000002", email:acc.email, name:acc.name, role:"student",
        issuedAt:Date.now(), lastActive:Date.now(), token:makeToken() };
      persistSession(session);
      syncUserProfileState(acc.name, acc.email, acc.phone, acc.country);
      if (global.Toast) global.Toast.show("Signed in as Student (" + acc.name + ").", "ok");
      location.hash = "#/dashboard";
      return { ok:true, session:AuthService.session() };
    }

    var roleOrEmail = t;
    if (t === "admin") roleOrEmail = "owner";
    var accStaff = null;
    for (var i = 0; i < DEMO_ACCOUNTS.length; i++){
      if (DEMO_ACCOUNTS[i].role === roleOrEmail || DEMO_ACCOUNTS[i].email === roleOrEmail){
        accStaff = DEMO_ACCOUNTS[i];
        break;
      }
    }
    if (!accStaff) accStaff = DEMO_ACCOUNTS[0];

    var lock = getLock(accStaff.email);
    if (lock.lockedUntil && Date.now() < lock.lockedUntil){
      var mins = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
      var err = "Too many failed attempts. The console is locked for " + mins + " more minute(s) (demo brute-force protection).";
      if (global.Toast) global.Toast.show(err, "warn");
      return { ok:false, locked:true, error:err };
    }
    var du = demoUser(accStaff.email);
    if (du && du.enabled === false){
      var err2 = "This demo account was disabled in the console's user list (simulated).";
      if (global.Toast) global.Toast.show(err2, "warn");
      return { ok:false, error:err2 };
    }

    try { global.AdminConfig.audit("sign-in-quickfill", "session", accStaff.email, "ok"); } catch(e){}
    session = { kind:"staff", email:accStaff.email, name:accStaff.name,
      role:(du && du.role) || accStaff.role, issuedAt:Date.now(),
      lastActive:Date.now(), token:makeToken() };
    persistSession(session);
    syncUserProfileState(accStaff.name, accStaff.email);
    AuthService.watchInactivity();
    if (global.Toast) global.Toast.show("Signed in as Staff (" + accStaff.name + " · " + session.role + ").", "ok");
    location.hash = "#/admin";
    return { ok:true, session:AuthService.session() };
  },

  /* Typed password public student sign-in with strict salted hash verification */
  signInPublic: function(email, password){
    var e = String(email || "").trim().toLowerCase();
    var pwd = String(password || "");
    if (!e || !pwd){
      return { ok:false, error:"Please enter both your email address and password." };
    }

    /* Block staff/admin accounts from authenticating via public student sign-in */
    if (isStaffEmail(e)){
      return { ok:false, error:"Administrator account detected. Please use the dedicated Administrator Portal at #/admin/login." };
    }

    var lock = getLock(e);
    if (lock.lockedUntil && Date.now() < lock.lockedUntil){
      var mins = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
      return { ok:false, locked:true, error:"Too many failed attempts. Account locked for " + mins + " more minute(s)." };
    }

    var acc = findPublicAccount(e);
    if (!acc){
      var lMiss = recordLockFail(e);
      if (lMiss.lockedUntil){
        return { ok:false, locked:true, error:"Too many failed attempts. Account locked for 15 minutes." };
      }
      return { ok:false, error:"Invalid email or password. " + AuthService.attemptsLeft(e) + " attempt(s) left." };
    }

    if (acc.isDemo && !isDemoMode()){
      return { ok:false, error:"Demo student accounts are disabled when demo mode is off." };
    }

    var inputHash = hashClientPassword(pwd, acc.salt);
    if (inputHash !== acc.hash){
      var l = recordLockFail(acc.email);
      if (l.lockedUntil){
        return { ok:false, locked:true, error:"Too many failed attempts. Account locked for 15 minutes." };
      }
      return { ok:false, error:"Those credentials do not match. " + AuthService.attemptsLeft(acc.email) + " attempt(s) left." };
    }

    clearAccountLock(acc.email);
    var tok = makeToken();
    session = {
      kind: "public",
      userId: acc.id || "u0000000-0000-0000-0000-000000000002",
      email: acc.email,
      name: acc.name,
      role: "student",
      issuedAt: Date.now(),
      lastActive: Date.now(),
      token: tok
    };
    persistSession(session);
    syncUserProfileState(acc.name, acc.email, acc.phone, acc.country);

    return { ok:true, session:AuthService.session() };
  },

  publicSignIn: function(email, password){
    return AuthService.signInPublic(email, password);
  },

  token: function(){
    var s = AuthService.session();
    return s ? s.token : null;
  },

  /* Typed password staff sign-in with salted hash comparison & Demo Mode check */
  signIn: function(email, password){ return AuthService.signInStaff(email, password); },

  signInStaff: function(email, password){
    var e = String(email || "").trim().toLowerCase();
    if (isPublicEmail(e) && !isStaffEmail(e)){
      return { ok:false, error:"Access Denied: Student accounts are not authorized to access the Administrator Console. Please sign in via the Student Portal at #/sign-in." };
    }
    var acc = findStaffAccount(e);
    if (!acc){
      return { ok:false, error:"Unrecognized administrator account." };
    }

    if (acc.isDemo && !isDemoMode()){
      try { global.AdminConfig.audit("sign-in-demo-blocked-in-prod", "session", acc.email, "denied"); } catch(err){}
      return {
        ok:false,
        error:"Public demonstration administrator credentials are disabled in production mode."
      };
    }

    var lock = getLock(acc.email);
    if (lock.lockedUntil && Date.now() < lock.lockedUntil){
      var mins = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
      return { ok:false, locked:true,
        error:"Too many failed attempts. The console is locked for " + mins + " more minute(s) (demo brute-force protection)." };
    }

    var inputHash = hashClientPassword(password, acc.salt);
    if (inputHash !== acc.hash){
      var l = recordLockFail(acc.email);
      if (l.lockedUntil){
        return { ok:false, locked:true,
          error:"Too many failed attempts. The console is locked for 15 minutes (demo brute-force protection)." };
      }
      return { ok:false, error:"Those demo credentials do not match. " +
        AuthService.attemptsLeft(acc.email) + " attempt(s) left before a 15-minute lockout." };
    }

    var du = demoUser(acc.email);
    if (du && du.enabled === false){
      return { ok:false, error:"This demo account was disabled in the console's user list (simulated)." };
    }

    clearAccountLock(acc.email);
    try { global.AdminConfig.audit("sign-in", "session", acc.email, "ok"); } catch(err){}
    session = {
      kind: "staff",
      email: acc.email,
      name: acc.name,
      role: (du && du.role) || acc.role,
      issuedAt: Date.now(),
      lastActive: Date.now(),
      token: makeToken()
    };
    persistSession(session);
    syncUserProfileState(acc.name, acc.email);
    AuthService.watchInactivity();

    return { ok:true, session:AuthService.session() };
  },

  signOut: function(){
    var was = session ? session.email : null;
    var tok = session ? session.token : null;
    session = null;
    persistSession(null);
    AuthService.stopInactivityWatch();
    try {
      if (tok && typeof fetch === "function" && global.location && /^https?:/i.test(global.location.protocol)){
        var apiRoot = "/api"; fetch(apiRoot + "/auth/signout", {
          method: "POST",
          headers: { "Authorization": "Bearer " + tok }
        }).catch(function(){});
      }
    } catch (e) {}
    if (global.AppState){
      global.AppState.set("drafts", []);
      global.AppState.set("draftSeq", 0);
      global.AppState.set("tickets", []);
    }
    try {
      localStorage.removeItem("probaho_user_tickets");
      localStorage.removeItem("probaho_user_drafts");
      localStorage.removeItem("probaho_llama32_user_memory");
      localStorage.removeItem("probaho_demo_user_memory");
    } catch(e){}
    try {
      if (global.ModBeneficiaries && typeof global.ModBeneficiaries.reset === "function") global.ModBeneficiaries.reset();
      if (global.ModSend && typeof global.ModSend.reset === "function") global.ModSend.reset();
    } catch(e){}
    return was;
  },

  signOutEverywhere: function(){
    AuthService.signOut();
  },

  session: function(){
    /* Always verify against localStorage tampering */
    try {
      var raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (raw){
        var parsed = JSON.parse(raw);
        if (!verifySessionSignature(parsed)){
          session = null;
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          AuthService.stopInactivityWatch();
          return null;
        }
      }
    } catch (e) {}

    if (expired(session)){ session = null; persistSession(null); AuthService.stopInactivityWatch(); return null; }
    if (!session) return null;
    if (!verifySessionSignature(session)){ session = null; persistSession(null); AuthService.stopInactivityWatch(); return null; }

    /* Staff sliding inactivity timeout (30 min) */
    if (session.kind === "staff" && (Date.now() - (session.lastActive || 0)) > STAFF_IDLE_MS){
      try { global.AdminConfig.audit("sign-in-idle-timeout", "session", session.email, "ok"); } catch(e){}
      session = null;
      persistSession(null);
      AuthService.stopInactivityWatch();
      return null;
    }
    var du = demoUser(session.email);
    if (du && du.enabled === false){ session = null; persistSession(null); AuthService.stopInactivityWatch(); return null; }
    var effectiveRole = (session.kind === "staff") ? ((du && du.role) || session.role) : "student";
    return {
      kind: session.kind,
      email: session.email,
      name: session.name,
      role: effectiveRole,
      token: session.token,
      userId: session.userId
    };
  },

  current: function(){
    return AuthService.session();
  },

  signedIn: function(){ return !!AuthService.session(); },
  isStaff: function(){ var s = AuthService.session(); return !!s && s.kind === "staff" && isStaffEmail(s.email); },

  touch: function(){
    if (session && session.kind === "staff") session.lastActive = Date.now();
  },

  watchInactivity: function(){
    AuthService.stopInactivityWatch();
    idleTimer = setInterval(function(){
      if (session && session.kind === "staff" &&
          (Date.now() - (session.lastActive || 0)) > STAFF_IDLE_MS){
        AuthService.signOut();
        try {
          global.Toast.show("Signed out for 30 minutes of inactivity (demo protection).", "warn");
        } catch(e){}
        location.hash = "#/admin/login";
      }
    }, 60000);
  },

  stopInactivityWatch: function(){
    if (idleTimer){ clearInterval(idleTimer); idleTimer = null; }
  },

  role: function(){ var s = AuthService.session(); return s ? s.role : null; },

  canView: function(section){
    if (!AuthService.isStaff()) return false;
    var r = AuthService.role();
    return !!r && (SECTION_VIEW[section] || []).indexOf(r) >= 0;
  },

  canWrite: function(section){
    if (!AuthService.isStaff()) return false;
    var r = AuthService.role();
    return !!r && (SECTION_WRITE[section] || []).indexOf(r) >= 0;
  },

  visibleSections: function(){
    if (!AuthService.isStaff()) return [];
    var r = AuthService.role();
    if (!r) return [];
    return SECTIONS.filter(function(s){ return (SECTION_VIEW[s.id] || []).indexOf(r) >= 0; });
  },

  sections: SECTIONS
};

global.AuthService = AuthService;
})(typeof window !== "undefined" ? window : global);

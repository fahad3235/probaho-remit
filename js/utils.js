/* utils.js — DOM-free helpers shared by every module. */
(function(global){
"use strict";

var U = {};

/* Safe HTML escaping — all user-controlled text goes through this. */
U.esc = function(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(m){
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
  });
};

U.$  = function(sel, root){ return (root || document).querySelector(sel); };
U.$$ = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

/* Deterministic 53-bit hash (cyrb53) — stable across sessions. */
U.hash53 = function(str, seed){
  var h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
  for (var i = 0, ch; i < str.length; i++){
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/* Deterministic PRNG (mulberry32). Same seed → same sequence, every load. */
U.mulberry32 = function(seed){
  var a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

U.clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };

/* Money: integer minor units <-> display. */
U.toMinor = function(amount){ return Math.round(Number(amount) * 100); };
U.fromMinor = function(minor){ return (Number(minor) || 0) / 100; };
U.money = function(amount, sym, dec){
  var d = (dec == null ? 2 : dec);
  var n = Number(amount) || 0;
  return (sym || "") + n.toLocaleString("en-US", { minimumFractionDigits:d, maximumFractionDigits:d });
};
U.pct = function(v, dec){
  return (Number(v) || 0).toFixed(dec == null ? 2 : dec) + "%";
};

U.ccySym = function(ccy){
  var map = {
    USD: "$", GBP: "£", EUR: "€", BDT: "৳", CAD: "C$", AUD: "A$",
    SAR: "﷼", MYR: "RM", CNY: "¥", AED: "AED ", SGD: "S$",
    INR: "₹", PKR: "₨", PHP: "₱", NGN: "₦", MXN: "Mex$",
    JPY: "¥", CHF: "CHF ", KRW: "₩"
  };
  return map[String(ccy || "").toUpperCase()] || (ccy ? ccy + " " : "");
};

U.ccyFlag = function(ccy){
  var map = {
    USD: "🇺🇸", GBP: "🇬🇧", EUR: "🇪🇺", BDT: "🇧🇩", CAD: "🇨🇦", AUD: "🇦🇺",
    SAR: "🇸🇦", MYR: "🇲🇾", CNY: "🇨🇳", AED: "🇦🇪", SGD: "🇸🇬",
    INR: "🇮🇳", PKR: "🇵🇰", PHP: "🇵🇭", NGN: "🇳🇬", MXN: "🇲🇽",
    JPY: "🇯🇵", CHF: "🇨🇭", KRW: "🇰🇷"
  };
  return map[String(ccy || "").toUpperCase()] || "🌐";
};

/* Offline-safe SVG initial avatar generator */
U.avatarSvg = function(name, bg){
  var parts = String(name || "User").trim().split(/\s+/);
  var initials = (parts[0] ? parts[0].charAt(0) : "U") + (parts[1] ? parts[1].charAt(0) : "");
  initials = initials.toUpperCase();
  var color = bg || "#0D9F9A";
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    '<circle cx="32" cy="32" r="32" fill="' + color + '"/>' +
    '<text x="32" y="38" fill="#ffffff" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="22" text-anchor="middle">' +
    U.esc(initials) + '</text></svg>';
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

/* Dates — pure UTC calendar-day arithmetic (no timezone drift, no off-by-one). */
U.dayNumber = function(y, m, d){ return Math.floor(Date.UTC(y, m - 1, d) / 86400000); };
U.parseDay = function(iso){
  var p = String(iso || "").split("-");
  if (p.length !== 3) return null;
  var y = +p[0], m = +p[1], d = +p[2];
  if (!y || !m || !d) return null;
  return U.dayNumber(y, m, d);
};
U.todayDay = function(){
  var t = new Date();
  return U.dayNumber(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
};
U.daysUntil = function(iso){
  var d = U.parseDay(iso);
  return d == null ? null : d - U.todayDay();
};

/* Safe Storage Wrappers (supports Private Browsing / Safari / Brave) */
U.safeGet = function(key, fallback){
  try {
    var v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch (e) {
    return fallback;
  }
};
U.safeSet = function(key, val){
  try {
    localStorage.setItem(key, val);
    return true;
  } catch (e) {
    return false;
  }
};
U.fmtDate = function(iso){
  var p = String(iso || "").split("-");
  if (p.length !== 3) return "—";
  var dt = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
};
U.fmtDateTime = function(ts){
  var d = new Date(ts);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
};
U.isoDaysAgo = function(n){
  var t = new Date(); t.setDate(t.getDate() - n);
  var m = String(t.getMonth() + 1).padStart(2, "0"), d = String(t.getDate()).padStart(2, "0");
  return t.getFullYear() + "-" + m + "-" + d;
};

U.debounce = function(fn, ms){
  var t = null;
  return function(){ var a = arguments, self = this;
    clearTimeout(t); t = setTimeout(function(){ fn.apply(self, a); }, ms || 250); };
};

/* Inline SVG icon helper (stroke icons, currentColor). */
var ICONS = {
  send:'<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  shield:'<path d="M12 3l7 4v5c0 4.4-3 8.2-7 9-4-.8-7-4.6-7-9V7z"/><path d="M9 12l2 2 4-4"/>',
  chart:'<path d="M4 20V10m5.5 10V4m5.5 16v-7m5 7V7"/>',
  book:'<path d="M22 9L12 4 2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5"/>',
  chat:'<path d="M21 14a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  vault:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10.5h18"/><circle cx="12" cy="14.5" r="1.6"/>',
  home:'<path d="M3 11.5L12 3l9 8.5"/><path d="M5.5 10.5V20h13v-9.5"/>',
  sliders:'<path d="M4 8h10m4 0h2M4 16h4m4 0h8"/><circle cx="16" cy="8" r="2.2"/><circle cx="10" cy="16" r="2.2"/>',
  alert:'<path d="M12 3l10 17H2z"/><path d="M12 10v4.5m0 2.8v.2"/>',
  check:'<path d="M4.5 12.5l5 5 10-11"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8.5v.2"/>',
  arrow:'<path d="M5 12h14m-6-6l6 6-6 6"/>',
  print:'<path d="M7 8V3h10v5"/><rect x="4" y="8" width="16" height="9" rx="2"/><path d="M7 14h10v7H7z"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  edit:'<path d="M4 20l1-4L16.5 4.5a1.4 1.4 0 0 1 2 2L7 18z"/><path d="M14.5 6.5l2 2"/>',
  route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  bank:'<path d="M3 9.5L12 4l9 5.5"/><path d="M4 10v8m4.5-8v8m3-8v8m3-8v8M3 20h18"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.6M17.5 14.2a5.5 5.5 0 0 1 3 4.8"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  list:'<path d="M8.5 6.5H20m-11.5 5.5H20m-11.5 5.5H20"/><circle cx="5" cy="6.5" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="5" cy="17.5" r="1.2"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  id:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16.5a3.5 3.5 0 0 1 6 0M14 9.5h4M14 13h4"/>',
  report:'<path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v5h5"/><path d="M9.5 13h6m-6 3.5h6"/>',
  tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M11.5 3a17 17 0 0 0 0 18m1-18a17 17 0 0 1 0 18"/>',
  bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
};
U.icon = function(name, size){
  var s = size || 18;
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONS[name] || ICONS.info) + '</svg>';
};


/* Deterministic Offline SVG QR Code Generator (Zero external network dependency) */
U.qrSvg = function(dataStr, size){
  var sz = size || 180;
  var grid = 21;
  var cell = sz / grid;
  var seed = U.hash53(String(dataStr || "PROBAHO-WALLET"));
  var rects = [];

  function isFinder(r, c){
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= grid - 7) return true;
    if (r >= grid - 7 && c < 7) return true;
    return false;
  }
  function drawFinder(r0, c0){
    rects.push('<rect x="' + (c0*cell).toFixed(2) + '" y="' + (r0*cell).toFixed(2) + '" width="' + (7*cell).toFixed(2) + '" height="' + (7*cell).toFixed(2) + '" fill="#0f172a" rx="' + (cell*0.8).toFixed(1) + '"/>');
    rects.push('<rect x="' + ((c0+1)*cell).toFixed(2) + '" y="' + ((r0+1)*cell).toFixed(2) + '" width="' + (5*cell).toFixed(2) + '" height="' + (5*cell).toFixed(2) + '" fill="#ffffff" rx="' + (cell*0.5).toFixed(1) + '"/>');
    rects.push('<rect x="' + ((c0+2)*cell).toFixed(2) + '" y="' + ((r0+2)*cell).toFixed(2) + '" width="' + (3*cell).toFixed(2) + '" height="' + (3*cell).toFixed(2) + '" fill="#0D9F9A" rx="' + (cell*0.4).toFixed(1) + '"/>');
  }
  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  for (var r = 0; r < grid; r++){
    for (var c = 0; c < grid; c++){
      if (isFinder(r, c)) continue;
      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          rects.push('<rect x="' + (c*cell).toFixed(2) + '" y="' + (r*cell).toFixed(2) + '" width="' + cell.toFixed(2) + '" height="' + cell.toFixed(2) + '" fill="#0f172a"/>');
        }
        continue;
      }
      var bit = U.hash53(String(dataStr) + ":" + r + ":" + c + ":" + seed) % 10;
      if (bit < 5){
        rects.push('<rect x="' + (c*cell).toFixed(2) + '" y="' + (r*cell).toFixed(2) + '" width="' + (cell*0.92).toFixed(2) + '" height="' + (cell*0.92).toFixed(2) + '" fill="#0f172a" rx="1"/>');
      }
    }
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + sz + ' ' + sz + '" width="' + sz + '" height="' + sz + '">' +
    '<rect width="100%" height="100%" fill="#ffffff" rx="8"/>' +
    '<g transform="translate(8,8) scale(' + ((sz-16)/sz).toFixed(4) + ')">' + rects.join("") + '</g>' +
    '</svg>';
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};


/* 3D Glowing Purple AI Copilot Orb (matches reference image 1) */
U.aiOrb = function(sizeClass){
  var cls = sizeClass || "ai-orb-sm";
  return '<span class="ai-orb ' + cls + '" aria-hidden="true">' +
    '<span class="ai-orb-eyes"><i class="ai-orb-eye"></i><i class="ai-orb-eye"></i></span>' +
  '</span>';
};

/* Profile Picture Storage & Compression Helpers */
var PROF_PIC_KEY = "probaho_user_avatar_data_v1";

U.getProfilePic = function(){
  try {
    var saved = localStorage.getItem(PROF_PIC_KEY);
    if (saved && saved.indexOf("data:image/") === 0) return saved;
  } catch (e) {}
  if (global.AppState){
    var prof = global.AppState.get("userProfile") || {};
    if (prof.avatarDataUrl && String(prof.avatarDataUrl).indexOf("data:image/") === 0){
      return prof.avatarDataUrl;
    }
  }
  return null;
};

U.setProfilePic = function(dataUrl){
  try {
    if (dataUrl) localStorage.setItem(PROF_PIC_KEY, dataUrl);
    else localStorage.removeItem(PROF_PIC_KEY);
  } catch (e) {}
  if (global.AppState){
    var prof = Object.assign({}, global.AppState.get("userProfile") || {});
    prof.avatarDataUrl = dataUrl || null;
    global.AppState.set("userProfile", prof);
  }
  U.refreshAllProfileAvatars();
};

/* Compress uploaded image file to 180x180 Data URL so it renders fast & persists cleanly */
U.readAndCompressImageFile = function(file, callback){
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    var rawUrl = ev.target.result;
    var img = new Image();
    img.onload = function(){
      try {
        var canvas = document.createElement("canvas");
        var sz = 180;
        canvas.width = sz;
        canvas.height = sz;
        var ctx = canvas.getContext("2d");
        var minSide = Math.min(img.width, img.height);
        var sx = (img.width - minSide) / 2;
        var sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, sz, sz);
        var outUrl = canvas.toDataURL("image/jpeg", 0.86);
        callback(outUrl);
      } catch (err) {
        callback(rawUrl);
      }
    };
    img.onerror = function(){ callback(rawUrl); };
    img.src = rawUrl;
  };
  reader.readAsDataURL(file);
};

/* Refresh all rendered profile avatars in Header, Dashboard, Settings & Admin Topbar immediately */
U.refreshAllProfileAvatars = function(){
  var pic = U.getProfilePic();
  document.querySelectorAll(".u-profile-avatar").forEach(function(av){
    var initials = av.getAttribute("data-initials") || "IA";
    if (pic){
      av.innerHTML = '<img src="' + U.esc(pic) + '" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">';
      av.style.padding = "0";
      av.style.overflow = "hidden";
    } else {
      av.textContent = initials;
    }
  });
  document.querySelectorAll(".user-profile-live-img").forEach(function(img){
    var name = img.getAttribute("data-name") || "Ishan Ahmed";
    img.src = pic || (U.avatarSvg ? U.avatarSvg(name) : "");
  });
};

/* Interactive Profile & Picture Upload Modal */
U.openProfilePhotoModal = function(){
  if (!global.Modal) return;
  var s = (global.AuthService && global.AuthService.session) ? global.AuthService.session() : null;
  var prof = (global.AppState && global.AppState.get("userProfile")) || {};
  var rawName = prof.full_name || (s && s.name) || "Ishan Ahmed";
  var curPic = U.getProfilePic();
  var fallbackSvg = U.avatarSvg ? U.avatarSvg(rawName, "#0D9F9A") : "";

  var bodyHtml =
    '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;padding:6px 0;">' +
      '<div style="position:relative;width:104px;height:104px;">' +
        '<img id="modalProfPicPreview" src="' + U.esc(curPic || fallbackSvg) + '" alt="' + U.esc(rawName) + '" style="width:104px;height:104px;border-radius:50%;object-fit:cover;border:3px solid #0D9F9A;box-shadow:0 8px 24px rgba(37,99,235,0.22);background:#E6F8F7;">' +
        '<label for="modalProfFileInput" title="Choose picture from device" style="position:absolute;bottom:0;right:0;width:34px;height:34px;border-radius:50%;background:#0D9F9A;color:#fff;border:2px solid #fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.2);font-size:15px;">📷</label>' +
      '</div>' +
      '<div>' +
        '<b style="font-size:16px;color:#0f172a;display:block;">' + U.esc(rawName) + '</b>' +
        '<span style="font-size:12.5px;color:#64748b;">Upload a JPG, PNG, or WebP photo from your phone or computer</span>' +
      '</div>' +
      '<input type="file" id="modalProfFileInput" accept="image/*" style="display:none;">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%;">' +
        '<label for="modalProfFileInput" class="btn btn-primary" style="cursor:pointer;border-radius:12px;padding:10px 20px;font-weight:750;">' +
          '📤 Choose Picture from Device' +
        '</label>' +
        (curPic ? '<button type="button" class="btn btn-secondary" id="modalRemoveProfPicBtn" style="border-radius:12px;color:#e11d48;border-color:#fecdd3;">🗑️ Remove Photo</button>' : '') +
      '</div>' +
      '<div style="width:100%;border-top:1px solid #e2e8f0;padding-top:14px;text-align:left;">' +
        '<label style="font-size:12px;font-weight:700;color:#475569;display:block;margin-bottom:6px;">Display Name</label>' +
        '<input type="text" class="input" id="modalProfNameInput" value="' + U.esc(rawName) + '" placeholder="Your full name">' +
      '</div>' +
    '</div>';

  var dlg = global.Modal.open({
    title: "👤 Profile & Picture Settings",
    body: bodyHtml,
    okLabel: "Save Profile",
    onOk: function(){
      var nameIn = document.getElementById("modalProfNameInput");
      if (nameIn && nameIn.value.trim()){
        var newName = nameIn.value.trim();
        if (global.AppState){
          var p = Object.assign({}, global.AppState.get("userProfile") || {}, { full_name: newName });
          global.AppState.set("userProfile", p);
        }
        if (global.Customizer && global.Customizer.getPrefs){
          var cp = global.Customizer.getPrefs();
          cp.userName = newName;
          global.Customizer.savePrefs(cp);
        }
      }
      if (global.Toast) global.Toast.show("✅ Profile updated!", "ok");
      if (global.Router && global.Router.render) global.Router.render();
    }
  });
  if (!dlg) return;

  var fileIn = dlg.querySelector("#modalProfFileInput");
  var prevImg = dlg.querySelector("#modalProfPicPreview");
  var remBtn = dlg.querySelector("#modalRemoveProfPicBtn");

  if (fileIn){
    fileIn.addEventListener("change", function(){
      var file = fileIn.files && fileIn.files[0];
      if (!file) return;
      U.readAndCompressImageFile(file, function(dataUrl){
        U.setProfilePic(dataUrl);
        if (prevImg) prevImg.src = dataUrl;
        if (global.Toast) global.Toast.show("📸 Profile picture uploaded & applied!", "ok");
        if (global.Router && global.Router.render) global.Router.render();
      });
    });
  }
  if (remBtn){
    remBtn.addEventListener("click", function(){
      U.setProfilePic(null);
      if (prevImg) prevImg.src = fallbackSvg;
      remBtn.style.display = "none";
      if (global.Toast) global.Toast.show("Profile picture reset to initials.", "ok");
      if (global.Router && global.Router.render) global.Router.render();
    });
  }
};

/* User Profile Pill + Clean Popover Dropdown Menu (ONLY Profile, Upload Picture & Sign Out) */
U.renderProfileMenuHtml = function(contextMode, uidSuffix){
  var s = (global.AuthService && global.AuthService.session) ? global.AuthService.session() : null;
  var prof = (global.AppState && global.AppState.get("userProfile")) || {};
  var isStaff = !!(global.AuthService && global.AuthService.isStaff && global.AuthService.isStaff());
  var isAdminContext = (contextMode === "admin") || isStaff;
  var baseName = (s && s.name) || prof.full_name || "Ishan Ahmed";
  var rawName = String(baseName).replace(/\s*\((Admin|Super Admin|Verified User|Student)\)\s*/gi, "").trim() || "Ishan Ahmed";
  var nameParts = rawName.split(/\s+/);
  var computedInit = ((nameParts[0] ? nameParts[0].charAt(0) : "I") + (nameParts[1] ? nameParts[1].charAt(0) : (nameParts[0] && nameParts[0].length > 1 ? nameParts[0].charAt(1) : "A"))).toUpperCase();
  var displayTitle = isAdminContext ? (rawName + " (Super Admin)") : (rawName + " (Student)");
  var displayRoleSub = isAdminContext ? "ADMIN · OWNER" : "CIS • BATCH 25";
  var badgeInitials = isAdminContext ? "SA" : computedInit;
  var rawEmail = (s && s.email) || prof.email || "ishan@probaho.demo";
  var handleStr = isAdminContext ? "diudevcis" : rawEmail;
  var menuId = "profMenuPop_" + (uidSuffix || contextMode || "main");
  var btnId = "profMenuBtn_" + (uidSuffix || contextMode || "main");
  var fileInputId = "profQuickFile_" + (uidSuffix || contextMode || "main");
  var pic = U.getProfilePic();

  var avatarInner = pic
    ? '<img src="' + U.esc(pic) + '" alt="' + U.esc(rawName) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">'
    : U.esc(badgeInitials);

  var userSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9F9A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var cameraSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
  var signoutSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

  return '<div class="u-profile-menu-wrap" data-prof-wrap="' + U.esc(uidSuffix || contextMode || "main") + '">' +
    '<input type="file" accept="image/*" class="u-prof-hidden-file" id="' + U.esc(fileInputId) + '" style="display:none;">' +
    '<button type="button" class="u-profile-trigger ' + (contextMode === "admin" ? "is-admin-bar" : "") + '" id="' + U.esc(btnId) + '" aria-expanded="false" aria-haspopup="true" title="Open Profile Menu">' +
      '<span class="u-profile-avatar" data-initials="' + U.esc(badgeInitials) + '" style="' + (pic ? 'padding:0;overflow:hidden;' : '') + '">' + avatarInner + '</span>' +
      '<span class="u-profile-meta">' +
        '<b class="u-profile-name">' + U.esc(displayTitle) + '</b>' +
        '<small class="u-profile-role">' + U.esc(displayRoleSub) + '</small>' +
      '</span>' +
    '</button>' +
    '<div class="u-profile-popover" id="' + U.esc(menuId) + '" role="menu" aria-hidden="true">' +
      '<div class="u-pop-head" style="display:flex;align-items:center;gap:12px;">' +
        '<button type="button" class="u-pop-avatar-btn" data-prof-act="upload-photo" title="Upload / Change Profile Picture" style="position:relative;width:44px;height:44px;border-radius:50%;border:1.5px solid #99F6E4;background:#E6F8F7;color:#097A76;font-weight:800;font-size:14px;display:grid;place-items:center;padding:0;cursor:pointer;flex-shrink:0;overflow:visible;">' +
          '<span class="u-profile-avatar" data-initials="' + U.esc(badgeInitials) + '" style="width:100%;height:100%;border:none;' + (pic ? 'padding:0;overflow:hidden;' : '') + '">' + avatarInner + '</span>' +
          '<span style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:#0D9F9A;color:#fff;border:1.5px solid #fff;font-size:9px;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);">📷</span>' +
        '</button>' +
        '<div style="min-width:0;flex:1;">' +
          '<div class="u-pop-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + U.esc(displayTitle) + '</div>' +
          '<div class="u-pop-handle">' + U.esc(handleStr) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="u-pop-list">' +
        '<button type="button" class="u-pop-item" data-prof-act="profile" role="menuitem">' +
          '<span class="u-pop-ic">' + userSvg + '</span>' +
          '<span>Profile</span>' +
        '</button>' +
        '<button type="button" class="u-pop-item" data-prof-act="upload-photo" role="menuitem">' +
          '<span class="u-pop-ic">' + cameraSvg + '</span>' +
          '<span>Upload Picture</span>' +
        '</button>' +
        '<button type="button" class="u-pop-item" data-prof-act="notifications" role="menuitem">' +
          '<span class="u-pop-ic">🔔</span>' +
          '<span>Notifications &amp; Alerts</span>' +
        '</button>' +
        '<button type="button" class="u-pop-item" data-prof-act="sign-up" role="menuitem">' +
          '<span class="u-pop-ic">✨</span>' +
          '<span>Create New Account</span>' +
        '</button>' +
      '</div>' +
      '<div class="u-pop-foot">' +
        '<button type="button" class="u-pop-item is-danger" data-prof-act="sign-out" role="menuitem">' +
          '<span class="u-pop-ic">' + signoutSvg + '</span>' +
          '<span>Sign Out</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';
};

U.bindProfileMenus = function(root){
  var scope = root || document;
  var wraps = scope.querySelectorAll(".u-profile-menu-wrap");
  wraps.forEach(function(wrap){
    if (wrap._profBound) return;
    wrap._profBound = true;
    var trig = wrap.querySelector(".u-profile-trigger");
    var pop = wrap.querySelector(".u-profile-popover");
    var fileIn = wrap.querySelector(".u-prof-hidden-file");
    if (!trig || !pop) return;

    function closePop(){
      pop.classList.remove("open");
      pop.setAttribute("aria-hidden", "true");
      trig.setAttribute("aria-expanded", "false");
    }

    trig.addEventListener("click", function(e){
      e.stopPropagation();
      var isOpen = pop.classList.contains("open");
      document.querySelectorAll(".u-profile-popover.open").forEach(function(other){
        other.classList.remove("open");
        other.setAttribute("aria-hidden", "true");
      });
      if (!isOpen){
        pop.classList.add("open");
        pop.setAttribute("aria-hidden", "false");
        trig.setAttribute("aria-expanded", "true");
      } else {
        closePop();
      }
    });

    if (fileIn){
      fileIn.addEventListener("change", function(){
        var f = fileIn.files && fileIn.files[0];
        if (!f) return;
        U.readAndCompressImageFile(f, function(dataUrl){
          U.setProfilePic(dataUrl);
          if (global.Toast) global.Toast.show("📸 Profile picture uploaded & updated!", "ok");
          if (global.Router && global.Router.render) global.Router.render();
        });
      });
    }

    wrap.querySelectorAll("[data-prof-act]").forEach(function(item){
      item.addEventListener("click", function(e){
        e.stopPropagation();
        var act = item.getAttribute("data-prof-act");
        closePop();
        if (act === "profile"){
          location.hash = "#/settings";
          if (global.Router && global.Router.render) global.Router.render();
        } else if (act === "upload-photo"){
          U.openProfilePhotoModal();
        } else if (act === "notifications"){
          if (global.NotificationHub && typeof global.NotificationHub.openModal === "function"){
            global.NotificationHub.openModal("all");
          } else {
            location.hash = "#/notifications";
          }
        } else if (act === "sign-up"){
          location.hash = "#/sign-up";
          if (global.Router && global.Router.render) global.Router.render();
        } else if (act === "sign-out"){
          var soBtn = document.getElementById("headerSignout");
          if (soBtn) {
            soBtn.click();
          } else if (global.AuthService) {
            global.AuthService.signOut();
            document.body.classList.remove("admin-mode");
            location.hash = "#/sign-in";
          }
        }
      });
    });
  });

  if (!document._globalProfCloseBound){
    document._globalProfCloseBound = true;
    document.addEventListener("click", function(){
      document.querySelectorAll(".u-profile-popover.open").forEach(function(p){
        p.classList.remove("open");
        p.setAttribute("aria-hidden", "true");
      });
    });
  }
};

global.U = U;
global.Utils = U;
})(typeof window !== "undefined" ? window : global);

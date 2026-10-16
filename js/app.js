/* app.js — boot. Global error surface; then hand over to the router.
   Starts from the Sign-In page (#/ / #/sign-in) as required. */
(function(){
"use strict";

function fatal(msg){
  var el = document.getElementById("fatal");
  if (!el) return;
  el.style.display = "block";
  el.textContent = "The demo hit a script error: " + msg;
}
window.addEventListener("error", function(e){
  fatal((e.message || "unknown error") + (e.lineno ? " (line " + e.lineno + ")" : ""));
});
window.addEventListener("unhandledrejection", function(e){
  fatal(e.reason && e.reason.message ? e.reason.message : String(e.reason));
});

document.addEventListener("DOMContentLoaded", function(){
  if (!location.hash){
    if (typeof location.pathname === "string" && location.pathname.indexOf("/admin") === 0){
      location.hash = "#" + location.pathname;
    } else {
      location.hash = "#/";
    }
  }
  /* Staff inactivity clock: any interaction counts as activity. */
  ["click", "keydown", "touchstart"].forEach(function(ev){
    document.addEventListener(ev, function(){
      try { window.AuthService.touch(); } catch (e){}
    }, { passive:true });
  });
  var so = document.getElementById("headerSignout");
  if (so) so.addEventListener("click", function(){
    var wasStaff = false;
    try { wasStaff = window.AuthService.isStaff(); } catch (e){}
    try {
      var s = window.AuthService.session();
      window.AdminConfig.audit("sign-out", "session", s ? s.email : "unknown", "ok");
    } catch (e){}
    window.AuthService.signOut();
    document.body.classList.remove("admin-mode");
    document.body.classList.remove("is-authenticated");
    location.hash = wasStaff ? ((window.location && String(window.location.pathname).indexOf("qa.html") >= 0) ? "#/sign-in" : "#/admin/login") : "#/";
    if (window.Toast) window.Toast.show("Signed out. The demo session was cleared from this tab's memory.");
  });
  Router.init();
});
})();

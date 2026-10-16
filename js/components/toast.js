/* toast.js — one shared toast system (aria-live announcements). */
(function(global){
"use strict";

function show(msg, kind){
  var box = document.getElementById("toasts");
  if (!box) return;
  var el = document.createElement("div");
  el.className = "toast " + (kind || "");
  el.textContent = msg; // textContent — never HTML
  box.appendChild(el);
  setTimeout(function(){ el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 3400);
  setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 3800);
}

global.Toast = { show: show };
})(window);

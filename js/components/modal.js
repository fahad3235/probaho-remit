/* modal.js — one shared accessible modal. Focus trapped, Esc closes. */
(function(global){
"use strict";

var root = null, lastFocus = null;

function ensureRoot(){
  if (!root) root = document.getElementById("modalRoot");
  return root;
}

function open(opts, legacyTitle){
  if (typeof opts === "string"){
    opts = { body: opts, title: legacyTitle || "" };
  }
  opts = opts || {};
  var r = ensureRoot();
  if (!r) return null;
  close(true);
  lastFocus = document.activeElement;
  var wrap = document.createElement("div");
  wrap.className = "modal-bg";
  var dialog = document.createElement("div");
  dialog.className = "modal";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", opts.title || "Dialog");

  var head = document.createElement("div");
  head.className = "modal-head";
  var h2 = document.createElement("h2"); h2.textContent = opts.title || "";
  var x = document.createElement("button");
  x.type = "button";
  x.className = "btn btn-secondary btn-sm"; x.textContent = "Close";
  x.setAttribute("data-close", "1");
  head.appendChild(h2); head.appendChild(x);

  var body = document.createElement("div");
  body.className = "modal-body";
  if (typeof opts.body === "string") body.innerHTML = opts.body; // caller-owned HTML only
  else if (opts.body) body.appendChild(opts.body);

  dialog.appendChild(head); dialog.appendChild(body);
  if (opts.footer){
    var foot = document.createElement("div");
    foot.className = "modal-foot";
    if (typeof opts.footer === "string") foot.innerHTML = opts.footer;
    else foot.appendChild(opts.footer);
    dialog.appendChild(foot);
  } else if (opts.okLabel || opts.onOk){
    var foot = document.createElement("div");
    foot.className = "modal-foot";
    foot.style.display = "flex";
    foot.style.justifyContent = "flex-end";
    foot.style.gap = "10px";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = opts.cancelLabel || "Cancel";
    cancelBtn.addEventListener("click", function(){ close(); });
    foot.appendChild(cancelBtn);

    var okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "btn btn-primary";
    okBtn.textContent = opts.okLabel || "Confirm";
    okBtn.addEventListener("click", function(){
      if (typeof opts.onOk === "function") {
        try {
          var res = opts.onOk();
          if (res === false) return;
        } catch (e) {
          console.error(e);
        }
      }
      if (r && r.firstChild === wrap) close(true);
    });
    foot.appendChild(okBtn);
    dialog.appendChild(foot);
  }
  wrap.appendChild(dialog);
  r.appendChild(wrap);

  wrap.addEventListener("mousedown", function(e){ if (e.target === wrap) close(); });
  wrap.addEventListener("click", function(e){
    if (e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", onKey);

  var f = dialog.querySelector("input, select, textarea, .modal-foot .btn-primary, button, [tabindex]");
  if (f) f.focus();
  return dialog;
}

function onKey(e){
  if (e.key === "Escape") close();
  if (e.key === "Tab"){
    var r = ensureRoot();
    if (!r) return;
    var items = Array.prototype.slice.call(r.querySelectorAll("button, input, select, textarea, a[href], [tabindex]"))
      .filter(function(el){ return !el.disabled && el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
}

function close(silent){
  var r = ensureRoot();
  if (r) r.innerHTML = "";
  document.removeEventListener("keydown", onKey);
  if (!silent && lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  lastFocus = null;
}

function isOpen(){ var r = ensureRoot(); return !!(r && r.firstChild); }

/* Convenience confirm dialog. bodyHtml is caller-owned HTML (escaped by the caller). */
function confirmDlg(title, bodyHtml, okLabel, onOk){
  var foot = document.createElement("div");
  var cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn-secondary"; cancel.textContent = "Cancel";
  cancel.addEventListener("click", function(){ close(); });
  var ok = document.createElement("button");
  ok.type = "button";
  ok.className = "btn btn-primary"; ok.textContent = okLabel || "Confirm";
  ok.addEventListener("click", function(){ close(true); try { onOk(); } catch (e) {} });
  foot.appendChild(cancel); foot.appendChild(ok);
  open({ title: title, body: bodyHtml, footer: foot });
  setTimeout(function(){ var b = foot.querySelector(".btn-primary"); if (b) b.focus(); }, 30);
}

global.Modal = { open: open, close: close, isOpen: isOpen, confirm: confirmDlg };
})(typeof window !== "undefined" ? window : global);

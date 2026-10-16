/* storage.js — versioned, failure-tolerant browser persistence.
   Only ordinary planner data and user-created drafts are persisted.
   NEVER: API keys, pasted ScamShield content, credentials. */
(function(global){
"use strict";

var KEY = (global.DemoConfig && global.DemoConfig.storageKey) || "probaho-titan-v1";
var memoryFallback = {};
var storageOK = null;

function backend(){
  if (storageOK !== null) return storageOK ? window.localStorage : null;
  try {
    var t = "__pt_probe__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    storageOK = true;
    return window.localStorage;
  } catch (e) {
    storageOK = false; // private mode / disabled storage → in-memory fallback
    return null;
  }
}

var Storage = {
  key: KEY,
  available: function(){ return !!backend(); },

  read: function(){
    var b = backend();
    try {
      var raw = b ? b.getItem(KEY) : memoryFallback[KEY];
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || parsed.v !== 1) return null; // version guard
      return parsed.data || null;
    } catch (e) {
      return null; // malformed JSON → treat as empty, never crash
    }
  },

  write: function(data){
    var payload = JSON.stringify({ v: 1, data: data || {} });
    try {
      var b = backend();
      if (b) b.setItem(KEY, payload); else memoryFallback[KEY] = payload;
      return true;
    } catch (e) {
      return false; // quota / failure → caller shows notice, app keeps running
    }
  },

  clear: function(){
    try {
      var b = backend();
      if (b) {
        b.removeItem(KEY);
        b.removeItem("probaho_active_session_v1");
      } else {
        delete memoryFallback[KEY];
      }
      if (global.AuthService && typeof global.AuthService.signOut === "function") {
        global.AuthService.signOut();
      }
    } catch (e) {}
  }
};

global.AppStorage = Storage;
})(window);

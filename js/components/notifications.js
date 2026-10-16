/**
 * notifications.js — Universal NotificationHub & ModNotifications
 * Complete notification center, upcoming payment reminders, live alerts, and badge synchronization.
 * Works seamlessly on Netlify static hosting, browser local storage, and live server environments.
 */
(function(global){
"use strict";

var U = global.U || {
  esc: function(s){ return String(s || '').replace(/[&<>"']/g, function(m){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]; }); },
  $: function(sel, r){ return (r || document).querySelector(sel); }
};

var STORAGE_KEY_NOTIFS = "probaho_user_notifications_v2";
var STORAGE_KEY_REMINDERS = "probaho_user_reminders_v2";
var STORAGE_KEY_PREFS = "probaho_notification_prefs_v1";

var SEED_NOTIFICATIONS = [
  {
    id: "notif_001",
    category: "TRANSFER",
    title: "Transfer Delivered: ৳ 62,000 to Samiya Rahman",
    message: "Your educational transfer to United Kingdom (Bank of Scotland) was completed in 18 minutes via Wise. Ref: TX-DEMO-UK921.",
    amount: "৳ 62,000 BDT",
    status: "completed",
    actionLabel: "View Receipt",
    actionRoute: "#/payment-vault",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    unread: true
  },
  {
    id: "notif_002",
    category: "TUITION_REMINDER",
    title: "Upcoming Tuition Payment: Tsinghua University",
    message: "Fall Semester tuition sinking fund target due in 14 days. Estimated total: ¥18,000 CNY (৳ 3,01,548 BDT). Rate is locked for 60s.",
    amount: "¥18,000 CNY",
    status: "upcoming",
    actionLabel: "Open Tuition Planner",
    actionRoute: "#/tuition-planner",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    unread: true
  },
  {
    id: "notif_003",
    category: "SECURITY",
    title: "ScamShield Audit: Account Fully Protected",
    message: "Automated biometric and intermediary screening completed. Your Safety Score is 92/100 (Protected). Zero fraudulent links detected.",
    amount: "Score 92/100",
    status: "safe",
    actionLabel: "View Security Score",
    actionRoute: "#/scamshield",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    unread: false
  },
  {
    id: "notif_004",
    category: "KYC",
    title: "KYC Tier 1 Verification Active",
    message: "Passport and student ID verified for Ishan Ahmed. Daily send quota of ৳50,000 BDT is ready for cross-border remittance.",
    amount: "৳ 50,000 / day",
    status: "verified",
    actionLabel: "View KYC Quotas",
    actionRoute: "#/kyc",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    unread: false
  }
];

var SEED_REMINDERS = [
  {
    id: "rem_001",
    title: "Tsinghua University — Semester 2 Tuition",
    amount: 18000,
    currency: "CNY",
    amountBDT: 301548,
    dueDate: "2026-11-01",
    frequency: "Semester",
    recipient: "Tsinghua University International Office",
    payoutMethod: "Bank Transfer",
    notes: "Tuition invoice ref: THU-2026-CIS-9921",
    completed: false
  },
  {
    id: "rem_002",
    title: "Monthly Family Living Expense Remittance",
    amount: 25000,
    currency: "BDT",
    amountBDT: 25000,
    dueDate: "2026-10-25",
    frequency: "Monthly",
    recipient: "Fatema Begum (Mother)",
    payoutMethod: "bKash",
    notes: "Family support via mobile wallet",
    completed: false
  }
];

function loadStoredNotifs(){
  try {
    var raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw){
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e){}
  return SEED_NOTIFICATIONS.slice();
}

function saveStoredNotifs(list){
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(list));
  } catch(e){}
}

function loadStoredReminders(){
  try {
    var raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (raw){
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e){}
  return SEED_REMINDERS.slice();
}

function saveStoredReminders(list){
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(list));
  } catch(e){}
}

var notifications = loadStoredNotifs();
var reminders = loadStoredReminders();

var NotificationHub = {
  list: function(){
    notifications = loadStoredNotifs();
    return notifications;
  },

  getUpcomingReminders: function(){
    reminders = loadStoredReminders();
    return reminders;
  },

  addNotification: function(notif, toastIt){
    if (!notif) return null;
    notifications = loadStoredNotifs();
    var item = {
      id: notif.id || ("notif_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 5)),
      category: notif.category || "SYSTEM",
      title: String(notif.title || "Notification"),
      message: String(notif.message || ""),
      amount: notif.amount || "",
      status: notif.status || "info",
      actionLabel: notif.actionLabel || "",
      actionRoute: notif.actionRoute || "",
      timestamp: notif.timestamp || new Date().toISOString(),
      unread: notif.unread !== false
    };
    notifications.unshift(item);
    saveStoredNotifs(notifications);
    NotificationHub.updateBadge();

    if (toastIt !== false && global.Toast && typeof global.Toast.show === "function"){
      global.Toast.show("🔔 " + item.title, "ok");
    }
    return item;
  },

  addUpcomingPaymentReminder: function(rem){
    if (!rem) return null;
    reminders = loadStoredReminders();
    var item = {
      id: rem.id || ("rem_" + Date.now().toString(36)),
      title: String(rem.title || "Upcoming Payment"),
      amount: Number(rem.amount || 0),
      currency: rem.currency || "BDT",
      amountBDT: Number(rem.amountBDT || rem.amount || 0),
      dueDate: rem.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      frequency: rem.frequency || "One-time",
      recipient: rem.recipient || "Beneficiary",
      payoutMethod: rem.payoutMethod || "Bank",
      notes: rem.notes || "",
      completed: false
    };
    reminders.unshift(item);
    saveStoredReminders(reminders);

    NotificationHub.addNotification({
      category: "REMINDER_CREATED",
      title: "🗓️ Payment Reminder Set: " + item.title,
      message: "Scheduled for " + item.dueDate + " (" + item.currency + " " + item.amount.toLocaleString() + "). You will receive push & WhatsApp alerts before due date.",
      actionLabel: "View Reminders",
      actionRoute: "#/notifications",
      amount: item.currency + " " + item.amount.toLocaleString()
    }, true);

    NotificationHub.updateBadge();
    return item;
  },

  markAsRead: function(id){
    notifications = loadStoredNotifs();
    for (var i = 0; i < notifications.length; i++){
      if (notifications[i].id === id){
        notifications[i].unread = false;
        break;
      }
    }
    saveStoredNotifs(notifications);
    NotificationHub.updateBadge();
  },

  markAllAsRead: function(){
    notifications = loadStoredNotifs();
    notifications.forEach(function(n){ n.unread = false; });
    saveStoredNotifs(notifications);
    NotificationHub.updateBadge();
    if (global.Toast) global.Toast.show("All notifications marked as read.", "ok");
  },

  clearAll: function(){
    notifications = [];
    saveStoredNotifs(notifications);
    NotificationHub.updateBadge();
    if (global.Toast) global.Toast.show("All notifications cleared.", "ok");
  },

  deleteReminder: function(id){
    reminders = loadStoredReminders().filter(function(r){ return r.id !== id; });
    saveStoredReminders(reminders);
    NotificationHub.updateBadge();
    if (global.Toast) global.Toast.show("Payment reminder removed.", "ok");
  },

  updateBadge: function(){
    notifications = loadStoredNotifs();
    var unreadCount = notifications.filter(function(n){ return n.unread !== false; }).length;

    var headerBadge = document.getElementById("notifHeaderBadge");
    if (headerBadge){
      if (unreadCount > 0){
        headerBadge.style.display = "inline-flex";
        headerBadge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
      } else {
        headerBadge.style.display = "none";
      }
    }

    var sidebarCounts = document.querySelectorAll(".live-notif-unread-count");
    sidebarCounts.forEach(function(el){
      if (unreadCount > 0){
        el.style.display = "inline-flex";
        el.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
      } else {
        el.style.display = "none";
      }
    });
  },

  syncForActiveUser: function(){
    notifications = loadStoredNotifs();
    reminders = loadStoredReminders();
    NotificationHub.updateBadge();
  },

  checkAndShowWelcomeAlert: function(){
    var shownKey = "probaho_welcome_alert_shown";
    if (!sessionStorage.getItem(shownKey)){
      sessionStorage.setItem(shownKey, "1");
      setTimeout(function(){
        NotificationHub.updateBadge();
      }, 500);
    }
  },

  openModal: function(initialTab){
    var tab = initialTab || "all";
    var notifs = NotificationHub.list();
    var rems = NotificationHub.getUpcomingReminders();
    var unread = notifs.filter(function(n){ return n.unread; }).length;

    var modalHtml =
      '<div class="notif-modal-wrap" style="max-width:640px;width:100%;margin:0 auto;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid #e2e8f0;margin-bottom:14px;">' +
          '<div>' +
            '<h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 2px;display:flex;align-items:center;gap:8px;">' +
              '<span>🔔 Notifications &amp; Reminders</span>' +
              (unread > 0 ? '<span style="background:#ef4444;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;">' + unread + ' new</span>' : '') +
            '</h2>' +
            '<p style="font-size:12px;color:#64748b;margin:0;">Real-time student remittance alerts, upcoming tuition schedules &amp; security notices</p>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="btnNotifMarkAll" style="font-size:11px;padding:4px 8px;">Mark All Read</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="btnNotifNewRem" style="font-size:11px;padding:4px 10px;">+ Add Reminder</button>' +
          '</div>' +
        '</div>' +

        /* Tab Switcher */
        '<div style="display:flex;gap:4px;background:#f1f5f9;padding:4px;border-radius:10px;margin-bottom:14px;">' +
          '<button type="button" class="notif-tab-btn ' + (tab === 'all' ? 'active' : '') + '" data-tab="all" style="flex:1;padding:6px 10px;font-size:12px;font-weight:700;border:none;border-radius:7px;cursor:pointer;background:' + (tab === 'all' ? '#fff' : 'transparent') + ';color:' + (tab === 'all' ? '#0f172a' : '#64748b') + ';box-shadow:' + (tab === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none') + ';">All Alerts (' + notifs.length + ')</button>' +
          '<button type="button" class="notif-tab-btn ' + (tab === 'reminders' ? 'active' : '') + '" data-tab="reminders" style="flex:1;padding:6px 10px;font-size:12px;font-weight:700;border:none;border-radius:7px;cursor:pointer;background:' + (tab === 'reminders' ? '#fff' : 'transparent') + ';color:' + (tab === 'reminders' ? '#0f172a' : '#64748b') + ';box-shadow:' + (tab === 'reminders' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none') + ';">Payment Reminders (' + rems.length + ')</button>' +
          '<button type="button" class="notif-tab-btn ' + (tab === 'unread' ? 'active' : '') + '" data-tab="unread" style="flex:1;padding:6px 10px;font-size:12px;font-weight:700;border:none;border-radius:7px;cursor:pointer;background:' + (tab === 'unread' ? '#fff' : 'transparent') + ';color:' + (tab === 'unread' ? '#0f172a' : '#64748b') + ';box-shadow:' + (tab === 'unread' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none') + ';">Unread (' + unread + ')</button>' +
        '</div>' +

        '<div id="notifTabContent" style="max-height:380px;overflow-y:auto;padding-right:4px;"></div>' +

        '<div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;margin-top:12px;border-top:1px solid #e2e8f0;font-size:12px;">' +
          '<a href="#/notifications" onclick="if(window.Modal) Modal.close();" style="font-weight:700;color:#2563eb;text-decoration:none;">Open Full Notification Center &rarr;</a>' +
          '<button type="button" class="btn btn-ghost btn-sm" onclick="if(window.Modal) Modal.close();" style="font-size:12px;">Close</button>' +
        '</div>' +
      '</div>';

    if (global.Modal && typeof global.Modal.open === "function"){
      global.Modal.open({
        title: "🔔 Notifications & Reminders",
        body: modalHtml
      });
    } else {
      alert("Notification Center: " + notifs.length + " alerts.");
      return;
    }

    function renderTabBody(currentTab){
      var container = document.getElementById("notifTabContent");
      if (!container) return;

      if (currentTab === "reminders"){
        var remList = NotificationHub.getUpcomingReminders();
        if (remList.length === 0){
          container.innerHTML = '<div style="text-align:center;padding:32px 16px;color:#64748b;"><div style="font-size:32px;margin-bottom:8px;">🗓️</div><div style="font-weight:700;color:#0f172a;">No upcoming payment reminders</div><div style="font-size:12px;margin-top:4px;">Set a reminder for your tuition fee or family remittance so you never miss a deadline.</div></div>';
          return;
        }
        container.innerHTML = remList.map(function(r){
          return (
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">' +
                  '<span style="font-weight:800;font-size:13px;color:#0f172a;">' + U.esc(r.title) + '</span>' +
                  '<span style="background:#dbeafe;color:#1e40af;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;">' + U.esc(r.frequency) + '</span>' +
                '</div>' +
                '<div style="font-size:12px;color:#475569;margin-bottom:2px;">Due: <b>' + U.esc(r.dueDate) + '</b> · To: ' + U.esc(r.recipient) + '</div>' +
                '<div style="font-size:11px;color:#94a3b8;">' + U.esc(r.notes || 'No extra notes') + '</div>' +
              '</div>' +
              '<div style="text-align:right;flex:0 0 auto;">' +
                '<div style="font-weight:800;font-size:14px;color:#15803d;">' + U.esc(r.currency) + ' ' + Number(r.amount).toLocaleString() + '</div>' +
                '<div style="margin-top:6px;display:flex;gap:6px;justify-content:flex-end;">' +
                  '<a href="#/send?amount=' + encodeURIComponent(r.amount) + '&currency=' + encodeURIComponent(r.currency) + '" onclick="if(window.Modal)Modal.close();" class="btn btn-primary btn-sm" style="font-size:10.5px;padding:3px 8px;">Pay Now</a>' +
                  '<button type="button" class="btn btn-ghost btn-sm btn-del-rem" data-id="' + U.esc(r.id) + '" style="font-size:10.5px;padding:3px 6px;color:#ef4444;">✕</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join("");

        container.querySelectorAll(".btn-del-rem").forEach(function(b){
          b.addEventListener("click", function(){
            NotificationHub.deleteReminder(b.getAttribute("data-id"));
            renderTabBody("reminders");
          });
        });
        return;
      }

      var items = NotificationHub.list();
      if (currentTab === "unread"){
        items = items.filter(function(x){ return x.unread; });
      }

      if (items.length === 0){
        container.innerHTML = '<div style="text-align:center;padding:32px 16px;color:#64748b;"><div style="font-size:32px;margin-bottom:8px;">✨</div><div style="font-weight:700;color:#0f172a;">No notifications here</div><div style="font-size:12px;margin-top:4px;">You are all caught up! Real-time alerts will appear here as activity occurs.</div></div>';
        return;
      }

      container.innerHTML = items.map(function(n){
        var icon = n.category === "TRANSFER" ? "💸" : n.category === "TUITION_REMINDER" ? "🎓" : n.category === "SECURITY" ? "🛡️" : n.category === "KYC" ? "🆔" : "🔔";
        var borderLeft = n.unread ? "4px solid #2563eb" : "1px solid #e2e8f0";
        var bg = n.unread ? "#f0f7ff" : "#ffffff";
        var timeAgo = new Date(n.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) + " · " + new Date(n.timestamp).toLocaleDateString([], { month:'short', day:'numeric' });

        return (
          '<div style="background:' + bg + ';border:1px solid #e2e8f0;border-left:' + borderLeft + ';border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:pointer;" class="notif-card-item" data-id="' + U.esc(n.id) + '">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
              '<div style="display:flex;align-items:flex-start;gap:10px;flex:1;">' +
                '<span style="font-size:18px;line-height:1;margin-top:2px;">' + icon + '</span>' +
                '<div style="flex:1;">' +
                  '<div style="font-weight:750;font-size:13px;color:#0f172a;margin-bottom:3px;display:flex;align-items:center;gap:6px;">' +
                    '<span>' + U.esc(n.title) + '</span>' +
                    (n.unread ? '<span style="width:7px;height:7px;border-radius:50%;background:#2563eb;display:inline-block;"></span>' : '') +
                  '</div>' +
                  '<div style="font-size:12px;color:#475569;line-height:1.45;margin-bottom:6px;">' + U.esc(n.message) + '</div>' +
                  '<div style="display:flex;align-items:center;gap:12px;font-size:11px;color:#94a3b8;">' +
                    '<span>' + U.esc(timeAgo) + '</span>' +
                    (n.amount ? '<span style="font-weight:700;color:#0f172a;">' + U.esc(n.amount) + '</span>' : '') +
                    (n.actionLabel ? '<a href="' + U.esc(n.actionRoute || '#/dashboard') + '" onclick="if(window.Modal)Modal.close();" style="color:#2563eb;font-weight:700;text-decoration:none;">' + U.esc(n.actionLabel) + ' &rarr;</a>' : '') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join("");

      container.querySelectorAll(".notif-card-item").forEach(function(card){
        card.addEventListener("click", function(){
          var id = card.getAttribute("data-id");
          NotificationHub.markAsRead(id);
          card.style.background = "#ffffff";
          card.style.borderLeft = "1px solid #e2e8f0";
          NotificationHub.updateBadge();
        });
      });
    }

    renderTabBody(tab);

    document.querySelectorAll(".notif-tab-btn").forEach(function(btn){
      btn.addEventListener("click", function(){
        document.querySelectorAll(".notif-tab-btn").forEach(function(b){
          b.style.background = "transparent";
          b.style.color = "#64748b";
          b.style.boxShadow = "none";
        });
        btn.style.background = "#fff";
        btn.style.color = "#0f172a";
        btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
        renderTabBody(btn.getAttribute("data-tab"));
      });
    });

    var markAllBtn = document.getElementById("btnNotifMarkAll");
    if (markAllBtn){
      markAllBtn.addEventListener("click", function(){
        NotificationHub.markAllAsRead();
        renderTabBody("all");
      });
    }

    var newRemBtn = document.getElementById("btnNotifNewRem");
    if (newRemBtn){
      newRemBtn.addEventListener("click", function(){
        NotificationHub.openAddReminderModal();
      });
    }
  },

  openAddReminderModal: function(prefill){
    var pf = prefill || {};
    var formHtml =
      '<div style="max-width:500px;width:100%;margin:0 auto;">' +
        '<h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 4px;">🗓️ Schedule Payment Reminder</h2>' +
        '<p style="font-size:12px;color:#64748b;margin:0 0 16px;">Set an automated alert for university tuition, accommodation fees, or family support.</p>' +
        '<form id="formAddReminder" style="display:grid;gap:12px;">' +
          '<div>' +
            '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Reminder Title *</label>' +
            '<input type="text" id="remTitle" class="input" style="width:100%;" required placeholder="e.g. Tsinghua Semester 2 Tuition" value="' + U.esc(pf.title || '') + '">' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Amount *</label>' +
              '<input type="number" id="remAmount" class="input" style="width:100%;" required placeholder="5000" value="' + U.esc(pf.amount || '') + '">' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Currency</label>' +
              '<select id="remCurrency" class="input" style="width:100%;">' +
                '<option value="CNY" ' + (pf.currency === 'CNY' ? 'selected' : '') + '>CNY (Chinese Yuan)</option>' +
                '<option value="BDT" ' + (!pf.currency || pf.currency === 'BDT' ? 'selected' : '') + '>BDT (Bangladeshi Taka)</option>' +
                '<option value="USD" ' + (pf.currency === 'USD' ? 'selected' : '') + '>USD (US Dollar)</option>' +
                '<option value="GBP" ' + (pf.currency === 'GBP' ? 'selected' : '') + '>GBP (British Pound)</option>' +
                '<option value="CAD" ' + (pf.currency === 'CAD' ? 'selected' : '') + '>CAD (Canadian Dollar)</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Due Date *</label>' +
              '<input type="date" id="remDueDate" class="input" style="width:100%;" required value="' + (new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)) + '">' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Frequency</label>' +
              '<select id="remFreq" class="input" style="width:100%;">' +
                '<option value="One-time">One-time payment</option>' +
                '<option value="Monthly">Monthly</option>' +
                '<option value="Semester">Semester (Every 4 months)</option>' +
                '<option value="Annual">Annual (Yearly)</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Recipient / University</label>' +
            '<input type="text" id="remRecipient" class="input" style="width:100%;" placeholder="e.g. University Registrar or Beneficiary Name" value="' + U.esc(pf.recipient || '') + '">' +
          '</div>' +
          '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">' +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="if(window.Modal)Modal.close();">Cancel</button>' +
            '<button type="submit" class="btn btn-primary btn-sm">Save Reminder</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    if (global.Modal && typeof global.Modal.open === "function"){
      global.Modal.open({
        title: "🗓️ Schedule Payment Reminder",
        body: formHtml
      });
      var f = document.getElementById("formAddReminder");
      if (f){
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var title = document.getElementById("remTitle").value.trim();
          var amount = parseFloat(document.getElementById("remAmount").value) || 0;
          var currency = document.getElementById("remCurrency").value;
          var dueDate = document.getElementById("remDueDate").value;
          var frequency = document.getElementById("remFreq").value;
          var recipient = document.getElementById("remRecipient").value.trim() || "University / Beneficiary";

          if (!title || !amount){
            if (global.Toast) global.Toast.show("Please enter title and amount.", "warn");
            return;
          }

          NotificationHub.addUpcomingPaymentReminder({
            title: title,
            amount: amount,
            currency: currency,
            amountBDT: currency === "CNY" ? Math.round(amount * 16.7527) : currency === "USD" ? Math.round(amount * 121.85) : amount,
            dueDate: dueDate,
            frequency: frequency,
            recipient: recipient
          });

          if (global.Modal) global.Modal.close();
        });
      }
    }
  }
};

/* Module ModNotifications for dedicated #/notifications & #/alerts page */
var ModNotifications = {
  render: function(targetEl){
    var el = targetEl || document.getElementById("view");
    if (!el) return;

    var notifs = NotificationHub.list();
    var rems = NotificationHub.getUpcomingReminders();
    var unreadCount = notifs.filter(function(n){ return n.unread; }).length;

    el.innerHTML =
      '<div class="page-container" style="max-width:1120px;margin:0 auto;padding:24px 16px 80px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:20px;">' +
          '<div>' +
            '<h1 style="font-size:26px;font-weight:800;color:#0f172a;margin:0 0 4px;letter-spacing:-0.02em;">🔔 Notification Center &amp; Reminders</h1>' +
            '<p style="font-size:14px;color:#64748b;margin:0;">Manage live transaction notifications, scheduled tuition sinking reminders, and multi-channel alerts.</p>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="pgMarkAllReadBtn">✓ Mark All Read</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="pgAddReminderBtn">＋ Add Reminder</button>' +
          '</div>' +
        '</div>' +

        (!global.AuthService || !global.AuthService.signedIn() ?
          '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="font-size:24px;">🔔</span>' +
              '<div>' +
                '<b style="font-size:14px;color:#14532d;">Public Live Demonstration Alerts &amp; Payment Reminders</b>' +
                '<div style="font-size:12.5px;color:#166534;margin-top:2px;">Showing real-time simulated student alerts. Sign in (<b>ishan@probaho.demo</b> · <b>demo1234</b>) or create an account to manage your personalized alerts.</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
              '<a href="#/sign-in" class="btn btn-secondary btn-sm" style="font-size:12px;font-weight:700;">Student Sign In</a>' +
              '<a href="#/sign-up" class="btn btn-primary btn-sm" style="font-size:12px;font-weight:700;">✨ Create Account</a>' +
            '</div>' +
          '</div>' : '') +

        '<div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:24px;" class="notif-page-grid">' +
          /* Left Column: Notifications Feed */
          '<div>' +
            '<div class="card" style="padding:20px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
                '<h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0;">Recent Activity &amp; Live Alerts</h2>' +
                '<span style="font-size:12px;font-weight:700;color:#2563eb;">' + unreadCount + ' unread</span>' +
              '</div>' +
              '<div id="pageNotifListContainer">' +
                (notifs.length === 0 ? '<div style="text-align:center;padding:40px;color:#64748b;">No notifications recorded.</div>' : notifs.map(function(n){
                  var icon = n.category === "TRANSFER" ? "💸" : n.category === "TUITION_REMINDER" ? "🎓" : n.category === "SECURITY" ? "🛡️" : "🔔";
                  var bg = n.unread ? "#f0f7ff" : "#f8fafc";
                  var border = n.unread ? "1.5px solid #93c5fd" : "1px solid #e2e8f0";
                  return (
                    '<div style="background:' + bg + ';border:' + border + ';border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;">' +
                      '<span style="font-size:22px;line-height:1;margin-top:2px;">' + icon + '</span>' +
                      '<div style="flex:1;">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">' +
                          '<span style="font-weight:750;font-size:14px;color:#0f172a;">' + U.esc(n.title) + '</span>' +
                          '<span style="font-size:11px;color:#94a3b8;">' + new Date(n.timestamp).toLocaleDateString() + '</span>' +
                        '</div>' +
                        '<div style="font-size:13px;color:#475569;line-height:1.45;margin-bottom:8px;">' + U.esc(n.message) + '</div>' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;">' +
                          '<span style="font-weight:700;color:#15803d;">' + U.esc(n.amount || '') + '</span>' +
                          (n.actionLabel ? '<a href="' + U.esc(n.actionRoute || '#/dashboard') + '" class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 8px;">' + U.esc(n.actionLabel) + '</a>' : '') +
                        '</div>' +
                      '</div>' +
                    '</div>'
                  );
                }).join("")) +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Right Column: Upcoming Payment Reminders & Channels */
          '<div>' +
            '<div class="card" style="padding:20px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);margin-bottom:20px;">' +
              '<h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 12px;display:flex;align-items:center;gap:8px;">' +
                '<span>🗓️ Upcoming Payment Reminders</span>' +
              '</h2>' +
              (rems.length === 0 ? '<div style="font-size:12px;color:#64748b;padding:12px 0;">No scheduled reminders. Click "+ Add Reminder" to set one.</div>' : rems.map(function(r){
                return (
                  '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                      '<span style="font-weight:750;font-size:13px;color:#0f172a;">' + U.esc(r.title) + '</span>' +
                      '<span style="font-weight:800;font-size:13px;color:#15803d;">' + U.esc(r.currency) + ' ' + Number(r.amount).toLocaleString() + '</span>' +
                    '</div>' +
                    '<div style="font-size:12px;color:#64748b;margin-bottom:6px;">Due: <b>' + U.esc(r.dueDate) + '</b> (' + U.esc(r.frequency) + ')</div>' +
                    '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
                      '<a href="#/send?amount=' + encodeURIComponent(r.amount) + '&currency=' + encodeURIComponent(r.currency) + '" class="btn btn-primary btn-sm" style="font-size:11px;padding:3px 8px;">Send Now</a>' +
                    '</div>' +
                  '</div>'
                );
              }).join("")) +
            '</div>' +

            /* Notification Channels / Delivery Preferences */
            '<div class="card" style="padding:20px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
              '<h3 style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 12px;">Alert Delivery Channels</h3>' +
              '<div style="display:grid;gap:10px;font-size:12.5px;color:#334155;">' +
                '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">' +
                  '<span>📲 In-App &amp; Push Notifications</span>' +
                  '<input type="checkbox" checked style="accent-color:#2563eb;width:16px;height:16px;">' +
                '</label>' +
                '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">' +
                  '<span>💬 WhatsApp Payment Reminders</span>' +
                  '<input type="checkbox" checked style="accent-color:#2563eb;width:16px;height:16px;">' +
                '</label>' +
                '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">' +
                  '<span>✉️ Email Transfer Receipts</span>' +
                  '<input type="checkbox" checked style="accent-color:#2563eb;width:16px;height:16px;">' +
                '</label>' +
                '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">' +
                  '<span>🛡️ ScamShield Instant Threat Alerts</span>' +
                  '<input type="checkbox" checked style="accent-color:#2563eb;width:16px;height:16px;">' +
                '</label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var markBtn = document.getElementById("pgMarkAllReadBtn");
    if (markBtn){
      markBtn.addEventListener("click", function(){
        NotificationHub.markAllAsRead();
        ModNotifications.render(el);
      });
    }

    var addBtn = document.getElementById("pgAddReminderBtn");
    if (addBtn){
      addBtn.addEventListener("click", function(){
        NotificationHub.openAddReminderModal();
      });
    }
  }
};

global.NotificationHub = NotificationHub;
global.ModNotifications = ModNotifications;

document.addEventListener("DOMContentLoaded", function(){
  NotificationHub.updateBadge();
});

})(typeof window !== "undefined" ? window : global);

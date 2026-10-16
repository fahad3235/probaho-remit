/* admin-users.js — Unified Dark-Mode Admin User Directory & Console Access Control.
   Combines Console RBAC Demo Accounts (table.data) AND Full Platform User Directory (SeedUsers)
   with high-contrast dark mode styling, search, role filtering, Add User, and Edit User modals. */
(function(global){
"use strict";
var U = global.U;

var activeFilter = "all";

function userList(){
  var admin = global.AppState.get("admin");
  if (!admin.demoUsers){
    admin.demoUsers = global.AuthService.accounts().map(function(a){
      return { email:a.email, name:a.name, role:a.role, enabled:true };
    });
  }
  return admin.demoUsers;
}

function render(){
  var A = global.AdminApp;
  var canWrite = global.AuthService.canWrite("users");
  var me = global.AuthService.session();
  var users = userList();
  var allPlatformUsers = global.SeedUsers || [];

  var filteredPlatform = allPlatformUsers.filter(function(u){
    if (activeFilter === "admins") return u.role === "Admin";
    if (activeFilter === "members") return u.role !== "Admin";
    return true;
  });

  var rows = users.map(function(u){
    return '<tr>' +
      '<td><b style="color:#fff;">' + U.esc(u.name) + '</b><br><span class="tiny muted mono">' + U.esc(u.email) + '</span></td>' +
      '<td><span class="role-pill">' + U.esc(u.role) + '</span></td>' +
      '<td>' + (u.enabled
          ? '<span class="badge badge-ok">Active</span>'
          : '<span class="badge badge-warn">Disabled</span>') + '</td>' +
      '<td class="row-actions">' + (canWrite
          ? '<button class="btn btn-ghost btn-sm" data-role="' + U.esc(u.email) + '">Change role</button>' +
            '<button class="btn btn-ghost btn-sm" data-toggle="' + U.esc(u.email) + '">' +
              (u.enabled ? "Disable" : "Enable") + '</button>'
          : '<span class="tiny muted">read-only</span>') + '</td></tr>';
  }).join("");

  var platformRows = filteredPlatform.map(function(u){
    var fallbackSvg = U.avatarSvg(u.name, "#2563eb");
    var isAct = u.status === "Active";
    return '<tr>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<img src="' + U.esc(u.avatar || fallbackSvg) + '" onerror="this.onerror=null;this.src=\'' + fallbackSvg + '\';" alt="' + U.esc(u.name) + '" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1.5px solid #38bdf8;">' +
          '<b style="font-size:14px;color:#f8fafc;">' + U.esc(u.name) + '</b>' +
        '</div>' +
      '</td>' +
      '<td class="mono" style="color:#94a3b8;font-size:13px;">' + U.esc(u.email) + '</td>' +
      '<td><span class="role-pill">' + U.esc(u.role) + '</span></td>' +
      '<td><span class="badge ' + (isAct ? 'badge-ok' : 'badge-crit') + '">' + U.esc(u.status) + '</span></td>' +
      '<td style="color:#94a3b8;font-size:12.5px;">' + U.esc(u.lastLogin) + '</td>' +
      '<td style="text-align:right;">' +
        '<button type="button" class="btn btn-secondary btn-sm" data-user-act="' + U.esc(u.id) + '" style="border-radius:8px;padding:4px 12px;">Manage</button>' +
      '</td>' +
    '</tr>';
  }).join("");

  var body =
    '<div class="demo-note" role="note">' + U.icon("info") +
    '<span><b>DEMO USER MANAGEMENT.</b> Manage both platform customer accounts and staff console access roles in one unified dark command view.</span></div>' +

    /* Card 1: Platform Customer & Member Directory */
    '<div class="card" style="margin-bottom:20px;">' +
      '<div class="card-head" style="margin-bottom:16px;">' +
        '<div>' +
          '<h2>Platform User Directory (' + allPlatformUsers.length + ' Accounts)</h2>' +
          '<span class="tiny muted">Search, add, suspend, or promote customer and staff accounts across global corridors.</span>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" id="addUserModalBtn" style="border-radius:10px;padding:8px 16px;">+ Add New User</button>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="btn btn-sm ' + (activeFilter==="all"?"btn-primary":"btn-secondary") + '" data-uf="all">All Users (' + allPlatformUsers.length + ')</button>' +
          '<button type="button" class="btn btn-sm ' + (activeFilter==="admins"?"btn-primary":"btn-secondary") + '" data-uf="admins">Admins</button>' +
          '<button type="button" class="btn btn-sm ' + (activeFilter==="members"?"btn-primary":"btn-secondary") + '" data-uf="members">Members</button>' +
        '</div>' +
        '<input type="text" class="input" id="userSearchInput" placeholder="🔍 Search users by name or email..." style="max-width:280px;">' +
      '</div>' +

      '<div class="table-wrap">' +
        '<table class="clean-table" id="platformUsersTable">' +
          '<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th style="text-align:right;">Actions</th></tr></thead>' +
          '<tbody>' + platformRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    /* Card 2: Staff Console RBAC Accounts (table.data required by QA harness) */
    '<div class="card"><div class="card-head"><h2>' + users.length + ' Console Access Accounts (RBAC)</h2></div>' +
    '<div class="table-wrap"><table class="data"><thead><tr>' +
    '<th scope="col">Account</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Actions</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +

    '<div class="card" style="margin-top:18px"><div class="card-head"><h2>Console Role Permissions</h2></div>' +
    '<ul class="check-list">' +
    '<li><span class="dot ok"></span><b>owner</b>&nbsp;— Full administrative clearance across all 14 console sections, liquidity pools, KYC queue, corridors, providers, and system settings.</li>' +
    '</ul></div>';

  var el = A.page("users", "Users & Access Control",
    "Manage platform customer accounts, KYC status, and administrative RBAC roles.",
    body);
  if (!el) return;

  /* Filter & Search for Platform User Directory */
  U.$$("[data-uf]", el).forEach(function(b){
    b.addEventListener("click", function(){
      activeFilter = b.getAttribute("data-uf");
      render();
    });
  });

  var searchInp = U.$("#userSearchInput", el);
  if (searchInp){
    searchInp.addEventListener("input", function(){
      var q = searchInp.value.trim().toLowerCase();
      U.$$("#platformUsersTable tbody tr", el).forEach(function(row){
        row.style.display = (!q || row.textContent.toLowerCase().indexOf(q) >= 0) ? "" : "none";
      });
    });
  }

  var addBtn = U.$("#addUserModalBtn", el);
  if (addBtn){
    addBtn.addEventListener("click", function(){
      global.Modal.open({
        title: "Add New Platform User Account",
        body: '<div style="display:grid;gap:12px;">' +
          '<div class="field"><label>Full Name</label><input class="input" id="newUserName" placeholder="e.g. Tariqul Islam"></div>' +
          '<div class="field"><label>Email Address</label><input class="input" id="newUserEmail" placeholder="e.g. tariq@domain.com"></div>' +
          '<div class="field"><label>Platform Role</label><select class="input" id="newUserRole"><option value="Member">Member</option><option value="Admin">Admin</option></select></div>' +
        '</div>',
        okLabel: "Create User",
        onOk: function(){
          var name = (document.getElementById("newUserName").value || "").trim();
          var email = (document.getElementById("newUserEmail").value || "").trim();
          var role = document.getElementById("newUserRole").value;
          if (!name || name.length < 2 || !email || email.indexOf("@") === -1){
            global.Toast.show("Please enter a valid name and email address.", "warn");
            return false;
          }
          if (Array.isArray(global.SeedUsers)){
            global.SeedUsers.unshift({
              id: "USR" + Math.floor(1000 + Math.random() * 9000),
              name: name,
              email: email,
              role: role,
              status: "Active",
              lastLogin: "Just now",
              avatar: U.avatarSvg(name, "#2563eb")
            });
          }
          global.AdminConfig.audit("user.create", "platform-user", email, "ok");
          global.Toast.show("User " + name + " created!", "ok");
          render();
        }
      });
    });
  }

  U.$$("[data-user-act]", el).forEach(function(b){
    b.addEventListener("click", function(){
      var uid = b.getAttribute("data-user-act");
      var u = allPlatformUsers.filter(function(x){ return x.id === uid; })[0];
      if (!u) return;
      global.Modal.open({
        title: "Manage User · " + u.name,
        body: '<div style="display:grid;gap:12px;">' +
          '<div class="field"><label>Role</label><select class="input" id="editUserRole">' +
            '<option value="Member"' + (u.role==="Member"?" selected":"") + '>Member</option>' +
            '<option value="Admin"' + (u.role==="Admin"?" selected":"") + '>Admin</option>' +
          '</select></div>' +
          '<div class="field"><label>Account Status</label><select class="input" id="editUserStatus">' +
            '<option value="Active"' + (u.status==="Active"?" selected":"") + '>Active</option>' +
            '<option value="Suspended"' + (u.status!=="Active"?" selected":"") + '>Suspended</option>' +
          '</select></div>' +
        '</div>',
        okLabel: "Save Changes",
        onOk: function(){
          u.role = document.getElementById("editUserRole").value;
          u.status = document.getElementById("editUserStatus").value;
          global.AdminConfig.audit("user.update", "platform-user", u.email, "status=" + u.status);
          global.Toast.show("Updated " + u.name + ".", "ok");
          render();
        }
      });
    });
  });

  if (!canWrite) return;

  function persist(action, target, result){
    global.AppState.set("admin", global.AppState.get("admin"));
    global.AdminConfig.audit(action, "demo-user", target, result);
  }

  el.addEventListener("click", function(e){
    var r = e.target.closest("[data-role]");
    if (r){
      var email = r.getAttribute("data-role");
      if (me && email === me.email){
        global.Toast.show("You cannot change your own role while signed in.", "warn");
        return;
      }
      var u = users.filter(function(x){ return x.email === email; })[0];
      var bh = A.field("Role for " + u.email,
        ["owner", "editor", "viewer"].map(function(role){
          return '<label class="check-row"><input type="radio" name="ur-role" value="' + role + '"' +
            (u.role === role ? " checked" : "") + '><span><b>' + role + '</b></span></label>';
        }).join(""), "Owner-only. The last active demo owner cannot be demoted.");
      var foot = document.createElement("div");
      var save = document.createElement("button");
      save.className = "btn btn-primary"; save.textContent = "Apply (simulated)";
      save.addEventListener("click", function(){
        var dlg = foot.closest ? foot.closest(".modal") : document;
        var sel = (dlg || document).querySelector('input[name="ur-role"]:checked');
        var role = sel ? sel.value : u.role;
        if (u.role === "owner" && role !== "owner"){
          var owners = users.filter(function(x){ return x.role === "owner" && x.enabled && x.email !== u.email; });
          if (!owners.length){
            global.Toast.show("Refused: the last active demo owner cannot be demoted.", "warn");
            return;
          }
        }
        u.role = role;
        persist("user.role-change", email, "role=" + role);
        global.Modal.close();
        global.Toast.show("Demo role updated (simulated).");
        render();
      });
      foot.appendChild(save);
      global.Modal.open({ title:"Change demo role", body: bh, footer: foot });
      return;
    }
    var t = e.target.closest("[data-toggle]");
    if (t){
      var em = t.getAttribute("data-toggle");
      if (me && em === me.email){
        global.Toast.show("You cannot disable your own signed-in account.", "warn");
        return;
      }
      var usr = users.filter(function(x){ return x.email === em; })[0];
      if (usr.enabled && usr.role === "owner"){
        var others = users.filter(function(x){ return x.role === "owner" && x.enabled && x.email !== usr.email; });
        if (!others.length){
          global.Toast.show("Refused: the last active demo owner cannot be disabled.", "warn");
          return;
        }
      }
      A.confirm((usr.enabled ? "Disable" : "Enable") + " demo account?",
        (usr.enabled
          ? "This demo account will no longer be able to sign in on this browser. Simulated only."
          : "This demo account can sign in again on this browser. Simulated only."),
        usr.enabled ? "Disable" : "Enable", function(){
          usr.enabled = !usr.enabled;
          persist(usr.enabled ? "user.enable" : "user.disable", em, "ok");
          global.Toast.show("Demo account " + (usr.enabled ? "enabled" : "disabled") + " (simulated).");
          render();
        });
    }
  });
}

global.ModAdminUsers = { render: render, meta:{ title:"Admin · Users", nav:null } };
global.ModUsers = global.ModAdminUsers;
})(window);

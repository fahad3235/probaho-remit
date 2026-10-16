/* beneficiaries.js — Global & Local Beneficiaries Management (100% Client-Side Persisted)
   CRUD for saved receivers across bKash, Nagad, Bank / IBAN, and Global Wallets with 1-tap Send shortcuts. */
(function(global){
"use strict";
var U = global.U;

var DEFAULT_BENEFICIARIES = [
  {
    id: "b0000000-0000-0000-0000-000000000001",
    user_id: "u0000000-0000-0000-0000-000000000001",
    name: "Rahim Ahmed",
    country: "Bangladesh 🇧🇩",
    currency: "BDT",
    phone: "+8801812345678",
    payout_method: "bkash",
    bank_name: null,
    branch_name: null,
    account_number: "01812345678",
    relationship: "Brother",
    verified: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    user_id: "u0000000-0000-0000-0000-000000000001",
    name: "Fatema Begum",
    country: "Bangladesh 🇧🇩",
    currency: "BDT",
    phone: "+8801798765432",
    payout_method: "bank",
    bank_name: "City Bank Ltd",
    branch_name: "Dhanmondi Branch",
    account_number: "110293847501",
    relationship: "Mother",
    verified: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "b0000000-0000-0000-0000-000000000003",
    user_id: "u0000000-0000-0000-0000-000000000001",
    name: "University Registrar (Tuition)",
    country: "Bangladesh / Global 🎓",
    currency: "BDT",
    phone: "+8801900112233",
    payout_method: "bank",
    bank_name: "BRAC Bank PLC / SWIFT",
    branch_name: "Gulshan Main Branch",
    account_number: "1501204892001",
    relationship: "Education Tuition",
    verified: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "b0000000-0000-0000-0000-000000000004",
    user_id: "u0000000-0000-0000-0000-000000000001",
    name: "University of Toronto (Registrar)",
    country: "Canada 🇨🇦",
    currency: "CAD",
    phone: "+14169782011",
    payout_method: "bank",
    bank_name: "Royal Bank of Canada (RBC)",
    branch_name: "Toronto Main (SWIFT: ROYCCAT2)",
    account_number: "CA89-0010-29384756",
    relationship: "Education Tuition",
    verified: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "b0000000-0000-0000-0000-000000000005",
    user_id: "u0000000-0000-0000-0000-000000000001",
    name: "Dr. Emily Carter",
    country: "United Kingdom 🇬🇧",
    currency: "GBP",
    phone: "+447700900412",
    payout_method: "wallet",
    bank_name: "Wise / UK Faster Payments",
    branch_name: "London Sort 23-14-70",
    account_number: "+447700900412",
    relationship: "Academic Advisor",
    verified: true,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

function getList(){
  if (global.AppState){
    var saved = global.AppState.get("beneficiaries");
    if (Array.isArray(saved) && saved.length > 0) return saved;
  }
  return DEFAULT_BENEFICIARIES.slice();
}

function saveList(list){
  if (global.AppState){
    global.AppState.set("beneficiaries", list);
  }
}

var activeFilter = "all";
var searchQuery = "";

function fetchBeneficiaries(callback){
  if (callback) callback(getList());
}

function openAddModal(benToEdit, onSaved){
  var isEdit = !!benToEdit;

  var oldModal = document.getElementById("benModal");
  if (oldModal && oldModal.parentNode) oldModal.parentNode.removeChild(oldModal);

  var modalEl = document.createElement("div");
  modalEl.className = "modal-overlay";
  modalEl.id = "benModal";
  modalEl.style.cssText = "position:fixed;inset:0;background:rgba(8,17,31,0.68);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;z-index:99999;";

  var method = isEdit ? benToEdit.payout_method : "bkash";

  modalEl.innerHTML =
    '<div class="modal-box" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:28px;max-width:540px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 45px -10px rgba(0,0,0,0.3);position:relative;box-sizing:border-box;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<div>' +
          '<h2 style="margin:0;font-size:20px;font-weight:800;color:#0f172a;">' + (isEdit ? "Edit Beneficiary" : "Add New Global Beneficiary") + '</h2>' +
          '<p style="margin:2px 0 0;font-size:12px;color:#64748b;">Add a verified recipient for Mobile Wallet, bKash, Nagad, or Global Bank / IBAN</p>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="closeBenModal" style="font-size:18px;line-height:1;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;">✕</button>' +
      '</div>' +

      '<form id="benForm" novalidate>' +
        '<div class="grid g2" style="gap:10px;margin-bottom:14px;">' +
          '<div class="field" style="margin:0;">' +
            '<label class="f" for="bmName">Recipient Full Name *</label>' +
            '<div class="inp"><input id="bmName" required value="' + U.esc(isEdit ? benToEdit.name : "") + '" placeholder="e.g. Rahim Ahmed / Alex Chen" maxlength="60"></div>' +
          '</div>' +
          '<div class="field" style="margin:0;">' +
            '<label class="f" for="bmCountry">Destination Country *</label>' +
            '<div class="inp"><select id="bmCountry">' +
              ["Bangladesh 🇧🇩", "United Kingdom 🇬🇧", "United States 🇺🇸", "Canada 🇨🇦", "Eurozone 🇪🇺", "China 🇨🇳", "India 🇮🇳", "Philippines 🇵🇭", "Singapore 🇸🇬", "Australia 🇦🇺", "UAE 🇦🇪", "Saudi Arabia 🇸🇦"].map(function(ct){
                var sel = isEdit && benToEdit.country === ct ? " selected" : "";
                return '<option value="' + ct + '"' + sel + '>' + ct + '</option>';
              }).join("") +
            '</select></div>' +
          '</div>' +
        '</div>' +

        '<div class="field" style="margin-bottom:14px;">' +
          '<label class="f" for="bmRel">Relationship / Category *</label>' +
          '<div class="inp"><select id="bmRel">' +
            ["Family", "Brother", "Mother", "Education Tuition", "Friend", "Academic Advisor", "Business", "Self", "Other"].map(function(r){
              var sel = isEdit && benToEdit.relationship === r ? " selected" : "";
              return '<option value="' + r + '"' + sel + '>' + r + '</option>';
            }).join("") +
          '</select></div>' +
        '</div>' +

        '<div class="field" style="margin-bottom:14px;">' +
          '<label class="f">Payout Method *</label>' +
          '<div class="seg" id="bmMethodSeg" style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button type="button" data-meth="bkash" class="btn btn-sm ' + (method === "bkash" ? "btn-primary" : "btn-secondary") + '">📱 bKash</button>' +
            '<button type="button" data-meth="nagad" class="btn btn-sm ' + (method === "nagad" ? "btn-primary" : "btn-secondary") + '">⚡ Nagad</button>' +
            '<button type="button" data-meth="wallet" class="btn btn-sm ' + (method === "wallet" ? "btn-primary" : "btn-secondary") + '">🌐 Global Wallet</button>' +
            '<button type="button" data-meth="bank" class="btn btn-sm ' + (method === "bank" ? "btn-primary" : "btn-secondary") + '">🏦 Bank / IBAN</button>' +
          '</div>' +
        '</div>' +

        /* Wallet Section */
        '<div id="bmWalletBox" style="' + (method === "bank" ? "display:none;" : "") + 'margin-bottom:14px;">' +
          '<div class="field">' +
            '<label class="f" for="bmPhone">Mobile Wallet Number / Global Phone *</label>' +
            '<div class="inp"><input id="bmPhone" type="tel" value="' + U.esc(isEdit ? (benToEdit.phone || benToEdit.account_number) : "") + '" placeholder="e.g. 01812345678, +88017..., +447700..., +1415..."></div>' +
            '<p class="hint" style="font-size:11.5px;color:#64748b;margin-top:4px;">Supports Bangladesh 11-digit numbers (01XXXXXXXXX) and global E.164 phone/wallet numbers (+1, +44, +86, +91, etc.).</p>' +
          '</div>' +
        '</div>' +

        /* Bank Section */
        '<div id="bmBankBox" style="' + (method === "bank" ? "" : "display:none;") + 'margin-bottom:14px;">' +
          '<div class="field" style="margin-bottom:10px;">' +
            '<label class="f" for="bmBankName">Bank / Institution Name *</label>' +
            '<div class="inp"><select id="bmBankName">' +
              [
                "City Bank Ltd", "BRAC Bank PLC", "Dutch-Bangla Bank Ltd", "Islami Bank Bangladesh",
                "Eastern Bank PLC", "Standard Chartered", "HSBC Global / UK", "Barclays UK",
                "JPMorgan Chase (ACH/Wire)", "Royal Bank of Canada (RBC)", "ICBC / Bank of China",
                "DBS Bank Singapore", "HDFC / ICICI Bank (UPI/IMPS)"
              ].map(function(bn){
                var sel = isEdit && benToEdit.bank_name === bn ? " selected" : "";
                return '<option value="' + bn + '"' + sel + '>' + bn + '</option>';
              }).join("") +
            '</select></div>' +
          '</div>' +
          '<div class="grid g2" style="gap:10px;">' +
            '<div class="field">' +
              '<label class="f" for="bmBranch">Branch / SWIFT / Sort Code</label>' +
              '<div class="inp"><input id="bmBranch" value="' + U.esc(isEdit ? (benToEdit.branch_name || "") : "") + '" placeholder="e.g. Dhanmondi / SWIFT"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="f" for="bmAcct">Account Number / IBAN *</label>' +
              '<div class="inp"><input id="bmAcct" value="' + U.esc(isEdit ? benToEdit.account_number : "") + '" placeholder="6 to 28 chars (A/C or IBAN)"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<p class="field-err" id="bmErr" style="color:#ef4444;font-size:12.5px;margin-bottom:12px;display:none;"></p>' +

        '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">' +
          '<button type="button" class="btn btn-secondary" id="cancelBenModal">Cancel</button>' +
          '<button type="submit" class="btn btn-primary" id="saveBenBtn">' + (isEdit ? "Save Changes" : "Add Beneficiary") + '</button>' +
        '</div>' +
      '</form>' +
    '</div>';

  document.body.appendChild(modalEl);

  function closeModal(){
    document.removeEventListener("keydown", onEsc);
    if (modalEl && modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
  }

  function onEsc(e){
    if (e.key === "Escape") closeModal();
  }
  document.addEventListener("keydown", onEsc);

  modalEl.addEventListener("click", function(e){
    if (e.target === modalEl) closeModal();
  });

  var closeBtn = U.$("#closeBenModal", modalEl);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  var cancelBtn = U.$("#cancelBenModal", modalEl);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  setTimeout(function(){
    var nameInp = U.$("#bmName", modalEl);
    if (nameInp) nameInp.focus();
  }, 60);

  var selectedMethod = method;
  var segButtons = modalEl.querySelectorAll("#bmMethodSeg button");
  segButtons.forEach(function(b){
    b.addEventListener("click", function(){
      selectedMethod = b.getAttribute("data-meth");
      segButtons.forEach(function(btn){
        btn.className = "btn btn-sm " + (btn.getAttribute("data-meth") === selectedMethod ? "btn-primary" : "btn-secondary");
      });
      var wBox = U.$("#bmWalletBox", modalEl);
      var bBox = U.$("#bmBankBox", modalEl);
      if (selectedMethod === "bank"){
        if (wBox) wBox.style.display = "none";
        if (bBox) bBox.style.display = "";
      } else {
        if (wBox) wBox.style.display = "";
        if (bBox) bBox.style.display = "none";
      }
    });
  });

  U.$("#benForm", modalEl).addEventListener("submit", function(e){
    e.preventDefault();
    var errBox = U.$("#bmErr", modalEl);
    errBox.style.display = "none";
    errBox.textContent = "";

    var nameVal = U.$("#bmName", modalEl).value.trim();
    var countryVal = U.$("#bmCountry", modalEl).value;
    var relVal = U.$("#bmRel", modalEl).value;
    var phoneVal = U.$("#bmPhone", modalEl).value.trim();
    var bankNameVal = U.$("#bmBankName", modalEl).value.trim();
    var branchVal = U.$("#bmBranch", modalEl).value.trim();
    var acctVal = U.$("#bmAcct", modalEl).value.trim();

    if (nameVal.length < 2){
      errBox.textContent = "Please enter receiver's full name (at least 2 characters).";
      errBox.style.display = "block";
      return;
    }

    var payload = {
      name: nameVal,
      country: countryVal,
      relationship: relVal,
      payout_method: selectedMethod
    };

    if (selectedMethod === "bank"){
      if (!bankNameVal){
        errBox.textContent = "Please choose a bank.";
        errBox.style.display = "block";
        return;
      }
      if (!acctVal || acctVal.length < 6){
        errBox.textContent = "Please enter a valid bank account number or IBAN (at least 6 characters).";
        errBox.style.display = "block";
        return;
      }
      payload.bank_name = bankNameVal;
      payload.branch_name = branchVal;
      payload.account_number = acctVal;
      payload.phone = phoneVal || acctVal;
    } else {
      var cleanPhone = phoneVal.replace(/[\s()-]/g, "");
      var globalPhoneRegex = /^(\+?[1-9]\d{6,14}|01[3-9]\d{8})$/;
      if (!globalPhoneRegex.test(cleanPhone)){
        errBox.textContent = "Please enter a valid mobile wallet or phone number (e.g. 01812345678 or +447700900123).";
        errBox.style.display = "block";
        return;
      }
      payload.phone = phoneVal;
      payload.account_number = phoneVal;
    }

    var list = getList();
    var resItem = {
      id: isEdit ? benToEdit.id : "b-" + Date.now(),
      name: payload.name,
      country: payload.country,
      relationship: payload.relationship,
      payout_method: payload.payout_method,
      bank_name: payload.bank_name || null,
      branch_name: payload.branch_name || null,
      account_number: payload.account_number,
      phone: payload.phone,
      verified: true,
      created_at: isEdit ? (benToEdit.created_at || new Date().toISOString()) : new Date().toISOString()
    };

    if (isEdit){
      var idx = list.findIndex(function(x){ return x.id === benToEdit.id; });
      if (idx !== -1) list[idx] = resItem;
      else list.push(resItem);
    } else {
      list.unshift(resItem);
    }
    saveList(list);
    closeModal();
    if (global.Toast) global.Toast.show(isEdit ? "Beneficiary updated successfully." : "Beneficiary added successfully.", "ok");
    if (typeof onSaved === "function") onSaved(resItem);
    else render();
  });
}

function deleteBeneficiary(id, name){
  if (global.Modal && global.Modal.confirm){
    global.Modal.confirm("Remove Beneficiary?", "Are you sure you want to remove <b>" + U.esc(name) + "</b> from your saved beneficiaries?", "Remove", function(){
      var list = getList().filter(function(b){ return b.id !== id; });
      saveList(list);
      render();
      if (global.Toast) global.Toast.show("Beneficiary removed.", "ok");
    });
    return;
  }
  var list = getList().filter(function(b){ return b.id !== id; });
  saveList(list);
  render();
  if (global.Toast) global.Toast.show("Beneficiary removed.", "ok");
}

function render(){
  var el = U.$("#view");
  if (!el) return;
  var beneficiariesList = getList();

  var filtered = beneficiariesList.filter(function(b){
    if (activeFilter !== "all" && b.payout_method !== activeFilter) return false;
    if (searchQuery){
      var q = searchQuery.toLowerCase();
      var matchName = b.name && b.name.toLowerCase().indexOf(q) !== -1;
      var matchPhone = (b.phone || b.account_number) && String(b.phone || b.account_number).toLowerCase().indexOf(q) !== -1;
      var matchBank = b.bank_name && b.bank_name.toLowerCase().indexOf(q) !== -1;
      var matchCountry = b.country && b.country.toLowerCase().indexOf(q) !== -1;
      if (!matchName && !matchPhone && !matchBank && !matchCountry) return false;
    }
    return true;
  });

  el.innerHTML =
    '<div class="page" style="max-width:1320px;">' +
      /* Header Row */
      '<div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">' +
        '<div>' +
          '<p class="eyebrow">User Portal · Global Receivers</p>' +
          '<h1 class="page-title">Saved Beneficiaries</h1>' +
          '<p class="page-sub">Manage verified recipients worldwide. Send money in 1-tap via Mobile Wallets (bKash, Nagad, Wise, Alipay) or direct Bank / IBAN transfer.</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-secondary" id="openBatchSendBtn" style="border-radius:12px;padding:12px 18px;font-weight:750;">' +
            '⚡ Batch Multi-Send' +
          '</button>' +
          '<button type="button" class="btn btn-primary" id="openAddBenBtn" style="border-radius:12px;padding:12px 22px;font-weight:700;">' +
            '+ Add New Beneficiary' +
          '</button>' +
        '</div>' +
      '</div>' +

      /* Filter & Search Bar Card */
      '<div class="card" style="border-radius:18px;padding:18px 22px;margin-bottom:24px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;" id="benFilterSeg">' +
            '<button type="button" class="btn btn-sm ' + (activeFilter === "all" ? "btn-primary" : "btn-secondary") + '" data-filt="all">All (' + beneficiariesList.length + ')</button>' +
            '<button type="button" class="btn btn-sm ' + (activeFilter === "bkash" ? "btn-primary" : "btn-secondary") + '" data-filt="bkash">bKash (' + beneficiariesList.filter(function(x){ return x.payout_method === "bkash"; }).length + ')</button>' +
            '<button type="button" class="btn btn-sm ' + (activeFilter === "nagad" ? "btn-primary" : "btn-secondary") + '" data-filt="nagad">Nagad (' + beneficiariesList.filter(function(x){ return x.payout_method === "nagad"; }).length + ')</button>' +
            '<button type="button" class="btn btn-sm ' + (activeFilter === "wallet" ? "btn-primary" : "btn-secondary") + '" data-filt="wallet">Global Wallet (' + beneficiariesList.filter(function(x){ return x.payout_method === "wallet"; }).length + ')</button>' +
            '<button type="button" class="btn btn-sm ' + (activeFilter === "bank" ? "btn-primary" : "btn-secondary") + '" data-filt="bank">Bank / IBAN (' + beneficiariesList.filter(function(x){ return x.payout_method === "bank"; }).length + ')</button>' +
          '</div>' +
          '<div class="dash-search-box" style="width:min(100%, 280px);">' +
            '<span>🔍</span>' +
            '<input type="text" id="benSearchInp" value="' + U.esc(searchQuery) + '" placeholder="Search by name, country, bank...">' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Grid of Beneficiary Cards */
      (filtered.length === 0 ?
        '<div class="card" style="text-align:center;padding:50px 20px;border-radius:20px;">' +
          '<div style="font-size:42px;margin-bottom:12px;">👥</div>' +
          '<h3 style="margin-bottom:6px;color:#0f172a;">No beneficiaries found</h3>' +
          '<p class="muted" style="margin-bottom:18px;">' + (searchQuery ? "No receivers match your search." : "You haven't saved any receivers yet.") + '</p>' +
          '<button type="button" class="btn btn-primary" id="emptyAddBtn">+ Add Beneficiary</button>' +
        '</div>' :
        '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(min(100%, 275px), 1fr));gap:20px;">' +
          filtered.map(function(b){
            var isBkash = b.payout_method === "bkash";
            var isNagad = b.payout_method === "nagad";
            var isWallet = b.payout_method === "wallet";
            var isBank = b.payout_method === "bank";

            var badgeColor = isBkash ? "#e11d48" : isNagad ? "#ea580c" : isWallet ? "#0284c7" : "#0D9F9A";
            var badgeBg = isBkash ? "#ffe4e6" : isNagad ? "#ffedd5" : isWallet ? "#e0f2fe" : "#CCFBF1";
            var badgeLabel = isBkash ? "bKash" : isNagad ? "Nagad" : isWallet ? "Global Wallet" : "Bank / IBAN";
            var iconSymbol = isBkash ? "📱" : isNagad ? "⚡" : isWallet ? "🌐" : "🏦";

            return '<div class="card" style="border-radius:20px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 10px rgba(0,0,0,0.04);position:relative;">' +
              '<div>' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">' +
                  '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<div style="width:44px;height:44px;border-radius:12px;background:' + badgeBg + ';color:' + badgeColor + ';display:grid;place-items:center;font-size:20px;flex-shrink:0;">' +
                      iconSymbol +
                    '</div>' +
                    '<div>' +
                      '<h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">' + U.esc(b.name) + '</h3>' +
                      '<span style="font-size:12px;color:#64748b;display:inline-block;margin-top:2px;">' + U.esc(b.relationship || "Beneficiary") + (b.country ? ' · ' + U.esc(b.country) : '') + '</span>' +
                    '</div>' +
                  '</div>' +
                  '<span style="font-size:11px;font-weight:750;color:' + badgeColor + ';background:' + badgeBg + ';padding:3px 10px;border-radius:6px;">' +
                    badgeLabel +
                  '</span>' +
                '</div>' +

                /* Account / Number info */
                '<div style="background:#f8fafc;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:13px;">' +
                  (isBank ?
                    '<div><b style="color:#0f172a;display:block;">' + U.esc(b.bank_name || "Commercial Bank") + '</b>' +
                    '<span style="color:#64748b;font-size:12px;">' + (b.branch_name ? U.esc(b.branch_name) + ' · ' : '') + 'A/C: <span class="mono" style="font-weight:700;color:#1e293b;">' + U.esc(b.account_number) + '</span></span></div>' :
                    '<div><span style="color:#64748b;">Wallet / Phone:</span> <b class="mono" style="font-size:14px;color:#0f172a;letter-spacing:0.5px;">' + U.esc(b.phone || b.account_number) + '</b></div>'
                  ) +
                  '<div style="margin-top:6px;display:flex;align-items:center;gap:4px;color:#15803d;font-size:11px;font-weight:700;">' +
                    '<span>✓ Verified Recipient</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              /* Action Buttons */
              '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;">' +
                '<a href="#/send?beneficiary_id=' + encodeURIComponent(b.id) + '" class="btn btn-primary btn-sm btn-block" style="text-align:center;text-decoration:none;font-weight:750;border-radius:10px;padding:9px 14px;">' +
                  'Send Money 💸' +
                '</a>' +
                '<button type="button" class="btn btn-ghost btn-sm" data-edit-ben="' + U.esc(b.id) + '" title="Edit receiver" style="padding:8px 10px;border-radius:10px;">' +
                  '✏️' +
                '</button>' +
                '<button type="button" class="btn btn-ghost btn-sm" data-del-ben="' + U.esc(b.id) + '" data-name="' + U.esc(b.name) + '" title="Remove receiver" style="padding:8px 10px;border-radius:10px;color:#ef4444;">' +
                  '🗑️' +
                '</button>' +
              '</div>' +

            '</div>';
          }).join("") +
        '</div>'
      ) +
    '</div>';

  /* Bind Events */
  var batchBtn = U.$("#openBatchSendBtn", el);
  if (batchBtn){
    batchBtn.addEventListener("click", function(){
      var list = getList();
      var rowsHtml = list.map(function(b, i){
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;gap:10px;">' +
          '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;">' +
            '<input type="checkbox" class="batch-rec-ck" data-bidx="' + i + '"' + (i < 2 ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:#0D9F9A;">' +
            '<div><b style="font-size:13.5px;color:#0f172a;">' + U.esc(b.name) + '</b><div class="tiny muted">' + U.esc(b.payout_method.toUpperCase()) + ' · ' + U.esc(b.account_number || b.phone) + '</div></div>' +
          '</label>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<input type="number" class="input mono batch-rec-amt" data-bidx="' + i + '" value="' + (i === 0 ? '200' : i === 1 ? '300' : '150') + '" min="10" style="width:100px;font-weight:800;">' +
            '<span style="font-size:12px;font-weight:700;color:#475569;">USD</span>' +
          '</div>' +
        '</div>';
      }).join("");

      global.Modal.open({
        title: "⚡ Multi-Recipient Batch Remittance (1-Click Split Send)",
        body: '<div style="display:grid;gap:12px;">' +
          '<p style="margin:0;font-size:13px;color:#475569;">Select multiple verified beneficiaries to fund in a single batch transaction with 0% promo fee and +2.5% BD Govt Incentive on BDT payouts.</p>' +
          '<div style="display:grid;gap:8px;max-height:280px;overflow-y:auto;">' + rowsHtml + '</div>' +
        '</div>',
        okLabel: "🚀 Execute Batch Transfer",
        onOk: function(){
          var cks = document.querySelectorAll(".batch-rec-ck");
          var amts = document.querySelectorAll(".batch-rec-amt");
          var count = 0, totalUsd = 0;
          var transfers = (global.AppState && global.AppState.get("transfers")) || [];
          for (var i = 0; i < cks.length; i++){
            if (cks[i].checked){
              var amt = Math.max(0, parseFloat(amts[i].value) || 0);
              if (amt > 0 && list[i]){
                count++;
                totalUsd += amt;
                var b = list[i];
                var bdtRecv = Math.round(amt * 119.50 * 100) / 100;
                transfers.unshift({
                  id: "t-batch-" + Date.now() + "-" + i,
                  psp_reference: "BATCH-" + Math.floor(100000 + Math.random() * 900000),
                  beneficiary_id: b.id,
                  recipient_name: b.name,
                  payout_method: b.payout_method,
                  corridor: "US-BD",
                  send_amount: amt,
                  send_currency: "USD",
                  receive_amount: bdtRecv,
                  receive_currency: "BDT",
                  exchange_rate: 119.50,
                  fee: 0,
                  status: "paid_out",
                  created_at: new Date().toISOString()
                });
              }
            }
          }
          if (count === 0){
            global.Toast.show("Select at least one recipient with a positive amount.", "warn");
            return false;
          }
          if (global.AppState) global.AppState.set("transfers", transfers);
          global.Toast.show("Dispatched batch transfer of $" + totalUsd.toLocaleString() + " USD to " + count + " recipients!", "ok");
          location.hash = "#/dashboard";
        }
      });
    });
  }

  var addBtn = U.$("#openAddBenBtn", el);
  if (addBtn) addBtn.addEventListener("click", function(){ openAddModal(null); });
  var emptyBtn = U.$("#emptyAddBtn", el);
  if (emptyBtn) emptyBtn.addEventListener("click", function(){ openAddModal(null); });

  var searchInp = U.$("#benSearchInp", el);
  if (searchInp){
    searchInp.addEventListener("input", U.debounce(function(){
      searchQuery = searchInp.value.trim();
      render();
    }, 250));
  }

  var filtButtons = el.querySelectorAll("#benFilterSeg button");
  filtButtons.forEach(function(btn){
    btn.addEventListener("click", function(){
      activeFilter = btn.getAttribute("data-filt");
      render();
    });
  });

  el.querySelectorAll("[data-edit-ben]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-edit-ben");
      var target = getList().find(function(x){ return x.id === id; });
      if (target) openAddModal(target);
    });
  });

  el.querySelectorAll("[data-del-ben]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-del-ben");
      var name = b.getAttribute("data-name");
      deleteBeneficiary(id, name);
    });
  });
}

global.ModBeneficiaries = {
  render: render,
  fetchBeneficiaries: fetchBeneficiaries,
  openAddModal: openAddModal,
  list: getList,
  reset: function(){ saveList(DEFAULT_BENEFICIARIES.slice()); },
  meta: {
    title: "Beneficiaries",
    nav: "Beneficiaries",
    icon: "users",
    desc: "Saved global receivers for Probaho Remit: Mobile Wallets, bKash, Nagad, and Bank / IBAN accounts."
  }
};
})(typeof window !== "undefined" ? window : global);

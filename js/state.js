/* state.js — one shared store. Rendering reads state; modules write via set().
   100% Standalone Client-Side Persistence (No Backend Required). */
(function(global){
"use strict";

function deepClone(o){
  if (o === null || typeof o === "undefined") return o;
  return JSON.parse(JSON.stringify(o));
}

function seedTuition(){
  /* Admin-edited seed defaults (if any) decide what a reset restores. */
  var seeds = (global.AdminConfig && global.AdminConfig.getTuitionSeeds && global.AdminConfig.getTuitionSeeds()) || null;
  var base = global.SeedTuition || {};
  var deadlines = deepClone((seeds && seeds.deadlines) || base.deadlines || []);
  var checklist = ((seeds && seeds.checklist) || base.checklist || []).map(function(c){
    return { id:c.id, label:c.label, text:c.text, done:!!c.done, checked:c.checked !== false };
  });
  var budget = deepClone((seeds && seeds.budget) || base.budget || {});
  return { deadlines: deadlines, checklist: checklist, budget: budget };
}

function seedTransfers(){
  var now = Date.now();
  return [
    {
      id: "t0000000-0000-0000-0000-000000000001",
      psp_reference: "ALIPAY-CN-948102",
      beneficiary_id: "b0000000-0000-0000-0000-000000000001",
      recipient_name: "Rahim Ahmed",
      payout_method: "bkash",
      account_number: "01812345678",
      corridor: "CN-BD",
      send_currency: "CNY",
      send_amount: 1000,
      receive_currency: "BDT",
      receive_amount: 16752.70,
      fx_rate: 16.7527,
      fee_amount: 0,
      purpose: "Family Support",
      payment_method: "Alipay",
      status: "paid_out",
      created_at: new Date(now - 36 * 3600000).toISOString(),
      events: [
        { status: "draft", detail: "Transfer order created & rate locked (1 CNY = 16.7527 BDT)", created_at: new Date(now - 36 * 3600000).toISOString() },
        { status: "funded", detail: "Payment collected via Alipay Gateway Sandbox", created_at: new Date(now - 36 * 3600000 + 45000).toISOString() },
        { status: "aml_cleared", detail: "ScamShield & AML sanctions screening cleared (Score: 92/100 Safe)", created_at: new Date(now - 36 * 3600000 + 90000).toISOString() },
        { status: "dispatched", detail: "Dispatched to bKash Direct Settlement Node", created_at: new Date(now - 36 * 3600000 + 180000).toISOString() },
        { status: "paid_out", detail: "Credited to recipient bKash wallet (01812345678)", created_at: new Date(now - 36 * 3600000 + 360000).toISOString() }
      ]
    },
    {
      id: "t0000000-0000-0000-0000-000000000002",
      psp_reference: "WECHAT-PAY-729184",
      beneficiary_id: "b0000000-0000-0000-0000-000000000002",
      recipient_name: "Fatema Begum",
      payout_method: "bank",
      account_number: "110293847501",
      corridor: "CN-BD",
      send_currency: "CNY",
      send_amount: 800,
      receive_currency: "BDT",
      receive_amount: 13402.16,
      fx_rate: 16.7527,
      fee_amount: 0,
      purpose: "Living Expenses",
      payment_method: "WeChat Pay",
      status: "dispatched",
      created_at: new Date(now - 4 * 3600000).toISOString(),
      events: [
        { status: "draft", detail: "Transfer order created & rate locked (1 CNY = 16.7527 BDT)", created_at: new Date(now - 4 * 3600000).toISOString() },
        { status: "funded", detail: "Payment collected via WeChat Pay Sandbox", created_at: new Date(now - 4 * 3600000 + 30000).toISOString() },
        { status: "aml_cleared", detail: "ScamShield & AML sanctions screening cleared", created_at: new Date(now - 4 * 3600000 + 75000).toISOString() },
        { status: "dispatched", detail: "Dispatched to City Bank BEFTN Clearing Queue", created_at: new Date(now - 4 * 3600000 + 150000).toISOString() }
      ]
    },
    {
      id: "t0000000-0000-0000-0000-000000000003",
      psp_reference: "WISE-GLOBAL-518290",
      beneficiary_id: "b0000000-0000-0000-0000-000000000004",
      recipient_name: "University of Toronto (Registrar)",
      payout_method: "bank",
      account_number: "CA89-0010-29384756",
      corridor: "US-BD",
      send_currency: "USD",
      send_amount: 1200,
      receive_currency: "BDT",
      receive_amount: 143400.00,
      fx_rate: 119.50,
      fee_amount: 0,
      purpose: "Education / University Tuition",
      payment_method: "ACH / FedNow",
      status: "paid_out",
      created_at: new Date(now - 72 * 3600000).toISOString(),
      events: [
        { status: "draft", detail: "Transfer order created (1 USD = 119.50 BDT)", created_at: new Date(now - 72 * 3600000).toISOString() },
        { status: "funded", detail: "Payment collected via ACH Instant Debit", created_at: new Date(now - 72 * 3600000 + 60000).toISOString() },
        { status: "aml_cleared", detail: "Institutional beneficiary verified & cleared", created_at: new Date(now - 72 * 3600000 + 120000).toISOString() },
        { status: "paid_out", detail: "Settled to beneficiary bank account", created_at: new Date(now - 72 * 3600000 + 600000).toISOString() }
      ]
    }
  ];
}

function seedKycData(){
  return {
    kyc_level: "basic",
    kyc_status: "approved",
    daily_limit: 50000,
    spent_today: 13402.16,
    remaining_today: 36597.84,
    basic_limit: 50000,
    full_limit: 500000,
    submission: null
  };
}


function seedNotifications(){
  var now = Date.now();
  return [
    {
      id: "notif-01",
      category: "UPCOMING_PAYMENT",
      title: "Upcoming Tuition Installment Due in 14 Days",
      message: "University of Toronto Fall Term Balance ($6,000 CAD) is due on Nov 30, 2026. Your tuition sinking fund in Vault has accumulated $1,500 CAD.",
      time: "2 hours ago",
      timestamp: now - 2 * 3600000,
      unread: true,
      actionLabel: "View Tuition Plan",
      actionRoute: "#/tuition-planner",
      dueDays: 14,
      amount: "6,000 CAD"
    },
    {
      id: "notif-02",
      category: "REMITTANCE_REMINDER",
      title: "Monthly Family Remittance Reminder",
      message: "Monthly family allowance to Rahim Ahmed (৳41,195 BDT) is scheduled for the 1st of next month. 60s FX lock active.",
      time: "5 hours ago",
      timestamp: now - 5 * 3600000,
      unread: true,
      actionLabel: "Send Money Now",
      actionRoute: "#/send?amount=350&currency=USD&beneficiary_id=b0000000-0000-0000-0000-000000000001",
      dueDays: 5,
      amount: "৳41,195 BDT"
    },
    {
      id: "notif-03",
      category: "TRANSFER_STATUS",
      title: "Transfer Dispatched · Ref: TX-DEMO-94810",
      message: "Transfer of $500.00 USD to Rahim Ahmed dispatched to bKash Settlement Node with 0% platform fee.",
      time: "1 day ago",
      timestamp: now - 26 * 3600000,
      unread: false,
      actionLabel: "View Receipt",
      actionRoute: "#/payment-vault"
    },
    {
      id: "notif-04",
      category: "RATE_ALERT",
      title: "FX Rate Alert Triggered: USD/BDT ≥ 120.00",
      message: "Live mid-market reference rate reached 1 USD = 120.15 BDT. Optimal window for cross-border student transfers.",
      time: "2 days ago",
      timestamp: now - 48 * 3600000,
      unread: false,
      actionLabel: "Open Optimizer",
      actionRoute: "#/corridor-optimizer"
    }
  ];
}

function seedUpcomingPaymentReminders(){
  return [
    {
      id: "rem-101",
      title: "University of Toronto Tuition Installment",
      type: "TUITION",
      amount: "6,000 CAD",
      dueDate: "2026-11-30",
      leadDays: 3,
      channel: "In-App + Email",
      frequency: "Semester Milestone",
      status: "ACTIVE",
      corridor: "CAD → BDT"
    },
    {
      id: "rem-102",
      title: "Monthly Family Support → Rahim Ahmed",
      type: "FAMILY_REMITTANCE",
      amount: "350 USD (৳41,195 BDT)",
      dueDate: "2026-11-01",
      leadDays: 3,
      channel: "In-App + SMS/WhatsApp",
      frequency: "Monthly Recurring",
      status: "ACTIVE",
      corridor: "USD → BDT"
    }
  ];
}

function seedNotificationPreferences(){
  return {
    transferDispatched: true,
    transferDelivered: true,
    upcomingPaymentReminders: true,
    upcomingLeadDays: "3",
    recipientSmsWhatsapp: true,
    fxRateAlerts: true,
    scamshieldAlerts: true,
    emailReceipts: true,
    weeklyDigest: false
  };
}

function seedWallet(){
  return {
    activeTab: "balances",
    selectedDepositRail: "crypto",
    selectedAsset: "USDT",
    selectedNetwork: "TRC20",
    swapFrom: "USDT",
    swapTo: "BDT",
    swapAmount: "500",
    balances: {
      USD:  { total: 12450.00,   locked: 2000.00 },
      BDT:  { total: 158200.00,  locked: 50000.00 },
      CNY:  { total: 32000.00,   locked: 10000.00 },
      USDT: { total: 4210.50,    locked: 1500.00 },
      BTC:  { total: 0.28540000, locked: 0.10000000 },
      ETH:  { total: 1.842000,   locked: 0.000000 }
    },
    cryptoAddresses: {
      "USDT-TRC20":  "TJ9YV8xQz6sV4eP1gW8G6vH4jJ9kLmNoPq",
      "USDT-ERC20":  "0x71C836eB3a3D8fD2A7bF34b8cFe1F65a8B23a1B9",
      "USDT-BEP20":  "0x71C836eB3a3D8fD2A7bF34b8cFe1F65a8B23a1B9",
      "BTC-BITCOIN": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "ETH-ERC20":   "0x71C836eB3a3D8fD2A7bF34b8cFe1F65a8B23a1B9"
    },
    allocations: [
      { id: "VAULT-101", currency: "USD",  amount: 2000.00,    apy: 5.50, days: 30,  unlocksAt: "2026-11-12", status: "ACTIVE" },
      { id: "VAULT-102", currency: "BDT",  amount: 50000.00,   apy: 6.80, days: 90,  unlocksAt: "2027-01-10", status: "ACTIVE" },
      { id: "VAULT-103", currency: "CNY",  amount: 10000.00,   apy: 5.50, days: 30,  unlocksAt: "2026-11-10", status: "ACTIVE" },
      { id: "VAULT-104", currency: "USDT", amount: 1500.00,    apy: 8.20, days: 90,  unlocksAt: "2027-01-05", status: "ACTIVE" },
      { id: "VAULT-105", currency: "BTC",  amount: 0.10000000, apy: 4.50, days: 180, unlocksAt: "2027-04-10", status: "ACTIVE" }
    ],
    transactions: [
      { id: "TX-9981-L1", type: "DEPOSIT", channel: "CRYPTO",        asset: "USDT", amount: 1500.00,    network: "TRC20",          date: "2026-10-12 14:12", status: "COMPLETED", ref: "0x8fba4...d391" },
      { id: "TX-9975-B2", type: "DEPOSIT", channel: "MOBILE_WALLET", asset: "BDT",  amount: 25000.00,   network: "bKash Merchant", date: "2026-10-11 10:45", status: "COMPLETED", ref: "BK-99120412" },
      { id: "TX-9964-C3", type: "DEPOSIT", channel: "BANK_TRANSFER", asset: "CNY",  amount: 8000.00,    network: "China UnionPay", date: "2026-10-10 19:30", status: "COMPLETED", ref: "CNAPS-440192" },
      { id: "TX-9952-U4", type: "DEPOSIT", channel: "BANK_TRANSFER", asset: "USD",  amount: 5000.00,    network: "JPMorgan Wire",  date: "2026-10-09 16:05", status: "COMPLETED", ref: "FED-8829104" },
      { id: "TX-9940-K5", type: "DEPOSIT", channel: "CRYPTO",        asset: "BTC",  amount: 0.18540000, network: "BITCOIN",        date: "2026-10-08 09:20", status: "COMPLETED", ref: "bc1q...0wlh" }
    ]
  };
}

function seedProfile(){
  return {
    full_name: "Ishan Ahmed",
    email: "fahad@probaho.demo",
    phone: "+8801712345678",
    country: "Global / International",
    preferred_lang: "en",
    default_currency: "USD",
    kyc_level: "basic",
    kyc_status: "approved"
  };
}

var persisted = (global.AppStorage && global.AppStorage.read()) || {};

var state = {
  /* notifications & upcoming payment reminders (persisted) */
  notifications: Array.isArray(persisted.notifications) && persisted.notifications.length ? persisted.notifications : seedNotifications(),
  upcomingPaymentReminders: Array.isArray(persisted.upcomingPaymentReminders) && persisted.upcomingPaymentReminders.length ? persisted.upcomingPaymentReminders : seedUpcomingPaymentReminders(),
  notificationPreferences: persisted.notificationPreferences || seedNotificationPreferences(),
  /* optimizer (session) */
  corridorId: "us-dhaka",
  amount: 1000,
  selectedProviderId: null,
  /* drafts created this session (also persisted) */
  drafts: Array.isArray(persisted.drafts) ? persisted.drafts : [],
  draftSeq: persisted.draftSeq || 0,
  /* client-side transfers ledger (persisted) */
  transfers: Array.isArray(persisted.transfers) && persisted.transfers.length ? persisted.transfers : seedTransfers(),
  /* client-side beneficiaries (persisted) */
  beneficiaries: Array.isArray(persisted.beneficiaries) && persisted.beneficiaries.length ? persisted.beneficiaries : null,
  /* client-side KYC status & quotas (persisted) */
  kycData: persisted.kycData || seedKycData(),
  /* client-side user profile (persisted) */
  userProfile: persisted.userProfile || seedProfile(),
  /* client-side rate alerts (persisted) */
  rateAlerts: Array.isArray(persisted.rateAlerts) ? persisted.rateAlerts : [
    { id: "alrt-1", pair: "USD / BDT", target: 120.50, direction: "above", active: true, created: "Oct 12, 2026" },
    { id: "alrt-2", pair: "GBP / BDT", target: 152.50, direction: "above", active: true, created: "Oct 11, 2026" }
  ],
  /* multi-currency & crypto wallet (persisted) */
  wallet: (persisted.wallet && persisted.wallet.balances) ? persisted.wallet : seedWallet(),
  /* tuition planner (persisted) */
  tuition: persisted.tuition || seedTuition(),
  /* connected student financial journey plan (persisted) */
  studentFinancialPlan: persisted.studentFinancialPlan || null,
  /* scamshield last assessment (session only — pasted content never persisted) */
  lastAssessment: null,
  /* scamshield session scans: metadata only, never message text (session only) */
  scamScans: [],
  /* support tickets (persisted; demo tickets live in this browser only) */
  tickets: Array.isArray(persisted.tickets) ? persisted.tickets : [],
  /* staff sign-in brute-force protection (persisted so refresh can't reset it) */
  staffLock: persisted.staffLock || { count:0, firstTs:0, lockedUntil:0 },
  accountLocks: persisted.accountLocks || {},
  chatSeeded: false,
  /* fx advisor ui */
  fxCorridorId: "us-dhaka",
  /* vault ui */
  vaultQuery: "", vaultCorridor: "all", vaultStatus: "all", vaultSort: "date-desc",
  /* admin console overrides (persisted) + local audit log */
  admin: persisted.admin || { content:{}, corridors:{}, providers:{},
    riskWeights:{}, riskDisabled:{}, tuitionSeeds:null, settings:{},
    payoutRoutes:{}, kyc:{} },
  audit: Array.isArray(persisted.audit) ? persisted.audit : []
};

var PERSIST_KEYS = {
  wallet:1, tuition:1, studentFinancialPlan:1, drafts:1, draftSeq:1, transfers:1, beneficiaries:1,
  kycData:1, userProfile:1, rateAlerts:1, notifications:1, upcomingPaymentReminders:1, notificationPreferences:1, admin:1, audit:1,
  tickets:1, staffLock:1, accountLocks:1
};

var listeners = {};
var anyListeners = [];
var AppState = {
  get: function(k){ return state[k]; },
  set: function(k, v){
    var prev = state[k];
    state[k] = v;
    (listeners[k] || []).forEach(function(fn){ try { fn(v, prev); } catch (e) {} });
    anyListeners.forEach(function(fn){ try { fn(k, v, prev); } catch (e) {} });
    if (PERSIST_KEYS[k]) AppState.persist();
    try {
      if (global.dispatchEvent && typeof global.CustomEvent === "function"){
        global.dispatchEvent(new global.CustomEvent("probaho:state-change", {
          detail: { key: k, value: v, prev: prev, ts: new Date().toISOString() }
        }));
      }
    } catch (e) {}
  },
  on: function(k, fn){ (listeners[k] = listeners[k] || []).push(fn); },
  onAny: function(fn){ if (typeof fn === "function") anyListeners.push(fn); },
  persist: function(){
    if (!global.AppStorage) return;
    global.AppStorage.write({
      wallet: state.wallet, tuition: state.tuition, studentFinancialPlan: state.studentFinancialPlan, drafts: state.drafts, draftSeq: state.draftSeq,
      transfers: state.transfers, beneficiaries: state.beneficiaries,
      kycData: state.kycData, userProfile: state.userProfile, rateAlerts: state.rateAlerts, notifications: state.notifications, upcomingPaymentReminders: state.upcomingPaymentReminders, notificationPreferences: state.notificationPreferences,
      admin: state.admin, audit: state.audit, tickets: state.tickets,
      staffLock: state.staffLock, accountLocks: state.accountLocks
    });
  },
  resetDemo: function(){
    state.wallet = seedWallet();
    state.tuition = seedTuition();
    state.studentFinancialPlan = null;
    state.drafts = [];
    state.draftSeq = 0;
    state.transfers = seedTransfers();
    state.beneficiaries = null;
    state.kycData = seedKycData();
    state.userProfile = seedProfile();
    state.lastAssessment = null;
    state.selectedProviderId = null;
    state.staffLock = { count:0, firstTs:0, lockedUntil:0 };
    state.accountLocks = {};
    state.notifications = seedNotifications();
    state.upcomingPaymentReminders = seedUpcomingPaymentReminders();
    state.notificationPreferences = seedNotificationPreferences();
    if (global.AppStorage) global.AppStorage.clear();
    AppState.persist();
  },
  /* Effective (admin-overridden) data. Public modules must use these. */
  corridors: function(){ return global.AdminConfig ? global.AdminConfig.effectiveCorridors() : (global.SeedCorridors || []); },
  enabledCorridors: function(){ return global.AdminConfig ? global.AdminConfig.enabledCorridors() : (global.SeedCorridors || []); },
  providers: function(){ return global.AdminConfig ? global.AdminConfig.effectiveProviders() : (global.SeedProviders || []); },
  enabledProviders: function(){ return global.AdminConfig ? global.AdminConfig.enabledProviders() : (global.SeedProviders || []); },
  corridor: function(id){
    var want = id || state.corridorId;
    var list = AppState.corridors();
    for (var i = 0; i < list.length; i++){
      if (list[i].id === want || list[i].code === want) return list[i];
    }
    var en = AppState.enabledCorridors();
    return en[0] || list[0];
  },
  provider: function(id){
    var list = AppState.providers();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  },
  content: function(){ return global.AdminConfig ? global.AdminConfig.getContent() : {}; }
};

global.AppState = AppState;
})(typeof window !== "undefined" ? window : global);

/* ============================================================
   payment-vault.js — Global Financial Vault, Multi-Currency & Web3 Crypto Wallet
   Supports:
   - Multi-Currency & Crypto Sub-Wallets: USD ($), BDT (৳), CNY (¥), USDT (₮), BTC (₿), ETH (Ξ)
   - Multi-Rail Deposits:
     1. Crypto Web3 Wallet (USDT TRC20/ERC20/BEP20, BTC Native Bitcoin, ETH ERC20) with deterministic SVG QR Code
     2. Mobile Wallets (bKash, Nagad, Rocket for Bangladesh BDT; Alipay, WeChat Pay for China CNY)
     3. Direct Bank Transfers (USD JPMorgan Fedwire/ACH, BDT City Bank NPSB/BEFTN, CNY ICBC UnionPay CNAPS)
   - Instant Cross-Asset & Crypto-to-Fiat Swap Engine (powered by FinancialEngine.convert)
   - High-Yield Vault Locking & Staking (5.5% - 8.2% APY)
   - Unified Audit Ledger, Remittance Receipts (#vaultTable), 5-Stage Timeline Tracker & Dispute Filing
   ============================================================ */
(function(global){
"use strict";
var U = global.U;

var ASSET_META = {
  USD:  { name: "US Dollar",            symbol: "$",   badge: "Fedwire / ACH",       color: "#097A76", bg: "#E6F8F7", rateLabel: "1 USD = $1.00 USD (৳119.50 BDT)" },
  BDT:  { name: "Bangladeshi Taka",     symbol: "৳",   badge: "bKash / NPSB",        color: "#047857", bg: "#ecfdf5", rateLabel: "1 USD = 119.50 BDT" },
  CNY:  { name: "Chinese Yuan (RMB)",   symbol: "¥",   badge: "Alipay / CNAPS",      color: "#c2410c", bg: "#fff7ed", rateLabel: "1 USD = 7.24 CNY · 1 CNY = 16.7527 BDT" },
  EUR:  { name: "Euro (SEPA)",          symbol: "€",   badge: "SEPA Instant",        color: "#0369a1", bg: "#f0f9ff", rateLabel: "1 EUR = $1.09 USD (৳130.40 BDT)" },
  GBP:  { name: "British Pound",        symbol: "£",   badge: "UK Faster Payments",  color: "#6d28d9", bg: "#f5f3ff", rateLabel: "1 GBP = $1.27 USD (৳153.20 BDT)" },
  CAD:  { name: "Canadian Dollar",      symbol: "C$",  badge: "Interac e-Transfer",  color: "#b91c1c", bg: "#fef2f2", rateLabel: "1 USD = 1.38 CAD (৳86.80 BDT)" },
  AUD:  { name: "Australian Dollar",    symbol: "A$",  badge: "PayID / Osko",        color: "#0f766e", bg: "#f0fdfa", rateLabel: "1 USD = 1.53 AUD (৳78.20 BDT)" },
  SGD:  { name: "Singapore Dollar",     symbol: "S$",  badge: "PayNow / FAST",       color: "#be123c", bg: "#fff1f2", rateLabel: "1 USD = 1.35 SGD (৳88.50 BDT)" },
  AED:  { name: "UAE Dirham",           symbol: "د.إ", badge: "UAEFTS / Aani",       color: "#047857", bg: "#ecfdf5", rateLabel: "1 USD = 3.67 AED (৳32.71 BDT)" },
  JPY:  { name: "Japanese Yen",         symbol: "¥",   badge: "Zengin / PayPay",     color: "#9a3412", bg: "#fff7ed", rateLabel: "1 USD = 151.20 JPY" },
  INR:  { name: "Indian Rupee",         symbol: "₹",   badge: "UPI / IMPS Instant",  color: "#c2410c", bg: "#fff7ed", rateLabel: "1 USD = 84.10 INR" },
  USDT: { name: "Tether USD (Web3)",    symbol: "₮",   badge: "TRC20 / ERC20",       color: "#0f766e", bg: "#f0fdfa", rateLabel: "1 USDT = $1.00 USD (Pegged 1:1)" },
  USDC: { name: "USD Coin (Web3)",      symbol: "◈",   badge: "ERC20 / Solana / Base",color:"#0D9F9A", bg: "#E6F8F7", rateLabel: "1 USDC = $1.00 USD (Regulated 1:1)" },
  BTC:  { name: "Bitcoin",              symbol: "₿",   badge: "Bitcoin Mainnet",     color: "#b45309", bg: "#fffbeb", rateLabel: "1 BTC = $68,500.00 USD" },
  ETH:  { name: "Ethereum",             symbol: "Ξ",   badge: "ERC20 Mainnet",       color: "#4338ca", bg: "#eef2ff", rateLabel: "1 ETH = $3,550.00 USD" },
  SOL:  { name: "Solana",               symbol: "◎",   badge: "Solana Mainnet",      color: "#7c3aed", bg: "#f5f3ff", rateLabel: "1 SOL = $185.00 USD" }
};

function getWalletState(){
  var w = global.AppState ? global.AppState.get("wallet") : null;
  if (!w || !w.balances){
    w = {
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
    if (global.AppState) global.AppState.set("wallet", w);
  }
  if (!w.swapFrom) w.swapFrom = "USDT";
  if (!w.swapTo) w.swapTo = "BDT";
  if (!w.swapAmount) w.swapAmount = "500";
  if (!w.allocations) w.allocations = [];
  return w;
}

function saveWalletState(w){
  PaymentVaultModule.state = w;
  if (global.AppState){
    global.AppState.set("wallet", w);
  }
}

function getAllRemittanceRecords(){
  var out = [];
  var drafts = (global.AppState && global.AppState.get("drafts")) || [];
  drafts.forEach(function(d){
    out.push({
      id: d.id || d.ref,
      ref: d.ref,
      date: (d.createdISO || new Date().toISOString()).slice(0, 10),
      corridorId: d.corridorId || "dhaka-london",
      corridorLabel: d.corridorLabel || d.corridorId || "Global Corridor",
      providerName: d.providerName || "Wise",
      send: (d.principalMinor || 100000) / 100,
      sendCcy: d.sendCcy || "BDT",
      flatFee: (d.flatMinor || 0) / 100,
      pctFee: (d.pctMinor || 0) / 100,
      totalFee: (d.totalFeeMinor || 0) / 100,
      rate: d.customerRate || 1,
      receive: (d.receiveMinor || 100000) / 100,
      receiveCcy: d.receiveCcy || "GBP",
      recipientName: d.recipientName || "Beneficiary",
      payoutMethod: d.payoutMethod || "Bank / Wallet",
      status: d.status || "Simulated Draft",
      isDraft: true
    });
  });

  var transfers = (global.AppState && global.AppState.get("transfers")) || [];
  transfers.forEach(function(t){
    if (out.some(function(x){ return x.ref === (t.psp_reference || t.id); })) return;
    out.push({
      id: t.id,
      ref: t.psp_reference || t.id,
      date: (t.created_at || new Date().toISOString()).slice(0, 10),
      corridorId: t.corridor || "cn-dhaka",
      corridorLabel: t.corridor || "Global Corridor",
      providerName: t.gateway || "Probaho Direct",
      send: Number(t.send_amount || 0),
      sendCcy: t.send_currency || "CNY",
      flatFee: Number(t.fee || 0),
      pctFee: 0,
      totalFee: Number(t.fee || 0),
      rate: Number(t.exchange_rate || 16.7527),
      receive: Number(t.receive_amount || 0),
      receiveCcy: t.receive_currency || "BDT",
      recipientName: t.recipient_name || "Rahim Ahmed",
      payoutMethod: t.payout_method || "bkash",
      status: t.status === "paid_out" ? "Completed" : "Dispatched",
      isDraft: false
    });
  });

  (global.SeedLedger || []).forEach(function(e){
    if (out.some(function(x){ return x.ref === e.ref; })) return;
    out.push({
      id: e.ref,
      ref: e.ref,
      date: e.date,
      corridorId: e.corridorId,
      corridorLabel: e.corridorId,
      providerName: e.providerName || e.providerId || "MeridianPay",
      send: Number(e.send || 0),
      sendCcy: e.sendCcy || "BDT",
      flatFee: Number(e.flatFee || 2.50),
      pctFee: Number(e.pctFee || 1.50),
      totalFee: Number(e.fee || 4.00),
      rate: Number(e.rate || 0.0064),
      receive: Number(e.receive || 0),
      receiveCcy: e.receiveCcy || "GBP",
      recipientName: e.recipient || "Beneficiary",
      payoutMethod: e.method || "Bank Deposit",
      status: e.status || "Completed",
      isDraft: false
    });
  });
  return out;
}

var PaymentVaultModule = {
  state: getWalletState(),

  render: function(container){
    var el = container || U.$("#view");
    if (!el) return;
    this.state = getWalletState();
    el.innerHTML = this.template();
    this.bindEvents(el);
  },

  template: function(){
    var FE = global.FinancialEngine;
    var w = this.state;
    var totalNetWorthUSD = 0;
    var totalLockedUSD = 0;
    Object.keys(w.balances).forEach(function(curr){
      var b = w.balances[curr];
      totalNetWorthUSD += FE.toUSD(b.total, curr);
      totalLockedUSD += FE.toUSD(b.locked, curr);
    });

    return '<div class="vault-container page" style="max-width:1320px;margin:0 auto;padding:12px 0 40px;">' +
      /* Header Balance Banner */
      '<div style="background:linear-gradient(135deg,#071B33 0%,#0B1F38 60%,#0D4A56 100%);color:#fff;border-radius:20px;padding:32px;margin-bottom:24px;box-shadow:0 16px 40px rgba(11,21,40,0.22);border:1px solid rgba(255,255,255,0.1);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;">' +
          '<div>' +
            '<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.3);border-radius:999px;padding:4px 12px;margin-bottom:10px;">' +
              '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>' +
              '<span style="text-transform:uppercase;letter-spacing:1.2px;font-size:11px;color:#7dd3fc;font-weight:800;">Global Financial Vault &amp; Multi-Rail Web3 Wallet</span>' +
            '</div>' +
            '<h1 style="font-size:clamp(28px, 4vw, 40px);margin:4px 0 8px;font-weight:850;letter-spacing:-0.02em;color:#fff;">' +
              '$ ' + totalNetWorthUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
              ' <span style="font-size:15px;color:#93c5fd;font-weight:700;">EST. USD NET WORTH</span>' +
            '</h1>' +
            '<p style="margin:0;color:#cbd5e1;font-size:14px;">' +
              'Instant multi-currency liquidity (<b>USD $, BDT ৳, CNY ¥</b>) • Web3 Crypto (<b>USDT ₮, BTC ₿, ETH Ξ</b>) • Vault Yield Locked: <b style="color:#fcd34d;">$' + totalLockedUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD</b>' +
            '</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" id="btn-open-deposit" style="background:linear-gradient(135deg,#12B8B0,#0D9F9A);color:#fff;border:none;padding:12px 22px;border-radius:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 8px 20px rgba(37,99,235,0.4);">' +
              '<span>📥 Receive / Deposit</span>' +
            '</button>' +
            '<button type="button" id="btn-open-swap" style="background:rgba(6,182,212,0.2);color:#67e8f9;border:1px solid rgba(6,182,212,0.4);padding:12px 18px;border-radius:10px;font-weight:700;cursor:pointer;">' +
              '⇄ Instant Swap' +
            '</button>' +
            '<button type="button" id="btn-open-vault-lock" style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.25);padding:12px 18px;border-radius:10px;font-weight:700;cursor:pointer;">' +
              '🔒 Vault Yield Lock (5.5% APY)' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Navigation Tabs */
      '<div style="display:flex;gap:6px;border-bottom:2px solid #e2e8f0;margin-bottom:24px;flex-wrap:wrap;">' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "balances" ? "active-tab" : "") + '" data-tab="balances" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">💼 Asset Balances (6)</button>' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "deposit" ? "active-tab" : "") + '" data-tab="deposit" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">⚡ Receive &amp; Deposit Hub</button>' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "swap" ? "active-tab" : "") + '" data-tab="swap" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">⇄ Crypto &amp; Fiat Swap</button>' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "vault-yield" ? "active-tab" : "") + '" data-tab="vault-yield" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">🔒 Vault Yield Lock (5.5% APY)</button>' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "request" ? "active-tab" : "") + '" data-tab="request" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">📲 Request Money &amp; QR Links</button>' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "cards" ? "active-tab" : "") + '" data-tab="cards" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">💳 Virtual Cards &amp; Tax Cert</button>' +
        '<button type="button" class="nav-tab ' + (w.activeTab === "history" ? "active-tab" : "") + '" data-tab="history" style="padding:12px 18px;font-weight:700;border:none;background:none;cursor:pointer;font-size:14.5px;color:#475569;">📜 Audit Ledger &amp; Receipts</button>' +
      '</div>' +

      /* Active Tab Section */
      (w.activeTab === "balances" ? this.renderBalancesView() : "") +
      (w.activeTab === "deposit" ? this.renderDepositHub() : "") +
      (w.activeTab === "swap" ? this.renderSwapView() : "") +
      (w.activeTab === "vault-yield" ? this.renderVaultYieldView() : "") +
      (w.activeTab === "request" ? this.renderRequestMoneyView() : "") +
      (w.activeTab === "cards" ? this.renderCardsAndCertView() : "") +

      /* Unified Audit Ledger & Remittance Receipts (Always present in DOM for instant inspection & QA compatibility) */
      this.renderHistoryAndRemittanceLedger() +

      '<style>' +
        '.active-tab { color: #0D9F9A !important; border-bottom: 3px solid #0D9F9A !important; margin-bottom: -2px; }' +
        '.asset-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 6px rgba(15,23,42,0.04); }' +
        '.asset-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(15,23,42,0.08); }' +
        '.rail-pill { padding: 11px 18px; border-radius: 10px; cursor: pointer; border: 1.5px solid #cbd5e1; font-weight: 700; font-size: 13.5px; background: #f8fafc; color: #1e293b; transition: all 0.15s; }' +
        '.rail-pill.active { background: #0D9F9A; color: #fff; border-color: #0D9F9A; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }' +
      '</style>' +
    '</div>';
  },

  renderBalancesView: function(){
    var FE = global.FinancialEngine;
    var w = this.state;
    var cards = Object.keys(w.balances).map(function(curr){
      var data = w.balances[curr];
      var meta = ASSET_META[curr] || { name: curr, symbol: curr, badge: "Live Rail", color: "#097A76", bg: "#E6F8F7", rateLabel: "1 USD = " + FE.rates[curr] + " " + curr };
      var available = Math.max(0, data.total - data.locked);
      var usdValue = FE.toUSD(data.total, curr);

      return '<div class="asset-card" data-asset-card="' + U.esc(curr) + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:' + meta.bg + ';display:flex;align-items:center;justify-content:center;font-weight:850;font-size:18px;color:' + meta.color + ';">' +
              U.esc(meta.symbol) +
            '</div>' +
            '<div>' +
              '<h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">' + U.esc(curr) + ' · <span style="font-weight:600;color:#475569;font-size:13.5px;">' + U.esc(meta.name) + '</span></h3>' +
              '<span style="font-size:12px;color:#64748b;">' + U.esc(meta.rateLabel) + '</span>' +
            '</div>' +
          '</div>' +
          '<span style="font-size:11.5px;font-weight:700;color:#059669;background:#ecfdf5;padding:4px 9px;border-radius:6px;border:1px solid #a7f3d0;">' + U.esc(meta.badge) + '</span>' +
        '</div>' +

        '<div style="margin:16px 0;">' +
          '<div style="font-size:24px;font-weight:850;color:#0f172a;letter-spacing:-0.02em;">' +
            FE.format(data.total, curr) +
          '</div>' +
          '<div style="font-size:13px;color:#64748b;margin-top:3px;font-weight:600;">≈ $ ' + usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD</div>' +
        '</div>' +

        '<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:12px;font-size:13px;display:flex;justify-content:space-between;margin-bottom:14px;">' +
          '<div>' +
            '<span style="color:#64748b;font-size:11.5px;display:block;">Available to Spend / Send</span>' +
            '<div style="font-weight:800;color:#0f172a;margin-top:2px;">' + FE.format(available, curr) + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span style="color:#64748b;font-size:11.5px;display:block;">In Vault Lock (5.5%+ APY)</span>' +
            '<div style="font-weight:800;color:#d97706;margin-top:2px;">' + FE.format(data.locked, curr) + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="btn btn-sm btn-primary" data-card-receive="' + U.esc(curr) + '" style="flex:1;border-radius:8px;justify-content:center;font-weight:700;">📥 Receive</button>' +
          '<button type="button" class="btn btn-sm btn-secondary" data-card-swap="' + U.esc(curr) + '" style="flex:1;border-radius:8px;justify-content:center;font-weight:700;">⇄ Swap</button>' +
          '<button type="button" class="btn btn-sm btn-secondary" data-card-lock="' + U.esc(curr) + '" style="flex:1;border-radius:8px;justify-content:center;font-weight:700;">🔒 Lock</button>' +
        '</div>' +
      '</div>';
    }).join("");

    var extraAssets = Object.keys(ASSET_META).filter(function(k){ return !w.balances[k]; });
  var addBar = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px;margin-bottom:18px;">' +
    '<div><b style="font-size:13.5px;color:#0f172a;">🌍 Global Multi-Currency &amp; Web3 Sub-Wallets (' + Object.keys(w.balances).length + ' Active)</b>' +
    '<div style="font-size:12px;color:#64748b;">Activate additional regional fiat or Web3 crypto sub-wallets with local clearing rails in 1 click.</div></div>' +
    (extraAssets.length ? (
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
        '<select id="addGlobalWalletSelect" class="input" style="width:100%;max-width:100%;flex:1 1 180px;min-height:38px;padding:6px 10px;font-size:12.5px;">' +
          extraAssets.map(function(k){ return '<option value="' + k + '">' + ASSET_META[k].symbol + ' ' + k + ' — ' + ASSET_META[k].name + ' (' + ASSET_META[k].badge + ')</option>'; }).join("") +
        '</select>' +
        '<button type="button" class="btn btn-primary btn-sm" id="btnAddGlobalWallet">+ Activate Sub-Wallet</button>' +
      '</div>'
    ) : '<span class="badge badge-ok">All 16 Global Sub-Wallets Active</span>') +
  '</div>';
  var savedCardsStrip =
    '<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:18px;margin-bottom:20px;">' +
      '<div class="card" style="padding:18px 20px;margin:0;border:1px solid #E3EAF2;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
          '<div><b style="font-size:14.5px;color:#172B4D;">Saved Payment Cards</b><div style="font-size:12px;color:#64748B;">Tokenized PCI-DSS payment methods</div></div>' +
          '<button type="button" class="btn btn-sm btn-secondary" onclick="var t=document.querySelector(\'[data-tab=cards]\');if(t)t.click();" style="border-radius:8px;font-size:12px;">Manage Cards &rsaquo;</button>' +
        '</div>' +
        '<div style="display:grid;gap:10px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:#F5F8FC;border:1px solid #E3EAF2;border-radius:12px;">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="background:#1E3A8A;color:#FFF;font-weight:900;font-size:11px;padding:6px 8px;border-radius:6px;letter-spacing:0.05em;">VISA</span>' +
              '<div><b style="font-size:13.5px;color:#172B4D;display:block;">Visa &bull;&bull;&bull;&bull; 4242</b><span style="font-size:11.5px;color:#64748B;">Expires 10/28 &middot; Multi-Currency Debit</span></div>' +
            '</div>' +
            '<span class="badge badge-info" style="background:#E6F8F7;color:#097A76;">Default</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:#F5F8FC;border:1px solid #E3EAF2;border-radius:12px;">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="background:#EA580C;color:#FFF;font-weight:900;font-size:11px;padding:6px 8px;border-radius:6px;letter-spacing:0.05em;">MC</span>' +
              '<div><b style="font-size:13.5px;color:#172B4D;display:block;">Mastercard &bull;&bull;&bull;&bull; 1337</b><span style="font-size:11.5px;color:#64748B;">Expires 11/27 &middot; Tuition &amp; Travel</span></div>' +
            '</div>' +
            '<span class="badge badge-ok">Verified</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:18px 20px;margin:0;border:1px solid #E3EAF2;display:flex;flex-direction:column;justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<b style="font-size:14.5px;color:#172B4D;">Linked Settlement Accounts</b>' +
            '<span class="badge badge-ok">Instant Rails</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#F5F8FC;border:1px solid #E3EAF2;border-radius:12px;margin-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span style="width:34px;height:34px;border-radius:10px;background:#E6F8F7;color:#0D9F9A;display:grid;place-items:center;font-weight:900;">৳</span>' +
              '<div><b style="font-size:13.5px;color:#172B4D;display:block;">bKash / UPay Student Wallet</b><span style="font-size:11.5px;color:#64748B;">Linked &middot; ৳ 1,58,200.00 BDT</span></div>' +
            '</div>' +
            '<span class="badge badge-ok">Active</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="var t=document.querySelector(\'[data-tab=deposit]\');if(t)t.click();" style="width:100%;justify-content:center;border-radius:10px;border-style:dashed;color:#0D9F9A;border-color:#12B8B0;font-weight:750;">+ Add Payment Method or Deposit &rsaquo;</button>' +
      '</div>' +
    '</div>';
  return savedCardsStrip + addBar + '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr));gap:20px;margin-bottom:28px;">' + cards + '</div>';
  },

  renderDepositHub: function(){
    var w = this.state;
    return '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px;box-shadow:0 4px 16px rgba(0,0,0,0.04);margin-bottom:28px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px;">' +
        '<div>' +
          '<h2 style="margin:0 0 6px;font-size:22px;font-weight:850;color:#0f172a;">Multi-Rail Inbound Deposit Gateway</h2>' +
          '<p style="color:#64748b;font-size:14px;margin:0;">Receive <b>US Dollars ($ USD)</b>, <b>Bangladeshi Taka (৳ BDT)</b>, <b>Chinese Yuan (¥ CNY)</b>, or <b>Web3 Crypto (USDT, BTC, ETH)</b> from any bank, mobile wallet, or blockchain network.</p>' +
        '</div>' +
        '<span class="badge badge-ok" style="font-size:12px;padding:6px 12px;">⚡ Instant Multi-Rail Settlement</span>' +
      '</div>' +

      /* Channel Selectors */
      '<div style="display:flex;gap:12px;margin-bottom:26px;flex-wrap:wrap;">' +
        '<button type="button" class="rail-pill ' + (w.selectedDepositRail === "crypto" ? "active" : "") + '" data-rail="crypto">' +
          '🪙 Crypto Web3 Wallet (USDT / BTC / ETH)' +
        '</button>' +
        '<button type="button" class="rail-pill ' + (w.selectedDepositRail === "mobile_wallet" ? "active" : "") + '" data-rail="mobile_wallet">' +
          '📱 Mobile Wallets (bKash / Nagad / Alipay / WeChat)' +
        '</button>' +
        '<button type="button" class="rail-pill ' + (w.selectedDepositRail === "bank" ? "active" : "") + '" data-rail="bank">' +
          '🏦 Direct Bank Transfer (Fedwire / BEFTN / UnionPay)' +
        '</button>' +
      '</div>' +

      this.renderSelectedRailContent() +
    '</div>';
  },

  renderSelectedRailContent: function(){
    var w = this.state;
    var FE = global.FinancialEngine;

    if (w.selectedDepositRail === "crypto"){
      var key = w.selectedAsset + "-" + w.selectedNetwork;
      var address = w.cryptoAddresses[key] || "0x71C836eB3a3D8fD2A7bF34b8cFe1F65a8B23a1B9";
      var qrDataUri = U.qrSvg ? U.qrSvg(address, 180) : "";
      var defSimAmt = w.selectedAsset === "BTC" ? "0.05" : w.selectedAsset === "ETH" ? "0.5" : "1000";

      return '<div class="vault-qr-split" style="display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:start;">' +
        '<div style="text-align:center;border:1px solid #e2e8f0;border-radius:16px;padding:20px;background:#f8fafc;">' +
          '<img src="' + qrDataUri + '" alt="Deposit QR Code" style="width:180px;height:180px;border-radius:10px;margin-bottom:12px;border:1px solid #cbd5e1;background:#fff;padding:6px;" />' +
          '<div style="font-size:12px;color:#0f172a;font-weight:800;margin-bottom:4px;">' + U.esc(w.selectedAsset) + ' · ' + U.esc(w.selectedNetwork) + '</div>' +
          '<div style="font-size:11.5px;color:#64748b;font-weight:600;">Scan with Binance, Trust Wallet, MetaMask, Coinbase, or OKX</div>' +
        '</div>' +

        '<div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-bottom:16px;">' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:800;color:#475569;margin-bottom:6px;">SELECT CRYPTO ASSET</label>' +
              '<select id="crypto-asset-select" class="input" style="font-weight:700;">' +
                '<option value="USDT"' + (w.selectedAsset === "USDT" ? " selected" : "") + '>₮ USDT (Tether USD Stablecoin)</option>' +
                '<option value="BTC"' + (w.selectedAsset === "BTC" ? " selected" : "") + '>₿ BTC (Bitcoin)</option>' +
                '<option value="ETH"' + (w.selectedAsset === "ETH" ? " selected" : "") + '>Ξ ETH (Ethereum)</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block;font-size:12px;font-weight:800;color:#475569;margin-bottom:6px;">BLOCKCHAIN NETWORK</label>' +
              '<select id="crypto-network-select" class="input" style="font-weight:700;">' +
                (w.selectedAsset === "USDT" ?
                  '<option value="TRC20"' + (w.selectedNetwork === "TRC20" ? " selected" : "") + '>Tron (TRC20) — Instant &amp; $0 Fee</option>' +
                  '<option value="ERC20"' + (w.selectedNetwork === "ERC20" ? " selected" : "") + '>Ethereum (ERC20)</option>' +
                  '<option value="BEP20"' + (w.selectedNetwork === "BEP20" ? " selected" : "") + '>BNB Smart Chain (BEP20)</option>'
                : w.selectedAsset === "BTC" ?
                  '<option value="BITCOIN" selected>Native Bitcoin Mainnet (SegWit bc1q)</option>'
                :
                  '<option value="ERC20" selected>Ethereum Mainnet (ERC20)</option>'
                ) +
              '</select>' +
            '</div>' +
          '</div>' +

          '<label style="display:block;font-size:12px;font-weight:800;color:#475569;margin-bottom:6px;">YOUR DEDICATED RECEIVING ADDRESS (' + U.esc(w.selectedNetwork) + ')</label>' +
          '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
            '<input id="crypto-addr-input" type="text" readonly value="' + U.esc(address) + '" style="flex:1 1 180px;min-width:0;max-width:100%;padding:12px 14px;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:10px;font-family:monospace;font-size:14px;font-weight:700;color:#0f172a;" />' +
            '<button type="button" id="btn-copy-crypto-address" style="background:#0f172a;color:#fff;border:none;padding:0 20px;border-radius:10px;font-weight:700;cursor:pointer;">Copy</button>' +
          '</div>' +

          '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:13px;color:#92400e;margin-bottom:18px;">' +
            '⚠️ Send only <strong>' + U.esc(w.selectedAsset) + '</strong> via <strong>' + U.esc(w.selectedNetwork) + '</strong>. Deposits credit automatically after 1 network confirmation and can be held, locked for APY, or swapped to <b>BDT ৳ / CNY ¥ / USD $</b>.' +
          '</div>' +

          /* Instant On-Chain Deposit Simulator */
          '<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
            '<div>' +
              '<b style="color:#166534;font-size:13.5px;display:block;">⚡ Simulate Incoming On-Chain Deposit (' + U.esc(w.selectedAsset) + ')</b>' +
              '<span style="font-size:12px;color:#15803d;">Test instant blockchain webhook confirmation &amp; balance credit:</span>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<input type="number" id="crypto-sim-amount" class="input" value="' + defSimAmt + '" step="any" style="flex:1 1 110px;min-width:0;max-width:100%;background:#fff;font-weight:700;">' +
              '<button type="button" id="btn-simulate-crypto-deposit" class="btn btn-primary" style="background:#059669;border-color:#059669;border-radius:10px;font-weight:700;">+ Credit ' + U.esc(w.selectedAsset) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    if (w.selectedDepositRail === "mobile_wallet"){
      var refSuffix = Date.now().toString().slice(-6);
      return '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr));gap:22px;">' +
        /* Bangladesh Mobile Banking (bKash / Nagad / Rocket) */
        '<div style="border:1.5px solid #fbcfe8;background:#fffdfd;border-radius:14px;padding:22px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<h3 style="margin:0;color:#be185d;font-size:17px;font-weight:800;">🇧🇩 Bangladesh Rails (BDT ৳)</h3>' +
            '<span style="font-size:11.5px;background:#fce7f3;color:#9d174d;padding:4px 9px;border-radius:6px;font-weight:800;">bKash / Nagad / Rocket</span>' +
          '</div>' +
          '<p style="font-size:13px;color:#64748b;margin:0 0 12px;">Instant Bangladeshi Taka deposit into your <b>BDT ৳</b> sub-wallet via tokenized merchant checkout.</p>' +
          '<div style="background:#ffffff;border:1px solid #f1f5f9;padding:12px;border-radius:10px;margin-bottom:14px;font-size:13px;">' +
            '<div><strong>Merchant Wallet:</strong> <code style="color:#be185d;font-size:14px;font-weight:700;">01700-000000</code></div>' +
            '<div style="margin-top:4px;"><strong>Counter:</strong> 1 | <strong>Reference:</strong> <span class="mono">USER-' + refSuffix + '</span></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
            '<input type="number" id="deposit-amt-BDT" class="input" value="25000" min="100" step="500" placeholder="Amount in BDT ৳" style="font-weight:700;">' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button type="button" class="btn-deposit-action" data-method="BKASH" data-ccy="BDT" style="flex:1;padding:11px;background:#e11d48;color:#fff;border:none;border-radius:9px;font-weight:700;cursor:pointer;">Deposit with bKash Online</button>' +
            '<button type="button" class="btn-deposit-action" data-method="NAGAD" data-ccy="BDT" style="padding:11px 14px;background:#ea580c;color:#fff;border:none;border-radius:9px;font-weight:700;cursor:pointer;">Nagad</button>' +
          '</div>' +
        '</div>' +

        /* China Mobile Rails (Alipay / WeChat Pay) */
        '<div style="border:1.5px solid #fed7aa;background:#fffcf9;border-radius:14px;padding:22px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<h3 style="margin:0;color:#c2410c;font-size:17px;font-weight:800;">🇨🇳 China Domestic Rails (CNY ¥)</h3>' +
            '<span style="font-size:11.5px;background:#ffedd5;color:#9a3412;padding:4px 9px;border-radius:6px;font-weight:800;">Alipay / WeChat Pay</span>' +
          '</div>' +
          '<p style="font-size:13px;color:#64748b;margin:0 0 12px;">Instant Chinese Yuan settlement into your <b>CNY ¥</b> sub-ledger via cross-border merchant collection.</p>' +
          '<div style="background:#ffffff;border:1px solid #f1f5f9;padding:12px;border-radius:10px;margin-bottom:14px;font-size:13px;">' +
            '<div><strong>Corporate Account:</strong> <code style="color:#c2410c;font-weight:700;">pay@titanvault.com</code></div>' +
            '<div style="margin-top:4px;"><strong>Network:</strong> Alipay Cross-Border QR / WeChat Pay Enterprise</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
            '<input type="number" id="deposit-amt-CNY" class="input" value="5000" min="50" step="100" placeholder="Amount in CNY ¥" style="font-weight:700;">' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button type="button" class="btn-deposit-action" data-method="ALIPAY" data-ccy="CNY" style="flex:1;padding:11px;background:#0284c7;color:#fff;border:none;border-radius:9px;font-weight:700;cursor:pointer;">Generate Alipay Payment QR</button>' +
            '<button type="button" class="btn-deposit-action" data-method="WECHAT" data-ccy="CNY" style="padding:11px 14px;background:#16a34a;color:#fff;border:none;border-radius:9px;font-weight:700;cursor:pointer;">WeChat Pay</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    /* Direct Bank Wire (USD Fedwire/ACH, BDT BEFTN/NPSB, CNY UnionPay CNAPS) */
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 260px), 1fr));gap:18px;">' +
      '<div style="border:1px solid #cbd5e1;border-radius:14px;padding:20px;background:#f8fafc;display:flex;flex-direction:column;justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<h4 style="margin:0;color:#0f172a;font-size:16px;font-weight:800;">🇺🇸 USD Bank Wire &amp; ACH</h4>' +
            '<span class="badge badge-ok">Fedwire / ACH</span>' +
          '</div>' +
          '<div style="font-size:13px;line-height:1.7;color:#334155;background:#fff;padding:12px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:14px;">' +
            '<strong>Bank:</strong> JPMorgan Chase Bank, N.A.<br>' +
            '<strong>Routing / ABA:</strong> <span class="mono">021000021</span><br>' +
            '<strong>SWIFT / BIC:</strong> <span class="mono">CHASUS33</span><br>' +
            '<strong>Account No:</strong> <span class="mono">882910482910</span><br>' +
            '<strong>Beneficiary:</strong> TITAN GLOBAL VAULT LTD' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-bank-sim="USD" data-bank-amt="2500" data-bank-net="JPMorgan Fedwire" style="width:100%;justify-content:center;border-radius:9px;">+ Simulate $2,500 USD Bank Wire</button>' +
      '</div>' +

      '<div style="border:1px solid #cbd5e1;border-radius:14px;padding:20px;background:#f8fafc;display:flex;flex-direction:column;justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<h4 style="margin:0;color:#0f172a;font-size:16px;font-weight:800;">🇧🇩 BDT Bank Clearing</h4>' +
            '<span class="badge badge-ok">NPSB / BEFTN</span>' +
          '</div>' +
          '<div style="font-size:13px;line-height:1.7;color:#334155;background:#fff;padding:12px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:14px;">' +
            '<strong>Bank:</strong> City Bank PLC, Gulshan Dhaka<br>' +
            '<strong>Routing Number:</strong> <span class="mono">225272635</span><br>' +
            '<strong>SWIFT Code:</strong> <span class="mono">CIBLBDDH</span><br>' +
            '<strong>Account No:</strong> <span class="mono">1102948291001</span><br>' +
            '<strong>Type:</strong> Instant NPSB / RTGS / BEFTN' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-bank-sim="BDT" data-bank-amt="50000" data-bank-net="City Bank NPSB" style="width:100%;justify-content:center;border-radius:9px;">+ Simulate ৳50,000 BDT Bank Credit</button>' +
      '</div>' +

      '<div style="border:1px solid #cbd5e1;border-radius:14px;padding:20px;background:#f8fafc;display:flex;flex-direction:column;justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<h4 style="margin:0;color:#0f172a;font-size:16px;font-weight:800;">🇨🇳 CNY UnionPay CNAPS</h4>' +
            '<span class="badge badge-ok">CNAPS / CIPS</span>' +
          '</div>' +
          '<div style="font-size:13px;line-height:1.7;color:#334155;background:#fff;padding:12px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:14px;">' +
            '<strong>Bank:</strong> ICBC (Industrial &amp; Commercial Bank)<br>' +
            '<strong>CNAPS Code:</strong> <span class="mono">102100000494</span><br>' +
            '<strong>SWIFT Code:</strong> <span class="mono">ICBKCNBJ</span><br>' +
            '<strong>Account No:</strong> <span class="mono">622202100192849102</span><br>' +
            '<strong>Beneficiary:</strong> Titan Tech Shanghai Ltd' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-bank-sim="CNY" data-bank-amt="10000" data-bank-net="ICBC UnionPay CNAPS" style="width:100%;justify-content:center;border-radius:9px;">+ Simulate ¥10,000 CNY Bank Credit</button>' +
      '</div>' +
    '</div>';
  },

  renderSwapView: function(){
    var w = this.state;
    var FE = global.FinancialEngine;
    var assets = Object.keys(w.balances);
    var fromC = w.swapFrom || "USDT";
    var toC = w.swapTo || "BDT";
    var amt = parseFloat(w.swapAmount) || 100;
    var availFrom = Math.max(0, (w.balances[fromC] ? w.balances[fromC].total - w.balances[fromC].locked : 0));
    var outAmt = FE.convert(amt, fromC, toC, 0.002);
    var unitRate = FE.convert(1, fromC, toC, 0);

    var fromOpts = assets.map(function(a){
      return '<option value="' + a + '"' + (a === fromC ? " selected" : "") + '>' + a + ' — Available: ' + FE.format(Math.max(0, w.balances[a].total - w.balances[a].locked), a) + '</option>';
    }).join("");
    var toOpts = assets.map(function(a){
      return '<option value="' + a + '"' + (a === toC ? " selected" : "") + '>' + a + ' (' + (ASSET_META[a] ? ASSET_META[a].name : a) + ')</option>';
    }).join("");

    return '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px;box-shadow:0 4px 16px rgba(0,0,0,0.04);margin-bottom:28px;max-width:780px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;">' +
        '<div>' +
          '<h2 style="margin:0 0 4px;font-size:22px;font-weight:850;color:#0f172a;">Instant Multi-Currency &amp; Web3 Crypto Swap</h2>' +
          '<p style="margin:0;font-size:13.5px;color:#64748b;">Convert seamlessly between <b>USD, BDT, CNY</b> and <b>USDT, BTC, ETH</b> with precision-safe math and 0.20% institutional spread.</p>' +
        '</div>' +
        '<span class="badge badge-ok">0.20% Spread · Instant Settlement</span>' +
      '</div>' +

      '<div class="vault-swap-grid" style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:end;margin-bottom:18px;">' +
        '<div class="field" style="margin:0;">' +
          '<label>FROM WALLET ASSET</label>' +
          '<select id="swap-from-select" class="input" style="font-weight:700;">' + fromOpts + '</select>' +
        '</div>' +
        '<button type="button" id="btn-flip-swap" class="btn btn-secondary" title="Flip currencies" style="border-radius:10px;padding:10px 14px;font-weight:800;">⇄</button>' +
        '<div class="field" style="margin:0;">' +
          '<label>TO TARGET ASSET</label>' +
          '<select id="swap-to-select" class="input" style="font-weight:700;">' + toOpts + '</select>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">' +
        '<div class="field" style="margin:0;">' +
          '<label>AMOUNT TO CONVERT (' + U.esc(fromC) + ')</label>' +
          '<input type="number" id="swap-amount-input" class="input" value="' + U.esc(String(w.swapAmount)) + '" min="0.0001" step="any" style="font-size:18px;font-weight:800;">' +
          '<span class="hint">Max available: ' + FE.format(availFrom, fromC) + '</span>' +
        '</div>' +
        '<div class="field" style="margin:0;">' +
          '<label>ESTIMATED CREDIT (' + U.esc(toC) + ')</label>' +
          '<input type="text" id="swap-receive-preview" class="input" readonly value="' + FE.format(outAmt, toC) + '" style="font-size:18px;font-weight:800;background:#f0fdf4;color:#15803d;border-color:#86efac;">' +
          '<span class="hint">Mid-Rate: 1 ' + U.esc(fromC) + ' = ' + unitRate + ' ' + U.esc(toC) + '</span>' +
        '</div>' +
      '</div>' +

      '<button type="button" id="btn-execute-swap" class="btn btn-primary" style="width:100%;justify-content:center;padding:14px;font-size:15px;font-weight:800;border-radius:12px;">' +
        '⇄ Execute Instant Swap (' + U.esc(fromC) + ' → ' + U.esc(toC) + ')' +
      '</button>' +
    '</div>';
  },

  renderVaultYieldView: function(){
    var w = this.state;
    var FE = global.FinancialEngine;
    var assets = Object.keys(w.balances);

    var assetOpts = assets.map(function(a){
      var av = Math.max(0, w.balances[a].total - w.balances[a].locked);
      return '<option value="' + a + '">' + a + ' (Available: ' + FE.format(av, a) + ')</option>';
    }).join("");

    var allocRows = (w.allocations || []).map(function(al){
      return '<tr>' +
        '<td class="mono"><b>' + U.esc(al.id) + '</b></td>' +
        '<td><b>' + U.esc(al.currency) + '</b></td>' +
        '<td style="font-weight:800;color:#0f172a;">' + FE.format(al.amount, al.currency) + '</td>' +
        '<td><span class="badge badge-ok">' + Number(al.apy).toFixed(2) + '% APY</span></td>' +
        '<td>' + al.days + ' Days (Unlocks ' + U.esc(al.unlocksAt) + ')</td>' +
        '<td><span class="badge ' + (al.status === "ACTIVE" ? "badge-ok" : "badge-neutral") + '">' + U.esc(al.status) + '</span></td>' +
        '<td style="text-align:right;">' +
          (al.status === "ACTIVE"
            ? '<button type="button" class="btn btn-ghost btn-sm" data-unlock-id="' + U.esc(al.id) + '" style="color:#d97706;font-weight:700;">🔓 Unlock Now</button>'
            : '<span class="tiny muted">Released</span>') +
        '</td>' +
      '</tr>';
    }).join("");

    return '<div class="vault-two-col" style="display:grid;grid-template-columns:1fr 1.4fr;gap:22px;margin-bottom:28px;align-items:start;">' +
      '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;min-width:0;max-width:100%;box-shadow:0 4px 16px rgba(0,0,0,0.04);">' +
        '<h3 style="margin:0 0 6px;font-size:19px;font-weight:850;color:#0f172a;">🔒 Lock Assets in High-Yield Vault</h3>' +
        '<p style="color:#64748b;font-size:13px;margin:0 0 18px;">Allocate idle fiat or crypto balances to earn institutional staking &amp; treasury yield.</p>' +
        '<div class="field">' +
          '<label>SELECT ASSET TO LOCK</label>' +
          '<select id="vault-lock-asset" class="input" style="font-weight:700;">' + assetOpts + '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label>LOCK DURATION &amp; APY TIER</label>' +
          '<select id="vault-lock-duration" class="input" style="font-weight:700;">' +
            '<option value="30|5.50">30 Days Fixed — 5.50% APY</option>' +
            '<option value="90|6.80">90 Days Fixed — 6.80% APY</option>' +
            '<option value="180|8.20">180 Days Fixed — 8.20% APY</option>' +
          '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label>AMOUNT TO LOCK</label>' +
          '<input type="number" id="vault-lock-amount" class="input" value="500" min="0.001" step="any" style="font-size:16px;font-weight:800;">' +
        '</div>' +
        '<button type="button" id="btn-submit-vault-lock" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;border-radius:10px;font-weight:800;">' +
          '🔒 Confirm Vault Yield Lock' +
        '</button>' +
      '</div>' +

      '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;min-width:0;max-width:100%;box-shadow:0 4px 16px rgba(0,0,0,0.04);">' +
        '<h3 style="margin:0 0 14px;font-size:18px;font-weight:850;color:#0f172a;">Active Vault Yield Allocations</h3>' +
        '<div style="overflow-x:auto;">' +
          '<table class="clean-table">' +
            '<thead><tr><th>ID</th><th>Asset</th><th>Locked</th><th>Yield</th><th>Term</th><th>Status</th><th style="text-align:right;">Action</th></tr></thead>' +
            '<tbody>' + allocRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  renderRequestMoneyView: function(){
    var w = this.state;
    var FE = global.FinancialEngine;
    if (!w.paymentRequests){
      w.paymentRequests = [
        { id: "REQ-8821", payer: "Sponsor / Family Account", currency: "USDT", amount: 1200.00, note: "Fall Semester Living & Lab Fee", created: "2026-10-12", status: "PENDING" },
        { id: "REQ-8790", payer: "Roommate Shared Housing",  currency: "CNY",  amount: 3500.00, note: "Beijing Dormitory Split",        created: "2026-10-10", status: "PAID" },
        { id: "REQ-8744", payer: "Freelance Client (US)",    currency: "USD",  amount: 850.00,  note: "AI Engineering Consulting",     created: "2026-10-08", status: "PAID" }
      ];
    }
    var activeReq = w.paymentRequests[0] || { id: "REQ-8821", currency: "USDT", amount: 1200, note: "Tuition Support" };
    var shareUrl = "https://probaho.remit/pay/" + activeReq.id + "?ccy=" + activeReq.currency + "&amt=" + activeReq.amount;
    var qrSvgUri = U.qrSvg ? U.qrSvg(shareUrl, 165) : "";

    var rows = w.paymentRequests.map(function(pr){
      var isPaid = pr.status === "PAID";
      return '<tr>' +
        '<td class="mono"><b>' + U.esc(pr.id) + '</b></td>' +
        '<td><b>' + U.esc(pr.payer) + '</b><div class="tiny muted">' + U.esc(pr.note) + '</div></td>' +
        '<td class="mono" style="font-weight:800;color:#0f172a;">' + FE.format(pr.amount, pr.currency) + '</td>' +
        '<td>' + U.esc(pr.created) + '</td>' +
        '<td><span class="badge ' + (isPaid ? 'badge-ok' : 'badge-warn') + '">' + U.esc(pr.status) + '</span></td>' +
        '<td style="text-align:right;">' +
          (!isPaid
            ? '<button type="button" class="btn btn-sm btn-primary" data-settle-req="' + U.esc(pr.id) + '" style="border-radius:8px;background:#059669;border-color:#059669;">⚡ Simulate Payer Credit</button>'
            : '<span class="tiny muted">Credited ✓</span>') +
        '</td>' +
      '</tr>';
    }).join("");

    return '<div class="vault-two-col" style="display:grid;grid-template-columns:1fr 1.35fr;gap:22px;margin-bottom:28px;align-items:start;">' +
      '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;min-width:0;max-width:100%;">' +
        '<h3 style="margin:0 0 6px;font-size:19px;font-weight:850;color:#0f172a;">📲 Create P2P Payment Link &amp; QR Invoice</h3>' +
        '<p style="margin:0 0 16px;font-size:13px;color:#64748b;">Request USD, BDT, CNY, USDT, BTC, or ETH from family, sponsors, or clients via a shareable payment link.</p>' +
        '<div class="field"><label>Payer Name / Organization</label><input class="input" id="reqPayerInput" placeholder="e.g. Family Sponsor / Client" value="Family Education Sponsor"></div>' +
        '<div class="grid g2">' +
          '<div class="field"><label>Currency / Crypto</label>' +
            '<select class="input" id="reqCcySelect" style="font-weight:700;">' +
              ["USD", "BDT", "CNY", "USDT", "BTC", "ETH"].map(function(c){ return '<option value="' + c + '">' + c + '</option>'; }).join("") +
            '</select>' +
          '</div>' +
          '<div class="field"><label>Requested Amount</label><input type="number" class="input mono" id="reqAmtInput" value="1000" step="any" style="font-weight:800;"></div>' +
        '</div>' +
        '<div class="field"><label>Invoice Note / Reference</label><input class="input" id="reqNoteInput" value="Semester Tuition & Living Support"></div>' +
        '<button type="button" class="btn btn-primary" id="btnCreatePaymentReq" style="width:100%;justify-content:center;padding:12px;border-radius:10px;font-weight:800;">✨ Generate Shareable Payment Link &amp; QR</button>' +

        '<div style="margin-top:18px;padding-top:16px;border-top:1px dashed #cbd5e1;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
          '<img src="' + qrSvgUri + '" alt="Payment Request QR" style="width:110px;height:110px;border-radius:10px;border:1px solid #cbd5e1;padding:4px;background:#fff;">' +
          '<div style="flex:1;min-width:0;">' +
            '<span style="font-size:11px;font-weight:800;color:#0D9F9A;text-transform:uppercase;">Latest Active Link (' + U.esc(activeReq.id) + ')</span>' +
            '<input type="text" readonly class="input mono" id="reqShareUrlInput" value="' + U.esc(shareUrl) + '" style="font-size:11.5px;margin:6px 0;padding:6px 10px;">' +
            '<button type="button" class="btn btn-sm btn-secondary" id="btnCopyReqLink" style="border-radius:8px;">📋 Copy Payment Link</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;min-width:0;max-width:100%;">' +
        '<h3 style="margin:0 0 14px;font-size:18px;font-weight:850;color:#0f172a;">Active Inbound Payment Requests (' + w.paymentRequests.length + ')</h3>' +
        '<div style="overflow-x:auto;">' +
          '<table class="clean-table">' +
            '<thead><tr><th>ID</th><th>Payer &amp; Note</th><th>Amount</th><th>Created</th><th>Status</th><th style="text-align:right;">Action</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  renderCardsAndCertView: function(){
    var w = this.state;
    var FE = global.FinancialEngine;
    if (!w.virtualCards){
      w.virtualCards = [
        { id: "VC-4829", label: "Probaho Global Student Visa", network: "VISA", last4: "4829", fullPan: "4532 8910 3741 4829", exp: "08/29", cvv: "842", currency: "USD", balance: 1850.00, limit: 5000.00, status: "ACTIVE", revealed: false, color: "linear-gradient(135deg,#0f172a 0%,#097A76 100%)" },
        { id: "VC-9104", label: "Probaho Cross-Border Mastercard", network: "MASTERCARD", last4: "9104", fullPan: "5412 7500 8821 9104", exp: "11/28", cvv: "319", currency: "USDT", balance: 920.00, limit: 3000.00, status: "ACTIVE", revealed: false, color: "linear-gradient(135deg,#064e3b 0%,#0d9488 100%)" }
      ];
    }

    var cardsHtml = w.virtualCards.map(function(vc){
      var isFrozen = vc.status === "FROZEN";
      var panDisplay = vc.revealed ? vc.fullPan : ("•••• •••• •••• " + vc.last4);
      var cvvDisplay = vc.revealed ? vc.cvv : "•••";
      return '<div style="border-radius:18px;padding:24px;color:#fff;background:' + (isFrozen ? 'linear-gradient(135deg,#334155,#475569)' : vc.color) + ';box-shadow:0 12px 28px rgba(15,23,42,0.18);position:relative;overflow:hidden;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">' +
          '<div>' +
            '<span style="font-size:10.5px;text-transform:uppercase;letter-spacing:1.2px;color:#93c5fd;font-weight:800;">' + U.esc(vc.network) + ' VIRTUAL COMMERCIAL</span>' +
            '<h4 style="margin:4px 0 0;font-size:16px;font-weight:800;color:#fff;">' + U.esc(vc.label) + '</h4>' +
          '</div>' +
          '<span style="font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;background:' + (isFrozen ? 'rgba(239,68,68,0.25);color:#fca5a5;' : 'rgba(16,185,129,0.25);color:#6ee7b7;') + '">' + U.esc(vc.status) + '</span>' +
        '</div>' +

        '<div class="mono" style="font-size:21px;font-weight:800;letter-spacing:2px;margin:18px 0;color:#f8fafc;">' + U.esc(panDisplay) + '</div>' +

        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:#cbd5e1;margin-bottom:18px;">' +
          '<div><span style="font-size:10px;display:block;opacity:0.75;">VALID THRU</span><b>' + U.esc(vc.exp) + '</b></div>' +
          '<div><span style="font-size:10px;display:block;opacity:0.75;">CVV</span><b class="mono">' + U.esc(cvvDisplay) + '</b></div>' +
          '<div style="text-align:right;"><span style="font-size:10px;display:block;opacity:0.75;">CARD BALANCE</span><b style="font-size:15px;color:#fff;">' + FE.format(vc.balance, vc.currency) + '</b></div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:14px;border-top:1px solid rgba(255,255,255,0.14);">' +
          '<button type="button" class="btn btn-sm" data-vc-reveal="' + U.esc(vc.id) + '" style="background:rgba(255,255,255,0.14);color:#fff;border:none;border-radius:8px;font-size:12px;">' + (vc.revealed ? '🙈 Hide Details' : '👁️ Reveal PAN & CVV') + '</button>' +
          '<button type="button" class="btn btn-sm" data-vc-freeze="' + U.esc(vc.id) + '" style="background:rgba(255,255,255,0.14);color:#fff;border:none;border-radius:8px;font-size:12px;">' + (isFrozen ? '🔥 Unfreeze' : '❄️ Freeze Card') + '</button>' +
          '<button type="button" class="btn btn-sm" data-vc-topup="' + U.esc(vc.id) + '" style="background:#fff;color:#0f172a;border:none;border-radius:8px;font-size:12px;font-weight:800;margin-left:auto;">+ Top Up $100</button>' +
        '</div>' +
      '</div>';
    }).join("");

    var bdtBalance = (w.balances.BDT && w.balances.BDT.total) || 158200;
    var bonusBDT = Math.round(bdtBalance * 0.025 * 100) / 100;

    return '<div style="display:grid;gap:24px;margin-bottom:28px;">' +
      '<div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;min-width:0;max-width:100%;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">' +
          '<div>' +
            '<h2 style="margin:0 0 4px;font-size:21px;font-weight:850;color:#0f172a;">💳 Multi-Currency &amp; Web3 Virtual Cards</h2>' +
            '<p style="margin:0;font-size:13.5px;color:#64748b;">Instant virtual Visa &amp; Mastercard cards funded by your USD, USDT, CNY, or BDT Vault for university fees, IELTS/GRE, flights, and online subscriptions.</p>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btn-issue-virtual-card" style="border-radius:10px;padding:10px 18px;font-weight:800;">+ Issue New Virtual Card</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr));gap:20px;">' + cardsHtml + '</div>' +
      '</div>' +

      /* Bangladesh 2.5% Govt Cash Incentive & NBR Tax Certificate Card */
      '<div style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border:1.5px solid #86efac;border-radius:18px;padding:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;">' +
        '<div style="max-width:700px;">' +
          '<span class="badge badge-ok" style="margin-bottom:8px;">🇧🇩 BANGLADESH BANK &amp; NBR COMPLIANT</span>' +
          '<h3 style="margin:0 0 6px;font-size:19px;font-weight:850;color:#065f46;">2.5% Government Cash Incentive &amp; Annual Remittance Tax Certificate</h3>' +
          '<p style="margin:0;font-size:13.5px;color:#047857;line-height:1.5;">' +
            'Based on your verified inward BDT volume (<b>৳' + bdtBalance.toLocaleString() + ' BDT</b>), your accrued 2.5% statutory remittance incentive is <b>+৳' + bonusBDT.toLocaleString() + ' BDT</b>. Download your official certificate for tax-free remittance declaration.' +
          '</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-primary" id="btn-claim-incentive" style="background:#059669;border-color:#059669;border-radius:10px;font-weight:800;">+ Credit 2.5% Bonus (৳' + bonusBDT.toLocaleString() + ')</button>' +
          '<button type="button" class="btn btn-secondary" id="btn-open-tax-cert" style="border-radius:10px;font-weight:700;background:#fff;">📄 View &amp; Print Tax Certificate</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  renderHistoryAndRemittanceLedger: function(){
    var w = this.state;
    var FE = global.FinancialEngine;
    var remRecords = getAllRemittanceRecords();

    return '<div style="display:grid;gap:24px;">' +
      /* 1. Multi-Rail Wallet Deposit, Swap & Vault Ledger */
      '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">' +
        '<div style="padding:18px 22px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div>' +
            '<h3 style="margin:0;font-weight:800;font-size:17px;color:#0f172a;">Multi-Rail Wallet &amp; Crypto Ledger</h3>' +
            '<span style="font-size:12.5px;color:#64748b;">Real-time log of all inbound crypto, mobile wallet (bKash/Alipay), bank wire deposits, swaps, and vault locks.</span>' +
          '</div>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btn-export-wallet-csv">⬇ Export Wallet CSV</button>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;text-align:left;font-size:13.5px;">' +
            '<thead>' +
              '<tr style="background:#f8fafc;color:#64748b;border-bottom:1px solid #e2e8f0;">' +
                '<th style="padding:12px 20px;">Reference ID</th>' +
                '<th style="padding:12px 20px;">Type</th>' +
                '<th style="padding:12px 20px;">Channel / Rail</th>' +
                '<th style="padding:12px 20px;">Amount Credited / Moved</th>' +
                '<th style="padding:12px 20px;">Timestamp</th>' +
                '<th style="padding:12px 20px;">Status</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              w.transactions.map(function(tx){
                return '<tr style="border-bottom:1px solid #f1f5f9;">' +
                  '<td style="padding:13px 20px;font-family:monospace;font-weight:700;color:#0D9F9A;">' + U.esc(tx.id) + '</td>' +
                  '<td style="padding:13px 20px;"><span class="badge badge-neutral">' + U.esc(tx.type) + '</span></td>' +
                  '<td style="padding:13px 20px;font-weight:600;">' + U.esc(tx.channel) + ' (' + U.esc(tx.network) + ')</td>' +
                  '<td style="padding:13px 20px;font-weight:800;color:#0f172a;">' + FE.format(tx.amount, tx.asset) + '</td>' +
                  '<td style="padding:13px 20px;color:#64748b;">' + U.esc(tx.date) + '</td>' +
                  '<td style="padding:13px 20px;"><span style="color:#059669;font-weight:700;background:#ecfdf5;padding:4px 8px;border-radius:6px;">' + U.esc(tx.status) + '</span></td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* 2. Cross-Border Remittance Receipts & Drafts (#vaultTable required by QA harness) */
      '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">' +
        '<div style="padding:18px 22px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div>' +
            '<h3 style="margin:0;font-weight:800;font-size:17px;color:#0f172a;">Cross-Border Remittance Receipts &amp; Simulated Drafts</h3>' +
            '<span style="font-size:12.5px;color:#64748b;">Click any transfer row or Receipt button to open its printable remittance advice, fee breakdown, or 5-stage settlement tracker.</span>' +
          '</div>' +
          '<input type="text" id="vaultRemitSearch" class="input" placeholder="Search by reference, corridor, or recipient..." style="max-width:280px;">' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table class="clean-table data" id="vaultTable">' +
            '<thead>' +
              '<tr>' +
                '<th>Reference</th>' +
                '<th>Date</th>' +
                '<th>Corridor / Provider</th>' +
                '<th>Sent</th>' +
                '<th>Received</th>' +
                '<th>Status</th>' +
                '<th style="text-align:right;">Actions</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              remRecords.map(function(r){
                return '<tr data-vault-row="' + U.esc(r.ref) + '" style="cursor:pointer;">' +
                  '<td class="mono"><b style="color:#0D9F9A;">' + U.esc(r.ref) + '</b></td>' +
                  '<td class="mono">' + U.esc(r.date) + '</td>' +
                  '<td><b>' + U.esc(r.providerName) + '</b><div class="tiny muted">' + U.esc(r.corridorLabel) + '</div></td>' +
                  '<td class="mono"><b>' + U.esc(r.sendCcy) + ' ' + U.money(r.send, "", 2) + '</b></td>' +
                  '<td class="mono"><b style="color:#059669;">' + U.esc(r.receiveCcy) + ' ' + U.money(r.receive, "", 2) + '</b></td>' +
                  '<td><span class="badge ' + (r.isDraft ? "badge-demo" : "badge-ok") + '">' + U.esc(r.status) + '</span></td>' +
                  '<td style="text-align:right;white-space:nowrap;">' +
                    '<button type="button" class="btn btn-sm btn-secondary" data-vault-receipt="' + U.esc(r.ref) + '">Receipt 📄</button> ' +
                    '<button type="button" class="btn btn-sm btn-ghost" data-vault-track="' + U.esc(r.ref) + '">Track</button> ' +
                    '<button type="button" class="btn btn-sm btn-ghost" data-vault-dispute="' + U.esc(r.ref) + '" style="color:#dc2626;">Dispute</button>' +
                  '</td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  creditDeposit: function(curr, amount, channel, network, container){
    var FE = global.FinancialEngine;
    var amt = Number(amount);
    if (!isFinite(amt) || amt <= 0){
      if (global.Toast) global.Toast.show("Please enter a valid positive deposit amount.", "warn");
      return;
    }
    var w = this.state;
    if (!w.balances[curr]) w.balances[curr] = { total: 0, locked: 0 };
    w.balances[curr].total = Number((w.balances[curr].total + amt).toFixed(FE.decimals[curr] || 2));
    var txRef = FE.generateReference(network.slice(0, 4).toUpperCase());
    w.transactions.unshift({
      id: "TX-" + Math.floor(1000 + Math.random() * 9000) + "-" + curr.slice(0, 2),
      type: "DEPOSIT",
      channel: channel,
      asset: curr,
      amount: amt,
      network: network,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "COMPLETED",
      ref: txRef
    });
    saveWalletState(w);
    if (global.Toast){
      global.Toast.show("Deposited " + FE.format(amt, curr) + " via " + network + "! Balance updated.", "ok");
    }
    this.render(container);
  },

  bindEvents: function(container){
    var self = this;
    var w = this.state;
    var FE = global.FinancialEngine;

    /* Tab switching */
    U.$$(".nav-tab", container).forEach(function(btn){
      btn.addEventListener("click", function(e){
        w.activeTab = e.currentTarget.getAttribute("data-tab");
        saveWalletState(w);
        self.render(container);
      });
    });

    /* Header Banner Buttons */
    var btnDeposit = U.$("#btn-open-deposit", container);
    if (btnDeposit){
      btnDeposit.addEventListener("click", function(){
        w.activeTab = "deposit";
        saveWalletState(w);
        self.render(container);
      });
    }
    var btnSwap = U.$("#btn-open-swap", container);
    if (btnSwap){
      btnSwap.addEventListener("click", function(){
        w.activeTab = "swap";
        saveWalletState(w);
        self.render(container);
      });
    }
    var btnVaultLock = U.$("#btn-open-vault-lock", container);
    if (btnVaultLock){
      btnVaultLock.addEventListener("click", function(){
        self.openVaultLockModal("USD", container);
      });
    }

    /* Asset Card Quick Buttons */
    U.$$("[data-card-receive]", container).forEach(function(b){
      b.addEventListener("click", function(){
        var ccy = b.getAttribute("data-card-receive");
        w.activeTab = "deposit";
        if (ccy === "USDT" || ccy === "BTC" || ccy === "ETH"){
          w.selectedDepositRail = "crypto";
          w.selectedAsset = ccy;
          w.selectedNetwork = ccy === "BTC" ? "BITCOIN" : ccy === "ETH" ? "ERC20" : "TRC20";
        } else {
          w.selectedDepositRail = (ccy === "BDT" || ccy === "CNY") ? "mobile_wallet" : "bank";
        }
        saveWalletState(w);
        self.render(container);
      });
    });

    U.$$("[data-card-swap]", container).forEach(function(b){
      b.addEventListener("click", function(){
        var ccy = b.getAttribute("data-card-swap");
        w.activeTab = "swap";
        w.swapFrom = ccy;
        w.swapTo = ccy === "BDT" ? "USDT" : "BDT";
        saveWalletState(w);
        self.render(container);
      });
    });

    U.$$("[data-card-lock]", container).forEach(function(b){
      b.addEventListener("click", function(){
        var ccy = b.getAttribute("data-card-lock");
        self.openVaultLockModal(ccy, container);
      });
    });

    /* Rail Pill Switching */
    U.$$(".rail-pill", container).forEach(function(pill){
      pill.addEventListener("click", function(e){
        w.selectedDepositRail = e.currentTarget.getAttribute("data-rail");
        saveWalletState(w);
        self.render(container);
      });
    });

    /* Crypto Asset & Network Dropdowns */
    var assetSelect = U.$("#crypto-asset-select", container);
    if (assetSelect){
      assetSelect.addEventListener("change", function(e){
        w.selectedAsset = e.target.value;
        if (w.selectedAsset === "USDT") w.selectedNetwork = "TRC20";
        else if (w.selectedAsset === "BTC") w.selectedNetwork = "BITCOIN";
        else if (w.selectedAsset === "ETH") w.selectedNetwork = "ERC20";
        saveWalletState(w);
        self.render(container);
      });
    }

    var netSelect = U.$("#crypto-network-select", container);
    if (netSelect){
      netSelect.addEventListener("change", function(e){
        w.selectedNetwork = e.target.value;
        saveWalletState(w);
        self.render(container);
      });
    }

    /* Copy Crypto Address Button */
    var copyBtn = U.$("#btn-copy-crypto-address", container);
    if (copyBtn){
      copyBtn.addEventListener("click", function(){
        var input = U.$("#crypto-addr-input", container);
        if (input){
          try {
            if (navigator.clipboard && navigator.clipboard.writeText){
              navigator.clipboard.writeText(input.value);
            } else {
              input.select();
              document.execCommand("copy");
            }
          } catch(err){}
          copyBtn.textContent = "Copied! ✓";
          copyBtn.style.background = "#059669";
          if (global.Toast) global.Toast.show("Copied " + w.selectedAsset + " (" + w.selectedNetwork + ") address to clipboard!", "ok");
          setTimeout(function(){
            copyBtn.textContent = "Copy";
            copyBtn.style.background = "#0f172a";
          }, 2000);
        }
      });
    }

    /* Simulate On-Chain Crypto Deposit */
    var simCryptoBtn = U.$("#btn-simulate-crypto-deposit", container);
    if (simCryptoBtn){
      simCryptoBtn.addEventListener("click", function(){
        var amtInp = U.$("#crypto-sim-amount", container);
        var amt = amtInp ? parseFloat(amtInp.value) : 100;
        self.creditDeposit(w.selectedAsset, amt, "CRYPTO", w.selectedNetwork, container);
      });
    }

    /* Mobile Wallet Deposits (bKash / Nagad / Alipay / WeChat Pay) */
    U.$$(".btn-deposit-action", container).forEach(function(btn){
      btn.addEventListener("click", function(e){
        var method = e.currentTarget.getAttribute("data-method") || "BKASH";
        var curr = e.currentTarget.getAttribute("data-ccy") || (method === "BKASH" || method === "NAGAD" ? "BDT" : "CNY");
        var inp = U.$("#deposit-amt-" + curr, container);
        var amt = inp ? parseFloat(inp.value) : 0;
        if (!amt || amt <= 0){
          amt = curr === "BDT" ? 5000 : 2000;
        }
        if (amt && amt > 0){
          w.activeTab = "balances";
          self.creditDeposit(curr, amt, "MOBILE_WALLET", method, container);
        }
      });
    });

    /* Bank Wire Simulated Deposits */
    U.$$("[data-bank-sim]", container).forEach(function(btn){
      btn.addEventListener("click", function(){
        var curr = btn.getAttribute("data-bank-sim");
        var amt = parseFloat(btn.getAttribute("data-bank-amt")) || 1000;
        var net = btn.getAttribute("data-bank-net") || "Bank Wire";
        w.activeTab = "balances";
        self.creditDeposit(curr, amt, "BANK_TRANSFER", net, container);
      });
    });

    /* Swap Tab Controls */
    var swapFromSel = U.$("#swap-from-select", container);
    var swapToSel = U.$("#swap-to-select", container);
    var swapAmtInp = U.$("#swap-amount-input", container);
    var flipSwapBtn = U.$("#btn-flip-swap", container);
    var execSwapBtn = U.$("#btn-execute-swap", container);

    if (swapFromSel){
      swapFromSel.addEventListener("change", function(){
        w.swapFrom = swapFromSel.value;
        if (w.swapFrom === w.swapTo) w.swapTo = w.swapFrom === "BDT" ? "USDT" : "BDT";
        saveWalletState(w);
        self.render(container);
      });
    }
    if (swapToSel){
      swapToSel.addEventListener("change", function(){
        w.swapTo = swapToSel.value;
        if (w.swapTo === w.swapFrom) w.swapFrom = w.swapTo === "USDT" ? "BDT" : "USDT";
        saveWalletState(w);
        self.render(container);
      });
    }
    if (swapAmtInp){
      swapAmtInp.addEventListener("input", function(){
        w.swapAmount = swapAmtInp.value;
        var outPreview = U.$("#swap-receive-preview", container);
        if (outPreview){
          var conv = FE.convert(parseFloat(w.swapAmount) || 0, w.swapFrom, w.swapTo, 0.002);
          outPreview.value = FE.format(conv, w.swapTo);
        }
      });
    }
    if (flipSwapBtn){
      flipSwapBtn.addEventListener("click", function(){
        var tmp = w.swapFrom;
        w.swapFrom = w.swapTo;
        w.swapTo = tmp;
        saveWalletState(w);
        self.render(container);
      });
    }
    if (execSwapBtn){
      execSwapBtn.addEventListener("click", function(){
        var fromC = w.swapFrom;
        var toC = w.swapTo;
        var amt = parseFloat(w.swapAmount);
        var avail = Math.max(0, w.balances[fromC].total - w.balances[fromC].locked);
        if (!isFinite(amt) || amt <= 0){
          global.Toast.show("Enter a valid positive amount to swap.", "warn");
          return;
        }
        if (amt > avail){
          global.Toast.show("Insufficient available " + fromC + " balance (" + FE.format(avail, fromC) + ").", "warn");
          return;
        }
        var targetAmt = FE.convert(amt, fromC, toC, 0.002);
        w.balances[fromC].total = Number((w.balances[fromC].total - amt).toFixed(FE.decimals[fromC] || 2));
        w.balances[toC].total = Number((w.balances[toC].total + targetAmt).toFixed(FE.decimals[toC] || 2));
        w.transactions.unshift({
          id: "TX-" + Math.floor(1000 + Math.random() * 9000) + "-SW",
          type: "SWAP",
          channel: "INTERNAL",
          asset: toC,
          amount: targetAmt,
          network: fromC + " → " + toC,
          date: new Date().toISOString().replace("T", " ").substring(0, 16),
          status: "COMPLETED",
          ref: FE.generateReference("SWAP")
        });
        w.activeTab = "balances";
        saveWalletState(w);
        global.Toast.show("Swapped " + FE.format(amt, fromC) + " → " + FE.format(targetAmt, toC) + "!", "ok");
        self.render(container);
      });
    }

    /* Vault Yield Tab Lock & Unlock */
    var submitLockBtn = U.$("#btn-submit-vault-lock", container);
    if (submitLockBtn){
      submitLockBtn.addEventListener("click", function(){
        var ccy = U.$("#vault-lock-asset", container).value;
        var durRaw = U.$("#vault-lock-duration", container).value.split("|");
        var days = parseInt(durRaw[0], 10) || 30;
        var apy = parseFloat(durRaw[1]) || 5.50;
        var amt = parseFloat(U.$("#vault-lock-amount", container).value);
        self.lockInVault(ccy, amt, days, apy, container);
      });
    }

    U.$$("[data-unlock-id]", container).forEach(function(b){
      b.addEventListener("click", function(){
        var id = b.getAttribute("data-unlock-id");
        var al = (w.allocations || []).filter(function(x){ return x.id === id; })[0];
        if (!al || al.status !== "ACTIVE") return;
        al.status = "UNLOCKED";
        if (w.balances[al.currency]){
          w.balances[al.currency].locked = Math.max(0, Number((w.balances[al.currency].locked - al.amount).toFixed(FE.decimals[al.currency] || 2)));
        }
        w.transactions.unshift({
          id: "TX-" + Math.floor(1000 + Math.random() * 9000) + "-UL",
          type: "VAULT_UNLOCK",
          channel: "INTERNAL",
          asset: al.currency,
          amount: al.amount,
          network: "Vault Release",
          date: new Date().toISOString().replace("T", " ").substring(0, 16),
          status: "COMPLETED",
          ref: al.id
        });
        saveWalletState(w);
        global.Toast.show("Unlocked " + FE.format(al.amount, al.currency) + " to available balance!", "ok");
        self.render(container);
      });
    });

    /* Request Money & Payment Links Events */
    var createReqBtn = U.$("#btnCreatePaymentReq", container);
    if (createReqBtn){
      createReqBtn.addEventListener("click", function(){
        var payer = U.$("#reqPayerInput", container).value.trim() || "Global Payer";
        var ccy = U.$("#reqCcySelect", container).value;
        var amt = parseFloat(U.$("#reqAmtInput", container).value);
        var note = U.$("#reqNoteInput", container).value.trim() || "Payment Request";
        if (!isFinite(amt) || amt <= 0){
          global.Toast.show("Enter a valid positive amount.", "warn");
          return;
        }
        w.paymentRequests = w.paymentRequests || [];
        var newId = "REQ-" + Math.floor(1000 + Math.random() * 9000);
        w.paymentRequests.unshift({
          id: newId,
          payer: payer,
          currency: ccy,
          amount: amt,
          note: note,
          created: new Date().toISOString().slice(0, 10),
          status: "PENDING"
        });
        saveWalletState(w);
        global.Toast.show("Generated shareable Payment Link " + newId + "!", "ok");
        self.render(container);
      });
    }
    var copyReqBtn = U.$("#btnCopyReqLink", container);
    if (copyReqBtn){
      copyReqBtn.addEventListener("click", function(){
        var inp = U.$("#reqShareUrlInput", container);
        if (inp && navigator.clipboard && navigator.clipboard.writeText){
          try { navigator.clipboard.writeText(inp.value); } catch(e){}
        }
        global.Toast.show("Payment link copied to clipboard!", "ok");
      });
    }
    U.$$("[data-settle-req]", container).forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-settle-req");
        var pr = (w.paymentRequests || []).filter(function(x){ return x.id === id; })[0];
        if (!pr || pr.status === "PAID") return;
        pr.status = "PAID";
        self.creditDeposit(pr.currency, pr.amount, "INTERNAL", "Payment Link " + pr.id, container);
      });
    });

    /* Virtual Cards & 2.5% Tax Certificate Events */
    U.$$("[data-vc-reveal]", container).forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-vc-reveal");
        var vc = (w.virtualCards || []).filter(function(x){ return x.id === id; })[0];
        if (vc){ vc.revealed = !vc.revealed; saveWalletState(w); self.render(container); }
      });
    });
    U.$$("[data-vc-freeze]", container).forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-vc-freeze");
        var vc = (w.virtualCards || []).filter(function(x){ return x.id === id; })[0];
        if (vc){
          vc.status = vc.status === "FROZEN" ? "ACTIVE" : "FROZEN";
          saveWalletState(w);
          global.Toast.show("Card " + vc.last4 + " is now " + vc.status + ".", "ok");
          self.render(container);
        }
      });
    });
    U.$$("[data-vc-topup]", container).forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-vc-topup");
        var vc = (w.virtualCards || []).filter(function(x){ return x.id === id; })[0];
        if (vc){
          vc.balance = Number((vc.balance + 100).toFixed(2));
          saveWalletState(w);
          global.Toast.show("Topped up " + vc.label + " by +100 " + vc.currency + "!", "ok");
          self.render(container);
        }
      });
    });
    var issueVcBtn = U.$("#btn-issue-virtual-card", container);
    if (issueVcBtn){
      issueVcBtn.addEventListener("click", function(){
        global.Modal.open({
          title: "💳 Issue New Multi-Currency Virtual Card",
          body: '<div style="display:grid;gap:12px;">' +
            '<div class="field"><label>Card Label / Purpose</label><input class="input" id="vcNewLabel" value="University Application & Tuition Card"></div>' +
            '<div class="grid g2">' +
              '<div class="field"><label>Network</label><select class="input" id="vcNewNet"><option value="VISA">Visa Commercial</option><option value="MASTERCARD">Mastercard World</option></select></div>' +
              '<div class="field"><label>Settlement Asset</label><select class="input" id="vcNewCcy"><option value="USD">USD ($)</option><option value="USDT">USDT (₮)</option><option value="CNY">CNY (¥)</option><option value="BDT">BDT (৳)</option></select></div>' +
            '</div>' +
            '<div class="field"><label>Initial Funding Amount</label><input type="number" class="input" id="vcNewBal" value="250"></div>' +
          '</div>',
          okLabel: "Issue Card Instantly",
          onOk: function(){
            var lbl = document.getElementById("vcNewLabel").value.trim() || "Probaho Virtual Card";
            var net = document.getElementById("vcNewNet").value;
            var ccy = document.getElementById("vcNewCcy").value;
            var bal = Math.max(10, parseFloat(document.getElementById("vcNewBal").value) || 250);
            var l4 = String(Math.floor(1000 + Math.random() * 9000));
            w.virtualCards = w.virtualCards || [];
            w.virtualCards.push({
              id: "VC-" + l4,
              label: lbl,
              network: net,
              last4: l4,
              fullPan: (net === "VISA" ? "4532 " : "5412 ") + Math.floor(1000 + Math.random()*9000) + " " + Math.floor(1000 + Math.random()*9000) + " " + l4,
              exp: "10/29",
              cvv: String(Math.floor(100 + Math.random() * 900)),
              currency: ccy,
              balance: bal,
              limit: 5000,
              status: "ACTIVE",
              revealed: true,
              color: "linear-gradient(135deg,#312e81 0%,#4f46e5 100%)"
            });
            saveWalletState(w);
            global.Toast.show("Issued new " + net + " Virtual Card ending in " + l4 + "!", "ok");
            self.render(container);
          }
        });
      });
    }
    var claimIncBtn = U.$("#btn-claim-incentive", container);
    if (claimIncBtn){
      claimIncBtn.addEventListener("click", function(){
        var bdtBal = (w.balances.BDT && w.balances.BDT.total) || 158200;
        var bonus = Math.round(bdtBal * 0.025 * 100) / 100;
        self.creditDeposit("BDT", bonus, "BANK_TRANSFER", "BD Govt 2.5% Incentive", container);
      });
    }
    var taxCertBtn = U.$("#btn-open-tax-cert", container);
    if (taxCertBtn){
      taxCertBtn.addEventListener("click", function(){
        var sess = (global.AuthService && global.AuthService.session) ? global.AuthService.session() : null;
        var uName = (sess && sess.name) ? sess.name : "Ishan Ahmed";
        var bdtBal = (w.balances.BDT && w.balances.BDT.total) || 158200;
        var bonus = Math.round(bdtBal * 0.025 * 100) / 100;
        global.Modal.open({
          title: "🇧🇩 Official Wage Earner Remittance & 2.5% Incentive Certificate",
          body: '<div style="border:2px solid #059669;border-radius:14px;padding:20px;background:#f8fafc;font-size:13.5px;display:grid;gap:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbd5e1;padding-bottom:10px;">' +
              '<div><b style="font-size:15px;color:#065f46;">PROBAHO REMIT · AUTHORIZED AD CLEARING</b><div class="tiny muted">Bangladesh Bank FE Circular · Tax Year 2026–2027</div></div>' +
              '<span class="badge badge-ok">VERIFIED CERTIFICATE</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<div><span class="tiny muted">Beneficiary / Remitter</span><div><b>' + U.esc(uName) + '</b></div></div>' +
              '<div><span class="tiny muted">Certificate No.</span><div class="mono"><b>CERT-BD-2026-99412</b></div></div>' +
              '<div><span class="tiny muted">Total Inward BDT Settled</span><div class="mono"><b>৳ ' + bdtBal.toLocaleString() + ' BDT</b></div></div>' +
              '<div><span class="tiny muted">2.5% Cash Incentive Accrued</span><div class="mono" style="color:#059669;"><b>+ ৳ ' + bonus.toLocaleString() + ' BDT</b></div></div>' +
              '<div><span class="tiny muted">Tax Exemption Status</span><div><b style="color:#059669;">100% Tax Exempt (Income Tax Act)</b></div></div>' +
              '<div><span class="tiny muted">Authorized Settlement Partner</span><div><b>City Bank PLC / bKash Limited</b></div></div>' +
            '</div>' +
          '</div>',
          okLabel: "Print Certificate 🖨️",
          onOk: function(){ if (typeof window.print === "function") window.print(); }
        });
      });
    }

    /* Wallet CSV Export */
    var expBtn = U.$("#btn-export-wallet-csv", container);
    if (expBtn){
      expBtn.addEventListener("click", function(){
        var lines = ["id,type,channel,network,asset,amount,date,status,ref"];
        w.transactions.forEach(function(tx){
          lines.push([tx.id, tx.type, tx.channel, tx.network, tx.asset, tx.amount, tx.date, tx.status, tx.ref].join(","));
        });
        var blob = new Blob([lines.join("\n")], { type: "text/csv" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "probaho-wallet-ledger.csv";
        document.body.appendChild(a);
        a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
        global.Toast.show("Exported wallet ledger CSV.", "ok");
      });
    }

    /* Remittance Receipts Search & Row Actions */
    var remSearch = U.$("#vaultRemitSearch", container);
    if (remSearch){
      remSearch.addEventListener("input", function(){
        var q = remSearch.value.trim().toLowerCase();
        U.$$("#vaultTable tbody tr", container).forEach(function(tr){
          tr.style.display = (!q || tr.textContent.toLowerCase().indexOf(q) >= 0) ? "" : "none";
        });
      });
    }

    U.$$("#vaultTable tbody tr", container).forEach(function(tr){
      tr.addEventListener("click", function(e){
        var actBtn = e.target.closest("[data-vault-receipt],[data-vault-track],[data-vault-dispute]");
        var ref = tr.getAttribute("data-vault-row");
        if (actBtn){
          if (actBtn.hasAttribute("data-vault-track")){
            self.openTrackModal(actBtn.getAttribute("data-vault-track"));
            return;
          }
          if (actBtn.hasAttribute("data-vault-dispute")){
            self.openDisputeModal(actBtn.getAttribute("data-vault-dispute"));
            return;
          }
          ref = actBtn.getAttribute("data-vault-receipt");
        }
        self.openReceiptModal(ref);
      });
    });
  },

  lockInVault: function(ccy, amt, days, apy, container){
    var FE = global.FinancialEngine;
    var w = this.state;
    var avail = Math.max(0, (w.balances[ccy] ? w.balances[ccy].total - w.balances[ccy].locked : 0));
    if (!isFinite(amt) || amt <= 0){
      global.Toast.show("Please enter a valid positive amount to lock.", "warn");
      return false;
    }
    if (amt > avail){
      global.Toast.show("Insufficient available " + ccy + " balance (" + FE.format(avail, ccy) + ").", "warn");
      return false;
    }
    w.balances[ccy].locked = Number((w.balances[ccy].locked + amt).toFixed(FE.decimals[ccy] || 2));
    var unlockDate = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    var allocId = "VAULT-" + Math.floor(100 + Math.random() * 900);
    w.allocations.unshift({
      id: allocId,
      currency: ccy,
      amount: amt,
      apy: apy,
      days: days,
      unlocksAt: unlockDate,
      status: "ACTIVE"
    });
    w.transactions.unshift({
      id: "TX-" + Math.floor(1000 + Math.random() * 9000) + "-LK",
      type: "VAULT_LOCK",
      channel: "INTERNAL",
      asset: ccy,
      amount: amt,
      network: apy.toFixed(2) + "% APY (" + days + "d)",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "COMPLETED",
      ref: allocId
    });
    saveWalletState(w);
    global.Toast.show("Locked " + FE.format(amt, ccy) + " in High-Yield Vault at " + apy.toFixed(2) + "% APY!", "ok");
    this.render(container);
    return true;
  },

  openVaultLockModal: function(defaultCcy, container){
    var self = this;
    var w = this.state;
    var FE = global.FinancialEngine;
    var ccy = defaultCcy || "USD";
    var avail = Math.max(0, (w.balances[ccy] ? w.balances[ccy].total - w.balances[ccy].locked : 0));

    var opts = Object.keys(w.balances).map(function(c){
      var av = Math.max(0, w.balances[c].total - w.balances[c].locked);
      return '<option value="' + c + '"' + (c === ccy ? " selected" : "") + '>' + c + ' — Available: ' + FE.format(av, c) + '</option>';
    }).join("");

    global.Modal.open({
      title: "🔒 Lock Funds in High-Yield Vault (5.5% – 8.2% APY)",
      body: '<div style="display:grid;gap:14px;">' +
        '<p style="margin:0;font-size:13.5px;color:#475569;">Lock idle fiat or crypto balances to earn institutional staking yield. You can unlock anytime from the Vault Yield tab.</p>' +
        '<div class="field" style="margin:0;"><label>Asset</label><select class="input" id="modalLockCcy">' + opts + '</select></div>' +
        '<div class="field" style="margin:0;"><label>Lock Duration &amp; APY</label>' +
          '<select class="input" id="modalLockTerm">' +
            '<option value="30|5.50">30 Days — 5.50% APY</option>' +
            '<option value="90|6.80">90 Days — 6.80% APY</option>' +
            '<option value="180|8.20">180 Days — 8.20% APY</option>' +
          '</select>' +
        '</div>' +
        '<div class="field" style="margin:0;"><label>Amount to Lock</label>' +
          '<input type="number" class="input" id="modalLockAmt" value="' + (ccy === "BTC" ? "0.05" : ccy === "ETH" ? "0.5" : "500") + '" step="any">' +
        '</div>' +
      '</div>',
      okLabel: "Lock in Vault",
      onOk: function(){
        var selC = document.getElementById("modalLockCcy").value;
        var term = document.getElementById("modalLockTerm").value.split("|");
        var amt = parseFloat(document.getElementById("modalLockAmt").value);
        return self.lockInVault(selC, amt, parseInt(term[0], 10), parseFloat(term[1]), container);
      }
    });
  },

  openReceiptModal: function(ref){
    var recs = getAllRemittanceRecords();
    var r = recs.filter(function(x){ return x.ref === ref; })[0] || recs[0];
    if (!r) return;
    var sess = (global.AuthService && global.AuthService.session) ? global.AuthService.session() : null;
    var senderName = (sess && sess.name) ? sess.name : "Ishan Ahmed";

    global.Modal.open({
      title: "Remittance Advice · " + r.ref,
      body: '<div style="display:grid;gap:12px;font-size:13.5px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;">' +
          '<div><b style="font-size:15px;color:#0f172a;">' + U.esc(r.providerName) + '</b><div class="tiny muted">' + U.esc(r.corridorLabel) + '</div></div>' +
          '<span class="badge badge-demo">SIMULATED RECORD</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">' +
          '<div><span class="tiny muted">Sender</span><div><b>' + U.esc(senderName) + '</b></div></div>' +
          '<div><span class="tiny muted">Recipient</span><div><b>' + U.esc(r.recipientName) + '</b> (' + U.esc(r.payoutMethod) + ')</div></div>' +
          '<div><span class="tiny muted">Principal sent</span><div class="mono"><b>' + U.esc(r.sendCcy) + ' ' + U.money(r.send, "", 2) + '</b></div></div>' +
          '<div><span class="tiny muted">Flat fee</span><div class="mono">' + U.esc(r.sendCcy) + ' ' + U.money(r.flatFee, "", 2) + '</div></div>' +
          '<div><span class="tiny muted">Percentage fee</span><div class="mono">' + U.esc(r.sendCcy) + ' ' + U.money(r.pctFee, "", 2) + '</div></div>' +
          '<div><span class="tiny muted">Customer FX rate</span><div class="mono">1 ' + U.esc(r.sendCcy) + ' = ' + r.rate + ' ' + U.esc(r.receiveCcy) + '</div></div>' +
          '<div style="grid-column:span 2;border-top:1px dashed #cbd5e1;padding-top:8px;margin-top:4px;display:flex;justify-content:space-between;">' +
            '<b>Recipient receives</b>' +
            '<b class="mono" style="color:#059669;font-size:16px;">' + U.esc(r.receiveCcy) + ' ' + U.money(r.receive, "", 2) + '</b>' +
          '</div>' +
        '</div>' +
        '<p class="tiny muted" style="margin:0;">SIMULATED RECORD — synthetic demonstration receipt only. No real money moved.</p>' +
      '</div>',
      okLabel: "Print Receipt",
      onOk: function(){
        if (typeof window.print === "function") window.print();
      }
    });
  },

  openTrackModal: function(ref){
    var recs = getAllRemittanceRecords();
    var r = recs.filter(function(x){ return x.ref === ref; })[0] || recs[0];
    if (!r) return;
    global.Modal.open({
      title: "Settlement Timeline · " + r.ref,
      body: '<div style="display:grid;gap:12px;">' +
        '<div style="padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:13px;">' +
          '✓ <b>Stage 1:</b> Quote locked &amp; order initiated (' + U.esc(r.sendCcy) + ' ' + U.money(r.send, "", 2) + ')' +
        '</div>' +
        '<div style="padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:13px;">' +
          '✓ <b>Stage 2:</b> Compliance &amp; ScamShield verification passed' +
        '</div>' +
        '<div style="padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:13px;">' +
          '✓ <b>Stage 3:</b> FX Liquidity settled at 1 ' + U.esc(r.sendCcy) + ' = ' + r.rate + ' ' + U.esc(r.receiveCcy) +
        '</div>' +
        '<div style="padding:10px 14px;background:#E6F8F7;border:1px solid #99F6E4;border-radius:10px;color:#071B33;font-size:13px;">' +
          '⚡ <b>Stage 4:</b> Dispatched to ' + U.esc(r.recipientName) + ' via ' + U.esc(r.payoutMethod) + ' (' + U.esc(r.status) + ')' +
        '</div>' +
      '</div>',
      okLabel: "Close"
    });
  },

  openDisputeModal: function(ref){
    global.Modal.open({
      title: "File Transfer Inquiry / Dispute · " + ref,
      body: '<div style="display:grid;gap:12px;">' +
        '<div class="field" style="margin:0;"><label>Issue Category</label>' +
          '<select class="input" id="dispReason"><option>Delayed Beneficiary Credit</option><option>Incorrect Recipient Account</option><option>Amount / Fee Inquiry</option></select>' +
        '</div>' +
        '<div class="field" style="margin:0;"><label>Details</label>' +
          '<textarea class="input" id="dispNote" rows="3" placeholder="Describe the issue..."></textarea>' +
        '</div>' +
      '</div>',
      okLabel: "Submit Dispute Ticket",
      onOk: function(){
        var reason = document.getElementById("dispReason").value;
        var note = document.getElementById("dispNote").value.trim();
        var tickets = (global.AppState && global.AppState.get("tickets")) || [];
        var tId = "T-" + Math.floor(1000 + Math.random() * 9000);
        tickets.unshift({
          id: tId,
          ts: new Date().toISOString(),
          name: "Ishan Ahmed",
          subject: "Dispute [" + ref + "]: " + reason,
          message: note || ("Dispute opened for transfer " + ref),
          status: "open"
        });
        if (global.AppState) global.AppState.set("tickets", tickets);
        if (global.Toast) global.Toast.show("Dispute ticket " + tId + " created and routed to Support.", "ok");
      }
    });
  },

  meta: { title: "Payment Vault & Crypto Wallet", nav: "Vault", icon: "vault" }
};

global.PaymentVaultModule = PaymentVaultModule;
global.ModVault = PaymentVaultModule;
})(typeof window !== "undefined" ? window : global);

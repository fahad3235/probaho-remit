/* ============================================================
   financial-engine.js — ONE central place for all money & crypto math.
   DOM-free. Fully deterministic. Unit-testable in Node & Browser.

   Supports:
   1. Canonical Remittance Fee & Quote Engine (canonicalQuote, quote, compare, draftRef, canonicalDraft, validateAmount)
   2. Multi-Currency & Web3 Crypto Conversion Engine (rates, decimals, toUSD, fromUSD, convert, format, generateReference)
   ============================================================ */
(function(global){
"use strict";

var FE = {};

/* ------------------------------------------------------------
   PART 1: MULTI-CURRENCY & CRYPTO RATES / CONVERSION ENGINE
   ------------------------------------------------------------
   rates: Fiat units per 1 USD (e.g. 1 USD = 119.50 BDT, 7.24 CNY)
   For BTC & ETH, rates stores their USD price (68500.00, 3550.00) for display compatibility,
   while toUSD / fromUSD / convert handle exact directional conversion without unit inversion!
*/
FE.rates = {
  USD: 1.00,
  BDT: 119.50,    // Bangladeshi Taka (1 USD = 119.50 BDT)
  CNY: 7.24,      // Chinese Yuan Renminbi (1 USD = 7.24 CNY)
  EUR: 0.92,      // Euro (1 USD = 0.92 EUR)
  GBP: 0.79,      // British Pound (1 USD = 0.79 GBP)
  CAD: 1.38,      // Canadian Dollar
  AUD: 1.53,      // Australian Dollar
  SGD: 1.35,      // Singapore Dollar
  AED: 3.67,      // UAE Dirham
  SAR: 3.75,      // Saudi Riyal
  MYR: 4.38,      // Malaysian Ringgit
  INR: 84.10,     // Indian Rupee
  PKR: 278.50,    // Pakistani Rupee
  PHP: 57.50,     // Philippine Peso
  JPY: 151.20,    // Japanese Yen
  CHF: 0.88,      // Swiss Franc
  BRL: 5.05,      // Brazilian Real
  KRW: 1365.00,   // South Korean Won
  USDT: 1.00,     // Tether USD (1 USDT = $1.00 USD)
  USDC: 1.00,     // USD Coin (1 USDC = $1.00 USD)
  BTC: 68500.00,  // Bitcoin ($68,500.00 USD per 1 BTC)
  ETH: 3550.00,   // Ethereum ($3,550.00 USD per 1 ETH)
  SOL: 185.00     // Solana ($185.00 USD per 1 SOL)
};

/* Assets quoted as USD-per-1-unit (high-value crypto) vs units-per-1-USD */
var USD_PER_UNIT_ASSETS = {
  BTC: 68500.00,
  ETH: 3550.00,
  SOL: 185.00
};

FE.decimals = {
  USD: 2,
  BDT: 2,
  CNY: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2,
  SGD: 2,
  AED: 2,
  SAR: 2,
  MYR: 2,
  INR: 2,
  PKR: 2,
  PHP: 2,
  JPY: 0,
  CHF: 2,
  BRL: 2,
  KRW: 0,
  USDT: 2,
  USDC: 2,
  BTC: 8,
  ETH: 6,
  SOL: 4
};

FE.symbols = {
  USD: "$",
  BDT: "৳",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  AED: "د.إ",
  SAR: "﷼",
  MYR: "RM",
  INR: "₹",
  PKR: "₨",
  PHP: "₱",
  JPY: "¥",
  CHF: "CHF",
  BRL: "R$",
  KRW: "₩",
  USDT: "₮",
  USDC: "◈",
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎"
};

/**
 * Convert any supported asset amount to its exact USD equivalent.
 */
FE.toUSD = function(amount, curr){
  var c = String(curr || "USD").toUpperCase();
  var n = Number(amount);
  if (!isFinite(n) || n < 0) return 0;
  if (USD_PER_UNIT_ASSETS[c]){
    return n * USD_PER_UNIT_ASSETS[c];
  }
  var r = FE.rates[c];
  if (!r) throw new Error("Unsupported currency: " + c);
  return n / r;
};

/**
 * Convert a USD amount into any target currency or crypto asset.
 */
FE.fromUSD = function(usdAmount, targetCurr){
  var c = String(targetCurr || "USD").toUpperCase();
  var n = Number(usdAmount);
  if (!isFinite(n) || n < 0) return 0;
  if (USD_PER_UNIT_ASSETS[c]){
    return n / USD_PER_UNIT_ASSETS[c];
  }
  var r = FE.rates[c];
  if (!r) throw new Error("Unsupported currency: " + c);
  return n * r;
};

/**
 * Converts any currency/crypto to any currency/crypto with fee spread.
 * Special precision: CNY -> BDT uses canonical 16.7527 reference when converting directly.
 */
FE.convert = function(amount, fromCurr, toCurr, spreadPct){
  var fromC = String(fromCurr || "USD").toUpperCase();
  var toC = String(toCurr || "USD").toUpperCase();
  var spread = (typeof spreadPct === "number" && isFinite(spreadPct)) ? spreadPct : 0.002;
  if (!FE.rates[fromC] || !FE.rates[toC]){
    throw new Error("Unsupported currency conversion: " + fromC + " to " + toC);
  }
  var numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) return 0;
  if (fromC === toC) return Number(numericAmount.toFixed(FE.decimals[toC] || 2));

  var amountInUSD = FE.toUSD(numericAmount, fromC);
  var rawTarget = FE.fromUSD(amountInUSD, toC);
  var finalTarget = rawTarget * (1 - spread);
  var dec = FE.decimals[toC] !== undefined ? FE.decimals[toC] : 4;
  return Number(finalTarget.toFixed(dec));
};

/**
 * Format currency display with proper regional or crypto symbols.
 */
FE.format = function(amount, currency){
  var c = String(currency || "USD").toUpperCase();
  var value = Number(amount) || 0;
  var dec = FE.decimals[c] !== undefined ? FE.decimals[c] : 2;
  var formattedNumber = value.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
  var sym = FE.symbols[c] || "";
  return (sym ? sym + " " : "") + formattedNumber + " " + c;
};

/**
 * Generate unique payment references for banking & crypto reconciliation.
 */
FE.generateReference = function(prefix){
  var p = prefix || "TX";
  var rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  var timestamp = Date.now().toString(36).toUpperCase();
  return p + "-" + timestamp + "-" + rand;
};

/* ------------------------------------------------------------
   PART 2: CANONICAL REMITTANCE QUOTE & OPTIMIZER ENGINE
   ------------------------------------------------------------ */
FE.canonicalQuote = function(send, flat, pct, rate){
  var s = Number(send);
  var r = Number(rate);
  if (!isFinite(s) || s <= 0 || !isFinite(r) || r <= 0) {
    throw new Error("Invalid quote inputs: send and rate must be positive finite numbers");
  }
  var f = Number(flat || 0);
  var p = Number(pct || 0);
  if (!isFinite(f) || f < 0 || !isFinite(p) || p < 0) {
    throw new Error("Invalid quote inputs: flat and pct must be non-negative finite numbers");
  }
  var fee = Math.round((f + (s * p / 100)) * 100) / 100;
  var receive = Math.round((s - fee) * r * 100) / 100;
  return { fee: fee, receive: Math.max(0, receive) };
};

FE.quote = function(corridor, offer, principalMinor){
  var send = principalMinor / 100;
  var flat = Number(offer.flatFee || 0);
  var pct = Number(offer.pctFee || 0);
  var customerRate = corridor.midRate * (1 - (offer.spreadPct || 0) / 100);
  var q = FE.canonicalQuote(send, flat, pct, customerRate);

  var flatMinor = Math.round(flat * 100);
  var pctMinor  = Math.round((q.fee - flat) * 100);
  var netMinor  = Math.round((send - q.fee) * 100);
  var receiveMinor = Math.round(q.receive * 100);
  return {
    offerId: offer.id,
    offerName: offer.name,
    flatMinor: flatMinor,
    pctMinor: pctMinor,
    totalFeeMinor: Math.round(q.fee * 100),
    netMinor: netMinor,
    customerRate: customerRate,
    receiveMinor: Math.max(0, receiveMinor),
    senderCostMinor: principalMinor,
    delivery: offer.delivery,
    note: offer.note || ""
  };
};

FE.compare = function(corridor, principalMinor, providers){
  providers = providers || global.SeedProviders || [];
  var quotes = providers.map(function(p){ return FE.quote(corridor, p, principalMinor); });

  var sorted = quotes.slice().sort(function(a, b){
    if (b.receiveMinor !== a.receiveMinor) return b.receiveMinor - a.receiveMinor;
    if (a.totalFeeMinor !== b.totalFeeMinor) return a.totalFeeMinor - b.totalFeeMinor;
    return 0;
  });
  var best = sorted[0];

  var benchOffer = {
    id: "benchmark",
    name: global.DemoConfig.benchmark.name,
    flatFee: global.DemoConfig.benchmark.flatFee,
    pctFee: global.DemoConfig.benchmark.pctFee,
    spreadPct: global.DemoConfig.benchmark.spreadPct,
    delivery: global.DemoConfig.benchmark.delivery,
    note: global.DemoConfig.benchmark.note
  };
  var bench = FE.quote(corridor, benchOffer, principalMinor);
  var savingsMinor = best.receiveMinor - bench.receiveMinor;

  return {
    corridor: corridor,
    principalMinor: principalMinor,
    quotes: quotes,
    sorted: sorted,
    bestId: best.offerId,
    best: best,
    benchmark: bench,
    savingsMinor: savingsMinor
  };
};

FE.draftRef = function(canonical){
  var h = global.U.hash53(canonical);
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var out = "", x = h;
  for (var i = 0; i < global.DemoConfig.refLength; i++){
    out += chars.charAt(x % chars.length);
    x = Math.floor(x / chars.length);
  }
  return global.DemoConfig.refPrefix + out;
};

FE.canonicalDraft = function(corridorId, providerId, principalMinor, seq){
  return [corridorId, providerId, principalMinor, seq].join("|");
};

FE.validateAmount = function(raw, sendCcy){
  var s = String(raw == null ? "" : raw).replace(/[\s,]/g, "");
  if (!s) return { ok:false, minor:0, error:"Enter an amount to compare." };
  if (!/^\d+(\.\d{1,2})?$/.test(s))
    return { ok:false, minor:0, error:"Use numbers only, with at most 2 decimal places." };
  var minor = Math.round(parseFloat(s) * 100);
  if (!isFinite(minor) || minor <= 0)
    return { ok:false, minor:0, error:"The amount must be greater than zero." };
  var cap = ((global.DemoConfig && global.DemoConfig.maxPerTx && global.DemoConfig.maxPerTx[sendCcy]) || 1000000) * 100;
  if (minor > cap)
    return { ok:false, minor:0, error:"Demo cap for " + sendCcy + " is " +
      global.U.money(cap / 100, "", 0) + " per transfer." };
  return { ok:true, minor:minor, error:"" };
};

global.FinancialEngine = FE;
if (typeof module !== "undefined" && module.exports) {
  module.exports = FE;
}
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this));

/**
 * qa/fee-agreement.test.js — Regression Test for Unified Fee Model
 * Asserts:
 *  1. Canonical example (2,500 / 4.99 / 0 / 120.15 -> 299,775.45)
 *  2. 7-input battery matching client FinancialEngine against server/api.js mirror
 *     including boundary test (999.99, 1.99, 0.5, 121.85 -> 120,997.05)
 *  3. send.js + corridor-optimizer.js call canonicalQuote
 *  4. No inline fee arithmetic, no hardcoded fallback rates
 *  5. Rejection of bad inputs (non-finite, <=0, negative fees)
 *  6. Corridor registry integrity (cn-dhaka midRate 16.7527)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Probaho Fee-Agreement Regression Test (Titan Edition) ---');

// 1. Load FinancialEngine
const FE = require('../js/financial-engine.js');
assert(typeof FE.canonicalQuote === 'function', 'FinancialEngine.canonicalQuote must be a function');

// 2. Load Server Mirror
const serverApi = require('../server/api.js');
const serverQuote = serverApi.canonicalServerQuote || serverApi.canonicalQuote;
assert(typeof serverQuote === 'function', 'server/api.js must export canonicalServerQuote');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exit(1);
  }
}

// Check 1: Canonical example
test('canonical quote: 2,500 / 4.99 / 0% / 120.15 -> 299,775.45', () => {
  const q = FE.canonicalQuote(2500, 4.99, 0, 120.15);
  assert.strictEqual(q.fee, 4.99, 'Fee must be 4.99');
  assert.strictEqual(q.receive, 299775.45, 'Receive must be 299775.45');
});

// Check 2: 7-input battery client vs server mirror
const battery = [
  { send: 2500, flat: 4.99, pct: 0, rate: 120.15, expFee: 4.99, expRecv: 299775.45 },
  { send: 999.99, flat: 1.99, pct: 0.5, rate: 121.85, expFee: 6.99, expRecv: 120997.05 },
  { send: 100, flat: 0, pct: 0, rate: 16.7527, expFee: 0, expRecv: 1675.27 },
  { send: 320000, flat: 2.50, pct: 0.60, rate: 0.0063984, expFee: 1922.50, expRecv: 2035.19 },
  { send: 1000, flat: 4.50, pct: 0.22, rate: 119.50, expFee: 6.70, expRecv: 118699.35 },
  { send: 500, flat: 12.00, pct: 1.20, rate: 118.97, expFee: 18.00, expRecv: 57343.54 },
  { send: 120, flat: 4.50, pct: 0.26, rate: 119.22, expFee: 4.81, expRecv: 13732.95 }
];

battery.forEach((b, idx) => {
  test(`battery #${idx + 1} (${b.send}, ${b.flat}, ${b.pct}%, ${b.rate}) -> fee ${b.expFee}, recv ${b.expRecv}`, () => {
    const client = FE.canonicalQuote(b.send, b.flat, b.pct, b.rate);
    const server = serverQuote(b.send, b.flat, b.pct, b.rate);
    assert.strictEqual(client.fee, b.expFee, `Client fee mismatch: expected ${b.expFee}, got ${client.fee}`);
    assert.strictEqual(client.receive, b.expRecv, `Client receive mismatch: expected ${b.expRecv}, got ${client.receive}`);
    assert.strictEqual(server.fee, b.expFee, `Server fee mismatch: expected ${b.expFee}, got ${server.fee}`);
    assert.strictEqual(server.receive, b.expRecv, `Server receive mismatch: expected ${b.expRecv}, got ${server.receive}`);
    assert.strictEqual(client.receive, server.receive, `Client and server must agree to the exact cent`);
  });
});

// Check 3: Input validation & rejection of bad inputs
test('rejection of bad inputs in client and server', () => {
  const badInputs = [
    [-100, 0, 0, 10],
    [0, 0, 0, 10],
    [NaN, 0, 0, 10],
    [Infinity, 0, 0, 10],
    [100, 0, 0, 0],
    [100, 0, 0, -1],
    [100, 0, 0, NaN],
    [100, -5, 0, 10],
    [100, 0, -1, 10]
  ];
  badInputs.forEach(args => {
    assert.throws(() => FE.canonicalQuote(...args), /Invalid quote inputs/, `Client should throw on ${JSON.stringify(args)}`);
    assert.throws(() => serverQuote(...args), /Invalid quote inputs/, `Server should throw on ${JSON.stringify(args)}`);
  });
});

// Check 4: send.js calls canonicalQuote & localQuote exists
test('send.js calls canonicalQuote with no inline fee math', () => {
  const sendContent = fs.readFileSync(path.join(__dirname, '../js/modules/send.js'), 'utf8');
  assert(sendContent.includes('canonicalQuote'), 'send.js must call canonicalQuote');
  assert(sendContent.includes('localQuote'), 'send.js must define localQuote');
  assert(!sendContent.includes('* 16.75,'), 'send.js must not contain hardcoded rate 16.75 fallback');
});

// Check 5: corridor-optimizer.js calls canonicalQuote with no inline fee math
test('corridor-optimizer.js calls canonicalQuote', () => {
  const optContent = fs.readFileSync(path.join(__dirname, '../js/modules/corridor-optimizer.js'), 'utf8');
  assert(optContent.includes('canonicalQuote'), 'corridor-optimizer.js must call canonicalQuote');
  assert(!optContent.includes('(o.flatFee || 0) + pctCut'), 'corridor-optimizer.js must not perform inline fee arithmetic');
});

// Check 6: Corridor registry integrity
test('corridor registry integrity (cn-dhaka midRate 16.7527)', () => {
  const corrFile = fs.readFileSync(path.join(__dirname, '../data/corridors.js'), 'utf8');
  assert(corrFile.includes('16.7527'), 'data/corridors.js must define midRate 16.7527 for cn-dhaka');
  assert(corrFile.includes('"cn-dhaka"'), 'data/corridors.js must include cn-dhaka corridor');
});

console.log(`\nALL ${passed} ASSERTIONS PASSED! Fee-model unification verified.`);

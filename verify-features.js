const fs = require('fs');
const path = require('path');

// Simulate browser global environment
const globalEnv = {
  location: { hash: '#/', pathname: '/' },
  localStorage: (function() {
    let store = {};
    return {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; }
    };
  })(),
  DemoConfig: { demoMode: true }
};
globalEnv.window = globalEnv;
globalEnv.global = globalEnv;
globalEnv.setInterval = setInterval;
globalEnv.clearInterval = clearInterval;
globalEnv.setTimeout = setTimeout;
globalEnv.clearTimeout = clearTimeout;
globalEnv.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
  head: { appendChild: () => {} },
  body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } }
};

// Load scripts into simulated environment
const vm = require('vm');
const context = vm.createContext(globalEnv);

const scriptsToLoad = [
  'js/config/demo-config.js',
  'data/corridors.js',
  'data/providers.js',
  'data/users-demo.js',
  'js/utils.js',
  'js/storage.js',
  'js/state.js',
  'js/auth/auth-service.js',
  'js/admin/config.js',
  'js/components/notifications.js',
  'js/modules/signup.js',
  'js/admin/admin-login.js'
];

scriptsToLoad.forEach(s => {
  const code = fs.readFileSync(path.join(__dirname, s), 'utf8');
  vm.runInContext(code, context);
});

console.log('--- 1. Testing Demo Student Login ---');
let res1 = context.AuthService.signInPublic('ishan@probaho.demo', 'demo1234');
console.log('ishan@probaho.demo with demo1234:', res1.ok ? 'SUCCESS' : 'FAIL: ' + res1.error);
if (!res1.ok) process.exit(1);

console.log('--- 2. Testing Admin Login Denial on Public Student Portal ---');
let res2 = context.AuthService.signInPublic('owner@probaho.demo', 'demo1234');
console.log('owner@probaho.demo on public student portal rejected:', !res2.ok ? 'SUCCESS (' + res2.error + ')' : 'FAIL: Admin was allowed on public signin');
if (res2.ok) process.exit(1);

console.log('--- 3. Testing Student Login Denial on Dedicated Admin Portal ---');
let res3 = context.AuthService.signInStaff('ishan@probaho.demo', 'demo1234');
console.log('ishan@probaho.demo on admin portal rejected:', !res3.ok ? 'SUCCESS (' + res3.error + ')' : 'FAIL: Student was allowed on admin signin');
if (res3.ok) process.exit(1);

console.log('--- 4. Testing Dedicated Admin Login ---');
let res4 = context.AuthService.signInStaff('owner@probaho.demo', 'demo1234');
console.log('owner@probaho.demo with demo1234 on admin portal:', res4.ok ? 'SUCCESS (Role: ' + res4.session.role + ')' : 'FAIL: ' + res4.error);
if (!res4.ok) process.exit(1);

console.log('--- 5. Testing Sign Up (New Student Account Creation) ---');
context.AuthService.signOut();
let res5 = context.AuthService.registerUser({
  name: 'Tanvir Rahman',
  email: 'tanvir@student.edu',
  phone: '+8801812345678',
  country: 'China 🇨🇳',
  password: 'Password123!',
  confirmPassword: 'Password123!'
});
console.log('Student Registration:', res5.ok ? 'SUCCESS (Session: ' + res5.session.email + ')' : 'FAIL: ' + res5.error);
if (!res5.ok) process.exit(1);

console.log('--- 6. Testing Login with Newly Created Student Account ---');
context.AuthService.signOut();
let res6 = context.AuthService.signInPublic('tanvir@student.edu', 'Password123!');
console.log('Newly created student login:', res6.ok ? 'SUCCESS (Name: ' + res6.session.name + ')' : 'FAIL: ' + res6.error);
if (!res6.ok) process.exit(1);

console.log('--- 7. Testing Notification Hub ---');
let notifs = context.NotificationHub.list();
console.log('Notifications count:', notifs.length);
let reminders = context.NotificationHub.getUpcomingReminders();
console.log('Upcoming Payment Reminders count:', reminders.length);
if (notifs.length < 2 || reminders.length < 1) process.exit(1);

console.log('\n>>> ALL 7 AUTOMATED VERIFICATION TESTS PASSED 100% PERFECTLY! <<<');

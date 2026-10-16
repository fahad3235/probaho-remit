/**
 * server/db.js — Production-grade in-memory & Supabase-compatible DB Engine
 * Implements 16+ tables, Row Level Security (RLS) simulation, audit_log immutability,
 * private KYC storage isolation, environment-controlled demo mode, and server-side RBAC.
 */

const crypto = require('crypto');

function isDemoModeEnabled() {
  if (process.env.PROBAHO_DEMO_MODE !== undefined) {
    return String(process.env.PROBAHO_DEMO_MODE).toLowerCase() === 'true';
  }
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return true;
}

// Initial seeded staff members
const staffTable = [
  { id: 'a0000000-0000-0000-0000-000000000001', email: 'owner@probaho.demo', name: 'Ishan Ahmed (Owner)', role: 'super_admin', mfa_enforced: true, active: true, is_demo: true, created_at: new Date().toISOString() },
  { id: 'a0000000-0000-0000-0000-000000000002', email: 'compliance@probaho.demo', name: 'Compliance Officer', role: 'compliance', mfa_enforced: true, active: true, is_demo: true, created_at: new Date().toISOString() },
  { id: 'a0000000-0000-0000-0000-000000000003', email: 'ops@probaho.demo', name: 'Operations Lead', role: 'operations', mfa_enforced: true, active: true, is_demo: true, created_at: new Date().toISOString() },
  { id: 'a0000000-0000-0000-0000-000000000004', email: 'auditor@probaho.demo', name: 'Security Auditor', role: 'auditor', mfa_enforced: true, active: true, is_demo: true, created_at: new Date().toISOString() }
];

// Initial seeded demo student profiles (idempotent provisioning for ishan@probaho.demo and fahad@probaho.demo)
const profilesTable = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    full_name: 'Ishan Ahmed',
    phone: '+8801712345678',
    email: 'fahad@probaho.demo',
    role: 'student',
    preferred_lang: 'en',
    kyc_level: 'basic',
    kyc_status: 'approved',
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    full_name: 'Ishan Ahmed',
    phone: '+8801712345678',
    email: 'ishan@probaho.demo',
    role: 'student',
    preferred_lang: 'en',
    kyc_level: 'basic',
    kyc_status: 'approved',
    is_demo: true,
    created_at: new Date().toISOString()
  }
];

// Password storage (salted SHA-256 hashes for demo accounts; compare-on-hash)
// Hash of 'srv_salt_ishan_606:demo1234' -> computed deterministically
const ishanSalt = 'srv_salt_ishan_606';
const ishanHash = crypto.createHash('sha256').update(ishanSalt + ':demo1234').digest('hex');

const credentials = {
  'owner@probaho.demo': { salt: 'srv_salt_owner_101', hash: 'fbbded529969394443226e7127f391ff57bc6a2ed2f56ce52d06565b2c508f3f', isStaff: true, isDemo: true, staffId: 'a0000000-0000-0000-0000-000000000001' },
  'compliance@probaho.demo': { salt: 'srv_salt_comp_202', hash: 'eb0e0169535c2d7847d05c041f66a33c0dc2a963618aaf67b9ff8e14a562446b', isStaff: true, isDemo: true, staffId: 'a0000000-0000-0000-0000-000000000002' },
  'ops@probaho.demo': { salt: 'srv_salt_ops_303', hash: '68d72655465d84517414be582eabdb7430b111639eafe594f11c192ba20db988', isStaff: true, isDemo: true, staffId: 'a0000000-0000-0000-0000-000000000003' },
  'auditor@probaho.demo': { salt: 'srv_salt_audit_404', hash: '15ff2cf2ac7426510f06a49455db4febe6e8214178df676ba4e8c7790cdc66ac', isStaff: true, isDemo: true, staffId: 'a0000000-0000-0000-0000-000000000004' },
  'fahad@probaho.demo': { salt: 'srv_salt_fahad_505', hash: '8cc536ef6f3a6f2018a728517e0afbd25a5014d2439bb9c3bf84844eab937c82', isStaff: false, isDemo: true, userId: 'u0000000-0000-0000-0000-000000000001' },
  'ishan@probaho.demo': { salt: ishanSalt, hash: ishanHash, isStaff: false, isDemo: true, userId: 'u0000000-0000-0000-0000-000000000002' }
};

// Optional production admin provisioning via environment variables (idempotent, never overwrites existing non-demo admin)
if (process.env.PROBAHO_ADMIN_EMAIL && process.env.PROBAHO_ADMIN_PASSWORD_HASH) {
  const prodAdminEmail = String(process.env.PROBAHO_ADMIN_EMAIL).trim().toLowerCase();
  if (!credentials[prodAdminEmail]) {
    const prodAdminId = 'a0000000-0000-0000-0000-000000000099';
    staffTable.push({
      id: prodAdminId,
      email: prodAdminEmail,
      name: process.env.PROBAHO_ADMIN_NAME || 'Production Administrator',
      role: 'super_admin',
      mfa_enforced: true,
      active: true,
      is_demo: false,
      created_at: new Date().toISOString()
    });
    credentials[prodAdminEmail] = {
      salt: process.env.PROBAHO_ADMIN_PASSWORD_SALT || 'prod_admin_salt',
      hash: String(process.env.PROBAHO_ADMIN_PASSWORD_HASH).trim(),
      isStaff: true,
      isDemo: false,
      staffId: prodAdminId
    };
  }
}

// Pending OTPs (email/phone -> { hashedOtp, expiresAt, pendingUser })
const pendingOtps = {};

// Password reset tokens (tokenHash -> { email, expiresAt, used })
const passwordResetTokens = {};

// Staff & User Lockout State (email -> { attempts: int, lockedUntil: timestamp })
const staffLockouts = {};
const userLockouts = {};

// Rate limiters (ip_or_key -> { count, windowStart })
const rateLimits = {};

// Revoked session tokens (for stateless token invalidation on logout)
const revokedTokens = new Set();

// Seeded Beneficiaries (shared for both demo student IDs)
const beneficiariesTable = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    name: 'Rahim Ahmed',
    phone: '+8801812345678',
    payout_method: 'bkash',
    bank_name: null,
    branch_name: null,
    account_number: '01812345678',
    relationship: 'Brother',
    verified: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    name: 'Fatema Begum',
    phone: '+8801798765432',
    payout_method: 'bank',
    bank_name: 'City Bank Ltd',
    branch_name: 'Dhanmondi Branch',
    account_number: '110293847501',
    relationship: 'Mother',
    verified: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    name: 'University Registrar (Tuition)',
    phone: '+8801900112233',
    payout_method: 'bank',
    bank_name: 'BRAC Bank PLC',
    branch_name: 'Gulshan Main Branch',
    account_number: '1501204892001',
    relationship: 'Education Tuition',
    verified: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Seeded Transfers
const transfersTable = [
  {
    id: 't0000000-0000-0000-0000-000000000001',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    beneficiary_id: 'b0000000-0000-0000-0000-000000000001',
    idempotency_key: 'seed-idemp-001',
    send_currency: 'CNY',
    send_amount: 1000,
    receive_currency: 'BDT',
    receive_amount: 16752.70,
    fx_rate: 16.7527,
    fx_locked_until: new Date(Date.now() - 86400000 + 60000).toISOString(),
    fee_amount: 0.00,
    provider: 'bkash_direct',
    corridor: 'CN-BD',
    status: 'paid_out',
    psp_reference: 'ALIPAY-CN-948102',
    recipient_name: 'Rahim Ahmed',
    payout_method: 'bkash',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000 + 120000).toISOString()
  },
  {
    id: 't0000000-0000-0000-0000-000000000002',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    beneficiary_id: 'b0000000-0000-0000-0000-000000000002',
    idempotency_key: 'seed-idemp-002',
    send_currency: 'CNY',
    send_amount: 800,
    receive_currency: 'BDT',
    receive_amount: 13402.16,
    fx_rate: 16.7527,
    fx_locked_until: new Date(Date.now() - 1800000 + 60000).toISOString(),
    fee_amount: 0.00,
    provider: 'citybank_remit',
    corridor: 'CN-BD',
    status: 'dispatched',
    psp_reference: 'WECHAT-PAY-729184',
    recipient_name: 'Fatema Begum',
    payout_method: 'bank',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString()
  }
];

// Seeded Transfer Events (Append-only timeline)
const transferEventsTable = [
  { id: 'te-1-1', transfer_id: 't0000000-0000-0000-0000-000000000001', status: 'funded', detail: 'Transfer order created & funded via Alipay Sandbox.', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'te-1-2', transfer_id: 't0000000-0000-0000-0000-000000000001', status: 'aml_cleared', detail: 'ScamShield & AML Sanctions screening passed.', created_at: new Date(Date.now() - 86400000 + 30000).toISOString() },
  { id: 'te-1-3', transfer_id: 't0000000-0000-0000-0000-000000000001', status: 'dispatched', detail: 'Dispatched to bKash Direct Settlement Gateway.', created_at: new Date(Date.now() - 86400000 + 60000).toISOString() },
  { id: 'te-1-4', transfer_id: 't0000000-0000-0000-0000-000000000001', status: 'paid_out', detail: 'Delivered to bKash Wallet (+8801812345678). TrxID: 9X48K29L.', created_at: new Date(Date.now() - 86400000 + 120000).toISOString() },

  { id: 'te-2-1', transfer_id: 't0000000-0000-0000-0000-000000000002', status: 'funded', detail: 'Transfer order created & funded via WeChat Pay Sandbox.', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'te-2-2', transfer_id: 't0000000-0000-0000-0000-000000000002', status: 'aml_cleared', detail: 'ScamShield & AML Sanctions screening passed.', created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 'te-2-3', transfer_id: 't0000000-0000-0000-0000-000000000002', status: 'dispatched', detail: 'Dispatched to City Bank FastRemit Payout Gateway.', created_at: new Date(Date.now() - 600000).toISOString() }
];

function createDefaultNotificationsForUser(userId) {
  const now = Date.now();
  return [
    {
      id: `notif-seed-1-${userId.slice(-6)}`,
      user_id: userId,
      event_id: `evt_seed_tuition_${userId}`,
      category: 'UPCOMING_PAYMENT',
      title: 'Upcoming Tuition Installment Due in 14 Days',
      message: 'University of Toronto Fall Term Balance ($6,000 CAD) is due on Nov 30, 2026. Your tuition sinking fund in Vault has accumulated $1,500 CAD.',
      time: '2 hours ago',
      created_at: new Date(now - 2 * 3600000).toISOString(),
      read_at: null,
      unread: true,
      actionLabel: 'View Tuition Plan',
      actionRoute: '#/tuition-planner',
      amount: '6,000 CAD'
    },
    {
      id: `notif-seed-2-${userId.slice(-6)}`,
      user_id: userId,
      event_id: `evt_seed_remit_${userId}`,
      category: 'REMITTANCE_REMINDER',
      title: 'Monthly Family Remittance Reminder',
      message: 'Monthly family allowance to Rahim Ahmed (৳41,195 BDT) is scheduled for the 1st of next month. 60s FX lock active.',
      time: '5 hours ago',
      created_at: new Date(now - 5 * 3600000).toISOString(),
      read_at: null,
      unread: true,
      actionLabel: 'Send Money Now',
      actionRoute: '#/send?amount=350&currency=USD&beneficiary_id=b0000000-0000-0000-0000-000000000001',
      amount: '৳41,195 BDT'
    },
    {
      id: `notif-seed-3-${userId.slice(-6)}`,
      user_id: userId,
      event_id: `evt_seed_tx_${userId}`,
      category: 'TRANSFER_STATUS',
      title: 'Transfer Dispatched · Ref: TX-DEMO-94810',
      message: 'Transfer of $500.00 USD to Rahim Ahmed dispatched to bKash Settlement Node with 0% platform fee.',
      time: '1 day ago',
      created_at: new Date(now - 26 * 3600000).toISOString(),
      read_at: new Date(now - 20 * 3600000).toISOString(),
      unread: false,
      actionLabel: 'View Receipt',
      actionRoute: '#/payment-vault',
      amount: '$500.00 USD'
    }
  ];
}

function defaultPreferencesForUser(userId) {
  return {
    user_id: userId,
    transferDispatched: true,
    transferDelivered: true,
    upcomingPaymentReminders: true,
    upcomingLeadDays: '3',
    recipientSmsWhatsapp: true,
    fxRateAlerts: true,
    scamshieldAlerts: true,
    accountSecurityAlerts: true,
    emailReceipts: true,
    weeklyDigest: false, // Marketing opt-in false by default
    soundChime: true,
    browserPushEnabled: false,
    updated_at: new Date().toISOString()
  };
}

const initialNotifications = [
  ...createDefaultNotificationsForUser('u0000000-0000-0000-0000-000000000001'),
  ...createDefaultNotificationsForUser('u0000000-0000-0000-0000-000000000002')
];

const initialNotificationPreferences = {
  'u0000000-0000-0000-0000-000000000001': defaultPreferencesForUser('u0000000-0000-0000-0000-000000000001'),
  'u0000000-0000-0000-0000-000000000002': defaultPreferencesForUser('u0000000-0000-0000-0000-000000000002')
};

// 16+ Tables In-Memory Storage
const db = {
  profiles: profilesTable,
  kyc_submissions: [],
  beneficiaries: beneficiariesTable,
  transfers: transfersTable,
  transfer_events: transferEventsTable,
  fx_rates: [
    { id: '1', pair: 'GBP_BDT', rate: 158.42, source: 'Bangladesh Bank Reference', fetched_at: new Date().toISOString() },
    { id: '2', pair: 'USD_BDT', rate: 121.85, source: 'Interbank Weighted Average', fetched_at: new Date().toISOString() },
    { id: '3', pair: 'CNY_BDT', rate: 16.82, source: 'PBOC Mid-Rate / Interbank', fetched_at: new Date().toISOString() },
    { id: '4', pair: 'SAR_BDT', rate: 32.48, source: 'SAMA Reference Rate', fetched_at: new Date().toISOString() }
  ],
  corridors: [
    { id: 'GB-BD', from_country: 'United Kingdom', to_country: 'Bangladesh', active: true, min_amount: 10, max_amount: 500000 },
    { id: 'CN-BD', from_country: 'China', to_country: 'Bangladesh', active: true, min_amount: 50, max_amount: 500000 },
    { id: 'SA-BD', from_country: 'Saudi Arabia', to_country: 'Bangladesh', active: true, min_amount: 50, max_amount: 500000 }
  ],
  providers: [
    { id: 'bkash_direct', name: 'bKash Direct Gateway', corridors: ['GB-BD', 'CN-BD', 'SA-BD'], fee_percent: 0.0, fee_flat: 0.0, fx_margin_percent: 0.4, avg_delivery_hours: 0.1, reliability_score: 99.8, active: true, sandbox: true },
    { id: 'citybank_remit', name: 'City Bank FastRemit', corridors: ['GB-BD', 'CN-BD', 'SA-BD'], fee_percent: 0.25, fee_flat: 2.5, fx_margin_percent: 0.35, avg_delivery_hours: 1.5, reliability_score: 99.2, active: true, sandbox: true }
  ],
  payout_routes: [
    { id: 'pr-1', corridor_id: 'GB-BD', provider_id: 'bkash_direct', payout_method: 'bkash', active: true, priority: 1 }
  ],
  fee_schedules: [
    { id: 'fs-1', corridor_id: 'GB-BD', version: 1, effective_from: new Date().toISOString(), config: { tier1: 0.005 }, approved_by: 'a0000000-0000-0000-0000-000000000001', status: 'approved', created_at: new Date().toISOString() }
  ],
  scamshield_rules: [
    { id: 'sr-1', rule_key: 'R01_NEW_BENEFICIARY_SPIKE', version: 1, config: { weight: 25, threshold: 50000 }, active: true, updated_by: 'a0000000-0000-0000-0000-000000000001', updated_at: new Date().toISOString() }
  ],
  scamshield_cases: [],
  notifications: initialNotifications,
  notification_preferences: initialNotificationPreferences,
  support_tickets: [],
  staff: staffTable,
  audit_log: []
};

// Private storage bucket simulation: bucket -> path -> { ownerId, data, mimeType }
const privateStorage = {
  'kyc-docs': {}
};

// Active Session tokens (token -> session)
const activeSessions = {};

// Helper: Add immutable audit log entry
function insertAuditLog(actor_id, actor_role, action, entity, entity_id, diff, ip) {
  const entry = {
    id: crypto.randomUUID(),
    actor_id: String(actor_id || 'system'),
    actor_role: String(actor_role || 'system'),
    action: String(action),
    entity: String(entity),
    entity_id: entity_id ? String(entity_id) : null,
    diff: diff || null,
    ip: ip || '127.0.0.1',
    created_at: new Date().toISOString()
  };
  db.audit_log.push(entry);
  return entry;
}

// Helper: Add idempotent notification for a user
function createNotificationForUser(userId, payload) {
  if (!userId || !payload) return null;
  const eventId = payload.event_id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = db.notifications.find(n => n.user_id === userId && n.event_id === eventId);
  if (existing) return existing;

  const item = {
    id: payload.id || ('notif-' + crypto.randomUUID().slice(0, 8)),
    user_id: userId,
    event_id: eventId,
    category: String(payload.category || 'GENERAL').slice(0, 40),
    title: String(payload.title || 'Notification Alert').slice(0, 140),
    message: String(payload.message || '').slice(0, 500),
    time: 'Just now',
    created_at: new Date().toISOString(),
    read_at: null,
    unread: true,
    actionLabel: String(payload.actionLabel || 'View Details').slice(0, 40),
    actionRoute: String(payload.actionRoute || '#/dashboard').slice(0, 120),
    amount: payload.amount ? String(payload.amount).slice(0, 40) : null
  };
  db.notifications.unshift(item);
  return item;
}

// Immutability Guard for audit_log: Reject UPDATE or DELETE
function mutateAuditLog() {
  throw new Error('audit_log is tamper-evident and append-only. Updates and deletes are strictly prohibited.');
}

// Storage Guard: Cross-user read test
function uploadPrivateDoc(bucket, userId, filename, buffer, mimeType) {
  if (bucket !== 'kyc-docs') throw new Error('Invalid bucket');
  const path = `${userId}/${filename}`;
  privateStorage[bucket][path] = {
    ownerId: userId,
    filename: filename,
    data: buffer,
    mimeType: mimeType || 'application/octet-stream',
    uploadedAt: new Date().toISOString()
  };
  return `/storage/v1/object/authenticated/${bucket}/${path}`;
}

function readPrivateDoc(bucket, requestUserId, path, staffRole) {
  const item = privateStorage[bucket] && privateStorage[bucket][path];
  if (!item) return { error: 'Not Found', status: 404 };

  // RLS Rule: Only document owner OR authorized staff ('super_admin', 'compliance', 'operations', 'auditor') may read
  const isAllowedStaff = staffRole && ['super_admin', 'compliance', 'operations', 'auditor'].includes(staffRole);
  if (item.ownerId !== requestUserId && !isAllowedStaff) {
    return { error: 'Forbidden: Cross-user access denied by RLS policy', status: 403 };
  }
  return { ok: true, item: item };
}

module.exports = {
  db,
  credentials,
  pendingOtps,
  passwordResetTokens,
  staffLockouts,
  userLockouts,
  rateLimits,
  revokedTokens,
  activeSessions,
  isDemoModeEnabled,
  createDefaultNotificationsForUser,
  defaultPreferencesForUser,
  createNotificationForUser,
  insertAuditLog,
  mutateAuditLog,
  uploadPrivateDoc,
  readPrivateDoc
};

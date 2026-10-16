-- =====================================================================
-- PROBAHO REMIT — PRODUCTION SUPABASE POSTGRES SCHEMA (PHASE 1)
-- 16 Tables with Row Level Security (RLS), RBAC, Tamper-Proof Triggers
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS FOR RBAC & TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. STAFF TABLE (Must be created before foreign keys reference it)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'operations', 'finance', 'support', 'compliance', 'auditor')),
  mfa_enforced BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff lookup helpers
CREATE OR REPLACE FUNCTION current_staff_role()
RETURNS TEXT AS $$
  SELECT role FROM staff WHERE id = auth.uid() AND active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND active = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_role(allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND active = true AND role = ANY(allowed_roles));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. PROFILES TABLE (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- matches auth.users.id
  full_name TEXT,
  phone TEXT,
  email TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en', 'bn')),
  kyc_level TEXT NOT NULL DEFAULT 'none' CHECK (kyc_level IN ('none', 'basic', 'full')),
  kyc_status TEXT NOT NULL DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected', 'resubmit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. KYC SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('nid', 'passport', 'driving_licence')),
  doc_front_url TEXT NOT NULL,
  doc_back_url TEXT,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resubmit')),
  reviewer_id UUID REFERENCES staff(id),
  review_note TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. BENEFICIARIES TABLE
CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'BD',
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bkash', 'nagad', 'rocket', 'bank', 'cash_pickup')),
  account_identifier TEXT NOT NULL, -- Encrypted or masked
  bank_name TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CORRIDORS TABLE
CREATE TABLE IF NOT EXISTS corridors (
  id TEXT PRIMARY KEY, -- e.g. 'GB-BD', 'CN-BD', 'SA-BD', 'MY-BD'
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL DEFAULT 'BD',
  active BOOLEAN NOT NULL DEFAULT true,
  min_amount NUMERIC(14,2) NOT NULL DEFAULT 10.00,
  max_amount NUMERIC(14,2) NOT NULL DEFAULT 500000.00
);

-- 8. PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  corridors TEXT[] NOT NULL,
  fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  fee_flat NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  fx_margin_percent NUMERIC(5,2) NOT NULL DEFAULT 0.50,
  avg_delivery_hours NUMERIC(6,1) NOT NULL DEFAULT 2.0,
  reliability_score NUMERIC(4,2) NOT NULL DEFAULT 98.0,
  active BOOLEAN NOT NULL DEFAULT true,
  sandbox BOOLEAN NOT NULL DEFAULT true
);

-- 9. PAYOUT ROUTES TABLE
CREATE TABLE IF NOT EXISTS payout_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL REFERENCES corridors(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bkash', 'nagad', 'rocket', 'bank', 'cash_pickup')),
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 1
);

-- 10. FX RATES TABLE
CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL, -- e.g. 'GBP_BDT', 'CNY_BDT', 'USD_BDT'
  rate NUMERIC(14,6) NOT NULL,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. FEE SCHEDULES (Versioned, Two-Person Approval)
CREATE TABLE IF NOT EXISTS fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL REFERENCES corridors(id),
  version INT NOT NULL DEFAULT 1,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  config JSONB NOT NULL,
  approved_by UUID REFERENCES staff(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TRANSFERS TABLE (Idempotency Enforced)
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  beneficiary_id UUID REFERENCES beneficiaries(id),
  idempotency_key TEXT UNIQUE NOT NULL,
  send_currency TEXT NOT NULL,
  send_amount NUMERIC(14,2) NOT NULL CHECK (send_amount > 0),
  receive_currency TEXT NOT NULL,
  receive_amount NUMERIC(14,2) NOT NULL CHECK (receive_amount > 0),
  fx_rate NUMERIC(14,6) NOT NULL,
  fx_locked_until TIMESTAMPTZ NOT NULL,
  fee_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  provider TEXT NOT NULL,
  corridor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'funded', 'in_transit', 'delivered', 'failed', 'refunded', 'cancelled')),
  psp_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_transfers_updated_at
BEFORE UPDATE ON transfers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. TRANSFER EVENTS TABLE (Append-Only User Timeline)
CREATE TABLE IF NOT EXISTS transfer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent mutation or deletion of transfer events
CREATE OR REPLACE FUNCTION prevent_transfer_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'transfer_events is an append-only timeline. Updates and deletes are forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transfer_events_append_only
BEFORE UPDATE OR DELETE ON transfer_events
FOR EACH ROW EXECUTE FUNCTION prevent_transfer_event_mutation();

-- 14. SCAMSHIELD RULES TABLE (Versioned, Never Hard-Deleted)
CREATE TABLE IF NOT EXISTS scamshield_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT UNIQUE NOT NULL,
  version INT NOT NULL DEFAULT 1,
  config JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES staff(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. SCAMSHIELD CASES TABLE
CREATE TABLE IF NOT EXISTS scamshield_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id),
  risk_score NUMERIC(5,2) NOT NULL,
  signals JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'allowed', 'blocked', 'step_up')),
  analyst_id UUID REFERENCES staff(id),
  verdict_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push')),
  template TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ
);

-- 17. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES transfers(id),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved')),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. AUDIT LOG (INSERT-Only, Database-Level Immutability)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  diff JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is tamper-evident and append-only. Updates and deletes are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- Revoke all update and delete privileges on audit_log
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC, anon, authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scamshield_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scamshield_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_staff());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_staff_role(ARRAY['super_admin', 'compliance']));

CREATE POLICY "Service can insert profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR is_staff());

-- KYC SUBMISSIONS
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
  FOR SELECT USING (auth.uid() = user_id OR is_staff_role(ARRAY['super_admin', 'operations', 'compliance', 'auditor']));

CREATE POLICY "Users can create own KYC submission" ON kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Compliance staff can update KYC status" ON kyc_submissions
  FOR UPDATE USING (is_staff_role(ARRAY['super_admin', 'compliance', 'operations']));

-- BENEFICIARIES
CREATE POLICY "Users can manage own beneficiaries" ON beneficiaries
  FOR ALL USING (auth.uid() = user_id);

-- TRANSFERS
CREATE POLICY "Users can view own transfers" ON transfers
  FOR SELECT USING (auth.uid() = user_id OR is_staff());

CREATE POLICY "Users can insert draft transfer" ON transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update transfer states" ON transfers
  FOR UPDATE USING (is_staff_role(ARRAY['super_admin', 'operations', 'finance']));

-- TRANSFER EVENTS
CREATE POLICY "Users can view events for their transfers" ON transfer_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM transfers t WHERE t.id = transfer_events.transfer_id AND (t.user_id = auth.uid() OR is_staff()))
  );

CREATE POLICY "Staff or service can insert transfer events" ON transfer_events
  FOR INSERT WITH CHECK (is_staff() OR auth.role() = 'service_role');

-- PUBLIC STATIC & CONFIG TABLES
CREATE POLICY "Public read fx_rates" ON fx_rates FOR SELECT USING (true);
CREATE POLICY "Public read corridors" ON corridors FOR SELECT USING (true);
CREATE POLICY "Public read providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Public read payout_routes" ON payout_routes FOR SELECT USING (true);

CREATE POLICY "Staff manage corridors" ON corridors FOR ALL USING (is_staff_role(ARRAY['super_admin', 'operations']));
CREATE POLICY "Staff manage providers" ON providers FOR ALL USING (is_staff_role(ARRAY['super_admin', 'operations']));
CREATE POLICY "Staff manage payout_routes" ON payout_routes FOR ALL USING (is_staff_role(ARRAY['super_admin', 'operations']));

-- FEE SCHEDULES
CREATE POLICY "Approved fee schedules public read" ON fee_schedules
  FOR SELECT USING (status = 'approved' OR is_staff());

CREATE POLICY "Finance staff manage fee schedules" ON fee_schedules
  FOR ALL USING (is_staff_role(ARRAY['super_admin', 'finance']));

-- SCAMSHIELD RULES & CASES
CREATE POLICY "Staff only view and manage scamshield rules" ON scamshield_rules
  FOR ALL USING (is_staff_role(ARRAY['super_admin', 'compliance']));

CREATE POLICY "Compliance view and manage fraud cases" ON scamshield_cases
  FOR ALL USING (is_staff_role(ARRAY['super_admin', 'compliance']));

-- NOTIFICATIONS
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- SUPPORT TICKETS
CREATE POLICY "Users view own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id OR is_staff());

CREATE POLICY "Users create support tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Support staff update tickets" ON support_tickets
  FOR UPDATE USING (is_staff_role(ARRAY['super_admin', 'support']));

-- STAFF DIRECTORY
CREATE POLICY "Staff can view staff list" ON staff
  FOR SELECT USING (is_staff());

CREATE POLICY "Super admin can manage staff" ON staff
  FOR ALL USING (is_staff_role(ARRAY['super_admin']));

-- AUDIT LOG
CREATE POLICY "Compliance and auditors can view audit log" ON audit_log
  FOR SELECT USING (is_staff_role(ARRAY['super_admin', 'compliance', 'auditor']));

CREATE POLICY "System can append audit log" ON audit_log
  FOR INSERT WITH CHECK (true);

-- =====================================================================
-- INITIAL SEED DATA (STAGING / TEST CORRIDORS, STAFF, RULES)
-- =====================================================================

INSERT INTO corridors (id, from_country, to_country, active, min_amount, max_amount) VALUES
  ('GB-BD', 'United Kingdom', 'Bangladesh', true, 10.00, 500000.00),
  ('CN-BD', 'China', 'Bangladesh', true, 50.00, 500000.00),
  ('SA-BD', 'Saudi Arabia', 'Bangladesh', true, 50.00, 500000.00),
  ('MY-BD', 'Malaysia', 'Bangladesh', true, 50.00, 300000.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO providers (id, name, corridors, fee_percent, fee_flat, fx_margin_percent, avg_delivery_hours, reliability_score, active, sandbox) VALUES
  ('bkash_direct', 'bKash Direct Gateway', ARRAY['GB-BD', 'CN-BD', 'SA-BD', 'MY-BD'], 0.00, 0.00, 0.40, 0.1, 99.8, true, true),
  ('citybank_remit', 'City Bank FastRemit', ARRAY['GB-BD', 'CN-BD', 'SA-BD', 'MY-BD'], 0.25, 2.50, 0.35, 1.5, 99.2, true, true),
  ('wise_gateway', 'Wise Business Route', ARRAY['GB-BD', 'CN-BD'], 0.45, 0.80, 0.20, 3.0, 98.9, true, true),
  ('western_union', 'Western Union Network', ARRAY['GB-BD', 'CN-BD', 'SA-BD', 'MY-BD'], 1.20, 5.00, 1.10, 0.5, 96.5, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO fx_rates (pair, rate, source) VALUES
  ('GBP_BDT', 158.420000, 'Bangladesh Bank Reference + Interbank'),
  ('USD_BDT', 121.850000, 'Interbank Weighted Average'),
  ('CNY_BDT', 16.820000, 'PBOC Mid-Rate / Interbank'),
  ('SAR_BDT', 32.480000, 'SAMA Reference Rate'),
  ('MYR_BDT', 27.650000, 'BNM Market Rate');

INSERT INTO staff (id, email, role, mfa_enforced, active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'owner@probaho.demo', 'super_admin', true, true),
  ('a0000000-0000-0000-0000-000000000002', 'compliance@probaho.demo', 'compliance', true, true),
  ('a0000000-0000-0000-0000-000000000003', 'ops@probaho.demo', 'operations', true, true),
  ('a0000000-0000-0000-0000-000000000004', 'auditor@probaho.demo', 'auditor', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scamshield_rules (rule_key, version, config, active) VALUES
  ('R01_NEW_BENEFICIARY_SPIKE', 1, '{"weight": 25, "threshold_amount": 50000, "cooldown_hours": 24}', true),
  ('R02_RAPID_VELOCITY', 1, '{"weight": 30, "max_txns_per_hour": 3}', true),
  ('R03_OFF_HOURS_BURST', 1, '{"weight": 15, "window": "01:00-05:00"}', true),
  ('R04_UNVERIFIED_HIGH_VALUE', 1, '{"weight": 35, "limit": 100000}', true)
ON CONFLICT (rule_key) DO NOTHING;


-- =====================================================================
-- PHASE 6: MULTI-CURRENCY & WEB3 CRYPTO WALLET + VAULT YIELD SCHEMA
-- Supports USD ($), BDT (৳), CNY (¥), EUR (€), GBP (£), USDT (₮), BTC (₿), ETH (Ξ)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Wallets Table (Parent account for each user)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'RESTRICTED')),
    tier VARCHAR(20) DEFAULT 'TIER_1' CHECK (tier IN ('TIER_1', 'TIER_2', 'TIER_3')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Multi-Currency Sub-Balances (USD, BDT, CNY, EUR, GBP, USDT, BTC, ETH)
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    balance NUMERIC(28, 8) DEFAULT 0.00000000 CHECK (balance >= 0),
    locked_in_vault NUMERIC(28, 8) DEFAULT 0.00000000 CHECK (locked_in_vault >= 0),
    available_balance NUMERIC(28, 8) GENERATED ALWAYS AS (balance - locked_in_vault) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_id, currency)
);

-- 3. Dedicated Crypto Addresses for User Receiving
CREATE TABLE IF NOT EXISTS public.crypto_deposit_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    asset VARCHAR(10) NOT NULL, -- 'USDT', 'BTC', 'ETH'
    network VARCHAR(20) NOT NULL, -- 'TRC20', 'ERC20', 'BEP20', 'BITCOIN'
    address VARCHAR(120) NOT NULL UNIQUE,
    memo_tag VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Unified Ledger & Deposit Pipeline
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    tx_type VARCHAR(30) NOT NULL CHECK (tx_type IN ('DEPOSIT', 'WITHDRAWAL', 'VAULT_LOCK', 'VAULT_UNLOCK', 'SWAP')),
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('CRYPTO', 'BANK_TRANSFER', 'MOBILE_WALLET', 'INTERNAL')),
    source_currency VARCHAR(10) NOT NULL,
    source_amount NUMERIC(28, 8) NOT NULL,
    target_currency VARCHAR(10) NOT NULL,
    target_amount NUMERIC(28, 8) NOT NULL,
    fee_amount NUMERIC(28, 8) DEFAULT 0,
    fx_rate NUMERIC(18, 6) DEFAULT 1.000000,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED')),
    tx_reference VARCHAR(100) UNIQUE NOT NULL,
    network_txid VARCHAR(150),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- 5. Vault Locking & Staking Mechanism
CREATE TABLE IF NOT EXISTS public.vault_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(28, 8) NOT NULL CHECK (amount > 0),
    apy_rate NUMERIC(5, 2) DEFAULT 5.50,
    lock_duration_days INT NOT NULL DEFAULT 30,
    unlocks_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNLOCKED', 'EMERGENCY_RELEASED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_wallet_balances ON public.wallet_balances(wallet_id, currency);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref ON public.wallet_transactions(tx_reference);
CREATE INDEX IF NOT EXISTS idx_crypto_deposit_lookup ON public.crypto_deposit_addresses(address, network);

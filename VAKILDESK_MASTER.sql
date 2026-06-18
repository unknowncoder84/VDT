-- ================================================
-- VAKILDESK_MASTER.sql
-- ================================================
-- This is the ONE AND ONLY SQL file for VakilDesk.
-- Run it on a CLEAN Supabase project.
--
-- Before running, open SQL Editor and run:
--   DROP SCHEMA public CASCADE;
--   CREATE SCHEMA public;
--   GRANT ALL ON SCHEMA public TO postgres;
--   GRANT ALL ON SCHEMA public TO anon;
--   GRANT ALL ON SCHEMA public TO authenticated;
--   GRANT ALL ON SCHEMA public TO service_role;
--
-- Then paste this entire file and click Run.
-- Zero errors expected.
--
-- Contains:
--   26 tables, 10 RPCs, full RLS,
--   seed data (27 courts, 20 case types, 36 districts)
-- ================================================


-- ─────────────────────────────────────────────
-- BLOCK 1 — Schema-level grants (run first)
-- ─────────────────────────────────────────────
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;


-- ─────────────────────────────────────────────
-- BLOCK 2 — Extension
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────
-- BLOCK 3 — updated_at trigger function
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────
-- BLOCK 4 — Tables (dependency order)
-- ─────────────────────────────────────────────

-- 4.01 tenants
CREATE TABLE public.tenants (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_name            VARCHAR(255) NOT NULL,
  owner_name           VARCHAR(255) NOT NULL,
  owner_email          VARCHAR(255) NOT NULL UNIQUE,
  owner_mobile         VARCHAR(20),
  bar_council_no       VARCHAR(100),
  city                 VARCHAR(100),
  state                VARCHAR(100),
  plan                 VARCHAR(20)  DEFAULT 'trial'
    CHECK (plan IN ('trial','basic','pro','advanced','enterprise','custom')),
  subscription_status  VARCHAR(20)  DEFAULT 'active'
    CHECK (subscription_status IN ('active','expired','cancelled','paused')),
  trial_ends_at        TIMESTAMPTZ  DEFAULT NOW() + INTERVAL '14 days',
  subscription_ends_at TIMESTAMPTZ,
  max_users            INTEGER      DEFAULT 3,
  max_cases            INTEGER      DEFAULT 200,
  created_at           TIMESTAMPTZ  DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  DEFAULT NOW()
);
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.02 tenant_branding
CREATE TABLE public.tenant_branding (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  firm_display_name VARCHAR(255),
  primary_color     VARCHAR(20)  DEFAULT '#f97316',
  white_label_active BOOLEAN     DEFAULT false,
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);
CREATE TRIGGER trg_branding_updated_at
  BEFORE UPDATE ON public.tenant_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.03 tenant_addons
CREATE TABLE public.tenant_addons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  addon        VARCHAR(50) NOT NULL
    CHECK (addon IN (
      'whatsapp_reminders','telegram_reminders','gmail_reminders',
      'ai_summarizer','client_portal','advanced_reports'
    )),
  is_active    BOOLEAN     DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, addon)
);

-- 4.04 user_accounts
CREATE TABLE public.user_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  email         VARCHAR(255),
  role          VARCHAR(20)  DEFAULT 'user'
    CHECK (role IN ('admin','user','manager')),
  is_active     BOOLEAN      DEFAULT true,
  created_by    UUID,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(tenant_id, username)
);
CREATE TRIGGER trg_ua_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_ua_tenant_id ON public.user_accounts(tenant_id);
CREATE INDEX idx_ua_username   ON public.user_accounts(username);

-- 4.05 profiles
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  username   VARCHAR(100),
  role       VARCHAR(20),
  avatar     TEXT,
  is_active  BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);

-- 4.06 courts (shared lookup)
CREATE TABLE public.courts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.07 case_types (shared lookup)
CREATE TABLE public.case_types (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.08 districts (shared lookup)
CREATE TABLE public.districts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.09 cases
CREATE TABLE public.cases (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name        VARCHAR(255) NOT NULL,
  client_email       VARCHAR(255),
  client_mobile      VARCHAR(20),
  client_alternate_no VARCHAR(20),
  file_no            VARCHAR(100) NOT NULL,
  stamp_no           VARCHAR(100),
  reg_no             VARCHAR(100),
  parties_name       TEXT,
  district           VARCHAR(100),
  case_type          VARCHAR(100),
  court              VARCHAR(255),
  on_behalf_of       VARCHAR(255),
  no_resp            VARCHAR(100),
  opponent_lawyer    VARCHAR(255),
  additional_details TEXT,
  fees_quoted        DECIMAL(12,2) DEFAULT 0,
  status             VARCHAR(20)  DEFAULT 'pending'
    CHECK (status IN ('pending','active','closed','on-hold')),
  stage              VARCHAR(30)  DEFAULT 'consultation'
    CHECK (stage IN ('consultation','drafting','filing','circulation','notice',
                     'pre-admission','admitted','final-hearing','reserved','disposed')),
  next_date          DATE,
  filing_date        DATE,
  circulation_status VARCHAR(20)  DEFAULT 'non-circulated'
    CHECK (circulation_status IN ('circulated','non-circulated')),
  circulation_date   DATE,
  interim_relief     VARCHAR(20)  DEFAULT 'none'
    CHECK (interim_relief IN ('favor','against','none')),
  interim_date       DATE,
  granted_date       DATE,
  assigned_to        UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  assigned_to_name   VARCHAR(255),
  created_by         UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_cases_tenant_id   ON public.cases(tenant_id);
CREATE INDEX idx_cases_status      ON public.cases(status);
CREATE INDEX idx_cases_next_date   ON public.cases(next_date);
CREATE INDEX idx_cases_client_name ON public.cases(client_name);
CREATE INDEX idx_cases_file_no     ON public.cases(file_no);

-- 4.10 counsel
CREATE TABLE public.counsel (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  mobile      VARCHAR(20),
  address     TEXT,
  details     TEXT,
  total_cases INTEGER     DEFAULT 0,
  created_by  UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_counsel_updated_at
  BEFORE UPDATE ON public.counsel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_counsel_tenant_id ON public.counsel(tenant_id);

-- 4.11 counsel_cases
CREATE TABLE public.counsel_cases (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counsel_id UUID REFERENCES public.counsel(id) ON DELETE CASCADE,
  case_id    UUID REFERENCES public.cases(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counsel_id, case_id)
);
CREATE INDEX idx_cc_tenant_id  ON public.counsel_cases(tenant_id);
CREATE INDEX idx_cc_counsel_id ON public.counsel_cases(counsel_id);
CREATE INDEX idx_cc_case_id    ON public.counsel_cases(case_id);

-- 4.12 appointments
CREATE TABLE public.appointments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  time       VARCHAR(20),
  user_id    UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  user_name  VARCHAR(255),
  client     VARCHAR(255) NOT NULL,
  details    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_appt_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_appt_tenant_id ON public.appointments(tenant_id);
CREATE INDEX idx_appt_date      ON public.appointments(date);

-- 4.13 transactions
CREATE TABLE public.transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id      UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  amount       DECIMAL(12,2) NOT NULL,
  status       VARCHAR(20)   DEFAULT 'pending'
    CHECK (status IN ('received','pending')),
  payment_mode VARCHAR(30)   DEFAULT 'cash'
    CHECK (payment_mode IN ('upi','cash','check','bank-transfer','card','other')),
  received_by  VARCHAR(255),
  confirmed_by VARCHAR(255),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trans_tenant_id ON public.transactions(tenant_id);
CREATE INDEX idx_trans_case_id   ON public.transactions(case_id);

-- 4.14 case_payments
CREATE TABLE public.case_payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id      UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  amount       DECIMAL(12,2) NOT NULL,
  date         DATE          NOT NULL DEFAULT CURRENT_DATE,
  received_by  VARCHAR(255),
  payment_mode VARCHAR(50)   DEFAULT 'cash',
  reference_id VARCHAR(255),
  tds          DECIMAL(12,2) DEFAULT 0,
  is_accepted  BOOLEAN       DEFAULT false,
  accepted_by  VARCHAR(255),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cp_tenant_id ON public.case_payments(tenant_id);
CREATE INDEX idx_cp_case_id   ON public.case_payments(case_id);

-- 4.15 case_timeline
CREATE TABLE public.case_timeline (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id          UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  event_date       TIMESTAMPTZ  DEFAULT NOW(),
  created_by       UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  created_by_name  VARCHAR(255),
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);
CREATE TRIGGER trg_ct_updated_at
  BEFORE UPDATE ON public.case_timeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_ct_tenant_id ON public.case_timeline(tenant_id);
CREATE INDEX idx_ct_case_id   ON public.case_timeline(case_id);

-- 4.16 case_files
CREATE TABLE public.case_files (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id          UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name        VARCHAR(255) NOT NULL,
  title            VARCHAR(255),
  file_url         TEXT,
  storage_path     TEXT,
  external_url     TEXT,
  file_type        VARCHAR(100),
  mime_type        VARCHAR(100),
  file_size        INTEGER,
  attached_by      VARCHAR(255),
  uploaded_by      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  uploaded_by_name VARCHAR(255),
  dropbox_path     TEXT,
  dropbox_id       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cf_tenant_id ON public.case_files(tenant_id);
CREATE INDEX idx_cf_case_id   ON public.case_files(case_id);

-- 4.17 tasks
CREATE TABLE public.tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type             VARCHAR(20) DEFAULT 'custom'
    CHECK (type IN ('case','custom')),
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  assigned_to      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  assigned_by      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  assigned_by_name VARCHAR(255),
  case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  case_name        VARCHAR(255),
  deadline         TIMESTAMPTZ,
  status           VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','completed')),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_tasks_tenant_id  ON public.tasks(tenant_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status     ON public.tasks(status);
CREATE INDEX idx_tasks_case_id    ON public.tasks(case_id);

-- 4.18 attendance
CREATE TABLE public.attendance (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  user_name      VARCHAR(255),
  date           DATE NOT NULL,
  status         VARCHAR(20) DEFAULT 'present'
    CHECK (status IN ('present','absent')),
  marked_by      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  marked_by_name VARCHAR(255),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, date)
);
CREATE TRIGGER trg_att_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_att_tenant_id ON public.attendance(tenant_id);
CREATE INDEX idx_att_user_id   ON public.attendance(user_id);
CREATE INDEX idx_att_date      ON public.attendance(date);

-- 4.19 expenses
CREATE TABLE public.expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount        DECIMAL(12,2) NOT NULL,
  description   TEXT,
  added_by      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  added_by_name VARCHAR(255),
  month         VARCHAR(7) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_exp_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_exp_tenant_id ON public.expenses(tenant_id);
CREATE INDEX idx_exp_month     ON public.expenses(month);

-- 4.20 notifications
CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  type            VARCHAR(50)  DEFAULT 'info',
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  icon            VARCHAR(10)  DEFAULT '🔔',
  related_id      UUID,
  is_read         BOOLEAN      DEFAULT false,
  created_by      UUID,
  created_by_name VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_tenant_id ON public.notifications(tenant_id);
CREATE INDEX idx_notif_user_id   ON public.notifications(user_id);
CREATE INDEX idx_notif_is_read   ON public.notifications(is_read);

-- 4.21 library_locations
CREATE TABLE public.library_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        VARCHAR(20)  NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_lib_loc_tenant ON public.library_locations(tenant_id);

-- 4.22 library_items
CREATE TABLE public.library_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  reference_no  VARCHAR(100),
  location      VARCHAR(255),
  location_id   UUID REFERENCES public.library_locations(id) ON DELETE SET NULL,
  notes         TEXT,
  added_by      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  added_by_name VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_library_items_tenant ON public.library_items(tenant_id);

-- 4.23 storage_locations
CREATE TABLE public.storage_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        VARCHAR(20)  NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_stor_loc_tenant ON public.storage_locations(tenant_id);

-- 4.24 storage_items
CREATE TABLE public.storage_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  item_type     VARCHAR(50)  DEFAULT 'File',
  location      VARCHAR(255),
  location_id   UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  rack_no       VARCHAR(100),
  notes         TEXT,
  added_by      UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  added_by_name VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_storage_items_tenant ON public.storage_items(tenant_id);

-- 4.25 email_settings
CREATE TABLE public.email_settings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  firm_name               VARCHAR(255),
  reminders_active        BOOLEAN DEFAULT true,
  reminder_email_override VARCHAR(255),
  smtp_email              VARCHAR(255),
  smtp_app_password       VARCHAR(255),
  setup_complete          BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.26 email_logs
CREATE TABLE public.email_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id       UUID REFERENCES public.cases(id)   ON DELETE SET NULL,
  client_name   VARCHAR(255),
  sent_to       VARCHAR(255),
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  status        VARCHAR(20) DEFAULT 'sent'
    CHECK (status IN ('sent','failed')),
  reminder_type VARCHAR(20) DEFAULT '3_days'
    CHECK (reminder_type IN ('1_day','3_days','test','manual')),
  error_message TEXT
);
CREATE INDEX idx_email_logs_tenant  ON public.email_logs(tenant_id);
CREATE INDEX idx_email_logs_case    ON public.email_logs(case_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);


-- ─────────────────────────────────────────────
-- BLOCK 5 — Enable RLS on all tables
-- Open policies — tenant isolation is enforced
-- in application queries via tenant_id filters.
-- ─────────────────────────────────────────────
ALTER TABLE public.tenants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_addons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counsel           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counsel_cases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_tenants"           ON public.tenants           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_branding"          ON public.tenant_branding   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_addons"            ON public.tenant_addons     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_user_accounts"     ON public.user_accounts     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_profiles"          ON public.profiles          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_courts"            ON public.courts            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_case_types"        ON public.case_types        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_districts"         ON public.districts         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_cases"             ON public.cases             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_counsel"           ON public.counsel           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_counsel_cases"     ON public.counsel_cases     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_appointments"      ON public.appointments      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_transactions"      ON public.transactions      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_case_payments"     ON public.case_payments     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_case_timeline"     ON public.case_timeline     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_case_files"        ON public.case_files        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_tasks"             ON public.tasks             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_attendance"        ON public.attendance        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_expenses"          ON public.expenses          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_notifications"     ON public.notifications     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_library_locations" ON public.library_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_library_items"     ON public.library_items     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_storage_locations" ON public.storage_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_storage_items"     ON public.storage_items     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_email_settings"    ON public.email_settings    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_email_logs"        ON public.email_logs        FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────
-- BLOCK 6 — Table-level grants
-- ─────────────────────────────────────────────
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;


-- ─────────────────────────────────────────────
-- BLOCK 7 — RPCs
-- ─────────────────────────────────────────────

-- RPC 1: authenticate_user
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username VARCHAR,
  p_password VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_user   public.user_accounts%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM public.user_accounts
  WHERE username = p_username
    AND password_hash = p_password
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error_message', 'Invalid username or password');
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = v_user.tenant_id;

  RETURN json_build_object(
    'success',             true,
    'user_id',             v_user.id,
    'username',            v_user.username,
    'name',                COALESCE(v_user.name, v_user.username),
    'email',               COALESCE(v_user.email, ''),
    'role',                v_user.role,
    'is_active',           v_user.is_active,
    'tenant_id',           v_user.tenant_id,
    'tenant_plan',         COALESCE(v_tenant.plan, 'trial'),
    'trial_ends_at',       v_tenant.trial_ends_at,
    'subscription_status', COALESCE(v_tenant.subscription_status, 'active')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: get_all_users
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS JSON AS $$
DECLARE v_result JSON;
BEGIN
  SELECT json_agg(json_build_object(
    'id',         u.id,
    'username',   u.username,
    'name',       COALESCE(u.name, u.username),
    'email',      COALESCE(u.email, ''),
    'role',       u.role,
    'is_active',  u.is_active,
    'tenant_id',  u.tenant_id,
    'created_at', u.created_at,
    'updated_at', u.updated_at
  )) INTO v_result FROM public.user_accounts u;
  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: create_user_account
CREATE OR REPLACE FUNCTION create_user_account(
  p_name       VARCHAR,
  p_email      VARCHAR,
  p_username   VARCHAR,
  p_password   VARCHAR,
  p_role       VARCHAR,
  p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user_id   UUID;
  v_tenant_id UUID;
BEGIN
  IF p_created_by IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant_id FROM public.user_accounts WHERE id = p_created_by;
  END IF;
  IF v_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error_message', 'Could not determine tenant.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_accounts WHERE username = p_username AND tenant_id = v_tenant_id) THEN
    RETURN json_build_object('success', false, 'error_message', 'Username already taken');
  END IF;
  INSERT INTO public.user_accounts(tenant_id, username, password_hash, name, email, role, is_active, created_by)
  VALUES (v_tenant_id, p_username, p_password, p_name, p_email, p_role, true, p_created_by)
  RETURNING id INTO v_user_id;
  INSERT INTO public.profiles(id, tenant_id, name, email, username, role, is_active)
  VALUES (v_user_id, v_tenant_id, p_name, p_email, p_username, p_role, true)
  ON CONFLICT (id) DO NOTHING;
  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: update_user_role
CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id    UUID,
  p_new_role   VARCHAR,
  p_updated_by UUID DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  UPDATE public.user_accounts SET role = p_new_role, updated_at = NOW() WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error_message', 'User not found'); END IF;
  UPDATE public.profiles SET role = p_new_role, updated_at = NOW() WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 5: toggle_user_status
CREATE OR REPLACE FUNCTION toggle_user_status(
  p_user_id    UUID,
  p_updated_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE v_new_status BOOLEAN;
BEGIN
  UPDATE public.user_accounts SET is_active = NOT is_active, updated_at = NOW()
  WHERE id = p_user_id RETURNING is_active INTO v_new_status;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error_message', 'User not found'); END IF;
  RETURN json_build_object('success', true, 'new_status', v_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 6: delete_user_account
CREATE OR REPLACE FUNCTION delete_user_account(
  p_user_id    UUID,
  p_deleted_by UUID DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  DELETE FROM public.profiles      WHERE id = p_user_id;
  DELETE FROM public.user_accounts WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error_message', 'User not found'); END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 7: get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID DEFAULT NULL)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_cases',      (SELECT COUNT(*) FROM public.cases   WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
    'active_cases',     (SELECT COUNT(*) FROM public.cases   WHERE status = 'active'  AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
    'pending_cases',    (SELECT COUNT(*) FROM public.cases   WHERE status = 'pending' AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
    'upcoming_hearings',(SELECT COUNT(*) FROM public.cases   WHERE next_date >= CURRENT_DATE AND next_date <= CURRENT_DATE + INTERVAL '7 days' AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
    'total_counsel',    (SELECT COUNT(*) FROM public.counsel WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
    'pending_tasks',    (SELECT COUNT(*) FROM public.tasks   WHERE status = 'pending' AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 8: create_notification_for_all
CREATE OR REPLACE FUNCTION create_notification_for_all(
  p_type            VARCHAR,
  p_title           VARCHAR,
  p_description     TEXT    DEFAULT NULL,
  p_icon            VARCHAR DEFAULT '🔔',
  p_related_id      UUID    DEFAULT NULL,
  p_created_by      UUID    DEFAULT NULL,
  p_created_by_name VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE v_tenant_id UUID;
BEGIN
  IF p_created_by IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant_id FROM public.user_accounts WHERE id = p_created_by;
  END IF;
  INSERT INTO public.notifications(tenant_id, user_id, type, title, description, icon, related_id, created_by, created_by_name)
  SELECT u.tenant_id, u.id, p_type, p_title, p_description, p_icon, p_related_id, p_created_by, p_created_by_name
  FROM public.user_accounts u
  WHERE (v_tenant_id IS NULL OR u.tenant_id = v_tenant_id);
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 9: mark_notification_read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS JSON AS $$
BEGIN
  UPDATE public.notifications SET is_read = true WHERE id = p_notification_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 10: mark_all_notifications_read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  UPDATE public.notifications SET is_read = true WHERE user_id = p_user_id AND is_read = false;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────
-- BLOCK 8 — Seed data
-- ─────────────────────────────────────────────

-- Courts (27)
INSERT INTO public.courts (name) VALUES
  ('Bombay High Court'),('Delhi High Court'),('Madras High Court'),
  ('Calcutta High Court'),('Allahabad High Court'),('Karnataka High Court'),
  ('Gujarat High Court'),('Rajasthan High Court'),('Punjab & Haryana High Court'),
  ('Thane District Court'),('Mumbai City Civil Court'),('Pune District Court'),
  ('Nashik District Court'),('Nagpur District Court'),('Aurangabad District Court'),
  ('Supreme Court of India'),('NCLT Mumbai'),('NCLT Delhi'),
  ('Consumer Forum'),('Family Court'),('Labour Court'),
  ('RERA'),('DRT'),('Sessions Court'),
  ('Magistrate Court'),('Civil Judge Court'),('Fast Track Court');

-- Case Types (20)
INSERT INTO public.case_types (name) VALUES
  ('Civil'),('Criminal'),('Family'),('Property Dispute'),('Cheque Bounce'),
  ('Motor Accident'),('Consumer'),('Labour / Employment'),('Matrimonial'),
  ('Writ Petition'),('Company / NCLT'),('Revenue'),('Land Acquisition'),
  ('Arbitration'),('RERA'),('Service Matter'),('Constitutional'),
  ('Negotiable Instrument'),('Insolvency'),('Tenancy');

-- Districts (36)
INSERT INTO public.districts (name) VALUES
  ('Thane'),('Mumbai City'),('Mumbai Suburban'),('Pune'),('Nashik'),
  ('Nagpur'),('Aurangabad'),('Kolhapur'),('Solapur'),('Satara'),
  ('Sangli'),('Ratnagiri'),('Sindhudurg'),('Raigad'),('Palghar'),
  ('Nanded'),('Latur'),('Osmanabad'),('Beed'),('Jalna'),
  ('Delhi'),('Bengaluru Urban'),('Chennai'),('Hyderabad'),('Kolkata'),
  ('Ahmedabad'),('Surat'),('Jaipur'),('Lucknow'),('Kanpur'),
  ('Patna'),('Bhopal'),('Indore'),('Chandigarh'),('Guwahati'),
  ('Bhubaneswar');


-- ─────────────────────────────────────────────
-- BLOCK 9 — Email settings: write-only password
-- The browser can SAVE the Gmail app password
-- (via RPC) but can never READ it back. Only the
-- backend service_role can read it to send mail.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION save_email_settings(
  p_tenant_id        UUID,
  p_firm_name        VARCHAR,
  p_reminders_active BOOLEAN,
  p_smtp_email       VARCHAR DEFAULT NULL,
  p_smtp_password    VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_id         UUID;
  v_old_pwd    VARCHAR;
  v_final_pwd  VARCHAR;
  v_final_mail VARCHAR;
  v_complete   BOOLEAN;
BEGIN
  SELECT id, smtp_app_password, smtp_email
    INTO v_id, v_old_pwd, v_final_mail
  FROM public.email_settings
  WHERE tenant_id = p_tenant_id;

  v_final_pwd  := COALESCE(NULLIF(p_smtp_password, ''), v_old_pwd);
  v_final_mail := COALESCE(NULLIF(p_smtp_email, ''), v_final_mail);
  v_complete   := (v_final_mail IS NOT NULL) AND (v_final_pwd IS NOT NULL);

  IF v_id IS NULL THEN
    INSERT INTO public.email_settings
      (tenant_id, firm_name, reminders_active,
       smtp_email, smtp_app_password, setup_complete)
    VALUES
      (p_tenant_id, p_firm_name, p_reminders_active,
       v_final_mail, v_final_pwd, v_complete)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.email_settings SET
      firm_name         = p_firm_name,
      reminders_active  = p_reminders_active,
      smtp_email        = v_final_mail,
      smtp_app_password = v_final_pwd,
      setup_complete    = v_complete,
      updated_at        = NOW()
    WHERE id = v_id;
  END IF;

  RETURN json_build_object(
    'success', true, 'id', v_id, 'setup_complete', v_complete
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lock down the password column (must run AFTER the
-- BLOCK 6 blanket grants so it takes precedence)
REVOKE SELECT, INSERT, UPDATE, DELETE
  ON public.email_settings FROM anon, authenticated;
GRANT SELECT
  (id, tenant_id, firm_name, reminders_active,
   reminder_email_override, smtp_email,
   setup_complete, created_at, updated_at)
  ON public.email_settings TO anon, authenticated;
GRANT ALL ON public.email_settings TO service_role;
GRANT EXECUTE ON FUNCTION save_email_settings TO anon, authenticated, service_role;


-- ─────────────────────────────────────────────
-- BLOCK 10 — Final instructions
-- ─────────────────────────────────────────────
-- VAKILDESK_MASTER.sql complete.
-- 26 tables | 11 RPCs | full RLS | 83 seed rows
-- Gmail app password is write-only (browser cannot
-- read it back; only the backend service key can).
--
-- HOW TO USE:
-- 1. Supabase → SQL Editor → new query (+)
-- 2. Paste this entire file
-- 3. Click Run
-- 4. Confirm zero errors in Results panel
-- 5. Table Editor → verify all 26 tables exist
-- 6. Open VakilDesk → Register Firm → done
-- ─────────────────────────────────────────────

-- ================================================================
-- VAKILDESK: GO_LIVE_SETUP.sql
-- ================================================================
-- Run this ONCE in Supabase → SQL Editor on your EXISTING database.
-- It bundles everything needed to go live:
--   1. Gmail SMTP columns + secure write-only password
--   2. Plan limits that follow the plan automatically
--   3. Case-files storage bucket + upload policies
-- Fully idempotent — safe to run more than once.
--
-- (For a brand-new empty project, run VAKILDESK_MASTER.sql first,
--  then this file.)
-- ================================================================


-- ////////////////////////////////////////////////////////////////
-- PART 1 — GMAIL EMAIL SETTINGS (write-only password)
-- ////////////////////////////////////////////////////////////////

ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS smtp_email        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS smtp_app_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS setup_complete    BOOLEAN DEFAULT false;

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

  RETURN json_build_object('success', true, 'id', v_id, 'setup_complete', v_complete);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE SELECT, INSERT, UPDATE, DELETE
  ON public.email_settings FROM anon, authenticated;
GRANT SELECT
  (id, tenant_id, firm_name, reminders_active,
   reminder_email_override, smtp_email,
   setup_complete, created_at, updated_at)
  ON public.email_settings TO anon, authenticated;
GRANT ALL ON public.email_settings TO service_role;
GRANT EXECUTE ON FUNCTION save_email_settings TO anon, authenticated, service_role;


-- ////////////////////////////////////////////////////////////////
-- PART 2 — PLAN LIMITS (auto-follow the plan)
-- ////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION apply_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.max_users := 3;      NEW.max_cases := 200;
  ELSIF NEW.plan = 'basic' THEN
    NEW.max_users := 3;      NEW.max_cases := 500;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_users := 8;      NEW.max_cases := 1000;
  ELSIF NEW.plan = 'advanced' THEN
    NEW.max_users := 15;     NEW.max_cases := 999999;
  ELSIF NEW.plan = 'custom' THEN
    NEW.max_users := 999999; NEW.max_cases := 999999;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_plan_limits ON public.tenants;
CREATE TRIGGER trg_apply_plan_limits
  BEFORE INSERT OR UPDATE OF plan ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION apply_plan_limits();

UPDATE public.tenants SET max_users = 3,      max_cases = 200    WHERE plan = 'trial';
UPDATE public.tenants SET max_users = 3,      max_cases = 500    WHERE plan = 'basic';
UPDATE public.tenants SET max_users = 8,      max_cases = 1000   WHERE plan = 'pro';
UPDATE public.tenants SET max_users = 15,     max_cases = 999999 WHERE plan = 'advanced';
UPDATE public.tenants SET max_users = 999999, max_cases = 999999 WHERE plan = 'custom';


-- ////////////////////////////////////////////////////////////////
-- PART 3 — CASE FILES STORAGE BUCKET + POLICIES
-- ////////////////////////////////////////////////////////////////

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('case-files', 'case-files', true, 52428800)
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 52428800;

DROP POLICY IF EXISTS "case_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "case_files_select" ON storage.objects;
DROP POLICY IF EXISTS "case_files_update" ON storage.objects;
DROP POLICY IF EXISTS "case_files_delete" ON storage.objects;

CREATE POLICY "case_files_insert" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'case-files');
CREATE POLICY "case_files_select" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'case-files');
CREATE POLICY "case_files_update" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'case-files') WITH CHECK (bucket_id = 'case-files');
CREATE POLICY "case_files_delete" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'case-files');


-- ================================================================
-- DONE. Your database is ready for go-live.
-- Next: deploy the send-reminder Edge Function and the website.
-- See DEPLOYMENT.md for the exact steps.
-- ================================================================

-- ============================================
-- VAKILDESK: EMAIL_SETUP.sql
-- Run in Supabase SQL Editor (new + tab)
-- Adds Gmail SMTP support + secures the
-- app password so the browser can WRITE it
-- but can never READ it back.
-- Safe to run multiple times.
-- ============================================

-- Step 1: Add SMTP columns to email_settings
ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS smtp_email        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS smtp_app_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS setup_complete    BOOLEAN DEFAULT false;

-- Step 2: Write-through RPC (SECURITY DEFINER)
-- The frontend calls this to save settings.
-- If no password is passed, the existing one
-- is kept (so editing firm name / toggle does
-- not wipe the saved password).
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

  -- Keep existing password / email if a blank is sent
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
    'success', true,
    'id', v_id,
    'setup_complete', v_complete
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Lock down the password column.
-- Remove blanket table access, then grant SELECT
-- on every column EXCEPT smtp_app_password.
-- All writes go through the RPC above.
REVOKE SELECT, INSERT, UPDATE, DELETE
  ON public.email_settings FROM anon, authenticated;

GRANT SELECT
  (id, tenant_id, firm_name, reminders_active,
   reminder_email_override, smtp_email,
   setup_complete, created_at, updated_at)
  ON public.email_settings TO anon, authenticated;

-- service_role (backend Python script) keeps full access
GRANT ALL ON public.email_settings TO service_role;

-- Allow the frontend to call the write RPC
GRANT EXECUTE ON FUNCTION save_email_settings TO anon, authenticated, service_role;

-- ============================================
-- Done.
-- • Browser can save Gmail + password (via RPC)
-- • Browser can read everything EXCEPT the password
-- • Only the backend service_role can read the
--   password to actually send emails
-- ============================================

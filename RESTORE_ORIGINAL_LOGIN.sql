-- ============================================
-- VAKILDESK: RESTORE_ORIGINAL_LOGIN.sql
-- Puts login back to the ORIGINAL simple system:
--   * passwords stored/visible as plain text (as before)
--   * login = plain username + password match
--   * removes all the hashing that broke login
--
-- Run the WHOLE file ONCE in Supabase SQL Editor.
--
-- After running, log in with:  any username  +  password: admin123
-- Then change each password from inside the app (Admin Panel).
-- (Original passwords can't be shown again because they were
--  hashed — hashing is one-way — so we set a known one.)
-- ============================================

-- 1. Remove the auto-hash trigger and its function
DROP TRIGGER IF EXISTS trg_hash_user_password ON public.user_accounts;
DROP FUNCTION IF EXISTS hash_user_password();

-- 2. Restore the original plain-text login function
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username VARCHAR,
  p_password VARCHAR
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  IF v_user.id IS NULL THEN
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
$$;

-- 3. Activate every account
UPDATE public.user_accounts SET is_active = true;

-- 4. Reset all passwords to a known, readable value so you can log in.
--    (You can change these per-user afterwards.)
UPDATE public.user_accounts SET password_hash = 'admin123';

-- ============================================
-- DONE. Login: any username + password: admin123
-- Passwords are now plain text again (visible in Supabase),
-- exactly like the original setup.
-- ============================================

-- ============================================
-- VAKILDESK: ENFORCE_USER_LIMIT.sql
-- Adds a server-side guard so a firm can never
-- exceed its plan's user limit — even if the
-- frontend check is bypassed.
--
-- Run in Supabase SQL Editor AFTER PLAN_LIMITS.sql
-- (which sets tenants.max_users per plan).
-- Safe to run multiple times.
-- ============================================

CREATE OR REPLACE FUNCTION create_user_account(
  p_name       VARCHAR,
  p_email      VARCHAR,
  p_username   VARCHAR,
  p_password   VARCHAR,
  p_role       VARCHAR,
  p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user_id     UUID;
  v_tenant_id   UUID;
  v_max_users   INTEGER;
  v_user_count  INTEGER;
BEGIN
  IF p_created_by IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant_id FROM public.user_accounts WHERE id = p_created_by;
  END IF;
  IF v_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error_message', 'Could not determine tenant.');
  END IF;

  -- Enforce the plan's user limit (counts active users only — a locked user
  -- does not consume a seat)
  SELECT COALESCE(max_users, 1) INTO v_max_users FROM public.tenants WHERE id = v_tenant_id;
  SELECT COUNT(*) INTO v_user_count FROM public.user_accounts WHERE tenant_id = v_tenant_id AND is_active = true;
  IF v_user_count >= v_max_users THEN
    RETURN json_build_object(
      'success', false,
      'error_message', 'User limit reached for your plan. Upgrade to add more team members.'
    );
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

-- ============================================
-- Done. The database now rejects new users once
-- a firm hits its plan limit, matching the app.
-- ============================================

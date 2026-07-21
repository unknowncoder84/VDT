-- ============================================
-- VAKILDESK: DOWNGRADE_LOCK_USERS.sql
-- When a firm downgrades to a smaller plan (e.g.
-- Pro -> Basic), any extra team members added on
-- the bigger plan are automatically LOCKED
-- (deactivated) so only the plan's allowed number
-- of users can log in. No data is deleted — the
-- accounts are just deactivated and can be
-- re-activated after upgrading again.
--
-- The firm owner is always kept active, then
-- admins, then the oldest accounts, until the
-- plan's user limit is filled.
--
-- Run AFTER PLAN_LIMITS.sql. Safe to run repeatedly.
-- ============================================

-- 1. Function: lock users beyond the plan's limit for one tenant
CREATE OR REPLACE FUNCTION lock_excess_tenant_users(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_max   INTEGER;
  v_owner VARCHAR;
BEGIN
  SELECT COALESCE(max_users, 1), owner_email
    INTO v_max, v_owner
    FROM public.tenants WHERE id = p_tenant_id;

  -- Deactivate active users ranked beyond the limit.
  -- Keep order: owner first, then admins, then oldest accounts.
  UPDATE public.user_accounts
     SET is_active = false
   WHERE tenant_id = p_tenant_id
     AND is_active = true
     AND id IN (
       SELECT id FROM (
         SELECT id,
                ROW_NUMBER() OVER (
                  ORDER BY (email = v_owner) DESC,
                           (role = 'admin') DESC,
                           created_at ASC
                ) AS rn
         FROM public.user_accounts
         WHERE tenant_id = p_tenant_id
           AND is_active = true
       ) ranked
       WHERE rn > v_max
     );

  -- Keep the profiles table in sync so the UI reflects the locked state
  UPDATE public.profiles p
     SET is_active = ua.is_active
    FROM public.user_accounts ua
   WHERE p.id = ua.id
     AND ua.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger function: fire on plan / limit change
CREATE OR REPLACE FUNCTION trg_lock_excess_users()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM lock_excess_tenant_users(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: runs after the plan or max_users changes.
--    (apply_plan_limits from PLAN_LIMITS.sql runs BEFORE and sets max_users,
--     so by the time this AFTER trigger runs the new limit is in place.)
DROP TRIGGER IF EXISTS trg_lock_excess_users_after ON public.tenants;
CREATE TRIGGER trg_lock_excess_users_after
  AFTER UPDATE OF plan, max_users ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION trg_lock_excess_users();

-- 4. Backfill: lock excess users for every existing tenant right now
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.tenants LOOP
    PERFORM lock_excess_tenant_users(r.id);
  END LOOP;
END $$;

-- ============================================
-- Done. Downgrades now lock extra users automatically.
-- After an upgrade, an admin can re-activate users
-- from the Admin panel (up to the new plan limit).
-- ============================================

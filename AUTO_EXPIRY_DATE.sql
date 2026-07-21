-- ============================================
-- VAKILDESK: AUTO_EXPIRY_DATE.sql
-- Makes a paid plan behave like a mobile plan:
-- the moment a paid plan is active, it gets a
-- validity date (default = 1 month from now) if
-- one isn't already set. When that date passes,
-- the app locks (paywall) until renewed.
--
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================

-- 1. Auto-fill a validity date for paid plans when it's missing.
--    (renew_subscription still sets exact dates and is never overridden,
--     because this only fills when subscription_ends_at IS NULL.)
CREATE OR REPLACE FUNCTION set_default_subscription_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan IS NOT NULL
     AND NEW.plan <> 'trial'
     AND NEW.subscription_ends_at IS NULL THEN
    NEW.subscription_ends_at := NOW() + INTERVAL '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_default_sub_end ON public.tenants;
CREATE TRIGGER trg_default_sub_end
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION set_default_subscription_end();

-- 2. Backfill existing paid firms that have no validity date yet
UPDATE public.tenants
   SET subscription_ends_at = NOW() + INTERVAL '1 month'
 WHERE plan <> 'trial'
   AND subscription_ends_at IS NULL;

-- ============================================
-- Done. The Subscription page's "Active" banner will now show
-- "Valid until <date> · N days left" instead of "No expiry date set".
--
-- For a specific duration (e.g. annual), use renew_subscription:
--   SELECT renew_subscription('TENANT_UUID', 'pro', 12, 19990, 'annual');
-- ============================================

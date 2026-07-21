-- ============================================
-- VAKILDESK: PLAN_LIMITS.sql
-- Run ONCE in Supabase SQL Editor.
-- Makes max_users / max_cases follow the plan
-- automatically, so when you change a firm's
-- plan the limits update too (no manual edit).
-- Numbers match the plans shown on the
-- Subscription page. Safe to run many times.
-- ============================================
--
-- Plan limits:
--   Trial     -> 3 users  / 200 cases   (14-day full-feature test)
--   Basic     -> 1 user   / 200 cases   (individual only)
--   Pro       -> 5 users  / 600 cases
--   Advanced  -> 12 users / unlimited
--   Custom    -> unlimited / unlimited
-- ============================================

-- 1. Function: set limits based on plan
CREATE OR REPLACE FUNCTION apply_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.max_users := 3;      NEW.max_cases := 200;
  ELSIF NEW.plan = 'basic' THEN
    NEW.max_users := 1;      NEW.max_cases := 200;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_users := 5;      NEW.max_cases := 600;
  ELSIF NEW.plan = 'advanced' THEN
    NEW.max_users := 12;     NEW.max_cases := 999999;
  ELSIF NEW.plan = 'custom' THEN
    NEW.max_users := 999999; NEW.max_cases := 999999;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: run on insert and whenever plan changes
DROP TRIGGER IF EXISTS trg_apply_plan_limits ON public.tenants;
CREATE TRIGGER trg_apply_plan_limits
  BEFORE INSERT OR UPDATE OF plan ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION apply_plan_limits();

-- 3. Backfill existing rows to match their current plan
UPDATE public.tenants SET max_users = 3,      max_cases = 200    WHERE plan = 'trial';
UPDATE public.tenants SET max_users = 1,      max_cases = 200    WHERE plan = 'basic';
UPDATE public.tenants SET max_users = 5,      max_cases = 600    WHERE plan = 'pro';
UPDATE public.tenants SET max_users = 12,     max_cases = 999999 WHERE plan = 'advanced';
UPDATE public.tenants SET max_users = 999999, max_cases = 999999 WHERE plan = 'custom';

-- ============================================
-- Done. Changing tenants.plan now automatically
-- sets the correct user/case limits, and the app
-- enforces them (Admin panel blocks adding users
-- once the limit is reached).
--
-- Note on expiry: when a paid plan's
-- subscription_ends_at date passes (or
-- subscription_status is 'expired'/'cancelled'),
-- the app freezes into a read-safe paywall — no
-- data is deleted. Set subscription_ends_at when
-- you activate/renew a paid plan.
-- ============================================

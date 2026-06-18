-- ============================================
-- VAKILDESK: PLAN_LIMITS.sql
-- Run ONCE in Supabase SQL Editor.
-- Makes max_users / max_cases follow the plan
-- automatically, so when you change a firm's
-- plan the limits update too (no manual edit).
-- Safe to run multiple times.
-- ============================================

-- 1. Function: set limits based on plan
CREATE OR REPLACE FUNCTION apply_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.max_users := 3;     NEW.max_cases := 200;
  ELSIF NEW.plan = 'basic' THEN
    NEW.max_users := 3;     NEW.max_cases := 500;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_users := 8;     NEW.max_cases := 1000;
  ELSIF NEW.plan = 'advanced' THEN
    NEW.max_users := 15;    NEW.max_cases := 999999;
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
UPDATE public.tenants SET max_users = 3,      max_cases = 500    WHERE plan = 'basic';
UPDATE public.tenants SET max_users = 8,      max_cases = 1000   WHERE plan = 'pro';
UPDATE public.tenants SET max_users = 15,     max_cases = 999999 WHERE plan = 'advanced';
UPDATE public.tenants SET max_users = 999999, max_cases = 999999 WHERE plan = 'custom';

-- ============================================
-- Done. From now on, changing tenants.plan
-- automatically sets the correct user/case limits.
-- ============================================

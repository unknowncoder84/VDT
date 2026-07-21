-- ============================================
-- VAKILDESK: FILE_LIMITS.sql
-- Adds a per-plan file-upload limit.
--   Basic    -> 200 files
--   Pro      -> 500 files
--   Advanced -> 1000 files
--   Custom   -> unlimited
--   Trial    -> 500 files (full-feature test)
--
-- Run AFTER PLAN_LIMITS.sql. Safe to run repeatedly.
-- ============================================

-- 1. Add the column
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS max_files INTEGER DEFAULT 200;

-- 2. Redefine the plan-limits function to also set max_files
--    (keeps max_users / max_cases exactly as PLAN_LIMITS.sql set them).
CREATE OR REPLACE FUNCTION apply_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.max_users := 3;      NEW.max_cases := 200;    NEW.max_files := 500;
  ELSIF NEW.plan = 'basic' THEN
    NEW.max_users := 1;      NEW.max_cases := 200;    NEW.max_files := 200;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_users := 5;      NEW.max_cases := 600;    NEW.max_files := 500;
  ELSIF NEW.plan = 'advanced' THEN
    NEW.max_users := 12;     NEW.max_cases := 999999; NEW.max_files := 1000;
  ELSIF NEW.plan = 'custom' THEN
    NEW.max_users := 999999; NEW.max_cases := 999999; NEW.max_files := 999999;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (Trigger trg_apply_plan_limits from PLAN_LIMITS.sql already calls this.)

-- 3. Backfill existing rows to match their current plan
UPDATE public.tenants SET max_files = 500    WHERE plan = 'trial';
UPDATE public.tenants SET max_files = 200    WHERE plan = 'basic';
UPDATE public.tenants SET max_files = 500    WHERE plan = 'pro';
UPDATE public.tenants SET max_files = 1000   WHERE plan = 'advanced';
UPDATE public.tenants SET max_files = 999999 WHERE plan = 'custom';

-- ============================================
-- Done. The app blocks new uploads once a firm
-- reaches its plan's file limit.
-- ============================================

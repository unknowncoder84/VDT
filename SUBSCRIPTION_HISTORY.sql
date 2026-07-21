-- ============================================
-- VAKILDESK: SUBSCRIPTION_HISTORY.sql
-- Adds renewal history + a helper to activate/renew a
-- paid plan for a fixed number of months. When the
-- period ends, the app locks automatically (paywall)
-- until it is renewed again. No data is deleted.
--
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================

-- 1. History table — one row per activation / renewal
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan          VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(10),          -- 'monthly' | 'annual' | 'custom'
  months        INTEGER,              -- duration in months
  amount        NUMERIC,              -- amount paid (optional)
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at       TIMESTAMPTZ NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_hist_tenant
  ON public.subscription_history (tenant_id, created_at DESC);

-- 2. Renew / activate a paid plan for N months.
--    Sets the plan, marks active, extends the end date, and logs history.
--    Early renewals ADD to the remaining time.
CREATE OR REPLACE FUNCTION renew_subscription(
  p_tenant_id UUID,
  p_plan      VARCHAR,
  p_months    INTEGER DEFAULT 1,
  p_amount    NUMERIC DEFAULT NULL,
  p_cycle     VARCHAR DEFAULT 'monthly'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start       TIMESTAMPTZ := NOW();
  v_current_end TIMESTAMPTZ;
  v_end         TIMESTAMPTZ;
BEGIN
  SELECT subscription_ends_at INTO v_current_end FROM public.tenants WHERE id = p_tenant_id;

  IF v_current_end IS NOT NULL AND v_current_end > NOW() THEN
    v_end := v_current_end + (p_months || ' months')::interval;   -- add to remaining time
  ELSE
    v_end := NOW() + (p_months || ' months')::interval;           -- fresh period
  END IF;

  UPDATE public.tenants
     SET plan                 = p_plan,
         subscription_status  = 'active',
         subscription_ends_at = v_end
   WHERE id = p_tenant_id;

  INSERT INTO public.subscription_history(tenant_id, plan, billing_cycle, months, amount, starts_at, ends_at)
  VALUES (p_tenant_id, p_plan, p_cycle, p_months, p_amount, v_start, v_end);

  RETURN json_build_object('success', true, 'plan', p_plan, 'ends_at', v_end);
END;
$$;

-- ============================================
-- HOW TO USE (when a firm pays):
--   Monthly Pro for 1 month:
--     SELECT renew_subscription('TENANT_UUID', 'pro', 1, 1999, 'monthly');
--   Annual Advanced (12 months):
--     SELECT renew_subscription('TENANT_UUID', 'advanced', 12, 44490, 'annual');
--
-- After the period ends, subscription_ends_at is in the past,
-- so the app shows the paywall until you renew again.
-- The Subscription page shows the full renewal history.
-- ============================================


-- ============================================
-- READY-TO-USE COMMANDS  (copy the line you need,
-- replace TENANT_UUID with the firm's id)
--
-- Find a firm's id:
--   SELECT id, firm_name, plan FROM public.tenants;
--
-- ── MONTHLY (1 month) ──
--   Basic:     SELECT renew_subscription('TENANT_UUID', 'basic',    1,  799,  'monthly');
--   Pro:       SELECT renew_subscription('TENANT_UUID', 'pro',      1, 1999,  'monthly');
--   Advanced:  SELECT renew_subscription('TENANT_UUID', 'advanced', 1, 4449,  'monthly');
--
-- ── ANNUAL (12 months) ──
--   Basic:     SELECT renew_subscription('TENANT_UUID', 'basic',    12,  7990,  'annual');
--   Pro:       SELECT renew_subscription('TENANT_UUID', 'pro',      12, 19990,  'annual');
--   Advanced:  SELECT renew_subscription('TENANT_UUID', 'advanced', 12, 44490,  'annual');
--
-- The end date, the app lock, and the history row are all handled
-- automatically. Run the same command again later to renew (it adds
-- the new period on top of any remaining time).
-- ============================================

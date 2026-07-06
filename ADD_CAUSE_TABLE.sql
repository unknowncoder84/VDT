-- ============================================
-- ADD_CAUSE_TABLE.sql
-- Run in Supabase SQL Editor
-- Required for the Cause List / Hearing Diary
-- tab in Case Details to work.
-- Safe to run multiple times (IF NOT EXISTS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_cause_list (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hearing_date    DATE NOT NULL,
  outcome         VARCHAR(500) NOT NULL,
  notes           TEXT,
  created_by_name VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cause_case   ON public.case_cause_list(case_id);
CREATE INDEX IF NOT EXISTS idx_cause_tenant ON public.case_cause_list(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cause_date   ON public.case_cause_list(hearing_date DESC);

ALTER TABLE public.case_cause_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_cause_list" ON public.case_cause_list;
CREATE POLICY "open_cause_list"
  ON public.case_cause_list FOR ALL
  USING (true) WITH CHECK (true);

GRANT ALL ON public.case_cause_list TO anon;
GRANT ALL ON public.case_cause_list TO authenticated;
GRANT ALL ON public.case_cause_list TO service_role;

-- ============================================
-- Done. The Cause List tab in Case Details
-- will now save and load hearing entries.
-- ============================================

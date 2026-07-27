-- ============================================
-- VAKILDESK: TASK_NOTIFICATIONS.sql
-- Adds one-time popup notifications for task
-- assignment and completion:
--   * When admin assigns a task -> the assigned
--     user gets a popup the moment they're online
--     (or the next time they log in).
--   * When the user marks it completed -> the
--     admin who assigned it gets a popup the same way.
-- Each popup shows exactly once (tracked in the DB,
-- so it survives logout/login on any device).
--
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_notified_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigner_notified_at TIMESTAMPTZ;

-- Mark all EXISTING tasks as already notified so this feature only fires
-- for assignments/completions that happen from now on (no retroactive spam).
UPDATE public.tasks SET assignee_notified_at = NOW() WHERE assignee_notified_at IS NULL;
UPDATE public.tasks SET assigner_notified_at = NOW() WHERE assigner_notified_at IS NULL;

-- ============================================
-- IMPORTANT — enable Realtime for the tasks table so popups appear
-- immediately while both people are online (not just on next login):
--   Supabase Dashboard -> Database -> Replication
--   -> find "supabase_realtime" publication -> enable it for "tasks"
-- (If Realtime is already enabled for all tables, no action needed.)
-- ============================================

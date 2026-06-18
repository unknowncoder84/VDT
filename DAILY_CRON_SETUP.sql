-- ============================================
-- VAKILDESK: DAILY_CRON_SETUP.sql
-- ============================================
-- Run ONCE in Supabase → SQL Editor.
-- Sets up a daily 8 AM IST automatic email run.
--
-- IMPORTANT: Before running, replace the
-- placeholder YOUR_SERVICE_ROLE_KEY below with
-- your actual service_role key from:
-- Supabase → Project Settings → API → service_role
--
-- Emails only go to firms that:
--   1. Have an active plan (advanced/custom)
--      OR have the gmail_reminders addon
--   2. Have Gmail + App Password saved
--   3. Have reminders_active = true
--   4. Have cases with client email + hearing
--      in the next 3 days
--
-- Cost: FREE. Uses pg_cron + pg_net (built-in).
-- Your PC does NOT need to be on.
-- ============================================

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Remove old schedule if exists (idempotent)
SELECT cron.unschedule('vakildesk-daily-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'vakildesk-daily-reminders'
);

-- Step 3: Schedule daily at 02:30 UTC = 08:00 AM IST
-- ⚠️ REPLACE 'YOUR_SERVICE_ROLE_KEY' with your actual key before running!
SELECT cron.schedule(
  'vakildesk-daily-reminders',
  '30 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bmefrxwlgmhseylbzoij.supabase.co/functions/v1/send-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"batch": true}'::jsonb
  );
  $$
);

-- ============================================
-- DONE.
-- Every day at 8:00 AM IST, Supabase will
-- automatically send reminders for all eligible
-- firms.
--
-- Verify it's scheduled:
--   SELECT * FROM cron.job;
--
-- To change time (e.g. 9 AM IST = 3:30 UTC):
--   SELECT cron.unschedule('vakildesk-daily-reminders');
--   Then re-run Step 3 with '30 3 * * *'
-- ============================================

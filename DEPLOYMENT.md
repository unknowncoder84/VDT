# VakilDesk — Go Live Guide

Follow these 4 steps in order. Each is one-time.

---

## Step 1 — Database (Supabase)

Open Supabase → **SQL Editor** → New query.

- **Existing database (you already have data):**
  Paste **`GO_LIVE_SETUP.sql`** → Run. Done.

- **Brand-new empty project:**
  First run **`VAKILDESK_MASTER.sql`**, then run **`GO_LIVE_SETUP.sql`**.

This sets up: Gmail email settings (secure), plan limits, and the case-files storage bucket.

---

## Step 2 — Deploy the Gmail send function (Supabase Edge Function)

This makes the "Send Now" and "Test Email" buttons send real emails instantly.

Install the Supabase CLI once: https://supabase.com/docs/guides/cli

Then in a terminal in the project folder:

```bash
supabase login
supabase link --project-ref bmefrxwlgmhseylbzoij
supabase functions deploy send-reminder --no-verify-jwt
```

No secrets to set — Supabase injects the keys automatically.
(If you skip this, daily reminders still work via the Python script;
only the in-app "Send Now"/"Test" buttons need this function.)

---

## Step 3 — Deploy the website (Netlify)

1. Push the code to GitHub (already connected to `VAKILDESK001`).
2. Netlify → Add new site → Import from GitHub → pick the repo.
3. Build settings auto-fill from `netlify.toml` (build: `npm run build`, publish: `dist`).
4. Add **Environment variables**:
   - `VITE_SUPABASE_URL` = `https://bmefrxwlgmhseylbzoij.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon key (from Supabase → Settings → API)
5. Deploy. You get a live URL.

Every future `git push` auto-redeploys.

---

## Step 4 — Daily auto-reminders (optional, runs the scheduled emails)

The Python script sends reminders every morning for hearings due in 1–3 days.

```bash
cd email-backend
py -m pip install -r requirements.txt
py lms_reminders.py        # test run
```

Schedule it daily at 8 AM:
- **Windows:** Task Scheduler → program `py`, argument `lms_reminders.py`, start in `email-backend`.
- **Server/cron:** `0 8 * * * cd /path/email-backend && python lms_reminders.py`

The `email-backend/.env` already has your Supabase URL + service key.

---

## How to activate a paying firm's plan (manual, until Razorpay)

Supabase → SQL Editor:

```sql
UPDATE public.tenants
SET plan = 'pro',                      -- basic | pro | advanced | custom
    subscription_status = 'active',
    subscription_ends_at = NOW() + INTERVAL '1 year'
WHERE owner_email = 'theirfirm@example.com';
```

Plan limits update automatically (Step 1 trigger). The firm sees the new plan on next login.

---

## Quick checklist

- [ ] GO_LIVE_SETUP.sql run in Supabase
- [ ] send-reminder Edge Function deployed
- [ ] Netlify site deployed with both env variables
- [ ] Python reminder script scheduled (optional)
- [ ] Test: register a firm → add a case with client email + hearing in 2 days → Reminders → Send Now → email arrives

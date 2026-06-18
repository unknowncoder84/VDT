# VakilDesk — Gmail Reminder System

## What it does

Automatically emails **clients** when their hearing is coming up (3 days, 2 days, 1 day, or same day).  
Runs on behalf of each law firm using their connected Gmail account.  
Reads from your Supabase database. Logs every send to the `email_logs` table.  
The VakilDesk dashboard (Reminders page) shows sent/failed counts live.

---

## Setup — Step by Step

### 1. Install dependencies

```bash
cd email-backend
pip install -r requirements.txt
```

### 2. Get Gmail credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → **Enable the Gmail API**
3. Create **OAuth 2.0 credentials** → Application type: **Desktop app**
4. Download the file → rename it to `credentials.json`
5. Place `credentials.json` inside the `email-backend/` folder

### 3. Configure `.env`

Copy `.env.example` to `.env` and fill in:

```env
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your_service_role_key_here
```

> ⚠️ Use the **service_role** key (not the anon key) so the script can read all tenants.

### 4. Authorize Gmail (first run only)

```bash
python lms_reminders.py
```

A browser window will open. Sign in with the Gmail account you want to send from, then click Allow.  
A `token.pickle` file is saved — future runs use this automatically (no browser needed).

### 5. Schedule daily runs

**Windows — Task Scheduler:**
- Action: `python C:\path\to\email-backend\lms_reminders.py`
- Trigger: Daily at **8:00 AM**
- Start in: `C:\path\to\email-backend`

**Mac / Linux — crontab:**
```bash
crontab -e
# Add this line:
0 8 * * * cd /path/to/email-backend && python lms_reminders.py >> reminder.log 2>&1
```

---

## How it works

1. Script connects to Supabase using the service_role key
2. Finds all non-closed cases (across all tenants) with hearings in the next 3 days that have `client_email` set
3. Checks `email_logs` to avoid sending duplicates to the same case today
4. Reads each tenant's `email_settings` (firm name, active toggle)
5. Sends a branded HTML email from your Gmail → client's email
6. Logs every attempt (sent / failed) to `email_logs`
7. The Reminders page in VakilDesk shows these logs live

---

## Controlling reminders per firm

Admins can go to **Reminders → Email Settings** in VakilDesk to:
- Turn reminders on/off with a toggle
- Set the firm name used in email subjects
- Send a test email

---

## Files

| File | Purpose |
|---|---|
| `lms_reminders.py` | Main script — fetches cases, sends emails, logs results |
| `email_sender.py` | Gmail OAuth2 authentication and send wrapper |
| `credentials.json` | Your Google OAuth credentials (not committed to git) |
| `token.pickle` | Saved Gmail auth token (auto-generated on first run) |
| `.env` | Supabase URL and service_role key |

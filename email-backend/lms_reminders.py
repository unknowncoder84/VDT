"""
VakilDesk — Gmail SMTP Reminder System
=======================================
Plug and play. No OAuth. No setup files.
User enters Gmail + App Password in the app.
This script reads from DB and sends via SMTP.

Setup (one time):
  pip install supabase python-dotenv

Create email-backend/.env:
  SUPABASE_URL=your_supabase_url
  SUPABASE_KEY=your_service_role_key

Schedule daily at 8 AM:
  Windows: Task Scheduler
  Linux/Mac: cron -> 0 8 * * * python lms_reminders.py
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta, date, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
IST = timedelta(hours=5, minutes=30)
PAID_PLANS = {"pro", "advanced", "custom"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def db() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Add SUPABASE_URL and SUPABASE_KEY to .env"
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def ist_today() -> str:
    return (utc_now() + IST).date().isoformat()


def ist_plus(days: int) -> str:
    return (
        utc_now() + IST + timedelta(days=days)
    ).date().isoformat()


def tenant_can_send(
    supabase: Client, tenant_id: str
) -> bool:
    """
    Returns True if tenant is eligible:
    - On pro/advanced/custom with active subscription
    - OR has gmail_reminders addon active
    """
    t = (
        supabase.table("tenants")
        .select("plan, subscription_status")
        .eq("id", tenant_id)
        .single()
        .execute()
    )
    if not t.data:
        return False

    plan = t.data.get("plan", "trial")
    status = t.data.get("subscription_status", "expired")

    # Must be an active subscription
    if status != "active":
        return False

    # Pro and above includes Gmail reminders
    if plan in PAID_PLANS:
        return True

    # Check for gmail_reminders addon on basic plan
    addon = (
        supabase.table("tenant_addons")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("addon", "gmail_reminders")
        .eq("is_active", True)
        .execute()
    )
    return bool(addon.data)


def get_smtp(supabase: Client, tenant_id: str):
    """
    Returns SMTP credentials dict or None.
    """
    r = (
        supabase.table("email_settings")
        .select(
            "smtp_email, smtp_app_password,"
            " firm_name, reminders_active,"
            " setup_complete"
        )
        .eq("tenant_id", tenant_id)
        .eq("setup_complete", True)
        .limit(1)
        .execute()
    )
    if not r.data:
        return None
    s = r.data[0]
    if not s.get("smtp_email") or \
       not s.get("smtp_app_password"):
        return None
    if not s.get("reminders_active", True):
        return None
    return {
        "email": s["smtp_email"],
        "password": s["smtp_app_password"],
        "firm": s.get("firm_name") or "Your Advocate",
    }


def upcoming_cases(supabase: Client) -> list:
    today = ist_today()
    plus3 = ist_plus(3)
    r = (
        supabase.table("cases")
        .select(
            "id, tenant_id, client_name,"
            " client_email, next_date,"
            " file_no, court, case_type"
        )
        .neq("status", "closed")
        .not_.is_("client_email", "null")
        .neq("client_email", "")
        .gte("next_date", today)
        .lte("next_date", plus3)
        .order("next_date", desc=False)
        .execute()
    )
    return r.data or []


def sent_already(
    supabase: Client, case_id: str, rtype: str
) -> bool:
    today = ist_today()
    r = (
        supabase.table("email_logs")
        .select("id")
        .eq("case_id", case_id)
        .eq("reminder_type", rtype)
        .gte("sent_at", f"{today}T00:00:00")
        .execute()
    )
    return bool(r.data)


def write_log(
    supabase: Client, case_id, tenant_id,
    client_name, sent_to, rtype, status, err=None
):
    try:
        supabase.table("email_logs").insert({
            "case_id": case_id,
            "tenant_id": tenant_id,
            "client_name": client_name,
            "sent_to": sent_to,
            "reminder_type": rtype,
            "status": status,
            "error_message": err,
            "sent_at": utc_now().isoformat(),
        }).execute()
    except Exception as e:
        print(f"  WARN  Log error: {e}")


def make_email(
    firm: str, client: str,
    case: dict, days: int
) -> tuple:
    if days <= 0:
        urg, col = "TODAY", "#ef4444"
    elif days == 1:
        urg, col = "TOMORROW", "#f97316"
    elif days == 2:
        urg, col = "in 2 DAYS", "#f59e0b"
    else:
        urg, col = "in 3 days", "#3b82f6"

    raw = case.get("next_date", "")
    try:
        fmt = datetime.fromisoformat(raw)\
            .strftime("%d %B %Y")
    except Exception:
        fmt = raw

    subject = (
        f"[{firm}] Hearing Reminder — "
        f"{urg} | {case.get('file_no', '')}"
    )

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
  content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;
  font-family:Arial,sans-serif;
  background:#f1f5f9;">
<table width="100%" cellpadding="0"
  cellspacing="0"
  style="padding:30px 15px;background:#f1f5f9;">
<tr><td align="center">
<table width="560" cellpadding="0"
  cellspacing="0"
  style="background:#ffffff;
  border-radius:14px;overflow:hidden;
  border:1px solid #e2e8f0;">

  <tr><td style="padding:26px 28px;
    text-align:center;
    background:linear-gradient(
      135deg,#f97316,#ea580c);">
    <p style="margin:0;font-size:26px;">&#9878;&#65039;</p>
    <h1 style="margin:6px 0 0;color:white;
      font-size:20px;font-weight:700;">
      VakilDesk
    </h1>
    <p style="margin:5px 0 0;
      color:rgba(255,255,255,.85);
      font-size:12px;">
      Reminder from
      <strong>{firm}</strong>
    </p>
  </td></tr>

  <tr><td style="padding:24px 28px 0;">
    <div style="background:{col}15;
      border:1.5px solid {col};
      border-radius:10px;
      padding:18px;text-align:center;">
      <p style="margin:0;color:{col};
        font-size:20px;font-weight:700;">
        Hearing {urg}
      </p>
      <p style="margin:7px 0 0;
        color:#64748b;font-size:13px;">
        {fmt}
      </p>
    </div>
  </td></tr>

  <tr><td style="padding:20px 28px;">
    <p style="color:#1e293b;font-size:15px;
      margin:0 0 14px;">
      Dear <strong>{client}</strong>,
    </p>
    <table width="100%"
      style="border-collapse:collapse;
      border:1px solid #e2e8f0;
      border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:11px 14px;
          border-bottom:1px solid #e2e8f0;">
          <span style="color:#94a3b8;
            font-size:10px;
            text-transform:uppercase;
            letter-spacing:.5px;">
            File No
          </span>
          <p style="margin:3px 0 0;
            color:#0f172a;font-weight:600;
            font-size:14px;">
            {case.get("file_no", "N/A")}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:11px 14px;
          border-bottom:1px solid #e2e8f0;">
          <span style="color:#94a3b8;
            font-size:10px;
            text-transform:uppercase;
            letter-spacing:.5px;">Court</span>
          <p style="margin:3px 0 0;
            color:#334155;font-size:14px;">
            {case.get("court", "N/A")}
          </p>
        </td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:11px 14px;">
          <span style="color:#94a3b8;
            font-size:10px;
            text-transform:uppercase;
            letter-spacing:.5px;">
            Case Type
          </span>
          <p style="margin:3px 0 0;
            color:#334155;font-size:14px;">
            {case.get("case_type", "N/A")}
          </p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 28px 24px;
    text-align:center;
    border-top:1px solid #e2e8f0;
    background:#f8fafc;">
    <p style="margin:0;color:#94a3b8;
      font-size:11px;line-height:1.6;">
      Sent automatically by {firm}
      via VakilDesk.<br>
      Contact your advocate to
      reschedule if needed.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""

    return subject, html


def smtp_send(
    creds: dict, to: str,
    subject: str, body: str
) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = creds["email"]
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP_SSL(
            "smtp.gmail.com", 465
        ) as s:
            s.login(creds["email"], creds["password"])
            s.sendmail(
                creds["email"], to,
                msg.as_string()
            )
        return True
    except smtplib.SMTPAuthenticationError:
        print(
            "  FAIL Auth failed — "
            "check Gmail App Password"
        )
        return False
    except Exception as e:
        print(f"  FAIL SMTP error: {e}")
        return False


def main():
    print("=" * 50)
    print("VakilDesk Gmail Reminder System")
    print(f"Date: {ist_today()} IST")
    print("=" * 50)

    supabase = db()
    cases    = upcoming_cases(supabase)
    today    = date.fromisoformat(ist_today())
    sent = fail = skip = 0

    print(f"Found {len(cases)} upcoming hearing(s)\n")

    for c in cases:
        tid  = c["tenant_id"]
        name = c["client_name"]

        if not tenant_can_send(supabase, tid):
            print(f"  SKIP  No eligible plan -> {name}")
            skip += 1
            continue

        creds = get_smtp(supabase, tid)
        if not creds:
            print(f"  SKIP  Gmail not configured -> {name}")
            skip += 1
            continue

        days   = (
            date.fromisoformat(c["next_date"]) - today
        ).days
        rtype  = "1_day" if days <= 1 else "3_days"

        if sent_already(supabase, c["id"], rtype):
            print(f"  SKIP  Already sent today -> {name}")
            continue

        to = c.get("client_email", "")
        if not to:
            skip += 1
            continue

        subject, html = make_email(
            creds["firm"], name, c, days
        )

        ok = smtp_send(creds, to, subject, html)

        if ok:
            sent += 1
            write_log(
                supabase, c["id"], tid,
                name, to, rtype, "sent"
            )
            print(f"  SENT  {name} -> {to}")
        else:
            fail += 1
            write_log(
                supabase, c["id"], tid,
                name, to, rtype, "failed",
                "SMTP error"
            )
            print(f"  FAIL  {name}")

    print(
        f"\nDone. Sent: {sent}  "
        f"Failed: {fail}  "
        f"Skipped: {skip}"
    )
    print("=" * 50)


if __name__ == "__main__":
    main()

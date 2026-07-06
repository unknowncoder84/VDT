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
        f"Hearing Reminder: {urg} — "
        f"{case.get('file_no', '')} | {firm}"
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
<tr><td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:28px 32px;text-align:center;">
<p style="margin:0;font-size:28px;">&#9878;&#65039;</p>
<h1 style="margin:10px 0 4px;color:#ffffff;font-size:22px;font-weight:700;">VakilDesk</h1>
<p style="margin:0;color:rgba(255,255,255,0.88);font-size:13px;">Hearing Reminder from <strong>{firm}</strong></p>
</td></tr>
<tr><td style="padding:24px 32px 0;">
<div style="background:{col}18;border:2px solid {col};border-radius:12px;padding:20px;text-align:center;">
<p style="margin:0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:{col};">Upcoming Court Hearing</p>
<p style="margin:8px 0 4px;color:{col};font-size:24px;font-weight:700;">&#128197; Hearing {urg}</p>
<p style="margin:0;color:#64748b;font-size:15px;font-weight:500;">{fmt}</p>
</div>
</td></tr>
<tr><td style="padding:22px 32px 0;">
<p style="margin:0;color:#1e293b;font-size:15px;line-height:1.6;">Dear <strong>{client}</strong>,</p>
<p style="margin:10px 0 0;color:#475569;font-size:14px;line-height:1.7;">This is a gentle reminder from <strong>{firm}</strong> regarding your upcoming court hearing. Please make necessary arrangements and ensure you are available on the scheduled date.</p>
</td></tr>
<tr><td style="padding:20px 32px 0;">
<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;">Case Information</p>
<table width="100%" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
<tr style="background:#f8fafc;">
<td style="padding:13px 16px;border-bottom:1px solid #e2e8f0;width:50%;vertical-align:top;">
<span style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#94a3b8;">Hearing Date</span>
<p style="margin:4px 0 0;color:#0f172a;font-size:14px;font-weight:600;">{fmt}</p>
</td>
<td style="padding:13px 16px;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;vertical-align:top;">
<span style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#94a3b8;">File Number</span>
<p style="margin:4px 0 0;color:#0f172a;font-size:14px;font-weight:600;">{case.get("file_no", "N/A")}</p>
</td>
</tr>
<tr>
<td style="padding:13px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
<span style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#94a3b8;">Court</span>
<p style="margin:4px 0 0;color:#334155;font-size:14px;">{case.get("court", "N/A")}</p>
</td>
<td style="padding:13px 16px;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;vertical-align:top;">
<span style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#94a3b8;">Case Type</span>
<p style="margin:4px 0 0;color:#334155;font-size:14px;">{case.get("case_type", "N/A")}</p>
</td>
</tr>
<tr style="background:#f8fafc;">
<td colspan="2" style="padding:13px 16px;vertical-align:top;">
<span style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#94a3b8;">Parties</span>
<p style="margin:4px 0 0;color:#334155;font-size:14px;">{case.get("parties_name", "N/A")}</p>
</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:20px 32px 0;">
<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:14px 16px;">
<p style="margin:0;color:#854d0e;font-size:13px;line-height:1.6;"><strong>&#9888;&#65039; Important:</strong> Please bring all relevant documents and arrive at court at least 30 minutes before scheduled time. Contact your advocate if you have any questions.</p>
</div>
</td></tr>
<tr><td style="padding:20px 32px;">
<p style="margin:0;color:#475569;font-size:13px;line-height:1.7;">If you need to reschedule or have any queries, please contact <strong>{firm}</strong> at your earliest convenience. Wishing you the best for your hearing.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
<p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">This is an automated reminder sent by <strong>{firm}</strong> via <strong>VakilDesk</strong> Legal Office Management System.<br>Please do not reply to this email directly.</p>
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

// VakilDesk — send-reminder Edge Function
// Two modes:
//   1. Single send: { tenant_id, case_id } — used by "Send Now" button
//   2. Batch send:  { batch: true }        — used by daily pg_cron schedule
//
// Plan gating (batch mode only):
//   • advanced / custom plan → Gmail included free
//   • basic / pro with 'gmail_reminders' addon active → allowed
//   • trial / basic / pro without addon → SKIPPED (no email sent)
//
// Deploy:
//   npx supabase functions deploy send-reminder --no-verify-jwt

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ELIGIBLE_PLANS = new Set(["advanced", "custom"]);

// ─── Helpers ───────────────────────────────────────────────

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function todayISO(): string {
  // IST = UTC+5:30
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

function plus3ISO(): string {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

function buildEmail(firm: string, client: string, c: Record<string, unknown>) {
  const raw = String(c.next_date ?? "");
  let dateStr = raw;
  try { dateStr = new Date(raw).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }); } catch (_) {}

  const subject = `[${firm}] Hearing Reminder | ${c.file_no ?? ""}`;
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 15px;background:#f1f5f9;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="padding:26px 28px;text-align:center;background:linear-gradient(135deg,#f97316,#ea580c);">
<h1 style="margin:0;color:#fff;font-size:20px;">&#9878;&#65039; VakilDesk</h1>
<p style="margin:5px 0 0;color:rgba(255,255,255,.85);font-size:12px;">Reminder from <strong>${firm}</strong></p>
</td></tr>
<tr><td style="padding:24px 28px;">
<p style="color:#1e293b;font-size:15px;margin:0 0 14px;">Dear <strong>${client}</strong>,</p>
<p style="color:#334155;font-size:14px;margin:0 0 16px;">This is a reminder regarding your upcoming hearing.</p>
<table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<tr style="background:#f8fafc;"><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;"><span style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Hearing Date</span><p style="margin:3px 0 0;color:#0f172a;font-weight:600;font-size:14px;">${dateStr}</p></td></tr>
<tr><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;"><span style="color:#94a3b8;font-size:10px;text-transform:uppercase;">File No</span><p style="margin:3px 0 0;color:#334155;font-size:14px;">${c.file_no ?? "N/A"}</p></td></tr>
<tr style="background:#f8fafc;"><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;"><span style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Court</span><p style="margin:3px 0 0;color:#334155;font-size:14px;">${c.court ?? "N/A"}</p></td></tr>
<tr><td style="padding:11px 14px;"><span style="color:#94a3b8;font-size:10px;text-transform:uppercase;">Case Type</span><p style="margin:3px 0 0;color:#334155;font-size:14px;">${c.case_type ?? "N/A"}</p></td></tr>
</table></td></tr>
<tr><td style="padding:16px 28px;text-align:center;border-top:1px solid #e2e8f0;background:#f8fafc;">
<p style="margin:0;color:#94a3b8;font-size:11px;">Sent by ${firm} via VakilDesk. Contact your advocate to reschedule if needed.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}

async function sendViaSMTP(email: string, password: string, to: string, subject: string, html: string): Promise<string | null> {
  const client = new SMTPClient({
    connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: email, password } },
  });
  try {
    await client.send({ from: email, to, subject, content: "text/html; charset=utf-8", html });
    await client.close();
    return null; // success
  } catch (e) {
    try { await client.close(); } catch (_) {}
    return String(e);
  }
}

// ─── Check if a tenant is eligible to send reminders ───────

async function isEligible(supabase: ReturnType<typeof getSupabase>, tenantId: string): Promise<boolean> {
  const { data: t } = await supabase
    .from("tenants")
    .select("plan, subscription_status")
    .eq("id", tenantId)
    .single();
  if (!t || t.subscription_status !== "active") return false;
  if (ELIGIBLE_PLANS.has(t.plan)) return true;
  // Check for gmail_reminders addon
  const { data: addon } = await supabase
    .from("tenant_addons")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("addon", "gmail_reminders")
    .eq("is_active", true)
    .limit(1);
  return !!(addon && addon.length > 0);
}

// ─── Already sent today? ───────────────────────────────────

async function alreadySent(supabase: ReturnType<typeof getSupabase>, caseId: string, rtype: string): Promise<boolean> {
  const today = todayISO();
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("case_id", caseId)
    .eq("reminder_type", rtype)
    .gte("sent_at", `${today}T00:00:00`);
  return !!(data && data.length > 0);
}

// ─── BATCH MODE: send for all eligible firms ───────────────

async function handleBatch(): Promise<Response> {
  const supabase = getSupabase();
  const today = todayISO();
  const in3 = plus3ISO();

  // Get all cases with hearings in next 3 days that have client_email
  const { data: cases } = await supabase
    .from("cases")
    .select("id, tenant_id, client_name, client_email, next_date, file_no, court, case_type")
    .neq("status", "closed")
    .not("client_email", "is", null)
    .neq("client_email", "")
    .gte("next_date", today)
    .lte("next_date", in3)
    .order("next_date", { ascending: true });

  if (!cases || cases.length === 0) {
    return json({ success: true, sent: 0, skipped: 0, message: "No upcoming hearings" });
  }

  // Group by tenant to avoid re-fetching settings per case
  const byTenant: Record<string, typeof cases> = {};
  for (const c of cases) {
    if (!byTenant[c.tenant_id]) byTenant[c.tenant_id] = [];
    byTenant[c.tenant_id].push(c);
  }

  let sent = 0, skipped = 0, failed = 0;

  for (const [tenantId, tenantCases] of Object.entries(byTenant)) {
    // Plan/addon gate
    const eligible = await isEligible(supabase, tenantId);
    if (!eligible) {
      skipped += tenantCases.length;
      continue;
    }

    // Get SMTP credentials
    const { data: settings } = await supabase
      .from("email_settings")
      .select("smtp_email, smtp_app_password, firm_name, reminders_active, setup_complete")
      .eq("tenant_id", tenantId)
      .single();

    if (!settings?.smtp_email || !settings?.smtp_app_password || !settings?.setup_complete) {
      skipped += tenantCases.length;
      continue;
    }
    if (!settings.reminders_active) {
      skipped += tenantCases.length;
      continue;
    }

    const firm = settings.firm_name || "Your Advocate";

    for (const c of tenantCases) {
      const hearingDate = new Date(c.next_date);
      const todayDate = new Date(today);
      const days = Math.round((hearingDate.getTime() - todayDate.getTime()) / (86400000));
      const rtype = days <= 1 ? "1_day" : "3_days";

      // Skip if already sent today
      if (await alreadySent(supabase, c.id, rtype)) continue;

      const { subject, html } = buildEmail(firm, c.client_name, c);
      const err = await sendViaSMTP(settings.smtp_email, settings.smtp_app_password, c.client_email, subject, html);

      await supabase.from("email_logs").insert({
        tenant_id: tenantId,
        case_id: c.id,
        client_name: c.client_name,
        sent_to: c.client_email,
        status: err ? "failed" : "sent",
        reminder_type: rtype,
        error_message: err,
      });

      if (err) failed++;
      else sent++;
    }
  }

  return json({ success: true, sent, failed, skipped });
}

// ─── SINGLE MODE: send one email (Send Now / Test) ─────────

async function handleSingle(body: Record<string, unknown>): Promise<Response> {
  const { tenant_id, case_id, test, to } = body;
  if (!tenant_id) return json({ success: false, error: "tenant_id required" }, 400);

  const supabase = getSupabase();

  const { data: settings } = await supabase
    .from("email_settings")
    .select("smtp_email, smtp_app_password, firm_name, reminders_active")
    .eq("tenant_id", tenant_id)
    .single();

  if (!settings?.smtp_email || !settings?.smtp_app_password) {
    return json({ success: false, error: "Gmail not configured. Save your Gmail + App Password first." }, 400);
  }

  const firm = settings.firm_name || "Your Advocate";
  let recipient: string;
  let subject: string;
  let html: string;
  let caseRow: Record<string, unknown> | null = null;
  let reminderType = "manual";

  if (test) {
    recipient = String(to || settings.smtp_email);
    subject = `[${firm}] VakilDesk test email`;
    html = `<div style="font-family:Arial,sans-serif;padding:20px;">
      <h2 style="color:#f97316;">✅ Gmail reminders are working</h2>
      <p>This is a test email sent by <strong>${firm}</strong> through VakilDesk.
      Your clients will receive hearing reminders from <strong>${settings.smtp_email}</strong>.</p></div>`;
    reminderType = "test";
  } else {
    if (!case_id) return json({ success: false, error: "case_id required" }, 400);
    const { data: c } = await supabase
      .from("cases")
      .select("id, client_name, client_email, next_date, file_no, court, case_type")
      .eq("id", case_id)
      .eq("tenant_id", tenant_id)
      .single();
    if (!c) return json({ success: false, error: "Case not found" }, 404);
    if (!c.client_email) return json({ success: false, error: "This case has no client email" }, 400);
    caseRow = c;
    recipient = c.client_email;
    const built = buildEmail(firm, String(c.client_name ?? "Client"), c);
    subject = built.subject;
    html = built.html;
  }

  const err = await sendViaSMTP(settings.smtp_email, settings.smtp_app_password, recipient!, subject!, html!);

  await supabase.from("email_logs").insert({
    tenant_id,
    case_id: caseRow?.id ?? null,
    client_name: caseRow?.client_name ?? "Test",
    sent_to: recipient,
    status: err ? "failed" : "sent",
    reminder_type: reminderType,
    error_message: err,
  });

  if (err) return json({ success: false, error: "Send failed — check Gmail App Password. " + err }, 500);
  return json({ success: true });
}

// ─── Main handler ──────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    if (body.batch) return await handleBatch();
    return await handleSingle(body);
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});

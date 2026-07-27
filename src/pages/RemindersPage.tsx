import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle2, XCircle, CalendarClock, Settings, MessageSquare, Lock, Eye, EyeOff } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { canAccess } from '../lib/planUtils';
import { supabase } from '../lib/supabase';
import { formatIndianDate, formatIndianDateTime } from '../utils/dateFormat';

interface HearingCase {
  id: string;
  client_name: string;
  client_email: string;
  file_no: string;
  court: string;
  next_date: string;
}

interface EmailLog {
  id: string;
  sent_to: string;
  client_name: string;
  reminder_type: string;
  status: string;
  sent_at: string;
}

const RemindersPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const tenantId = user?.tenant_id;

  const [hearings, setHearings] = useState<HearingCase[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Email settings
  const [remindersActive, setRemindersActive] = useState(true);
  const [firmName, setFirmName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Gmail SMTP fields
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Tab: 'gmail' | 'whatsapp'
  const [activeTab, setActiveTab] = useState<'gmail' | 'whatsapp'>('gmail');

  // Plan/addon check
  const { tenant, hasAddon } = useTenant();
  const userPlan = tenant?.plan || 'trial';

  const gmailUnlocked =
    canAccess(userPlan, 'advanced') ||
    hasAddon('gmail_reminders');

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const in3Str = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data: cases } = await supabase
      .from('cases')
      .select('id, client_name, client_email, file_no, court, next_date')
      .eq('tenant_id', tenantId)
      .neq('status', 'closed')
      .gte('next_date', todayStr)
      .lte('next_date', in3Str)
      .order('next_date', { ascending: true });
    setHearings(cases || []);

    const { data: logsData } = await supabase
      .from('email_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sent_at', { ascending: false })
      .limit(50);
    setLogs(logsData || []);

    const { data: settings } = await supabase
      .from('email_settings')
      .select('id, tenant_id, firm_name, reminders_active, smtp_email, setup_complete')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (settings) {
      setRemindersActive(settings.reminders_active ?? true);
      setFirmName(settings.firm_name || '');
      setSmtpEmail(settings.smtp_email || '');
      // Password is write-only for security — never read back into the browser
      setSetupComplete(settings.setup_complete || false);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const daysLeft = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysBadge = (n: number) => {
    if (n <= 0) return { text: 'Today', cls: 'bg-red-500/15 text-red-500' };
    if (n === 1) return { text: 'Tomorrow', cls: 'bg-orange-500/15 text-orange-500' };
    if (n === 2) return { text: '2 days', cls: 'bg-yellow-500/15 text-yellow-600' };
    return { text: '3 days', cls: 'bg-blue-500/15 text-blue-500' };
  };

  // Stats
  const sentToday = logs.filter(l => l.status === 'sent' && l.sent_at?.split('T')[0] === todayStr).length;
  const thisMonth = todayStr.slice(0, 7);
  const sentThisMonth = logs.filter(l => l.status === 'sent' && l.sent_at?.slice(0, 7) === thisMonth).length;
  const failedToday = logs.filter(l => l.status === 'failed' && l.sent_at?.split('T')[0] === todayStr).length;

  const handleSendNow = async (c: HearingCase) => {
    if (!c.client_email) { showToast('No client email on file', false); return; }
    showToast(`Sending reminder to ${c.client_name}...`, true);
    const { data, error } = await supabase.functions.invoke('send-reminder', {
      body: { tenant_id: tenantId, case_id: c.id },
    });
    if (error || !data?.success) {
      showToast(data?.error || 'Failed to send reminder', false);
      fetchData();
      return;
    }
    showToast(`✅ Reminder sent to ${c.client_name}`, true);
    fetchData();
  };

  const handleSaveSettings = async () => {
    if (!tenantId) return;
    setSavingSettings(true);
    // Save via SECURITY DEFINER RPC — the password column is write-only
    // and cannot be read back by the browser (anon key).
    const { data, error } = await supabase.rpc('save_email_settings', {
      p_tenant_id: tenantId,
      p_firm_name: firmName,
      p_reminders_active: remindersActive,
      p_smtp_email: smtpEmail.trim() || null,
      p_smtp_password: smtpPassword.trim() || null,
    });
    setSavingSettings(false);
    if (error || !data?.success) {
      showToast('Failed to save settings', false);
      return;
    }
    setSetupComplete(!!data.setup_complete);
    setSmtpPassword(''); // clear field after save — never keep credential in memory
    showToast(
      data.setup_complete
        ? '✅ Gmail connected! Reminders will send automatically.'
        : '✅ Settings saved.',
      true
    );
  };

  const handleTestEmail = async () => {
    if (!tenantId) return;
    showToast('Sending test email...', true);
    const { data, error } = await supabase.functions.invoke('send-reminder', {
      body: { tenant_id: tenantId, test: true, to: user?.email || smtpEmail },
    });
    if (error || !data?.success) {
      showToast(data?.error || 'Test failed — check Gmail setup', false);
      fetchData();
      return;
    }
    showToast('✅ Test email sent — check your inbox', true);
    fetchData();
  };

  const card = theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'glass-dark border-white/10';
  const h = theme === 'light' ? 'text-gray-900' : 'text-white';
  const sub = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const feat = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const inp = theme === 'light'
    ? 'w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500'
    : 'w-full px-4 py-3 bg-[#2a2a3e] border border-orange-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500';
  const rowBorder = theme === 'light' ? 'border-gray-100' : 'border-white/5';

  const stats = [
    { label: 'Sent Today', value: sentToday, icon: Send, color: '#3b82f6' },
    { label: 'Sent This Month', value: sentThisMonth, icon: Mail, color: '#10b981' },
    { label: 'Failed Today', value: failedToday, icon: XCircle, color: '#ef4444' },
    { label: 'Hearings ≤ 3 days', value: hearings.length, icon: CalendarClock, color: '#f97316' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className={`text-2xl font-bold ${h} flex items-center gap-2`}><Mail className="text-orange-500" size={26} /> Reminder System</h1>
          <p className={`text-sm ${sub}`}>Auto-send hearing date reminders to your clients</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border
              ${activeTab === 'gmail'
                ? 'bg-orange-500 text-white border-orange-500'
                : theme === 'light'
                  ? 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  : 'glass-dark text-gray-300 border-white/10 hover:border-orange-500/40'
              }`}>
            <Mail size={15} />
            Gmail Reminders
            {gmailUnlocked
              ? <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Active</span>
              : <Lock size={12} className="opacity-60" />
            }
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border
              ${activeTab === 'whatsapp'
                ? 'bg-green-600 text-white border-green-600'
                : theme === 'light'
                  ? 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  : 'glass-dark text-gray-300 border-white/10 hover:border-green-500/40'
              }`}>
            <MessageSquare size={15} />
            WhatsApp Reminders
            <Lock size={12} className="opacity-60" />
          </button>
        </div>

        {/* GMAIL TAB */}
        {activeTab === 'gmail' && (
          <div className="space-y-6">
            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`${card} rounded-2xl p-5 border`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + '20' }}>
                        <Icon size={20} style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${h}`}>{s.value}</p>
                        <p className={`text-xs ${sub}`}>{s.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UPCOMING HEARINGS */}
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <div className={`p-5 border-b ${rowBorder}`}>
                <h2 className={`font-semibold ${h}`}>Upcoming Hearings (next 3 days)</h2>
              </div>
              {loading ? (
                <div className="text-center py-12"><div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" /></div>
              ) : hearings.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarClock size={40} className={`${sub} mx-auto mb-3`} />
                  <p className={`${sub} text-sm`}>No upcoming hearings in the next 3 days. Cases need a client email set to receive automated reminders.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-left ${sub} border-b ${rowBorder}`}>
                        <th className="p-3 font-medium">Client</th>
                        <th className="p-3 font-medium">File No</th>
                        <th className="p-3 font-medium hidden md:table-cell">Court</th>
                        <th className="p-3 font-medium">Hearing</th>
                        <th className="p-3 font-medium">Days Left</th>
                        <th className="p-3 font-medium hidden md:table-cell">Email</th>
                        <th className="p-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hearings.map(c => {
                        const n = daysLeft(c.next_date);
                        const badge = daysBadge(n);
                        return (
                          <tr key={c.id} className={`border-b ${rowBorder} last:border-0`}>
                            <td className={`p-3 ${feat} font-medium`}>{c.client_name}</td>
                            <td className={`p-3 ${sub}`}>{c.file_no}</td>
                            <td className={`p-3 ${sub} hidden md:table-cell`}>{c.court || '—'}</td>
                            <td className={`p-3 ${feat}`}>{formatIndianDate(c.next_date)}</td>
                            <td className="p-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>{badge.text}</span></td>
                            <td className={`p-3 ${sub} hidden md:table-cell text-xs`}>{c.client_email || <span className="text-red-400">No email</span>}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleSendNow(c)} disabled={!c.client_email}
                                className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-40">
                                <Send size={13} /> Send Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* EMAIL SETTINGS — Gmail Setup */}
            {isAdmin && (
              <div className={`${card} rounded-2xl border overflow-hidden`}>
                <div className={`p-5 border-b ${rowBorder}`}>
                  <h2 className={`font-semibold ${h} flex items-center gap-2`}>
                    <Settings size={18} className="text-orange-500" />
                    Gmail Setup
                    {setupComplete && (
                      <span className="ml-2 text-xs bg-green-500/15 text-green-500 border border-green-500/20 px-2.5 py-0.5 rounded-full font-medium">
                        ✓ Connected
                      </span>
                    )}
                  </h2>
                  <p className={`text-xs ${sub} mt-0.5`}>
                    Emails are sent from your own Gmail — clients see your firm's address
                  </p>
                </div>

                {!gmailUnlocked ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                      <Lock size={24} className="text-orange-400" />
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${h}`}>Gmail Reminders Locked</h3>
                    <p className={`${sub} text-sm mb-1 max-w-xs mx-auto`}>
                      Included free on Premium & Custom plans. Available as an add-on on Basic & Pro.
                    </p>
                    <p className="text-orange-400 text-xs font-medium mt-3 mb-4">
                      Upgrade to Premium (₹4,999/mo) or activate the Gmail Add-on (₹499/mo)
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <a href="https://wa.me/918693852452?text=I want to activate Gmail Reminders add-on on VakilDesk"
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:opacity-90 transition-opacity">
                        <Mail size={15} /> Get Gmail Add-on — ₹499/mo
                      </a>
                      <a href="/subscription"
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border transition-colors
                        ${theme === 'light' ? 'border-gray-200 text-gray-700 hover:bg-gray-50' : 'border-white/10 text-white hover:bg-white/5'}`}>
                        View Plans
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-5">

                    {/* Reminders Toggle */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border
                      ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/3 border-white/10'}`}>
                      <div>
                        <p className={`text-sm font-medium ${h}`}>Auto Reminders</p>
                        <p className={`text-xs ${sub} mt-0.5`}>
                          Script sends 3 days + 1 day before each hearing
                        </p>
                      </div>
                      <button
                        onClick={() => setRemindersActive(v => !v)}
                        className={`relative w-12 h-6 rounded-full transition-all
                          ${remindersActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm
                          ${remindersActive ? 'left-6' : 'left-0.5'}`} />
                      </button>
                    </div>

                    {/* Firm Name */}
                    <div>
                      <label className={`block text-xs font-medium ${sub} mb-1.5`}>
                        Firm Name
                        <span className={`ml-1 ${sub} opacity-70`}>(appears in email subject line)</span>
                      </label>
                      <input
                        value={firmName}
                        onChange={e => setFirmName(e.target.value)}
                        placeholder="e.g. Bobade Law Chamber"
                        className={inp} />
                    </div>

                    {/* Gmail Address */}
                    <div>
                      <label className={`block text-xs font-medium ${sub} mb-1.5`}>
                        Your Gmail Address
                        <span className={`ml-1 ${sub} opacity-70`}>(emails sent FROM this address)</span>
                      </label>
                      <input
                        type="email"
                        value={smtpEmail}
                        onChange={e => setSmtpEmail(e.target.value)}
                        placeholder="yourfirm@gmail.com"
                        autoComplete="off"
                        className={inp} />
                    </div>

                    {/* App Password */}
                    <div>
                      <label className={`block text-xs font-medium ${sub} mb-1.5`}>
                        Gmail App Password
                        <span className={`ml-1 ${sub} opacity-70`}>(16 characters — NOT your Gmail login password)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={smtpPassword}
                          onChange={e => setSmtpPassword(e.target.value)}
                          placeholder={setupComplete ? '•••••••• saved — leave blank to keep current' : 'xxxx xxxx xxxx xxxx'}
                          autoComplete="new-password"
                          className={`${inp} pr-12 font-mono tracking-widest`} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${sub} hover:text-orange-500 transition-colors`}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* How-to guide */}
                      <div className={`mt-3 p-4 rounded-xl border text-xs space-y-1
                        ${theme === 'light'
                          ? 'bg-blue-50 border-blue-100 text-blue-700'
                          : 'bg-blue-500/5 border-blue-500/20 text-blue-300'}`}>
                        <p className="font-semibold mb-2">
                          📋 How to get your App Password (takes 2 minutes):
                        </p>
                        <p>1. Go to <span className="font-mono mx-1 bg-white/10 px-1 rounded">myaccount.google.com</span></p>
                        <p>2. Security → 2-Step Verification → enable it if not done</p>
                        <p>3. Security → search "App passwords" → click it</p>
                        <p>4. App name: type "VakilDesk" → click Create</p>
                        <p>5. Copy the 16-character code → paste it above</p>
                        <p className={`mt-2 font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                          ✅ Once saved, emails will send automatically from your Gmail
                        </p>
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                        {savingSettings
                          ? 'Saving...'
                          : setupComplete
                            ? '✅ Update Gmail Settings'
                            : 'Connect Gmail'}
                      </button>
                      <button
                        onClick={handleTestEmail}
                        className={`px-5 py-3 rounded-xl font-medium text-sm border transition-colors
                          ${theme === 'light'
                            ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            : 'border-white/10 text-white hover:bg-white/5'}`}>
                        Test Email
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* EMAIL LOGS */}
            <div className={`${card} rounded-2xl border overflow-hidden`}>
              <div className={`p-5 border-b ${rowBorder}`}>
                <h2 className={`font-semibold ${h}`}>Recent Email Logs</h2>
              </div>
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Mail size={40} className={`${sub} mx-auto mb-3`} />
                  <p className={`${sub} text-sm`}>No reminder emails sent yet. Run the Python script in email-backend/ to start sending automated reminders.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-left ${sub} border-b ${rowBorder}`}>
                        <th className="p-3 font-medium">To</th>
                        <th className="p-3 font-medium hidden md:table-cell">Client</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l.id} className={`border-b ${rowBorder} last:border-0`}>
                          <td className={`p-3 ${feat} text-xs`}>{l.sent_to}</td>
                          <td className={`p-3 ${sub} hidden md:table-cell`}>{l.client_name || '—'}</td>
                          <td className={`p-3 ${sub} text-xs`}>{l.reminder_type}</td>
                          <td className="p-3">
                            {l.status === 'sent'
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-500"><CheckCircle2 size={13} /> Sent</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-red-500"><XCircle size={13} /> Failed</span>}
                          </td>
                          <td className={`p-3 ${sub} text-xs`}>{formatIndianDateTime(l.sent_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WHATSAPP TAB */}
        {activeTab === 'whatsapp' && (
          <div className={`${card} rounded-2xl border p-10 text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5">
              <MessageSquare size={30} className="text-green-500" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${h}`}>
              WhatsApp Reminders
            </h2>
            <div className={`inline-block px-4 py-2 rounded-full text-xs font-semibold mb-5
              ${theme === 'light'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              🚧 Coming Soon
            </div>

            <p className={`${sub} text-sm max-w-sm mx-auto mb-4`}>
              Send automatic hearing reminders directly to your clients on WhatsApp — from your
              firm's own number. Works exactly like Gmail reminders but via WhatsApp message.
            </p>

            <div className={`text-left max-w-sm mx-auto p-5 rounded-2xl border space-y-2 mb-5
              ${theme === 'light'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white/3 border-white/10'}`}>
              <p className={`text-xs font-semibold mb-3 ${h}`}>
                When launched, WhatsApp Reminders will:
              </p>
              {[
                'Send reminder 3 days before hearing',
                'Send reminder 1 day before hearing',
                'Message comes from your firm\'s number',
                'Client receives it as a normal WhatsApp',
                'Logs every message just like Gmail',
                'Available on Basic plan as ₹499/mo add-on',
                'Included free on Custom plan',
              ].map((f, i) => (
                <p key={i} className={`text-xs ${sub} flex items-start gap-2`}>
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </p>
              ))}
            </div>

            <p className={`text-xs ${sub} mb-4`}>
              Interested in early access?
            </p>
            <a
              href="https://wa.me/918693852452?text=I want early access to VakilDesk WhatsApp Reminders"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              <MessageSquare size={16} />
              Notify Me When Available
            </a>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </motion.div>
      )}
    </MainLayout>
  );
};

export default RemindersPage;

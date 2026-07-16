import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAuthScreenTheme } from '../lib/useAuthScreenTheme';
import { User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// Reusable section block for the Terms of Service modal
const Section: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div>
    <h3 className="text-white font-semibold mb-1.5">{n}. {title}</h3>
    <div className="text-gray-400">{children}</div>
  </div>
);

const LoginPage: React.FC = () => {  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Always render the login screen in the fixed dark + orange theme,
  // regardless of any custom brand colour or light mode left by a prior session.
  useAuthScreenTheme();

  // Register state
  const [regStep, setRegStep] = useState(1);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [barCouncilNo, setBarCouncilNo] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegStep1 = () => {
    setRegError('');
    if (!firmName.trim()) { setRegError('Firm name is required.'); return; }
    if (!ownerName.trim()) { setRegError('Owner name is required.'); return; }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) { setRegError('Valid email is required.'); return; }
    if (ownerMobile.replace(/\D/g, '').length !== 10) { setRegError('Mobile number must be 10 digits.'); return; }
    if (!barCouncilNo.trim()) { setRegError('Bar Council number is required.'); return; }
    if (!city.trim()) { setRegError('City is required.'); return; }
    if (!state) { setRegError('Please select a state.'); return; }
    setRegStep(2);
  };

  const handleRegSubmit = async () => {
    setRegError('');
    if (!regUsername.trim()) { setRegError('Username is required.'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    if (regPassword !== confirmPassword) { setRegError('Passwords do not match.'); return; }
    if (!agreedToTerms) { setRegError('You must agree to the Terms of Service.'); return; }

    setRegLoading(true);
    try {
      // Step 1: Create tenant record
      const { data: tenantData, error: tenantErr } = await supabase
        .from('tenants')
        .insert([{
          firm_name: firmName.trim(),
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim().toLowerCase(),
          owner_mobile: ownerMobile.trim(),
          bar_council_no: barCouncilNo.trim(),
          city: city.trim(),
          state,
          plan: 'trial',
          subscription_status: 'active',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          max_users: 3,
          max_cases: 200,
        }])
        .select()
        .single();

      if (tenantErr) {
        if (tenantErr.message.includes('tenants_owner_email_key')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw new Error(tenantErr.message);
      }
      const tenantId = tenantData.id;

      // Step 2: Create user_account (admin) for this tenant
      const { data: userData, error: userErr } = await supabase
        .from('user_accounts')
        .insert([{
          tenant_id: tenantId,
          username: regUsername.trim(),
          password_hash: regPassword,
          name: ownerName.trim(),
          email: ownerEmail.trim().toLowerCase(),
          role: 'admin',
          is_active: true,
        }])
        .select()
        .single();

      if (userErr) {
        // Cleanup tenant if user creation fails
        await supabase.from('tenants').delete().eq('id', tenantId);
        if (userErr.message.includes('user_accounts_tenant_id_username_key')) {
          throw new Error('Username already taken. Please choose another.');
        }
        throw new Error(userErr.message);
      }

      // Step 3: Create profile row
      await supabase.from('profiles').insert([{
        id: userData.id,
        tenant_id: tenantId,
        name: ownerName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        username: regUsername.trim(),
        role: 'admin',
        is_active: true,
      }]);

      // Step 4: Create tenant branding
      await supabase.from('tenant_branding').insert([{
        tenant_id: tenantId,
        firm_display_name: firmName.trim(),
        primary_color: '#f97316',
        white_label_active: false,
      }]);

      setRegSuccess(true);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const inputClass = 'w-full pl-12 pr-4 py-3.5 bg-[#2a2a3e] border border-orange-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-[#323248] transition-all text-base';
  const inputNoIconClass = 'w-full px-4 py-3.5 bg-[#2a2a3e] border border-orange-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-[#323248] transition-all text-base';
  const btnClass = 'w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-glow transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a]/95 via-[#1a1a2e]/90 to-[#0f0f1a]/95" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 rounded-3xl blur-lg opacity-50 animate-pulse" />
          <div className="relative glass-dark p-8 md:p-10 rounded-3xl border border-white/10">

            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="VakilDesk" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">VakilDesk</h1>
              <p className="text-gray-400 text-sm">Legal Office Management System</p>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 bg-[#2a2a3e] rounded-xl p-1">
              <button onClick={() => { setActiveTab('signin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'signin' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                Sign In
              </button>
              <button onClick={() => { setActiveTab('register'); setRegError(''); setRegStep(1); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'register' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                Register Firm
              </button>
            </div>

            {/* SIGN IN */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Username" className={inputClass} required autoComplete="username" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" className={inputClass} required autoComplete="current-password" />
                </div>
                {error && (
                  <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>
                )}
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="text-sm">Signing in...</span></>
                    : <>Sign In <ArrowRight size={18} /></>}
                </button>
                <p className="text-center text-gray-500 text-xs mt-2">
                  Staff members: use the username your admin created for you
                </p>
              </form>
            )}

            {/* REGISTER */}
            {activeTab === 'register' && !regSuccess && (
              <div className="space-y-3">
                <p className="text-gray-400 text-xs text-center">Step {regStep} of 2</p>
                <div className="flex gap-1 mb-2">
                  <div className={`flex-1 h-1 rounded ${regStep >= 1 ? 'bg-orange-500' : 'bg-gray-600'}`} />
                  <div className={`flex-1 h-1 rounded ${regStep >= 2 ? 'bg-orange-500' : 'bg-gray-600'}`} />
                </div>

                {regStep === 1 && (
                  <>
                    <input value={firmName} onChange={e => setFirmName(e.target.value)}
                      placeholder="Firm Name *" className={inputNoIconClass} />
                    <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      placeholder="Owner Full Name *" className={inputNoIconClass} />
                    <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                      placeholder="Owner Email *" className={inputNoIconClass} />
                    <input type="tel" value={ownerMobile} onChange={e => setOwnerMobile(e.target.value)}
                      placeholder="Mobile Number (10 digits) *" className={inputNoIconClass} />
                    <input value={barCouncilNo} onChange={e => setBarCouncilNo(e.target.value)}
                      placeholder="Bar Council Enrollment No. *" className={inputNoIconClass} />
                    <input value={city} onChange={e => setCity(e.target.value)}
                      placeholder="City *" className={inputNoIconClass} />
                    <select value={state} onChange={e => setState(e.target.value)} className={inputNoIconClass}>
                      <option value="">Select State *</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {regError && <p className="text-red-400 text-sm text-center">{regError}</p>}
                    <button onClick={handleRegStep1} className={btnClass}>
                      Continue <ArrowRight size={18} />
                    </button>
                  </>
                )}

                {regStep === 2 && (
                  <>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-sm text-orange-300">
                      Creating account for: <strong>{ownerEmail}</strong>
                    </div>
                    <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                      placeholder="Choose a Username *" className={inputNoIconClass} autoComplete="off" />
                    <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                      placeholder="Create Password (min 6 chars) *" className={inputNoIconClass} />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password *" className={inputNoIconClass} />
                    <label className="flex items-start gap-2 text-gray-400 text-sm cursor-pointer">
                      <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-orange-500/30 accent-orange-500 cursor-pointer flex-shrink-0" />
                      <span className="text-xs">
                        I agree to the{' '}
                        <button type="button" onClick={() => setShowTerms(true)}
                          className="text-orange-400 hover:text-orange-300 underline underline-offset-2 font-medium">
                          Terms of Service
                        </button>
                        {' '}and confirm that all firm details provided are accurate.
                      </span>
                    </label>
                    {regError && <p className="text-red-400 text-sm text-center">{regError}</p>}
                    <button onClick={handleRegSubmit} disabled={regLoading} className={btnClass}>
                      {regLoading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : 'Create My Account'}
                    </button>
                    <button onClick={() => setRegStep(1)} className="w-full text-gray-400 text-sm hover:text-white transition-colors">
                      ← Back
                    </button>
                  </>
                )}
              </div>
            )}

            {/* SUCCESS */}
            {activeTab === 'register' && regSuccess && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={64} className="text-green-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">Welcome to VakilDesk!</h2>
                <p className="text-green-400 font-medium">Your 14-day free trial has started.</p>
                <p className="text-gray-400 text-sm">No credit card required.</p>
                <p className="text-gray-400 text-sm">All features are unlocked during the trial.</p>
                <p className="text-white font-semibold text-lg">{firmName}</p>
                <p className="text-gray-400 text-sm">Sign in with your username and password to get started.</p>
                <button onClick={() => { setActiveTab('signin'); setUsername(regUsername); }}
                  className={btnClass}>
                  Go to Sign In <ArrowRight size={18} />
                </button>
              </div>
            )}

          </div>
        </div>
      </motion.div>

      {/* TERMS OF SERVICE MODAL */}
      {showTerms && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTerms(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#1a1a2e] border border-orange-500/20 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Terms of Service</h2>
                <p className="text-xs text-gray-400">VakilDesk — Legal Office Management System</p>
              </div>
              <button onClick={() => setShowTerms(false)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <ArrowRight size={20} className="rotate-180" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-300 leading-relaxed">
              <p className="text-xs text-gray-500">Last updated: 14 June 2026</p>

              <p>
                These Terms of Service ("Terms") govern your access to and use of VakilDesk,
                a cloud-based legal office management software ("the Service"). By creating an
                account, ticking the consent box, or using the Service, you ("the Firm", "you")
                agree to these Terms. If you do not agree, do not use the Service.
              </p>

              <Section n="1" title="Eligibility & Account">
                <p>VakilDesk is intended for use by practising advocates, law firms, and their
                authorised staff in India. You confirm that the information you provide during
                registration — including firm name, owner name, email, mobile number, and Bar
                Council enrolment number — is true and accurate. You are responsible for keeping
                your login credentials confidential and for all activity that occurs under your
                account and the accounts of staff members you create.</p>
              </Section>

              <Section n="2" title="What the Service Does">
                <p>VakilDesk helps you manage cases, clients, counsel, hearings, tasks,
                attendance, expenses, documents, and a library/storage index. It can also send
                hearing-date reminder emails to your clients on your behalf when you connect and
                enable the email reminder feature. The Service is an administrative tool only.</p>
              </Section>

              <Section n="3" title="Not Legal Advice">
                <p>VakilDesk is software for organising your practice. It does not provide legal
                advice, does not interpret law, and is not a substitute for your professional
                judgement. You remain solely responsible for all legal work, court deadlines,
                filings, and advice given to your clients. Reminder dates, case stages, and any
                computed values are aids only — you must independently verify all dates and
                deadlines against official court records.</p>
              </Section>

              <Section n="4" title="Free Trial, Plans & Billing">
                <p>New firms receive a 14-day free trial with no payment required. After the
                trial, continued use requires an active paid subscription on one of the published
                plans. Add-on features (such as email or messaging reminders) may carry separate
                charges. Prices are shown in the Subscription section and may be revised with
                prior notice. When a subscription expires, your data is retained but the ability
                to add new records may be paused until you renew.</p>
              </Section>

              <Section n="5" title="Your Data & Ownership">
                <p>You own all data you enter into VakilDesk — your cases, clients, documents,
                and records. We act only as a processor that stores and displays this data so you
                can run your practice. We do not sell your data. You may export your data
                (e.g. CSV/Excel) at any time while your account is active. On account deletion,
                your data is removed from active systems.</p>
              </Section>

              <Section n="6" title="Confidentiality & Privilege">
                <p>You acknowledge that case data may include information subject to advocate-client
                privilege and confidentiality obligations under Indian law and the Bar Council of
                India rules. You are responsible for obtaining any client consents required before
                storing their information or sending them automated reminders. We apply reasonable
                technical measures to protect data, including tenant isolation so that each firm's
                data is kept separate, and we restrict access to sensitive credentials.</p>
              </Section>

              <Section n="7" title="Email Reminders & Third-Party Services">
                <p>The reminder feature sends emails from a Gmail account that you connect using a
                Google App Password. That password is stored to allow sending and is never shown
                back to you in the browser after saving. You are responsible for the accuracy of
                client email addresses and for compliance with applicable anti-spam and data
                protection norms. The Service relies on third-party infrastructure (including
                Supabase for the database and Google for email delivery); their availability is
                outside our direct control.</p>
              </Section>

              <Section n="8" title="Acceptable Use">
                <p>You agree not to use VakilDesk to store unlawful content, to send unsolicited
                bulk messages, to attempt to access another firm's data, to reverse-engineer or
                disrupt the Service, or to use it in any way that violates Indian law or the
                professional conduct rules applicable to advocates.</p>
              </Section>

              <Section n="9" title="Availability & Disclaimer">
                <p>We work to keep VakilDesk available and reliable, but the Service is provided
                "as is" and "as available" without warranties of any kind. We do not guarantee
                that the Service will be uninterrupted, error-free, or that reminders will always
                be delivered. You should maintain your own independent record of critical court
                dates.</p>
              </Section>

              <Section n="10" title="Limitation of Liability">
                <p>To the maximum extent permitted by law, VakilDesk and its operators shall not be
                liable for any missed hearing, deadline, filing, lost data, lost profits, or any
                indirect or consequential loss arising from your use of or inability to use the
                Service. Our total liability for any claim shall not exceed the subscription fees
                you paid to us in the three months preceding the claim.</p>
              </Section>

              <Section n="11" title="Suspension & Termination">
                <p>You may stop using the Service and request account deletion at any time. We may
                suspend or terminate access for non-payment, breach of these Terms, or misuse.
                We will give reasonable notice where practical.</p>
              </Section>

              <Section n="12" title="Changes to These Terms">
                <p>We may update these Terms from time to time. Material changes will be notified
                through the app or by email. Continued use after changes take effect constitutes
                acceptance of the revised Terms.</p>
              </Section>

              <Section n="13" title="Governing Law">
                <p>These Terms are governed by the laws of India. Any dispute shall be subject to
                the exclusive jurisdiction of the courts at the place of the service provider's
                registered location in India.</p>
              </Section>

              <Section n="14" title="Contact">
                <p>For questions about these Terms, billing, or your data, contact us at
                <span className="text-orange-400"> +91 86938 52452</span> or
                <span className="text-orange-400"> sawantrishi152@gmail.com</span>.</p>
              </Section>

              <p className="text-xs text-gray-500 pt-2 border-t border-white/10">
                By ticking "I agree to the Terms of Service" and creating an account, you confirm
                that you have read, understood, and accepted these Terms on behalf of your firm.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 shrink-0 flex gap-3">
              <button
                onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 rounded-xl text-sm"
              >
                I Agree & Accept
              </button>
              <button
                onClick={() => setShowTerms(false)}
                className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LoginPage;

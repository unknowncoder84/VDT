import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, MessageSquare, Lock, Palette, X, Send, Mail } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useTenant } from '../contexts/TenantContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { formatIndianDate } from '../utils/dateFormat';

const SubscriptionPage: React.FC = () => {
  const { tenant, branding, addons, isExpired, isTrialing, daysLeftInTrial, hasAddon, applyBranding, refreshTenant } = useTenant();
  const { theme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [brandName, setBrandName] = useState(branding?.firm_display_name || tenant?.firm_name || '');
  const [brandColor, setBrandColor] = useState(branding?.primary_color || '#f97316');
  const [brandSaved, setBrandSaved] = useState(false);

  // Keep the branding form in sync once tenant/branding data loads
  // (fixes the firm name being wiped when only the colour is changed)
  useEffect(() => {
    if (branding?.firm_display_name) setBrandName(branding.firm_display_name);
    else if (tenant?.firm_name) setBrandName(tenant.firm_name);
    if (branding?.primary_color) setBrandColor(branding.primary_color);
  }, [branding, tenant]);

  const presetColors = [
    { name: 'Orange', hex: '#f97316' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Red', hex: '#ef4444' },
  ];

  const plans = [
    {
      name: 'Basic',
      monthly: 999,
      annual: 9990,
      subtext: 'Perfect for solo advocates',
      popular: false,
      gmailIncluded: false,
      features: [
        '3 staff members',
        'Up to 500 active cases',
        'Case tracking & IR status',
        'Clients & counsel management',
        'Appointments, tasks & attendance',
        'Expense & payment tracking',
        'Library & storage management',
        'File attachments per case',
        'Email support',
      ],
    },
    {
      name: 'Pro',
      monthly: 2499,
      annual: 24990,
      subtext: 'For small law firms',
      popular: true,
      gmailIncluded: false,
      features: [
        '8 staff members',
        'Up to 1,000 active cases',
        'Everything in Basic',
        'Advanced dashboard analytics',
        'Data export (Excel & PDF)',
        'Counsel performance reports',
        'Priority email support',
      ],
    },
    {
      name: 'Advanced',
      monthly: 4999,
      annual: 49990,
      subtext: 'For growing firms',
      popular: false,
      gmailIncluded: true,
      features: [
        '15 staff members',
        'Unlimited active cases',
        'Everything in Pro',
        '✉️ Gmail Reminders INCLUDED',
        'Auto hearing reminders to clients',
        'Dedicated account support',
        'Faster response SLA',
      ],
    },
    {
      name: 'Custom',
      monthly: 9999,
      annual: 99990,
      subtext: 'For large firms & chambers',
      popular: false,
      gmailIncluded: true,
      features: [
        'Unlimited staff members',
        'Unlimited cases',
        'Everything in Advanced',
        '🎨 White Label branding',
        'Custom color theme',
        '💬 WhatsApp Reminders INCLUDED',
        'Onboarding call included',
        'SLA guarantee',
        'Custom feature requests',
        'Dedicated account manager',
      ],
    },
  ];

  const addonsList = [
    {
      key: 'gmail_reminders',
      icon: Mail,
      color: '#EA4335',
      title: 'Gmail Reminders',
      price: 499,
      badge: 'New',
      desc: 'Auto-send hearing date reminders to clients via Gmail. Sends 3 days + 1 day before each hearing automatically.',
      includedIn: ['advanced', 'custom'],
    },
    {
      key: 'whatsapp_reminders',
      icon: MessageSquare,
      color: '#25D366',
      title: 'WhatsApp Reminders',
      price: 499,
      badge: 'Coming Soon',
      desc: 'Auto-send hearing date reminders to clients via WhatsApp. Works on Basic, Pro & Advanced plans. Included free in Custom.',
      includedIn: ['custom'],
    },
    {
      key: 'telegram_reminders',
      icon: Send,
      color: '#2AABEE',
      title: 'Telegram Reminders',
      price: 299,
      badge: 'Coming Soon',
      desc: 'Send automated case updates and hearing reminders to clients via Telegram channel.',
      includedIn: [] as string[],
    },
  ];

  const openContactModal = (planName: string) => {
    if (planName === 'Custom') {
      window.open('https://wa.me/918693852452?text=I want VakilDesk Custom plan for my firm', '_blank');
      return;
    }
    setModalMessage(`Payment integration coming soon!\nContact us to upgrade: +91 86938 52452`);
    setWhatsappLink(`https://wa.me/918693852452?text=I want to upgrade to ${planName} plan on VakilDesk`);
    setShowModal(true);
  };

  const openAddonModal = (addonName: string) => {
    setModalMessage(`Contact us to activate this add-on:\n+91 86938 52452`);
    setWhatsappLink(`https://wa.me/918693852452?text=I want to activate the ${addonName} add-on on VakilDesk`);
    setShowModal(true);
  };

  const planPrice = (plan: typeof plans[0]) => billingCycle === 'monthly' ? plan.monthly : plan.annual;
  const currentPlanPrice = plans.find(p => p.name.toLowerCase() === tenant?.plan)?.monthly || 0;
  const activeAddonsTotal = addons
    .filter(a => a.is_active)
    .reduce((sum, a) => sum + (addonsList.find(al => al.key === a.addon)?.price || 0), 0);

  const handleSaveBranding = async () => {
    if (!tenant) return;
    // Never save an empty firm name — fall back to the registered firm name
    const safeName = (brandName || '').trim() || tenant.firm_name || 'Your Firm';
    const d = { tenant_id: tenant.id, firm_display_name: safeName, primary_color: brandColor, white_label_active: true };
    if (branding?.id) { await supabase.from('tenant_branding').update(d).eq('id', branding.id); }
    else { await supabase.from('tenant_branding').insert([d]); }
    setBrandName(safeName);
    applyBranding({ ...d, id: branding?.id || '' } as any);
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 3000);
    refreshTenant();
  };

  const canWhiteLabel = tenant?.plan === 'custom';

  // Theme classes
  const card = theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'glass-dark border-white/10';
  const h = theme === 'light' ? 'text-gray-900' : 'text-white';
  const sub = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const feat = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const togBg = theme === 'light' ? 'bg-gray-100' : 'bg-[#2a2a3e]';
  const togOff = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const inp = theme === 'light'
    ? 'w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500'
    : 'w-full px-4 py-3 bg-[#2a2a3e] border border-orange-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500';

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">

        {/* STATUS BANNER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {isTrialing && (
            <div className={`${theme === 'light' ? 'bg-amber-50 border-amber-300' : 'bg-amber-900/30 border-amber-500/30'} border rounded-2xl p-6`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>🎉 You are on a 14-day free trial</h2>
                  <p className={`text-sm ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>{daysLeftInTrial} days remaining</p>
                </div>
                <a href="#plans" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm">Upgrade Now</a>
              </div>
              <div className={`mt-4 ${theme === 'light' ? 'bg-amber-200' : 'bg-amber-900/50'} rounded-full h-2 overflow-hidden`}>
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: `${((14 - daysLeftInTrial) / 14) * 100}%` }} />
              </div>
            </div>
          )}
          {isExpired && (
            <div className={`${theme === 'light' ? 'bg-red-50 border-red-300' : 'bg-red-900/30 border-red-500/30'} border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4`}>
              <div>
                <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>⚠️ Your subscription has expired</h2>
                <p className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>Renew to continue adding records</p>
              </div>
              <a href="#plans" className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm">Renew Now</a>
            </div>
          )}
          {!isTrialing && !isExpired && tenant?.plan && tenant.plan !== 'trial' && (
            <div className={`${theme === 'light' ? 'bg-green-50 border-green-300' : 'bg-green-900/30 border-green-500/30'} border rounded-2xl p-6`}>
              <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>✓ Active — {tenant.plan.charAt(0).toUpperCase()}{tenant.plan.slice(1)}</h2>
              <p className={`text-sm ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>Renews on {tenant?.subscription_ends_at ? formatIndianDate(tenant.subscription_ends_at) : 'N/A'}</p>
            </div>
          )}
        </motion.div>

        {/* PLANS */}
        <div id="plans">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className={`text-2xl font-bold ${h}`}>Choose Your Plan</h2>
            <div className={`flex items-center gap-1 ${togBg} rounded-xl p-1`}>
              <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-orange-500 text-white' : togOff}`}>Monthly</button>
              <button onClick={() => setBillingCycle('annual')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-orange-500 text-white' : togOff}`}>Annual <span className="text-xs opacity-75 ml-1">Save 2 months</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`relative ${card} rounded-2xl p-6 border ${plan.popular ? 'border-orange-500/50 ring-1 ring-orange-500/20' : ''}`}>
                {plan.popular && <div className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>}
                <h3 className={`text-xl font-bold ${h} mb-1`}>{plan.name}</h3>
                <p className={`${sub} text-sm mb-4`}>{plan.subtext}</p>
                <div className="mb-2">
                  {plan.name === 'Custom' ? (
                    <span className={`text-2xl font-bold ${h}`}>Custom pricing</span>
                  ) : (
                    <>
                      <span className={`text-3xl font-bold ${h}`}>₹{planPrice(plan).toLocaleString('en-IN')}</span>
                      <span className={`${sub} text-sm`}>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {plan.gmailIncluded && (
                    <span className="inline-flex items-center text-[11px] bg-green-500/15 text-green-500 px-2.5 py-1 rounded-full font-medium">✉️ Gmail Included</span>
                  )}
                  {plan.name === 'Custom' && (
                    <span className="inline-flex items-center text-[11px] bg-green-500/15 text-green-500 px-2.5 py-1 rounded-full font-medium">💬 WhatsApp Included</span>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${feat}`}><Check size={16} className="text-green-500 mt-0.5 shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => openContactModal(plan.name)}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${plan.popular ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : theme === 'light' ? 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                  {plan.name === 'Custom' ? 'Contact Us' : `Choose ${plan.name}`}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ADD-ONS */}
        <div>
          <h2 className={`text-2xl font-bold ${h} mb-1`}>Reminder Add-ons</h2>
          <p className={`${sub} text-sm mb-6`}>Add automated reminders to any plan.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addonsList.map((addon) => {
              const Icon = addon.icon;
              const active = hasAddon(addon.key);
              const includedInCurrent = tenant?.plan ? addon.includedIn.includes(tenant.plan) : false;
              return (
                <div key={addon.key} className={`${card} rounded-2xl p-5 border`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: addon.color + '20' }}>
                      <Icon size={22} style={{ color: addon.color }} />
                    </div>
                    <div>
                      <h4 className={`${h} font-semibold text-sm`}>{addon.title}</h4>
                      {addon.badge && <span className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-medium">{addon.badge}</span>}
                    </div>
                  </div>
                  <p className={`${sub} text-xs mb-3`}>{addon.desc}</p>
                  <p className={`${feat} text-sm font-semibold mb-1`}>₹{addon.price}/month</p>
                  {addon.includedIn.includes('custom') && (
                    <p className="text-xs text-green-500 mb-3">Included free in Custom plan</p>
                  )}
                  <div className="flex items-center justify-end mt-2">
                    {includedInCurrent ? (
                      <span className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-500/15 text-green-500">Included ✓</span>
                    ) : (
                      <button onClick={() => openAddonModal(addon.title)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${active ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'}`}>
                        {active ? 'Remove' : `Add — ₹${addon.price}/mo`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {tenant?.plan === 'custom' ? (
            <p className={`${sub} text-sm mt-4`}>Your plan is fully customised — <span className="text-orange-400">contact us</span> for pricing and add-ons.</p>
          ) : (
            <p className={`${sub} text-sm mt-4`}>Estimated total: ₹{currentPlanPrice.toLocaleString('en-IN')}/month + ₹{activeAddonsTotal.toLocaleString('en-IN')}/month add-ons</p>
          )}
        </div>

        {/* WHITE LABEL */}
        <div>
          {!canWhiteLabel ? (
            <div className={`${card} rounded-2xl p-8 border text-center`}>
              <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className={`${h} font-bold text-lg mb-2`}>White Label Branding</h3>
              <p className={`${sub} text-sm mb-3 max-w-sm mx-auto`}>
                Show your firm name prominently throughout the app. Your firm name will be displayed
                alongside the VakilDesk platform brand.
              </p>
              <p className={`text-xs text-orange-400 font-medium mb-1`}>
                Available on Custom plan only
              </p>
              <p className={`text-xs ${sub}`}>
                Contact us to upgrade: +91 86938 52452
              </p>
            </div>
          ) : (
            <div className={`${card} rounded-2xl p-6 border`}>
              <div className="flex items-center gap-3 mb-1">
                <Palette size={24} className="text-orange-500" />
                <h3 className={`text-xl font-bold ${h}`}>Customize Your Branding</h3>
              </div>
              <p className={`${sub} text-sm mb-1`}>
                Your firm name will appear prominently throughout the app alongside the VakilDesk platform.
              </p>
              <p className={`text-xs text-orange-400/70 font-medium mb-6`}>
                Note: "VakilDesk" remains visible as the platform brand. White label means your firm name is prominently shown everywhere.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${feat} mb-2`}>Firm Display Name</label>
                    <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Sharma & Associates" className={inp} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${feat} mb-2`}>Brand Color</label>
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-16 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <div className="flex gap-2 mt-3">
                      {presetColors.map((c) => (
                        <button key={c.hex} onClick={() => setBrandColor(c.hex)} className="w-8 h-8 rounded-lg border-2 transition-all"
                          style={{ backgroundColor: c.hex, borderColor: brandColor === c.hex ? '#ffffff' : 'transparent' }} title={c.name} />
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSaveBranding} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium text-sm">Save Branding</button>
                  {brandSaved && <p className="text-green-500 text-sm">✓ Branding updated successfully!</p>}
                </div>
                <div className="flex items-center justify-center">
                  <div className={`w-48 h-64 rounded-xl border overflow-hidden ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-[#1a1a2e]'}`}>
                    <div className="p-3 border-b border-gray-200/20" style={{ backgroundColor: brandColor + '20' }}>
                      <div className="w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: brandColor }} />
                      <div className={`text-xs font-bold truncate ${h}`}>VakilDesk</div>
                      <div className={`text-[10px] truncate ${sub}`}>{brandName || 'Your Firm'}</div>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {['Dashboard', 'Cases', 'Tasks'].map((item) => (
                        <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: item === 'Dashboard' ? brandColor + '20' : 'transparent' }}>
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item === 'Dashboard' ? brandColor : '#9ca3af' }} />
                          <span className={`text-[10px] ${feat}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`${card} rounded-2xl p-6 border max-w-sm w-full`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`${h} font-bold`}>Contact Us</h3>
              <button onClick={() => setShowModal(false)} className={`${sub} hover:text-orange-500`}><X size={20} /></button>
            </div>
            <p className={`${feat} text-sm whitespace-pre-line mb-4`}>{modalMessage}</p>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-500 text-white text-center py-3 rounded-xl font-medium text-sm transition-colors">
              Chat on WhatsApp
            </a>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
};

export default SubscriptionPage;

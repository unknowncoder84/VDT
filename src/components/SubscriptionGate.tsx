import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthScreenTheme } from '../lib/useAuthScreenTheme';
import { Lock, CreditCard, AlertCircle } from 'lucide-react';

// Full-screen paywall shown when a trial/subscription has expired.
// Kept as its own component so the fixed dark+orange theme is only forced
// while the paywall is on screen (never over the wrapped app).
const ExpiredPaywall: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Always render the paywall in the fixed dark + orange theme, regardless of
  // any custom brand colour or light mode left active from the session.
  useAuthScreenTheme();

  return (
    <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
      >
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Lock size={36} className="text-red-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {tenant?.plan === 'trial' ? 'Your Free Trial Has Ended' : 'Subscription Expired'}
          </h1>
          <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
            {tenant?.plan === 'trial'
              ? 'Your 14-day free trial is over. Choose a plan to continue using VakilDesk. Your data is safe and waiting for you.'
              : 'Your subscription has expired. Renew to continue managing your cases. All your data is safe.'}
          </p>

          {/* What is paused */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-amber-400" />
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">What is paused</p>
            </div>
            <div className="space-y-2">
              {[
                'Adding new cases',
                'Adding new clients',
                'Creating appointments & tasks',
                'Uploading files',
                'All data entry features',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-green-400 text-xs font-medium flex items-center gap-1.5">
                <span>✓</span> Your existing data is safe and fully accessible
              </p>
            </div>
          </div>

          {/* Plans quick view */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { name: 'Basic', price: '₹799' },
              { name: 'Pro', price: '₹1,999' },
              { name: 'Premium', price: '₹4,449' },
              { name: 'Custom', price: 'Contact Us' },
            ].map(p => (
              <div key={p.name} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white text-xs font-semibold mb-0.5">{p.name}</p>
                <p className="text-orange-400 font-bold text-sm">
                  {p.price}
                  {p.price !== 'Contact Us' && <span className="text-gray-500 text-xs font-normal">/mo</span>}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-3"
          >
            <CreditCard size={18} />
            View Plans & Subscribe
          </button>
          <a
            href={`https://wa.me/918693852452?text=I want to subscribe to VakilDesk. My firm: ${tenant?.firm_name || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            💬 Contact Us on WhatsApp
          </a>
          <p className="text-center text-gray-600 text-xs mt-4">
            Logged in as{' '}
            <span className="text-gray-400">{user?.name || user?.username}</span>
            {' '}·{' '}
            {tenant?.firm_name}
          </p>
        </div>
      </div>
  );
};

const SubscriptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isExpired, isTrialing, daysLeftInTrial } = useTenant();
  const navigate = useNavigate();

  // ── HARD BLOCK: Trial or subscription expired ──
  if (isExpired) {
    return <ExpiredPaywall />;
  }

  // ── SOFT WARNING: Trial ending soon ──
  return (
    <div className="flex flex-col min-h-full">
      {isTrialing && daysLeftInTrial <= 5 && (
        <div className="bg-amber-900/40 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-sm flex-shrink-0">
          <span className="text-amber-300 font-medium">
            ⏰{' '}
            {daysLeftInTrial === 0
              ? 'Your trial expires today!'
              : `${daysLeftInTrial} day${daysLeftInTrial === 1 ? '' : 's'} left in your free trial`}
          </span>
          <button
            onClick={() => navigate('/subscription')}
            className="text-amber-400 underline hover:text-amber-300 font-semibold text-xs ml-4 flex-shrink-0"
          >
            Subscribe Now →
          </button>
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default SubscriptionGate;

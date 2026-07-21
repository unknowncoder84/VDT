import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';

// Small dismissible popup that reminds the firm their plan is about to expire.
// Shows within the last 3 days before expiry (trial or paid), never once expired
// (the paywall handles that). Dismissal is remembered for the current day so it
// reminds again the next day but doesn't nag on every navigation.

const dismissKey = (dateStr: string) => `expiryWarnDismissed:${dateStr}`;

const ExpiryWarning: React.FC = () => {
  const { daysUntilExpiry, isExpired, tenant } = useTenant();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [dismissed, setDismissed] = useState<boolean>(
    () => localStorage.getItem(dismissKey(today)) === '1'
  );

  // Only show when: logged in, not already expired, and 0–3 days remain
  const shouldShow =
    isAuthenticated &&
    !!tenant &&
    !isExpired &&
    daysUntilExpiry !== null &&
    daysUntilExpiry <= 3 &&
    !dismissed;

  if (!shouldShow) return null;

  const isTrial = tenant?.plan === 'trial';
  const dLeft = daysUntilExpiry as number;
  const whenText =
    dLeft === 0 ? 'today' : dLeft === 1 ? 'tomorrow' : `in ${dLeft} days`;

  const dismiss = () => {
    localStorage.setItem(dismissKey(today), '1');
    setDismissed(true);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9997] w-[calc(100%-1.5rem)] max-w-md px-3">
      <div className="rounded-2xl border border-amber-500/40 bg-[#1f1a10] shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">
            {isTrial ? 'Your free trial ends ' : 'Your subscription ends '}
            {whenText}
          </p>
          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
            Renew now to keep access. Your data stays safe — nothing is deleted if it lapses.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                dismiss();
                navigate('/subscription');
              }}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              {isTrial ? 'View Plans' : 'Renew Now'}
            </button>
            <button onClick={dismiss} className="text-gray-400 hover:text-white text-sm px-2 py-2">
              Remind me later
            </button>
          </div>
        </div>

        <button onClick={dismiss} className="text-gray-500 hover:text-white flex-shrink-0 p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ExpiryWarning;

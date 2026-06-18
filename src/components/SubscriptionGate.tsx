import React from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isExpired, isTrialing, daysLeftInTrial } = useTenant();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {isTrialing && daysLeftInTrial <= 5 && (
        <div className="bg-amber-900/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-sm">
          <span className="text-amber-300">⏰ {daysLeftInTrial} days left in your free trial</span>
          <button onClick={() => navigate('/subscription')} className="text-amber-400 underline hover:text-amber-300 font-medium">Upgrade Now</button>
        </div>
      )}
      {isExpired && (
        <div className="bg-red-900/40 border-b border-red-500/30 px-4 py-3 flex items-center justify-between">
          <span className="text-red-300 text-sm font-medium">⚠️ Subscription expired — your data is safe but adding new records is paused.</span>
          <button onClick={() => navigate('/subscription')} className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">Renew Now</button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default SubscriptionGate;

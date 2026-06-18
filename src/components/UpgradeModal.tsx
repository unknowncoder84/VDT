import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { planLabel, Plan } from '../lib/planUtils';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  requiredPlan?: Plan;
  featureName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  requiredPlan = 'pro',
  featureName = 'PDF & receipt downloads',
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (!open) return null;

  const card = theme === 'light' ? 'bg-white border-gray-200' : 'glass-dark border-white/10';
  const h = theme === 'light' ? 'text-gray-900' : 'text-white';
  const sub = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const planName = planLabel(requiredPlan);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${card} rounded-2xl p-6 border max-w-sm w-full relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${sub} hover:text-orange-500 transition-colors`}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg">
          <Sparkles className="text-white" size={24} />
        </div>

        <h3 className={`text-xl font-bold ${h} mb-2`}>Upgrade to {planName}</h3>
        <p className={`${sub} text-sm mb-6`}>
          {featureName.charAt(0).toUpperCase() + featureName.slice(1)} are available on the {planName} plan.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => { onClose(); navigate('/subscription'); }}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium py-3 rounded-xl text-sm transition-all"
          >
            See Plans
          </button>
          <button
            onClick={onClose}
            className={`px-5 py-3 rounded-xl font-medium text-sm border transition-all ${
              theme === 'light'
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'border-white/10 text-white hover:bg-white/5'
            }`}
          >
            Not now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradeModal;

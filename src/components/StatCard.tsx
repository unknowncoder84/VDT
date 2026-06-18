import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  color: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, count, color, delay }) => {
  const { theme } = useTheme();
  
  const colorClasses: Record<string, string> = {
    purple: 'from-violet-500 to-purple-500',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-green-500',
    red: 'from-red-500 to-rose-500',
    cyan: 'from-cyan-500 to-teal-500',
    pink: 'from-pink-500 to-rose-500',
  };

  const cardBg = theme === 'light' 
    ? 'bg-white/95 backdrop-blur-xl border-gray-200 hover:border-orange-400 shadow-md hover:shadow-lg' 
    : 'glass-dark border-cyber-blue/20 hover:border-cyber-blue/50';
  const titleClass = theme === 'light' ? 'text-gray-700 font-semibold' : 'text-cyber-blue/60';
  const countClass = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue text-glow';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05, boxShadow: theme === 'light' ? '0 10px 40px rgba(139, 92, 246, 0.15)' : '0 0 30px rgba(0, 255, 255, 0.4)' }}
      className={`${cardBg} p-6 rounded-xl cursor-pointer transition-all duration-300 border`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`${titleClass} text-sm font-medium font-cyber uppercase tracking-wider`}>{title}</p>
          <p className={`text-3xl font-bold font-cyber mt-2 ${countClass}`}>{count}</p>
        </div>
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-lg border border-white/20`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;

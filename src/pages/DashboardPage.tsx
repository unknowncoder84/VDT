import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Clock,
  ThumbsUp,
  ThumbsDown,
  FileText,
  CheckCircle,
  Scale,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import Calendar from '../components/Calendar';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, tasks } = useData();
  const { theme } = useTheme();

  // Calculate pending tasks count - only pending status tasks
  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'pending').length;
  }, [tasks]);

  // Calculate statistics dynamically from actual case data
  // These stats update automatically when cases array changes (via real-time subscription)
  const stats = useMemo(() => {
    const myCases = cases.length;
    // Handle both uppercase and lowercase values for interim relief
    const irFavor = cases.filter((c) => 
      c.interimRelief?.toLowerCase() === 'favor'
    ).length;
    const irAgainst = cases.filter((c) => 
      c.interimRelief?.toLowerCase() === 'against'
    ).length;
    // Handle both formats: 'non-circulated', 'NON CIRCULATED', 'non circulated'
    const nonCirculated = cases.filter((c) => {
      const status = c.circulationStatus?.toLowerCase().replace(/\s+/g, '-');
      return status === 'non-circulated' || !c.circulationStatus;
    }).length;
    const circulated = cases.filter((c) => {
      const status = c.circulationStatus?.toLowerCase().replace(/\s+/g, '-');
      return status === 'circulated' || status === 'circulation';
    }).length;

    console.log('📊 Dashboard Stats Updated:', { 
      myCases, 
      pendingTasks: pendingTasksCount, 
      irFavor, 
      irAgainst, 
      nonCirculated, 
      circulated,
      casesData: cases.map(c => ({ id: c.id, circulationStatus: c.circulationStatus, interimRelief: c.interimRelief }))
    });
    return { myCases, irFavor, irAgainst, nonCirculated, circulated };
  }, [cases, pendingTasksCount]);

  // Dynamic stat cards - each card shows real-time count and navigates to filtered view
  // Clean white cards with colored icons (matching reference design)
  const statCards = [
    { 
      title: 'MY CASES', 
      count: stats.myCases, 
      iconBg: 'bg-blue-500', 
      icon: Briefcase, 
      path: '/cases', 
      linkColor: 'text-blue-500'
    },
    { 
      title: 'PENDING TASKS', 
      count: pendingTasksCount, 
      iconBg: 'bg-amber-500', 
      icon: Clock, 
      path: '/tasks?filter=pending', 
      linkColor: 'text-amber-500'
    },
    { 
      title: 'IR FAVOR', 
      count: stats.irFavor, 
      iconBg: 'bg-emerald-500', 
      icon: ThumbsUp, 
      path: '/cases?filter=ir-favor', 
      linkColor: 'text-emerald-500'
    },
    { 
      title: 'IR AGAINST', 
      count: stats.irAgainst, 
      iconBg: 'bg-rose-500', 
      icon: ThumbsDown, 
      path: '/cases?filter=ir-against', 
      linkColor: 'text-rose-500'
    },
    { 
      title: 'NON CIRCULATED', 
      count: stats.nonCirculated, 
      iconBg: 'bg-cyan-500', 
      icon: FileText, 
      path: '/cases?filter=non-circulated', 
      linkColor: 'text-cyan-500'
    },
    { 
      title: 'CIRCULATED', 
      count: stats.circulated, 
      iconBg: 'bg-green-500', 
      icon: CheckCircle, 
      path: '/cases?filter=circulated', 
      linkColor: 'text-green-500'
    },
  ];

  const cardBg = theme === 'light' ? 'bg-white/95 backdrop-blur-2xl border-gray-200 shadow-md' : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60';

  return (
    <MainLayout>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
          <Scale className="text-cyber-blue animate-scale-balance" size={24} />
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold font-cyber ${textPrimary}`}>
            Welcome back, <span className="holographic-text">{user?.name || 'User'}</span>
          </h1>
        </div>
        <p className={`${textSecondary} text-base md:text-lg font-court`}>Here's what's happening with your cases today</p>
      </motion.div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          // Clean white/dark cards with colored icons (matching reference design)
          const cardClass = theme === 'light'
            ? 'bg-white border-gray-100 hover:shadow-lg shadow-sm'
            : 'bg-gray-800/90 border-gray-700/50 hover:border-gray-600';
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => navigate(stat.path)}
              className={`relative p-4 md:p-5 rounded-2xl cursor-pointer group border transition-all duration-300 ${cardClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{stat.title}</p>
                  <p className={`text-3xl md:text-4xl font-bold mt-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stat.count}</p>
                  <div className={`flex items-center gap-1 mt-3 text-sm ${stat.linkColor} group-hover:translate-x-1 transition-transform`}>
                    <span>→ View details</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className={`lg:col-span-2 ${cardBg} rounded-2xl p-6 border shadow-card`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
              <FileText size={20} className="text-white" />
            </div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>Case Statistics</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200/10">
                {[
                  { label: 'Consultation', value: cases.filter((c) => c.stage === 'consultation').length, filter: 'consultation' },
                  { label: 'Drafting', value: cases.filter((c) => c.stage === 'drafting').length, filter: 'drafting' },
                  { label: 'Filing', value: cases.filter((c) => c.stage === 'filing').length, filter: 'filing' },
                  { label: 'Circulation', value: stats.circulated, filter: 'circulated' },
                  { label: 'Notice', value: cases.filter((c) => c.stage === 'notice').length, filter: 'notice' },
                  { label: 'Pre Admission', value: cases.filter((c) => c.stage === 'pre-admission').length, filter: 'pre-admission' },
                  { label: 'Admitted', value: cases.filter((c) => c.stage === 'admitted').length, filter: 'admitted' },
                  { label: 'Final Hearing', value: cases.filter((c) => c.stage === 'final-hearing').length, filter: 'final-hearing' },
                  { label: 'Reserved For Judgement', value: cases.filter((c) => c.stage === 'reserved').length, filter: 'reserved' },
                  { label: 'Disposed', value: cases.filter((c) => c.stage === 'disposed').length, filter: 'disposed' },
                ].map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => navigate(`/cases?filter=${row.filter}`)}
                    className={`${theme === 'light' ? 'hover:bg-orange-50/80' : 'hover:bg-white/5'} transition-colors cursor-pointer group`}
                  >
                    <td className={`py-3 px-4 uppercase text-sm font-semibold tracking-wide ${theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60'}`}>
                      <span className="flex items-center gap-2">
                        {row.label}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">→</span>
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-cyber-blue'}`}>
                      {row.value > 0 ? (
                        <span className="inline-flex items-center gap-2">
                          {row.value}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${row.value > 0 ? 'bg-green-500/20 text-green-500' : ''}`}>
                            {row.value > 0 && 'active'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">{row.value}</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr 
                  onClick={() => navigate('/cases')}
                  className={`${theme === 'light' ? 'bg-orange-100/50 hover:bg-orange-200/50' : 'bg-orange-500/10 hover:bg-orange-500/20'} cursor-pointer transition-colors`}
                >
                  <td className={`py-4 px-4 uppercase text-sm font-bold tracking-wide ${theme === 'light' ? 'text-orange-700' : 'text-orange-400'}`}>Total Cases</td>
                  <td className={`py-4 px-4 text-right font-bold text-xl ${theme === 'light' ? 'text-orange-700' : 'text-orange-400'}`}>{cases.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="space-y-4"
        >
          <button 
            onClick={() => navigate(`/events/${format(new Date(), 'yyyy-MM-dd')}`)}
            className="w-full bg-gradient-cyber text-white font-bold font-cyber py-4 rounded-2xl hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
          >
            View Today's Events
          </button>
          <Calendar />
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;

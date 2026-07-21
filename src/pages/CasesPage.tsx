import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportData';
import { Case } from '../types';
import { formatIndianDate } from '../utils/dateFormat';
import { canAccess } from '../lib/planUtils';
import { useTenant } from '../contexts/TenantContext';

type CaseView = 'my-cases' | 'all-cases' | 'office-cases';

// Helper function to get readable filter label
const getFilterLabel = (filter: string): string => {
  const labels: Record<string, string> = {
    'ir-favor': 'IR Favor',
    'ir-against': 'IR Against',
    'circulated': 'Circulated',
    'non-circulated': 'Non Circulated',
    'consultation': 'Consultation Stage',
    'drafting': 'Drafting Stage',
    'filing': 'Filing Stage',
    'circulation': 'Circulation Stage',
    'notice': 'Notice Stage',
    'pre-admission': 'Pre Admission Stage',
    'admitted': 'Admitted Stage',
    'final-hearing': 'Final Hearing Stage',
    'reserved': 'Reserved for Judgement',
    'disposed': 'Disposed',
    'pending': 'Pending Status',
    'active': 'Active Status',
    'closed': 'Closed Status',
  };
  return labels[filter] || filter.replace(/-/g, ' ').toUpperCase();
};

// Helper function to get filter badge style
const getFilterBadgeStyle = (filter: string): string => {
  if (filter === 'ir-favor') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (filter === 'ir-against') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (filter === 'circulated') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (filter === 'non-circulated') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
};

const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cases } = useData();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const { tenant } = useTenant();
  const canExport = canAccess(tenant?.plan || 'trial', 'pro');
  const [activeTab, setActiveTab] = useState<CaseView>('all-cases');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'none' | 'fileNo-asc' | 'fileNo-desc'>('none');

  // Read filter from URL on mount and when URL changes
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setStatusFilter(filter);
    } else {
      setStatusFilter('');
    }
  }, [searchParams]);

  // Filter cases based on active tab, search, and status filter
  const filteredCases = useMemo(() => {
    let filtered = cases;

    switch (activeTab) {
      case 'my-cases':
        filtered = cases.slice(0, 1);
        break;
      case 'all-cases':
        filtered = cases;
        break;
      case 'office-cases':
        filtered = cases.slice(0, 2);
        break;
    }

    // Apply status filter from URL
    if (statusFilter) {
      filtered = filtered.filter((c) => {
        switch (statusFilter) {
          // Stage filters
          case 'consultation':
          case 'drafting':
          case 'filing':
          case 'circulation':
          case 'notice':
          case 'pre-admission':
          case 'admitted':
          case 'final-hearing':
          case 'reserved':
          case 'disposed':
            return c.stage === statusFilter;
          // Legacy status filters
          case 'pending':
            return c.status === 'pending';
          case 'active':
            return c.status === 'active';
          case 'closed':
            return c.status === 'closed';
          // Circulation filters with improved logic
          case 'circulated':
            // Show only circulated cases with future next date
            const circulatedDate = c.nextDate ? new Date(c.nextDate) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Handle both formats: 'circulated', 'CIRCULATED'
            const isCirculated = c.circulationStatus?.toLowerCase().replace(/\s+/g, '-') === 'circulated';
            return (
              isCirculated &&
              circulatedDate &&
              circulatedDate >= today
            );
          case 'non-circulated':
            // Show ONLY cases that meet ALL these conditions:
            // 1. Marked as non-circulated OR
            // 2. Have no next date OR
            // 3. Have a past next date (but NOT future dates)
            const nonCirculatedDate = c.nextDate ? new Date(c.nextDate) : null;
            const todayNonCirc = new Date();
            todayNonCirc.setHours(0, 0, 0, 0);
            
            // Handle both formats: 'non-circulated', 'NON CIRCULATED'
            const circStatus = c.circulationStatus?.toLowerCase().replace(/\s+/g, '-');
            const isCirculatedStatus = circStatus === 'circulated';
            
            // If case is explicitly marked as circulated with a future date, exclude it
            if (isCirculatedStatus && nonCirculatedDate && nonCirculatedDate >= todayNonCirc) {
              return false;
            }
            
            // Include if: marked as non-circulated OR no date OR past date
            return (
              circStatus === 'non-circulated' || !c.circulationStatus ||
              !nonCirculatedDate ||
              nonCirculatedDate < todayNonCirc
            );
          // Interim Relief filters - handle both uppercase and lowercase
          case 'ir-favor':
            return c.interimRelief?.toLowerCase() === 'favor';
          case 'ir-against':
            return c.interimRelief?.toLowerCase() === 'against';
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.fileNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.partiesName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'fileNo-asc') {
      filtered = [...filtered].sort((a, b) => {
        const numA = parseInt(a.fileNo) || 0;
        const numB = parseInt(b.fileNo) || 0;
        return numA - numB;
      });
    } else if (sortBy === 'fileNo-desc') {
      filtered = [...filtered].sort((a, b) => {
        const numA = parseInt(a.fileNo) || 0;
        const numB = parseInt(b.fileNo) || 0;
        return numB - numA;
      });
    }

    return filtered;
  }, [cases, activeTab, searchTerm, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      closed: 'bg-gray-500/20 text-gray-400',
      'on-hold': 'bg-orange-500/20 text-orange-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const cardBg = theme === 'light' ? 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-md' : 'glass-dark border-cyber-blue/20';
  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20';
  const hoverClass = theme === 'light' ? 'hover:bg-orange-50/80' : 'hover:bg-cyber-blue/10';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const headerBgClass = theme === 'light' ? 'bg-gray-100' : 'bg-cyber-blue/10';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60';

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} p-5 md:p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold font-cyber ${textPrimary}`}>
              Case Management <span className="text-cyber-blue text-glow">({filteredCases.length})</span>
            </h1>
            <p className={`mt-1 ${textSecondary} font-court`}>
              {statusFilter 
                ? `Showing ${getFilterLabel(statusFilter)} cases` 
                : `Showing results for ${activeTab === 'my-cases' ? 'My Cases' : activeTab === 'all-cases' ? 'All Cases' : 'Office Cases'}`
              }
            </p>
          </div>
          {statusFilter && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getFilterBadgeStyle(statusFilter)}`}>
                {getFilterLabel(statusFilter)}
              </span>
              <button
                onClick={() => {
                  setStatusFilter('');
                  navigate('/cases');
                }}
                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        <p className={`text-xs font-semibold uppercase mb-2 ${textSecondary}`}>Quick Filters</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'IR Favor', filter: 'ir-favor', color: 'from-green-500 to-emerald-500', borderColor: 'border-green-500/30' },
            { label: 'IR Against', filter: 'ir-against', color: 'from-red-500 to-orange-500', borderColor: 'border-red-500/30' },
            { label: 'Circulated', filter: 'circulated', color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-500/30' },
            { label: 'Non Circulated', filter: 'non-circulated', color: 'from-yellow-500 to-orange-500', borderColor: 'border-yellow-500/30' },
          ].map((item) => (
            <button
              key={item.filter}
              onClick={() => {
                setStatusFilter(item.filter);
                navigate(`/cases?filter=${item.filter}`);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                statusFilter === item.filter
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                  : theme === 'light'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : `bg-white/10 text-gray-300 hover:bg-white/20 border ${item.borderColor}`
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Sort Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.075 }}
        className="mb-4"
      >
        <p className={`text-xs font-semibold uppercase mb-2 ${textSecondary}`}>Sort Cases</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`px-4 py-2 rounded-xl border font-medium transition-all duration-200 ${
            theme === 'light'
              ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              : 'bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-orange-500`}
        >
          <option value="none">Default Order</option>
          <option value="fileNo-asc">📈 File No: Low to High</option>
          <option value="fileNo-desc">📉 File No: High to Low</option>
        </select>
      </motion.div>

      {/* Export Buttons and Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4"
      >
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => {
              if (!canExport) { alert('Export is available on Pro plan and above.\nUpgrade at the Subscription page.'); return; }
              exportToCSV(filteredCases, `cases_${new Date().getTime()}.csv`);
            }}
            className={`flex-1 md:flex-none justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold font-cyber hover:shadow-orange transition-all duration-300 text-sm border border-orange-500/30 flex items-center gap-2 ${!canExport ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span>📊</span> CSV
          </button>
          <button
            onClick={() => {
              if (!canExport) { alert('Export is available on Pro plan and above.\nUpgrade at the Subscription page.'); return; }
              exportToExcel(filteredCases, `cases_${new Date().getTime()}.xlsx`);
            }}
            className={`flex-1 md:flex-none justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold font-cyber hover:shadow-orange transition-all duration-300 text-sm border border-orange-500/30 flex items-center gap-2 ${!canExport ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span>📑</span> EXCEL
          </button>
          <button
            onClick={() => {
              if (!canExport) { alert('Export is available on Pro plan and above.\nUpgrade at the Subscription page.'); return; }
              exportToPDF(filteredCases, `cases_${new Date().getTime()}.pdf`);
            }}
            className={`flex-1 md:flex-none justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold font-cyber hover:shadow-orange transition-all duration-300 text-sm border border-orange-500/30 flex items-center gap-2 ${!canExport ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span>📄</span> PDF
          </button>
        </div>

        <div className="relative">
          <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSecondary}`} />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-11 pr-4 py-2.5 rounded-xl border ${inputBgClass} focus:outline-none focus:border-orange-500 transition-all w-full sm:w-64`}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['my-cases', 'all-cases', 'office-cases'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl font-medium font-cyber transition-all duration-300 whitespace-nowrap text-sm ${
              activeTab === tab
                ? 'bg-gradient-cyber text-white shadow-cyber border border-cyber-blue/50'
                : theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-cyber-blue/10 text-cyber-blue/60 hover:bg-cyber-blue/20 hover:text-cyber-blue border border-cyber-blue/20'
            }`}
          >
            {tab === 'my-cases' && 'My Cases'}
            {tab === 'all-cases' && 'All Cases'}
            {tab === 'office-cases' && 'Office Cases'}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCases.length > 0 ? (
          filteredCases.map((caseItem: Case, index: number) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`${cardBg} p-5 rounded-2xl border`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className={`font-semibold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{caseItem.clientName}</p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                    File No: {caseItem.fileNo}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                  {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                </span>
              </div>
              <div className={`grid grid-cols-2 gap-2 text-sm mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-gray-300'}`}>
                <div>
                  <span className={theme === 'light' ? 'text-gray-600 font-medium' : 'text-gray-400'}>Next Date:</span>
                  <p className="font-semibold">{formatIndianDate(caseItem.nextDate)}</p>
                </div>
                <div>
                  <span className={theme === 'light' ? 'text-gray-600 font-medium' : 'text-gray-400'}>Case Type:</span>
                  <p className="font-semibold">{caseItem.caseType}</p>
                </div>
                <div>
                  <span className={theme === 'light' ? 'text-gray-600 font-medium' : 'text-gray-400'}>Reg No:</span>
                  <p className="font-semibold">{caseItem.regNo}</p>
                </div>
                <div>
                  <span className={theme === 'light' ? 'text-gray-600 font-medium' : 'text-gray-400'}>Parties:</span>
                  <p className="truncate font-semibold">{caseItem.partiesName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  className="flex-1 bg-gradient-cyber text-white py-3 rounded-xl font-semibold font-cyber hover:shadow-cyber transition-all border border-cyber-blue/30"
                >
                  View Details
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => navigate(`/cases/${caseItem.id}/edit`)}
                    className="px-4 py-3 rounded-xl font-semibold font-cyber transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg border border-amber-500/30 flex items-center justify-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`${cardBg} p-8 rounded-2xl border text-center`}>
            <p className={textSecondary}>No cases found</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`hidden md:block ${cardBg} rounded-2xl overflow-hidden border`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderClass} ${headerBgClass}`}>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>SR</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CLIENT NAME</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>FILE NO</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>NEXT DATE</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm hidden lg:table-cell ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>REG NO</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>STATUS</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm hidden lg:table-cell ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CASE TYPE</th>
                <th className={`text-left py-4 px-4 lg:px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length > 0 ? (
                filteredCases.map((caseItem: Case, index: number) => (
                  <tr
                    key={caseItem.id}
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                    className={`border-b ${borderClass} ${hoverClass} transition-colors duration-200 cursor-pointer`}
                  >
                    <td className="py-4 px-4 lg:px-6 text-sm">{index + 1}</td>
                    <td className="py-4 px-4 lg:px-6 font-medium text-sm">{caseItem.clientName}</td>
                    <td className="py-4 px-4 lg:px-6 text-sm">{caseItem.fileNo}</td>
                    <td className="py-4 px-4 lg:px-6 text-sm">
                      {formatIndianDate(caseItem.nextDate)}
                    </td>
                    <td className="py-4 px-4 lg:px-6 text-sm hidden lg:table-cell">{caseItem.regNo}</td>
                    <td className="py-4 px-4 lg:px-6">
                      <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 lg:px-6 text-sm hidden lg:table-cell">{caseItem.caseType}</td>
                    <td className="py-4 px-4 lg:px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate(`/cases/${caseItem.id}`)}
                          className="px-4 py-2 rounded-lg font-medium font-cyber transition-all text-sm bg-gradient-cyber text-white hover:shadow-cyber border border-cyber-blue/30"
                        >
                          View
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => navigate(`/cases/${caseItem.id}/edit`)}
                            className="px-4 py-2 rounded-lg font-medium font-cyber transition-all text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg border border-amber-500/30 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                        <Search size={32} className={theme === 'light' ? 'text-gray-400' : 'text-gray-500'} />
                      </div>
                      <p className={`font-semibold text-lg ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        No cases found
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {searchTerm || statusFilter
                          ? 'Try adjusting your search or filter.'
                          : "Click 'New Case' to add your first case."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default CasesPage;

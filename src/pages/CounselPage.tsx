import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Download, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const CounselPage: React.FC = () => {
  const navigate = useNavigate();
  const { counsel, deleteCounsel } = useData();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCounsel = counsel.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm)
  );

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';
  const hoverClass = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-cyber-blue/10';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const headerBgClass = theme === 'light' ? 'bg-gray-100' : 'bg-cyber-blue/10';

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-4 md:p-6 rounded-lg mb-4 md:mb-6 border ${borderClass}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className={`text-xl md:text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>Counsel Management</h1>
          <button 
            onClick={() => navigate('/counsel/create')}
            className="bg-gradient-cyber text-white px-4 md:px-6 py-2 rounded-lg hover:shadow-cyber transition-all duration-300 flex items-center gap-2 text-sm md:text-base font-cyber border border-cyber-blue/30"
          >
            <Plus size={18} />
            CREATE COUNCILLOR
          </button>
        </div>
      </motion.div>

      {/* Export and Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 md:mb-6 gap-3"
      >
        <div className="flex gap-2 flex-wrap">
          <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 md:px-4 py-2 rounded font-semibold font-cyber hover:shadow-orange transition-all flex items-center gap-1 text-sm border border-orange-500/30">
            <Download size={16} />
            CSV
          </button>
          <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 md:px-4 py-2 rounded font-semibold font-cyber hover:shadow-orange transition-all flex items-center gap-1 text-sm border border-orange-500/30">
            <Download size={16} />
            EXCEL
          </button>
          <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 md:px-4 py-2 rounded font-semibold font-cyber hover:shadow-orange transition-all flex items-center gap-1 text-sm border border-orange-500/30">
            <FileText size={16} />
            PDF
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm hidden sm:inline">SEARCH:</span>
          <input
            type="text"
            placeholder="Search counsel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber text-sm`}
          />
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Search size={18} />
          </button>
        </div>
      </motion.div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCounsel.length > 0 ? (
          filteredCounsel.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`${bgClass} p-4 rounded-xl border ${borderClass}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg">{c.name}</p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{c.mobile}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyber-blue/20 text-cyber-blue text-xs font-medium font-cyber border border-cyber-blue/30">
                  {c.totalCases} Cases
                </span>
              </div>
              <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                Created by: {c.createdBy}
              </p>
              <div className="flex gap-2">
                <button className="flex-1 bg-gradient-cyber text-white py-2 rounded font-semibold font-cyber text-sm border border-cyber-blue/30">
                  DETAILS
                </button>
                <button 
                  onClick={() => deleteCounsel(c.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`${bgClass} p-8 rounded-xl border ${borderClass} text-center`}>
            <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>No counsel found</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`hidden md:block ${bgClass} rounded-xl overflow-hidden border ${borderClass}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderClass} ${headerBgClass}`}>
                <th className={`text-left py-4 px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>SR</th>
                <th className={`text-left py-4 px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>COUNSEL NAME</th>
                <th className={`text-left py-4 px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>MOBILE</th>
                <th className={`text-left py-4 px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>TOTAL CASES</th>
                <th className={`text-left py-4 px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CREATED BY</th>
                <th className={`text-left py-4 px-6 font-semibold text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCounsel.length > 0 ? (
                filteredCounsel.map((c, index) => (
                  <tr key={c.id} className={`border-b ${borderClass} ${hoverClass} transition-colors`}>
                    <td className="py-4 px-6">{index + 1}</td>
                    <td className="py-4 px-6 font-medium">{c.name}</td>
                    <td className="py-4 px-6">{c.mobile}</td>
                    <td className="py-4 px-6">{c.totalCases}</td>
                    <td className="py-4 px-6">{c.createdBy}</td>
                    <td className="py-4 px-6">
                      <button className={`px-4 py-2 rounded font-semibold text-sm ${
                        theme === 'light' 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}>
                        DETAILS
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center">
                    <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>No counsel found</p>
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

export default CounselPage;

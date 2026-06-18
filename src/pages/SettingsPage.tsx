import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Trash2, MapPin } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { 
    courts, caseTypes, districts, addCourt, deleteCourt, addCaseType, deleteCaseType,
    addDistrict, deleteDistrict,
  } = useData();
  const [courtName, setCourtName] = useState('');
  const [caseTypeName, setCaseTypeName] = useState('');
  const [districtName, setDistrictName] = useState('');

  const handleAddCourt = () => {
    if (courtName.trim()) {
      addCourt(courtName);
      setCourtName('');
    }
  };

  const handleAddCaseType = () => {
    if (caseTypeName.trim()) {
      addCaseType(caseTypeName);
      setCaseTypeName('');
    }
  };

  const handleAddDistrict = () => {
    if (districtName.trim()) {
      addDistrict(districtName);
      setDistrictName('');
    }
  };

  const cardBg = theme === 'light' ? 'bg-white/90 backdrop-blur-xl border-gray-200/50' : 'glass-dark border-cyber-blue/20';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const itemBgClass = theme === 'light' ? 'bg-gray-50' : 'bg-cyber-blue/10';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60';

  return (
    <MainLayout>
      <h1 className={`text-2xl md:text-4xl font-bold font-cyber mb-8 ${textPrimary}`}>Settings</h1>

      {/* Theme Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>Appearance</h2>
            <p className={`text-sm mt-1 ${textSecondary}`}>Customize how the app looks</p>
          </div>
          <button
            onClick={toggleTheme}
            className="bg-gradient-cyber text-white px-6 py-3 rounded-xl hover:shadow-cyber transition-all duration-300 flex items-center gap-2 font-medium font-cyber border border-cyber-blue/30"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </motion.div>

      {/* Court Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>Court Management</h2>
        <p className={`text-sm mb-4 ${textSecondary}`}>Add and manage courts for case filing</p>
        
        {/* Add Court Form */}
        <div className="mb-6">
          <label className={`block text-sm font-semibold mb-2 ${textSecondary}`}>Add New Court</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="Enter court name (e.g., High Court of Mumbai)"
              rows={2}
              className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:border-orange-500 transition-colors resize-none ${inputBgClass}`}
            />
            <button
              onClick={handleAddCourt}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:shadow-cyber transition-all duration-300 font-medium font-cyber border border-orange-500/30 self-start"
            >
              Add Court
            </button>
          </div>
        </div>

        {/* Courts List with Dropdown */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${textSecondary}`}>Existing Courts ({courts.length})</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {courts.length === 0 ? (
              <p className={`text-center py-6 ${textSecondary}`}>No courts added yet</p>
            ) : (
              courts.map((court) => (
                <div key={court.id} className={`flex items-center justify-between ${itemBgClass} p-4 rounded-xl hover:shadow-md transition-all`}>
                  <span className={`${textPrimary} font-medium`}>{court.name}</span>
                  <button
                    onClick={() => deleteCourt(court.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete Court"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Case Type Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <h2 className={`text-xl font-bold mb-4 ${textPrimary}`}>Case Type Management</h2>
        <p className={`text-sm mb-4 ${textSecondary}`}>Add and manage case types for categorization</p>
        
        {/* Add Case Type Form */}
        <div className="mb-6">
          <label className={`block text-sm font-semibold mb-2 ${textSecondary}`}>Add New Case Type</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={caseTypeName}
              onChange={(e) => setCaseTypeName(e.target.value)}
              placeholder="Enter case type (e.g., Civil, Criminal, Family Law)"
              rows={2}
              className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:border-orange-500 transition-colors resize-none ${inputBgClass}`}
            />
            <button
              onClick={handleAddCaseType}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:shadow-cyber transition-all duration-300 font-medium font-cyber border border-orange-500/30 self-start"
            >
              Add Type
            </button>
          </div>
        </div>

        {/* Case Types List with Dropdown */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${textSecondary}`}>Existing Case Types ({caseTypes.length})</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {caseTypes.length === 0 ? (
              <p className={`text-center py-6 ${textSecondary}`}>No case types added yet</p>
            ) : (
              caseTypes.map((ct) => (
                <div key={ct.id} className={`flex items-center justify-between ${itemBgClass} p-4 rounded-xl hover:shadow-md transition-all`}>
                  <span className={`${textPrimary} font-medium`}>{ct.name}</span>
                  <button
                    onClick={() => deleteCaseType(ct.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete Case Type"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* District Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>District Management</h2>
            <p className={`text-sm ${textSecondary}`}>Add and manage districts for case filing</p>
          </div>
        </div>
        
        {/* Add District Form */}
        <div className="mb-6">
          <label className={`block text-sm font-semibold mb-2 ${textSecondary}`}>Add New District</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder="Enter district name (e.g., Mumbai, Pune, Nagpur)"
              rows={2}
              className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:border-green-500 transition-colors resize-none ${inputBgClass}`}
            />
            <button
              onClick={handleAddDistrict}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-medium font-cyber border border-green-500/30 self-start"
            >
              Add District
            </button>
          </div>
        </div>

        {/* Districts List */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${textSecondary}`}>Existing Districts ({districts.length})</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {districts.length === 0 ? (
              <p className={`text-center py-6 ${textSecondary}`}>No districts added yet</p>
            ) : (
              districts.map((district) => (
                <div key={district.id} className={`flex items-center justify-between ${itemBgClass} p-4 rounded-xl hover:shadow-md transition-all`}>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-green-500" />
                    <span className={`${textPrimary} font-medium`}>{district.name}</span>
                  </div>
                  <button
                    onClick={() => deleteDistrict(district.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete District"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default SettingsPage;

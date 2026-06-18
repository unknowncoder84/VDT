import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  label?: string;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange, label }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    const [year] = value.split('-');
    return parseInt(year);
  });

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentMonth = useMemo(() => {
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [value]);

  const currentMonthIndex = useMemo(() => {
    const [, month] = value.split('-');
    return parseInt(month) - 1;
  }, [value]);

  const handleMonthSelect = (monthIndex: number) => {
    const newValue = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const newValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const bgClass = theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800/90 border-gray-700';
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-white';
  const hoverClass = theme === 'light' ? 'hover:bg-orange-100' : 'hover:bg-orange-500/20';
  const selectedClass = theme === 'light' ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white';

  return (
    <div className="relative">
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
          {label}
        </label>
      )}
      
      {/* Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg border font-medium ${bgClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all min-w-[200px] text-left flex items-center justify-between`}
      >
        <span className="text-orange-500 font-bold">{currentMonth}</span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Picker */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Picker Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-full mt-2 left-0 z-50 ${bgClass} rounded-xl shadow-2xl border p-4 min-w-[320px]`}
            >
              {/* Year Selector */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-600">
                <button
                  onClick={() => handleYearChange('prev')}
                  className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className={`text-lg font-bold ${textClass}`}>{selectedYear}</span>
                <button
                  onClick={() => handleYearChange('next')}
                  className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {months.map((month, index) => {
                  const isSelected = selectedYear === parseInt(value.split('-')[0]) && index === currentMonthIndex;
                  return (
                    <button
                      key={month}
                      onClick={() => handleMonthSelect(index)}
                      className={`py-2 px-3 rounded-lg font-medium transition-all ${
                        isSelected
                          ? selectedClass
                          : `${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} ${hoverClass}`
                      }`}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-600">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex-1 py-2 rounded-lg font-medium ${theme === 'light' ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10'} transition-colors`}
                >
                  Clear
                </button>
                <button
                  onClick={handleThisMonth}
                  className={`flex-1 py-2 rounded-lg font-medium ${theme === 'light' ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10'} transition-colors`}
                >
                  This month
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthYearPicker;

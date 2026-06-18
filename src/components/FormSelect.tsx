import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
}) => {
  const { theme } = useTheme();
  
  const labelClass = theme === 'light' 
    ? 'text-sm font-medium text-gray-700 mb-2' 
    : 'text-sm font-medium text-orange-300 mb-2';
    
  const selectClass = theme === 'light'
    ? `px-4 py-2.5 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all ${
        error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
      }`
    : `px-4 py-2.5 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all ${
        error ? 'border-red-400 focus:border-red-500' : 'border-orange-500/30 focus:border-orange-500'
      }`;
      
  const optionClass = theme === 'light' 
    ? 'bg-white text-gray-900' 
    : 'bg-gray-800 text-white';
      
  const errorClass = theme === 'light' 
    ? 'text-red-500 text-sm mt-1' 
    : 'text-red-400 text-sm mt-1';
    
  const requiredClass = theme === 'light' ? 'text-red-500 ml-1' : 'text-orange-400 ml-1';
  
  return (
    <div className="flex flex-col">
      <label className={labelClass}>
        {label}
        {required && <span className={requiredClass}>*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={selectClass}
      >
        <option value="" className={optionClass}>Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className={optionClass}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
};

export default FormSelect;

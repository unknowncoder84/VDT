import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
}) => {
  const { theme } = useTheme();
  
  const labelClass = theme === 'light' 
    ? 'text-sm font-medium text-gray-700 mb-2' 
    : 'text-sm font-medium text-orange-300 mb-2';
    
  const inputClass = theme === 'light'
    ? `px-4 py-2.5 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all ${
        error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
      }`
    : `px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all ${
        error ? 'border-red-400 focus:border-red-500' : 'border-orange-500/30 focus:border-orange-500'
      }`;
      
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
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
      {error && <span className={errorClass}>{error}</span>}
    </div>
  );
};

export default FormInput;

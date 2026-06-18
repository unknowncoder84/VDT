import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import CreateCaseForm from '../components/CreateCaseForm';
import { useTheme } from '../contexts/ThemeContext';

const CreateCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';

  const handleSuccess = () => {
    navigate('/cases');
  };

  const handleClose = () => {
    navigate('/cases');
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-6 rounded-lg mb-6 border ${borderClass}`}
      >
        <h1 className={`text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>Create New Case</h1>
        <p className={`mt-2 font-court ${theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60'}`}>
          Fill in the details below to create a new case
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${bgClass} p-6 rounded-xl border ${borderClass}`}
      >
        <CreateCaseForm onSuccess={handleSuccess} onClose={handleClose} />
      </motion.div>
    </MainLayout>
  );
};

export default CreateCasePage;

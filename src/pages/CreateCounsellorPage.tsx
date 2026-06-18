import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import FormInput from '../components/FormInput';
import RichTextEditor from '../components/RichTextEditor';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const CreateCounsellorPage: React.FC = () => {
  const { theme } = useTheme();
  const { addCounsel } = useData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    alternateNumber: '',
    address: '',
    details: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCounsel = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      address: formData.address,
      details: formData.details,
      totalCases: 0,
      createdBy: 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addCounsel(newCounsel);
    navigate('/counsel');
  };

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-6 rounded-lg mb-6 border ${borderClass}`}
      >
        <h1 className={`text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>Create New Counsel Account</h1>
        <p className={`mt-2 font-court ${theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60'}`}>
          Fill in the details below to create a new counsellor
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${bgClass} p-8 rounded-xl border ${borderClass}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Counsel Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="COUNSEL NAME"
              name="name"
              type="text"
              placeholder="Counsel/Firm Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FormInput
              label="EMAIL"
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Mobile Number and Alternate Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="MOBILE NUMBER"
              name="mobile"
              type="tel"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              required
            />
            <FormInput
              label="ALTERNATE NUMBER"
              name="alternateNumber"
              type="tel"
              placeholder="Alternate Number"
              value={formData.alternateNumber}
              onChange={(e) => setFormData({ ...formData, alternateNumber: e.target.value })}
            />
          </div>

          {/* Address */}
          <div>
            <FormInput
              label="ADDRESS"
              name="address"
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Additional Details */}
          <div>
            <RichTextEditor
              label="ADDITIONAL DETAILS"
              value={formData.details}
              onChange={(value) => setFormData({ ...formData, details: value })}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/counsel')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-cyber text-white px-8 py-3 rounded-lg font-semibold font-cyber hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
            >
              CREATE COUNSELLOR
            </button>
          </div>

          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mt-4`}>
            Once the counsellor is created, you will be able to add cases to the counsellor
          </p>
        </form>
      </motion.div>
    </MainLayout>
  );
};

export default CreateCounsellorPage;

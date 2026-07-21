import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Search, Plus, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportData';
import GatedFeature from '../components/GatedFeature';
import { formatIndianDate } from '../utils/dateFormat';
import { Case } from '../types';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

const CounselCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { cases, counsel, addCase, courts, caseTypes } = useData();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state for new case
  const [formData, setFormData] = useState({
    counsellor: '',
    customCounsellor: '',
    partiesName: '',
    district: '',
    caseType: '',
    court: '',
    onBehalfOf: '',
    noResp: '',
    officeFileNo: '',
    stampNo: '',
    registrationNo: '',
    fees: '',
    opponentLawyer: '',
    additionalDetails: '',
  });
  const [useCustomCounsellor, setUseCustomCounsellor] = useState(false);

  // Filter cases for counsel
  const counselCases = useMemo(() => {
    let filtered = cases;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.fileNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.partiesName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [cases, searchTerm]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const counsellorName = useCustomCounsellor ? formData.customCounsellor : formData.counsellor;
    
    if (!counsellorName || !formData.partiesName || !formData.officeFileNo) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }
    
    const newCase = {
      clientName: counsellorName,
      clientEmail: '',
      clientMobile: '',
      fileNo: formData.officeFileNo,
      stampNo: formData.stampNo,
      regNo: formData.registrationNo,
      partiesName: formData.partiesName,
      district: formData.district,
      caseType: formData.caseType,
      court: formData.court,
      onBehalfOf: formData.onBehalfOf,
      noResp: formData.noResp,
      opponentLawyer: formData.opponentLawyer,
      additionalDetails: formData.additionalDetails,
      feesQuoted: parseFloat(formData.fees) || 0,
      status: 'pending' as const,
      stage: 'consultation' as const,
      nextDate: new Date(),
      filingDate: new Date(),
      circulationStatus: 'non-circulated',
      interimRelief: 'none',
      createdBy: user?.id || '',
    };

    await addCase(newCase);
    showNotification('success', 'Case added successfully!');
    setShowAddModal(false);
    setFormData({
      counsellor: '',
      customCounsellor: '',
      partiesName: '',
      district: '',
      caseType: '',
      court: '',
      onBehalfOf: '',
      noResp: '',
      officeFileNo: '',
      stampNo: '',
      registrationNo: '',
      fees: '',
      opponentLawyer: '',
      additionalDetails: '',
    });
    setUseCustomCounsellor(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      closed: 'bg-gray-500/20 text-gray-400',
      'on-hold': 'bg-orange-500/20 text-orange-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';
  const hoverClass = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-cyber-blue/10';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const headerBgClass = theme === 'light' ? 'bg-gray-100' : 'bg-cyber-blue/10';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

  return (
    <MainLayout>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-4 md:p-6 rounded-lg mb-6 border ${borderClass} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}
      >
        <h1 className={`text-xl md:text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>
          Council Case Management ({counselCases.length} Cases)
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold font-cyber text-sm shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={18} />
          Add New Case
        </motion.button>
      </motion.div>

      {/* Search Result Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${bgClass} p-4 rounded-lg mb-6 border ${borderClass}`}
      >
        <p className="font-semibold">Search Result For - Council Cases</p>
      </motion.div>

      {/* Export Buttons and Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6 md:gap-4"
      >
        <div className="flex gap-2 md:gap-3">
          <GatedFeature requiredPlan="pro" featureName="exports">
            <button
              onClick={() => exportToCSV(counselCases, `counsel_cases_${new Date().getTime()}.csv`)}
              className="flex-1 md:flex-none justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-semibold font-cyber text-sm hover:shadow-orange transition-all duration-300 flex items-center gap-2 border border-orange-500/30"
            >
              <Download size={16} />
              CSV
            </button>
          </GatedFeature>
          <GatedFeature requiredPlan="pro" featureName="exports">
            <button
              onClick={() => exportToExcel(counselCases, `counsel_cases_${new Date().getTime()}.xlsx`)}
              className="flex-1 md:flex-none justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-semibold font-cyber text-sm hover:shadow-orange transition-all duration-300 flex items-center gap-2 border border-orange-500/30"
            >
              <Download size={16} />
              EXCEL
            </button>
          </GatedFeature>
          <GatedFeature requiredPlan="pro" featureName="PDF export">
            <button
              onClick={() => exportToPDF(counselCases, `counsel_cases_${new Date().getTime()}.pdf`)}
              className="flex-1 md:flex-none w-full justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-semibold font-cyber text-sm hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <FileText size={16} />
              PDF
            </button>
          </GatedFeature>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm hidden sm:inline">SEARCH</span>
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors`}
            />
          </div>
        </div>
      </motion.div>

      {/* Cases Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${bgClass} rounded-xl overflow-hidden border ${borderClass}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderClass} ${headerBgClass}`}>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>SR</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CLIENT NAME</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>FILE NO</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>NEXT DATE</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>FEES</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>STATUS</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CASE TYPE</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>COURT</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {counselCases.length > 0 ? (
                counselCases.map((caseItem: Case, index: number) => (
                  <tr
                    key={caseItem.id}
                    className={`border-b ${borderClass} ${hoverClass} transition-colors duration-200`}
                  >
                    <td className="py-4 px-6">{index + 1}</td>
                    <td className="py-4 px-6 font-medium">{caseItem.clientName}</td>
                    <td className="py-4 px-6">{caseItem.fileNo}</td>
                    <td className="py-4 px-6">{formatIndianDate(caseItem.nextDate)}</td>
                    <td className="py-4 px-6 font-semibold text-emerald-500">₹{caseItem.feesQuoted?.toLocaleString() || 0}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseItem.status)}`}
                      >
                        {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">{caseItem.caseType}</td>
                    <td className="py-4 px-6">{caseItem.court}</td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded font-semibold transition-all hover:shadow-lg"
                      >
                        <Eye size={16} />
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 px-6 text-center">
                    <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
                      No cases found. Click "Add New Case" to create one.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Case Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${bgClass} rounded-2xl border ${borderClass} p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${textPrimary}`}>Add New Council Case</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                >
                  <X size={20} className={textSecondary} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className={`text-sm font-medium ${textPrimary}`}>SELECT COUNSELLOR *</label>
                      <button
                        type="button"
                        onClick={() => setUseCustomCounsellor(!useCustomCounsellor)}
                        className={`text-xs px-2 py-1 rounded ${useCustomCounsellor ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {useCustomCounsellor ? 'Use Dropdown' : 'Type Custom'}
                      </button>
                    </div>
                    {useCustomCounsellor ? (
                      <input
                        type="text"
                        placeholder="Enter counsellor name"
                        value={formData.customCounsellor}
                        onChange={(e) => setFormData({ ...formData, customCounsellor: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${inputBgClass} focus:outline-none focus:border-orange-500 transition-colors`}
                        required
                      />
                    ) : (
                      <FormSelect
                        label=""
                        name="counsellor"
                        value={formData.counsellor}
                        onChange={(e) => setFormData({ ...formData, counsellor: e.target.value })}
                        options={[
                          { value: '', label: 'Select Counsellor' },
                          ...counsel.map(c => ({ value: c.name, label: c.name }))
                        ]}
                        required
                      />
                    )}
                  </div>
                  <FormInput
                    label="NAME OF PARTIES *"
                    name="partiesName"
                    type="text"
                    placeholder="Name of Parties"
                    value={formData.partiesName}
                    onChange={(e) => setFormData({ ...formData, partiesName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    label="DISTRICT"
                    name="district"
                    type="text"
                    placeholder="District"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                  <FormSelect
                    label="CASE TYPE"
                    name="caseType"
                    value={formData.caseType}
                    onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                    options={[
                      { value: '', label: 'Select case type' },
                      ...caseTypes.map(ct => ({ value: ct.name, label: ct.name }))
                    ]}
                  />
                  <FormSelect
                    label="COURT"
                    name="court"
                    value={formData.court}
                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                    options={[
                      { value: '', label: 'Select court' },
                      ...courts.map(c => ({ value: c.name, label: c.name }))
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label="ON BEHALF OF"
                    name="onBehalfOf"
                    value={formData.onBehalfOf}
                    onChange={(e) => setFormData({ ...formData, onBehalfOf: e.target.value })}
                    options={[
                      { value: '', label: 'Select' },
                      { value: 'Petitioner', label: 'Petitioner' },
                      { value: 'Defendant', label: 'Defendant' },
                      { value: 'Appellant', label: 'Appellant' },
                      { value: 'Respondent', label: 'Respondent' },
                    ]}
                  />
                  <FormInput
                    label="NO RESP"
                    name="noResp"
                    type="text"
                    placeholder="Number of Respondents"
                    value={formData.noResp}
                    onChange={(e) => setFormData({ ...formData, noResp: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="OFFICE FILE NO *"
                    name="officeFileNo"
                    type="text"
                    placeholder="Office file number"
                    value={formData.officeFileNo}
                    onChange={(e) => setFormData({ ...formData, officeFileNo: e.target.value })}
                    required
                  />
                  <FormInput
                    label="STAMP NO"
                    name="stampNo"
                    type="text"
                    placeholder="Stamp number"
                    value={formData.stampNo}
                    onChange={(e) => setFormData({ ...formData, stampNo: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="REGISTRATION NO"
                    name="registrationNo"
                    type="text"
                    placeholder="Registration number"
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                  />
                  <FormInput
                    label="FEES QUOTED"
                    name="fees"
                    type="number"
                    placeholder="Fees quoted to client"
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                  />
                </div>

                <FormInput
                  label="OPPONENT LAWYER"
                  name="opponentLawyer"
                  type="text"
                  placeholder="Opponent Lawyer"
                  value={formData.opponentLawyer}
                  onChange={(e) => setFormData({ ...formData, opponentLawyer: e.target.value })}
                />

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-2`}>ADDITIONAL DETAILS</label>
                  <textarea
                    value={formData.additionalDetails}
                    onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${inputBgClass} focus:outline-none focus:border-orange-500 transition-colors min-h-[100px]`}
                    placeholder="Enter additional details..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/20 text-white hover:bg-white/10'} font-medium transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold font-cyber hover:shadow-lg transition-all"
                  >
                    Create Case
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default CounselCasesPage;

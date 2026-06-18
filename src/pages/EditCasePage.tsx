import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import RichTextEditor from '../components/RichTextEditor';
import { Case } from '../types';

const EditCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cases, updateCase, caseTypes, courts } = useData();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCounselSectionOpen, setIsCounselSectionOpen] = useState(false);

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';
  const sectionHeaderClass = theme === 'light' 
    ? 'text-lg font-bold mb-4 text-orange-700' 
    : 'text-lg font-bold font-cyber mb-4 text-cyber-blue text-glow';
  const cancelButtonClass = theme === 'light'
    ? 'flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all duration-300 border border-gray-300'
    : 'flex-1 bg-cyber-blue/10 text-cyber-blue font-semibold font-cyber py-3 rounded-lg hover:bg-cyber-blue/20 transition-all duration-300 border border-cyber-blue/30';

  // Find the case to edit
  const caseToEdit = cases.find(c => c.id === id);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientMobile: '',
    clientAlternateNo: '',
    partiesName: '',
    district: '',
    caseType: '',
    court: '',
    onBehalfOf: '',
    noResp: '',
    stage: 'consultation',
    status: 'pending',
    circulationStatus: 'non-circulated',
    interimRelief: '',
    nextDate: '',
    filingDate: '',
    fileNo: '',
    stampNo: '',
    regNo: '',
    feesQuoted: '',
    opponentLawyer: '',
    counselRequired: 'No',
    counselName: '',
    counselEmail: '',
    counselMobile: '',
    counselAddress: '',
    additionalDetails: '',
  });

  // Helper to format date for input field
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Load case data when component mounts or case changes
  useEffect(() => {
    if (caseToEdit) {
      setFormData({
        clientName: caseToEdit.clientName || '',
        clientEmail: caseToEdit.clientEmail || '',
        clientMobile: caseToEdit.clientMobile || '',
        clientAlternateNo: caseToEdit.clientAlternateNo || '',
        partiesName: caseToEdit.partiesName || '',
        district: caseToEdit.district || '',
        caseType: caseToEdit.caseType || '',
        court: caseToEdit.court || '',
        onBehalfOf: caseToEdit.onBehalfOf || '',
        noResp: caseToEdit.noResp || '',
        stage: caseToEdit.stage || 'consultation',
        status: caseToEdit.status || 'pending',
        circulationStatus: caseToEdit.circulationStatus || 'non-circulated',
        interimRelief: caseToEdit.interimRelief || '',
        nextDate: formatDateForInput(caseToEdit.nextDate),
        filingDate: formatDateForInput(caseToEdit.filingDate),
        fileNo: caseToEdit.fileNo || '',
        stampNo: caseToEdit.stampNo || '',
        regNo: caseToEdit.regNo || '',
        feesQuoted: caseToEdit.feesQuoted?.toString() || '',
        opponentLawyer: caseToEdit.opponentLawyer || '',
        counselRequired: 'No',
        counselName: '',
        counselEmail: '',
        counselMobile: '',
        counselAddress: '',
        additionalDetails: caseToEdit.additionalDetails || '',
      });
    }
  }, [caseToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTextAreaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, additionalDetails: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !caseToEdit) {
      console.error('No case ID or case not found');
      return;
    }

    setLoading(true);

    try {
      const updatedCase: Partial<Case> = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientMobile: formData.clientMobile,
        clientAlternateNo: formData.clientAlternateNo,
        partiesName: formData.partiesName,
        district: formData.district,
        caseType: formData.caseType,
        court: formData.court,
        onBehalfOf: formData.onBehalfOf,
        noResp: formData.noResp,
        stage: formData.stage as any,
        status: formData.status as any,
        circulationStatus: formData.circulationStatus,
        interimRelief: formData.interimRelief,
        nextDate: formData.nextDate || undefined,
        filingDate: formData.filingDate || undefined,
        fileNo: formData.fileNo,
        stampNo: formData.stampNo,
        regNo: formData.regNo,
        feesQuoted: parseInt(formData.feesQuoted) || 0,
        opponentLawyer: formData.opponentLawyer,
        additionalDetails: formData.additionalDetails,
      };

      await updateCase(id, updatedCase);
      navigate('/cases');
    } catch (error) {
      console.error('Error updating case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/cases');
  };

  // If case not found, show error
  if (!caseToEdit) {
    return (
      <MainLayout>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${bgClass} p-6 rounded-lg mb-6 border ${borderClass}`}
        >
          <h1 className={`text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>
            Case Not Found
          </h1>
          <p className={`mt-2 font-court ${theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60'}`}>
            The case you're trying to edit could not be found.
          </p>
          <button
            onClick={() => navigate('/cases')}
            className="mt-4 px-6 py-2 bg-gradient-cyber text-white font-semibold font-cyber rounded-lg hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
          >
            Back to Cases
          </button>
        </motion.div>
      </MainLayout>
    );
  }

  const caseTypeOptions = caseTypes.map((ct) => ({ value: ct.id, label: ct.name }));
  const courtOptions = courts.map((c) => ({ value: c.id, label: c.name }));

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-6 rounded-lg mb-6 border ${borderClass}`}
      >
        <h1 className={`text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>
          Edit Case
        </h1>
        <p className={`mt-2 font-court ${theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60'}`}>
          Update the case details below
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${bgClass} p-6 rounded-xl border ${borderClass}`}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Info Section */}
          <div>
            <h3 className={sectionHeaderClass}>Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Client Name"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                error={errors.clientName}
              />
              <FormInput
                label="Email"
                name="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={handleInputChange}
                error={errors.clientEmail}
              />
              <FormInput
                label="Mobile"
                name="clientMobile"
                value={formData.clientMobile}
                onChange={handleInputChange}
                error={errors.clientMobile}
              />
              <FormInput
                label="Alternate No"
                name="clientAlternateNo"
                value={formData.clientAlternateNo}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Case Info Section */}
          <div>
            <h3 className={sectionHeaderClass}>Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Parties Name"
                name="partiesName"
                value={formData.partiesName}
                onChange={handleInputChange}
                error={errors.partiesName}
              />
              <FormInput
                label="District"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                error={errors.district}
              />
              <FormSelect
                label="Case Type"
                name="caseType"
                options={caseTypeOptions}
                value={formData.caseType}
                onChange={handleInputChange}
                error={errors.caseType}
              />
              <FormSelect
                label="Court"
                name="court"
                options={courtOptions}
                value={formData.court}
                onChange={handleInputChange}
                error={errors.court}
              />
              <FormInput
                label="On Behalf Of"
                name="onBehalfOf"
                value={formData.onBehalfOf}
                onChange={handleInputChange}
              />
              <FormInput
                label="No Resp"
                name="noResp"
                value={formData.noResp}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Case Stage"
                name="stage"
                options={[
                  { value: 'consultation', label: 'Consultation' },
                  { value: 'drafting', label: 'Drafting' },
                  { value: 'filing', label: 'Filing' },
                  { value: 'circulation', label: 'Circulation' },
                  { value: 'notice', label: 'Notice' },
                  { value: 'pre-admission', label: 'Pre Admission' },
                  { value: 'admitted', label: 'Admitted' },
                  { value: 'final-hearing', label: 'Final Hearing' },
                  { value: 'reserved', label: 'Reserved For Judgement' },
                  { value: 'disposed', label: 'Disposed' },
                ]}
                value={formData.stage}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Case Status"
                name="status"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'active', label: 'Active' },
                  { value: 'closed', label: 'Closed' },
                  { value: 'on-hold', label: 'On Hold' },
                ]}
                value={formData.status}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Case Status Section */}
          <div>
            <h3 className={sectionHeaderClass}>Case Status & Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Circulation Status"
                name="circulationStatus"
                options={[
                  { value: 'non-circulated', label: 'Non Circulated' },
                  { value: 'circulated', label: 'Circulated' },
                ]}
                value={formData.circulationStatus}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Interim Relief"
                name="interimRelief"
                options={[
                  { value: '', label: 'Not Applicable' },
                  { value: 'favor', label: 'In Favor' },
                  { value: 'against', label: 'Against' },
                ]}
                value={formData.interimRelief}
                onChange={handleInputChange}
              />
              <FormInput
                label="Next Date"
                name="nextDate"
                type="date"
                value={formData.nextDate}
                onChange={handleInputChange}
              />
              <FormInput
                label="Filing Date"
                name="filingDate"
                type="date"
                value={formData.filingDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Legal Details Section */}
          <div>
            <h3 className={sectionHeaderClass}>Legal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Office File No"
                name="fileNo"
                value={formData.fileNo}
                onChange={handleInputChange}
                error={errors.fileNo}
              />
              <FormInput
                label="Stamp No"
                name="stampNo"
                value={formData.stampNo}
                onChange={handleInputChange}
                error={errors.stampNo}
              />
              <FormInput
                label="Registration No"
                name="regNo"
                value={formData.regNo}
                onChange={handleInputChange}
                error={errors.regNo}
              />
              <FormInput
                label="Fees Quoted"
                name="feesQuoted"
                type="number"
                value={formData.feesQuoted}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Opposition Section */}
          <div>
            <h3 className={sectionHeaderClass}>Opposition</h3>
            <FormInput
              label="Opponent Lawyer"
              name="opponentLawyer"
              value={formData.opponentLawyer}
              onChange={handleInputChange}
            />
          </div>

          {/* Counsel Section - Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setIsCounselSectionOpen(!isCounselSectionOpen)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                theme === 'light' 
                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-700' 
                  : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-orange-700' : 'text-orange-400'}`}>
                Counsel Information (Optional)
              </h3>
              <span className="text-2xl">{isCounselSectionOpen ? '−' : '+'}</span>
            </button>
            
            {isCounselSectionOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4"
              >
                <FormSelect
                  label="Counsel Required"
                  name="counselRequired"
                  options={[
                    { value: 'No', label: 'No' },
                    { value: 'Yes', label: 'Yes' }
                  ]}
                  value={formData.counselRequired}
                  onChange={handleInputChange}
                />
                
                {formData.counselRequired === 'Yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormInput
                      label="Counsel Name"
                      name="counselName"
                      value={formData.counselName}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="Counsel Email"
                      name="counselEmail"
                      type="email"
                      value={formData.counselEmail}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="Counsel Mobile"
                      name="counselMobile"
                      value={formData.counselMobile}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="Counsel Address"
                      name="counselAddress"
                      value={formData.counselAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Additional Details Section */}
          <div>
            <h3 className={sectionHeaderClass}>Additional Details</h3>
            <RichTextEditor
              label="Additional Details"
              value={formData.additionalDetails}
              onChange={handleTextAreaChange}
              placeholder="Enter additional case details..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-cyber text-white font-semibold font-cyber py-3 rounded-lg hover:shadow-cyber transition-all duration-300 disabled:opacity-50 border border-cyber-blue/30"
            >
              {loading ? 'Updating Case...' : 'Update Case'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={cancelButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </MainLayout>
  );
};

export default EditCasePage;

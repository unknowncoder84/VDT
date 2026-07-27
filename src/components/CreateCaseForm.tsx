import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import SelectWithAdd from './SelectWithAdd';
import RichTextEditor from './RichTextEditor';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Case } from '../types';

interface CreateCaseFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const CreateCaseForm: React.FC<CreateCaseFormProps> = ({ onClose, onSuccess }) => {
  const { addCase, caseTypes, courts, districts, addCourt, addCaseType, addDistrict } = useData();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const sectionHeaderClass = theme === 'light' 
    ? 'text-lg font-bold mb-4 text-orange-700' 
    : 'text-lg font-bold font-cyber mb-4 text-cyber-blue text-glow';
    
  const cancelButtonClass = theme === 'light'
    ? 'flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all duration-300 border border-gray-300'
    : 'flex-1 bg-cyber-blue/10 text-cyber-blue font-semibold font-cyber py-3 rounded-lg hover:bg-cyber-blue/20 transition-all duration-300 border border-cyber-blue/30';

  const [isCounselSectionOpen, setIsCounselSectionOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    // Client Info
    clientName: '',
    clientEmail: '',
    clientMobile: '',
    clientAlternateNo: '',
    // Case Info
    partiesName: '',
    district: '',
    caseType: '',
    court: '',
    onBehalfOf: '',
    noResp: '',
    stage: 'consultation',
    // Legal Details
    fileNo: '',
    stampNo: '',
    regNo: '',
    feesQuoted: '',
    // Opposition
    opponentLawyer: '',
    // Counsel Info
    counselRequired: 'No',
    counselName: '',
    counselEmail: '',
    counselMobile: '',
    counselAddress: '',
    // Extras
    additionalDetails: '',
  });

  const validateForm = (): boolean => {
    // All fields are now optional - no validation required
    return true;
  };

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
    console.log('📝 Form submitted');

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const newCase: Omit<Case, 'id' | 'createdAt' | 'updatedAt'> = {
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
        fileNo: formData.fileNo,
        stampNo: formData.stampNo,
        regNo: formData.regNo,
        feesQuoted: Math.round(Number(formData.feesQuoted) * 100) / 100 || 0,
        opponentLawyer: formData.opponentLawyer,
        additionalDetails: formData.additionalDetails,
        status: 'pending',
        nextDate: nextWeekStr,
        filingDate: todayStr,
        circulationStatus: 'non-circulated',
        interimRelief: 'none',
        createdBy: user?.id || '',
      };

      await addCase(newCase);

      // Reset form
      setFormData({
        clientName: '', clientEmail: '', clientMobile: '', clientAlternateNo: '',
        partiesName: '', district: '', caseType: '', court: '',
        onBehalfOf: '', noResp: '', stage: 'consultation',
        fileNo: '', stampNo: '', regNo: '', feesQuoted: '',
        opponentLawyer: '', counselRequired: 'No',
        counselName: '', counselEmail: '', counselMobile: '', counselAddress: '',
        additionalDetails: '',
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('❌ Error creating case:', error);
      const msg = error?.message || error?.details || error?.hint || JSON.stringify(error);
      alert(`Failed to create case:\n\n${msg}\n\nCheck browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const caseTypeOptions = caseTypes.map((ct) => ({ value: ct.id, label: ct.name }));
  const courtOptions = courts.map((c) => ({ value: c.id, label: c.name }));

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
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
          <SelectWithAdd
            label="District"
            name="district"
            options={districts.map((d) => ({ value: d.name, label: d.name }))}
            value={formData.district}
            onChange={handleInputChange}
            onAdd={async (name) => {
              const created = await addDistrict(name);
              // Districts are stored/selected by name, not id
              return created ? { id: created.name, name: created.name } : undefined;
            }}
            error={errors.district}
          />
          <SelectWithAdd
            label="Case Type"
            name="caseType"
            options={caseTypeOptions}
            value={formData.caseType}
            onChange={handleInputChange}
            onAdd={addCaseType}
            error={errors.caseType}
          />
          <SelectWithAdd
            label="Court"
            name="court"
            options={courtOptions}
            value={formData.court}
            onChange={handleInputChange}
            onAdd={addCourt}
            error={errors.court}
          />
          <FormSelect
            label="On Behalf Of"
            name="onBehalfOf"
            options={[
              { value: 'petitioner', label: 'Petitioner' },
              { value: 'applicant', label: 'Applicant' },
              { value: 'appellant', label: 'Appellant' },
              { value: 'respondent', label: 'Respondent' },
              { value: 'intervenor', label: 'Intervenor' },
            ]}
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
          className="flex-1 bg-gradient-cyber text-white font-semibold font-cyber py-3 rounded-lg hover:shadow-cyber transition-all duration-300 disabled:opacity-50 border border-cyber-blue/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving... (please wait)
            </>
          ) : 'Create Case'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={cancelButtonClass}
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
};

export default CreateCaseForm;

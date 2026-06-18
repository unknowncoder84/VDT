import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, FileText, Gavel, Users } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const DateEventsPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { cases, appointments } = useData();
  const { theme } = useTheme();

  const selectedDate = date ? parseISO(date) : new Date();
  const formattedDate = format(selectedDate, 'dd/MM/yyyy');

  // Calculate statistics for the selected date
  const stats = useMemo(() => {
    const filings = cases.filter(c => isSameDay(new Date(c.filingDate), selectedDate)).length;
    const courtDates = cases.filter(c => isSameDay(new Date(c.nextDate), selectedDate)).length;
    const appointmentsCount = appointments.filter(a => isSameDay(new Date(a.date), selectedDate)).length;

    return { filings, courtDates, appointments: appointmentsCount };
  }, [cases, appointments, selectedDate]);

  // Get detailed data for the selected date
  const filingsData = useMemo(() => 
    cases.filter(c => isSameDay(new Date(c.filingDate), selectedDate)), 
    [cases, selectedDate]
  );

  const courtDatesData = useMemo(() => 
    cases.filter(c => isSameDay(new Date(c.nextDate), selectedDate)), 
    [cases, selectedDate]
  );

  const appointmentsData = useMemo(() => 
    appointments.filter(a => isSameDay(new Date(a.date), selectedDate)), 
    [appointments, selectedDate]
  );

  const cardBg = theme === 'light' 
    ? 'bg-white/80 backdrop-blur-xl border-gray-200/50' 
    : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60';
  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20';

  const statisticsRows = [
    { label: 'Filings', value: stats.filings, color: 'text-cyan-400', icon: FileText },
    { label: 'Court Dates', value: stats.courtDates, color: 'text-orange-400', icon: Gavel },
    { label: 'Appointments', value: stats.appointments, color: 'text-orange-400', icon: Users },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 rounded-xl ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'} transition-colors`}
          >
            <ArrowLeft size={24} className={textPrimary} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-cyber rounded-xl shadow-cyber border border-cyber-blue/30 animate-cyber-pulse">
              <Calendar className="text-white" size={24} />
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold font-cyber ${textPrimary}`}>
              Events For - <span className="text-cyber-blue text-glow">{formattedDate}</span>
            </h1>
          </div>
        </motion.div>


        {/* Statistics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBg} rounded-2xl border overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${borderClass} ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
            <h2 className={`text-lg font-bold ${textPrimary}`}>Statistics</h2>
          </div>
          <div className="divide-y divide-gray-200/10">
            {statisticsRows.map((row, index) => {
              const Icon = row.icon;
              return (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center justify-between px-6 py-4 ${theme === 'light' ? 'hover:bg-orange-50/50' : 'hover:bg-white/5'} transition-colors cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={row.color} />
                    <span className={`font-medium ${row.color}`}>{row.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${textPrimary}`}>{row.value}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Filings Section */}
        {filingsData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`${cardBg} rounded-2xl border overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${borderClass} flex items-center gap-3`}>
              <FileText size={20} className="text-cyan-400" />
              <h2 className={`text-lg font-bold ${textPrimary}`}>Filings ({filingsData.length})</h2>
            </div>
            <div className="divide-y divide-gray-200/10">
              {filingsData.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  className={`px-6 py-4 ${theme === 'light' ? 'hover:bg-orange-50/50' : 'hover:bg-white/5'} transition-colors cursor-pointer`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header with parties name and status badges */}
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className={`font-bold text-lg ${textPrimary}`}>{caseItem.partiesName || caseItem.clientName}</p>
                        {caseItem.partiesName && caseItem.clientName && (
                          <p className={`text-sm ${textSecondary}`}>Client: {caseItem.clientName}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        caseItem.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        caseItem.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        caseItem.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {caseItem.status}
                      </span>
                    </div>
                    
                    {/* Case Details Grid */}
                    <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>File No</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.fileNo || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Reg No</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.regNo || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Court</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.court || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Case Type</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.caseType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Stage</p>
                          <p className={`font-semibold ${textPrimary} capitalize`}>{caseItem.stage?.replace('-', ' ') || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>On Behalf Of</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.onBehalfOf || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>District</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.district || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Opponent Lawyer</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.opponentLawyer || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Details / Description */}
                    {caseItem.additionalDetails && (
                      <div className={`p-3 rounded-lg border-l-4 border-cyan-400 ${theme === 'light' ? 'bg-cyan-50' : 'bg-cyan-500/10'}`}>
                        <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Case Description / Additional Details</p>
                        <p className={`text-sm ${textPrimary}`}>{caseItem.additionalDetails}</p>
                      </div>
                    )}
                    
                    {/* Contact Info */}
                    {(caseItem.clientMobile || caseItem.clientEmail) && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        {caseItem.clientMobile && (
                          <p className={textSecondary}><span className="font-medium">Mobile:</span> {caseItem.clientMobile}</p>
                        )}
                        {caseItem.clientEmail && (
                          <p className={textSecondary}><span className="font-medium">Email:</span> {caseItem.clientEmail}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Click to view more */}
                    <p className="text-xs text-cyan-500 font-medium">Click to view full case details →</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Court Dates Section */}
        {courtDatesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`${cardBg} rounded-2xl border overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${borderClass} flex items-center gap-3`}>
              <Gavel size={20} className="text-orange-400" />
              <h2 className={`text-lg font-bold ${textPrimary}`}>Court Dates ({courtDatesData.length})</h2>
            </div>
            <div className="divide-y divide-gray-200/10">
              {courtDatesData.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  className={`px-6 py-4 ${theme === 'light' ? 'hover:bg-orange-50/50' : 'hover:bg-white/5'} transition-colors cursor-pointer`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header with parties name and status badges */}
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className={`font-bold text-lg ${textPrimary}`}>{caseItem.partiesName || caseItem.clientName}</p>
                        {caseItem.partiesName && caseItem.clientName && (
                          <p className={`text-sm ${textSecondary}`}>Client: {caseItem.clientName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          caseItem.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          caseItem.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          caseItem.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {caseItem.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          caseItem.circulationStatus === 'circulated' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {caseItem.circulationStatus}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          caseItem.interimRelief === 'favor' ? 'bg-green-500/20 text-green-400' :
                          caseItem.interimRelief === 'against' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          IR: {caseItem.interimRelief || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Case Details Grid */}
                    <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>File No</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.fileNo || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Reg No</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.regNo || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Court</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.court || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Case Type</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.caseType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Stage</p>
                          <p className={`font-semibold ${textPrimary} capitalize`}>{caseItem.stage?.replace('-', ' ') || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>On Behalf Of</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.onBehalfOf || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>District</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.district || 'N/A'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Opponent Lawyer</p>
                          <p className={`font-semibold ${textPrimary}`}>{caseItem.opponentLawyer || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Details / Description */}
                    {caseItem.additionalDetails && (
                      <div className={`p-3 rounded-lg border-l-4 border-orange-400 ${theme === 'light' ? 'bg-orange-50' : 'bg-orange-500/10'}`}>
                        <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Case Description / Additional Details</p>
                        <p className={`text-sm ${textPrimary}`}>{caseItem.additionalDetails}</p>
                      </div>
                    )}
                    
                    {/* Contact Info */}
                    {(caseItem.clientMobile || caseItem.clientEmail) && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        {caseItem.clientMobile && (
                          <p className={textSecondary}><span className="font-medium">Mobile:</span> {caseItem.clientMobile}</p>
                        )}
                        {caseItem.clientEmail && (
                          <p className={textSecondary}><span className="font-medium">Email:</span> {caseItem.clientEmail}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Click to view more */}
                    <p className="text-xs text-orange-500 font-medium">Click to view full case details →</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Appointments Section */}
        {appointmentsData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`${cardBg} rounded-2xl border overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${borderClass} flex items-center gap-3`}>
              <Users size={20} className="text-orange-400" />
              <h2 className={`text-lg font-bold ${textPrimary}`}>Appointments ({appointmentsData.length})</h2>
            </div>
            <div className="divide-y divide-gray-200/10">
              {appointmentsData.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => navigate('/appointments')}
                  className={`px-6 py-4 ${theme === 'light' ? 'hover:bg-orange-50/50' : 'hover:bg-white/5'} transition-colors cursor-pointer`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header with client name and status */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className={`font-bold text-lg ${textPrimary}`}>{apt.client || 'No Client Specified'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                          {apt.time || 'Time not set'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">
                          Scheduled
                        </span>
                      </div>
                    </div>
                    
                    {/* Appointment Details Grid */}
                    <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Date</p>
                          <p className={`font-semibold ${textPrimary}`}>{format(new Date(apt.date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Time</p>
                          <p className={`font-semibold ${textPrimary}`}>{apt.time || 'Not set'}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Assigned To</p>
                          <p className={`font-semibold ${textPrimary}`}>{apt.userName || apt.user || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Appointment Details / Description */}
                    {apt.details && (
                      <div className={`p-3 rounded-lg border-l-4 border-orange-400 ${theme === 'light' ? 'bg-orange-50' : 'bg-orange-500/10'}`}>
                        <p className={`text-xs uppercase tracking-wide ${textSecondary} mb-1`}>Appointment Details</p>
                        <p className={`text-sm ${textPrimary}`}>{apt.details}</p>
                      </div>
                    )}
                    
                    {/* Click to view more */}
                    <p className="text-xs text-orange-500 font-medium">Click to view all appointments →</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {stats.filings === 0 && stats.courtDates === 0 && stats.appointments === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${cardBg} rounded-2xl border p-12 text-center`}
          >
            <Calendar size={64} className={`mx-auto mb-4 ${textSecondary} opacity-50`} />
            <p className={`text-xl font-medium ${textPrimary}`}>No events for this date</p>
            <p className={`mt-2 ${textSecondary}`}>There are no filings, court dates, or appointments scheduled.</p>
            <button
              onClick={() => navigate('/appointments')}
              className="mt-6 px-6 py-3 bg-gradient-cyber text-white rounded-xl font-semibold font-cyber hover:shadow-cyber transition-all border border-cyber-blue/30"
            >
              Schedule an Appointment
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center pt-8"
        >
          <p className={`text-sm ${textSecondary}`}>
            Designed and Developed by <span className="text-cyan-400">sawantrishi152@gmail.com</span> © 2025
          </p>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default DateEventsPage;

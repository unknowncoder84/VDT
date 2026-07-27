import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Trash2, Edit, X, CheckCircle, AlertCircle } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Appointment, User as UserType } from '../types';
import { formatIndianDate } from '../utils/dateFormat';
import { getAllUsers } from '../lib/userManagement';

const AppointmentsPage: React.FC = () => {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, cases } = useData();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    user: '',
    client: '',
    details: '',
  });
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [systemUsers, setSystemUsers] = useState<UserType[]>([]);

  // Fetch users from user management system
  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getAllUsers();
      if (result.success && result.users) {
        setSystemUsers(result.users);
      }
    };
    fetchUsers();
  }, []);

  // Get users for dropdown - combine system users with default users
  const users = useMemo(() => {
    const userNames = systemUsers.map(u => u.name);
    // Add default users if not already in the list
    const defaultUsers = ['Admin User'];
    defaultUsers.forEach(u => {
      if (!userNames.includes(u)) {
        userNames.push(u);
      }
    });
    return userNames;
  }, [systemUsers]);

  // Get unique clients from cases
  const clients = useMemo(() => {
    const clientSet = new Set<string>();
    cases.forEach(c => {
      if (c.clientName) clientSet.add(c.clientName);
    });
    return Array.from(clientSet);
  }, [cases]);

  // Split appointments into completed, upcoming, and special events
  // Categorize appointments by date
  const { completedAppointments, upcomingAppointments } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter appointments by date
    const completed = appointments
      .filter(apt => new Date(apt.date) < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const upcoming = appointments
      .filter(apt => new Date(apt.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { completedAppointments: completed, upcomingAppointments: upcoming };
  }, [appointments]);

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.user) {
      try {
        await addAppointment({
          date: new Date(formData.date),
          time: formData.time,
          user: formData.user,
          client: formData.client,
          details: formData.details,
        });
        setFormData({ date: '', time: '', user: '', client: '', details: '' });
        showNotification('success', 'Appointment created successfully!');
      } catch (error) {
        showNotification('error', 'Failed to create appointment');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(id);
        showNotification('success', 'Appointment deleted successfully!');
      } catch (error) {
        showNotification('error', 'Failed to delete appointment');
      }
    }
  };

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';
  const inputBgClass = theme === 'light' 
    ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' 
    : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const labelClass = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/80';

  return (
    <MainLayout>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <CheckCircle size={20} />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className={`text-3xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>Appointments</h1>
      </motion.div>

      {/* New Appointment Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${bgClass} p-6 rounded-xl border ${borderClass} mb-6`}
      >
        <h2 className="text-lg font-semibold mb-6">New Appointment</h2>
        
        <form onSubmit={handleSubmit}>
          {/* First Row - Date, Time, User, Client */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Appointment Date */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
                APPOINTMENT DATE <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors`}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
                TIME
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors`}
                  placeholder="--:-- --"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* For User */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
                FOR USER <span className="text-orange-500">*</span>
              </label>
              <select
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors`}
                required
              >
                <option value="">Select User</option>
                {users.map((user, index) => (
                  <option key={index} value={user}>{user}</option>
                ))}
              </select>
            </div>

            {/* Select Client - with ability to type new name */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
                CLIENT NAME
              </label>
              <input
                type="text"
                list="client-list"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Type or select client name..."
                className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors`}
              />
              <datalist id="client-list">
                {clients.map((client, index) => (
                  <option key={index} value={client} />
                ))}
              </datalist>
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                Select existing client or type a new name
              </p>
            </div>
          </div>
          {/* Appointment Details */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              APPOINTMENT DETAILS <span className="text-orange-500">*</span>
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors resize-none`}
              rows={4}
              placeholder="Enter appointment details..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-gradient-cyber text-white px-8 py-3 rounded-lg font-semibold font-cyber hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
            >
              CREATE APPOINTMENT
            </button>
          </div>
        </form>
      </motion.div>

      {/* Upcoming Appointments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${bgClass} p-6 rounded-xl border ${borderClass} mb-6`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <AlertCircle size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Upcoming Appointments ({upcomingAppointments.length})
            </h2>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              Today and future appointments
            </p>
          </div>
        </div>
        
        {/* Upcoming Appointments List */}
        <div className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No upcoming appointments</p>
              <p className="text-sm mt-2">Create a new appointment using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderClass}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>DATE</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>TIME</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>USER</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CLIENT</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>DETAILS</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.map((apt) => (
                    <tr 
                      key={apt.id} 
                      className={`border-b ${borderClass} border-l-4 border-l-green-500 ${theme === 'light' ? 'hover:bg-green-50' : 'hover:bg-green-500/10'} transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-green-500" />
                          {formatIndianDate(apt.date)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-cyan-400" />
                          {apt.time || '--:--'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-green-400" />
                          {apt.userName || apt.user || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">{apt.client || '-'}</td>
                      <td className="py-4 px-4 max-w-xs truncate">{apt.details || '-'}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAppointment(apt)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Edit appointment"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete appointment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Completed Appointments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${bgClass} p-6 rounded-xl border ${borderClass}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
            <CheckCircle size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Completed Appointments ({completedAppointments.length})
            </h2>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              Past appointments
            </p>
          </div>
        </div>
        
        {/* Completed Appointments List */}
        <div className="space-y-4">
          {completedAppointments.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No completed appointments</p>
            </div>
          ) : (
            <div className="overflow-x-auto opacity-75">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderClass}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>DATE</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>TIME</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>USER</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CLIENT</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>DETAILS</th>
                    <th className={`text-left py-3 px-4 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {completedAppointments.map((apt) => (
                    <tr 
                      key={apt.id} 
                      className={`border-b ${borderClass} border-l-4 border-l-gray-400 ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-500/10'} transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500" />
                          {formatIndianDate(apt.date)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          {apt.time || '--:--'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          {apt.userName || apt.user || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">{apt.client || '-'}</td>
                      <td className="py-4 px-4 max-w-xs truncate">{apt.details || '-'}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAppointment(apt)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Edit appointment"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete appointment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          Designed and Developed by <span className="text-cyan-400">vakildeskmain@gmail.com</span> © 2025
        </p>
      </motion.div>

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={async (id, data) => {
            try {
              await updateAppointment(id, data);
              setEditingAppointment(null);
              showNotification('success', 'Appointment updated successfully!');
            } catch (error) {
              showNotification('error', 'Failed to update appointment');
            }
          }}
          users={users}
          clients={clients}
          theme={theme}
        />
      )}
    </MainLayout>
  );
};

// Edit Appointment Modal Component
interface EditAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSave: (id: string, data: Partial<Appointment>) => Promise<void>;
  users: string[];
  clients: string[];
  theme: string;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  onClose,
  onSave,
  users,
  clients,
  theme,
}) => {
  const [formData, setFormData] = useState({
    date: new Date(appointment.date).toISOString().split('T')[0],
    time: appointment.time || '',
    user: appointment.userName || appointment.user || '',
    client: appointment.client || '',
    details: appointment.details || '',
  });

  const bgClass = theme === 'light' ? 'bg-white' : 'glass-dark';
  const inputBgClass = theme === 'light' 
    ? 'bg-white text-gray-900 border-gray-300' 
    : 'bg-white/5 text-white border-orange-500/30';
  const labelClass = theme === 'light' ? 'text-gray-700' : 'text-orange-400/80';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(appointment.id, {
      date: new Date(formData.date),
      time: formData.time,
      user: formData.user,
      client: formData.client,
      details: formData.details,
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className={`${bgClass} p-6 rounded-2xl border ${theme === 'light' ? 'border-gray-200' : 'border-orange-500/20'} max-w-lg w-full`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${textPrimary}`}>Edit Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-500/20 rounded-lg transition-colors"
          >
            <X size={20} className={textPrimary} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>User *</label>
            <select
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            >
              <option value="">Select User</option>
              {users.map((user, index) => (
                <option key={index} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Client</label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
            >
              <option value="">Select Client</option>
              {clients.map((client, index) => (
                <option key={index} value={client}>{client}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Details</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500 resize-none`}
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 font-semibold py-3 rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AppointmentsPage;

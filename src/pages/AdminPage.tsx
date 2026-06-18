import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  UserPlus,
  Trash2,
  UserCheck,
  UserX,
  X,
  AlertTriangle,
  Crown,
  User as UserIcon,
  CheckSquare,
  Clock,
  Bell,
  Edit2,
  Lock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { formatIndianDate } from '../utils/dateFormat';
import { User, CreateUserData, UserRole } from '../types';

const AdminPage: React.FC = () => {
  const { theme } = useTheme();
  const { users, user: currentUser, createUser, updateUserRole, toggleUserStatus, deleteUser } = useAuth();
  const { tasks } = useData();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
  });

  // Change password for a user (admin only)
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdTargetUser, setPwdTargetUser] = useState<User | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdNotif, setPwdNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openPwdModal = (u: User) => {
    setPwdTargetUser(u);
    setNewPwd('');
    setConfirmPwd('');
    setPwdNotif(null);
    setShowPwdModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdTargetUser) return;
    if (newPwd.length < 6) { setPwdNotif({ type: 'error', message: 'Password must be at least 6 characters.' }); return; }
    if (newPwd !== confirmPwd) { setPwdNotif({ type: 'error', message: 'Passwords do not match.' }); return; }
    setPwdLoading(true);
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ password_hash: newPwd })
        .eq('id', pwdTargetUser.id);
      if (error) throw new Error(error.message);
      setPwdNotif({ type: 'success', message: `Password updated for ${pwdTargetUser.name}.` });
      setNewPwd(''); setConfirmPwd('');
      setTimeout(() => { setShowPwdModal(false); setPwdNotif(null); }, 2000);
    } catch (err: any) {
      setPwdNotif({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const cardBg = theme === 'light' ? 'bg-white/80 backdrop-blur-xl border-gray-200/50' : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60';
  const inputBg = theme === 'light' ? 'bg-white border-gray-300 placeholder-gray-500' : 'bg-white/5 border-orange-500/30 placeholder-gray-400';
  const hoverBg = theme === 'light' ? 'hover:bg-orange-50' : 'hover:bg-cyber-blue/10';

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      showNotification('error', 'All fields are required');
      return;
    }
    const result = await createUser(formData);
    if (result.success) {
      showNotification('success', 'User created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', username: '', password: '', role: 'user' });
    } else {
      showNotification('error', result.error || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) showNotification('success', 'Role updated successfully');
    else showNotification('error', result.error || 'Failed to update role');
  };

  const handleToggleStatus = async (userId: string) => {
    const result = await toggleUserStatus(userId);
    if (result.success) showNotification('success', 'Status updated successfully');
    else showNotification('error', result.error || 'Failed to update status');
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const result = await deleteUser(selectedUser.id);
    if (result.success) {
      showNotification('success', 'User deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    } else {
      showNotification('error', result.error || 'Failed to delete user');
    }
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      username: user.username || '',
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    if (!editFormData.name || !editFormData.email) {
      showNotification('error', 'Name and email are required');
      return;
    }
    
    try {
      // Update user in Supabase profiles table
      const { error } = await import('../lib/supabase').then(m => 
        m.supabase.from('profiles').update({
          name: editFormData.name,
          email: editFormData.email,
          username: editFormData.username,
        }).eq('id', selectedUser.id)
      );
      
      if (error) {
        showNotification('error', error.message || 'Failed to update user');
        return;
      }
      
      showNotification('success', 'User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      // Refresh the page to get updated data
      window.location.reload();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-cyber rounded-xl shadow-cyber border border-cyber-blue/30 animate-cyber-pulse">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold font-cyber ${textPrimary}`}>Admin Panel</h1>
              <p className={`${textSecondary} font-court`}>Manage users and system settings</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-cyber text-white rounded-xl font-semibold font-cyber shadow-cyber border border-cyber-blue/30 hover:shadow-justice transition-all"
          >
            <UserPlus size={20} />
            Add New User
          </motion.button>
        </motion.div>


        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl ${
                notification.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${cardBg} p-6 rounded-2xl border`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <UserIcon className="text-white" size={24} />
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Total Users</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{users.length}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${cardBg} p-6 rounded-2xl border`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-cyber rounded-xl border border-cyber-blue/30">
                <Crown className="text-white" size={24} />
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Admins</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${cardBg} p-6 rounded-2xl border`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                <UserCheck className="text-white" size={24} />
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Active Users</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`${cardBg} p-6 rounded-2xl border`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                <CheckSquare className="text-white" size={24} />
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Pending Tasks</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{tasks.filter(t => t.status === 'pending').length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tasks Assigned Section - Scrollable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`${cardBg} rounded-2xl border overflow-hidden`}
          style={{ maxHeight: '500px' }}
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(26,26,46,0.95)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                <CheckSquare className="text-white" size={20} />
              </div>
              <h2 className={`text-xl font-bold ${textPrimary}`}>Tasks Assigned by Admin</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${textSecondary} bg-orange-500/10`}>
                {tasks.filter(t => t.status === 'pending').length} Pending
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${textSecondary} bg-green-500/10`}>
                {tasks.filter(t => t.status === 'completed').length} Completed
              </span>
            </div>
          </div>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '380px' }}>
            {tasks.length === 0 ? (
              <div className={`text-center py-8 ${textSecondary}`}>
                <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
                <p>No tasks assigned yet</p>
                <p className="text-sm mt-2">Tasks assigned from Case Details will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-white/5 border border-white/10'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-semibold ${textPrimary}`}>{task.title}</h4>
                          {task.status === 'completed' ? (
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <UserCheck size={12} /> Completed
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <p className={textSecondary}>
                            <span className="font-medium">Assigned to:</span> {task.assignedToName}
                          </p>
                          <p className={textSecondary}>
                            <span className="font-medium">Case:</span> {task.caseName || 'General'}
                          </p>
                          <p className={textSecondary}>
                            <span className="font-medium">Deadline:</span> {formatIndianDate(task.deadline)}
                          </p>
                          <p className={textSecondary}>
                            <span className="font-medium">Assigned by:</span> {task.assignedByName}
                          </p>
                        </div>
                        {task.description && (
                          <p className={`mt-2 text-sm ${textSecondary}`}>{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2" title="Notification sent to user">
                        <Bell size={16} className="text-orange-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardBg} rounded-2xl border overflow-hidden`}
        >
          <div className="p-6 border-b border-white/10">
            <h2 className={`text-xl font-bold ${textPrimary}`}>User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>User</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>Username</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>Email</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>Role</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>Status</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-white/5'}`}>
                {users.map((u) => (
                  <tr key={u.id} className={`${hoverBg} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-cyber flex items-center justify-center text-white font-bold font-cyber shadow-cyber border border-cyber-blue/30">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium ${textPrimary}`}>{u.name}</p>
                          {u.id === currentUser?.id && (
                            <span className="text-xs text-orange-400 font-medium">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${textSecondary}`}>{u.username || 'N/A'}</td>
                    <td className={`px-6 py-4 ${textSecondary}`}>{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        disabled={u.id === currentUser?.id}
                        className={`px-3 py-2 rounded-lg border ${inputBg} ${textPrimary} ${
                          u.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } focus:outline-none focus:border-orange-500`}
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className={`p-2 rounded-lg transition-all ${hoverBg} hover:scale-110`}
                          title="Edit user"
                        >
                          <Edit2 size={18} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => openPwdModal(u)}
                          className={`p-2 rounded-lg transition-all ${hoverBg} hover:scale-110`}
                          title="Change password"
                        >
                          <Lock size={18} className="text-orange-400" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          disabled={u.id === currentUser?.id}
                          className={`p-2 rounded-lg transition-all ${
                            u.id === currentUser?.id
                              ? 'opacity-50 cursor-not-allowed'
                              : `${hoverBg} hover:scale-110`
                          }`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? (
                            <UserX size={18} className="text-amber-500" />
                          ) : (
                            <UserCheck size={18} className="text-emerald-500" />
                          )}
                        </button>
                        <button
                          onClick={() => confirmDelete(u)}
                          disabled={u.id === currentUser?.id}
                          className={`p-2 rounded-lg transition-all ${
                            u.id === currentUser?.id
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-red-500/20 hover:scale-110'
                          }`}
                          title="Delete user"
                        >
                          <Trash2 size={18} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>


        {/* Create User Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`${cardBg} rounded-2xl border p-6 w-full max-w-md shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-cyber rounded-lg border border-cyber-blue/30">
                      <UserPlus size={20} className="text-white" />
                    </div>
                    <h2 className={`text-xl font-bold ${textPrimary}`}>Create New User</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`p-2 rounded-lg ${hoverBg} transition-colors`}
                  >
                    <X size={20} className={textSecondary} />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                      placeholder="Enter username (for login)"
                      required
                    />
                    <p className={`text-xs ${textSecondary} mt-1`}>Used for login. No spaces allowed.</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={`flex-1 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/20 text-white hover:bg-white/10'} font-medium transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-cyber text-white rounded-xl font-semibold font-cyber hover:shadow-cyber transition-all border border-cyber-blue/30"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`${cardBg} rounded-2xl border p-6 w-full max-w-md shadow-2xl`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-red-500/20">
                    <AlertTriangle className="text-red-500" size={28} />
                  </div>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>Delete User</h2>
                </div>
                <p className={`${textSecondary} mb-6`}>
                  Are you sure you want to delete <strong className={textPrimary}>{selectedUser.name}</strong>? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/20 text-white hover:bg-white/10'} font-medium transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPwdModal && pwdTargetUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowPwdModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`${cardBg} rounded-2xl border p-6 w-full max-w-md shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                      <Lock size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textPrimary}`}>Change Password</h2>
                      <p className={`text-sm ${textSecondary}`}>For: {pwdTargetUser.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPwdModal(false)} className={`p-2 rounded-lg ${hoverBg} transition-colors`}>
                    <X size={20} className={textSecondary} />
                  </button>
                </div>

                {pwdNotif && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium ${
                      pwdNotif.type === 'success'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {pwdNotif.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {pwdNotif.message}
                  </motion.div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>New Password</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-orange-500 transition-colors`}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPwdModal(false)}
                      className={`flex-1 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/20 text-white hover:bg-white/10'} font-medium transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {pwdLoading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                        : <><Lock size={16} /> Update Password</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit User Modal */}
        <AnimatePresence>          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`${cardBg} rounded-2xl border p-6 w-full max-w-md shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Edit2 size={20} className="text-white" />
                    </div>
                    <h2 className={`text-xl font-bold ${textPrimary}`}>Edit User</h2>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`p-2 rounded-lg ${hoverBg} transition-colors`}
                  >
                    <X size={20} className={textSecondary} />
                  </button>
                </div>

                <form onSubmit={handleEditUser} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-blue-500 transition-colors`}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Username</label>
                    <input
                      type="text"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-blue-500 transition-colors`}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${textPrimary} focus:outline-none focus:border-blue-500 transition-colors`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className={`flex-1 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/20 text-white hover:bg-white/10'} font-medium transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default AdminPage;

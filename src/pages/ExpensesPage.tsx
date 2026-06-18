import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatIndianDate } from '../utils/dateFormat';

type ViewMode = 'expenses' | 'income';

interface IncomeRow {
  id: string;
  amount: number;
  date: string;
  payment_mode: string;
  reference_id: string | null;
  case_name: string;
  file_no: string;
}

const ExpensesPage: React.FC = () => {
  const { expenses, deleteExpense, getExpensesByMonth } = useData();
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<ViewMode>('expenses');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ── Income state ──
  const [income, setIncome] = useState<IncomeRow[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const tenantId = user?.tenant_id;

  const monthlyExpenses = useMemo(() => {
    return getExpensesByMonth(selectedMonth);
  }, [expenses, selectedMonth, getExpensesByMonth]);

  const stats = useMemo(() => {
    const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = monthlyExpenses.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [monthlyExpenses]);

  // Fetch income (accepted case payments) for the selected month
  const fetchIncome = useCallback(async () => {
    if (!tenantId) return;
    setIncomeLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const startOfMonth = `${selectedMonth}-01`;
    const endDate = new Date(year, month, 0).getDate(); // last day of month
    const endOfMonth = `${selectedMonth}-${String(endDate).padStart(2, '0')}`;

    const { data } = await supabase
      .from('case_payments')
      .select('*, cases(client_name, file_no)')
      .eq('tenant_id', tenantId)
      .eq('is_accepted', true)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false });

    const rows: IncomeRow[] = (data || []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount) || 0,
      date: p.date,
      payment_mode: p.payment_mode || '—',
      reference_id: p.reference_id,
      case_name: p.cases?.client_name || 'Unknown Case',
      file_no: p.cases?.file_no || '',
    }));
    setIncome(rows);
    setIncomeLoading(false);
  }, [tenantId, selectedMonth]);

  useEffect(() => {
    if (view === 'income') fetchIncome();
  }, [view, fetchIncome]);

  const incomeTotal = useMemo(() => income.reduce((sum, r) => sum + r.amount, 0), [income]);

  const cardBg = theme === 'light' ? 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-md' : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60';
  const rowBorder = theme === 'light' ? 'border-gray-100' : 'border-white/5';

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(id);
    }
  };

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold font-cyber ${textPrimary}`}>
              {view === 'expenses' ? 'Expense Management' : 'Income — Payments Received'}
            </h1>
            <p className={`mt-1 ${textSecondary} font-court`}>
              {view === 'expenses' ? 'Track and manage monthly office expenses' : 'Monthly view of payments received per case'}
            </p>
          </div>
          {view === 'expenses' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-cyber text-white px-6 py-3 rounded-xl font-semibold font-cyber hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Expense
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className={`inline-flex mt-5 rounded-xl p-1 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
          <button
            onClick={() => setView('expenses')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'expenses' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : textSecondary}`}
          >
            <TrendingDown size={16} /> Expenses
          </button>
          <button
            onClick={() => setView('income')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'income' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : textSecondary}`}
          >
            <TrendingUp size={16} /> Income
          </button>
        </div>
      </motion.div>

      {/* Month Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <label className={`text-sm font-semibold ${textSecondary}`}>Filter by Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'light'
                ? 'bg-white text-gray-900 border-gray-300'
                : 'bg-white/5 text-white border-orange-500/30'
            }`}
          />
          <span className={`text-lg font-bold ${textPrimary}`}>{formatMonthName(selectedMonth)}</span>
        </div>
      </motion.div>

      {/* ════════════ EXPENSES VIEW ════════════ */}
      {view === 'expenses' && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className={`${cardBg} p-6 rounded-xl border w-full flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl">
                  <TrendingDown size={28} className="text-white" />
                </div>
                <div className="text-left">
                  <p className={`text-sm ${textSecondary}`}>Total Expenses for {formatMonthName(selectedMonth)}</p>
                  <p className={`text-3xl font-bold ${textPrimary}`}>₹{stats.total.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold">
                TOTAL
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {monthlyExpenses.length === 0 ? (
              <div className={`${cardBg} p-12 rounded-2xl border text-center`}>
                <p className={textSecondary}>No expenses found for {formatMonthName(selectedMonth)}</p>
              </div>
            ) : (
              monthlyExpenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${cardBg} p-6 rounded-xl border hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${textPrimary}`}>₹{expense.amount.toLocaleString('en-IN')}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                          EXPENSE
                        </span>
                      </div>
                      <p className={`${textSecondary} mb-3`}>{expense.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <p className={textSecondary}><span className="font-semibold">Added by:</span> {expense.addedByName}</p>
                        <p className={textSecondary}><span className="font-semibold">Date:</span> {formatIndianDate(expense.createdAt)}</p>
                        <p className={textSecondary}><span className="font-semibold">Month:</span> {formatMonthName(expense.month)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(isAdmin || expense.addedBy === user?.id) && (
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30"
                          title="Delete Expense"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </>
      )}

      {/* ════════════ INCOME VIEW ════════════ */}
      {view === 'income' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`${cardBg} rounded-2xl border overflow-hidden`}>
            <div className={`p-5 border-b ${rowBorder} flex items-center gap-3`}>
              <div className="p-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <TrendingUp size={22} className="text-white" />
              </div>
              <h2 className={`font-bold ${textPrimary}`}>Payments Received — {formatMonthName(selectedMonth)}</h2>
            </div>

            {incomeLoading ? (
              // Loading skeleton
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-12 rounded-lg animate-pulse ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`} />
                ))}
              </div>
            ) : income.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp size={40} className={`${textSecondary} mx-auto mb-3`} />
                <p className={textSecondary}>No income recorded for {formatMonthName(selectedMonth)}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left ${textSecondary} border-b ${rowBorder}`}>
                      <th className="p-4 font-semibold">Case Name</th>
                      <th className="p-4 font-semibold">Amount Received</th>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {income.map((row) => (
                      <tr key={row.id} className={`border-b ${rowBorder} last:border-0`}>
                        <td className={`p-4 font-medium ${textPrimary}`}>
                          {row.case_name}
                          {row.file_no && <span className={`block text-xs ${textSecondary}`}>{row.file_no}</span>}
                        </td>
                        <td className="p-4 font-semibold text-green-500">₹{row.amount.toLocaleString('en-IN')}</td>
                        <td className={`p-4 ${textSecondary}`}>{formatIndianDate(row.date)}</td>
                        <td className={`p-4 ${textSecondary}`}>
                          {row.payment_mode}{row.reference_id ? ` · Ref: ${row.reference_id}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!incomeLoading && income.length > 0 && (
              <div className={`p-5 border-t ${rowBorder} flex items-center justify-between`}>
                <span className={`font-semibold ${textPrimary}`}>Total received in {formatMonthName(selectedMonth)}:</span>
                <span className="text-2xl font-bold text-green-500">₹{incomeTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && <AddExpenseModal onClose={() => setShowAddModal(false)} />}
    </MainLayout>
  );
};

// Add Expense Modal Component
interface AddExpenseModalProps {
  onClose: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose }) => {
  const { addExpense: addExpenseToContext } = useData();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    month: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })(),
  });

  const cardBg = theme === 'light' ? 'bg-white' : 'glass-dark';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-white/5 text-white border-orange-500/30';
  const labelClass = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/80';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description || !formData.month) {
      alert('Please fill in all required fields');
      return;
    }

    const expenseData = {
      amount: parseFloat(formData.amount),
      description: formData.description,
      month: formData.month,
      addedBy: user?.id || '',
      addedByName: user?.name || 'Unknown',
    };

    await addExpenseToContext(expenseData);
    onClose();
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
        className={`${cardBg} p-6 rounded-2xl border ${
          theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20'
        } max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <h2 className={`text-2xl font-bold mb-6 ${textPrimary}`}>Add New Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Amount *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter expense description"
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500 resize-none`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>Month *</label>
            <input
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-cyber text-white font-semibold py-3 rounded-lg hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 font-semibold py-3 rounded-lg transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 border border-cyber-blue/30'
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

export default ExpensesPage;

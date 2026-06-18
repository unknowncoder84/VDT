import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, Trash2, Edit, RotateCcw, User, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers } from '../lib/userManagement';
import { Task, User as UserType } from '../types';
import { formatIndianDate } from '../utils/dateFormat';

type TaskFilter = 'all' | 'my-tasks' | 'pending' | 'completed';
type TaskTypeFilter = 'all' | 'case' | 'custom';
type ViewMode = 'list' | 'calendar';
type TimePeriodFilter = 'all' | 'week' | 'month' | 'year';

const TasksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { tasks, completeTask, deleteTask, updateTask } = useData();
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState<TaskFilter>('my-tasks');
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('all');
  const [timePeriodFilter, setTimePeriodFilter] = useState<TimePeriodFilter>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Fetch all users for the filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      }
    };
    fetchUsers();
  }, []);

  // Read filter from URL on mount and when URL changes
  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter === 'pending' || urlFilter === 'completed' || urlFilter === 'all' || urlFilter === 'my-tasks') {
      setFilter(urlFilter as TaskFilter);
      console.log('🔍 TasksPage: Filter applied from URL:', urlFilter);
    }
  }, [searchParams]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply user filter first (if selected)
    if (userFilter !== 'all') {
      filtered = filtered.filter((t) => t.assignedTo === userFilter);
    } else {
      // Apply status filter only if no specific user is selected
      switch (filter) {
        case 'my-tasks':
          filtered = filtered.filter((t) => t.assignedTo === user?.id);
          break;
        case 'pending':
          filtered = filtered.filter((t) => t.status === 'pending');
          break;
        case 'completed':
          filtered = filtered.filter((t) => t.status === 'completed');
          break;
      }
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Apply time period filter based on deadline
    if (timePeriodFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((t) => {
        const deadline = new Date(t.deadline);
        
        switch (timePeriodFilter) {
          case 'week': {
            // Get start of current week (Sunday)
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
            // Get end of current week (Saturday)
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            return deadline >= startOfWeek && deadline <= endOfWeek;
          }
          case 'month': {
            // Current month
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return deadline >= startOfMonth && deadline <= endOfMonth;
          }
          case 'year': {
            // Current year
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            return deadline >= startOfYear && deadline <= endOfYear;
          }
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, filter, typeFilter, timePeriodFilter, userFilter, user?.id]);

  const stats = useMemo(() => {
    const myTasks = tasks.filter((t) => t.assignedTo === user?.id);
    return {
      total: tasks.length,
      myTasks: myTasks.length,
      pending: myTasks.filter((t) => t.status === 'pending').length,
      completed: myTasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks, user?.id]);

  const cardBg = theme === 'light' ? 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-md' : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60';

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleReopenTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to reopen this task?')) {
      updateTask(taskId, { status: 'pending', completedAt: undefined });
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold font-cyber ${textPrimary}`}>
              Task Management <span className="text-cyber-blue text-glow">({filteredTasks.length})</span>
            </h1>
            <p className={`mt-1 ${textSecondary} font-court`}>
              {filter === 'pending' ? 'Showing pending tasks' : 
               filter === 'completed' ? 'Showing completed tasks' :
               filter === 'my-tasks' ? 'Showing your assigned tasks' :
               'Showing all tasks'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-orange-500/30">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <List size={18} />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 flex items-center gap-2 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Calendar size={18} />
                Calendar
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold font-cyber hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 border border-orange-500/30 flex items-center gap-2"
              >
                <Plus size={20} />
                Create Task
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBg} p-4 rounded-xl border`}
        >
          <p className={`text-sm ${textSecondary}`}>My Tasks</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.myTasks}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBg} p-4 rounded-xl border`}
        >
          <p className={`text-sm ${textSecondary}`}>Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardBg} p-4 rounded-xl border`}
        >
          <p className={`text-sm ${textSecondary}`}>Completed</p>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${cardBg} p-4 rounded-xl border`}
        >
          <p className={`text-sm ${textSecondary}`}>Total Tasks</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(['my-tasks', 'all', 'pending', 'completed'] as TaskFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setUserFilter('all'); // Reset user filter when changing status filter
              }}
              className={`px-4 py-2 rounded-xl font-medium font-cyber transition-all duration-300 text-sm ${
                filter === f && userFilter === 'all'
                  ? 'bg-gradient-cyber text-white shadow-cyber border border-cyber-blue/50'
                  : theme === 'light'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-cyber-blue/10 text-cyber-blue/60 hover:bg-cyber-blue/20 border border-cyber-blue/20'
              }`}
            >
              {f === 'my-tasks' ? 'My Tasks' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        {/* User Filter Dropdown */}
        <div className="flex items-center gap-2">
          <User size={18} className={textSecondary} />
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
              userFilter !== 'all'
                ? 'bg-gradient-cyber text-white shadow-cyber border border-cyber-blue/50'
                : theme === 'light'
                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                  : 'bg-cyber-blue/10 text-cyber-blue/60 border border-cyber-blue/20'
            }`}
          >
            <option value="all">Filter by User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'case', 'custom'] as TaskTypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
                typeFilter === t
                  ? 'bg-orange-500 text-white'
                  : theme === 'light'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
              }`}
            >
              {t === 'all' ? 'All Types' : t === 'case' ? 'Case Tasks' : 'Custom Tasks'}
            </button>
          ))}
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-2 mr-2">
          <Calendar size={18} className={textSecondary} />
          <span className={`text-sm font-semibold ${textSecondary}`}>Time Period:</span>
        </div>
        {(['all', 'week', 'month', 'year'] as TimePeriodFilter[]).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriodFilter(period)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
              timePeriodFilter === period
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
            }`}
          >
            {period === 'all' ? 'All Time' : 
             period === 'week' ? 'This Week' : 
             period === 'month' ? 'This Month' : 
             'This Year'}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <TaskCalendarView
          tasks={filteredTasks}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          theme={theme}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          onTaskClick={(task) => setEditingTask(task)}
        />
      )}

      {/* Task List */}
      {viewMode === 'list' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {filteredTasks.length === 0 ? (
          <div className={`${cardBg} p-12 rounded-2xl border text-center`}>
            <p className={textSecondary}>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task: Task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${cardBg} p-6 rounded-xl border hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-bold ${textPrimary}`}>{task.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      task.type === 'case' 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {task.type === 'case' ? 'Case Task' : 'Custom Task'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'completed'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <p className={`${textSecondary} mb-3`}>{task.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <p className={textSecondary}>
                      <span className="font-semibold">Assigned to:</span> {task.assignedToName}
                    </p>
                    <p className={textSecondary}>
                      <span className="font-semibold">Assigned by:</span> {task.assignedByName}
                    </p>
                    <p className={textSecondary}>
                      <span className="font-semibold">Deadline:</span> {formatIndianDate(task.deadline)}
                    </p>
                    {task.caseName && (
                      <p className={textSecondary}>
                        <span className="font-semibold">Case:</span> {task.caseName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status === 'pending' && (task.assignedTo === user?.id || isAdmin) && (
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all border border-green-500/30"
                      title="Mark as Complete"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  {isAdmin && task.status === 'completed' && (
                    <button
                      onClick={() => handleReopenTask(task.id)}
                      className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all border border-amber-500/30"
                      title="Reopen Task"
                    >
                      <RotateCcw size={20} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                      title="Edit Task"
                    >
                      <Edit size={20} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30"
                      title="Delete Task"
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
      )}

      {/* Create Task Modal */}
      {showCreateModal && <CreateTaskModal onClose={() => setShowCreateModal(false)} />}
      
      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
        />
      )}
    </MainLayout>
  );
};

// Task Calendar View Component
interface TaskCalendarViewProps {
  tasks: Task[];
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  theme: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  onTaskClick: (task: Task) => void;
}

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  calendarDate,
  setCalendarDate,
  theme,
  cardBg,
  textPrimary,
  textSecondary,
  onTaskClick,
}) => {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(calendarDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getTasksForDay = (day: number) => {
    const targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    return tasks.filter((task) => {
      const taskDeadline = new Date(task.deadline);
      return (
        taskDeadline.getDate() === targetDate.getDate() &&
        taskDeadline.getMonth() === targetDate.getMonth() &&
        taskDeadline.getFullYear() === targetDate.getFullYear()
      );
    });
  };

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      calendarDate.getMonth() === today.getMonth() &&
      calendarDate.getFullYear() === today.getFullYear()
    );
  };

  const isPastDeadline = (day: number) => {
    const targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    return targetDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${cardBg} p-6 rounded-2xl border mb-6`}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className={`p-2 rounded-lg transition-all ${
            theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
          }`}
        >
          <ChevronLeft size={24} className={textPrimary} />
        </button>
        <h2 className={`text-xl font-bold ${textPrimary}`}>
          {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className={`p-2 rounded-lg transition-all ${
            theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
          }`}
        >
          <ChevronRight size={24} className={textPrimary} />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className={`text-center text-sm font-semibold py-2 ${textSecondary}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before the first day of month */}
        {Array.from({ length: startingDay }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[100px]" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayTasks = getTasksForDay(day);
          const isPast = isPastDeadline(day);

          return (
            <div
              key={day}
              className={`min-h-[100px] p-2 rounded-xl border transition-all ${
                isToday(day)
                  ? 'border-orange-500 bg-orange-500/10'
                  : theme === 'light'
                    ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    : 'border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${
                isToday(day) ? 'text-orange-500' : textPrimary
              }`}>
                {day}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[70px]">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`text-xs p-1.5 rounded cursor-pointer truncate transition-all ${
                      task.status === 'completed'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                        : isPast
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                    }`}
                    title={`${task.title} - ${task.assignedToName}`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500/50 border border-orange-500" />
          <span className={`text-sm ${textSecondary}`}>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500" />
          <span className={`text-sm ${textSecondary}`}>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500" />
          <span className={`text-sm ${textSecondary}`}>Overdue</span>
        </div>
      </div>
    </motion.div>
  );
};

// Create Task Modal Component
interface CreateTaskModalProps {
  onClose: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose }) => {
  const { addTask, cases } = useData();
  const { theme } = useTheme();
  const { user, users } = useAuth();
  const [taskType, setTaskType] = useState<'case' | 'custom'>('custom');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    caseId: '',
    customCaseName: '',
    deadline: '',
  });
  const [caseInputMode, setCaseInputMode] = useState<'select' | 'custom'>('select');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('all');

  const cardBg = theme === 'light' ? 'bg-white' : 'glass-dark';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-white/5 text-white border-orange-500/30';
  const labelClass = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/80';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.assignedTo || !formData.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    if (taskType === 'case' && caseInputMode === 'select' && !formData.caseId) {
      alert('Please select a case');
      return;
    }

    if (taskType === 'case' && caseInputMode === 'custom' && !formData.customCaseName) {
      alert('Please enter a custom case name');
      return;
    }

    const assignedUser = users.find((u) => u.id === formData.assignedTo);
    const selectedCase = taskType === 'case' && formData.caseId ? cases.find((c) => c.id === formData.caseId) : null;

    // Format deadline as YYYY-MM-DD string for database
    const deadlineStr = formData.deadline; // Already in YYYY-MM-DD format from date input

    const taskData = {
      type: taskType,
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      assignedToName: assignedUser?.name || 'Unknown',
      assignedBy: user?.id || '',
      assignedByName: user?.name || 'Unknown',
      caseId: taskType === 'case' && caseInputMode === 'select' ? formData.caseId : undefined,
      caseName: caseInputMode === 'custom' ? formData.customCaseName : selectedCase?.clientName,
      deadline: deadlineStr,
      status: 'pending' as const,
    };

    await addTask(taskData);
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
        className={`${cardBg} p-6 rounded-2xl border ${theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20'} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <h2 className={`text-2xl font-bold mb-6 ${textPrimary}`}>Create New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Task Type *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTaskType('custom')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  taskType === 'custom'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
                }`}
              >
                Custom Task
              </button>
              <button
                type="button"
                onClick={() => setTaskType('case')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  taskType === 'case'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                }`}
              >
                Case Task
              </button>
            </div>
          </div>

          {/* Case Selection (only for case tasks) */}
          {taskType === 'case' && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
                Select Case *
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setCaseInputMode('select')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    caseInputMode === 'select'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : theme === 'light'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                  }`}
                >
                  Select from List
                </button>
                <button
                  type="button"
                  onClick={() => setCaseInputMode('custom')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    caseInputMode === 'custom'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : theme === 'light'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
                  }`}
                >
                  Custom Input
                </button>
              </div>
              
              {caseInputMode === 'custom' ? (
                <input
                  type="text"
                  value={formData.customCaseName}
                  placeholder="Enter custom case name or reference"
                  onChange={(e) => setFormData({ ...formData, customCaseName: e.target.value, caseId: '' })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
                  required
                />
              ) : (
                <>
                  {/* Case Type Filter */}
                  <div className="mb-3">
                    <label className={`block text-xs font-semibold mb-2 ${labelClass}`}>
                      Filter by Case Type
                    </label>
                    <select
                      value={caseTypeFilter}
                      onChange={(e) => setCaseTypeFilter(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBgClass} focus:outline-none focus:border-blue-500`}
                    >
                      <option value="all">All Case Types</option>
                      <option value="Civil">Civil</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Family">Family</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Property">Property</option>
                      <option value="Labour">Labour</option>
                      <option value="Tax">Tax</option>
                      <option value="Constitutional">Constitutional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Case Selection Dropdown */}
                  <select
                    value={formData.caseId}
                    onChange={(e) => setFormData({ ...formData, caseId: e.target.value, customCaseName: '' })}
                    className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-blue-500`}
                    required={taskType === 'case'}
                  >
                    <option value="">Select a case...</option>
                    {cases
                      .filter((c) => caseTypeFilter === 'all' || c.caseType === caseTypeFilter)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientName} - {c.fileNo} ({c.caseType})
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500 resize-none`}
            />
          </div>

          {/* Assign To */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Assign To *
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            >
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Deadline *
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-cyber text-white font-semibold py-3 rounded-lg hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
            >
              Create Task
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

// Edit Task Modal Component
interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose }) => {
  const { updateTask, cases } = useData();
  const { theme } = useTheme();
  const { users } = useAuth();
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    assignedTo: task.assignedTo,
    caseId: task.caseId || '',
    caseName: task.caseName || '',
    deadline: new Date(task.deadline).toISOString().split('T')[0],
    status: task.status,
  });

  const cardBg = theme === 'light' ? 'bg-white' : 'glass-dark';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-white/5 text-white border-orange-500/30';
  const labelClass = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/80';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.assignedTo || !formData.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    const assignedUser = users.find((u) => u.id === formData.assignedTo);
    const selectedCase = formData.caseId ? cases.find((c) => c.id === formData.caseId) : null;

    // Use deadline string directly (already in YYYY-MM-DD format)
    await updateTask(task.id, {
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      assignedToName: assignedUser?.name || task.assignedToName,
      caseId: formData.caseId || undefined,
      caseName: selectedCase?.clientName || formData.caseName,
      deadline: formData.deadline,
      status: formData.status as 'pending' | 'completed',
    });
    
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
        className={`${cardBg} p-6 rounded-2xl border ${theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20'} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Edit Task</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            task.type === 'case' 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {task.type === 'case' ? 'Case Task' : 'Custom Task'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Status */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Status
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'pending' })}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  formData.status === 'pending'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'completed' })}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  formData.status === 'completed'
                    ? 'bg-green-500 text-white shadow-lg'
                    : theme === 'light'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500 resize-none`}
            />
          </div>

          {/* Case Selection (only for case tasks) */}
          {task.type === 'case' && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
                Case
              </label>
              <select
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-blue-500`}
              >
                <option value="">Select a case...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clientName} - {c.fileNo} ({c.caseType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assign To */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Assign To *
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            >
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>
              Deadline *
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${inputBgClass} focus:outline-none focus:border-orange-500`}
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-cyber text-white font-semibold py-3 rounded-lg hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
            >
              Save Changes
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

export default TasksPage;

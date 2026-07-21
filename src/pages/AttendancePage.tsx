import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, UserCheck, UserX, ChevronLeft, ChevronRight, X } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AttendanceStatus } from '../types';

const AttendancePage: React.FC = () => {
  const { attendance, markAttendance, clearAttendance, getAttendanceByDate } = useData();
  const { theme } = useTheme();
  const { user, users, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const cardBg = theme === 'light' ? 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-md' : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60';

  const todayAttendance = useMemo(() => {
    return getAttendanceByDate(selectedDate);
  }, [attendance, selectedDate]);

  const handleMarkAttendance = async (userId: string, status: AttendanceStatus) => {
    await markAttendance(userId, selectedDate, status);
  };

  const handleClearAttendance = async (userId: string) => {
    await clearAttendance(userId, selectedDate);
  };

  const getUserAttendanceStatus = (userId: string): AttendanceStatus | null => {
    const record = todayAttendance.find((a) => a.userId === userId);
    return record ? record.status : null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} p-4 md:p-6 rounded-2xl mb-6 border`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold font-cyber ${textPrimary}`}>
              Attendance Management
            </h1>
            <p className={`mt-1 ${textSecondary} font-court`}>
              {isAdmin ? 'Mark and track user attendance' : 'View your attendance records'}
            </p>
          </div>
          <CalendarIcon size={32} className={textPrimary} />
        </div>
      </motion.div>

      {/* Date Selector */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBg} p-4 md:p-6 rounded-2xl mb-6 border`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className={`p-3 rounded-xl transition-all ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 border border-cyber-blue/30'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className={`text-lg font-bold ${textPrimary}`}>{formatDate(selectedDate)}</p>
              <p className={`text-sm ${textSecondary}`}>
                {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : ''}
              </p>
            </div>
            <button
              onClick={() => changeDate(1)}
              className={`p-3 rounded-xl transition-all ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 border border-cyber-blue/30'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* User Attendance List */}
      {isAdmin ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Mark Attendance</h2>
          {users.map((u) => {
            const status = getUserAttendanceStatus(u.id);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${cardBg} p-4 md:p-6 rounded-xl border hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base md:text-lg font-bold ${textPrimary} break-words`}>{u.name}</h3>
                    <p className={`text-xs md:text-sm ${textSecondary} break-words`}>{u.email}</p>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>Role: {u.role}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:flex md:gap-3">
                    <button
                      onClick={() => handleMarkAttendance(u.id, 'present')}
                      className={`px-3 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        status === 'present'
                          ? 'bg-green-500 text-white shadow-lg'
                          : theme === 'light'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                      }`}
                    >
                      <UserCheck size={18} />
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(u.id, 'absent')}
                      className={`px-3 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        status === 'absent'
                          ? 'bg-red-500 text-white shadow-lg'
                          : theme === 'light'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                      }`}
                    >
                      <UserX size={18} />
                      Absent
                    </button>
                    <button
                      onClick={() => handleClearAttendance(u.id)}
                      className={`px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        status === null
                          ? 'bg-gray-500 text-white shadow-lg'
                          : theme === 'light'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30'
                      }`}
                      title="Clear attendance (leave as not marked)"
                    >
                      <X size={18} />
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setShowCalendar(true);
                      }}
                      className={`px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        theme === 'light'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                      }`}
                    >
                      <CalendarIcon size={18} />
                      Calendar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBg} p-6 rounded-2xl border`}
        >
          <button
            onClick={() => {
              setSelectedUserId(user?.id || null);
              setShowCalendar(true);
            }}
            className="w-full bg-gradient-cyber text-white px-6 py-4 rounded-xl font-semibold font-cyber hover:shadow-cyber transition-all duration-300 border border-cyber-blue/30"
          >
            View My Attendance Calendar
          </button>
        </motion.div>
      )}

      {/* Calendar Modal */}
      {showCalendar && selectedUserId && (
        <AttendanceCalendar
          userId={selectedUserId}
          onClose={() => {
            setShowCalendar(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </MainLayout>
  );
};

// Attendance Calendar Component
interface AttendanceCalendarProps {
  userId: string;
  onClose: () => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ userId, onClose }) => {
  const { getAttendanceByUser } = useData();
  const { theme } = useTheme();
  const { users } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const user = users.find((u) => u.id === userId);
  const userAttendance = getAttendanceByUser(userId, currentMonth, currentYear);

  const cardBg = theme === 'light' ? 'bg-white' : 'glass-dark';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/60';

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getAttendanceForDate = (day: number): AttendanceStatus | null => {
    const record = userAttendance.find((a) => {
      const date = new Date(a.date);
      return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    return record ? record.status : null;
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    const present = userAttendance.filter((a) => a.status === 'present').length;
    const absent = userAttendance.filter((a) => a.status === 'absent').length;
    const total = present + absent;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
    return { present, absent, total, percentage };
  }, [userAttendance]);

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const status = getAttendanceForDate(day);
    const isToday =
      day === new Date().getDate() &&
      currentMonth === new Date().getMonth() &&
      currentYear === new Date().getFullYear();

    days.push(
      <div
        key={day}
        className={`aspect-square flex items-center justify-center rounded-lg font-semibold text-sm transition-all ${
          isToday ? 'ring-2 ring-orange-500' : ''
        } ${
          status === 'present'
            ? 'bg-green-500 text-white'
            : status === 'absent'
              ? 'bg-red-500 text-white'
              : theme === 'light'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-white/5 text-gray-400'
        }`}
      >
        {day}
      </div>
    );
  }

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
        <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Attendance Calendar</h2>
        <p className={`${textSecondary} mb-6`}>{user?.name}</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-green-100' : 'bg-green-500/20'}`}>
            <p className={`text-xs ${textSecondary}`}>Present</p>
            <p className="text-2xl font-bold text-green-500">{stats.present}</p>
          </div>
          <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-red-100' : 'bg-red-500/20'}`}>
            <p className={`text-xs ${textSecondary}`}>Absent</p>
            <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
          </div>
          <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
            <p className={`text-xs ${textSecondary}`}>Total</p>
            <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
          </div>
          <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-orange-100' : 'bg-orange-500/20'}`}>
            <p className={`text-xs ${textSecondary}`}>Percentage</p>
            <p className="text-2xl font-bold text-orange-500">{stats.percentage}%</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className={`p-2 rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className={`text-lg font-bold ${textPrimary}`}>{monthName}</h3>
          <button
            onClick={() => changeMonth(1)}
            className={`p-2 rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className={`text-center text-xs font-semibold ${textSecondary}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{days}</div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className={`text-sm ${textSecondary}`}>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className={`text-sm ${textSecondary}`}>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`} />
            <span className={`text-sm ${textSecondary}`}>Not Marked</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${
            theme === 'light'
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 border border-cyber-blue/30'
          }`}
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

export default AttendancePage;

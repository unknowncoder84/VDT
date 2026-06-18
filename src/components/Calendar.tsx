import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { appointments, cases } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startingDayOfWeek = monthStart.getDay();
  const previousMonthDays = Array(startingDayOfWeek).fill(null);
  const allDays = [...previousMonthDays, ...daysInMonth];

  // Get appointments and case dates for the current month
  const dayEvents = useMemo(() => {
    const events: Record<string, { appointments: number; cases: number }> = {};
    
    // Count appointments per day
    appointments.forEach((apt) => {
      const dateStr = format(new Date(apt.date), 'yyyy-MM-dd');
      if (!events[dateStr]) events[dateStr] = { appointments: 0, cases: 0 };
      
      // All appointments are regular appointments now
      events[dateStr].appointments++;
    });
    
    // Count case next dates per day
    cases.forEach((c) => {
      const dateStr = format(new Date(c.nextDate), 'yyyy-MM-dd');
      if (!events[dateStr]) events[dateStr] = { appointments: 0, cases: 0 };
      events[dateStr].cases++;
    });
    
    return events;
  }, [appointments, cases, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cardBg = theme === 'light' 
    ? 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-md' 
    : 'glass-dark border-cyber-blue/20';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-cyber-blue';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60';
  const hoverBg = theme === 'light' ? 'hover:bg-orange-100' : 'hover:bg-cyber-blue/10';

  return (
    <div className={`${cardBg} rounded-2xl p-6 border shadow-card`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-cyber rounded-lg border border-cyber-blue/30 animate-cyber-pulse">
            <CalendarIcon size={18} className="text-white" />
          </div>
          <h3 className={`text-lg font-bold font-cyber ${textPrimary}`}>{format(currentDate, 'MMMM yyyy')}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className={`p-2 ${hoverBg} rounded-lg transition-colors`}
          >
            <ChevronLeft size={20} className={textSecondary} />
          </button>
          <button
            onClick={handleNextMonth}
            className={`p-2 ${hoverBg} rounded-lg transition-colors`}
          >
            <ChevronRight size={20} className={textSecondary} />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((day) => (
          <div key={day} className={`text-center text-xs font-semibold ${textSecondary} uppercase tracking-wide py-2`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, index) => {
          const dateStr = day ? format(day, 'yyyy-MM-dd') : '';
          const events = dateStr ? dayEvents[dateStr] : null;
          const hasEvents = events && (events.appointments > 0 || events.cases > 0);
          
          return (
            <div
              key={index}
              onClick={() => {
                if (day) {
                  navigate(`/events/${dateStr}`);
                }
              }}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium font-cyber transition-all cursor-pointer relative group ${
                day === null
                  ? 'text-gray-600 cursor-default'
                  : isToday(day)
                    ? 'bg-gradient-cyber text-white font-bold shadow-cyber border border-cyber-blue/50 hover:shadow-justice animate-pulse-slow'
                    : isSameMonth(day, currentDate)
                      ? `${textPrimary} ${hoverBg} hover:scale-110 hover:border-cyber-blue/30 ${hasEvents ? 'border border-orange-400/40' : ''}`
                      : 'text-gray-600'
              }`}
            >
              <span className="relative z-10">{day ? format(day, 'd') : ''}</span>
              {hasEvents && day && (
                <div className="absolute bottom-1 flex gap-0.5 z-10 flex-wrap justify-center">
                  {events.appointments > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${events.appointments} appointment(s)`} />
                  )}
                  {events.cases > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${events.cases} case date(s)`} />
                  )}
                </div>
              )}
              {hasEvents && day && (
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                  theme === 'light' ? 'bg-orange-100' : 'bg-orange-500/20'
                } pointer-events-none`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend and Today indicator */}
      <div className={`mt-4 pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20'} space-y-3`}>
        {/* Add Event Button */}
        <button
          onClick={() => navigate('/appointments')}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all duration-300 border border-green-500/30 flex items-center justify-center gap-2 mb-3"
        >
          <CalendarIcon size={18} />
          Add New Event
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-cyber animate-cyber-pulse" />
          <span className={`text-sm font-court ${textSecondary}`}>Today: {format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className={textSecondary}>Appointments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className={textSecondary}>Case Dates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

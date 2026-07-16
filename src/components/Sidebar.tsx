import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus,
  List,
  UserCheck,
  X,
  Shield,
  Scale,
  TrendingDown,
  CreditCard,
  Mail,
  BookOpen,
  Archive,
  Landmark,
  ExternalLink,
} from 'lucide-react';

const ECOURTS_URL = 'https://services.ecourts.gov.in/ecourtindia_v6/?p=cause_list/index';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTenant } from '../contexts/TenantContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const { theme } = useTheme();
  const { branding, tenant } = useTenant();
  const [isOfficeCasesOpen, setIsOfficeCasesOpen] = useState(false);

  // White label is active only on the Custom plan with branding enabled
  const whiteLabel = !!(branding?.white_label_active && tenant?.plan === 'custom');
  const firmName = branding?.firm_display_name || tenant?.firm_name || 'Your Firm';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'My Cases', path: '/cases' },
    { icon: UserCheck, label: 'Tasks', path: '/tasks' },
    { icon: UserCheck, label: 'Attendance', path: '/attendance' },
    { icon: Users, label: 'Appointments', path: '/appointments' },
    { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
    { icon: BookOpen, label: 'Library', path: '/library' },
    { icon: Archive, label: 'Storage', path: '/storage' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const adminMenuItems = [
    { icon: Mail, label: 'Reminders', path: '/reminders' },
    { icon: CreditCard, label: 'Subscription', path: '/subscription' },
    { icon: Shield, label: 'Admin Panel', path: '/admin' },
  ];

  const officeCasesSubmenu = [
    { icon: Plus, label: 'Create Case', path: '/cases/create' },
    { icon: List, label: 'List Cases', path: '/cases' },
    { icon: Scale, label: 'Council Cases', path: '/counsel/cases' },
  ];

  const isActive = (path: string) => location.pathname === path;


  const bgClass = theme === 'light' 
    ? 'bg-white border-gray-200 shadow-lg' 
    : 'bg-[#1a1a2e]/98 backdrop-blur-2xl border-white/5';
  const textClass = theme === 'light' ? 'text-gray-700' : 'text-gray-300';
  const secondaryTextClass = theme === 'light' ? 'text-gray-400' : 'text-gray-500';
  const hoverClass = theme === 'light' ? 'hover:bg-orange-50 hover:text-orange-600' : 'hover:bg-white/5';
  const activeBgClass = 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30';

  return (
    <>
      <div
        className={`${bgClass} h-screen flex flex-col transition-all duration-300 ease-in-out overflow-hidden fixed md:relative z-40 ${
          isOpen
            ? 'w-64 md:w-72 translate-x-0 border-r'
            : 'w-64 md:w-0 -translate-x-full md:translate-x-0 border-r-0'
        }`}
      >
        {/* Background Overlay - Solid black for dark mode */}
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white/98'}`} />
        {/* Header — VakilDesk brand sits at the very top of the sidebar */}
        <div className={`relative flex items-center gap-3 p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} flex-shrink-0`}>
          <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden shadow-md">
            <img src="/logo.svg" alt="VakilDesk" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            {whiteLabel ? (
              <>
                <h1 className={`text-lg font-bold tracking-wide leading-tight truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{firmName}</h1>
                <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">by VakilDesk</p>
              </>
            ) : (
              <>
                <h1 className={`text-lg font-bold tracking-wide leading-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>VakilDesk</h1>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{firmName}</p>
              </>
            )}
          </div>
          <button onClick={onToggle} className={`md:hidden p-2.5 rounded-xl ${hoverClass} transition-colors`}>
            <X size={20} className={textClass} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          <p className={`text-xs font-semibold uppercase ${secondaryTextClass} px-3 py-2 tracking-wider`}>Main Menu</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active ? activeBgClass : `${textClass} ${hoverClass}`
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* eCourts external link */}
          <a
            href={ECOURTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${textClass} ${hoverClass}`}
          >
            <Landmark size={20} />
            <span className="font-medium flex-1">eCourts Cause List</span>
            <ExternalLink size={15} className="opacity-60" />
          </a>

          {/* Case Management — below Main Menu */}
          <p className={`text-xs font-semibold uppercase ${secondaryTextClass} px-3 py-2 mt-6 tracking-wider`}>Case Management</p>
          <div>
            <button
              onClick={() => setIsOfficeCasesOpen(!isOfficeCasesOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isOfficeCasesOpen ? (theme === 'light' ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400') : `${textClass} ${hoverClass}`
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={20} />
                <span className="font-medium">Office Cases</span>
              </div>
              {isOfficeCasesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOfficeCasesOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-orange-500/30 pl-4">
                {officeCasesSubmenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const active = isActive(subItem.path);
                  return (
                    <Link key={subItem.path + subItem.label} to={subItem.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${active ? (theme === 'light' ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400') : `${textClass} ${hoverClass}`}`}>
                      <SubIcon size={16} />
                      <span className="font-medium">{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Administration — below Case Management, admin only */}
          {isAdmin && (
            <>
              <p className={`text-xs font-semibold uppercase ${secondaryTextClass} px-3 py-2 mt-6 tracking-wider`}>Administration</p>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? activeBgClass : `${textClass} ${hoverClass}`}`}>
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

        </nav>

        {/* Logout */}
        <div className={`relative p-3 md:p-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${theme === 'light' ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10'}`}>
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30" onClick={onToggle} />}
    </>
  );
};

export default Sidebar;

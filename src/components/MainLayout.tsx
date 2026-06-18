import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../contexts/ThemeContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  // Start with sidebar closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  const bgClass = theme === 'light' 
    ? 'bg-gradient-to-br from-[#fafbff] via-[#f0f4ff] to-[#e8f0ff]' 
    : 'bg-gradient-void';

  return (
    <div className={`flex h-screen ${bgClass} ${theme === 'light' ? 'text-gray-900' : 'text-white'} overflow-hidden`}>
      {/* Sci-Fi Animated Background Elements */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyber-blue/10 rounded-full blur-3xl animate-float-cyber" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl animate-float-cyber" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-blue/5 rounded-full blur-3xl" />
          {/* Matrix-like background */}
          <div className="matrix-bg" />
        </div>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 page-transition">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

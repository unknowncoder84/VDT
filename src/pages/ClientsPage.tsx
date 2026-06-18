import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { cases } = useData();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique clients from cases
  const clients = useMemo(() => {
    const clientMap = new Map();
    cases.forEach((caseItem) => {
      if (!clientMap.has(caseItem.clientEmail)) {
        clientMap.set(caseItem.clientEmail, {
          name: caseItem.clientName,
          email: caseItem.clientEmail,
          mobile: caseItem.clientMobile,
          totalCases: 1,
        });
      } else {
        const client = clientMap.get(caseItem.clientEmail);
        client.totalCases += 1;
      }
    });
    return Array.from(clientMap.values());
  }, [cases]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.mobile.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';
  const hoverClass = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-cyber-blue/10';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const headerBgClass = theme === 'light' ? 'bg-gray-100' : 'bg-cyber-blue/10';

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-6 rounded-lg mb-6 border ${borderClass}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>Client Management</h1>
            <p className={`mt-2 font-court ${theme === 'light' ? 'text-gray-600' : 'text-cyber-blue/60'}`}>
              {filteredClients.length} Clients
            </p>
          </div>
          <button 
            onClick={() => navigate('/cases/create')}
            className="bg-gradient-cyber text-white px-6 py-3 rounded-lg font-semibold font-cyber hover:shadow-cyber transition-all duration-300 flex items-center gap-2 border border-cyber-blue/30"
          >
            <UserPlus size={20} />
            Add Client
          </button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-end mb-6 gap-4"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">SEARCH</span>
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`px-4 py-2 rounded border ${inputBgClass} focus:outline-none focus:border-cyber-blue focus:shadow-cyber transition-colors`}
          />
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Search size={20} />
          </button>
        </div>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${bgClass} rounded-xl overflow-hidden border ${borderClass}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderClass} ${headerBgClass}`}>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>SR</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>CLIENT NAME</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>EMAIL</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>MOBILE</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>TOTAL CASES</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <tr
                    key={client.email}
                    className={`border-b ${borderClass} ${hoverClass} transition-colors duration-200`}
                  >
                    <td className="py-4 px-6">{index + 1}</td>
                    <td className="py-4 px-6 font-medium">{client.name}</td>
                    <td className="py-4 px-6">{client.email}</td>
                    <td className="py-4 px-6">{client.mobile}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full bg-cyber-blue/20 text-cyber-blue text-sm font-medium font-cyber border border-cyber-blue/30">
                        {client.totalCases}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => navigate('/cases')}
                        className={`px-4 py-2 rounded font-semibold text-sm ${
                          theme === 'light' 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        View Cases
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center">
                    <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
                      No clients found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ClientsPage;

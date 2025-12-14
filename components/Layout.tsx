import React, { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, Home, Settings, UserCircle } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, renters } = useApp();
  
  if (!currentUser.role) return <>{children}</>;

  const user = currentUser.role === 'renter' 
    ? renters.find(r => r.id === currentUser.id) 
    : { name: 'Admin' };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Home size={20} />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">GharRent</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <UserCircle size={16} />
                <span>{user?.name}</span>
                <span className="text-xs bg-white px-2 py-0.5 rounded shadow-sm border border-gray-200 uppercase">{currentUser.role}</span>
            </div>
            <button 
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
            >
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* AI Assistant - Only for Admin */}
      {currentUser.role === 'admin' && <AIAssistant />}
    </div>
  );
};

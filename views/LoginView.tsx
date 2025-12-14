import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, User, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LoginView: React.FC = () => {
  const { login, renters, adminPin } = useApp();
  const [mode, setMode] = useState<'selection' | 'admin' | 'renter'>('selection');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = () => {
    if (inputValue === adminPin) {
        login('admin');
    } else {
        setError('Invalid PIN.');
    }
  };

  const handleRenterLogin = () => {
    const renter = renters.find(r => r.phone === inputValue);
    if (renter) {
        login('renter', renter.id);
    } else {
        setError('Phone number not found. Use mock numbers (e.g. 9876543210).');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Building2 className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to GharRent</h1>
            <p className="text-indigo-100">Smart Rental Management</p>
        </div>

        <div className="p-8">
            {mode === 'selection' && (
                <div className="space-y-4">
                    <p className="text-center text-gray-600 mb-6">Who are you?</p>
                    <button 
                        onClick={() => setMode('admin')}
                        className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Property Owner</h3>
                            <p className="text-sm text-gray-500">Access Admin Dashboard</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setMode('renter')}
                        className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <User size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Tenant / Renter</h3>
                            <p className="text-sm text-gray-500">View your dues & history</p>
                        </div>
                    </button>
                </div>
            )}

            {mode !== 'selection' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                     <button onClick={() => { setMode('selection'); setError(''); setInputValue(''); }} className="text-sm text-gray-500 hover:text-gray-900 mb-2">&larr; Back</button>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {mode === 'admin' ? 'Owner Login' : 'Renter Login'}
                    </h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {mode === 'admin' ? 'Enter PIN' : 'Phone Number'}
                        </label>
                        <input
                            type={mode === 'admin' ? 'password' : 'tel'}
                            value={inputValue}
                            onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={mode === 'admin' ? '****' : 'e.g. 9876543210'}
                        />
                         {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                         {mode === 'admin' && <p className="text-xs text-gray-400 mt-2">Default PIN: 1234</p>}
                    </div>

                    <Button 
                        onClick={mode === 'admin' ? handleAdminLogin : handleRenterLogin}
                        className="w-full mt-2"
                    >
                        Login
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

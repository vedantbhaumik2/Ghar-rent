import React from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Calendar, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Helper to format date as DD/MM/YYYY
const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('en-GB');
};

export const RenterPortal: React.FC = () => {
  const { currentUser, renters, transactions } = useApp();
  
  if (!currentUser.id) return <div>Error: No renter ID found.</div>;

  const me = renters.find(r => r.id === currentUser.id);
  const myTransactions = transactions.filter(t => t.renterId === currentUser.id);

  if (!me) return <div className="p-4 text-center text-red-500">Renter profile not found. Please contact admin.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold mb-1">Hello, {me.name} 👋</h1>
                <p className="text-indigo-100 opacity-90">Unit {me.unitNumber}</p>
            </div>
        </div>
        
        <div className="mt-8 flex items-end gap-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="flex-1">
                <p className="text-sm font-medium text-indigo-100 mb-1">Total Pending Balance</p>
                <div className="text-4xl font-bold">₹{me.balance.toLocaleString()}</div>
            </div>
            {me.balance > 0 ? (
                <span className="mb-2 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold shadow-sm">Action Required</span>
            ) : (
                <span className="mb-2 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
                    <CheckCircle size={12} /> All Clear
                </span>
            )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" /> Your Invoices
        </h3>

        {myTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                No invoices found.
            </div>
        ) : (
            myTransactions.map(t => {
                const monthDisplay = t.forMonth ? new Date(t.forMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : formatDate(t.date);
                const pending = t.totalAmount - t.paidAmount;
                const progress = Math.min((t.paidAmount / t.totalAmount) * 100, 100);

                return (
                    <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <span className="font-semibold text-gray-800">{monthDisplay}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${
                                t.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                t.status === 'Partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                'bg-red-50 text-red-700 border-red-100'
                            }`}>
                                {t.status}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            {/* Breakdown Text */}
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 font-mono leading-relaxed">
                                {t.description}
                            </div>

                            {/* Financials */}
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-xs text-gray-500">Total Bill</p>
                                    <p className="text-lg font-bold text-gray-900">₹{t.totalAmount}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Paid Amount</p>
                                    <p className="text-lg font-bold text-green-600">₹{t.paidAmount}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>

                            {/* Pending Text */}
                            {pending > 0 && (
                                <div className="flex items-center justify-end gap-1 text-red-600 text-sm font-medium">
                                    <AlertTriangle size={14} />
                                    <span>Pending: ₹{pending}</span>
                                </div>
                            )}
                             {pending === 0 && (
                                <div className="flex items-center justify-end gap-1 text-green-600 text-sm font-medium">
                                    <CheckCircle size={14} />
                                    <span>Fully Paid</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Contact Owner */}
      <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-300">
        <p className="text-sm text-gray-500 mb-2">Need help or have an issue?</p>
        <button className="text-indigo-600 font-semibold text-sm hover:underline">Contact Owner</button>
      </div>
    </div>
  );
};

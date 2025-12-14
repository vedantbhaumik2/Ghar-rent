import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, AlertCircle, Plus, Calendar, Smartphone, X, Pencil, Trash2, FileText, CheckCircle, Settings, Lock, UserX, UserCheck, Wallet } from 'lucide-react';
import { Renter, Transaction, TransactionStatus, TransactionType } from '../types';
import { generatePaymentReminder } from '../services/geminiService';

// Helper to format date as DD/MM/YYYY for display
const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
};

// Helper: Convert YYYY-MM-DD to DD/MM/YYYY (for input initial value)
const isoToInput = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Helper: Convert DD/MM/YYYY to YYYY-MM-DD (for saving)
const inputToIso = (inputDate: string) => {
    const parts = inputDate.split('/');
    if (parts.length !== 3) return inputDate; // Return as is if invalid
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export const AdminDashboard: React.FC = () => {
  const { renters, transactions, addRenter, updateRenter, deleteRenter, createInvoice, updateTransaction, deleteTransaction, updateAdminPin, adminPin } = useApp();
  
  // Modals
  const [showRenterModal, setShowRenterModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Selection State
  const [editingRenter, setEditingRenter] = useState<Renter | null>(null);
  const [selectedRenterIdForInvoice, setSelectedRenterIdForInvoice] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Helper State for Invoice Modal
  const [useAdvance, setUseAdvance] = useState(false);
  const selectedRenter = renters.find(r => r.id === selectedRenterIdForInvoice);

  // Stats
  const activeRenters = renters.filter(r => r.status !== 'inactive');
  const totalRenters = activeRenters.length;
  const pendingAmount = activeRenters.reduce((acc, curr) => acc + curr.balance, 0);

  const handleDraftReminder = async (renter: any) => {
    if (renter.balance <= 0) return alert("No pending dues for this renter.");
    const msg = await generatePaymentReminder(renter, renter.balance, "Immediate");
    alert(`Draft Message:\n\n${msg}`);
  };

  const openAddRenter = () => {
      setEditingRenter(null);
      setShowRenterModal(true);
  };

  const openEditRenter = (renter: Renter) => {
      setEditingRenter(renter);
      setShowRenterModal(true);
  };
  
  const openCreateInvoice = (renterId: string) => {
      setSelectedRenterIdForInvoice(renterId);
      setUseAdvance(false); // Reset checkbox
      setShowInvoiceModal(true);
  };

  const openEditTransaction = (tx: Transaction) => {
      setEditingTransaction(tx);
      setShowEditTxModal(true);
  };

  // Toggle Renter Status (Active <-> Inactive)
  const toggleRenterStatus = (e: React.MouseEvent, renter: Renter) => {
      e.stopPropagation();
      // Handle case where status might be undefined for old records
      const currentStatus = renter.status || 'active';
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      
      const confirmMsg = newStatus === 'inactive' 
        ? "Mark this renter as 'Left/Inactive'?\n\n- They will be hidden from 'Active Renters' count.\n- Their history is PRESERVED.\n- You can reactivate them anytime."
        : "Re-activate this renter?";
      
      if(window.confirm(confirmMsg)) {
          updateRenter(renter.id, { status: newStatus });
      }
  };
  
  const handleDeleteTransaction = (id: string, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      
      if (window.confirm("Are you sure you want to delete this invoice?\n\n- Renter's balance will be adjusted.\n- If Advance was used, it will be refunded.")) {
          deleteTransaction(id);
          setShowEditTxModal(false);
      }
  };

  // Sort renters: Active first, then inactive
  const sortedRenters = [...renters].sort((a, b) => {
      const statusA = a.status || 'active';
      const statusB = b.status || 'active';
      if (statusA === statusB) return 0;
      return statusA === 'active' ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions & Stats */}
      <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-gray-800 hidden md:block">Dashboard</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowSettingsModal(true)} className="ml-auto flex items-center gap-2">
              <Settings size={16} />
              Settings
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-indigo-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600"><Users size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Active Renters</p>
              <h3 className="text-2xl font-bold">{totalRenters}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full text-red-600"><AlertCircle size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Outstanding Dues</p>
              <h3 className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-green-500">
             <div className="flex items-center gap-4 h-full">
                <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle size={24} /></div>
                <div>
                  <p className="text-sm text-gray-500">System Status</p>
                  <p className="text-green-600 font-medium">Active & Saving</p>
                </div>
             </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Renter List */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Renters List" action={<Button size="sm" onClick={openAddRenter}><Plus size={16} className="mr-1" /> Add Renter</Button>}>
            <div className="overflow-x-auto">
              {sortedRenters.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">No renters added yet. Click "Add Renter" to start.</div>
              ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Renter Details</th>
                    <th className="px-4 py-3">Balance Due</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedRenters.map(renter => {
                    const isInactive = renter.status === 'inactive';
                    return (
                    <tr key={renter.id} className={`hover:bg-gray-50/50 ${isInactive ? 'opacity-50 bg-gray-50 grayscale' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">{renter.name}</div>
                            {isInactive && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded border border-gray-300">LEFT / INACTIVE</span>}
                        </div>
                        <div className="text-xs text-gray-500">Unit: {renter.unitNumber} | Rent: ₹{renter.monthlyRent}</div>
                        {/* Show Advance Balance if exists */}
                        {renter.advanceBalance > 0 && (
                            <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                                <Wallet size={12} /> Advance: ₹{renter.advanceBalance.toLocaleString()}
                            </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                         {renter.balance > 0 ? (
                             <span className="text-red-600 font-bold">₹{renter.balance.toLocaleString()}</span>
                         ) : (
                             <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> All Paid</span>
                         )}
                      </td>
                      <td className="px-4 py-3 text-right flex justify-end gap-1">
                         <button 
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                            title="Generate Invoice"
                            onClick={() => openCreateInvoice(renter.id)}
                            disabled={isInactive}
                         >
                            <FileText size={16} />
                         </button>
                         <button 
                            onClick={() => handleDraftReminder(renter)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="Draft Reminder"
                            disabled={isInactive}
                         >
                            <Smartphone size={16} />
                         </button>
                         <button
                            onClick={() => openEditRenter(renter)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Renter"
                         >
                             <Pencil size={16} />
                         </button>
                         
                         {/* Toggle Status Button (Mark as Left) */}
                         <button
                            type="button"
                            onClick={(e) => toggleRenterStatus(e, renter)}
                            className={`p-1.5 rounded-lg transition-colors ${
                                isInactive 
                                ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' 
                                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                            }`}
                            title={isInactive ? "Re-activate Renter" : "Mark as Left (Inactive)"}
                         >
                             {isInactive ? <UserCheck size={16} /> : <UserX size={16} />}
                         </button>

                         {/* Hard Delete Button */}
                         <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Permanently delete this renter? ALL history will be lost! Use the 'Mark as Left' button instead if you want to keep history.")) {
                                    deleteRenter(renter.id);
                                }
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Permanently Delete"
                         >
                             <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Invoices & Activity */}
        <div className="space-y-6">
          <Card title="Latest Invoices">
            <div className="space-y-4">
              {transactions.slice(0, 10).map(t => {
                  const r = renters.find(renter => renter.id === t.renterId);
                  const monthName = t.forMonth ? new Date(t.forMonth + "-01").toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : '';
                  const pending = t.totalAmount - t.paidAmount;

                  return (
                    <div key={t.id} onClick={() => openEditTransaction(t)} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 border border-gray-100 transition-colors group relative">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{r?.name || 'Unknown'}</p>
                                <p className="text-xs text-indigo-600 font-medium">{monthName}</p>
                            </div>
                             <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                t.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                t.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {t.status}
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-2 truncate" title={t.description}>
                            {t.description || 'No details provided'}
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                             <div className="text-xs">
                                 <span className="text-gray-500">Paid:</span> <span className="text-green-600 font-semibold">₹{t.paidAmount}</span>
                             </div>
                             <div className="text-sm">
                                 <span className="text-gray-500 text-xs">Total:</span> <span className="font-bold">₹{t.totalAmount}</span>
                             </div>
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                             <div className="p-1 rounded-full bg-white text-gray-500 shadow-sm border border-gray-100">
                                <Pencil size={12} />
                             </div>
                             <button 
                                onClick={(e) => handleDeleteTransaction(t.id, e)}
                                className="p-1 rounded-full bg-white text-red-500 shadow-sm border border-gray-100 hover:bg-red-50"
                                title="Delete Invoice"
                             >
                                <Trash2 size={12} />
                             </button>
                        </div>
                    </div>
                  );
              })}
              {transactions.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No invoices yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Add/Edit Renter Modal */}
      {showRenterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{editingRenter ? 'Edit Renter' : 'Add New Renter'}</h3>
                    <button onClick={() => setShowRenterModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    
                    const renterData = {
                        name: fd.get('name') as string,
                        phone: fd.get('phone') as string,
                        unitNumber: fd.get('unit') as string,
                        monthlyRent: Number(fd.get('rent')),
                        // Convert user entered DD/MM/YYYY to YYYY-MM-DD
                        leaseStartDate: inputToIso(fd.get('leaseStartDate') as string),
                        advanceBalance: Number(fd.get('advanceBalance'))
                    };

                    if (editingRenter) {
                        updateRenter(editingRenter.id, renterData);
                    } else {
                        addRenter(renterData);
                    }
                    setShowRenterModal(false);
                }} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Renter Name</label>
                        <input name="name" defaultValue={editingRenter?.name} placeholder="e.g. Rahul Sharma" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                        <input name="phone" defaultValue={editingRenter?.phone} placeholder="e.g. 9876543210" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit / Room No</label>
                            <input name="unit" defaultValue={editingRenter?.unitNumber} placeholder="e.g. 101" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">Base Rent (₹)</label>
                            <input name="rent" type="number" defaultValue={editingRenter?.monthlyRent} placeholder="e.g. 15000" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">Joining Date (DD/MM/YYYY)</label>
                         <input 
                            name="leaseStartDate" 
                            type="text" 
                            defaultValue={editingRenter ? isoToInput(editingRenter.leaseStartDate) : ''} 
                            placeholder="DD/MM/YYYY"
                            pattern="\d{2}/\d{2}/\d{4}"
                            required 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>

                    {/* Advance / Security Deposit Input */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                         <label className="block text-xs font-medium text-blue-800 mb-1 flex items-center gap-1">
                            <Wallet size={12} /> Advance / Security Deposit (₹)
                         </label>
                         <input 
                            name="advanceBalance" 
                            type="number" 
                            defaultValue={editingRenter?.advanceBalance || 0} 
                            placeholder="e.g. 50000" 
                            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-blue-900" 
                        />
                        <p className="text-[10px] text-blue-600 mt-1">This amount can be used to pay future bills.</p>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setShowRenterModal(false)}>Cancel</Button>
                        <Button type="submit">{editingRenter ? 'Save Changes' : 'Add Renter'}</Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Generate Invoice</h3>
                    <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    
                    createInvoice({
                        renterId: selectedRenterIdForInvoice,
                        type: TransactionType.INVOICE,
                        totalAmount: Number(fd.get('totalAmount')),
                        forMonth: fd.get('forMonth') as string, 
                        date: new Date().toISOString().split('T')[0],
                        // Convert user entered DD/MM/YYYY to YYYY-MM-DD
                        dueDate: inputToIso(fd.get('dueDate') as string),
                        description: fd.get('description') as string
                    }, useAdvance); // Pass the useAdvance state
                    
                    setShowInvoiceModal(false);
                }} className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">For Month</label>
                            <input name="forMonth" type="month" required defaultValue={new Date().toISOString().slice(0, 7)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total Bill Amount (₹)</label>
                            <input name="totalAmount" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bill Details / Breakdown</label>
                        <textarea 
                            name="description" 
                            rows={3}
                            placeholder="e.g. Rent: 10000, Electricity: 550, Water: 100..." 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            required
                        />
                    </div>

                    {/* Advance Usage Checkbox */}
                    {selectedRenter && selectedRenter.advanceBalance > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
                            <input 
                                type="checkbox" 
                                id="useAdvance" 
                                checked={useAdvance} 
                                onChange={(e) => setUseAdvance(e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="useAdvance" className="text-sm cursor-pointer select-none">
                                <span className="font-semibold text-blue-900 block">Deduct from Advance?</span>
                                <span className="text-blue-700 text-xs">
                                    Available Balance: ₹{selectedRenter.advanceBalance.toLocaleString()}
                                </span>
                            </label>
                        </div>
                    )}
                    
                    <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">Due Date (DD/MM/YYYY)</label>
                         <input 
                            name="dueDate" 
                            type="text" 
                            placeholder="DD/MM/YYYY"
                            defaultValue={isoToInput(new Date().toISOString().split('T')[0])}
                            pattern="\d{2}/\d{2}/\d{4}"
                            required 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
                        <Button type="submit">Create Invoice</Button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* EDIT / UPDATE TRANSACTION MODAL */}
      {showEditTxModal && editingTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Edit Invoice / Update Payment</h3>
                    <button onClick={() => setShowEditTxModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    
                    updateTransaction(editingTransaction.id, {
                        totalAmount: Number(fd.get('totalAmount')),
                        paidAmount: Number(fd.get('paidAmount')),
                        description: fd.get('description') as string,
                        forMonth: fd.get('forMonth') as string,
                        dueDate: inputToIso(fd.get('dueDate') as string),
                    });
                    
                    setShowEditTxModal(false);
                }} className="space-y-4">
                    
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">For Month</label>
                            <input name="forMonth" type="month" required defaultValue={editingTransaction.forMonth} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                         <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">Due Date (DD/MM/YYYY)</label>
                             <input 
                                name="dueDate" 
                                type="text" 
                                placeholder="DD/MM/YYYY"
                                defaultValue={isoToInput(editingTransaction.dueDate)}
                                pattern="\d{2}/\d{2}/\d{4}"
                                required 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bill Details / Breakdown</label>
                        <textarea 
                            name="description" 
                            rows={3}
                            defaultValue={editingTransaction.description}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            required
                        />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total Bill Amount (₹)</label>
                            <input 
                                name="totalAmount" 
                                type="number" 
                                required 
                                defaultValue={editingTransaction.totalAmount}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900" 
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Change this if you made a mistake in the bill amount.</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total Paid So Far (₹)</label>
                            <input 
                                name="paidAmount" 
                                type="number" 
                                defaultValue={editingTransaction.paidAmount} 
                                min="0"
                                required 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-green-700" 
                            />
                             <p className="text-[10px] text-gray-500 mt-1">Update this when renter pays.</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="danger" 
                            size="sm"
                            onClick={(e) => handleDeleteTransaction(editingTransaction.id, e)}
                            className="flex items-center gap-1"
                        >
                            <Trash2 size={16} /> Delete Invoice
                        </Button>
                        
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowEditTxModal(false)}>Cancel</Button>
                            <Button type="submit">Update Record</Button>
                        </div>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={20} /> Settings</h3>
                    <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const newPin = fd.get('newPin') as string;
                    if (newPin.length < 4) {
                        alert("PIN must be at least 4 characters.");
                        return;
                    }
                    updateAdminPin(newPin);
                    alert("PIN Updated Successfully!");
                    setShowSettingsModal(false);
                }} className="space-y-4">
                    
                    <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-2 text-sm text-yellow-800">
                        <Lock size={16} className="mt-0.5" />
                        <div>
                            <p className="font-semibold">Security Update</p>
                            <p className="text-xs mt-1">Update your login PIN. Make sure to remember it, as it is required for future access.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">New PIN</label>
                        <input 
                            name="newPin" 
                            type="text" 
                            placeholder="Enter new code" 
                            required 
                            defaultValue={adminPin}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};

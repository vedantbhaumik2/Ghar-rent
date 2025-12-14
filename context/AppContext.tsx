import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Renter, Transaction, AppState, TransactionStatus } from '../types';
import { INITIAL_RENTERS, INITIAL_TRANSACTIONS } from '../constants';

interface AppContextType extends AppState {
  adminPin: string;
  login: (role: 'admin' | 'renter', id?: string) => void;
  logout: () => void;
  addRenter: (renter: Omit<Renter, 'id' | 'balance' | 'joinedAt'>) => void;
  updateRenter: (id: string, data: Partial<Renter>) => void;
  deleteRenter: (id: string) => void;
  createInvoice: (transaction: Omit<Transaction, 'id' | 'paidAmount' | 'status'>, useAdvance?: boolean) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  updateAdminPin: (newPin: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [renters, setRenters] = useState<Renter[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<AppState['currentUser']>({ role: null });
  const [adminPin, setAdminPin] = useState<string>('1234');

  // Load initial data
  useEffect(() => {
    const storedRenters = localStorage.getItem('gharrent_renters');
    const storedTransactions = localStorage.getItem('gharrent_transactions');
    const storedPin = localStorage.getItem('gharrent_admin_pin');

    if (storedRenters) {
      setRenters(JSON.parse(storedRenters));
    } else {
      setRenters(INITIAL_RENTERS);
    }

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }

    if (storedPin) {
      setAdminPin(storedPin);
    }
  }, []);

  // Persist data
  useEffect(() => {
    localStorage.setItem('gharrent_renters', JSON.stringify(renters));
  }, [renters]);

  useEffect(() => {
    localStorage.setItem('gharrent_transactions', JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    localStorage.setItem('gharrent_admin_pin', adminPin);
  }, [adminPin]);

  const login = (role: 'admin' | 'renter', id?: string) => {
    setCurrentUser({ role, id });
  };

  const logout = () => {
    setCurrentUser({ role: null });
  };

  const updateAdminPin = (newPin: string) => {
      setAdminPin(newPin);
  };

  const addRenter = (data: Omit<Renter, 'id' | 'balance' | 'joinedAt'>) => {
    const newRenter: Renter = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      balance: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
      advanceBalance: data.advanceBalance || 0 // Initialize advance
    };
    setRenters(prev => [...prev, newRenter]);
  };

  const updateRenter = (id: string, data: Partial<Renter>) => {
    setRenters(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const deleteRenter = (id: string) => {
    setRenters(prev => prev.filter(r => r.id !== id));
    setTransactions(prev => prev.filter(t => t.renterId !== id));
  };

  const createInvoice = (data: Omit<Transaction, 'id' | 'paidAmount' | 'status'>, useAdvance: boolean = false) => {
    let paidAmount = 0;
    let advanceUsed = 0;
    
    // Find the renter to check advance balance
    const renter = renters.find(r => r.id === data.renterId);
    
    if (renter) {
        let newBalance = renter.balance;
        let newAdvanceBalance = renter.advanceBalance;

        if (useAdvance && renter.advanceBalance > 0) {
            // Calculate how much to deduct
            const amountToDeduct = Math.min(data.totalAmount, renter.advanceBalance);
            paidAmount = amountToDeduct;
            advanceUsed = amountToDeduct;
            newAdvanceBalance = renter.advanceBalance - amountToDeduct;
            
            // Only add the remaining unpaid amount to the debt
            newBalance += (data.totalAmount - paidAmount);
        } else {
            // Standard behavior: Add full amount to debt
            newBalance += data.totalAmount;
        }

        updateRenter(renter.id, { 
            balance: newBalance,
            advanceBalance: newAdvanceBalance
        });
    }

    const newTransaction: Transaction = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      paidAmount: paidAmount,
      advanceUsed: advanceUsed,
      status: paidAmount >= data.totalAmount ? TransactionStatus.PAID : (paidAmount > 0 ? TransactionStatus.PARTIAL : TransactionStatus.PENDING)
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updatedData: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const newTx = { ...oldTx, ...updatedData };
    
    // Auto-calculate status based on new amounts
    if (newTx.paidAmount >= newTx.totalAmount) {
        newTx.status = TransactionStatus.PAID;
    } else if (newTx.paidAmount > 0) {
        newTx.status = TransactionStatus.PARTIAL;
    } else {
        newTx.status = TransactionStatus.PENDING;
    }

    // Adjust Balance Logic
    // We need to find the difference in 'pending amount' (Total - Paid) and apply it to the renter.
    const oldPending = oldTx.totalAmount - oldTx.paidAmount;
    const newPending = newTx.totalAmount - newTx.paidAmount;
    const balanceDiff = newPending - oldPending; // If positive, debt increases.

    if (balanceDiff !== 0) {
        const renter = renters.find(r => r.id === newTx.renterId);
        if (renter) {
            updateRenter(renter.id, { balance: renter.balance + balanceDiff });
        }
    }

    setTransactions(prev => prev.map(t => t.id === id ? newTx : t));
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const renter = renters.find(r => r.id === tx.renterId);
    if (renter) {
       // 1. Reverse the pending balance impact
       const pendingAmount = tx.totalAmount - tx.paidAmount;
       let newBalance = renter.balance - pendingAmount;
       
       // 2. Refund advance if used
       let newAdvanceBalance = renter.advanceBalance;
       if (tx.advanceUsed && tx.advanceUsed > 0) {
           newAdvanceBalance += tx.advanceUsed;
       }

       updateRenter(renter.id, { 
           balance: newBalance,
           advanceBalance: newAdvanceBalance
        });
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider value={{ 
      renters, 
      transactions, 
      currentUser, 
      adminPin,
      login, 
      logout, 
      addRenter, 
      updateRenter, 
      deleteRenter,
      createInvoice, 
      updateTransaction,
      deleteTransaction,
      updateAdminPin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

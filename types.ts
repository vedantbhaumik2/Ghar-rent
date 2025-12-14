export enum TransactionType {
  INVOICE = 'Invoice'
}

export enum TransactionStatus {
  PAID = 'Paid',
  PARTIAL = 'Partial',
  PENDING = 'Pending'
}

export interface Renter {
  id: string;
  name: string;
  phone: string;
  email?: string;
  unitNumber: string;
  leaseStartDate: string;
  monthlyRent: number;
  balance: number; // Total Pending Amount
  advanceBalance: number; // New: Advance / Security Deposit stored
  joinedAt: string;
  status?: 'active' | 'inactive'; // New field for tracking status
}

export interface Transaction {
  id: string;
  renterId: string;
  type: TransactionType; // Always 'Invoice' now
  totalAmount: number; // The total bill amount
  paidAmount: number; // How much has been paid so far
  advanceUsed?: number; // Amount deducted from advance for this invoice
  date: string; // Date of bill creation (YYYY-MM-DD)
  forMonth: string; // YYYY-MM
  dueDate: string; // YYYY-MM-DD
  status: TransactionStatus;
  description: string; // e.g. "Rent: 5000, Elec: 300"
}

export interface AppState {
  renters: Renter[];
  transactions: Transaction[];
  currentUser: {
    role: 'admin' | 'renter' | null;
    id?: string; // If renter
  };
}

export interface DashboardStats {
  totalRenters: number;
  monthlyIncome: number;
  pendingAmount: number;
  occupancyRate: number;
}

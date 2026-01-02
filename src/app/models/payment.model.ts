export interface Payment {
  id: number;
  customerName: string;
  totalSales: number;
  paidAmount: number;
  pendingAmount: number;
  creditStatus: 'Cleared' | 'Pending' | 'Partial';
}


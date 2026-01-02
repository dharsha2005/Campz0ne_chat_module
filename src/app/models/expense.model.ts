export enum ExpenseType {
  PaddyPurchase = 'Paddy Purchase',
  LabourSalary = 'Labour Salary',
  Electricity = 'Electricity',
  Transport = 'Transport',
  Maintenance = 'Maintenance',
  Other = 'Other'
}

export interface Expense {
  id: number;
  date: Date;
  expenseType: ExpenseType;
  amount: number;
  notes: string;
}


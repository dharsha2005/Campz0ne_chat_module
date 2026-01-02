export enum PaymentType {
  Cash = 'Cash',
  UPI = 'UPI',
  Credit = 'Credit'
}

export interface Sale {
  id: number;
  date: Date;
  riceVarietyId: number;
  riceVarietyName: string;
  quantitySold: number; // in kg
  pricePerKg: number;
  totalAmount: number;
  paymentType: PaymentType;
}


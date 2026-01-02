export enum RiceCategory {
  Raw = 'Raw',
  Boiled = 'Boiled',
  Steam = 'Steam'
}

export interface RiceVariety {
  id: number;
  name: string;
  category: RiceCategory;
  stockQuantity: number; // in kg
  costPricePerKg: number;
  sellingPricePerKg: number;
}


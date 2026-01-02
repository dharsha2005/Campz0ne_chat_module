import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { RiceVariety, RiceCategory } from '../models/rice-variety.model';
import { Sale, PaymentType } from '../models/sales.model';
import { Expense, ExpenseType } from '../models/expense.model';
import { Payment } from '../models/payment.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  // ============ Rice Variety Methods ============
  
  getRiceVarieties(): Observable<RiceVariety[]> {
    return this.http.get<ApiResponse<RiceVariety[]>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.rice}`,
      { headers: this.headers }
    ).pipe(
      map(response => {
        // Map backend response (snake_case) to frontend model (camelCase)
        const data = Array.isArray(response.data) ? response.data : [];
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category as RiceCategory,
          stockQuantity: parseFloat((item.stock_kg || item.stockQuantity || 0).toString()),
          costPricePerKg: parseFloat((item.cost_price_per_kg || item.costPricePerKg || 0).toString()),
          sellingPricePerKg: parseFloat((item.selling_price_per_kg || item.sellingPricePerKg || 0).toString())
        }));
      }),
      catchError(this.handleError)
    );
  }

  getRiceVarietyById(id: number): Observable<RiceVariety> {
    return this.http.get<ApiResponse<RiceVariety>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.rice}/${id}`,
      { headers: this.headers }
    ).pipe(
      map(response => this.mapRiceVariety(response.data)),
      catchError(this.handleError)
    );
  }

  addRiceVariety(variety: RiceVariety): Observable<RiceVariety> {
    const payload = {
      name: variety.name,
      category: variety.category,
      stock_kg: variety.stockQuantity,
      cost_price_per_kg: variety.costPricePerKg,
      selling_price_per_kg: variety.sellingPricePerKg
    };

    return this.http.post<ApiResponse<RiceVariety>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.rice}`,
      payload,
      { headers: this.headers }
    ).pipe(
      map(response => this.mapRiceVariety(response.data)),
      catchError(this.handleError)
    );
  }

  updateRiceVariety(variety: RiceVariety): Observable<RiceVariety> {
    const payload = {
      name: variety.name,
      category: variety.category,
      stock_kg: variety.stockQuantity,
      cost_price_per_kg: variety.costPricePerKg,
      selling_price_per_kg: variety.sellingPricePerKg
    };

    return this.http.put<ApiResponse<RiceVariety>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.rice}/${variety.id}`,
      payload,
      { headers: this.headers }
    ).pipe(
      map(response => this.mapRiceVariety(response.data)),
      catchError(this.handleError)
    );
  }

  deleteRiceVariety(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.rice}/${id}`,
      { headers: this.headers }
    ).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  // ============ Sales Methods ============

  getSales(filters?: { startDate?: string; endDate?: string; riceVarietyId?: number }): Observable<Sale[]> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end_date', filters.endDate);
    }
    if (filters?.riceVarietyId) {
      params = params.set('rice_variety_id', filters.riceVarietyId.toString());
    }

    return this.http.get<ApiResponse<Sale[]>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.sales}`,
      { headers: this.headers, params }
    ).pipe(
      map(response => {
        const raw = response.data as any[];
        return raw.map((item: any) => ({
          id: item.id,
          date: new Date(item.sale_date || item.date),
          riceVarietyId: item.rice_variety_id || item.riceVarietyId,
          riceVarietyName: item.rice_variety_name || item.riceVarietyName || '',
          quantitySold: parseFloat((item.quantity_kg || item.quantitySold)?.toString() || '0'),
          pricePerKg: parseFloat((item.price_per_kg || item.pricePerKg)?.toString() || '0'),
          totalAmount: parseFloat((item.total_amount || item.totalAmount)?.toString() || '0'),
          paymentType: (item.payment_type || item.paymentType || 'Cash') as PaymentType
        }));
      }),
      catchError(this.handleError)
    );
  }

  addSale(sale: Sale): Observable<Sale> {
    const payload = {
      rice_variety_id: sale.riceVarietyId,
      customer_id: null,
      quantity_kg: sale.quantitySold,
      price_per_kg: sale.pricePerKg,
      total_amount: sale.totalAmount,
      payment_type: sale.paymentType,
      sale_date: sale.date instanceof Date ? sale.date.toISOString().split('T')[0] : sale.date
    };

    return this.http.post<ApiResponse<Sale>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.sales}`,
      payload,
      { headers: this.headers }
    ).pipe(
      map(response => this.mapSale(response.data)),
      catchError(this.handleError)
    );
  }

  getSalesSummary(filters?: { startDate?: string; endDate?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end_date', filters.endDate);
    }

    return this.http.get<ApiResponse<any>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.sales}/summary`,
      { headers: this.headers, params }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ============ Expense Methods ============

  getExpenses(filters?: { startDate?: string; endDate?: string; expenseType?: string }): Observable<Expense[]> {
    let params = new HttpParams();
    if (filters?.startDate) {
      params = params.set('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end_date', filters.endDate);
    }
    if (filters?.expenseType) {
      params = params.set('expense_type', filters.expenseType);
    }

    return this.http.get<ApiResponse<Expense[]>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expenses}`,
      { headers: this.headers, params }
    ).pipe(
      map(response => {
        const raw = response.data as any[];
        return raw.map((item: any) => ({
          id: item.id,
          date: new Date(item.expense_date || item.date),
          expenseType: (item.expense_type || item.expenseType) as ExpenseType,
          amount: parseFloat(item.amount?.toString() || '0'),
          notes: item.notes || ''
        }));
      }),
      catchError(this.handleError)
    );
  }

  addExpense(expense: Expense): Observable<Expense> {
    const payload = {
      expense_type: expense.expenseType,
      amount: expense.amount,
      expense_date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
      notes: expense.notes
    };

    return this.http.post<ApiResponse<Expense>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expenses}`,
      payload,
      { headers: this.headers }
    ).pipe(
      map(response => this.mapExpense(response.data)),
      catchError(this.handleError)
    );
  }

  updateExpense(expense: Expense): Observable<Expense> {
    const payload = {
      expense_type: expense.expenseType,
      amount: expense.amount,
      expense_date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
      notes: expense.notes
    };

    return this.http.put<ApiResponse<Expense>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expenses}/${expense.id}`,
      payload,
      { headers: this.headers }
    ).pipe(
      map(response => this.mapExpense(response.data)),
      catchError(this.handleError)
    );
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expenses}/${id}`,
      { headers: this.headers }
    ).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  getMonthlyExpenses(month: number, year: number): Observable<number> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get<ApiResponse<any>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expenses}/monthly`,
      { headers: this.headers, params }
    ).pipe(
      map(response => parseFloat(response.data.total_expenses?.toString() || '0')),
      catchError(this.handleError)
    );
  }

  // ============ Dashboard Methods ============

  getDashboardData(): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.dashboard}`,
      { headers: this.headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ============ Helper Methods ============

  getTodaySales(): Observable<number> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSales({ startDate: today, endDate: today }).pipe(
      map(sales => sales.reduce((sum, sale) => sum + sale.totalAmount, 0))
    );
  }

  getMonthlySales(month: number, year: number): Observable<number> {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    
    return this.getSales({ startDate, endDate }).pipe(
      map(sales => sales.reduce((sum, sale) => sum + sale.totalAmount, 0))
    );
  }

  getTotalStock(): Observable<number> {
    return this.getRiceVarieties().pipe(
      map(varieties => varieties.reduce((sum, v) => sum + v.stockQuantity, 0))
    );
  }

  // ============ Payment Methods (keeping for compatibility) ============

  getPayments(): Observable<Payment[]> {
    // This endpoint needs to be added to backend
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  addPayment(payment: Payment): Observable<Payment> {
    return new Observable(observer => {
      observer.next(payment);
      observer.complete();
    });
  }

  updatePayment(payment: Payment): Observable<Payment> {
    return new Observable(observer => {
      observer.next(payment);
      observer.complete();
    });
  }

  // ============ Private Helper Methods ============

  private mapRiceVariety(item: any): RiceVariety {
    return {
      id: item.id,
      name: item.name,
      category: item.category as RiceCategory,
      stockQuantity: parseFloat((item.stock_kg || item.stockQuantity)?.toString() || '0'),
      costPricePerKg: parseFloat((item.cost_price_per_kg || item.costPricePerKg)?.toString() || '0'),
      sellingPricePerKg: parseFloat((item.selling_price_per_kg || item.sellingPricePerKg)?.toString() || '0')
    };
  }

  private mapSale(item: any): Sale {
    return {
      id: item.id,
      date: new Date(item.sale_date || item.date),
      riceVarietyId: item.rice_variety_id || item.riceVarietyId,
      riceVarietyName: item.rice_variety_name || item.riceVarietyName || '',
      quantitySold: parseFloat((item.quantity_kg || item.quantitySold)?.toString() || '0'),
      pricePerKg: parseFloat((item.price_per_kg || item.pricePerKg)?.toString() || '0'),
      totalAmount: parseFloat((item.total_amount || item.totalAmount)?.toString() || '0'),
      paymentType: (item.payment_type || item.paymentType || 'Cash') as PaymentType
    };
  }

  private mapExpense(item: any): Expense {
    return {
      id: item.id,
      date: new Date(item.expense_date || item.date),
      expenseType: (item.expense_type || item.expenseType) as ExpenseType,
      amount: parseFloat(item.amount?.toString() || '0'),
      notes: item.notes || ''
    };
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || error.message || errorMessage;
    }
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

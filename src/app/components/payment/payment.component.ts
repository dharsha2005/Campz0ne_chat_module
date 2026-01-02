import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  payments: Payment[] = [];
  paymentForm: FormGroup;
  showForm: boolean = false;
  isEditMode: boolean = false;

  constructor(
    private dataService: DataService,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      id: [null],
      customerName: ['', Validators.required],
      totalSales: [0, [Validators.required, Validators.min(0)]],
      paidAmount: [0, [Validators.required, Validators.min(0)]],
      pendingAmount: [0, Validators.required],
      creditStatus: ['Pending', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPayments();
    this.setupFormListeners();
  }

  setupFormListeners(): void {
    // Auto-calculate pending amount and credit status
    this.paymentForm.get('totalSales')?.valueChanges.subscribe(() => {
      this.calculatePending();
    });

    this.paymentForm.get('paidAmount')?.valueChanges.subscribe(() => {
      this.calculatePending();
    });
  }

  calculatePending(): void {
    const totalSales = this.paymentForm.get('totalSales')?.value || 0;
    const paidAmount = this.paymentForm.get('paidAmount')?.value || 0;
    const pendingAmount = totalSales - paidAmount;

    let creditStatus = 'Pending';
    if (pendingAmount <= 0) {
      creditStatus = 'Cleared';
    } else if (paidAmount > 0) {
      creditStatus = 'Partial';
    }

    this.paymentForm.patchValue({
      pendingAmount: Math.max(0, pendingAmount),
      creditStatus: creditStatus
    }, { emitEvent: false });
  }

  loadPayments(): void {
    this.dataService.getPayments().subscribe(payments => {
      this.payments = payments;
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.isEditMode = false;
    this.paymentForm.reset({
      totalSales: 0,
      paidAmount: 0,
      pendingAmount: 0,
      creditStatus: 'Pending'
    });
  }

  editPayment(payment: Payment): void {
    this.isEditMode = true;
    this.showForm = true;
    this.paymentForm.patchValue(payment);
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      const payment = this.paymentForm.value as Payment;

      if (this.isEditMode) {
        this.dataService.updatePayment(payment);
      } else {
        this.dataService.addPayment(payment);
      }

      this.toggleForm();
      this.loadPayments();
    }
  }

  getCreditStatusClass(status: string): string {
    switch (status) {
      case 'Cleared':
        return 'bg-success';
      case 'Partial':
        return 'bg-warning';
      case 'Pending':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getTotalPending(): number {
    return this.payments.reduce((sum, p) => sum + p.pendingAmount, 0);
  }

  getTotalCredit(): number {
    return this.payments
      .filter(p => p.creditStatus !== 'Cleared')
      .reduce((sum, p) => sum + p.pendingAmount, 0);
  }
}


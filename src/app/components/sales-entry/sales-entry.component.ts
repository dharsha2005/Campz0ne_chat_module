import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { RiceVariety } from '../../models/rice-variety.model';
import { Sale, PaymentType } from '../../models/sales.model';

@Component({
  selector: 'app-sales-entry',
  templateUrl: './sales-entry.component.html',
  styleUrls: ['./sales-entry.component.css']
})
export class SalesEntryComponent implements OnInit {
  salesForm: FormGroup;
  riceVarieties: RiceVariety[] = [];
  paymentTypes = Object.values(PaymentType);

  constructor(
    private dataService: DataService,
    private fb: FormBuilder
  ) {
    this.salesForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      riceVarietyId: ['', Validators.required],
      quantitySold: [0, [Validators.required, Validators.min(0.01)]],
      pricePerKg: [0, Validators.required],
      totalAmount: [0, Validators.required],
      paymentType: [PaymentType.Cash, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRiceVarieties();
    this.setupFormListeners();
  }

  loadRiceVarieties(): void {
    this.dataService.getRiceVarieties().subscribe(varieties => {
      this.riceVarieties = varieties;
    });
  }

  setupFormListeners(): void {
    // Auto-fill price when variety is selected
    this.salesForm.get('riceVarietyId')?.valueChanges.subscribe(varietyId => {
      const variety = this.riceVarieties.find(v => v.id === varietyId);
      if (variety) {
        this.salesForm.patchValue({
          pricePerKg: variety.sellingPricePerKg
        }, { emitEvent: false });
        this.calculateTotal();
      }
    });

    // Calculate total when quantity or price changes
    this.salesForm.get('quantitySold')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });

    this.salesForm.get('pricePerKg')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  calculateTotal(): void {
    const quantity = this.salesForm.get('quantitySold')?.value || 0;
    const price = this.salesForm.get('pricePerKg')?.value || 0;
    const total = quantity * price;
    this.salesForm.patchValue({ totalAmount: total }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.salesForm.valid) {
      const formValue = this.salesForm.value;
      const variety = this.riceVarieties.find(v => v.id === formValue.riceVarietyId);

      if (!variety) {
        alert('Please select a valid rice variety');
        return;
      }

      if (formValue.quantitySold > variety.stockQuantity) {
        alert(`Insufficient stock! Available: ${variety.stockQuantity} kg`);
        return;
      }

      const sale: Sale = {
        id: 0,
        date: new Date(formValue.date),
        riceVarietyId: formValue.riceVarietyId,
        riceVarietyName: variety.name,
        quantitySold: formValue.quantitySold,
        pricePerKg: formValue.pricePerKg,
        totalAmount: formValue.totalAmount,
        paymentType: formValue.paymentType
      };

      this.dataService.addSale(sale).subscribe({
        next: () => {
          alert('Sale recorded successfully!');
          this.salesForm.reset({
            date: new Date().toISOString().split('T')[0],
            paymentType: PaymentType.Cash,
            quantitySold: 0,
            pricePerKg: 0,
            totalAmount: 0
          });
          // Reload rice varieties to get updated stock from backend
          this.loadRiceVarieties();
        },
        error: (error) => {
          alert('Error recording sale: ' + error.message);
        }
      });
    }
  }

  getSelectedVarietyStock(): number {
    const varietyId = this.salesForm.get('riceVarietyId')?.value;
    const variety = this.riceVarieties.find(v => v.id === varietyId);
    return variety ? variety.stockQuantity : 0;
  }
}


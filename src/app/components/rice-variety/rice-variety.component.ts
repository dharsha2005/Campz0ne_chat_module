import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { RiceVariety, RiceCategory } from '../../models/rice-variety.model';

@Component({
  selector: 'app-rice-variety',
  templateUrl: './rice-variety.component.html',
  styleUrls: ['./rice-variety.component.css']
})
export class RiceVarietyComponent implements OnInit {
  riceVarieties: RiceVariety[] = [];
  filteredVarieties: RiceVariety[] = [];
  categories = Object.values(RiceCategory);
  showForm: boolean = false;
  isEditMode: boolean = false;
  riceVarietyForm: FormGroup;
  lowStockThreshold: number = 500; // kg

  constructor(
    private dataService: DataService,
    private fb: FormBuilder
  ) {
    this.riceVarietyForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      category: ['', Validators.required],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      costPricePerKg: [0, [Validators.required, Validators.min(0)]],
      sellingPricePerKg: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadRiceVarieties();
  }

  loadRiceVarieties(): void {
    this.dataService.getRiceVarieties().subscribe(varieties => {
      this.riceVarieties = varieties;
      this.filteredVarieties = [...varieties];
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.isEditMode = false;
    this.riceVarietyForm.reset();
  }

  editVariety(variety: RiceVariety): void {
    this.isEditMode = true;
    this.showForm = true;
    this.riceVarietyForm.patchValue(variety);
  }

  deleteVariety(id: number): void {
    if (confirm('Are you sure you want to delete this rice variety?')) {
      this.dataService.deleteRiceVariety(id).subscribe({
        next: () => {
          this.loadRiceVarieties(); // Reload fresh data from API
        },
        error: (error) => {
          alert('Error deleting rice variety: ' + error.message);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.riceVarietyForm.valid) {
      const variety = this.riceVarietyForm.value as RiceVariety;
      
      const operation = this.isEditMode 
        ? this.dataService.updateRiceVariety(variety)
        : this.dataService.addRiceVariety(variety);
      
      operation.subscribe({
        next: () => {
          this.toggleForm();
          this.loadRiceVarieties(); // Reload fresh data from API
        },
        error: (error) => {
          alert('Error saving rice variety: ' + error.message);
        }
      });
    }
  }

  isLowStock(stock: number): boolean {
    return stock < this.lowStockThreshold;
  }

  hasLowStock(): boolean {
    return this.riceVarieties.some(v => this.isLowStock(v.stockQuantity));
  }

  searchVarieties(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredVarieties = this.riceVarieties.filter(v =>
      v.name.toLowerCase().includes(searchTerm) ||
      v.category.toLowerCase().includes(searchTerm)
    );
  }
}


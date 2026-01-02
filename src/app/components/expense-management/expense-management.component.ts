import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Expense, ExpenseType } from '../../models/expense.model';

@Component({
  selector: 'app-expense-management',
  templateUrl: './expense-management.component.html',
  styleUrls: ['./expense-management.component.css']
})
export class ExpenseManagementComponent implements OnInit {
  expenses: Expense[] = [];
  expenseForm: FormGroup;
  showForm: boolean = false;
  isEditMode: boolean = false;
  expenseTypes = Object.values(ExpenseType);
  monthlyExpenseTotal: number = 0;

  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.expenseForm = this.fb.group({
      id: [null],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      expenseType: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.dataService.getExpenses().subscribe(expenses => {
      this.expenses = expenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.calculateMonthlyTotal();
    });
  }

  calculateMonthlyTotal(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Fetch fresh monthly total from API
    this.dataService.getMonthlyExpenses(currentMonth, currentYear).subscribe({
      next: (total) => {
        this.monthlyExpenseTotal = total;
      },
      error: (error) => {
        console.error('Error fetching monthly expenses:', error);
        // Fallback to local calculation
        this.monthlyExpenseTotal = this.expenses
          .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.isEditMode = false;
    this.expenseForm.reset({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: ''
    });
  }

  editExpense(expense: Expense): void {
    this.isEditMode = true;
    this.showForm = true;
    this.expenseForm.patchValue({
      ...expense,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
  }

  deleteExpense(id: number): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.dataService.deleteExpense(id).subscribe({
        next: () => {
          this.loadExpenses(); // Reload fresh data from API
        },
        error: (error) => {
          alert('Error deleting expense: ' + error.message);
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.authService.isAuthenticated()) {
      alert('Please login to add or edit expenses.');
      this.router.navigate(['/login']);
      return;
    }

    if (this.expenseForm.valid) {
      const expense: Expense = {
        ...this.expenseForm.value,
        date: new Date(this.expenseForm.value.date)
      };

      const operation = this.isEditMode
        ? this.dataService.updateExpense(expense)
        : this.dataService.addExpense(expense);

      operation.subscribe({
        next: () => {
          this.toggleForm();
          this.loadExpenses(); // Reload fresh data from API
        },
        error: (error) => {
          alert('Error saving expense: ' + error.message);
        }
      });
    }
  }
}


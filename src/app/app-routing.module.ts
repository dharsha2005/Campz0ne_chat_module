import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RiceVarietyComponent } from './components/rice-variety/rice-variety.component';
import { SalesEntryComponent } from './components/sales-entry/sales-entry.component';
import { SalesReportComponent } from './components/sales-report/sales-report.component';
import { ExpenseManagementComponent } from './components/expense-management/expense-management.component';
import { MonthlyProfitComponent } from './components/monthly-profit/monthly-profit.component';
import { PaymentComponent } from './components/payment/payment.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'rice-variety', component: RiceVarietyComponent },
  { path: 'sales-entry', component: SalesEntryComponent },
  { path: 'sales-report', component: SalesReportComponent },
  { path: 'expenses', component: ExpenseManagementComponent },
  { path: 'monthly-profit', component: MonthlyProfitComponent },
  { path: 'payment', component: PaymentComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { NgChartsModule } from 'ng2-charts';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RiceVarietyComponent } from './components/rice-variety/rice-variety.component';
import { SalesEntryComponent } from './components/sales-entry/sales-entry.component';
import { SalesReportComponent } from './components/sales-report/sales-report.component';
import { ExpenseManagementComponent } from './components/expense-management/expense-management.component';
import { MonthlyProfitComponent } from './components/monthly-profit/monthly-profit.component';
import { PaymentComponent } from './components/payment/payment.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CacheInterceptor } from './interceptors/cache.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    RiceVarietyComponent,
    SalesEntryComponent,
    SalesReportComponent,
    ExpenseManagementComponent,
    MonthlyProfitComponent,
    PaymentComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }


import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  totalStock: number = 0;
  todaySales: number = 0;
  monthlySales: number = 0;
  monthlyProfit: number = 0;
  monthlyExpenses: number = 0;

  // Daily Sales Chart
  public dailySalesChartType: ChartType = 'line';
  public dailySalesChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Daily Sales (₹)',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };
  public dailySalesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Daily Sales (Last 7 Days)'
      }
    }
  };

  // Monthly Profit Chart
  public monthlyProfitChartType: ChartType = 'bar';
  public monthlyProfitChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Profit (₹)',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }]
  };
  public monthlyProfitChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Monthly Profit (Last 6 Months)'
      }
    }
  };

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Use dashboard API endpoint for all data at once
    this.dataService.getDashboardData().subscribe({
      next: (data) => {
        this.totalStock = parseFloat(data.total_stock?.toString() || '0');
        this.todaySales = parseFloat(data.today_sales?.toString() || '0');
        this.monthlySales = parseFloat(data.monthly_sales?.toString() || '0');
        this.monthlyExpenses = parseFloat(data.monthly_expenses?.toString() || '0');
        this.monthlyProfit = parseFloat(data.monthly_profit?.toString() || '0');
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        // Fallback: load data individually
        this.loadDashboardDataFallback();
      }
    });

    // Load charts
    this.loadDailySalesChart();
    this.loadMonthlyProfitChart();
  }

  loadDashboardDataFallback(): void {
    // Total Stock
    this.dataService.getTotalStock().subscribe(stock => {
      this.totalStock = stock;
    });

    // Today Sales
    this.dataService.getTodaySales().subscribe(sales => {
      this.todaySales = sales;
    });

    // Current Month Data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.dataService.getMonthlySales(currentMonth, currentYear).subscribe(sales => {
      this.monthlySales = sales;
      this.calculateProfit();
    });

    this.dataService.getMonthlyExpenses(currentMonth, currentYear).subscribe(expenses => {
      this.monthlyExpenses = expenses;
      this.calculateProfit();
    });
  }

  calculateProfit(): void {
    this.monthlyProfit = this.monthlySales - this.monthlyExpenses;
  }

  loadDailySalesChart(): void {
    this.dataService.getSales().subscribe(sales => {
      const last7Days: string[] = [];
      const salesData: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        last7Days.push(dateStr);

        const daySales = sales
          .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === date.toDateString();
          })
          .reduce((sum, sale) => sum + sale.totalAmount, 0);

        salesData.push(daySales);
      }

      this.dailySalesChartData = {
        labels: last7Days,
        datasets: [{
          label: 'Daily Sales (₹)',
          data: salesData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      };
    });
  }

  loadMonthlyProfitChart(): void {
    const months: string[] = [];
    const profitData: number[] = [];
    const now = new Date();
    let loadedCount = 0;
    const totalMonths = 6;

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      months.push(monthStr);
      profitData.push(0); // Initialize with 0

      // Fetch data for each month
      const monthIndex = 5 - i;
      let sales = 0;
      let expenses = 0;

      this.dataService.getMonthlySales(date.getMonth(), date.getFullYear()).subscribe(monthlySales => {
        sales = monthlySales;
        this.dataService.getMonthlyExpenses(date.getMonth(), date.getFullYear()).subscribe(monthlyExpenses => {
          expenses = monthlyExpenses;
          profitData[monthIndex] = sales - expenses;
          loadedCount++;

          // Update chart when all data is loaded
          if (loadedCount === totalMonths) {
            this.monthlyProfitChartData = {
              labels: months,
              datasets: [{
                label: 'Profit (₹)',
                data: profitData,
                backgroundColor: profitData.map(p => p >= 0 ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)')
              }]
            };
          }
        });
      });
    }
  }
}


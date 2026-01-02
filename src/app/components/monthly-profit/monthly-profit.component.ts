import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-monthly-profit',
  templateUrl: './monthly-profit.component.html',
  styleUrls: ['./monthly-profit.component.css']
})
export class MonthlyProfitComponent implements OnInit {
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  monthlySales: number = 0;
  monthlyExpenses: number = 0;
  monthlyProfit: number = 0;
  isProfit: boolean = true;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  years: number[] = [];

  // Profit Chart
  public profitChartType: ChartType = 'bar';
  public profitChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Sales (₹)',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }, {
      label: 'Expenses (₹)',
      data: [],
      backgroundColor: 'rgba(255, 99, 132, 0.6)'
    }, {
      label: 'Profit (₹)',
      data: [],
      backgroundColor: 'rgba(75, 192, 192, 0.6)'
    }]
  };
  public profitChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Monthly Financial Overview'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(private dataService: DataService) {
    // Generate years (current year and previous 5 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 6; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadMonthlyData();
    this.loadChartData();
  }

  onMonthChange(): void {
    this.loadMonthlyData();
    this.loadChartData();
  }

  loadMonthlyData(): void {
    this.dataService.getMonthlySales(this.selectedMonth, this.selectedYear).subscribe(sales => {
      this.monthlySales = sales;
      this.calculateProfit();
    });

    this.dataService.getMonthlyExpenses(this.selectedMonth, this.selectedYear).subscribe(expenses => {
      this.monthlyExpenses = expenses;
      this.calculateProfit();
    });
  }

  calculateProfit(): void {
    this.monthlyProfit = this.monthlySales - this.monthlyExpenses;
    this.isProfit = this.monthlyProfit >= 0;
  }

  loadChartData(): void {
    const labels: string[] = [];
    const salesData: number[] = [];
    const expensesData: number[] = [];
    const profitData: number[] = [];
    let loadedCount = 0;
    const totalMonths = 6;

    // Initialize arrays
    for (let i = 0; i < totalMonths; i++) {
      salesData.push(0);
      expensesData.push(0);
      profitData.push(0);
    }

    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(this.selectedYear, this.selectedMonth - i, 1);
      if (date.getMonth() < 0) {
        date.setFullYear(date.getFullYear() - 1);
        date.setMonth(12 + date.getMonth());
      }
      labels.push(date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }));
      
      const monthIndex = 5 - i;

      // Fetch sales and expenses for each month
      this.dataService.getMonthlySales(date.getMonth(), date.getFullYear()).subscribe(sales => {
        salesData[monthIndex] = sales;
        
        this.dataService.getMonthlyExpenses(date.getMonth(), date.getFullYear()).subscribe(expenses => {
          expensesData[monthIndex] = expenses;
          profitData[monthIndex] = sales - expenses;
          loadedCount++;

          // Update chart when all data is loaded
          if (loadedCount === totalMonths) {
            this.profitChartData = {
              labels: labels,
              datasets: [{
                label: 'Sales (₹)',
                data: salesData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
              }, {
                label: 'Expenses (₹)',
                data: expensesData,
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
              }, {
                label: 'Profit (₹)',
                data: profitData,
                backgroundColor: profitData.map(p => p >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)')
              }]
            };
          }
        });
      });
    }
  }
}


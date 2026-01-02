import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Sale } from '../../models/sales.model';
import { RiceVariety } from '../../models/rice-variety.model';

interface VarietySales {
  varietyName: string;
  soldQuantity: number;
  salesAmount: number;
  costAmount: number;
  profit: number;
}

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.css']
})
export class SalesReportComponent implements OnInit {
  sales: Sale[] = [];
  riceVarieties: RiceVariety[] = [];
  varietySales: VarietySales[] = [];
  totalSales: number = 0;
  totalProfit: number = 0;
  totalQuantity: number = 0;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dataService.getSales().subscribe(sales => {
      this.sales = sales;
      this.calculateVarietyWiseSales();
    });

    this.dataService.getRiceVarieties().subscribe(varieties => {
      this.riceVarieties = varieties;
    });
  }

  calculateVarietyWiseSales(): void {
    const varietyMap = new Map<string, VarietySales>();

    this.sales.forEach(sale => {
      const variety = this.riceVarieties.find(v => v.id === sale.riceVarietyId);
      const costPricePerKg = variety ? variety.costPricePerKg : 0;

      if (!varietyMap.has(sale.riceVarietyName)) {
        varietyMap.set(sale.riceVarietyName, {
          varietyName: sale.riceVarietyName,
          soldQuantity: 0,
          salesAmount: 0,
          costAmount: 0,
          profit: 0
        });
      }

      const varietySales = varietyMap.get(sale.riceVarietyName)!;
      varietySales.soldQuantity += sale.quantitySold;
      varietySales.salesAmount += sale.totalAmount;
      varietySales.costAmount += sale.quantitySold * costPricePerKg;
      varietySales.profit = varietySales.salesAmount - varietySales.costAmount;
    });

    this.varietySales = Array.from(varietyMap.values());
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalSales = this.varietySales.reduce((sum, v) => sum + v.salesAmount, 0);
    this.totalProfit = this.varietySales.reduce((sum, v) => sum + v.profit, 0);
    this.totalQuantity = this.varietySales.reduce((sum, v) => sum + v.soldQuantity, 0);
  }
}


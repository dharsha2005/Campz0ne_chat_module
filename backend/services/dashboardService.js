const RiceVariety = require('../models/RiceVariety');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

class DashboardService {
  // Get dashboard data
  static async getDashboardData() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString().split('T')[0];
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Total stock
    const totalStock = await RiceVariety.getTotalStock();

    // Today's sales
    const todaySalesData = await Sale.getSummary({
      startDate: today,
      endDate: today
    });
    const todaySales = parseFloat(todaySalesData.total_sales_amount || 0);

    // Monthly sales
    const monthlySalesData = await Sale.getSummary({
      startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`
    });
    const monthlySales = parseFloat(monthlySalesData.total_sales_amount || 0);

    // Monthly expenses
    const monthlyExpenses = await Expense.getMonthlyExpenses(currentMonth, currentYear);

    // Monthly profit
    const monthlyProfit = monthlySales - monthlyExpenses;

    return {
      total_stock: totalStock,
      today_sales: todaySales,
      monthly_sales: monthlySales,
      monthly_expenses: monthlyExpenses,
      monthly_profit: monthlyProfit
    };
  }
}

module.exports = DashboardService;


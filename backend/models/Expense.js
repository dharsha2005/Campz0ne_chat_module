const pool = require('../config/database');

class Expense {
  // Get all expenses
  static async getAll(filters = {}) {
    let query = `
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ' AND e.expense_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND e.expense_date <= ?';
      params.push(filters.endDate);
    }
    if (filters.expenseType) {
      query += ' AND e.expense_type = ?';
      params.push(filters.expenseType);
    }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get expense by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Create expense
  static async create(expenseData) {
    const { expense_type, amount, expense_date, notes, created_by } = expenseData;
    const [result] = await pool.execute(
      'INSERT INTO expenses (expense_type, amount, expense_date, notes, created_by) VALUES (?, ?, ?, ?, ?)',
      [expense_type, amount, expense_date, notes || null, created_by]
    );
    return result.insertId;
  }

  // Update expense
  static async update(id, expenseData) {
    const { expense_type, amount, expense_date, notes } = expenseData;
    await pool.execute(
      'UPDATE expenses SET expense_type = ?, amount = ?, expense_date = ?, notes = ? WHERE id = ?',
      [expense_type, amount, expense_date, notes || null, id]
    );
    return id;
  }

  // Delete expense
  static async delete(id) {
    await pool.execute('DELETE FROM expenses WHERE id = ?', [id]);
    return id;
  }

  // Get monthly expenses
  static async getMonthlyExpenses(month, year) {
    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses
       WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?`,
      [month, year]
    );
    return rows[0].total_expenses;
  }

  // Get expenses by type
  static async getByType(filters = {}) {
    let query = `
      SELECT 
        expense_type,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ' AND expense_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND expense_date <= ?';
      params.push(filters.endDate);
    }

    query += ' GROUP BY expense_type ORDER BY total_amount DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Expense;


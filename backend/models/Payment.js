const pool = require('../config/database');

class Payment {
  // Get all payments
  static async getAll(filters = {}) {
    let query = `
      SELECT p.*, c.name as customer_name, u.name as created_by_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.customerId) {
      query += ' AND p.customer_id = ?';
      params.push(filters.customerId);
    }
    if (filters.startDate) {
      query += ' AND p.payment_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND p.payment_date <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY p.payment_date DESC, p.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get payment by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Create payment (used within transaction to update customer credit)
  static async create(paymentData, connection) {
    const { customer_id, amount, payment_date, payment_mode, notes, created_by } = paymentData;
    const [result] = await connection.execute(
      `INSERT INTO payments (customer_id, amount, payment_date, payment_mode, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id, amount, payment_date, payment_mode || 'Cash', notes || null, created_by]
    );
    return result.insertId;
  }

  // Get customer payment summary
  static async getCustomerSummary(customerId) {
    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_paid
       FROM payments
       WHERE customer_id = ?`,
      [customerId]
    );
    return rows[0].total_paid;
  }
}

module.exports = Payment;


const pool = require('../config/database');

class Sale {
  // Get all sales
  static async getAll(filters = {}) {
    let query = `
      SELECT s.*, rv.name as rice_variety_name, c.name as customer_name
      FROM sales s
      LEFT JOIN rice_varieties rv ON s.rice_variety_id = rv.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ' AND s.sale_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND s.sale_date <= ?';
      params.push(filters.endDate);
    }
    if (filters.riceVarietyId) {
      query += ' AND s.rice_variety_id = ?';
      params.push(filters.riceVarietyId);
    }

    query += ' ORDER BY s.sale_date DESC, s.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get sale by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, rv.name as rice_variety_name, c.name as customer_name
       FROM sales s
       LEFT JOIN rice_varieties rv ON s.rice_variety_id = rv.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Create sale (used within transaction)
  static async create(saleData, connection) {
    const {
      rice_variety_id,
      customer_id,
      quantity_kg,
      price_per_kg,
      total_amount,
      payment_type,
      sale_date,
      created_by
    } = saleData;

    const [result] = await connection.execute(
      `INSERT INTO sales (rice_variety_id, customer_id, quantity_kg, price_per_kg, total_amount, payment_type, sale_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [rice_variety_id, customer_id || null, quantity_kg, price_per_kg, total_amount, payment_type, sale_date, created_by]
    );
    return result.insertId;
  }

  // Get sales summary
  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(quantity_kg), 0) as total_quantity,
        COALESCE(SUM(total_amount), 0) as total_sales_amount
      FROM sales
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ' AND sale_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND sale_date <= ?';
      params.push(filters.endDate);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0];
  }

  // Get sales with profit calculation
  static async getSalesWithProfit(filters = {}) {
    let query = `
      SELECT 
        rv.id as rice_variety_id,
        rv.name as rice_variety_name,
        COALESCE(SUM(s.quantity_kg), 0) as sold_quantity,
        COALESCE(SUM(s.total_amount), 0) as sales_amount,
        COALESCE(SUM(s.quantity_kg * rv.cost_price_per_kg), 0) as cost_amount,
        COALESCE(SUM(s.total_amount) - SUM(s.quantity_kg * rv.cost_price_per_kg), 0) as profit
      FROM rice_varieties rv
      LEFT JOIN sales s ON rv.id = s.rice_variety_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ' AND (s.sale_date >= ? OR s.sale_date IS NULL)';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND (s.sale_date <= ? OR s.sale_date IS NULL)';
      params.push(filters.endDate);
    }

    query += ' GROUP BY rv.id, rv.name HAVING sold_quantity > 0 ORDER BY sales_amount DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Sale;


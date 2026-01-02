const pool = require('../config/database');

class RiceVariety {
  // Get all rice varieties
  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM rice_varieties ORDER BY name ASC'
    );
    return rows;
  }

  // Get rice variety by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM rice_varieties WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Create rice variety
  static async create(riceData) {
    const { name, category, stock_kg, cost_price_per_kg, selling_price_per_kg } = riceData;
    const [result] = await pool.execute(
      'INSERT INTO rice_varieties (name, category, stock_kg, cost_price_per_kg, selling_price_per_kg) VALUES (?, ?, ?, ?, ?)',
      [name, category, stock_kg || 0, cost_price_per_kg, selling_price_per_kg]
    );
    return result.insertId;
  }

  // Update rice variety
  static async update(id, riceData) {
    const { name, category, stock_kg, cost_price_per_kg, selling_price_per_kg } = riceData;
    await pool.execute(
      `UPDATE rice_varieties 
       SET name = ?, category = ?, stock_kg = ?, cost_price_per_kg = ?, selling_price_per_kg = ?
       WHERE id = ?`,
      [name, category, stock_kg, cost_price_per_kg, selling_price_per_kg, id]
    );
    return id;
  }

  // Update stock (used in transactions)
  static async updateStock(id, quantity) {
    await pool.execute(
      'UPDATE rice_varieties SET stock_kg = stock_kg - ? WHERE id = ?',
      [quantity, id]
    );
  }

  // Delete rice variety
  static async delete(id) {
    await pool.execute('DELETE FROM rice_varieties WHERE id = ?', [id]);
    return id;
  }

  // Get total stock
  static async getTotalStock() {
    const [rows] = await pool.execute(
      'SELECT COALESCE(SUM(stock_kg), 0) as total_stock FROM rice_varieties'
    );
    return rows[0].total_stock;
  }
}

module.exports = RiceVariety;


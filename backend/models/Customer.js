const pool = require('../config/database');

class Customer {
  // Get all customers
  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM customers ORDER BY name ASC'
    );
    return rows;
  }

  // Get customer by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Create customer
  static async create(customerData) {
    const { name, phone, email, address } = customerData;
    const [result] = await pool.execute(
      'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone || null, email || null, address || null]
    );
    return result.insertId;
  }

  // Update customer
  static async update(id, customerData) {
    const { name, phone, email, address } = customerData;
    await pool.execute(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone || null, email || null, address || null, id]
    );
    return id;
  }

  // Update credit balance
  static async updateCreditBalance(id, amount, connection) {
    await connection.execute(
      'UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?',
      [amount, id]
    );
  }

  // Delete customer
  static async delete(id) {
    await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
    return id;
  }
}

module.exports = Customer;


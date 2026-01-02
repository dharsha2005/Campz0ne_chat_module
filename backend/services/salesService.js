const pool = require('../config/database');
const Sale = require('../models/Sale');
const RiceVariety = require('../models/RiceVariety');
const Customer = require('../models/Customer');

class SalesService {
  // Create sale with transaction
  static async createSale(saleData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get rice variety to check stock
      const riceVariety = await RiceVariety.findById(saleData.rice_variety_id);
      if (!riceVariety) {
        throw new Error('Rice variety not found');
      }

      // Check stock availability
      if (riceVariety.stock_kg < saleData.quantity_kg) {
        throw new Error(`Insufficient stock. Available: ${riceVariety.stock_kg} kg`);
      }

      // Calculate total amount if not provided
      const totalAmount = saleData.total_amount || 
        (saleData.quantity_kg * saleData.price_per_kg);

      // Create sale
      const saleId = await Sale.create(
        {
          ...saleData,
          total_amount: totalAmount,
          sale_date: saleData.sale_date || new Date().toISOString().split('T')[0]
        },
        connection
      );

      // Update stock (using connection from transaction)
      await connection.execute(
        'UPDATE rice_varieties SET stock_kg = stock_kg - ? WHERE id = ?',
        [saleData.quantity_kg, saleData.rice_variety_id]
      );

      // Update customer credit if payment type is Credit
      if (saleData.payment_type === 'Credit' && saleData.customer_id) {
        await Customer.updateCreditBalance(
          saleData.customer_id,
          totalAmount,
          connection
        );
      }

      await connection.commit();

      // Get created sale
      const sale = await Sale.findById(saleId);
      return sale;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update stock helper for transaction
  static async updateStockInTransaction(riceVarietyId, quantity, connection) {
    // Check current stock
    const [rows] = await connection.execute(
      'SELECT stock_kg FROM rice_varieties WHERE id = ? FOR UPDATE',
      [riceVarietyId]
    );

    if (rows.length === 0) {
      throw new Error('Rice variety not found');
    }

    const currentStock = parseFloat(rows[0].stock_kg);
    if (currentStock < quantity) {
      throw new Error(`Insufficient stock. Available: ${currentStock} kg`);
    }

    // Update stock
    await connection.execute(
      'UPDATE rice_varieties SET stock_kg = stock_kg - ? WHERE id = ?',
      [quantity, riceVarietyId]
    );
  }
}

// Update RiceVariety model to support transaction
RiceVariety.updateStock = async function(id, quantity, connection = pool) {
  await connection.execute(
    'UPDATE rice_varieties SET stock_kg = stock_kg - ? WHERE id = ?',
    [quantity, id]
  );
};

module.exports = SalesService;


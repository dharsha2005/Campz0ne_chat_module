-- Seed data for Rice Mill Management System
-- Run this after schema.sql

USE rice_mill_db;

-- Note: Admin user password is 'admin123' (hashed with bcrypt)
-- Default password hash: $2a$10$rOzJq8fJ6Y5Q5Z5Q5Z5Q5uVqZ5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5

-- Sample Rice Varieties (if not already inserted)
INSERT IGNORE INTO rice_varieties (name, category, stock_kg, cost_price_per_kg, selling_price_per_kg) VALUES
('Basmati Raw', 'Raw', 5000.00, 60.00, 75.00),
('Sona Masoori Boiled', 'Boiled', 3000.00, 45.00, 58.00),
('Ponni Steam', 'Steam', 200.00, 50.00, 65.00),
('Sona Masoori Raw', 'Raw', 4000.00, 40.00, 52.00),
('Basmati Boiled', 'Boiled', 2500.00, 65.00, 80.00);

-- Sample Customers
INSERT IGNORE INTO customers (name, phone, email, address) VALUES
('Rajesh Traders', '9876543210', 'rajesh@traders.com', 'Market Street, City'),
('Kumar Stores', '9876543211', 'kumar@stores.com', 'Main Road, City'),
('Venkat Enterprises', '9876543212', 'venkat@enterprises.com', 'Commercial Area, City');


# API Examples

This document contains sample API requests and responses for the Rice Mill Management System.

## Base URL
```
http://localhost:3000/api
```

## Authentication

### 1. Login
**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ricemill.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkByaWNlbWlsbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDQwNzIwMDAsImV4cCI6MTcwNDY3NjgwMH0.xyz123...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@ricemill.com",
      "role": "admin"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Rice Varieties

### 2. Get All Rice Varieties
**Request:**
```http
GET /api/rice
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Basmati Raw",
      "category": "Raw",
      "stock_kg": "5000.00",
      "cost_price_per_kg": "60.00",
      "selling_price_per_kg": "75.00",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Create Rice Variety
**Request:**
```http
POST /api/rice
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Premium Basmati",
  "category": "Raw",
  "stock_kg": 3000,
  "cost_price_per_kg": 70,
  "selling_price_per_kg": 85
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Rice variety created successfully",
  "data": {
    "id": 6,
    "name": "Premium Basmati",
    "category": "Raw",
    "stock_kg": "3000.00",
    "cost_price_per_kg": "70.00",
    "selling_price_per_kg": "85.00",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Rice Variety
**Request:**
```http
PUT /api/rice/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Basmati Raw",
  "category": "Raw",
  "stock_kg": 4500,
  "cost_price_per_kg": 60,
  "selling_price_per_kg": 75
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Rice variety updated successfully",
  "data": {
    "id": 1,
    "name": "Basmati Raw",
    "category": "Raw",
    "stock_kg": "4500.00",
    "cost_price_per_kg": "60.00",
    "selling_price_per_kg": "75.00",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

### 5. Delete Rice Variety
**Request:**
```http
DELETE /api/rice/6
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Rice variety deleted successfully"
}
```

---

## Sales

### 6. Create Sale (with Transaction)
**Request:**
```http
POST /api/sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "rice_variety_id": 1,
  "customer_id": 1,
  "quantity_kg": 100,
  "price_per_kg": 75,
  "total_amount": 7500,
  "payment_type": "Cash",
  "sale_date": "2024-01-15"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Sale recorded successfully",
  "data": {
    "id": 1,
    "rice_variety_id": 1,
    "customer_id": 1,
    "quantity_kg": "100.00",
    "price_per_kg": "75.00",
    "total_amount": "7500.00",
    "payment_type": "Cash",
    "sale_date": "2024-01-15",
    "created_by": 1,
    "rice_variety_name": "Basmati Raw",
    "customer_name": "Rajesh Traders"
  }
}
```

**Error Response (400) - Insufficient Stock:**
```json
{
  "success": false,
  "message": "Insufficient stock. Available: 500.00 kg"
}
```

### 7. Get All Sales
**Request:**
```http
GET /api/sales?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rice_variety_id": 1,
      "customer_id": 1,
      "quantity_kg": "100.00",
      "price_per_kg": "75.00",
      "total_amount": "7500.00",
      "payment_type": "Cash",
      "sale_date": "2024-01-15",
      "created_by": 1,
      "rice_variety_name": "Basmati Raw",
      "customer_name": "Rajesh Traders"
    }
  ]
}
```

### 8. Get Sales Summary
**Request:**
```http
GET /api/sales/summary?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_sales": 25,
    "total_quantity": "2500.50",
    "total_sales_amount": "187500.00",
    "total_profit": "62500.00",
    "variety_wise": [
      {
        "rice_variety_id": 1,
        "rice_variety_name": "Basmati Raw",
        "sold_quantity": "1000.00",
        "sales_amount": "75000.00",
        "cost_amount": "60000.00",
        "profit": "15000.00"
      },
      {
        "rice_variety_id": 2,
        "rice_variety_name": "Sona Masoori Boiled",
        "sold_quantity": "800.00",
        "sales_amount": "46400.00",
        "cost_amount": "36000.00",
        "profit": "10400.00"
      }
    ]
  }
}
```

---

## Expenses

### 9. Create Expense
**Request:**
```http
POST /api/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "expense_type": "Paddy Purchase",
  "amount": 50000,
  "expense_date": "2024-01-10",
  "notes": "Monthly paddy purchase for January"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Expense recorded successfully",
  "data": {
    "id": 1,
    "expense_type": "Paddy Purchase",
    "amount": "50000.00",
    "expense_date": "2024-01-10",
    "notes": "Monthly paddy purchase for January",
    "created_by": 1,
    "created_at": "2024-01-10T10:00:00.000Z"
  }
}
```

### 10. Get Monthly Expenses
**Request:**
```http
GET /api/expenses/monthly?month=1&year=2024
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "total_expenses": "95000.00",
    "by_type": [
      {
        "expense_type": "Paddy Purchase",
        "total_amount": "50000.00"
      },
      {
        "expense_type": "Labour Salary",
        "total_amount": "30000.00"
      },
      {
        "expense_type": "Electricity",
        "total_amount": "15000.00"
      }
    ]
  }
}
```

---

## Dashboard

### 11. Get Dashboard Data
**Request:**
```http
GET /api/dashboard
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_stock": "14700.00",
    "today_sales": "26900.00",
    "monthly_sales": "103000.00",
    "monthly_expenses": "95000.00",
    "monthly_profit": "8000.00"
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Rice variety not found"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### 409 Conflict (Duplicate Entry)
```json
{
  "success": false,
  "message": "Duplicate entry. Record already exists."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## cURL Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ricemill.com","password":"admin123"}'
```

### Get Rice Varieties (with token)
```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:3000/api/rice \
  -H "Authorization: Bearer $TOKEN"
```

### Create Sale
```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:3000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rice_variety_id": 1,
    "customer_id": 1,
    "quantity_kg": 100,
    "price_per_kg": 75,
    "payment_type": "Cash",
    "sale_date": "2024-01-15"
  }'
```

---

## Notes

1. All monetary values are in INR (₹)
2. All weights are in kilograms (kg)
3. Dates should be in ISO 8601 format (YYYY-MM-DD)
4. The `total_amount` in sales is automatically calculated if not provided (quantity_kg × price_per_kg)
5. Sales operations use MySQL transactions - if stock is insufficient, the entire operation is rolled back
6. Credit sales automatically update the customer's `credit_balance`


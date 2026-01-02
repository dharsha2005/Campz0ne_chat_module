# Rice Mill Management System - Backend API

Complete Node.js/Express.js backend for Rice Mill Management System with MySQL database and JWT authentication.

## 🚀 Features

- **Authentication**: JWT-based authentication with role-based access control (Admin/Staff)
- **Database**: MySQL with proper foreign keys, indexes, and transactions
- **API Endpoints**: RESTful API for all business operations
- **Transactions**: MySQL transactions for sales to ensure data consistency
- **Validation**: Input validation using express-validator
- **Error Handling**: Comprehensive error handling middleware
- **Clean Architecture**: Organized folder structure (MVC pattern)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone/Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=rice_mill_db
   PORT=3000
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Create database and tables**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Seed sample data (optional)**
   ```bash
   mysql -u root -p < database/seed.sql
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or port specified in `.env`)

## 📡 API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ricemill.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@ricemill.com",
      "role": "admin"
    }
  }
}
```

### Rice Varieties

#### Get All Rice Varieties
```http
GET /api/rice
Authorization: Bearer {token}
```

#### Create Rice Variety
```http
POST /api/rice
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Basmati Raw",
  "category": "Raw",
  "stock_kg": 5000,
  "cost_price_per_kg": 60,
  "selling_price_per_kg": 75
}
```

#### Update Rice Variety
```http
PUT /api/rice/:id
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

#### Delete Rice Variety
```http
DELETE /api/rice/:id
Authorization: Bearer {token}
```

### Sales

#### Create Sale (with Transaction)
```http
POST /api/sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "rice_variety_id": 1,
  "customer_id": 1,
  "quantity_kg": 100,
  "price_per_kg": 75,
  "payment_type": "Cash",
  "sale_date": "2024-01-15"
}
```

**Note:** This endpoint uses MySQL transactions. If stock is insufficient, the entire operation is rolled back.

#### Get All Sales
```http
GET /api/sales
Authorization: Bearer {token}
```

**Query Parameters:**
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)
- `rice_variety_id`: Filter by rice variety

#### Get Sales Summary
```http
GET /api/sales/summary
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": 10,
    "total_quantity": 1500.50,
    "total_sales_amount": 112500.00,
    "total_profit": 25000.00,
    "variety_wise": [
      {
        "rice_variety_id": 1,
        "rice_variety_name": "Basmati Raw",
        "sold_quantity": 500.00,
        "sales_amount": 37500.00,
        "cost_amount": 30000.00,
        "profit": 7500.00
      }
    ]
  }
}
```

### Expenses

#### Create Expense
```http
POST /api/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "expense_type": "Paddy Purchase",
  "amount": 50000,
  "expense_date": "2024-01-10",
  "notes": "Monthly paddy purchase"
}
```

#### Get All Expenses
```http
GET /api/expenses
Authorization: Bearer {token}
```

#### Get Monthly Expenses
```http
GET /api/expenses/monthly?month=1&year=2024
Authorization: Bearer {token}
```

### Dashboard

#### Get Dashboard Data
```http
GET /api/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_stock": 14700.00,
    "today_sales": 26900.00,
    "monthly_sales": 103000.00,
    "monthly_expenses": 95000.00,
    "monthly_profit": 8000.00
  }
}
```

## 🔒 Authentication

All endpoints except `/api/auth/login` require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer {your_jwt_token}
```

## 👥 Default Admin Credentials

After running the schema.sql, default admin user is created:

- **Email:** admin@ricemill.com
- **Password:** admin123

**⚠️ Important:** Change the default password in production!

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js      # MySQL connection pool
│   └── jwt.js           # JWT configuration
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── expenseController.js
│   ├── riceController.js
│   └── salesController.js
├── database/
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Sample data
├── middleware/
│   ├── auth.js          # JWT authentication
│   ├── errorHandler.js  # Error handling
│   └── validation.js    # Input validation
├── models/
│   ├── Customer.js
│   ├── Expense.js
│   ├── Payment.js
│   ├── RiceVariety.js
│   ├── Sale.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── expenseRoutes.js
│   ├── riceRoutes.js
│   └── salesRoutes.js
├── services/
│   ├── authService.js
│   ├── dashboardService.js
│   └── salesService.js  # Sales with transactions
├── app.js               # Express app setup
├── server.js            # Server entry point
├── package.json
└── .env.example
```

## 🔐 Security Features

- Password hashing using bcryptjs
- JWT token-based authentication
- Role-based access control (Admin/Staff)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- Transaction support for data consistency

## 📊 Database Schema

The database includes the following tables:

- `users` - Admin and staff users
- `rice_varieties` - Rice stock and pricing
- `sales` - Sales records
- `expenses` - Expense tracking
- `customers` - Customer information
- `payments` - Customer payments

All tables have proper foreign keys, indexes, and constraints.

## 🧪 Testing the API

Use tools like Postman, Insomnia, or curl to test the API endpoints.

### Example: Login and Get Rice Varieties

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ricemill.com","password":"admin123"}'

# 2. Use the token from response
curl -X GET http://localhost:3000/api/rice \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 Troubleshooting

1. **Database connection error**: Check MySQL is running and credentials in `.env` are correct
2. **Port already in use**: Change PORT in `.env` file
3. **JWT errors**: Ensure JWT_SECRET is set in `.env`
4. **Table doesn't exist**: Run `database/schema.sql` to create tables

## 📝 Notes

- All monetary values are stored as DECIMAL(10,2) for precision
- Dates are stored as DATE or TIMESTAMP
- Stock quantities are stored as DECIMAL(10,2) to support fractional kilograms
- Sales operations use MySQL transactions to ensure data consistency
- Credit sales automatically update customer credit_balance

## 🔄 Next Steps

1. Set up proper password hashing for admin user (update schema.sql)
2. Add API rate limiting
3. Add logging (Winston, Morgan)
4. Add unit tests (Jest)
5. Set up CI/CD pipeline
6. Add API documentation (Swagger)

## 📄 License

ISC


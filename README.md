# Rice Mill Management System

A complete Angular frontend application for managing a rice mill business operations.

## Features

- **Dashboard**: Overview with total stock, sales, and profit metrics with visual charts
- **Rice Variety & Stock Management**: CRUD operations for rice varieties with low stock alerts
- **Sales Entry**: Record sales with automatic stock reduction
- **Sales Report**: Variety-wise sales analysis with profit calculations
- **Expense Management**: Track various expenses (paddy purchase, labour, electricity, etc.)
- **Monthly Profit**: Profit/loss analysis with month/year selection and charts
- **Payment & Credit**: Manage customer payments and track credit status

## Tech Stack

- Angular 17
- TypeScript
- Bootstrap 5
- Chart.js / ng2-charts
- RxJS

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Navigate to `http://localhost:4200/`

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── rice-variety/
│   │   ├── sales-entry/
│   │   ├── sales-report/
│   │   ├── expense-management/
│   │   ├── monthly-profit/
│   │   └── payment/
│   ├── models/
│   │   ├── rice-variety.model.ts
│   │   ├── sales.model.ts
│   │   ├── expense.model.ts
│   │   └── payment.model.ts
│   ├── services/
│   │   └── data.service.ts
│   ├── app.module.ts
│   ├── app-routing.module.ts
│   └── app.component.ts
├── styles.css
└── index.html
```

## Usage

The application uses mock data stored in the `DataService`. All data is persisted in memory during the session. To connect to a backend API, modify the `DataService` to make HTTP calls instead of using BehaviorSubjects.

## Features Overview

### Dashboard
- Real-time overview of business metrics
- Daily sales trend chart (last 7 days)
- Monthly profit chart (last 6 months)

### Rice Variety Management
- Add, edit, delete rice varieties
- Track stock quantities
- Low stock warnings (below 500 kg)
- Cost and selling price management

### Sales Entry
- Record sales with automatic calculations
- Automatic stock deduction
- Multiple payment types (Cash, UPI, Credit)

### Sales Report
- Variety-wise sales breakdown
- Profit calculation per variety
- Total sales and profit summary

### Expense Management
- Track different expense categories
- Monthly expense totals
- Add, edit, delete expenses

### Monthly Profit
- Month and year selection
- Profit/Loss calculation
- Visual charts for financial overview

### Payment & Credit
- Customer payment tracking
- Credit status management
- Pending amount calculations

## Notes

- All data is stored in memory (mock data)
- Stock is automatically reduced when sales are recorded
- Profit calculations consider cost price vs selling price
- The UI is designed for non-technical users with a clean, professional look

# Campz0ne_chat_module

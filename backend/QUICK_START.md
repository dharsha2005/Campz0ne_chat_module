# Quick Start Guide

Follow these steps to get the backend up and running quickly.

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rice_mill_db
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

## Step 3: Create Database

Run the SQL schema to create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or manually:
1. Open MySQL command line or MySQL Workbench
2. Run the contents of `database/schema.sql`

## Step 4: Create Admin User

Run the admin creation script to set up the default admin user:

```bash
npm run create-admin
```

Or:
```bash
node database/createAdmin.js
```

This creates an admin user with:
- Email: `admin@ricemill.com`
- Password: `admin123`

**⚠️ Change this password after first login in production!**

## Step 5: (Optional) Seed Sample Data

To add sample rice varieties and customers:

```bash
mysql -u root -p < database/seed.sql
```

## Step 6: Start the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Step 7: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ricemill.com","password":"admin123"}'
```

Save the token from the response and use it in subsequent requests:

```bash
TOKEN="your_token_here"
curl -X GET http://localhost:3000/api/rice \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Issue: "Cannot connect to database"
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` file
- Ensure database `rice_mill_db` exists

### Issue: "Port 3000 already in use"
- Change `PORT` in `.env` file
- Or kill the process using port 3000

### Issue: "Admin user creation fails"
- Ensure database is created first
- Check MySQL user has CREATE/INSERT permissions

## Next Steps

- Read `README.md` for detailed API documentation
- Check `API_EXAMPLES.md` for more API examples
- Integrate with your Angular frontend
- Update JWT_SECRET for production
- Set up proper logging and monitoring

## API Base URL

Once running, your API is available at:
```
http://localhost:3000/api
```

## Default Credentials

- **Email:** admin@ricemill.com
- **Password:** admin123

⚠️ **IMPORTANT:** Change these credentials in production!


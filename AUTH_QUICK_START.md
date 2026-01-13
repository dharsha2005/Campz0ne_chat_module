# Authentication System - Quick Start Guide

## 🚀 Quick Test

### 1. Start the Server
```bash
npm start
```

### 2. Register a User

**cURL**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "name": "Test User",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Login

**cURL**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "uuid-here",
    "name": "Test User",
    "email": "test@example.com",
    "isOnline": false,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Use userId for Socket.IO

After login, use the `userId` to connect to Socket.IO:

```javascript
// In your frontend
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
});

const { data } = await loginResponse.json();
const userId = data.userId;

// Connect to Socket.IO
const socket = io('http://localhost:3000', {
  auth: { userId },
  query: { userId }
});
```

---

## 📋 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |

---

## ✅ Features Implemented

- ✅ User registration with email, password, name
- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Email format validation
- ✅ Duplicate email prevention
- ✅ Secure login with password verification
- ✅ Password never returned in responses
- ✅ Proper error handling and status codes
- ✅ Clean architecture (models, services, controllers, routes)
- ✅ Socket.IO integration ready

---

## 🔒 Security

- Passwords hashed with bcrypt (12 salt rounds)
- Email validation (regex)
- Password minimum length: 6 characters
- Generic error messages (prevents user enumeration)
- Password hash excluded from all responses

---

**Ready for production use!** 🎉


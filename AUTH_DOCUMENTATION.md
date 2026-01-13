# CampZone Chat Module - Authentication System Documentation

## 🔐 Overview

The authentication system provides secure user registration and login functionality, integrated with the CampZone Chat Module. Users can register with email, password, and name, then use these credentials to authenticate and access chat features.

---

## 📁 Project Structure

```
ChatModule/
├── models/
│   └── User.js              # User schema with email, password, name
├── services/
│   └── authService.js       # Business logic: password hashing, validation
├── controllers/
│   └── authController.js    # HTTP request handlers
├── routes/
│   └── auth.js              # Express routes (register, login)
└── server.js                # Main server (includes auth routes)
```

---

## 🗄️ User Schema

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Unique identifier (UUID) |
| `name` | String | Yes | User's full name |
| `email` | String | Yes | Unique email address (validated) |
| `passwordHash` | String | No | Bcrypt hashed password (optional for non-auth users) |
| `lastSeen` | Date | No | Last activity timestamp |
| `isOnline` | Boolean | No | Online status flag |
| `createdAt` | Date | No | Account creation timestamp |

### Security Features

- **Email Validation**: Regex validation ensures proper email format
- **Password Exclusion**: Password hash never returned in JSON responses
- **Sparse Unique Index**: Allows multiple null emails (for presence-only users) but enforces uniqueness for registered users
- **Lowercase Email**: Emails are automatically lowercased and trimmed

---

## 🔑 Authentication Flow

### 1. User Registration

```
Client Request:
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Server Process:
1. Validate input (email, password, name required)
2. Validate email format (regex)
3. Validate password strength (min 6 characters)
4. Check for duplicate email
5. Hash password with bcrypt (12 salt rounds)
6. Generate unique userId (UUID)
7. Create user in database
8. Return user data (without password)

Response:
201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. User Login

```
Client Request:
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "securePassword123"
}

Server Process:
1. Validate input (email, password required)
2. Find user by email (include passwordHash)
3. Check if user exists and has passwordHash
4. Compare provided password with stored hash
5. Update lastSeen timestamp
6. Return user data (without password)

Response:
200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "uuid-here",
    "name": "John Doe",
    "email": "user@example.com",
    "isOnline": false,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🔒 Security Implementation

### Password Hashing

- **Algorithm**: bcrypt
- **Salt Rounds**: 12 (configurable in `AuthService.SALT_ROUNDS`)
- **Storage**: Only hashed password stored in database
- **Comparison**: `bcrypt.compare()` for login verification

### Password Validation

- **Minimum Length**: 6 characters
- **Future Enhancement**: Can add complexity requirements (uppercase, numbers, symbols)

### Email Validation

- **Format**: Regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Uniqueness**: Enforced at database level
- **Normalization**: Lowercased and trimmed before storage

### Error Handling

- **Never expose sensitive information** in error messages
- **Generic error messages** for invalid credentials (prevents user enumeration)
- **Proper HTTP status codes**:
  - `400` - Bad Request (validation errors)
  - `401` - Unauthorized (invalid credentials)
  - `409` - Conflict (duplicate email)
  - `500` - Internal Server Error

---

## 📡 API Endpoints

### POST /api/auth/register

**Description**: Register a new user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400` - Missing required fields or invalid format
- `409` - Email already exists
- `500` - Internal server error

---

### POST /api/auth/login

**Description**: Authenticate user and return user data

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "user@example.com",
    "isOnline": false,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Internal server error

---

## 🔌 Socket.IO Integration

The authentication system is designed to integrate seamlessly with Socket.IO:

### Using userId for Chat

After login, the client receives a `userId`. This `userId` should be used when connecting to Socket.IO:

```javascript
// Client-side example
const socket = io('http://localhost:3000', {
  auth: {
    userId: loginResponse.data.userId  // From login API
  },
  query: {
    userId: loginResponse.data.userId
  }
});
```

### User Model Integration

- The `userId` from authentication is used as `senderId` in chat messages
- The same `User` model is used for both authentication and chat presence
- Users created via registration can immediately use chat features

---

## 🧪 Testing the API

### Using cURL

**Register a user**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Using Postman/Thunder Client

1. **Register**:
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "user@example.com",
       "password": "password123",
       "name": "John Doe"
     }
     ```

2. **Login**:
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "user@example.com",
       "password": "password123"
     }
     ```

---

## 📋 Service Methods

### AuthService

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `registerUser()` | Register new user | `{ email, password, name }` | User object (no password) |
| `loginUser()` | Authenticate user | `email, password` | User object (no password) |
| `hashPassword()` | Hash password | `password` | Hashed string |
| `comparePassword()` | Compare password | `password, hash` | Boolean |
| `validateEmail()` | Validate email format | `email` | Boolean |
| `validatePassword()` | Validate password strength | `password` | `{ valid, message? }` |
| `getUserById()` | Get user by userId | `userId` | User object |
| `getUserByEmail()` | Get user by email | `email` | User object |

---

## 🚀 Next Steps

After authentication:

1. **Client receives `userId`** from login response
2. **Connect to Socket.IO** using `userId`:
   ```javascript
   socket = io(serverUrl, {
     auth: { userId: userId },
     query: { userId: userId }
   });
   ```
3. **Use `userId` for chat operations**:
   - Join rooms
   - Send messages (as `senderId`)
   - Track presence

---

## 🔐 Security Best Practices

✅ **Implemented**:
- Password hashing with bcrypt (12 salt rounds)
- Email format validation
- Password never returned in responses
- Generic error messages for invalid credentials
- Input validation and sanitization

🔮 **Future Enhancements**:
- JWT tokens for session management
- Password reset functionality
- Email verification
- Rate limiting for login attempts
- Two-factor authentication (2FA)
- Password complexity requirements

---

## 📝 Code Examples

### Register User (Service)
```javascript
const user = await AuthService.registerUser({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe'
});
```

### Login User (Service)
```javascript
const user = await AuthService.loginUser('user@example.com', 'securePassword123');
```

### Hash Password
```javascript
const hash = await AuthService.hashPassword('myPassword');
```

### Compare Password
```javascript
const isMatch = await AuthService.comparePassword('myPassword', hash);
```

---

**Status**: ✅ Production Ready

All authentication features are implemented and ready for integration with the chat system.


# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 3: Seed Sample Data (Optional)
```bash
node scripts/seedData.js
```

This creates:
- 3 users: `user1`, `user2`, `user3`
- 3 rooms: `room1` (General Chat), `room2` (Tech Discussion), `room3` (One-to-one)

### Step 4: Start the Server
```bash
npm start
```

Server will start on `http://localhost:3000`

### Step 5: Test the Chat

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **Connect as User 1**:
   - Enter User ID: `user1`
   - Click "Connect"
   - Select "Room 1"

3. **Open Another Tab** (or browser window):
   - Enter User ID: `user2`
   - Click "Connect"
   - Select "Room 1"

4. **Start Chatting**:
   - Type messages in either tab
   - See real-time updates
   - Test typing indicators
   - Test read receipts

## 🧪 Test Scenarios

### Test Message Ordering
1. Open 3 tabs with different users
2. Send messages rapidly from all tabs
3. Verify messages appear in correct order (Lamport timestamps)

### Test Idempotency
1. Send a message
2. Quickly send the same message again (simulate network retry)
3. Verify only one message appears (duplicate prevented)

### Test Typing Indicators
1. Start typing in one tab
2. See typing indicator in other tabs
3. Stop typing - indicator disappears after 2 seconds

### Test Read Receipts
1. Send a message from User 1
2. User 2 receives the message
3. Click on the message (mark as read)
4. Verify read receipt is broadcast

### Test Reconnection
1. Connect as a user
2. Disconnect (close tab or click Disconnect)
3. Reconnect with same User ID
4. Verify messages are still accessible

## 📝 Environment Variables

Create a `.env` file (optional):
```env
MONGODB_URI=mongodb://localhost:27017/campzone_chat
PORT=3000
```

If not provided, defaults are used.

## 🔍 Verify Installation

Check server health:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env` or default
- Verify MongoDB port (default: 27017)

### Port Already in Use
- Change PORT in `.env`
- Or kill process using port 3000

### Socket Connection Failed
- Check server is running
- Verify CORS settings in `server.js`
- Check browser console for errors

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Explore the codebase to understand implementation
- Customize for your needs

Happy Chatting! 🎉


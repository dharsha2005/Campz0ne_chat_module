# CampZone Chat Module

Production-ready real-time chat module built with MongoDB, Socket.IO, and Node.js.

## 🎯 Features

- ✅ **One-to-One & Group Chat** - Support for private and group conversations
- ✅ **Real-Time Communication** - WebSocket-based messaging via Socket.IO
- ✅ **Message Ordering** - Lamport Logical Clocks ensure correct message ordering
- ✅ **Reliable Delivery** - Message queue with retry logic and delivery status tracking
- ✅ **Idempotency** - Duplicate message prevention using unique idempotency keys
- ✅ **Read Receipts** - Track message read status per user
- ✅ **Typing Indicators** - Real-time typing status with auto-expiry
- ✅ **Online/Offline Presence** - Track user presence and last seen timestamps
- ✅ **Encryption-Ready** - Database schema ready for future encryption implementation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   cd ChatModule
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/campzone_chat
   PORT=3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed sample data (optional)**
   ```bash
   node scripts/seedData.js
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Open the test client**
   Navigate to `http://localhost:3000` in your browser (if serving static files) or use the HTML file in `public/index.html`.

## 📁 Project Structure

```
ChatModule/
├── config/
│   └── database.js          # MongoDB connection configuration
├── models/
│   ├── User.js              # User schema
│   ├── ChatRoom.js          # Chat room schema
│   ├── ChatParticipant.js   # Room participants schema
│   ├── Message.js           # Message schema (with Lamport timestamp)
│   ├── MessageReadReceipt.js # Read receipt schema
│   ├── TypingStatus.js      # Typing indicator schema
│   ├── MessageQueueLog.js   # Message queue log schema
│   └── ChatEncryptionKey.js # Encryption keys schema (stub)
├── services/
│   ├── lamportClock.js      # Lamport clock implementation
│   ├── messageQueue.js      # Message queue with retry logic
│   ├── presenceService.js   # Online/offline presence tracking
│   ├── typingService.js     # Typing indicator management
│   └── readReceiptService.js # Read receipt management
├── socketHandlers/
│   ├── connectionHandler.js # Socket connection/disconnection handling
│   └── chatHandlers.js      # Chat event handlers
├── public/
│   └── index.html           # Simple test client (HTML + Vanilla JS)
├── scripts/
│   └── seedData.js          # Database seeding script
├── server.js                # Main server file
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Collections

1. **users** - User information and presence
2. **chat_rooms** - Chat room metadata
3. **chat_participants** - Room membership
4. **messages** - Chat messages with Lamport timestamps
5. **message_read_receipts** - Read status tracking
6. **typing_status** - Typing indicators (TTL index for auto-expiry)
7. **message_queue_log** - Message delivery queue
8. **chat_encryption_keys** - Encryption keys (stub for future implementation)

### Key Indexes

- `messages`: `{ roomId: 1, lamportTimestamp: 1, createdAt: 1 }` - For message ordering
- `messages`: `{ idempotencyKey: 1 }` - Unique index for idempotency
- `chat_participants`: `{ roomId: 1, userId: 1 }` - Unique compound index
- `message_read_receipts`: `{ messageId: 1, userId: 1 }` - Unique compound index

## 🔄 Message Flow Architecture

```
Client
  ↓ (Socket.IO)
Chat Server (Socket Handlers)
  ↓
Message Queue Service
  ↓ (with retry logic)
MongoDB (Message Storage)
  ↓
Broadcast to Room Participants
```

### Message Ordering (Lamport Clocks)

1. **Client-side**: Increment local Lamport clock before sending message
2. **Server-side**: Receive message with `lamportTimestamp`
3. **Server update**: `serverClock = max(serverClock, messageLamportTimestamp) + 1`
4. **Storage**: Store message with server's Lamport timestamp
5. **Query**: Order by `lamportTimestamp ASC, createdAt ASC`

### Idempotency

- Every message includes a unique `idempotencyKey` (e.g., `userId-timestamp-random`)
- Server enforces `UNIQUE` index on `idempotencyKey`
- Duplicate messages are safely ignored

### Message Queue & Retry

- Messages are enqueued with status `PENDING`
- Delivery attempts update status to `DELIVERED` or `FAILED`
- Failed messages are retried with exponential backoff (1s, 5s, 15s)
- Max retries: 3 attempts

## 📡 Socket.IO Events

### Client → Server

- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_read` - Mark message as read
- `get_messages` - Fetch messages for a room
- `get_online_users` - Get online users in a room

### Server → Client

- `connected` - Connection confirmed
- `joined_room` - Successfully joined room
- `new_message` - New message received
- `message_sent` - Message send acknowledgment
- `user_typing` - Typing indicator update
- `read_receipt` - Read receipt update
- `online_users` - Online users list
- `user_joined` - User joined room
- `user_left` - User left room
- `messages` - Messages list response
- `error` - Error occurred

## 🧪 Testing

### Using the Test Client

1. Start the server: `npm start`
2. Open `public/index.html` in your browser (or serve it via Express)
3. Enter a User ID (e.g., `user1`, `user2`)
4. Click "Connect"
5. Select a room and start chatting

### Test Scenarios

1. **Multiple Users**: Open multiple browser tabs with different User IDs
2. **Message Ordering**: Send messages rapidly and verify ordering
3. **Typing Indicators**: Type in one client and see indicator in others
4. **Read Receipts**: Mark messages as read and verify updates
5. **Reconnection**: Disconnect and reconnect to test reconnection handling

## 🔐 Security Considerations

- **Authentication**: Implement proper user authentication (currently uses userId from handshake)
- **Authorization**: Verify room membership before allowing operations
- **Input Validation**: Validate all inputs on server-side
- **Rate Limiting**: Implement rate limiting for production use
- **CORS**: Configure CORS properly for production
- **Encryption**: Encryption key schema is ready for future implementation

## 🚧 Future Enhancements

- [ ] User authentication & JWT tokens
- [ ] File/image upload support
- [ ] Message search functionality
- [ ] Push notifications
- [ ] End-to-end encryption implementation
- [ ] Message reactions/emojis
- [ ] Message editing/deletion
- [ ] Admin moderation features
- [ ] Analytics and metrics

## 📝 License

ISC

## 👨‍💻 Architecture Notes

### Scalability

- **Horizontal Scaling**: Socket.IO supports Redis adapter for multi-server deployment
- **Database**: MongoDB sharding can be implemented for large-scale deployments
- **Message Queue**: Consider using Bull or Agenda.js for production message queue

### Reliability

- **Message Persistence**: All messages are persisted before delivery
- **Retry Logic**: Failed messages are automatically retried
- **Idempotency**: Prevents duplicate messages even under network issues
- **Connection Handling**: Graceful handling of disconnections and reconnections

### Performance

- **Indexes**: Optimized database indexes for common queries
- **TTL Indexes**: Typing status auto-expires via MongoDB TTL
- **Efficient Queries**: Compound indexes for room-based queries

---

Built with ❤️ for production-ready real-time chat

#   C a m p z 0 n e _ c h a t _ m o d u l e 
 
 "# Campz0ne_chat_module" 
# changes updated
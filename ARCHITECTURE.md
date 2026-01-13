# CampZone Chat Module - Architecture Documentation

## 🏗️ System Architecture

### High-Level Flow

```
┌─────────┐
│ Client  │ (HTML + Vanilla JS)
└────┬────┘
     │ Socket.IO (WebSocket)
     ↓
┌─────────────────┐
│  Socket Server  │ (Express + Socket.IO)
└────┬────────────┘
     │
     ├──→ Connection Handler (manages connect/disconnect/reconnect)
     │
     ├──→ Chat Handlers (message events)
     │       │
     │       ├──→ Lamport Clock Service (message ordering)
     │       ├──→ Message Queue Service (reliable delivery)
     │       ├──→ Read Receipt Service (read tracking)
     │       ├──→ Typing Service (typing indicators)
     │       └──→ Presence Service (online/offline)
     │
     ↓
┌─────────┐
│ MongoDB │ (Message persistence)
└─────────┘
```

## 📊 Database Schema Design

### 1. Users Collection
```javascript
{
  userId: String (unique, indexed),
  username: String,
  email: String (unique),
  lastSeen: Date,
  isOnline: Boolean,
  createdAt: Date
}
```

### 2. Chat Rooms Collection
```javascript
{
  roomId: String (unique, indexed),
  roomName: String,
  roomType: Enum ['one-to-one', 'group', 'class', 'department', 'club'],
  createdBy: String (ref: User),
  description: String,
  createdAt: Date
}
```

### 3. Chat Participants Collection
```javascript
{
  roomId: String (indexed),
  userId: String (indexed),
  role: Enum ['member', 'admin', 'moderator'],
  joinedAt: Date,
  lastReadAt: Date
}
// Compound unique index: { roomId: 1, userId: 1 }
```

### 4. Messages Collection (CRITICAL)
```javascript
{
  roomId: String (indexed),
  senderId: String (indexed),
  content: String,
  lamportTimestamp: Number (indexed), // For ordering
  idempotencyKey: String (unique, indexed), // Prevent duplicates
  status: Enum ['PENDING', 'DELIVERED', 'READ'],
  messageType: Enum ['text', 'image', 'file', 'system'],
  createdAt: Date (indexed)
}
// Compound index for ordering: { roomId: 1, lamportTimestamp: 1, createdAt: 1 }
```

### 5. Message Read Receipts Collection
```javascript
{
  messageId: ObjectId (ref: Message, indexed),
  roomId: String (indexed),
  userId: String (indexed),
  readAt: Date
}
// Compound unique index: { messageId: 1, userId: 1 }
```

### 6. Typing Status Collection
```javascript
{
  roomId: String (indexed),
  userId: String (indexed),
  isTyping: Boolean,
  expiresAt: Date (TTL index for auto-expiry)
}
```

### 7. Message Queue Log Collection
```javascript
{
  messageId: ObjectId (ref: Message, indexed),
  roomId: String (indexed),
  status: Enum ['PENDING', 'DELIVERED', 'FAILED', 'RETRY'],
  retryCount: Number,
  maxRetries: Number,
  lastAttemptAt: Date,
  nextRetryAt: Date (indexed),
  errorMessage: String
}
```

### 8. Chat Encryption Keys Collection (Stub)
```javascript
{
  roomId: String (unique, indexed),
  encryptionKey: String,
  keyVersion: Number,
  createdAt: Date,
  rotatedAt: Date
}
```

## 🔄 Message Flow (Detailed)

### 1. Message Sending Flow

```
Client:
  1. Increment local Lamport clock: lamportClock++
  2. Generate idempotencyKey: userId-timestamp-random
  3. Emit 'send_message' event with:
     - roomId
     - content
     - lamportTimestamp
     - idempotencyKey

Server (Chat Handlers):
  1. Receive message event
  2. Check idempotency: Query Message by idempotencyKey
     - If exists → Return duplicate acknowledgment, STOP
  3. Update server Lamport clock:
     serverClock = max(serverClock, messageLamportTimestamp) + 1
  4. Create Message document:
     - Store with server's Lamport timestamp
     - Status: PENDING
  5. Enqueue message (Message Queue Service):
     - Create MessageQueueLog entry (status: PENDING)
  6. Process delivery:
     - Attempt to broadcast to room
     - On success: Update status to DELIVERED
     - On failure: Schedule retry with exponential backoff
  7. Broadcast 'new_message' to all room participants
  8. Send acknowledgment to sender ('message_sent')
```

### 2. Message Ordering (Lamport Clocks)

**Client-Side:**
- Each client maintains a local Lamport clock (integer)
- Before sending: `lamportClock += 1`
- Include `lamportTimestamp` in message

**Server-Side:**
- Server maintains per-room Lamport clocks
- On receiving message:
  ```javascript
  currentClock = getCurrentTimestamp(roomId);
  newClock = Math.max(currentClock, messageLamportTimestamp) + 1;
  setClock(roomId, newClock);
  ```
- Store message with server's Lamport timestamp

**Query Ordering:**
```javascript
Message.find({ roomId })
  .sort({ lamportTimestamp: 1, createdAt: 1 })
  // Primary: lamportTimestamp ASC
  // Secondary: createdAt ASC (for tie-breaking)
```

### 3. Idempotency Handling

**Key Generation:**
```javascript
idempotencyKey = `${userId}-${Date.now()}-${Math.random()}`;
```

**Server-Side Check:**
1. Query: `Message.findOne({ idempotencyKey })`
2. If exists → Duplicate, ignore but acknowledge
3. If not exists → Process normally
4. Database enforces uniqueness via index

**Benefits:**
- Prevents duplicate messages from network retries
- Safe to retry failed requests
- Handles client reconnection scenarios

### 4. Message Queue & Retry Logic

**Queue States:**
- `PENDING`: Initial state, awaiting delivery
- `DELIVERED`: Successfully delivered to all participants
- `FAILED`: Max retries exceeded
- `RETRY`: Scheduled for retry

**Retry Strategy:**
- Exponential backoff: [1000ms, 5000ms, 15000ms]
- Max retries: 3 attempts
- On failure: Update status to RETRY, schedule next attempt
- On max retries: Mark as FAILED

**Delivery Process:**
```javascript
async processDelivery(message, deliveryCallback) {
  try {
    await deliveryCallback(message); // Broadcast to room
    queueLog.status = 'DELIVERED';
  } catch (error) {
    scheduleRetry(queueLog, error);
  }
}
```

### 5. Read Receipts Flow

```
Client:
  1. User views message
  2. Emit 'mark_read' event with messageId and roomId

Server:
  1. Check if already read (MessageReadReceipt exists)
  2. Create MessageReadReceipt document
  3. Update ChatParticipant.lastReadAt
  4. Check if all participants have read:
     - Count participants in room
     - Count read receipts for message
     - If equal → Update Message.status to 'READ'
  5. Broadcast 'read_receipt' event to room
  6. Send acknowledgment to client
```

### 6. Typing Indicator Flow

```
Client:
  1. User starts typing → Emit 'typing_start'
  2. User stops typing → Emit 'typing_stop'
  3. Auto-stop after 2 seconds of inactivity

Server:
  1. On 'typing_start':
     - Update TypingStatus (isTyping: true, expiresAt: now + 30s)
     - Set timer for auto-expiry
     - Broadcast 'user_typing' to room (except sender)
  2. On 'typing_stop':
     - Update TypingStatus (isTyping: false)
     - Clear timer
     - Broadcast 'user_typing' to room
  3. Auto-expiry (MongoDB TTL index):
     - TypingStatus expires after 30 seconds
     - Cleanup job removes expired entries
```

### 7. Presence Tracking Flow

```
Connection:
  1. User connects → PresenceService.userOnline(socketId, userId)
     - Add to onlineUsers Map
     - Update User.isOnline = true
     - Update User.lastSeen = now
  2. User disconnects → PresenceService.userOffline(socketId)
     - Remove socketId from user's socket set
     - If no more sockets → Update User.isOnline = false
     - Update User.lastSeen = now

Query:
  - getOnlineUsers(): Returns all online user IDs
  - getOnlineUsersInRoom(userIds): Filters online users in room
```

## 🔌 Socket.IO Events Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId, userId }` | Join a chat room |
| `leave_room` | `{ roomId }` | Leave a chat room |
| `send_message` | `{ roomId, content, lamportTimestamp, idempotencyKey }` | Send a message |
| `typing_start` | `{ roomId }` | Start typing indicator |
| `typing_stop` | `{ roomId }` | Stop typing indicator |
| `mark_read` | `{ messageId, roomId }` | Mark message as read |
| `get_messages` | `{ roomId, limit?, skip? }` | Fetch messages |
| `get_online_users` | `{ roomId }` | Get online users |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ socketId, userId, message }` | Connection confirmed |
| `joined_room` | `{ roomId, message }` | Successfully joined |
| `new_message` | `{ messageId, roomId, senderId, content, lamportTimestamp, createdAt, status }` | New message received |
| `message_sent` | `{ messageId, idempotencyKey, status }` | Message send acknowledgment |
| `user_typing` | `{ roomId, userId, isTyping }` | Typing indicator update |
| `read_receipt` | `{ messageId, roomId, userId, readAt }` | Read receipt update |
| `online_users` | `{ roomId, onlineUsers, count }` | Online users list |
| `user_joined` | `{ roomId, userId, timestamp }` | User joined room |
| `user_left` | `{ roomId, userId, timestamp }` | User left room |
| `messages` | `{ roomId, messages, count }` | Messages list response |
| `error` | `{ message }` | Error occurred |

## 🚀 Scalability Considerations

### Horizontal Scaling

**Socket.IO Redis Adapter:**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Benefits:**
- Multiple server instances can share socket connections
- Messages broadcast across all servers
- Load balancing support

### Database Sharding

- Shard by `roomId` for room-based queries
- Use MongoDB sharding for large-scale deployments
- Consider read replicas for read-heavy workloads

### Message Queue (Production)

**Current:** In-memory with MongoDB logging
**Production:** Use Bull or Agenda.js with Redis
```javascript
const Queue = require('bull');
const messageQueue = new Queue('messages', {
  redis: { host: 'localhost', port: 6379 }
});
```

## 🔒 Security Considerations

1. **Authentication:** Implement JWT or session-based auth
2. **Authorization:** Verify room membership before operations
3. **Input Validation:** Sanitize all user inputs
4. **Rate Limiting:** Prevent message spam
5. **CORS:** Configure allowed origins
6. **Encryption:** Implement end-to-end encryption using ChatEncryptionKey schema

## 📈 Performance Optimizations

1. **Database Indexes:** All critical queries are indexed
2. **TTL Indexes:** Typing status auto-expires
3. **Compound Indexes:** Efficient room-based queries
4. **Connection Pooling:** MongoDB connection pooling enabled
5. **Efficient Queries:** Use projection to limit data transfer

## 🧪 Testing Strategy

1. **Unit Tests:** Test services independently
2. **Integration Tests:** Test socket handlers with database
3. **Load Tests:** Test with multiple concurrent connections
4. **Message Ordering Tests:** Verify Lamport clock correctness
5. **Idempotency Tests:** Verify duplicate prevention
6. **Reconnection Tests:** Test disconnect/reconnect scenarios

---

This architecture ensures:
- ✅ Correct message ordering
- ✅ Reliable message delivery
- ✅ No duplicate messages
- ✅ Real-time features (typing, presence, read receipts)
- ✅ Scalability and performance
- ✅ Production-ready code quality


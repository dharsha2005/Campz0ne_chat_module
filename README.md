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
- ✅ **Faculty Dashboard** - Complete materials and subject management
- ✅ **Reply Functionality** - Enhanced chat replies with sender names
- ✅ **Material Upload** - File sharing with metadata and roll number filtering

## � Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **lone the repository**
   ```bash
   git clone https://github.com/dharsha2005/Camp0ne_chat_module.git
   cd Campz0ne_chat_module
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
   JWT_SECRET=your_jwt_secret_here
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

7. **Access the application**
   - **Chat Interface**: Navigate to `http://localhost:3000` for the chat test client
    **Faculty Dashboard**: Navigate to `http://localhost:3000/faulty.hml`
    **Adin Dashboard**: Navigate to `http://localhst:3000/admin.html`
   - **Stdent Dashboard**: Navigate to `http://ocalhost:3000/studnt.html`

## 📁 Prject Structure

```
Campz0e_chat_module/
├── coni/
│   ── ase            nnent
├── ontro/
│   ── antols       catioets
│   ├── asmetsnol.s  mentmet
│   ├── cataeriaole.s   atingmet
│   ── colesntlles       llee mngeent   beotre        Subject aee
    usestrller         # er anagement
 ddleare
   utiwares      #  auttication
 aticinMileaes # a prtiiant alation
    roiares    ese ces ontl ols
    ses             # er sema
    olls            ollee sce
  cts            ec se with chatod
  Chatoom          atrs
    Chatrticins   omaticas sce
  Message            Message e with rt ia  tats trac
    atssgent signmen s
  eReadRecipts  ea ret se
  Typingtas   yping iator
   esee    esee l sema
  tEncrypioneys  ncryption emat
 ui
    ie.hm            Chat tescie
   amintl            din dahoar
   auytml         ctdashba
    stdenthtl          ent s
    ploasaterils   teil pld recto
├── o/
│   ── at.js           #ntication oes
│   ├── s.js              es
│   ├── ats.j         # at roe
│   ├── aints.j     int e
│   ├── eges.j         # ege rtes
│   ├── sect.js # ect e
│   ── us.js             eageeues sece
│   ── atrie.js  #nction servelamortClock.js      # Lamport clock implementation
│   ├── messageQueue.js      # Message queue with retry logic
│   ├── pci
│   ── presenceService.js   # Oline/offline presence tracking
│   ├── typingService.js     # Typing indicator management
│   ├── readReceiptService.js # Read receipt managemennt
├── ocketHandles/
│   ├── connectionHandler.js # Socket connecton/disconnection handling
│   └── chatHandlers.js      # Chat event handlers
├── scri/
│   ── et          # e est cet     scrit
│   └── see.js     # e seiit
├──server.js                # Min server file
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Collections

1. **sers** - User informaion and aut resence
. **chat_rooms** - Chat room metadata
. **chat_participants** - Room membership
. **messages** - Chat messages with Lamport timestamps
. **message_read_receipts** - Read status tracking
. **typing_status** - Typing indicators (TTL index for auto-expiry)
. **message_queue_log** - Message delivery queue
. **chat_encryption_keys** - Ecryption keys (stub for future implementation)

### Key Inexes

-`messages`: `{ roomId: 1, lamportTimestamp: 1, createdAt: 1 }` - For message orderng
- `messages`: `{ impotencyKey: 1 }` - Unique inde for idempotency
- `chat_participants`: `{ roomId: 1, userId: 1 }` - Unique compound index
- `message_read_receipts`: `{ messageId: 1, userId: 1 }` - Unique compound indexd ect indexing

## 🔄 Message Flow Architecture

```
Client
  ↓ (Socket.IO)
Chat Server (Socket Handlers)
  ↓
Mssage Queue Servie
  ↓ (with rerylogc)
MogoDB (Messae Storage)
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

##  esn

### Using the est Client

. Start the serer: npm start
2. Open pulicindexhtml in your rowser or sere it ia preser
3. Enter a User ID (e.g., `us1`, `user2`)
4. Click "Connect"
5. Select a room and start chatting

### Test Scenarios

1. **Multiple Users**: Open multiple browser tabs with different User IDs
2. **Message Ordering**: Send messages rapidly and verify ordering
3. **Typing Indicators**: Type in one client and see indicator in others
4. **Read Receipts**: Mark messages as read and verify updates
5. **Reconnection**: Disconnect and reconnect to test reconnection handling

## 🔐 Security Considerations

- **Authentication**: se authentication t e erfan
- **Authorization**: oebs erol fo all endpoints
- **Input Validatin**: Validate al inputso server-sie
- **Rate Limiting**: Imlement rate limitng for producion use
- **CORS**: Configure  roperl  pdtion
- **Encryption**: tse chema ready for future ention

## 🚧 Future Enhancements

- [ ] e enction ilemeation
- [ ] Message search funcoality
- [ ] Push notifications
- [ ] Message reactions/emojis
- [ ] dned moderation faues
- [ ] Analytan metrics detrics

## 📝 License

ISC

## 👨‍💻 Archtecture Not
### Scalability

 **HorizontalScaling: Socket.IO supports Redis adapter for multi-server deployment
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
- **iesal

---

Built with ❤️ for production-ready re-time chat anecatonal angeet

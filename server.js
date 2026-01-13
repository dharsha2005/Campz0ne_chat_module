const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const os = require('os');
const https = require('https');

const connectDB = require('./config/database');
const ConnectionHandler = require('./socketHandlers/connectionHandler');
const socketService = require('./services/socketService');
const chatsRouter = require('./routes/chats');
const assignmentsRouter = require('./routes/assignments');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Auth routes (register / login)
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Users (admin/hod actions)
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// Subjects
const subjectsRouter = require('./routes/subjects');
app.use('/api/subjects', subjectsRouter);

// Colleges
const collegesRouter = require('./routes/colleges');
app.use('/api/colleges', collegesRouter);

// Materials management (update/delete)
const materialsRouter = require('./routes/materials');
app.use('/api/materials', materialsRouter);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify your frontend URL
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize connection handler
const connectionHandler = new ConnectionHandler(io);

// Initialize socketService with io so controllers can emit scoped events
socketService.init(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectionHandler.handleConnection(socket);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Debug: return network interfaces and public IP to help with port-forwarding
async function getPublicIp(timeout = 3000) {
  return new Promise((resolve) => {
    const req = https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip);
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(null);
    });
  });
}

app.get('/debug/network', async (req, res) => {
  const interfaces = os.networkInterfaces();
  const publicIp = await getPublicIp();
  const listeningPort = process.env.PORT || 3000;
  res.json({
    success: true,
    listeningPort,
    publicIp,
    interfaces
  });
});

// Serve index.html as root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Public colleges endpoint (no auth required)
app.get('/api/public/colleges', async (req, res) => {
  try {
    const College = require('./models/College');
    const colleges = await College.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: colleges });
  } catch (error) {
    console.error('Error fetching public colleges:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Register chat-related routes
app.use('/api/chats', chatsRouter);
app.use('/api/assignments', assignmentsRouter);

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CampZone Chat Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});


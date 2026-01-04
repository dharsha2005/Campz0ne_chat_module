const presenceService = require('../services/presenceService');
const ChatHandlers = require('./chatHandlers');
const participantService = require('../services/participantService');

/**
 * Connection Handler
 * Manages socket connections, disconnections, and reconnections
 */

class ConnectionHandler {
  constructor(io) {
    this.io = io;
    this.chatHandlers = new ChatHandlers(io);
  }

  /**
   * Handle new socket connection
   * @param {Socket} socket - Socket.IO socket instance
   */
  async handleConnection(socket) {
    console.log(`Client connected: ${socket.id}`);

    // Extract userId from handshake (should be passed from client)
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const initialRoomId = socket.handshake.auth?.roomId || socket.handshake.query?.roomId;
    
    if (!userId) {
      socket.emit('error', { message: 'userId is required for connection' });
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;

    // If client provided an initial roomId in the handshake, ensure participant exists
    if (initialRoomId) {
      try {
        await participantService.ensureUserIsParticipant(userId, initialRoomId);
      } catch (err) {
        console.error('Failed to auto-add participant on connect:', err);
        // Do not disconnect the socket; auto-add is best-effort
      }
    }

    // Mark user as online and broadcast if user just came online
    const justCameOnline = await presenceService.userOnline(socket.id, userId, this.io);
    
    // Broadcast presence update to all users (contacts/room participants will filter)
    if (justCameOnline) {
      this.io.emit('user_presence_update', {
        userId,
        isOnline: true,
        lastSeen: new Date()
      });
    }

    // Initialize chat handlers
    this.chatHandlers.initialize(socket);

    // Handle disconnect
    socket.on('disconnect', async () => {
      await this.handleDisconnect(socket);
    });

    // Handle reconnection
    socket.on('reconnect', async () => {
      await this.handleReconnect(socket);
    });

    // Emit connection success
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      message: 'Successfully connected to chat server'
    });
  }

  /**
   * Handle socket disconnection
   * @param {Socket} socket - Socket.IO socket instance
   */
  async handleDisconnect(socket) {
    console.log(`Client disconnected: ${socket.id}`);
    
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;

    if (userId) {
      // Mark user as offline (if no other connections) and broadcast if user just went offline
      const justWentOffline = await presenceService.userOffline(socket.id, this.io);
      
      // Broadcast presence update if user just went offline
      if (justWentOffline) {
        this.io.emit('user_presence_update', {
          userId,
          isOnline: false,
          lastSeen: new Date()
        });
      }

      // Clear typing status if in a room
      if (roomId) {
        const typingService = require('../services/typingService');
        await typingService.clearTyping(roomId, userId);
        
        // Notify room members
        socket.to(roomId).emit('user_typing', {
          roomId,
          userId,
          isTyping: false
        });

        socket.to(roomId).emit('user_left', {
          roomId,
          userId,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Handle socket reconnection
   * @param {Socket} socket - Socket.IO socket instance
   */
  async handleReconnect(socket) {
    console.log(`Client reconnected: ${socket.id}`);
    
    const userId = socket.data.userId;

    if (userId) {
      // Mark user as online again and broadcast if user just came online
      const justCameOnline = await presenceService.userOnline(socket.id, userId, this.io);
      
      // Broadcast presence update if user just came online
      if (justCameOnline) {
        this.io.emit('user_presence_update', {
          userId,
          isOnline: true,
          lastSeen: new Date()
        });
      }

      // Rejoin previous room if exists
      if (socket.data.roomId) {
        socket.join(socket.data.roomId);
      }

      socket.emit('reconnected', {
        socketId: socket.id,
        userId,
        message: 'Successfully reconnected'
      });
    }
  }
}

module.exports = ConnectionHandler;


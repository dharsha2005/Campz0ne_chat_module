const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const ChatParticipant = require('../models/ChatParticipant');
const User = require('../models/User');
const participantService = require('../services/participantService');
const lamportClockService = require('../services/lamportClock');
const messageQueueService = require('../services/messageQueue');
const readReceiptService = require('../services/readReceiptService');
const typingService = require('../services/typingService');
const presenceService = require('../services/presenceService');
const { v4: uuidv4 } = require('uuid');

/**
 * Chat Socket Handlers
 * Handles all chat-related socket events
 */

class ChatHandlers {
  constructor(io) {
    this.io = io;
  }

  /**
   * Initialize socket handlers
   * @param {Socket} socket - Socket.IO socket instance
   */
  initialize(socket) {
    // Join room
    socket.on('join_room', async (data) => {
      await this.handleJoinRoom(socket, data);
    });

    // Leave room
    socket.on('leave_room', async (data) => {
      await this.handleLeaveRoom(socket, data);
    });

    // Send message
    socket.on('send_message', async (data) => {
      await this.handleSendMessage(socket, data);
    });

    // Typing indicator
    socket.on('typing_start', async (data) => {
      await this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', async (data) => {
      await this.handleTypingStop(socket, data);
    });

    // Read receipt
    socket.on('mark_read', async (data) => {
      await this.handleMarkRead(socket, data);
    });

    // Get messages
    socket.on('get_messages', async (data) => {
      await this.handleGetMessages(socket, data);
    });

    // Get online users
    socket.on('get_online_users', async (data) => {
      await this.handleGetOnlineUsers(socket, data);
    });
  }

  /**
   * Handle join room
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, userId } = data;

      if (!roomId || !userId) {
        socket.emit('error', { message: 'roomId and userId are required' });
        return;
      }

      // Ensure user is a participant (auto-add if missing)
      try {
        await participantService.ensureUserIsParticipant(userId, roomId);
      } catch (err) {
        console.error('Failed to ensure participant on join:', err);
        socket.emit('error', { message: err.message || 'Failed to join room' });
        return;
      }

      // Join socket room
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      // Notify others in the room
      socket.to(roomId).emit('user_joined', {
        roomId,
        userId,
        timestamp: new Date()
      });

      socket.emit('joined_room', {
        roomId,
        message: 'Successfully joined room'
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle leave room
   */
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      const userId = socket.data.userId;

      if (!roomId) {
        socket.emit('error', { message: 'roomId is required' });
        return;
      }

      socket.leave(roomId);

      // Clear typing status
      if (userId) {
        await typingService.clearTyping(roomId, userId);
        socket.to(roomId).emit('typing_stopped', { roomId, userId });
      }

      // Notify others
      socket.to(roomId).emit('user_left', {
        roomId,
        userId,
        timestamp: new Date()
      });

      socket.emit('left_room', { roomId });
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Handle send message (with idempotency and Lamport clock)
   */
  async handleSendMessage(socket, data) {
    try {
      const { 
        roomId, 
        content, 
        lamportTimestamp, 
        idempotencyKey,
        replyTo,
        replySnippet,
        messageType = 'text',
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        thumbnailUrl
      } = data;
      const userId = socket.data.userId;

      if (!roomId || (!content && !fileUrl) || !lamportTimestamp || !idempotencyKey) {
        socket.emit('error', {
          message: 'roomId, content (or fileUrl), lamportTimestamp, and idempotencyKey are required'
        });
        return;
      }

      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Ensure user is a participant (auto-add if missing)
      try {
        await participantService.ensureUserIsParticipant(userId, roomId);
      } catch (err) {
        console.error('Failed to ensure participant on send_message:', err);
        socket.emit('error', { message: err.message || 'User is not a participant of this room' });
        return;
      }

      // Check if socket is in the room (should be after join_room)
      const rooms = Array.from(socket.rooms);
      if (!rooms.includes(roomId)) {
        socket.emit('error', { message: 'Please join the room before sending messages' });
        console.error(`User ${userId} tried to send message to room ${roomId} but is not in the socket room`);
        return;
      }

      // Check idempotency (prevent duplicate messages)
      const existingMessage = await Message.findOne({ idempotencyKey });
      if (existingMessage) {
        // Duplicate message, ignore but acknowledge
        socket.emit('message_sent', {
          messageId: existingMessage._id,
          idempotencyKey,
          status: 'duplicate'
        });
        return;
      }

      // Update server Lamport clock
      const serverTimestamp = lamportClockService.updateClock(roomId, lamportTimestamp);

      // If replying to a message, try to resolve the original message and sender's name
      // Validation rules:
      // - Only allow replies to messages that belong to the same room
      // - If original message is deleted (not found), allow the reply but store a placeholder snippet
      let resolvedReplySnippet = replySnippet;
      let resolvedReplySenderName = undefined;
      if (replyTo) {
        try {
          const original = await Message.findById(replyTo);
          if (original) {
            // Ensure original message is in the same chat room
            if (String(original.roomId) !== String(roomId)) {
              socket.emit('error', { message: 'Cannot reply to a message from a different room' });
              return;
            }

            if (!resolvedReplySnippet) {
              resolvedReplySnippet = original.content ? String(original.content).substring(0, 200) : '';
            }
            // Try to get sender name
            try {
              const origUser = await User.findOne({ userId: original.senderId });
              resolvedReplySenderName = origUser && origUser.name ? origUser.name : original.senderId;
            } catch (e) {
              resolvedReplySenderName = original.senderId;
            }
          } else {
            // Original message not found (deleted): keep the reply, but save a placeholder snippet
            resolvedReplySnippet = resolvedReplySnippet || 'Original message deleted';
            resolvedReplySenderName = undefined;
            // replyTo id will still be stored so clients can show that it referenced a deleted message
          }
        } catch (e) {
          // On unexpected errors during resolution, fail the reply to avoid inconsistent state
          console.error('Error resolving replyTo message:', e);
          socket.emit('error', { message: 'Failed to resolve replied-to message' });
          return;
        }
      }

      // Create message with optional file/image attachment fields
      const message = new Message({
        roomId,
        senderId: userId,
        content: content || '', // Can be empty for file-only messages
        lamportTimestamp: serverTimestamp,
        idempotencyKey,
        status: 'PENDING',
        messageType,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        thumbnailUrl
        , replyTo: replyTo || undefined
        , replySnippet: resolvedReplySnippet || undefined
        , replyToSenderName: resolvedReplySenderName || undefined
      });

      await message.save();

      // Add to message queue
      const queueLog = await messageQueueService.enqueue(message);

      // Process delivery - broadcast to all users in room
      try {
        await messageQueueService.processDelivery(message, async (msg) => {
          // Get sender name for broadcasting
          let senderName = userId;
          try {
            const sender = await User.findOne({ userId: msg.senderId });
            senderName = sender ? sender.name : userId;
          } catch (e) {
            // Use userId as fallback
          }
          
          // Broadcast to all users in room (including sender)
          // Emit a structured `replyTo` object to clients to match WhatsApp-like UI needs
          const structuredReply = msg.replyTo ? {
            messageId: msg.replyTo,
            senderName: msg.replyToSenderName || undefined,
            previewText: msg.replySnippet || undefined
          } : null;

          this.io.to(roomId).emit('new_message', {
            messageId: msg._id,
            roomId: msg.roomId,
            senderId: msg.senderId,
            senderName: senderName,
            content: msg.content,
            lamportTimestamp: msg.lamportTimestamp,
            createdAt: msg.createdAt,
            status: msg.status,
            messageType: msg.messageType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            mimeType: msg.mimeType,
            thumbnailUrl: msg.thumbnailUrl,
            replyTo: structuredReply
          });
        });

        // Acknowledge to sender
        socket.emit('message_sent', {
          messageId: message._id,
          idempotencyKey,
          status: 'sent'
        });
      } catch (deliveryError) {
        console.error('Error in message delivery:', deliveryError);
        socket.emit('error', { message: 'Failed to deliver message' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if it's a duplicate key error (idempotency violation)
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        socket.emit('message_sent', {
          idempotencyKey: data.idempotencyKey,
          status: 'duplicate'
        });
      } else {
        socket.emit('error', { message: 'Failed to send message' });
      }
    }
  }

  /**
   * Handle typing start
   */
  async handleTypingStart(socket, data) {
    try {
      const { roomId } = data;
      const userId = socket.data.userId;

      if (!roomId || !userId) {
        return;
      }

      // Ensure user is a participant (silently ignore if cannot)
      try {
        await participantService.ensureUserIsParticipant(userId, roomId);
      } catch (err) {
        return; // Silently fail for typing events if participant can't be ensured
      }

      // Check if socket is in the room
      const rooms = Array.from(socket.rooms);
      if (!rooms.includes(roomId)) {
        return; // Silently fail if not in room
      }

      await typingService.setTyping(roomId, userId);

      // Notify others in the room (except sender)
      socket.to(roomId).emit('user_typing', {
        roomId,
        userId,
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  }

  /**
   * Handle typing stop
   */
  async handleTypingStop(socket, data) {
    try {
      const { roomId } = data;
      const userId = socket.data.userId;

      if (!roomId || !userId) {
        return;
      }

      // Check if socket is in the room
      const rooms = Array.from(socket.rooms);
      if (!rooms.includes(roomId)) {
        return; // Silently fail if not in room
      }

      await typingService.clearTyping(roomId, userId);

      // Notify others in the room
      socket.to(roomId).emit('user_typing', {
        roomId,
        userId,
        isTyping: false
      });
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  }

  /**
   * Handle mark as read
   */
  async handleMarkRead(socket, data) {
    try {
      const { messageId, roomId } = data;
      const userId = socket.data.userId;

      if (!messageId || !roomId || !userId) {
        socket.emit('error', { message: 'messageId, roomId, and userId are required' });
        return;
      }

      const receipt = await readReceiptService.markAsRead(messageId, roomId, userId);

      // Broadcast read receipt update
      this.io.to(roomId).emit('read_receipt', {
        messageId,
        roomId,
        userId,
        readAt: receipt.readAt
      });

      socket.emit('marked_read', {
        messageId,
        status: 'success'
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  }

  /**
   * Handle get messages
   */
  async handleGetMessages(socket, data) {
    try {
      const { roomId, limit = 50, skip = 0 } = data;
      const userId = socket.data.userId;

      if (!roomId) {
        socket.emit('error', { message: 'roomId is required' });
        return;
      }

      // Ensure user is a participant (auto-add if missing)
      try {
        await participantService.ensureUserIsParticipant(userId, roomId);
      } catch (err) {
        console.error('Failed to ensure participant on get_messages:', err);
        socket.emit('error', { message: err.message || 'User is not a participant of this room' });
        return;
      }

      // Get messages ordered by: lamportTimestamp ASC, createdAt ASC
      const messages = await Message.find({ roomId })
        .sort({ lamportTimestamp: 1, createdAt: 1 })
        .limit(limit)
        .skip(skip);

      // Enrich messages with sender names
      const enrichedMessages = await Promise.all(messages.map(async (msg) => {
        try {
          const sender = await User.findOne({ userId: msg.senderId });
          const base = {
            ...msg.toObject(),
            senderName: sender ? sender.name : msg.senderId
          };

          // Normalize replyTo into a structured object for clients
          base.replyTo = msg.replyTo ? {
            messageId: msg.replyTo,
            senderName: msg.replyToSenderName || undefined,
            previewText: msg.replySnippet || undefined
          } : null;

          return base;
        } catch (e) {
          const base = {
            ...msg.toObject(),
            senderName: msg.senderId
          };

          base.replyTo = msg.replyTo ? {
            messageId: msg.replyTo,
            senderName: msg.replyToSenderName || undefined,
            previewText: msg.replySnippet || undefined
          } : null;

          return base;
        }
      }));

      socket.emit('messages', {
        roomId,
        messages: enrichedMessages,
        count: enrichedMessages.length
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      socket.emit('error', { message: 'Failed to get messages' });
    }
  }

  /**
   * Handle get online users
   */
  async handleGetOnlineUsers(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit('error', { message: 'roomId is required' });
        return;
      }

      // Get all participants in the room
      const participants = await ChatParticipant.find({ roomId });
      const userIds = participants.map(p => p.userId);

      // Get online users
      const onlineUsers = presenceService.getOnlineUsersInRoom(userIds);

      socket.emit('online_users', {
        roomId,
        onlineUsers,
        count: onlineUsers.length
      });
    } catch (error) {
      console.error('Error getting online users:', error);
      socket.emit('error', { message: 'Failed to get online users' });
    }
  }
}

module.exports = ChatHandlers;


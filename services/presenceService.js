const User = require('../models/User');

/**
 * Presence Service
 * Tracks online/offline status of users
 * 
 * Features:
 * - Track online users via socket connections
 * - Maintain lastSeen timestamp
 * - Broadcast presence updates
 */

class PresenceService {
  constructor() {
    // Map of userId -> Set of socketIds (user can have multiple connections)
    this.onlineUsers = new Map();
    // Map of socketId -> userId
    this.socketToUser = new Map();
  }

  /**
   * Mark user as online
   * @param {string} socketId - Socket connection ID
   * @param {string} userId - User ID
   * @param {Object} io - Socket.IO instance (optional, for broadcasting)
   * @returns {boolean} True if user just came online (was offline before)
   */
  async userOnline(socketId, userId, io = null) {
    const wasOnline = this.isUserOnline(userId);
    
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId).add(socketId);
    this.socketToUser.set(socketId, userId);

    // Update database
    await User.findOneAndUpdate(
      { userId },
      { isOnline: true, lastSeen: new Date() },
      { upsert: true }
    );

    // Return true if user just came online (was offline before)
    return !wasOnline;
  }

  /**
   * Mark user as offline
   * @param {string} socketId - Socket connection ID
   * @param {Object} io - Socket.IO instance (optional, for broadcasting)
   * @returns {boolean} True if user just went offline (was online before)
   */
  async userOffline(socketId, io = null) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return false;

    const wasOnline = this.isUserOnline(userId);
    const userSockets = this.onlineUsers.get(userId);
    
    if (userSockets) {
      userSockets.delete(socketId);
      
      // If user has no more active connections, mark as offline
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
        
        // Update database
        await User.findOneAndUpdate(
          { userId },
          { isOnline: false, lastSeen: new Date() }
        );
        
        // Return true if user just went offline
        return wasOnline;
      }
    }

    this.socketToUser.delete(socketId);
    return false;
  }

  /**
   * Check if user is online
   * @param {string} userId - User ID
   * @returns {boolean} True if user is online
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId).size > 0;
  }

  /**
   * Get all online users
   * @returns {Array<string>} Array of user IDs
   */
  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Get online users in a room (requires room participants)
   * @param {Array<string>} userIds - Array of user IDs in the room
   * @returns {Array<string>} Array of online user IDs
   */
  getOnlineUsersInRoom(userIds) {
    return userIds.filter(userId => this.isUserOnline(userId));
  }

  /**
   * Update last seen timestamp
   * @param {string} userId - User ID
   */
  async updateLastSeen(userId) {
    await User.findOneAndUpdate(
      { userId },
      { lastSeen: new Date() },
      { upsert: true }
    );
  }
}

// Singleton instance
const presenceService = new PresenceService();

module.exports = presenceService;


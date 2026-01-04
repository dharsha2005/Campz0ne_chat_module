const TypingStatus = require('../models/TypingStatus');

/**
 * Typing Indicator Service
 * Manages real-time typing status with auto-expiry
 * 
 * Features:
 * - Track typing status per user per room
 * - Auto-expire typing state after inactivity (30 seconds)
 * - Clean up expired entries
 */

class TypingService {
  constructor() {
    this.typingTimeout = 30000; // 30 seconds
    this.activeTimers = new Map(); // Map of `${roomId}:${userId}` -> timer
  }

  /**
   * Set user as typing in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  async setTyping(roomId, userId) {
    try {
      const expiresAt = new Date(Date.now() + this.typingTimeout);

      // Update or create typing status
      await TypingStatus.findOneAndUpdate(
        { roomId, userId },
        { isTyping: true, expiresAt },
        { upsert: true, new: true }
      );

      // Clear existing timer
      const timerKey = `${roomId}:${userId}`;
      if (this.activeTimers.has(timerKey)) {
        clearTimeout(this.activeTimers.get(timerKey));
      }

      // Set new timer to auto-expire
      const timer = setTimeout(async () => {
        await this.clearTyping(roomId, userId);
        this.activeTimers.delete(timerKey);
      }, this.typingTimeout);

      this.activeTimers.set(timerKey, timer);
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }

  /**
   * Clear typing status for a user in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  async clearTyping(roomId, userId) {
    try {
      await TypingStatus.findOneAndUpdate(
        { roomId, userId },
        { isTyping: false }
      );

      // Clear timer
      const timerKey = `${roomId}:${userId}`;
      if (this.activeTimers.has(timerKey)) {
        clearTimeout(this.activeTimers.get(timerKey));
        this.activeTimers.delete(timerKey);
      }
    } catch (error) {
      console.error('Error clearing typing status:', error);
    }
  }

  /**
   * Get all typing users in a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Array>} Array of typing users
   */
  async getTypingUsers(roomId) {
    try {
      const typingStatuses = await TypingStatus.find({
        roomId,
        isTyping: true,
        expiresAt: { $gt: new Date() }
      });

      return typingStatuses.map(status => ({
        userId: status.userId,
        roomId: status.roomId
      }));
    } catch (error) {
      console.error('Error getting typing users:', error);
      return [];
    }
  }

  /**
   * Clean up expired typing statuses (called periodically)
   */
  async cleanupExpired() {
    try {
      await TypingStatus.deleteMany({
        expiresAt: { $lt: new Date() }
      });
    } catch (error) {
      console.error('Error cleaning up expired typing statuses:', error);
    }
  }
}

// Singleton instance
const typingService = new TypingService();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  typingService.cleanupExpired();
}, 5 * 60 * 1000);

module.exports = typingService;


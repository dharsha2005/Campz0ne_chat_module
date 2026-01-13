const MessageReadReceipt = require('../models/MessageReadReceipt');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');
const participantService = require('./participantService');

/**
 * Read Receipt Service
 * Tracks per-user per-message read status
 * 
 * Features:
 * - Store read timestamps
 * - Emit real-time read receipt updates
 * - Mark messages as READ when all participants have read
 */

class ReadReceiptService {
  /**
   * Mark message as read by a user
   * @param {string} messageId - Message ID
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Read receipt document
   */
  async markAsRead(messageId, roomId, userId) {
    try {
      // Check if already read
      let receipt = await MessageReadReceipt.findOne({ messageId, userId });
      
      if (receipt) {
        return receipt; // Already read
      }

      // Create read receipt
      receipt = new MessageReadReceipt({
        messageId,
        roomId,
        userId,
        readAt: new Date()
      });

      await receipt.save();

      // Ensure user is a participant and update participant's lastReadAt
      try {
        await participantService.ensureUserIsParticipant(userId, roomId);
        await ChatParticipant.findOneAndUpdate(
          { roomId, userId },
          { lastReadAt: new Date() }
        );
      } catch (err) {
        // Best-effort: if we cannot ensure participant, still continue without throwing
        console.error('Failed to ensure participant when marking read:', err);
      }

      // Check if all participants have read the message
      await this.updateMessageReadStatus(messageId, roomId);

      return receipt;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple messages as read (for bulk read operations)
   * @param {Array<string>} messageIds - Array of message IDs
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of read receipts
   */
  async markMultipleAsRead(messageIds, roomId, userId) {
    try {
      const receipts = [];
      
      for (const messageId of messageIds) {
        try {
          const receipt = await this.markAsRead(messageId, roomId, userId);
          receipts.push(receipt);
        } catch (error) {
          console.error(`Error marking message ${messageId} as read:`, error);
        }
      }

      return receipts;
    } catch (error) {
      console.error('Error marking multiple messages as read:', error);
      throw error;
    }
  }

  /**
   * Update message status to READ if all participants have read
   * @param {string} messageId - Message ID
   * @param {string} roomId - Room ID
   */
  async updateMessageReadStatus(messageId, roomId) {
    try {
      // Get all participants in the room
      const participants = await ChatParticipant.find({ roomId });
      const participantCount = participants.length;

      // Get all read receipts for this message
      const readReceipts = await MessageReadReceipt.find({ messageId });
      const readCount = readReceipts.length;

      // If all participants have read, mark message as READ
      if (participantCount > 0 && readCount >= participantCount) {
        await Message.findByIdAndUpdate(messageId, { status: 'READ' });
      }
    } catch (error) {
      console.error('Error updating message read status:', error);
    }
  }

  /**
   * Get read receipts for a message
   * @param {string} messageId - Message ID
   * @returns {Promise<Array>} Array of read receipts
   */
  async getReadReceipts(messageId) {
    try {
      return await MessageReadReceipt.find({ messageId }).populate('userId');
    } catch (error) {
      console.error('Error getting read receipts:', error);
      return [];
    }
  }

  /**
   * Get unread message count for a user in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadCount(roomId, userId) {
    try {
      // Get participant's lastReadAt
      const participant = await ChatParticipant.findOne({ roomId, userId });
      if (!participant) return 0;

      // Count messages after lastReadAt
      const unreadCount = await Message.countDocuments({
        roomId,
        senderId: { $ne: userId }, // Don't count own messages
        createdAt: { $gt: participant.lastReadAt }
      });

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

// Singleton instance
const readReceiptService = new ReadReceiptService();

module.exports = readReceiptService;


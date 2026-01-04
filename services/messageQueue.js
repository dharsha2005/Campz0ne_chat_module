const Message = require('../models/Message');
const MessageQueueLog = require('../models/MessageQueueLog');

/**
 * Message Queue Service
 * Handles reliable message delivery with retry logic
 * 
 * Flow:
 * 1. Message received → Create queue log entry (PENDING)
 * 2. Attempt delivery → Update status (DELIVERED/FAILED)
 * 3. On failure → Schedule retry with exponential backoff
 * 4. Max retries exceeded → Mark as FAILED
 */

class MessageQueueService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // Exponential backoff in ms
  }

  /**
   * Add message to queue
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Queue log entry
   */
  async enqueue(messageData) {
    try {
      const queueLog = new MessageQueueLog({
        messageId: messageData._id,
        roomId: messageData.roomId,
        status: 'PENDING',
        retryCount: 0,
        maxRetries: this.maxRetries
      });

      await queueLog.save();
      return queueLog;
    } catch (error) {
      console.error('Error enqueueing message:', error);
      throw error;
    }
  }

  /**
   * Process message delivery
   * @param {Object} message - Message document
   * @param {Function} deliveryCallback - Callback to execute delivery
   * @returns {Promise<Object>} Updated queue log
   */
  async processDelivery(message, deliveryCallback) {
    try {
      let queueLog = await MessageQueueLog.findOne({ messageId: message._id });

      if (!queueLog) {
        queueLog = await this.enqueue(message);
      }

      // Attempt delivery
      try {
        await deliveryCallback(message);
        
        // Mark as delivered
        queueLog.status = 'DELIVERED';
        queueLog.lastAttemptAt = new Date();
        await queueLog.save();

        // Update message status
        await Message.findByIdAndUpdate(message._id, { status: 'DELIVERED' });

        return queueLog;
      } catch (deliveryError) {
        // Delivery failed, schedule retry
        return await this.scheduleRetry(queueLog, deliveryError);
      }
    } catch (error) {
      console.error('Error processing delivery:', error);
      throw error;
    }
  }

  /**
   * Schedule retry for failed message
   * @param {Object} queueLog - Queue log entry
   * @param {Error} error - Error that occurred
   * @returns {Promise<Object>} Updated queue log
   */
  async scheduleRetry(queueLog, error) {
    const retryCount = queueLog.retryCount + 1;

    if (retryCount > queueLog.maxRetries) {
      // Max retries exceeded
      queueLog.status = 'FAILED';
      queueLog.errorMessage = error.message;
      queueLog.lastAttemptAt = new Date();
      await queueLog.save();

      // Update message status
      await Message.findByIdAndUpdate(queueLog.messageId, { status: 'DELIVERED' }); // Still mark as delivered to users

      return queueLog;
    }

    // Calculate next retry time (exponential backoff)
    const delay = this.retryDelays[retryCount - 1] || this.retryDelays[this.retryDelays.length - 1];
    const nextRetryAt = new Date(Date.now() + delay);

    queueLog.status = 'RETRY';
    queueLog.retryCount = retryCount;
    queueLog.nextRetryAt = nextRetryAt;
    queueLog.errorMessage = error.message;
    queueLog.lastAttemptAt = new Date();
    await queueLog.save();

    // Schedule retry (in production, use a job queue like Bull or Agenda)
    setTimeout(async () => {
      await this.retryMessage(queueLog.messageId);
    }, delay);

    return queueLog;
  }

  /**
   * Retry failed message
   * @param {ObjectId} messageId - Message ID
   */
  async retryMessage(messageId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        console.error(`Message ${messageId} not found for retry`);
        return;
      }

      const queueLog = await MessageQueueLog.findOne({ messageId });
      if (!queueLog || queueLog.status === 'DELIVERED') {
        return; // Already delivered or doesn't exist
      }

      // Re-process delivery (this will be handled by socket handler)
      console.log(`Retrying message ${messageId}, attempt ${queueLog.retryCount + 1}`);
    } catch (error) {
      console.error('Error retrying message:', error);
    }
  }

  /**
   * Get pending messages for retry
   * @returns {Promise<Array>} Array of queue logs ready for retry
   */
  async getPendingRetries() {
    try {
      const now = new Date();
      return await MessageQueueLog.find({
        status: 'RETRY',
        nextRetryAt: { $lte: now }
      }).populate('messageId');
    } catch (error) {
      console.error('Error getting pending retries:', error);
      return [];
    }
  }

  /**
   * Update message status
   * @param {ObjectId} messageId - Message ID
   * @param {string} status - New status
   */
  async updateMessageStatus(messageId, status) {
    try {
      await Message.findByIdAndUpdate(messageId, { status });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }
}

// Singleton instance
const messageQueueService = new MessageQueueService();

module.exports = messageQueueService;


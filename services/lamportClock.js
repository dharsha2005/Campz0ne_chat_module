/**
 * Lamport Clock Service
 * Implements Lamport Logical Clocks for message ordering
 * 
 * Rules:
 * - Client increments local clock before sending message
 * - Server receives message with lamportTimestamp
 * - Server updates its clock: max(serverClock, messageLamportTimestamp) + 1
 * - Messages are ordered by: lamportTimestamp ASC, createdAt ASC
 */

class LamportClockService {
  constructor() {
    // Server-side Lamport clock (per room)
    this.roomClocks = new Map();
  }

  /**
   * Get current Lamport timestamp for a room
   * @param {string} roomId - Room identifier
   * @returns {number} Current Lamport timestamp
   */
  getCurrentTimestamp(roomId) {
    if (!this.roomClocks.has(roomId)) {
      this.roomClocks.set(roomId, 0);
    }
    return this.roomClocks.get(roomId);
  }

  /**
   * Update server clock based on received message timestamp
   * @param {string} roomId - Room identifier
   * @param {number} messageTimestamp - Lamport timestamp from message
   * @returns {number} Updated server clock value
   */
  updateClock(roomId, messageTimestamp) {
    const currentClock = this.getCurrentTimestamp(roomId);
    const newClock = Math.max(currentClock, messageTimestamp) + 1;
    this.roomClocks.set(roomId, newClock);
    return newClock;
  }

  /**
   * Increment clock for a room (used when server generates events)
   * @param {string} roomId - Room identifier
   * @returns {number} New timestamp
   */
  incrementClock(roomId) {
    const currentClock = this.getCurrentTimestamp(roomId);
    const newClock = currentClock + 1;
    this.roomClocks.set(roomId, newClock);
    return newClock;
  }

  /**
   * Reset clock for a room (optional, for testing)
   * @param {string} roomId - Room identifier
   */
  resetClock(roomId) {
    this.roomClocks.set(roomId, 0);
  }
}

// Singleton instance
const lamportClockService = new LamportClockService();

module.exports = lamportClockService;


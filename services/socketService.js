/**
 * socketService
 * Small wrapper to store Socket.IO instance and emit to rooms from controllers
 */

let io = null;

function init(socketIo) {
  io = socketIo;
}

function getIo() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function emitToRoom(roomId, event, payload) {
  if (!io) return;
  io.to(roomId).emit(event, payload);
}

module.exports = { init, getIo, emitToRoom };

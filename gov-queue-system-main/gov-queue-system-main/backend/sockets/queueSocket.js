/**
 * REAL-TIME SOCKET.IO ENGINE FOR GOV QUEUE SYSTEM
 * Broadcasts events:
 * - 'queue:updated': triggers client dashboard refresh
 * - 'token:called': announces token & counter over audio/visual alert
 */
function initQueueSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] New client connected: ${socket.id}`);

    socket.on('join:counter', (counterId) => {
      socket.join(`counter_${counterId}`);
      console.log(`[Socket] Client ${socket.id} joined room counter_${counterId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = initQueueSocket;

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a request room for targeted updates
    socket.on('join:request', (requestId) => {
      socket.join(`request:${requestId}`);
      console.log(`Socket ${socket.id} joined request:${requestId}`);
    });

    // Helper sends live GPS location
    socket.on('location:send', async ({ requestId, lat, lng }) => {
      try {
        const WaterRequest = require('../models/WaterRequest');
        await WaterRequest.findByIdAndUpdate(requestId, {
          'transport.currentLocation': { lat, lng }
        });

        // Emit to everyone watching this request
        io.to(`request:${requestId}`).emit('location:update', {
          requestId,
          lat,
          lng
        });

        // Also emit globally for admin view
        io.emit('location:update', { requestId, lat, lng });
      } catch (err) {
        console.log('Location update error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = initSocket;
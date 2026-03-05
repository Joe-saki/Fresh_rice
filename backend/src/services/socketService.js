// src/services/socketService.js
function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Student joins order room to track their order
    socket.on('join_order', ({ orderId }) => {
      socket.join(`order_${orderId}`);
      console.log(`[Socket] Client joined order room: order_${orderId}`);
    });

    // Student joins their personal room
    socket.on('join_student', ({ studentId }) => {
      socket.join(`student_${studentId}`);
    });

    // Vendor joins their room to receive new orders
    socket.on('join_vendor', ({ vendorId }) => {
      socket.join(`vendor_${vendorId}`);
      console.log(`[Socket] Vendor joined room: vendor_${vendorId}`);
    });

    // Rider updates their GPS location
    socket.on('rider_location_update', ({ orderId, lat, lng, riderId }) => {
      // Broadcast to everyone watching this order
      io.to(`order_${orderId}`).emit('rider_location', { lat, lng, riderId });
    });

    // Order status update (from vendor/rider app)
    socket.on('order_status', ({ orderId, status, vendorId }) => {
      io.to(`order_${orderId}`).emit('order_status_update', { orderId, status });
      if (vendorId) {
        io.to(`vendor_${vendorId}`).emit('order_status_update', { orderId, status });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };

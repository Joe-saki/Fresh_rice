const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/riders/available-orders
router.get('/available-orders', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'READY', riderId: null },
      include: { items: { include: { foodItem: true } }, vendor: true, student: { include: { user: { select: { name: true, phone: true } } } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// POST /api/riders/accept/:orderId
router.post('/accept/:orderId', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const rider = await prisma.rider.findUnique({ where: { userId: req.user.id } });
    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { riderId: rider.id, status: 'PICKED_UP' }
    });
    await prisma.rider.update({ where: { id: rider.id }, data: { isAvailable: false } });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// PATCH /api/riders/location
router.patch('/location', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    await prisma.rider.update({ where: { userId: req.user.id }, data: { latitude, longitude } });
    if (orderId) {
      const io = req.app.get('io');
      io.to(`order_${orderId}`).emit('rider_location', { latitude, longitude, timestamp: new Date() });
    }
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// GET /api/riders/me/orders
router.get('/me/orders', authenticate, requireRole('RIDER'), async (req, res) => {
  try {
    const rider = await prisma.rider.findUnique({ where: { userId: req.user.id } });
    const orders = await prisma.order.findMany({
      where: { riderId: rider.id },
      include: { vendor: true, student: { include: { user: { select: { name: true, phone: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rider orders' });
  }
});

module.exports = router;

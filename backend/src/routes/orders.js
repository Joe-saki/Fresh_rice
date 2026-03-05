const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendSMS } = require('../utils/otp');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

// POST /api/orders — place a new order
router.post('/', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { vendorId, items, deliveryAddress, paymentMethod, specialNote } = req.body;
    if (!vendorId || !items || !items.length || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    // Calculate totals
    const foodItems = await prisma.foodItem.findMany({
      where: { id: { in: items.map(i => i.foodItemId) } }
    });

    let subtotal = 0;
    const orderItems = items.map(item => {
      const food = foodItems.find(f => f.id === item.foodItemId);
      if (!food) throw new Error(`Food item ${item.foodItemId} not found`);
      const subtotalItem = food.price * item.quantity;
      subtotal += subtotalItem;
      return { foodItemId: item.foodItemId, quantity: item.quantity, unitPrice: food.price, subtotal: subtotalItem };
    });

    const deliveryFee = 3.0;
    const totalGHS = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        studentId: student.id,
        vendorId,
        status: 'PENDING',
        totalGHS,
        deliveryFee,
        deliveryAddress,
        paymentMethod: paymentMethod || 'MOMO',
        specialNote,
        items: { create: orderItems },
        payment: {
          create: {
            amount: totalGHS,
            method: paymentMethod || 'MOMO',
            status: 'PENDING',
            clientReference: `CB-${uuidv4().slice(0, 8).toUpperCase()}`
          }
        }
      },
      include: { items: { include: { foodItem: true } }, vendor: true, payment: true }
    });

    // Notify vendor via Socket.io
    const io = req.app.get('io');
    io.to(`vendor_${vendorId}`).emit('new_order', order);

    // SMS to student
    await sendSMS(req.user.phone, `Order placed! #${order.id.slice(0,8)} - GHS ${totalGHS}. Pay via MoMo to confirm.`);

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to place order' });
  }
});

// GET /api/orders/:id — get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { foodItem: true } },
        vendor: { include: { user: { select: { phone: true } } } },
        student: { include: { user: { select: { name: true, phone: true } } } },
        rider: { include: { user: { select: { name: true, phone: true } } } },
        payment: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status — update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, riderId } = req.body;
    const validStatuses = ['CONFIRMED','PREPARING','READY','PICKED_UP','DELIVERED','CANCELLED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, ...(riderId && { riderId }) },
      include: { student: { include: { user: true } }, vendor: true }
    });

    const io = req.app.get('io');
    io.to(`order_${order.id}`).emit('order_status_update', { orderId: order.id, status });
    io.to(`vendor_${order.vendorId}`).emit('order_status_update', { orderId: order.id, status });

    // SMS notifications for key status changes
    const messages = {
      CONFIRMED: `Your CampusBite order #${order.id.slice(0,8)} is confirmed! 🎉 Vendor is preparing your food.`,
      PICKED_UP: `Your order is on the way! 🛵 Rider has picked up your food.`,
      DELIVERED: `Your CampusBite order has been delivered! 🍚 Enjoy your meal. Rate us on the app!`,
      CANCELLED: `Your CampusBite order #${order.id.slice(0,8)} was cancelled. Contact support if needed.`
    };
    if (messages[status]) {
      await sendSMS(order.student.user.phone, messages[status]);
    }

    // Award Bites Points on delivery
    if (status === 'DELIVERED') {
      const points = Math.floor(order.totalGHS);
      await prisma.student.update({ where: { id: order.studentId }, data: { bitesPoints: { increment: points } } });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// POST /api/orders/:id/rate — rate an order
router.post('/:id/rate', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { rating, review }
    });

    // Update vendor rating
    const orders = await prisma.order.findMany({ where: { vendorId: order.vendorId, rating: { not: null } }, select: { rating: true } });
    const avgRating = orders.reduce((a, b) => a + b.rating, 0) / orders.length;
    await prisma.vendor.update({ where: { id: order.vendorId }, data: { rating: avgRating, totalRatings: orders.length } });

    res.json({ message: 'Rating submitted', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/orders/vendor/active — vendor's active orders
router.get('/vendor/active', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    const orders = await prisma.order.findMany({
      where: { vendorId: vendor.id, status: { in: ['CONFIRMED','PREPARING','READY'] } },
      include: { items: { include: { foodItem: true } }, student: { include: { user: { select: { name: true, phone: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;

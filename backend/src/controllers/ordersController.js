// src/controllers/ordersController.js
const { PrismaClient } = require('@prisma/client');
const { sendOrderSMS } = require('../services/smsService');
const { sendPushNotification } = require('../services/notificationService');

const prisma = new PrismaClient();

// Generate order number
function generateOrderNumber() {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CB-${yy}${mm}${dd}-${rand}`;
}

// ─── PLACE ORDER ─────────────────────────────────────────
exports.placeOrder = async (req, res, next) => {
  try {
    const { vendorId, items, deliveryAddress, deliveryLat, deliveryLng,
            paymentMethod, customerPhone, notes, promoCode, bitesPointsToUse } = req.body;

    // Get student
    const student = await prisma.student.findFirst({
      where: { userId: req.user.userId },
    });
    if (!student) return res.status(403).json({ error: 'Student profile not found' });

    // Verify vendor
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || !vendor.isOpen) {
      return res.status(400).json({ error: 'Vendor is not available' });
    }

    // Validate & price items
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const foodItem = await prisma.foodItem.findUnique({ where: { id: item.foodItemId } });
      if (!foodItem || !foodItem.isAvailable) {
        return res.status(400).json({ error: `Item "${foodItem?.name || item.foodItemId}" is not available` });
      }
      if (foodItem.vendorId !== vendorId) {
        return res.status(400).json({ error: 'All items must be from the same vendor' });
      }
      const itemTotal = foodItem.price * item.quantity;
      subtotal += itemTotal;
      validatedItems.push({ foodItem, quantity: item.quantity, extras: item.extras });
    }

    // Promo code discount
    let discountGHS = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (promo && promo.isActive && promo.expiresAt > new Date() &&
          promo.currentUsage < promo.maxUsage && subtotal >= promo.minOrderGHS) {
        discountGHS = promo.discountType === 'PERCENTAGE'
          ? subtotal * (promo.discountValue / 100)
          : promo.discountValue;
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { currentUsage: { increment: 1 } },
        });
      }
    }

    // Bites Points redemption (100 points = GHS 1)
    let pointsDiscount = 0;
    if (bitesPointsToUse && bitesPointsToUse > 0) {
      const pointsToUse = Math.min(bitesPointsToUse, student.bitesPoints);
      pointsDiscount = pointsToUse / 100;
      discountGHS += pointsDiscount;
    }

    const deliveryFee = 3; // GHS 3 flat rate
    const totalGHS = Math.max(0, subtotal + deliveryFee - discountGHS);

    // Points earned (1 point per GHS 1 spent)
    const pointsEarned = Math.floor(totalGHS);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        studentId: student.id,
        vendorId,
        status: 'PENDING',
        subtotalGHS: subtotal,
        deliveryFeeGHS: deliveryFee,
        discountGHS,
        totalGHS,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        notes,
        bitesPointsEarned: pointsEarned,
        bitesPointsUsed: bitesPointsToUse || 0,
        items: {
          create: validatedItems.map(({ foodItem, quantity, extras }) => ({
            foodItemId: foodItem.id,
            quantity,
            unitPrice: foodItem.price,
            extras: extras ? JSON.stringify(extras) : null,
          })),
        },
        statusHistory: {
          create: { status: 'PENDING', note: 'Order placed' },
        },
      },
      include: {
        items: { include: { foodItem: true } },
        vendor: { select: { businessName: true, phone: true } },
        student: { include: { user: true } },
      },
    });

    // Notify vendor via socket
    const io = req.app.get('io');
    io.to(`vendor_${vendorId}`).emit('new_order', order);

    // Send SMS to student
    await sendOrderSMS(
      order.student.user.phone,
      `CampusBite: Order ${order.orderNumber} placed! Total: GHS ${order.totalGHS.toFixed(2)}. We'll confirm shortly.`
    ).catch(console.error);

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY ORDERS (student) ──────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
    if (!student) return res.status(403).json({ error: 'Student profile required' });

    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await prisma.order.findMany({
      where: {
        studentId: student.id,
        ...(status && { status }),
      },
      include: {
        items: { include: { foodItem: { select: { name: true, imageUrl: true } } } },
        vendor: { select: { businessName: true, logoUrl: true } },
        rider: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { foodItem: true } },
        vendor: { select: { businessName: true, address: true, phone: true, latitude: true, longitude: true, logoUrl: true } },
        student: { include: { user: { select: { name: true, phone: true } } } },
        rider: { include: { user: { select: { name: true, phone: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE ORDER STATUS ──────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        vendor: { include: { user: true } },
        rider: { include: { user: true } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Permission checks
    const isVendor = req.user.role === 'VENDOR';
    const isRider = req.user.role === 'RIDER';
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAdmin) {
      if (isVendor && !['CONFIRMED', 'PREPARING', 'READY', 'CANCELLED'].includes(status)) {
        return res.status(403).json({ error: 'Vendors can only set: CONFIRMED, PREPARING, READY, CANCELLED' });
      }
      if (isRider && !['PICKED_UP', 'DELIVERED'].includes(status)) {
        return res.status(403).json({ error: 'Riders can only set: PICKED_UP, DELIVERED' });
      }
    }

    const updates = {
      status,
      statusHistory: { create: { status, note: note || null } },
    };

    if (status === 'DELIVERED') {
      updates.deliveredAt = new Date();
      // Award Bites Points
      await prisma.student.update({
        where: { id: order.studentId },
        data: {
          bitesPoints: { increment: order.bitesPointsEarned },
          totalOrders: { increment: 1 },
          totalSpentGHS: { increment: order.totalGHS },
        },
      });
      // Update vendor stats
      await prisma.vendor.update({
        where: { id: order.vendorId },
        data: {
          totalOrders: { increment: 1 },
          totalEarningsGHS: { increment: order.totalGHS * (1 - order.vendor?.commissionRate || 0.12) },
        },
      });
    }

    if (status === 'CONFIRMED') {
      // Deduct bites points if used
      if (order.bitesPointsUsed > 0) {
        await prisma.student.update({
          where: { id: order.studentId },
          data: { bitesPoints: { decrement: order.bitesPointsUsed } },
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updates,
      include: {
        items: { include: { foodItem: true } },
        vendor: true,
        student: { include: { user: true } },
        rider: { include: { user: true } },
      },
    });

    // Realtime socket emit
    const io = req.app.get('io');
    io.to(`order_${id}`).emit('order_status_update', { orderId: id, status, order: updatedOrder });
    io.to(`student_${order.studentId}`).emit('order_status_update', { orderId: id, status });

    // SMS notification to student
    const statusMessages = {
      CONFIRMED: `Your order ${order.orderNumber} is confirmed! We're getting it ready.`,
      PREPARING: `Your order ${order.orderNumber} is being prepared. 🍳`,
      READY: `Your order ${order.orderNumber} is ready! A rider will pick it up soon.`,
      PICKED_UP: `Your order ${order.orderNumber} is on the way! 🏍️`,
      DELIVERED: `Your order ${order.orderNumber} has been delivered! Enjoy your meal 🎉 You earned ${order.bitesPointsEarned} Bites Points!`,
      CANCELLED: `Your order ${order.orderNumber} has been cancelled.`,
    };

    if (statusMessages[status]) {
      await sendOrderSMS(order.student.user.phone, `CampusBite: ${statusMessages[status]}`).catch(console.error);
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// ─── CANCEL ORDER ─────────────────────────────────────────
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (['DELIVERED', 'PICKED_UP'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order in this state' });
    }

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        statusHistory: { create: { status: 'CANCELLED', note: reason || 'Cancelled by user' } },
      },
    });

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    next(error);
  }
};

// ─── REVIEW ORDER ─────────────────────────────────────────
exports.reviewOrder = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const student = await prisma.student.findFirst({ where: { userId: req.user.userId } });
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order || order.studentId !== student.id) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Can only review delivered orders' });
    }

    const review = await prisma.review.create({
      data: { studentId: student.id, vendorId: order.vendorId, orderId: order.id, rating, comment },
    });

    // Update vendor rating
    const reviews = await prisma.review.findMany({ where: { vendorId: order.vendorId } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await prisma.vendor.update({
      where: { id: order.vendorId },
      data: { rating: avgRating, totalReviews: reviews.length },
    });

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// ─── VENDOR ORDERS ────────────────────────────────────────
exports.getVendorActiveOrders = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(403).json({ error: 'Vendor profile required' });

    const orders = await prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        items: { include: { foodItem: true } },
        student: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

exports.getVendorOrders = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(403).json({ error: 'Vendor profile required' });

    const { page = 1, limit = 30 } = req.query;

    const orders = await prisma.order.findMany({
      where: { vendorId: vendor.id },
      include: {
        items: { include: { foodItem: { select: { name: true } } } },
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// ─── RIDER ORDERS ─────────────────────────────────────────
exports.getAvailableForRider = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'READY', riderId: null },
      include: {
        vendor: { select: { businessName: true, address: true, latitude: true, longitude: true } },
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

exports.assignRider = async (req, res, next) => {
  try {
    const rider = await prisma.rider.findFirst({ where: { userId: req.user.userId } });
    if (!rider) return res.status(403).json({ error: 'Rider profile required' });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.status !== 'READY' || order.riderId) {
      return res.status(400).json({ error: 'Order not available for pickup' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        riderId: rider.id,
        status: 'PICKED_UP',
        statusHistory: { create: { status: 'PICKED_UP', note: `Rider ${rider.id} assigned` } },
      },
      include: {
        vendor: true,
        student: { include: { user: true } },
      },
    });

    // Notify student
    const io = req.app.get('io');
    io.to(`order_${order.id}`).emit('order_status_update', { orderId: order.id, status: 'PICKED_UP' });

    res.json({ success: true, order: updated });
  } catch (error) {
    next(error);
  }
};

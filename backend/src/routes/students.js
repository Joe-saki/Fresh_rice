const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/students/me/orders
router.get('/me/orders', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    const orders = await prisma.order.findMany({
      where: { studentId: student.id },
      include: { items: { include: { foodItem: true } }, vendor: true, payment: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/students/me/rewards
router.get('/me/rewards', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    const nextRewardAt = 100;
    const progress = student.bitesPoints % nextRewardAt;
    res.json({
      bitesPoints: student.bitesPoints,
      progress,
      nextRewardAt,
      availableRewards: Math.floor(student.bitesPoints / nextRewardAt),
      referralCode: student.referralCode
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// POST /api/students/me/redeem
router.post('/me/redeem', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (student.bitesPoints < 100) return res.status(400).json({ error: 'Need 100 Bites Points to redeem' });

    await prisma.student.update({ where: { userId: req.user.id }, data: { bitesPoints: { decrement: 100 } } });
    res.json({ message: 'Redeemed! GHS 5 discount applied to your next order.', discount: 5 });
  } catch (err) {
    res.status(500).json({ error: 'Redemption failed' });
  }
});

module.exports = router;

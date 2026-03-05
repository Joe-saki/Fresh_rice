// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [users, vendors, orders, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count({ where: { isVerified: true } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { totalGHS: true } }),
    ]);
    res.json({ users, vendors, deliveredOrders: orders, totalRevenueGHS: revenue._sum.totalGHS || 0 });
  } catch (e) { next(e); }
});

// PATCH /api/admin/vendors/:id/verify
router.patch('/vendors/:id/verify', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isVerified: true },
    });
    res.json({ vendor });
  } catch (e) { next(e); }
});

// GET /api/admin/vendors/pending
router.get('/vendors/pending', async (req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({ where: { isVerified: false }, include: { user: true } });
    res.json({ vendors });
  } catch (e) { next(e); }
});

module.exports = router;

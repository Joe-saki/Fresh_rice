const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/vendors — list all active vendors
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const vendors = await prisma.vendor.findMany({
      where: {
        isVerified: true,
        user: { isActive: true },
        ...(search && { businessName: { contains: search, mode: 'insensitive' } }),
        ...(category && { foodItems: { some: { category } } }),
      },
      include: {
        user: { select: { name: true, phone: true } },
        foodItems: { where: { isAvailable: true }, take: 4 }
      },
      orderBy: { rating: 'desc' }
    });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET /api/vendors/:id — single vendor
router.get('/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, phone: true } },
        foodItems: { where: { isAvailable: true }, orderBy: { category: 'asc' } }
      }
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// GET /api/vendors/:id/menu
router.get('/:id/menu', async (req, res) => {
  try {
    const items = await prisma.foodItem.findMany({
      where: { vendorId: req.params.id, isAvailable: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    // Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
    res.json({ vendorId: req.params.id, menu: grouped });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// PATCH /api/vendors/:id/toggle — toggle vendor open/closed
router.patch('/:id/toggle', authenticate, requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    const updated = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isOpen: !vendor.isOpen }
    });
    res.json({ isOpen: updated.isOpen });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor status' });
  }
});

// GET /api/vendors/me/dashboard — vendor dashboard stats
router.get('/me/dashboard', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    const today = new Date(); today.setHours(0,0,0,0);
    const [totalOrders, todayOrders, pendingOrders, revenue] = await Promise.all([
      prisma.order.count({ where: { vendorId: vendor.id } }),
      prisma.order.count({ where: { vendorId: vendor.id, createdAt: { gte: today } } }),
      prisma.order.count({ where: { vendorId: vendor.id, status: { in: ['PENDING','CONFIRMED','PREPARING'] } } }),
      prisma.order.aggregate({ where: { vendorId: vendor.id, status: 'DELIVERED' }, _sum: { totalGHS: true } })
    ]);

    res.json({ totalOrders, todayOrders, pendingOrders, totalRevenue: revenue._sum.totalGHS || 0, vendor });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;

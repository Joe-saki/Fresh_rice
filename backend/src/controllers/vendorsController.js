// src/controllers/vendorsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── LIST VENDORS ─────────────────────────────────────────
exports.listVendors = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const vendors = await prisma.vendor.findMany({
      where: {
        isVerified: true,
        ...(category && { category }),
        ...(search && {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        businessName: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        category: true,
        address: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openingTime: true,
        closingTime: true,
        rating: true,
        totalReviews: true,
        totalOrders: true,
      },
      orderBy: [{ isOpen: 'desc' }, { rating: 'desc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({ vendors });
  } catch (error) {
    next(error);
  }
};

// ─── GET VENDOR ───────────────────────────────────────────
exports.getVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        menuItems: {
          where: { isAvailable: true },
          include: { extras: true },
          orderBy: [{ isFeatured: 'desc' }, { totalOrders: 'desc' }],
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { student: { include: { user: { select: { name: true } } } } },
        },
      },
    });

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ vendor });
  } catch (error) {
    next(error);
  }
};

// ─── GET VENDOR MENU ──────────────────────────────────────
exports.getVendorMenu = async (req, res, next) => {
  try {
    const items = await prisma.foodItem.findMany({
      where: { vendorId: req.params.id, isAvailable: true },
      include: { extras: true },
      orderBy: [{ isFeatured: 'desc' }, { category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ menu: grouped, items });
  } catch (error) {
    next(error);
  }
};

// ─── REGISTER VENDOR ──────────────────────────────────────
exports.registerVendor = async (req, res, next) => {
  try {
    const { businessName, description, address, phone, momoNumber, momoNetwork, category, openingTime, closingTime } = req.body;

    const existingVendor = await prisma.vendor.findFirst({ where: { userId: req.user.userId } });
    if (existingVendor) return res.status(409).json({ error: 'Vendor profile already exists' });

    const vendor = await prisma.vendor.create({
      data: {
        userId: req.user.userId,
        businessName,
        description,
        address,
        phone,
        momoNumber,
        momoNetwork,
        category: category || 'General',
        openingTime: openingTime || '07:00',
        closingTime: closingTime || '21:00',
      },
    });

    // Update user role to VENDOR
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { role: 'VENDOR' },
    });

    res.status(201).json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE VENDOR ────────────────────────────────────────
exports.updateVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const allowed = ['businessName', 'description', 'logoUrl', 'coverImageUrl', 'address', 'openingTime', 'closingTime', 'category'];
    const data = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) data[key] = req.body[key]; });

    const updated = await prisma.vendor.update({ where: { id: vendor.id }, data });
    res.json({ vendor: updated });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE OPEN ──────────────────────────────────────────
exports.toggleOpen = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: { isOpen: !vendor.isOpen },
    });

    res.json({ isOpen: updated.isOpen });
  } catch (error) {
    next(error);
  }
};

// ─── VENDOR STATS ─────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, totalOrders, revenue] = await Promise.all([
      prisma.order.count({
        where: { vendorId: vendor.id, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      }),
      prisma.order.count({ where: { vendorId: vendor.id, status: 'DELIVERED' } }),
      prisma.order.aggregate({
        where: { vendorId: vendor.id, status: 'DELIVERED' },
        _sum: { totalGHS: true },
      }),
    ]);

    res.json({
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        rating: vendor.rating,
        totalReviews: vendor.totalReviews,
      },
      stats: {
        todayOrders,
        totalOrders,
        totalRevenueGHS: revenue._sum.totalGHS || 0,
        vendorEarningsGHS: (revenue._sum.totalGHS || 0) * (1 - vendor.commissionRate),
      },
    });
  } catch (error) {
    next(error);
  }
};

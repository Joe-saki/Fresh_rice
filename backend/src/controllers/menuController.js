// src/controllers/menuController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getVendorOrFail(userId, res) {
  const vendor = await prisma.vendor.findFirst({ where: { userId } });
  if (!vendor) { res.status(403).json({ error: 'Vendor profile required' }); return null; }
  return vendor;
}

exports.addItem = async (req, res, next) => {
  try {
    const vendor = await getVendorOrFail(req.user.userId, res);
    if (!vendor) return;

    const { name, description, price, imageUrl, category, preparationTime } = req.body;
    const item = await prisma.foodItem.create({
      data: { vendorId: vendor.id, name, description, price: parseFloat(price), imageUrl, category, preparationTime: parseInt(preparationTime) || 15 },
    });
    res.status(201).json({ item });
  } catch (error) { next(error); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const vendor = await getVendorOrFail(req.user.userId, res);
    if (!vendor) return;

    const item = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.vendorId !== vendor.id) return res.status(403).json({ error: 'Not your item' });

    const allowed = ['name', 'description', 'price', 'imageUrl', 'category', 'preparationTime', 'isFeatured'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const updated = await prisma.foodItem.update({ where: { id: req.params.id }, data });
    res.json({ item: updated });
  } catch (error) { next(error); }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const vendor = await getVendorOrFail(req.user.userId, res);
    if (!vendor) return;

    const item = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.vendorId !== vendor.id) return res.status(403).json({ error: 'Not your item' });

    await prisma.foodItem.update({ where: { id: req.params.id }, data: { isAvailable: false } });
    res.json({ success: true });
  } catch (error) { next(error); }
};

exports.toggleItem = async (req, res, next) => {
  try {
    const vendor = await getVendorOrFail(req.user.userId, res);
    if (!vendor) return;

    const item = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.vendorId !== vendor.id) return res.status(403).json({ error: 'Not your item' });

    const updated = await prisma.foodItem.update({
      where: { id: req.params.id },
      data: { isAvailable: !item.isAvailable },
    });
    res.json({ isAvailable: updated.isAvailable });
  } catch (error) { next(error); }
};

exports.addExtra = async (req, res, next) => {
  try {
    const vendor = await getVendorOrFail(req.user.userId, res);
    if (!vendor) return;

    const item = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.vendorId !== vendor.id) return res.status(403).json({ error: 'Not your item' });

    const { name, price } = req.body;
    const extra = await prisma.foodExtra.create({
      data: { foodItemId: item.id, name, price: parseFloat(price) },
    });
    res.status(201).json({ extra });
  } catch (error) { next(error); }
};

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/menu/categories
router.get('/categories', async (req, res) => {
  res.json(['Rice Dishes','Soups & Stews','Swallows','Proteins','Snacks','Drinks','Breakfast','Combos']);
});

// POST /api/menu — add food item (vendor only)
router.post('/', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    const { name, description, price, category, imageUrl } = req.body;
    const item = await prisma.foodItem.create({
      data: { vendorId: vendor.id, name, description, price, category, imageUrl }
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PATCH /api/menu/:id — edit food item
router.patch('/:id', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;
    const item = await prisma.foodItem.update({
      where: { id: req.params.id },
      data: { name, description, price, category, imageUrl, isAvailable }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', authenticate, requireRole('VENDOR'), async (req, res) => {
  try {
    await prisma.foodItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;

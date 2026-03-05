const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP } = require('../utils/otp');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const phoneRegex = /^\+233[0-9]{9}$/;
    if (!phoneRegex.test(phone)) return res.status(400).json({ error: 'Invalid Ghana phone number (e.g. +233XXXXXXXXX)' });

    await sendOTP(phone);
    res.json({ message: 'OTP sent successfully', phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code, name, role } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and OTP required' });

    const valid = await verifyOTP(phone, code);
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      if (!name) return res.status(400).json({ error: 'Name required for new users' });

      user = await prisma.user.create({
        data: {
          phone,
          name,
          role: role || 'STUDENT',
          ...((!role || role === 'STUDENT') && { student: { create: {} } }),
          ...(role === 'RIDER' && { rider: { create: {} } }),
        },
        include: { student: true, vendor: true, rider: true }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { phone },
        include: { student: true, vendor: true, rider: true }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, student: user.student, vendor: user.vendor, rider: user.rider } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { student: true, vendor: true, rider: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;

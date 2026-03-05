// src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateOTP, sendSMSOTP } = require('../services/smsService');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Generate a random referral code
function generateReferralCode(name) {
  const clean = name.replace(/\s/g, '').toUpperCase().slice(0, 5);
  return clean + Math.floor(1000 + Math.random() * 9000);
}

// ─── SEND OTP ────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone } = req.body;

    // Generate 6-digit OTP
    const code = process.env.NODE_ENV === 'production'
      ? generateOTP()
      : (process.env.OTP_TEST_CODE || '123456');

    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);

    // Invalidate old OTPs for this phone
    await prisma.oTP.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    // Save new OTP
    await prisma.oTP.create({
      data: { phone, code, expiresAt },
    });

    // Send SMS in production
    if (process.env.NODE_ENV === 'production') {
      await sendSMSOTP(phone, code);
    } else {
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Only expose in dev
      ...(process.env.NODE_ENV !== 'production' && { otp: code }),
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY OTP ──────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone, code, name, role = 'STUDENT' } = req.body;

    // Find valid OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      if (!name) {
        return res.status(400).json({ error: 'Name is required for new users' });
      }

      isNewUser = true;
      const validRole = ['STUDENT', 'VENDOR', 'RIDER'].includes(role) ? role : 'STUDENT';

      user = await prisma.user.create({
        data: {
          phone,
          name,
          role: validRole,
        },
      });

      // Create role-specific profile
      if (validRole === 'STUDENT') {
        await prisma.student.create({
          data: {
            userId: user.id,
            referralCode: generateReferralCode(name),
          },
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Fetch full profile
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        student: { include: { addresses: true } },
        vendor: true,
        rider: true,
      },
    });

    res.json({
      success: true,
      isNewUser,
      token,
      user: fullUser,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET ME ──────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        student: { include: { addresses: true } },
        vendor: { include: { menuItems: { where: { isAvailable: true }, take: 10 } } },
        rider: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newToken = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token: newToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
};

// ─── UPDATE FCM TOKEN ────────────────────────────────────
exports.updateFCMToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { fcmToken },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ──────────────────────────────────────────────
exports.logout = async (req, res) => {
  // Clear FCM token on logout
  await prisma.user.update({
    where: { id: req.user.userId },
    data: { fcmToken: null },
  }).catch(() => {});
  res.json({ success: true, message: 'Logged out successfully' });
};

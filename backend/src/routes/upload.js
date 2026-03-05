// src/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// POST /api/upload/image
router.post('/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // In production: upload to Cloudinary
    // For now, return a placeholder response
    // const cloudinary = require('../services/cloudinaryService');
    // const result = await cloudinary.upload(req.file.buffer);
    // res.json({ url: result.secure_url });

    // Placeholder for development
    res.json({
      url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(req.file.originalname)}`,
      message: 'In production, integrate Cloudinary for real image hosting',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

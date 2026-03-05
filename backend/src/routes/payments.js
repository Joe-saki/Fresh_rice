const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { sendSMS } = require('../utils/otp');
const prisma = new PrismaClient();

// POST /api/payments/momo — initiate MoMo payment via Hubtel
router.post('/momo', authenticate, async (req, res) => {
  try {
    const { orderId, momoNumber, network } = req.body;
    if (!orderId || !momoNumber) return res.status(400).json({ error: 'orderId and momoNumber required' });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment?.status === 'SUCCESS') return res.status(400).json({ error: 'Order already paid' });

    const clientReference = order.payment?.clientReference || `CB-${Date.now()}`;

    // Hubtel API call
    if (process.env.HUBTEL_CLIENT_ID && process.env.NODE_ENV === 'production') {
      const hubtelResponse = await axios.post(
        `https://api.hubtel.com/v1/merchantaccount/merchants/${process.env.HUBTEL_MERCHANT_ID}/receive/mobilemoney`,
        {
          CustomerMsisdn: momoNumber,
          Amount: order.totalGHS,
          Description: `CampusBite Order #${orderId.slice(0,8)}`,
          ClientReference: clientReference,
          CallbackUrl: process.env.HUBTEL_CALLBACK_URL
        },
        {
          auth: { username: process.env.HUBTEL_CLIENT_ID, password: process.env.HUBTEL_CLIENT_SECRET }
        }
      );

      await prisma.payment.update({
        where: { orderId },
        data: { momoNumber, hubtelReference: hubtelResponse.data?.ResponseCode, status: 'PENDING' }
      });

      res.json({ message: 'MoMo prompt sent to your phone. Enter your PIN to confirm.', reference: clientReference });
    } else {
      // DEV MODE — simulate payment success
      console.log(`💸 DEV: Simulating MoMo payment for order ${orderId} - GHS ${order.totalGHS}`);
      await prisma.payment.update({ where: { orderId }, data: { momoNumber, status: 'SUCCESS' } });
      await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });

      const io = req.app.get('io');
      io.to(`order_${orderId}`).emit('order_status_update', { orderId, status: 'CONFIRMED' });

      res.json({ message: 'DEV MODE: Payment simulated as successful', status: 'SUCCESS' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// POST /api/payments/callback — Hubtel webhook
router.post('/callback', async (req, res) => {
  try {
    const { ClientReference, Status, TransactionId } = req.body;
    console.log('Hubtel callback:', req.body);

    const payment = await prisma.payment.findUnique({ where: { clientReference: ClientReference } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const paymentStatus = Status === 'Success' ? 'SUCCESS' : 'FAILED';

    await prisma.payment.update({
      where: { clientReference: ClientReference },
      data: { status: paymentStatus, hubtelReference: TransactionId }
    });

    if (paymentStatus === 'SUCCESS') {
      const order = await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
        include: { student: { include: { user: true } }, vendor: true }
      });

      const io = req.app.get('io');
      io.to(`order_${order.id}`).emit('order_status_update', { orderId: order.id, status: 'CONFIRMED' });
      io.to(`vendor_${order.vendorId}`).emit('new_confirmed_order', order);

      await sendSMS(order.student.user.phone, `Payment confirmed! Your CampusBite order #${order.id.slice(0,8)} is being prepared. 🍚`);
    }

    res.json({ message: 'Callback processed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// GET /api/payments/:orderId/status
router.get('/:orderId/status', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { orderId: req.params.orderId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

module.exports = router;

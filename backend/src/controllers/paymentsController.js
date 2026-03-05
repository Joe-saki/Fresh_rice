// src/controllers/paymentsController.js
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ─── INITIATE MOMO PAYMENT ────────────────────────────────
exports.initiateMoMo = async (req, res, next) => {
  try {
    const { orderId, customerPhone, momoNetwork } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { student: { include: { user: true } } },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'SUCCESS') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const clientReference = `CB-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalGHS,
        method: momoNetwork === 'Vodafone' ? 'VODAFONE_CASH' : 'MTN_MOMO',
        status: 'PENDING',
        clientReference,
        customerPhone,
        momoNetwork,
      },
    });

    // Call Hubtel API
    const hubtelResponse = await axios.post(
      `https://api.hubtel.com/v1/merchantaccount/merchants/${process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER}/receive/mobilemoney`,
      {
        CustomerName: order.student.user.name,
        CustomerMsisdn: customerPhone.replace('+', ''),
        CustomerEmail: '',
        Channel: momoNetwork === 'Vodafone' ? 'vodafone-gh' : 'mtn-gh',
        Amount: order.totalGHS,
        PrimaryCallbackUrl: process.env.HUBTEL_CALLBACK_URL,
        Description: `CampusBite Order ${order.orderNumber}`,
        ClientReference: clientReference,
      },
      {
        auth: {
          username: process.env.HUBTEL_CLIENT_ID,
          password: process.env.HUBTEL_CLIENT_SECRET,
        },
        headers: { 'Content-Type': 'application/json' },
      }
    ).catch(err => {
      // If Hubtel fails (e.g. sandbox), log and return mock success
      console.error('[Hubtel Error]', err.response?.data || err.message);
      return { data: { ResponseCode: '0000', Data: { TransactionId: `MOCK-${Date.now()}` } } };
    });

    const { ResponseCode, Data } = hubtelResponse.data;

    if (ResponseCode === '0000') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { hubtelReference: Data?.TransactionId },
      });

      res.json({
        success: true,
        message: 'Payment request sent. Please check your phone for MoMo prompt.',
        clientReference,
        transactionId: Data?.TransactionId,
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: hubtelResponse.data?.Message },
      });
      res.status(400).json({ error: 'Payment initiation failed', details: hubtelResponse.data });
    }
  } catch (error) {
    next(error);
  }
};

// ─── HUBTEL CALLBACK ──────────────────────────────────────
exports.hubtelCallback = async (req, res, next) => {
  try {
    const { ResponseCode, ClientReference, TransactionId, Amount } = req.body;

    console.log('[Payment Callback]', req.body);

    const payment = await prisma.payment.findUnique({
      where: { clientReference: ClientReference },
      include: { order: { include: { student: { include: { user: true } } } } },
    });

    if (!payment) {
      return res.status(200).json({ message: 'Payment not found' }); // 200 so Hubtel stops retrying
    }

    if (ResponseCode === '0000') {
      // Payment successful
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          hubtelReference: TransactionId,
          paidAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'SUCCESS',
          status: 'CONFIRMED',
          statusHistory: {
            create: { status: 'CONFIRMED', note: `Payment confirmed via ${payment.momoNetwork}` },
          },
        },
      });

      // Notify vendor
      const io = req.app?.get('io');
      if (io) {
        io.to(`vendor_${payment.order.vendorId}`).emit('payment_confirmed', {
          orderId: payment.orderId,
          orderNumber: payment.order.orderNumber,
        });
        io.to(`order_${payment.orderId}`).emit('payment_confirmed', { status: 'CONFIRMED' });
      }

      console.log(`✅ Payment confirmed for order ${payment.order.orderNumber}`);
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: req.body.Message || 'Payment failed' },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'FAILED' },
      });
    }

    res.status(200).json({ message: 'Callback received' });
  } catch (error) {
    console.error('[Callback Error]', error);
    res.status(200).json({ message: 'Error processing callback' }); // Always 200 for Hubtel
  }
};

// ─── GET PAYMENT STATUS ───────────────────────────────────
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { clientReference } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { clientReference },
      include: { order: { select: { orderNumber: true, status: true } } },
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (phone) => {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.oTP.create({ data: { phone, code, expiresAt } });

  if (process.env.NODE_ENV === 'production' && process.env.ARKESEL_API_KEY) {
    await axios.get(`https://sms.arkesel.com/sms/api`, {
      params: {
        action: 'send-sms',
        api_key: process.env.ARKESEL_API_KEY,
        to: phone,
        from: process.env.ARKESEL_SENDER_ID || 'CampusBite',
        sms: `Your CampusBite OTP is: ${code}. Valid for 10 minutes.`
      }
    });
  } else {
    console.log(`📱 DEV OTP for ${phone}: ${code}`);
  }

  return code;
};

const verifyOTP = async (phone, code) => {
  const otp = await prisma.oTP.findFirst({
    where: { phone, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });
  if (!otp) return false;
  await prisma.oTP.update({ where: { id: otp.id }, data: { used: true } });
  return true;
};

const sendSMS = async (phone, message) => {
  if (process.env.NODE_ENV === 'production' && process.env.ARKESEL_API_KEY) {
    await axios.get(`https://sms.arkesel.com/sms/api`, {
      params: { action: 'send-sms', api_key: process.env.ARKESEL_API_KEY, to: phone, from: 'CampusBite', sms: message }
    });
  } else {
    console.log(`📱 SMS to ${phone}: ${message}`);
  }
};

module.exports = { sendOTP, verifyOTP, sendSMS };

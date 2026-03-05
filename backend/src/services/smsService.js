// src/services/smsService.js
const axios = require('axios');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Arkesel
async function sendSMS(to, message, senderId = 'CampusBite') {
  const phone = to.startsWith('+') ? to.replace('+', '') : to;

  try {
    const response = await axios.get('https://sms.arkesel.com/sms/api', {
      params: {
        action: 'send-sms',
        api_key: process.env.ARKESEL_API_KEY,
        to: phone,
        from: senderId,
        sms: message,
      },
    });
    console.log(`[SMS] Sent to ${to}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[SMS Error] Failed to send to ${to}:`, error.message);
    // Don't throw — SMS failure shouldn't break the order flow
    return null;
  }
}

async function sendSMSOTP(phone, otp) {
  return sendSMS(phone, `Your CampusBite OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. Do not share.`);
}

async function sendOrderSMS(phone, message) {
  return sendSMS(phone, message);
}

module.exports = { generateOTP, sendSMS, sendSMSOTP, sendOrderSMS };

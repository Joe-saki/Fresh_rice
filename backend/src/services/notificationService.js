// src/services/notificationService.js
let admin;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
} catch (e) {
  console.warn('[Firebase] Not configured:', e.message);
}

async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!admin || !fcmToken) return null;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('[Push] Failed:', error.message);
    return null;
  }
}

module.exports = { sendPushNotification };

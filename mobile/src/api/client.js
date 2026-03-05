// src/api/client.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('cb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Handle errors
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('cb_token');
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, code, name, role) =>
  api.post('/auth/verify-otp', { phone, code, name, role });
export const getMe = () => api.get('/auth/me');
export const updateFCMToken = (fcmToken) => api.patch('/auth/fcm-token', { fcmToken });

// Vendors
export const getVendors = (params) => api.get('/vendors', { params });
export const getVendor = (id) => api.get(`/vendors/${id}`);
export const getVendorMenu = (id) => api.get(`/vendors/${id}/menu`);

// Orders
export const placeOrder = (data) => api.post('/orders', data);
export const getMyOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id, reason) => api.post(`/orders/${id}/cancel`, { reason });
export const reviewOrder = (id, data) => api.post(`/orders/${id}/review`, data);

// Payments
export const initiateMoMo = (data) => api.post('/payments/momo', data);
export const getPaymentStatus = (ref) => api.get(`/payments/status/${ref}`);

// Students
export const getMyProfile = () => api.get('/students/me');
export const getMyRewards = () => api.get('/students/me/rewards');
export const addAddress = (data) => api.post('/students/address', data);

// Riders
export const getRiderMe = () => api.get('/riders/me');
export const updateRiderLocation = (data) => api.patch('/riders/me/location', data);
export const toggleRiderAvailability = (isAvailable) => api.patch('/riders/me/availability', { isAvailable });
export const getAvailableOrders = () => api.get('/orders/rider/available');
export const assignRider = (orderId) => api.post(`/orders/${orderId}/assign-rider`);
export const updateOrderStatus = (orderId, status) => api.patch(`/orders/${orderId}/status`, { status });

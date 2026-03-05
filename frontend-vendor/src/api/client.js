// src/api/client.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cb_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, code, name) => api.post('/auth/verify-otp', { phone, code, name, role: 'VENDOR' });
export const getMe = () => api.get('/auth/me');

// Vendor
export const getVendorStats = () => api.get('/vendors/me/stats');
export const updateVendor = (data) => api.patch('/vendors/me', data);
export const toggleVendorOpen = () => api.patch('/vendors/me/toggle');

// Orders
export const getActiveOrders = () => api.get('/orders/vendor/active');
export const getVendorOrders = (page = 1) => api.get(`/orders/vendor/all?page=${page}`);
export const updateOrderStatus = (orderId, status, note) =>
  api.patch(`/orders/${orderId}/status`, { status, note });

// Menu
export const addMenuItem = (data) => api.post('/menu', data);
export const updateMenuItem = (id, data) => api.patch(`/menu/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);
export const toggleMenuItem = (id) => api.patch(`/menu/${id}/toggle`);
export const getVendorMenu = (vendorId) => api.get(`/vendors/${vendorId}/menu`);

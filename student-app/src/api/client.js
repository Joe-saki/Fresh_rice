import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) AsyncStorage.removeItem('token');
    return Promise.reject(err);
  }
);

export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code, name, role) => api.post('/auth/verify-otp', { phone, code, name, role }),
  getMe: () => api.get('/auth/me'),
};

export const vendorAPI = {
  list: (params) => api.get('/vendors', { params }),
  get: (id) => api.get(`/vendors/${id}`),
  getMenu: (id) => api.get(`/vendors/${id}/menu`),
};

export const orderAPI = {
  place: (data) => api.post('/orders', data),
  get: (id) => api.get(`/orders/${id}`),
  myOrders: () => api.get('/students/me/orders'),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  rate: (id, rating, review) => api.post(`/orders/${id}/rate`, { rating, review }),
};

export const paymentAPI = {
  initiateMoMo: (orderId, momoNumber, network) => api.post('/payments/momo', { orderId, momoNumber, network }),
  checkStatus: (orderId) => api.get(`/payments/${orderId}/status`),
};

export const studentAPI = {
  rewards: () => api.get('/students/me/rewards'),
  redeem: () => api.post('/students/me/redeem'),
};

export default api;

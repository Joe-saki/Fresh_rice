import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api', timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('rider_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const riderAPI = {
  availableOrders: () => api.get('/riders/available-orders'),
  acceptOrder: (orderId) => api.post(`/riders/accept/${orderId}`),
  updateLocation: (data) => api.patch('/riders/location', data),
  myOrders: () => api.get('/riders/me/orders'),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code, name) => api.post('/auth/verify-otp', { phone, code, name, role: 'RIDER' }),
};

export default api;

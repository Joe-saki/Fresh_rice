// src/store/authStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  vendor: null,
  token: localStorage.getItem('cb_token') || null,
  isAuthenticated: !!localStorage.getItem('cb_token'),

  login: (token, user) => {
    localStorage.setItem('cb_token', token);
    set({ token, user, vendor: user.vendor, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('cb_token');
    set({ token: null, user: null, vendor: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, vendor: user?.vendor }),

  updateVendor: (vendorData) => set((state) => ({
    vendor: { ...state.vendor, ...vendorData },
  })),
}));

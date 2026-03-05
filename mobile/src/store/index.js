// src/store/index.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// ─── Auth Store ───────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('cb_token');
      const userStr = await SecureStore.getItemAsync('cb_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (token, user) => {
    await SecureStore.setItemAsync('cb_token', token);
    await SecureStore.setItemAsync('cb_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('cb_token');
    await SecureStore.deleteItemAsync('cb_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: async (userData) => {
    set((state) => {
      const updated = { ...state.user, ...userData };
      SecureStore.setItemAsync('cb_user', JSON.stringify(updated));
      return { user: updated };
    });
  },
}));

// ─── Cart Store ───────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  vendorId: null,
  vendorName: '',

  addItem: (foodItem, quantity = 1, extras = []) => {
    const { items, vendorId } = get();

    // Clear cart if different vendor
    if (vendorId && vendorId !== foodItem.vendorId) {
      set({ items: [], vendorId: null, vendorName: '' });
    }

    const existing = items.find(i => i.foodItem.id === foodItem.id);
    if (existing) {
      set({
        items: items.map(i =>
          i.foodItem.id === foodItem.id ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      set({
        items: [...items, { foodItem, quantity, extras }],
        vendorId: foodItem.vendorId,
      });
    }
  },

  removeItem: (foodItemId) =>
    set((state) => ({ items: state.items.filter(i => i.foodItem.id !== foodItemId) })),

  updateQuantity: (foodItemId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({ items: state.items.filter(i => i.foodItem.id !== foodItemId) }));
    } else {
      set((state) => ({
        items: state.items.map(i => i.foodItem.id === foodItemId ? { ...i, quantity } : i),
      }));
    }
  },

  clearCart: () => set({ items: [], vendorId: null, vendorName: '' }),

  get total() {
    return get().items.reduce((sum, i) => sum + i.foodItem.price * i.quantity, 0);
  },

  get itemCount() {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
}));

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: async (token) => {
    await AsyncStorage.setItem('token', token);
    set({ token });
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, cart: [] });
  },

  // Cart
  cart: [],
  cartVendorId: null,
  addToCart: (item, vendorId) => {
    const { cart, cartVendorId } = get();
    if (cartVendorId && cartVendorId !== vendorId) {
      // Different vendor — clear cart first
      set({ cart: [{ ...item, quantity: 1 }], cartVendorId: vendorId });
      return;
    }
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      set({ cart: cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }], cartVendorId: vendorId });
    }
  },
  removeFromCart: (itemId) => {
    const { cart } = get();
    const updated = cart
      .map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    set({ cart: updated, cartVendorId: updated.length ? get().cartVendorId : null });
  },
  clearCart: () => set({ cart: [], cartVendorId: null }),
  getCartTotal: () => get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getCartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

  // Current order tracking
  activeOrder: null,
  setActiveOrder: (order) => set({ activeOrder: order }),
}));

export default useStore;

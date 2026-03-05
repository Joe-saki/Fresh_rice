import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import useStore from '../../store/useStore';

const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

export default function CartScreen({ navigation }) {
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal, cartVendorId } = useStore();
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const subtotal = getCartTotal();
  const deliveryFee = 3.0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add some delicious food to get started!</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.browseBtnText}>Browse Vendors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', onPress: clearCart }])}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cart Items */}
        {cart.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemEmoji}>🍱</Text>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>GHS {item.price.toFixed(2)} each</Text>
              </View>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item, cartVendorId)}>
                <Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text>
              </TouchableOpacity>
              <Text style={styles.itemTotal}>GHS {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Block A, Room 204, UPSA Hostel"
            value={address}
            onChangeText={setAddress}
            multiline
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Special Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Special Note (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. No pepper, extra stew..."
            value={note}
            onChangeText={setNote}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>GHS {subtotal.toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery Fee</Text><Text style={styles.summaryValue}>GHS {deliveryFee.toFixed(2)}</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>GHS {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.checkoutBtn, !address && styles.checkoutDisabled]}
        onPress={() => {
          if (!address) return Alert.alert('Address Required', 'Please enter your delivery address');
          navigation.navigate('Checkout', { vendorId: cartVendorId, cart, subtotal, deliveryFee, total, address, note });
        }}
      >
        <Text style={styles.checkoutText}>Proceed to Checkout — GHS {total.toFixed(2)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  back: { fontSize: 24, color: COLORS.dark },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  clearText: { fontSize: 15, color: 'red', fontWeight: '600' },
  content: { padding: 16 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemEmoji: { fontSize: 32 },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  itemPrice: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: COLORS.green },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.green },
  qty: { fontSize: 15, fontWeight: '700', color: COLORS.dark, minWidth: 18, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: COLORS.dark, minWidth: 60, textAlign: 'right' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.dark, minHeight: 50 },
  summary: { backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16, marginTop: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: COLORS.gray },
  summaryValue: { fontSize: 15, color: COLORS.dark, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: COLORS.dark },
  totalValue: { fontSize: 17, fontWeight: '800', color: COLORS.green },
  checkoutBtn: { margin: 16, backgroundColor: COLORS.green, borderRadius: 16, padding: 18, alignItems: 'center', elevation: 4 },
  checkoutDisabled: { backgroundColor: '#aaa' },
  checkoutText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 70, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: COLORS.dark },
  emptySub: { fontSize: 15, color: COLORS.gray, textAlign: 'center', marginTop: 8 },
  browseBtn: { backgroundColor: COLORS.green, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30, marginTop: 24 },
  browseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

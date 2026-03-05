// src/screens/Cart/CartScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../../store/index';
import { colors } from '../../utils/theme';

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeItem, total, clearCart, vendorId } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add some delicious food to get started</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.browseBtnText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const deliveryFee = 3;
  const subtotal = total;
  const grandTotal = subtotal + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Items</Text>
          {items.map((cartItem) => (
            <View key={cartItem.foodItem.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{cartItem.foodItem.name}</Text>
                <Text style={styles.itemPrice}>GHS {cartItem.foodItem.price.toFixed(2)} each</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(cartItem.foodItem.id, cartItem.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{cartItem.quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnAdd]}
                  onPress={() => updateQuantity(cartItem.foodItem.id, cartItem.quantity + 1)}
                >
                  <Text style={[styles.qtyBtnText, { color: 'white' }]}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>GHS {(cartItem.foodItem.price * cartItem.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>GHS {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>GHS {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>GHS {grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
          <Text style={styles.clearBtnText}>Clear Cart</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout', { vendorId, items, subtotal, deliveryFee, total: grandTotal })}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout → GHS {grandTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  emptyText: { fontSize: 15, color: colors.gray[500], marginTop: 4, textAlign: 'center' },
  browseBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 24 },
  browseBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  section: { backgroundColor: 'white', borderRadius: 16, margin: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray[100], gap: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  itemPrice: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.gray[100], justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: colors.primary },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: colors.gray[700] },
  qtyText: { fontSize: 16, fontWeight: '700', color: colors.gray[900], minWidth: 20, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: '700', color: colors.primary, minWidth: 70, textAlign: 'right' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: colors.gray[500] },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.gray[100], marginTop: 8, paddingTop: 16 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  totalValue: { fontSize: 17, fontWeight: '800', color: colors.primary },
  clearBtn: { alignItems: 'center', padding: 16 },
  clearBtnText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  footer: { padding: 16, paddingBottom: 32, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.gray[100] },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  checkoutBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

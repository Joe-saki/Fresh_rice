import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { orderAPI, paymentAPI } from '../../api/client';
import useStore from '../../store/useStore';

const COLORS = { green: '#1DB954', orange: '#FF6B35', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

export default function CheckoutScreen({ route, navigation }) {
  const { vendorId, cart, subtotal, deliveryFee, total, address, note } = route.params;
  const [momoNumber, setMomoNumber] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [loading, setLoading] = useState(false);
  const { clearCart, setActiveOrder, user } = useStore();

  const handlePlaceOrder = async () => {
    if (!momoNumber || momoNumber.length < 10) return Alert.alert('Phone Required', 'Enter your MoMo number');

    setLoading(true);
    try {
      const orderRes = await orderAPI.place({
        vendorId,
        items: cart.map(i => ({ foodItemId: i.id, quantity: i.quantity })),
        deliveryAddress: address,
        paymentMethod: 'MOMO',
        specialNote: note,
      });

      const order = orderRes.data;
      const fullMomo = momoNumber.startsWith('+233') ? momoNumber : `+233${momoNumber.replace(/^0/, '')}`;

      await paymentAPI.initiateMoMo(order.id, fullMomo, network);

      clearCart();
      setActiveOrder(order);
      navigation.replace('OrderTracking', { orderId: order.id });
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Order Summary</Text>
          {cart.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.quantity}x {item.name}</Text>
              <Text style={styles.orderItemPrice}>GHS {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}><Text style={styles.orderItemName}>Delivery Fee</Text><Text style={styles.orderItemPrice}>GHS {deliveryFee.toFixed(2)}</Text></View>
          <View style={[styles.orderItem, { marginTop: 4 }]}>
            <Text style={[styles.orderItemName, { fontWeight: '800', fontSize: 16 }]}>Total</Text>
            <Text style={[styles.orderItemPrice, { color: COLORS.green, fontWeight: '800', fontSize: 16 }]}>GHS {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Delivery To</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>

        {/* MoMo Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Mobile Money Payment</Text>
          <View style={styles.networkRow}>
            {['MTN', 'Vodafone'].map(n => (
              <TouchableOpacity key={n} style={[styles.networkBtn, network === n && styles.networkBtnActive]} onPress={() => setNetwork(n)}>
                <Text style={[styles.networkText, network === n && styles.networkTextActive]}>{n === 'MTN' ? '🟡 MTN MoMo' : '🔴 Vodafone Cash'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <View style={styles.flag}><Text>🇬🇭 +233</Text></View>
            <TextInput
              style={styles.input}
              placeholder="XX XXX XXXX"
              keyboardType="phone-pad"
              value={momoNumber}
              onChangeText={setMomoNumber}
              maxLength={10}
              placeholderTextColor="#aaa"
            />
          </View>
          <Text style={styles.hint}>💡 You will receive a PIN prompt on your phone to confirm payment</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.placeBtn, loading && { opacity: 0.7 }]} onPress={handlePlaceOrder} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeBtnText}>Place Order — GHS {total.toFixed(2)} 🚀</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { fontSize: 24, color: COLORS.dark },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { fontSize: 14, color: COLORS.gray },
  orderItemPrice: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  addressText: { fontSize: 14, color: COLORS.gray, lineHeight: 20 },
  networkRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  networkBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  networkBtnActive: { borderColor: COLORS.green, backgroundColor: '#f0fdf4' },
  networkText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  networkTextActive: { color: COLORS.green },
  inputRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: COLORS.green, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  flag: { paddingHorizontal: 12, backgroundColor: '#f0fdf4', justifyContent: 'center' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: COLORS.dark },
  hint: { fontSize: 12, color: COLORS.gray, lineHeight: 18 },
  placeBtn: { margin: 16, backgroundColor: COLORS.green, borderRadius: 16, padding: 18, alignItems: 'center', elevation: 4 },
  placeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

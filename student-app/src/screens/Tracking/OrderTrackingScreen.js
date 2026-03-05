import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { orderAPI } from '../../api/client';
import { io } from 'socket.io-client';

const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666' };

const STATUS_STEPS = ['PENDING','CONFIRMED','PREPARING','PICKED_UP','DELIVERED'];
const STATUS_LABELS = { PENDING: 'Order Placed', CONFIRMED: 'Payment Confirmed', PREPARING: 'Being Prepared', READY: 'Ready for Pickup', PICKED_UP: 'On the Way', DELIVERED: 'Delivered!' };
const STATUS_EMOJIS = { PENDING: '📋', CONFIRMED: '✅', PREPARING: '👨‍🍳', READY: '📦', PICKED_UP: '🛵', DELIVERED: '🎉' };

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    const socket = io(process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join_order', orderId);
    socket.on('order_status_update', ({ status }) => {
      setOrder(prev => prev ? { ...prev, status } : prev);
    });
    return () => socket.disconnect();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await orderAPI.get(orderId);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STATUS_STEPS.indexOf(order?.status);

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.green} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <Text style={styles.orderId}>#{orderId?.slice(0, 8)?.toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusEmoji}>{STATUS_EMOJIS[order?.status] || '📋'}</Text>
          <Text style={styles.statusText}>{STATUS_LABELS[order?.status] || order?.status}</Text>
        </View>

        {/* Progress Steps */}
        <View style={styles.progressCard}>
          {STATUS_STEPS.map((step, idx) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepDot, idx <= currentStep && styles.stepDotActive]}>
                  {idx < currentStep && <Text style={styles.stepCheck}>✓</Text>}
                  {idx === currentStep && <View style={styles.stepPulse} />}
                </View>
                {idx < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, idx < currentStep && styles.stepLineActive]} />}
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepLabel, idx <= currentStep && styles.stepLabelActive]}>{STATUS_LABELS[step]}</Text>
                {idx === currentStep && <Text style={styles.stepSub}>In progress...</Text>}
                {idx < currentStep && <Text style={styles.stepSub}>Done ✓</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛒 Your Order</Text>
          {order?.items?.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.quantity}x {item.foodItem?.name}</Text>
              <Text style={styles.orderItemPrice}>GHS {item.subtotal?.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>GHS {order?.totalGHS?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Vendor & Rider Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 Vendor</Text>
          <Text style={styles.infoText}>{order?.vendor?.businessName}</Text>
          <Text style={styles.infoSub}>{order?.vendor?.address}</Text>
        </View>

        {order?.rider && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛵 Your Rider</Text>
            <Text style={styles.infoText}>{order.rider?.user?.name}</Text>
            <TouchableOpacity style={styles.callBtn}>
              <Text style={styles.callBtnText}>📞 Call Rider</Text>
            </TouchableOpacity>
          </View>
        )}

        {order?.status === 'DELIVERED' && !order?.rating && (
          <TouchableOpacity style={styles.rateBtn} onPress={() => navigation.navigate('RateOrder', { orderId })}>
            <Text style={styles.rateBtnText}>⭐ Rate Your Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 20, paddingTop: 50, backgroundColor: COLORS.green },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  orderId: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  content: { padding: 16, gap: 14 },
  statusBadge: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 3 },
  statusEmoji: { fontSize: 50, marginBottom: 8 },
  statusText: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  progressCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, elevation: 2 },
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  stepLeft: { alignItems: 'center', marginRight: 14, width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: COLORS.green },
  stepCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginVertical: 2, minHeight: 24 },
  stepLineActive: { backgroundColor: COLORS.green },
  stepInfo: { flex: 1, paddingBottom: 16 },
  stepLabel: { fontSize: 15, color: COLORS.gray, fontWeight: '500' },
  stepLabelActive: { color: COLORS.dark, fontWeight: '700' },
  stepSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 10 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { fontSize: 14, color: COLORS.gray },
  orderItemPrice: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  totalValue: { fontSize: 15, fontWeight: '800', color: COLORS.green },
  infoText: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  infoSub: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  callBtn: { marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, alignItems: 'center' },
  callBtnText: { color: COLORS.green, fontWeight: '600' },
  rateBtn: { backgroundColor: COLORS.gold, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 3 },
  rateBtnText: { color: COLORS.dark, fontSize: 16, fontWeight: '700' },
});

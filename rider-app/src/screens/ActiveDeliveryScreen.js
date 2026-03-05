import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { riderAPI } from '../api/client';

const COLORS = { green: '#1DB954', orange: '#FF6B35', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666' };

export default function ActiveDeliveryScreen({ route, navigation }) {
  const { order } = route.params;
  const [status, setStatus] = useState(order.status);

  const updateStatus = async (newStatus) => {
    try {
      await riderAPI.updateOrderStatus(order.id, newStatus);
      setStatus(newStatus);
      if (newStatus === 'DELIVERED') {
        Alert.alert('Delivered! 🎉', 'Great job! The order has been delivered.', [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Delivery 🛵</Text>
        <Text style={styles.orderId}>#{order.id?.slice(0, 8)?.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={styles.statusValue}>{status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏪 Pickup From</Text>
        <Text style={styles.placeName}>{order.vendor?.businessName}</Text>
        <Text style={styles.placeAddr}>{order.vendor?.address}</Text>
        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.vendor?.user?.phone}`)}>
          <Text style={styles.callBtnText}>📞 Call Vendor</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Deliver To</Text>
        <Text style={styles.placeName}>{order.student?.user?.name}</Text>
        <Text style={styles.placeAddr}>{order.deliveryAddress}</Text>
        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.student?.user?.phone}`)}>
          <Text style={styles.callBtnText}>📞 Call Student</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map(item => (
          <Text key={item.id} style={styles.item}>{item.quantity}x {item.foodItem?.name}</Text>
        ))}
        <Text style={styles.total}>Total: GHS {order.totalGHS?.toFixed(2)}</Text>
      </View>

      {status === 'PICKED_UP' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.green }]} onPress={() => updateStatus('DELIVERED')}>
          <Text style={styles.actionBtnText}>✅ Mark as Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  header: { paddingTop: 40, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  orderId: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  statusLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  statusValue: { fontSize: 24, fontWeight: '800', color: COLORS.green, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  placeName: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  placeAddr: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  callBtn: { marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, alignItems: 'center' },
  callBtnText: { color: COLORS.green, fontWeight: '600' },
  item: { fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  total: { fontSize: 15, fontWeight: '700', color: COLORS.green, marginTop: 8 },
  actionBtn: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8 },
  actionBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

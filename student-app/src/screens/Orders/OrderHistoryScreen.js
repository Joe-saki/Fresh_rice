import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { orderAPI } from '../../api/client';

const COLORS = { green: '#1DB954', orange: '#FF6B35', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

const STATUS_COLORS = { DELIVERED: COLORS.green, CANCELLED: 'red', PENDING: COLORS.orange, PREPARING: '#3b82f6', PICKED_UP: COLORS.orange };

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.myOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}>
      <View style={styles.orderHeader}>
        <Text style={styles.vendorName}>{item.vendor?.businessName}</Text>
        <Text style={[styles.status, { color: STATUS_COLORS[item.status] || COLORS.gray }]}>{item.status}</Text>
      </View>
      <Text style={styles.items}>{item.items?.map(i => `${i.quantity}x ${i.foodItem?.name}`).join(', ')}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.total}>GHS {item.totalGHS?.toFixed(2)}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      {item.status === 'DELIVERED' && !item.rating && (
        <TouchableOpacity style={styles.rateBtn} onPress={(e) => { e.stopPropagation(); navigation.navigate('RateOrder', { orderId: item.id }); }}>
          <Text style={styles.rateBtnText}>⭐ Rate this order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.green} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>My Orders</Text></View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.green} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 60 }}>📭</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySub}>Your order history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 20, paddingTop: 50, backgroundColor: COLORS.green },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  list: { padding: 16, gap: 12 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  vendorName: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  status: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  items: { fontSize: 13, color: COLORS.gray, marginBottom: 10 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { fontSize: 15, fontWeight: '700', color: COLORS.green },
  date: { fontSize: 13, color: COLORS.gray },
  rateBtn: { marginTop: 10, backgroundColor: '#fff8e7', borderRadius: 10, padding: 8, alignItems: 'center' },
  rateBtnText: { color: '#b7791f', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 20, fontWeight: '700', color: COLORS.dark, marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 6 },
});

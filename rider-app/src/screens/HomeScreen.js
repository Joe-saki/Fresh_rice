import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { riderAPI } from '../api/client';

const COLORS = { green: '#1DB954', orange: '#FF6B35', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

export default function RiderHomeScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const locationInterval = useRef(null);

  const startLocationTracking = async (orderId) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Location permission is required for deliveries');

    locationInterval.current = setInterval(async () => {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await riderAPI.updateLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, orderId });
    }, 5000);
  };

  const stopLocationTracking = () => {
    if (locationInterval.current) clearInterval(locationInterval.current);
  };

  const fetchOrders = async () => {
    if (!isOnline) { setLoading(false); return; }
    try {
      const res = await riderAPI.availableOrders();
      setOrders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (isOnline) fetchOrders();
    else { setOrders([]); setLoading(false); }
  }, [isOnline]);

  const acceptOrder = async (orderId) => {
    try {
      const res = await riderAPI.acceptOrder(orderId);
      setActiveOrder(res.data);
      await startLocationTracking(orderId);
      navigation.navigate('ActiveDelivery', { order: res.data });
    } catch (err) {
      Alert.alert('Error', 'Could not accept this order. It may have been taken.');
      fetchOrders();
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.orderFee}>GHS 3.00 fee</Text>
      </View>
      <View style={styles.route}>
        <View style={styles.routePoint}>
          <Text style={styles.routeDot}>🏪</Text>
          <View>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeValue}>{item.vendor?.businessName}</Text>
            <Text style={styles.routeAddr}>{item.vendor?.address}</Text>
          </View>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Text style={styles.routeDot}>📍</Text>
          <View>
            <Text style={styles.routeLabel}>Deliver to</Text>
            <Text style={styles.routeValue}>{item.student?.user?.name}</Text>
            <Text style={styles.routeAddr}>{item.deliveryAddress}</Text>
          </View>
        </View>
      </View>
      <View style={styles.orderMeta}>
        <Text style={styles.items}>{item.items?.length} item(s) • GHS {item.totalGHS?.toFixed(2)}</Text>
        <Text style={styles.time}>~15 min</Text>
      </View>
      <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptOrder(item.id)}>
        <Text style={styles.acceptBtnText}>Accept Delivery 🛵</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CampusBite Rider</Text>
          <Text style={styles.sub}>UPSA Campus Deliveries</Text>
        </View>
        <View style={styles.onlineRow}>
          <Text style={styles.onlineLabel}>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
          <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ true: '#1DB954' }} />
        </View>
      </View>

      {!isOnline ? (
        <View style={styles.offline}>
          <Text style={styles.offlineEmoji}>😴</Text>
          <Text style={styles.offlineTitle}>You're Offline</Text>
          <Text style={styles.offlineSub}>Toggle online to start receiving delivery requests</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.green} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 50 }}>🕐</Text>
              <Text style={styles.emptyText}>No orders right now</Text>
              <Text style={styles.emptySub}>Stay online — orders will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: COLORS.green },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineLabel: { fontSize: 13, color: '#fff', fontWeight: '600' },
  list: { padding: 16, gap: 14 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  orderId: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  orderFee: { fontSize: 14, fontWeight: '700', color: COLORS.green },
  route: { gap: 4, marginBottom: 12 },
  routePoint: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  routeDot: { fontSize: 22, marginTop: 2 },
  routeLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  routeValue: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  routeAddr: { fontSize: 12, color: COLORS.gray },
  routeLine: { height: 20, width: 2, backgroundColor: '#ddd', marginLeft: 11, marginVertical: 2 },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  items: { fontSize: 13, color: COLORS.gray },
  time: { fontSize: 13, color: COLORS.orange, fontWeight: '600' },
  acceptBtn: { backgroundColor: COLORS.green, borderRadius: 12, padding: 14, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  offline: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  offlineEmoji: { fontSize: 70, marginBottom: 16 },
  offlineTitle: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  offlineSub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginTop: 16 },
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 6 },
});

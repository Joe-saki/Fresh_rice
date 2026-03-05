import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { vendorAPI } from '../../api/client';
import useStore from '../../store/useStore';

const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🍽️' },
  { id: 'Rice Dishes', name: 'Rice', emoji: '🍚' },
  { id: 'Swallows', name: 'Swallows', emoji: '🥣' },
  { id: 'Soups & Stews', name: 'Soups', emoji: '🍲' },
  { id: 'Snacks', name: 'Snacks', emoji: '🍢' },
  { id: 'Drinks', name: 'Drinks', emoji: '🥤' },
  { id: 'Breakfast', name: 'Breakfast', emoji: '🥚' },
];

const VendorCard = ({ vendor, onPress }) => (
  <TouchableOpacity style={styles.vendorCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.vendorCover}>
      <Text style={styles.vendorEmoji}>🍽️</Text>
      {!vendor.isOpen && <View style={styles.closedBadge}><Text style={styles.closedText}>Closed</Text></View>}
    </View>
    <View style={styles.vendorInfo}>
      <Text style={styles.vendorName}>{vendor.businessName}</Text>
      <Text style={styles.vendorAddress} numberOfLines={1}>{vendor.address}</Text>
      <View style={styles.vendorMeta}>
        <Text style={styles.rating}>⭐ {vendor.rating?.toFixed(1) || '4.5'}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.delivery}>🛵 15-30 min</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.fee}>GHS 3 delivery</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { user, getCartCount } = useStore();

  const fetchVendors = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      const res = await vendorAPI.list(params);
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [search, category]);

  const cartCount = getCartCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.sub}>What are you craving today?</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartEmoji}>🛒</Text>
          {cartCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVendors(); }} tintColor={COLORS.green} />}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search vendors or dishes..." value={search} onChangeText={setSearch} placeholderTextColor="#aaa" />
        </View>

        {/* Promo Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🎉 First Order?</Text>
          <Text style={styles.bannerText}>Use code NEWBITE for GHS 5 off!</Text>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.catChip, category === item.id && styles.catChipActive]} onPress={() => setCategory(item.id)}>
              <Text style={styles.catEmoji}>{item.emoji}</Text>
              <Text style={[styles.catName, category === item.id && styles.catNameActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Vendors */}
        <Text style={styles.sectionTitle}>Vendors Near You</Text>
        {loading
          ? <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 40 }} />
          : vendors.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyEmoji}>😔</Text><Text style={styles.emptyText}>No vendors found</Text></View>
            : vendors.map(v => <VendorCard key={v.id} vendor={v} onPress={() => navigation.navigate('VendorDetail', { vendorId: v.id, vendorName: v.businessName })} />)
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: COLORS.green },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  cartBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cartEmoji: { fontSize: 22 },
  badge: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, backgroundColor: COLORS.orange, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.dark },
  banner: { marginHorizontal: 16, backgroundColor: '#fff8e7', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.gold, marginBottom: 8 },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  bannerText: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  catList: { paddingHorizontal: 16, gap: 10 },
  catChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: COLORS.lightGray, borderRadius: 20, flexDirection: 'row', gap: 6 },
  catChipActive: { backgroundColor: COLORS.green },
  catEmoji: { fontSize: 18 },
  catName: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  catNameActive: { color: COLORS.white },
  vendorCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.white, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, overflow: 'hidden' },
  vendorCover: { height: 120, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  vendorEmoji: { fontSize: 50 },
  closedBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  closedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  vendorInfo: { padding: 14 },
  vendorName: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  vendorAddress: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  rating: { fontSize: 13, color: COLORS.dark, fontWeight: '600' },
  dot: { color: COLORS.gray },
  delivery: { fontSize: 13, color: COLORS.gray },
  fee: { fontSize: 13, color: COLORS.green, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 50 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 12 },
});

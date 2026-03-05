// src/screens/Home/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVendors } from '../../api/client';
import { useAuthStore } from '../../store/index';
import { colors } from '../../utils/theme';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'Rice Dishes', label: 'Rice', emoji: '🍛' },
  { id: 'Soups', label: 'Soups', emoji: '🍲' },
  { id: 'Swallows', label: 'Swallows', emoji: '🥣' },
  { id: 'Snacks', label: 'Snacks', emoji: '🌮' },
  { id: 'Drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'Breakfast', label: 'Breakfast', emoji: '🌅' },
];

function VendorCard({ vendor, onPress }) {
  return (
    <TouchableOpacity style={styles.vendorCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.vendorImage}>
        {vendor.coverImageUrl ? (
          <Image source={{ uri: vendor.coverImageUrl }} style={styles.vendorImg} />
        ) : (
          <View style={[styles.vendorImgPlaceholder, { backgroundColor: vendor.isOpen ? '#E8F5E9' : '#F5F5F5' }]}>
            <Text style={styles.vendorImgEmoji}>🍽️</Text>
          </View>
        )}
        <View style={[styles.openBadge, { backgroundColor: vendor.isOpen ? colors.primary : colors.gray[400] }]}>
          <Text style={styles.openBadgeText}>{vendor.isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>{vendor.businessName}</Text>
        <Text style={styles.vendorCategory}>{vendor.category} • {vendor.address?.slice(0, 30)}</Text>
        <View style={styles.vendorMeta}>
          <Text style={styles.vendorRating}>⭐ {vendor.rating?.toFixed(1) || '4.5'}</Text>
          <Text style={styles.vendorDot}>•</Text>
          <Text style={styles.vendorTime}>30 min</Text>
          <Text style={styles.vendorDot}>•</Text>
          <Text style={styles.vendorFee}>GHS 3 delivery</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchVendors = async () => {
    try {
      const { data } = await getVendors({ category: category === 'all' ? undefined : category, search: search || undefined });
      setVendors(data.vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [category, search]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good morning';
    if (h < 17) return '☀️ Good afternoon';
    return '🌙 Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVendors(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.location}>📍 UPSA, Madina, Accra</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Rewards')} style={styles.pointsBadge}>
            <Text style={styles.pointsEmoji}>⭐</Text>
            <Text style={styles.pointsText}>{user?.student?.bitesPoints || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search jollof, fufu, drinks..."
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        {/* Promo Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>First order?</Text>
            <Text style={styles.bannerSub}>Use code WELCOME5 for GHS 5 off 🎉</Text>
          </View>
          <Text style={styles.bannerEmoji}>🍚</Text>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, category === cat.id && styles.categoryPillActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vendors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {category === 'all' ? 'All Restaurants' : category} {vendors.length > 0 && `(${vendors.length})`}
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
          ) : vendors.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>😕</Text>
              <Text style={styles.emptyText}>No restaurants found</Text>
            </View>
          ) : (
            vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onPress={() => navigation.navigate('VendorDetail', { vendorId: vendor.id, vendorName: vendor.businessName })}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Cart FAB */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14, color: colors.gray[500], fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: colors.gray[900], marginTop: 2 },
  location: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  pointsBadge: { backgroundColor: colors.accent + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsEmoji: { fontSize: 16 },
  pointsText: { fontSize: 14, fontWeight: '700', color: colors.accent },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, marginHorizontal: 20, marginVertical: 12, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.gray[900] },
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 16, marginHorizontal: 20, padding: 16, marginBottom: 8 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  bannerEmoji: { fontSize: 40 },
  categories: { marginTop: 8 },
  categoriesContent: { paddingHorizontal: 20, gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.gray[200] },
  categoryPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  categoryLabelActive: { color: 'white' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  vendorCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  vendorImage: { height: 140, position: 'relative' },
  vendorImg: { width: '100%', height: '100%' },
  vendorImgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  vendorImgEmoji: { fontSize: 48 },
  openBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  openBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  vendorInfo: { padding: 14 },
  vendorName: { fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  vendorCategory: { fontSize: 13, color: colors.gray[400], marginTop: 2 },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  vendorRating: { fontSize: 13, fontWeight: '600', color: colors.gray[700] },
  vendorDot: { fontSize: 13, color: colors.gray[300] },
  vendorTime: { fontSize: 13, color: colors.gray[500] },
  vendorFee: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.gray[500] },
});

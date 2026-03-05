// src/screens/Vendor/VendorDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVendor } from '../../api/client';
import { useCartStore } from '../../store/index';
import { colors } from '../../utils/theme';

export default function VendorDetailScreen({ route, navigation }) {
  const { vendorId } = route.params;
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { items: cartItems, addItem, itemCount } = useCartStore();

  useEffect(() => {
    getVendor(vendorId).then(({ data }) => {
      setVendor(data.vendor);
      navigation.setOptions({ title: data.vendor.businessName });
    }).catch(console.error).finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />;
  if (!vendor) return null;

  const menuItems = vendor.menuItems || [];
  const categories = ['All', ...new Set(menuItems.map(i => i.category))];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView>
        {/* Cover */}
        <View style={styles.cover}>
          <View style={styles.coverPlaceholder}>
            <Text style={{ fontSize: 60 }}>🍽️</Text>
          </View>
          <View style={styles.overlay}>
            <View style={[styles.statusBadge, { backgroundColor: vendor.isOpen ? colors.primary : colors.gray[500] }]}>
              <Text style={styles.statusText}>{vendor.isOpen ? '🟢 Open' : '🔴 Closed'}</Text>
            </View>
          </View>
        </View>

        {/* Vendor Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{vendor.businessName}</Text>
          {vendor.description && <Text style={styles.desc}>{vendor.description}</Text>}
          <View style={styles.meta}>
            <Text style={styles.metaItem}>⭐ {vendor.rating?.toFixed(1) || '4.5'} ({vendor.totalReviews} reviews)</Text>
            <Text style={styles.metaItem}>🕐 {vendor.openingTime} – {vendor.closingTime}</Text>
            <Text style={styles.metaItem}>📍 {vendor.address}</Text>
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <View style={styles.menu}>
          {filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate('FoodDetail', { item, vendorId })}
            >
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>}
                <Text style={styles.menuItemPrice}>GHS {item.price.toFixed(2)}</Text>
                <Text style={styles.menuItemTime}>⏱ {item.preparationTime} min</Text>
              </View>
              <View style={styles.menuItemRight}>
                <View style={styles.menuItemImagePlaceholder}>
                  <Text style={{ fontSize: 28 }}>🍛</Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addItem({ ...item, vendorId })}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Cart Bar */}
      {itemCount > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{itemCount}</Text></View>
            <Text style={styles.cartBtnText}>View Cart</Text>
            <Text style={styles.cartBtnText}>GHS {useCartStore.getState().total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { height: 200, position: 'relative' },
  coverPlaceholder: { height: '100%', backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', bottom: 12, right: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: 'white', fontSize: 13, fontWeight: '700' },
  info: { padding: 20, backgroundColor: 'white', marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  desc: { fontSize: 14, color: colors.gray[500], marginTop: 4, lineHeight: 20 },
  meta: { marginTop: 12, gap: 4 },
  metaItem: { fontSize: 13, color: colors.gray[500] },
  cats: { backgroundColor: 'white', paddingVertical: 12 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.gray[100] },
  catPillActive: { backgroundColor: colors.primary },
  catText: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  catTextActive: { color: 'white' },
  menu: { padding: 20, gap: 12 },
  menuItem: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  menuItemDesc: { fontSize: 13, color: colors.gray[500], marginTop: 3, lineHeight: 18 },
  menuItemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 6 },
  menuItemTime: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  menuItemRight: { alignItems: 'center', gap: 8 },
  menuItemImagePlaceholder: { width: 70, height: 70, backgroundColor: colors.gray[100], borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 32, height: 32, backgroundColor: colors.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: 'white', fontSize: 22, fontWeight: '300', lineHeight: 28 },
  cartBar: { backgroundColor: 'white', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  cartBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: 'white', fontSize: 13, fontWeight: '700' },
  cartBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

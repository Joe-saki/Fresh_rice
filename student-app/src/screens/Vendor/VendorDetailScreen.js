import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { vendorAPI } from '../../api/client';
import useStore from '../../store/useStore';

const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

const FoodCard = ({ item, onAdd, onRemove, quantity }) => (
  <View style={styles.foodCard}>
    <View style={styles.foodEmoji}><Text style={{ fontSize: 36 }}>🍱</Text></View>
    <View style={styles.foodInfo}>
      <Text style={styles.foodName}>{item.name}</Text>
      {item.description && <Text style={styles.foodDesc} numberOfLines={2}>{item.description}</Text>}
      <Text style={styles.foodPrice}>GHS {item.price.toFixed(2)}</Text>
    </View>
    <View style={styles.qtyControl}>
      {quantity > 0 ? (
        <>
          <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={onAdd}><Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text></TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={onAdd}><Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text></TouchableOpacity>
      )}
    </View>
  </View>
);

export default function VendorDetailScreen({ route, navigation }) {
  const { vendorId } = route.params;
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, removeFromCart, getCartTotal, getCartCount, cartVendorId } = useStore();

  useEffect(() => {
    (async () => {
      try {
        const [vRes, mRes] = await Promise.all([vendorAPI.get(vendorId), vendorAPI.getMenu(vendorId)]);
        setVendor(vRes.data);
        setMenu(mRes.data.menu);
      } catch (err) {
        Alert.alert('Error', 'Failed to load vendor');
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  const getItemQty = (itemId) => cart.find(i => i.id === itemId)?.quantity || 0;
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.green} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Vendor Header */}
        <View style={styles.vendorHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <View style={styles.vendorCover}><Text style={{ fontSize: 60 }}>🍽️</Text></View>
          <View style={styles.vendorDetails}>
            <Text style={styles.vendorName}>{vendor?.businessName}</Text>
            <Text style={styles.vendorAddr}>{vendor?.address}</Text>
            <View style={styles.vendorMeta}>
              <Text style={styles.metaItem}>⭐ {vendor?.rating?.toFixed(1) || '4.5'}</Text>
              <Text style={styles.metaItem}>🛵 15-30 min</Text>
              <Text style={[styles.metaItem, { color: vendor?.isOpen ? COLORS.green : 'red' }]}>
                {vendor?.isOpen ? '● Open' : '● Closed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        {Object.entries(menu).map(([category, items]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map(item => (
              <FoodCard
                key={item.id}
                item={item}
                quantity={getItemQty(item.id)}
                onAdd={() => {
                  if (cartVendorId && cartVendorId !== vendorId) {
                    Alert.alert('New Vendor', 'Your cart will be cleared for this new vendor.', [
                      { text: 'Cancel' },
                      { text: 'OK', onPress: () => addToCart(item, vendorId) }
                    ]);
                  } else {
                    addToCart(item, vendorId);
                  }
                }}
                onRemove={() => removeFromCart(item.id)}
              />
            ))}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cart Floating Button */}
      {cartCount > 0 && cartVendorId === vendorId && (
        <TouchableOpacity style={styles.cartFloat} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.cartFloatBadge}><Text style={styles.cartFloatBadgeText}>{cartCount}</Text></View>
          <Text style={styles.cartFloatText}>View Cart</Text>
          <Text style={styles.cartFloatPrice}>GHS {cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 10, width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  vendorHeader: { backgroundColor: COLORS.green },
  vendorCover: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9' },
  vendorDetails: { padding: 16, backgroundColor: COLORS.white },
  vendorName: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  vendorAddr: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  vendorMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaItem: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  categoryTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#f0f0f0' },
  foodCard: { flexDirection: 'row', marginBottom: 16, backgroundColor: COLORS.white, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, padding: 12, alignItems: 'center' },
  foodEmoji: { width: 70, height: 70, backgroundColor: '#f5f5f5', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  foodInfo: { flex: 1, marginLeft: 12 },
  foodName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  foodDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  foodPrice: { fontSize: 15, fontWeight: '700', color: COLORS.green, marginTop: 4 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.green },
  qty: { fontSize: 16, fontWeight: '700', color: COLORS.dark, minWidth: 20, textAlign: 'center' },
  cartFloat: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: COLORS.green, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 8 },
  cartFloatBadge: { width: 28, height: 28, backgroundColor: COLORS.white, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cartFloatBadgeText: { color: COLORS.green, fontSize: 13, fontWeight: '800' },
  cartFloatText: { color: COLORS.white, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  cartFloatPrice: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

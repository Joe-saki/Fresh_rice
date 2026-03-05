import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { studentAPI } from '../../api/client';
import useStore from '../../store/useStore';

const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useStore();
  const [rewards, setRewards] = useState(null);

  useEffect(() => {
    studentAPI.rewards().then(r => setRewards(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => Alert.alert('Logout', 'Are you sure you want to logout?', [
    { text: 'Cancel' },
    { text: 'Logout', style: 'destructive', onPress: () => { logout(); navigation.replace('Splash'); } }
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>🎓 UPSA Student</Text></View>
      </View>

      {/* Bites Points */}
      {rewards && (
        <View style={styles.rewardsCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsTitle}>🏆 Bites Points</Text>
            <Text style={styles.rewardsPoints}>{rewards.bitesPoints} pts</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(rewards.progress / rewards.nextRewardAt) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{rewards.progress}/{rewards.nextRewardAt} points to next reward (GHS 5 off)</Text>
          {rewards.availableRewards > 0 && (
            <TouchableOpacity style={styles.redeemBtn} onPress={() => studentAPI.redeem().then(() => Alert.alert('Redeemed!', 'GHS 5 discount added to your account'))}>
              <Text style={styles.redeemText}>Redeem {rewards.availableRewards} reward(s)</Text>
            </TouchableOpacity>
          )}
          <View style={styles.referralRow}>
            <Text style={styles.referralLabel}>Your referral code:</Text>
            <View style={styles.referralCode}><Text style={styles.referralCodeText}>{rewards.referralCode}</Text></View>
          </View>
        </View>
      )}

      {/* Menu Items */}
      {[
        { icon: '📦', label: 'My Orders', onPress: () => navigation.navigate('Orders') },
        { icon: '📍', label: 'Saved Addresses', onPress: () => {} },
        { icon: '📞', label: 'Support (WhatsApp)', onPress: () => {} },
        { icon: '⭐', label: 'Rate CampusBite', onPress: () => {} },
        { icon: '📢', label: 'Refer a Friend', onPress: () => {} },
      ].map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>CampusBite v1.0 • Made with ❤️ for UPSA</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { backgroundColor: COLORS.green, padding: 24, paddingTop: 50, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '800', color: COLORS.green },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  roleBadge: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  rewardsCard: { margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 3 },
  rewardsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rewardsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  rewardsPoints: { fontSize: 22, fontWeight: '800', color: COLORS.gold },
  progressBar: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: COLORS.gold, borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.gray },
  redeemBtn: { marginTop: 10, backgroundColor: COLORS.gold, borderRadius: 10, padding: 10, alignItems: 'center' },
  redeemText: { color: COLORS.dark, fontWeight: '700' },
  referralRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  referralLabel: { fontSize: 13, color: COLORS.gray },
  referralCode: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  referralCodeText: { color: COLORS.green, fontWeight: '700', fontSize: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 2, padding: 16, borderRadius: 12 },
  menuIcon: { fontSize: 22, width: 36 },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.dark, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: COLORS.gray },
  logoutBtn: { margin: 16, backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginBottom: 30 },
});

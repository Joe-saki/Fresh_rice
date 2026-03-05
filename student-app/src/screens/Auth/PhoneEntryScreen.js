import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { authAPI } from '../../api/client';

const COLORS = { green: '#1DB954', orange: '#FF6B35', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666', lightGray: '#f5f5f5' };

export default function PhoneEntryScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const fullPhone = phone.startsWith('+233') ? phone : `+233${phone.replace(/^0/, '')}`;
    if (fullPhone.length < 13) return Alert.alert('Invalid Number', 'Enter a valid Ghana phone number');

    setLoading(true);
    try {
      await authAPI.sendOTP(fullPhone);
      navigation.navigate('OTPVerify', { phone: fullPhone });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Enter Your{'\n'}Phone Number</Text>
        <Text style={styles.subtitle}>We'll send you a 6-digit OTP to verify</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.countryCode}>
          <Text style={styles.flag}>🇬🇭</Text>
          <Text style={styles.code}>+233</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="XX XXX XXXX"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSendOTP} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
      </TouchableOpacity>

      <Text style={styles.note}>By continuing, you agree to CampusBite's Terms & Privacy Policy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  emoji: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.dark, textAlign: 'center', lineHeight: 38 },
  subtitle: { fontSize: 15, color: COLORS.gray, marginTop: 8, textAlign: 'center' },
  inputRow: { flexDirection: 'row', marginBottom: 24, borderWidth: 2, borderColor: COLORS.green, borderRadius: 14, overflow: 'hidden' },
  countryCode: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: '#f0fdf4', gap: 4 },
  flag: { fontSize: 20 },
  code: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 16, fontSize: 20, fontWeight: '600', color: COLORS.dark, letterSpacing: 2 },
  btn: { backgroundColor: COLORS.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 3 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  note: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginTop: 24, lineHeight: 18 },
});

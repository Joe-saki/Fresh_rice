// src/screens/Auth/PhoneEntryScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOTP } from '../../api/client';
import { colors } from '../../utils/theme';

export default function PhoneEntryScreen({ navigation, route }) {
  const role = route.params?.role || 'STUDENT';
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const clean = phone.replace(/\s/g, '');
    if (clean.length < 9) return Alert.alert('Invalid Number', 'Enter your 9 or 10 digit Ghanaian number');

    const formatted = clean.startsWith('0') ? `+233${clean.slice(1)}` : `+233${clean}`;
    setLoading(true);
    try {
      await sendOTP(formatted);
      navigation.navigate('OTPVerify', { phone: formatted, role });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = {
    STUDENT: { emoji: '🎓', label: 'Student', color: colors.primary },
    RIDER: { emoji: '🏍️', label: 'Rider', color: colors.secondary },
    VENDOR: { emoji: '🍳', label: 'Vendor', color: colors.accent },
  };
  const info = roleInfo[role] || roleInfo.STUDENT;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <Text style={styles.title}>Sign in as {info.label}</Text>
        <Text style={styles.sub}>Enter your Ghanaian phone number</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>🇬🇭 +233</Text>
          </View>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="XX XXX XXXX"
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: info.color }]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Send OTP →</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>💡 Dev mode: OTP is 123456</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { padding: 32, paddingTop: 48, alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.gray[900] },
  sub: { fontSize: 15, color: colors.gray[500], marginTop: 4 },
  form: { padding: 24 },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  prefix: { backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200], borderRightWidth: 0, borderTopLeftRadius: 14, borderBottomLeftRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  prefixText: { fontSize: 14, fontWeight: '600', color: colors.gray[600] },
  input: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: colors.gray[200], borderTopRightRadius: 14, borderBottomRightRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, color: colors.gray[900] },
  btn: { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 17, fontWeight: '700', color: 'white' },
  hint: { textAlign: 'center', color: colors.gray[400], fontSize: 13, marginTop: 20 },
});

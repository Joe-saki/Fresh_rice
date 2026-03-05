import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../api/client';
import useStore from '../../store/useStore';

const COLORS = { green: '#1DB954', orange: '#FF6B35', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666' };

export default function OTPVerifyScreen({ route, navigation }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isNewUser, setIsNewUser] = useState(false);
  const inputs = useRef([]);
  const { setUser, setToken } = useStore();

  useEffect(() => {
    const t = setInterval(() => setTimer(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const handleInput = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return Alert.alert('Enter OTP', 'Please enter the 6-digit code');

    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(phone, code, name || undefined);
      await setToken(res.data.token);
      setUser(res.data.user);
      navigation.replace('MainTabs');
    } catch (err) {
      if (err.response?.data?.error === 'Name required for new users') {
        setIsNewUser(true);
        Alert.alert('Welcome!', 'Looks like you are new. Please enter your name.');
      } else {
        Alert.alert('Invalid OTP', err.response?.data?.error || 'Wrong code. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to {phone}</Text>
      </View>

      <View style={styles.otpRow}>
        {otp.map((val, idx) => (
          <TextInput
            key={idx}
            ref={(r) => inputs.current[idx] = r}
            style={[styles.otpInput, val && styles.otpFilled]}
            value={val}
            onChangeText={(v) => handleInput(v, idx)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      {isNewUser && (
        <TextInput
          style={styles.nameInput}
          placeholder="Your full name"
          value={name}
          onChangeText={setName}
          autoFocus
        />
      )}

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
      </TouchableOpacity>

      {timer > 0
        ? <Text style={styles.timer}>Resend OTP in {timer}s</Text>
        : <TouchableOpacity onPress={() => { authAPI.sendOTP(phone); setTimer(60); }}>
            <Text style={styles.resend}>Resend OTP</Text>
          </TouchableOpacity>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  back: { paddingTop: 40, paddingBottom: 20 },
  backText: { fontSize: 16, color: COLORS.green, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 15, color: COLORS.gray, marginTop: 8 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  otpInput: { width: 48, height: 56, borderWidth: 2, borderColor: '#ddd', borderRadius: 12, fontSize: 24, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  otpFilled: { borderColor: COLORS.green, backgroundColor: '#f0fdf4' },
  nameInput: { borderWidth: 2, borderColor: COLORS.green, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 20, color: COLORS.dark },
  btn: { backgroundColor: COLORS.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 3 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  timer: { textAlign: 'center', color: COLORS.gray, marginTop: 20, fontSize: 14 },
  resend: { textAlign: 'center', color: COLORS.green, marginTop: 20, fontSize: 15, fontWeight: '600' },
});

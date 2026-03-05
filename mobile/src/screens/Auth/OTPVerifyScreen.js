// src/screens/Auth/OTPVerifyScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyOTP, sendOTP } from '../../api/client';
import { useAuthStore } from '../../store/index';
import { colors } from '../../utils/theme';

export default function OTPVerifyScreen({ navigation, route }) {
  const { phone, role } = route.params;
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState('otp'); // otp | name
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const { login } = useAuthStore();
  const inputRef = useRef();

  useEffect(() => {
    const timer = setInterval(() => setResendTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { data } = await verifyOTP(phone, otp, name || undefined, role);
      if (data.isNewUser && !name) {
        setStep('name');
        setLoading(false);
        return;
      }
      await login(data.token, data.user);
    } catch (err) {
      Alert.alert('Invalid OTP', err.response?.data?.error || 'Please check the code and try again');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) return Alert.alert('Name Required', 'Please enter your name');
    setLoading(true);
    try {
      const { data } = await verifyOTP(phone, otp, name, role);
      await login(data.token, data.user);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await sendOTP(phone);
      setResendTimer(60);
      Alert.alert('Sent!', 'New OTP sent to your phone');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📱</Text>
        {step === 'otp' ? (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.sub}>Sent to {phone}</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.sub}>Create your CampusBite account</Text>
          </>
        )}
      </View>

      <View style={styles.form}>
        {step === 'otp' ? (
          <>
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              placeholder="• • • • • •"
              placeholderTextColor={colors.gray[300]}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: otp.length === 6 ? colors.primary : colors.gray[300] }]}
              onPress={handleVerify}
              disabled={loading || otp.length < 6}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Verify →</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResend} style={styles.resend}>
              <Text style={[styles.resendText, { color: resendTimer > 0 ? colors.gray[400] : colors.primary }]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Kofi Mensah"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: name.trim() ? colors.primary : colors.gray[300] }]}
              onPress={handleRegister}
              disabled={loading || !name.trim()}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Create Account →</Text>}
            </TouchableOpacity>
          </>
        )}
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
  otpInput: { backgroundColor: 'white', borderWidth: 2, borderColor: colors.primary, borderRadius: 16, paddingVertical: 20, textAlign: 'center', fontSize: 32, fontWeight: '700', letterSpacing: 16, color: colors.gray[900], marginBottom: 20 },
  nameInput: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.gray[200], borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, color: colors.gray[900], marginBottom: 20 },
  btn: { borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 17, fontWeight: '700', color: 'white' },
  resend: { alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 15, fontWeight: '600' },
});

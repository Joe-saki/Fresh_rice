import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RiderHomeScreen from './src/screens/HomeScreen';
import ActiveDeliveryScreen from './src/screens/ActiveDeliveryScreen';

// Simple auth screens reused from student app pattern
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { authAPI } from './src/api/client';

const Stack = createStackNavigator();
const COLORS = { green: '#1DB954' };

function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    setLoading(true);
    try {
      const fp = phone.startsWith('+233') ? phone : `+233${phone.replace(/^0/, '')}`;
      await authAPI.sendOTP(fp);
      setPhone(fp);
      setStep('otp');
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(phone, otp, name);
      await AsyncStorage.setItem('rider_token', res.data.token);
      onLogin();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 60, marginBottom: 8 }}>🛵</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 }}>Rider Login</Text>
      <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>CampusBite Campus Deliveries</Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' }}>
        {step === 'phone' ? (
          <>
            <TextInput placeholder="+233XXXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ borderWidth: 1.5, borderColor: COLORS.green, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14 }} />
            <TouchableOpacity onPress={sendOTP} disabled={loading} style={{ backgroundColor: COLORS.green, padding: 16, borderRadius: 12, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput placeholder="Your name" value={name} onChangeText={setName} style={{ borderWidth: 1.5, borderColor: COLORS.green, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 10 }} />
            <TextInput placeholder="6-digit OTP" value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6} style={{ borderWidth: 1.5, borderColor: COLORS.green, borderRadius: 12, padding: 14, fontSize: 20, textAlign: 'center', letterSpacing: 8, marginBottom: 14 }} />
            <TouchableOpacity onPress={verify} disabled={loading} style={{ backgroundColor: COLORS.green, padding: 16, borderRadius: 12, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Verify & Start</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('rider_token').then(t => { if (t) setAuthed(true); setChecking(false); });
  }, []);

  if (checking) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 50 }}>🛵</Text></View>;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={RiderHomeScreen} />
        <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

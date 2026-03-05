// src/screens/Auth/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../utils/theme';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.emoji}>🍚</Text>
          <Text style={styles.appName}>CampusBite</Text>
          <Text style={styles.tagline}>Your Campus Kitchen, Delivered</Text>
          <Text style={styles.sub}>UPSA • Accra, Ghana 🇬🇭</Text>
        </Animated.View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('PhoneEntry', { role: 'STUDENT' })}
          >
            <Text style={styles.primaryBtnText}>🎓  I'm a Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('PhoneEntry', { role: 'RIDER' })}
          >
            <Text style={styles.secondaryBtnText}>🏍️  I'm a Rider</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tertiaryBtn}
            onPress={() => navigation.navigate('PhoneEntry', { role: 'VENDOR' })}
          >
            <Text style={styles.tertiaryBtnText}>🍳  I'm a Vendor</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  inner: { flex: 1, justifyContent: 'space-between', padding: 32 },
  logoSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 16 },
  appName: { fontSize: 42, fontWeight: '800', color: 'white', letterSpacing: -1 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 8, textAlign: 'center' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 8 },
  buttons: { gap: 12 },
  primaryBtn: { backgroundColor: 'white', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: colors.primary },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  secondaryBtnText: { fontSize: 17, fontWeight: '700', color: 'white' },
  tertiaryBtn: { alignItems: 'center', paddingVertical: 12 },
  tertiaryBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
});

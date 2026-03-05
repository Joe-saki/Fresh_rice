import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A' };

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    setTimeout(() => navigation.replace('Onboarding'), 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🍚</Text>
        </View>
        <Text style={styles.appName}>CampusBite</Text>
        <Text style={styles.tagline}>Your Campus Kitchen, Delivered</Text>
      </Animated.View>
      <Text style={styles.footer}>UPSA, Accra 🇬🇭</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center' },
  logo: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 10 },
  logoEmoji: { fontSize: 50 },
  appName: { fontSize: 42, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 8, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 40, fontSize: 14, color: 'rgba(255,255,255,0.7)' }
});

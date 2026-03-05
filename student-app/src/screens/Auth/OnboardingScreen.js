import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const COLORS = { green: '#1DB954', orange: '#FF6B35', gold: '#F5A623', white: '#FFFFFF', dark: '#1A1A1A', gray: '#666' };

const slides = [
  { id: '1', emoji: '🍛', title: 'Campus Food\nDelivered Fast', desc: 'Order jollof, waakye, fufu and more from trusted UPSA vendors. Delivered in 30 minutes!' },
  { id: '2', emoji: '📱', title: 'Pay with\nMobile Money', desc: 'MTN MoMo and Vodafone Cash accepted. No bank card needed — just your phone!' },
  { id: '3', emoji: '🏆', title: 'Earn Bites\nPoints', desc: 'Every order earns you Bites Points. Collect 100 points for a GHS 5 discount!' },
];

export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        renderItem={renderSlide}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => <View key={i} style={[styles.dot, current === i && styles.dotActive]} />)}
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('PhoneEntry')}>
        <Text style={styles.btnText}>{current === slides.length - 1 ? 'Get Started 🚀' : 'Next'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('PhoneEntry')}>
        <Text style={styles.skip}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, alignItems: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 100 },
  emoji: { fontSize: 100, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.dark, textAlign: 'center', lineHeight: 40 },
  desc: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 16, lineHeight: 24 },
  dots: { flexDirection: 'row', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginHorizontal: 4 },
  dotActive: { backgroundColor: COLORS.green, width: 24 },
  btn: { backgroundColor: COLORS.green, paddingHorizontal: 60, paddingVertical: 16, borderRadius: 30, marginBottom: 16 },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  skip: { color: COLORS.gray, fontSize: 15 },
});

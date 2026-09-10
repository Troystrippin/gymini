import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { COLORS } from '../theme/colors';

export default function SplashScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.logo}>◆◆</Text>
        <Text style={styles.brand}>GYMINI</Text>
        <Text style={styles.tagline}>IMPROVE YOUR LIFESTYLE</Text>
        <Text style={styles.description}>
          GYMini aims to help you achieve your fitness goals with personalized workout plans and nutrition guidance.
        </Text>
      </View>
      <Button title="GET STARTED" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'space-between' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 80, color: COLORS.text, fontWeight: 'bold' },
  brand: { color: COLORS.text, fontSize: 40, fontWeight: '900', letterSpacing: 2, marginTop: 20 },
  tagline: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 10, letterSpacing: 1 },
  description: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 24, paddingHorizontal: 20 },
});
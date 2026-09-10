import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function SelectionCard({ icon, title, subtitle, isSelected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: COLORS.primary },
  icon: { fontSize: 28, marginRight: 16 },
  textContainer: { flex: 1 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13 },
});
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function ProgressBar({ step, totalSteps }) {
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < step ? styles.segmentActive : styles.segmentInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.text}>
        {step} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  barContainer: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentInactive: { backgroundColor: COLORS.border },
  text: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 12 },
});
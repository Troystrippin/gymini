import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme";

export default function Stepper({ label, value, onChange, min = 1, step = 1 }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.control,
          { borderColor: colors.border },
          { backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Text style={[styles.btnText, { color: colors.accent }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onChange(value + step)}
        >
          <Text style={[styles.btnText, { color: colors.accent }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  label: { fontSize: 12, marginBottom: 4 },
  control: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  btn: { paddingHorizontal: 12, paddingVertical: 6 },
  btnText: { fontSize: 18 },
  value: {
    fontSize: 15,
    minWidth: 28,
    textAlign: "center",
  },
});
2;

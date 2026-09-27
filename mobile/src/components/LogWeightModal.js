import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../theme/theme";

export default function LogWeightModal({
  visible,
  onClose,
  onSaved,
  initialValue = "",
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState(String(initialValue || ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 20 || numeric > 500) {
      Alert.alert("Invalid weight", "Enter a weight between 20 and 500 kg.");
      return;
    }
    setSaving(true);
    try {
      await onSaved(numeric);
      onClose();
      setValue("");
    } catch (err) {
      Alert.alert(
        "Could not save",
        err.response?.data?.message || err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Log today's weight
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            We'll save this to your history and update your profile.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={value}
              onChangeText={(v) => setValue(v.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="e.g. 72.5"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              autoFocus
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>
              kg
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  opacity: saving ? 0.6 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  Save
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 24,
  },
  card: { borderRadius: 18, padding: 20 },
  title: { fontSize: 20, fontWeight: "800" },
  hint: { fontSize: 13, marginTop: 6 },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 20,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: "700",
  },
  unit: { fontSize: 16, fontWeight: "700", marginLeft: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  btn: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
});
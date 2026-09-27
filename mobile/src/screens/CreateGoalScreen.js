import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/theme";
import { goalsApi } from "../api/goalsApi";

const TYPES = [
  { key: "weight", label: "Weight Goal", unit: "kg" },
  { key: "workout_frequency", label: "Workout Frequency", unit: "× / week" },
];

export default function CreateGoalScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const editingGoal = route.params?.goal || null;

  const [type, setType] = useState(editingGoal?.type || "weight");
  const [target, setTarget] = useState(
    editingGoal?.target != null ? String(editingGoal.target) : "",
  );
  const [saving, setSaving] = useState(false);

  const activeType = TYPES.find((t) => t.key === type) || TYPES[0];

  const handleSave = async () => {
    const numeric = Number(target);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      Alert.alert("Invalid target", "Enter a number greater than 0.");
      return;
    }
    setSaving(true);
    try {
      if (editingGoal) {
        await goalsApi.update(editingGoal._id, { target: numeric });
      } else {
        await goalsApi.create({ type, target: numeric });
      }
      navigation.goBack();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>
            ← Back
          </Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>
          {editingGoal ? "Edit Goal" : "Set a Goal"}
        </Text>

        {!editingGoal && (
          <>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              GOAL TYPE
            </Text>
            <View style={styles.chipRow}>
              {TYPES.map((t) => {
                const active = t.key === type;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setType(t.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.cardBackground,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? "#FFF" : colors.text,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text
          style={[
            styles.fieldLabel,
            { color: colors.textSecondary, marginTop: 20 },
          ]}
        >
          {type === "weight" ? "TARGET WEIGHT" : "SESSIONS PER WEEK"}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            value={target}
            onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
            placeholder={type === "weight" ? "e.g. 70" : "e.g. 4"}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            autoFocus
          />
          <Text style={[styles.unit, { color: colors.textSecondary }]}>
            {activeType.unit}
          </Text>
        </View>

        {type === "weight" && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            We'll start tracking from your current weight.
          </Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>
              {editingGoal ? "Save Changes" : "Create Goal"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { fontSize: 15, fontWeight: "700", marginBottom: 24 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputRow: { alignItems: "center", flexDirection: "row" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unit: { fontSize: 15, fontWeight: "700", marginLeft: 10 },
  hint: { fontSize: 12, marginTop: 10 },
  saveBtn: {
    alignItems: "center",
    borderRadius: 12,
    marginTop: 28,
    padding: 16,
  },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
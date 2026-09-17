import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const MEAL_TYPE_ICONS = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

export default function MealDetailModal({
  meal,
  visible,
  onClose,
  isAdded,
  onToggle,
  colors,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {meal && (
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {meal.image ? (
                <Image
                  source={
                    typeof meal.image === "string"
                      ? { uri: meal.image }
                      : meal.image
                  }
                  style={styles.media}
                />
              ) : (
                <LinearGradient
                  colors={[colors.cardBackground, colors.background]}
                  style={styles.media}
                >
                  <Text style={styles.mediaIcon}>
                    {MEAL_TYPE_ICONS[meal.type?.toLowerCase()] || "🍴"}
                  </Text>
                  <Text
                    style={[
                      styles.mediaPlaceholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {meal.type}
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.body}>
                <Text style={[styles.type, { color: colors.textSecondary }]}>
                  {meal.type.toUpperCase()}
                </Text>
                <Text style={[styles.title, { color: colors.text }]}>
                  {meal.name}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {meal.goal} · {meal.protein} · {meal.calories}
                </Text>

                <Text style={[styles.description, { color: colors.text }]}>
                  {meal.description || "No description provided."}
                </Text>

                <Pressable
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: isAdded
                        ? colors.cardBackground
                        : colors.primary,
                      borderWidth: isAdded ? 1 : 0,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={onToggle}
                >
                  <Text
                    style={[
                      styles.addButtonText,
                      { color: isAdded ? colors.textSecondary : "#FFFFFF" },
                    ]}
                  >
                    {isAdded ? "Remove from Plan" : "Add to Plan"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  media: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
    width: "100%",
  },
  mediaIcon: { fontSize: 48, marginBottom: 8 },
  mediaPlaceholderText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  body: { padding: 20 },
  type: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: "800", marginTop: 6 },
  meta: { fontSize: 14, marginTop: 6 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 18 },
  addButton: {
    alignItems: "center",
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 15,
  },
  addButtonText: { fontSize: 15, fontWeight: "800" },
});

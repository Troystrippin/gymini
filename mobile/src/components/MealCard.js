import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MEAL_TYPE_ICONS = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

export default function MealCard({
  meal,
  selected,
  onPress,
  onDetailsPress,
  colors,
  actionLabel,
}) {
  const calLabel =
    typeof meal.calories === "number"
      ? `${meal.calories} kcal`
      : meal.calories;
  const proteinLabel =
    typeof meal.protein === "number"
      ? `${meal.protein}g`
      : meal.protein;

  return (
    <Pressable
      onPress={() => onDetailsPress && onDetailsPress(meal)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {meal.image ? (
        <Image
          source={
            typeof meal.image === "string" ? { uri: meal.image } : meal.image
          }
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.thumbnail,
            styles.placeholder,
            { backgroundColor: colors.border },
          ]}
        >
          <Text style={styles.placeholderIcon}>
            {MEAL_TYPE_ICONS[meal.type?.toLowerCase()] || "🍴"}
          </Text>
          <Text
            style={[styles.placeholderLabel, { color: colors.textSecondary }]}
          >
            {meal.type}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.type, { color: colors.textSecondary }]}>
          {meal.type?.toUpperCase()}
        </Text>
        <Text style={[styles.name, { color: colors.text }]}>{meal.name}</Text>
        <Text style={[styles.nutrition, { color: colors.textSecondary }]}>
          {meal.goal ? `${meal.goal} · ` : ""}
          {proteinLabel ? `${proteinLabel} protein · ` : ""}
          {calLabel}
        </Text>
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onPress && onPress();
        }}
        activeOpacity={0.75}
        accessibilityRole="button"
        style={[
          styles.actionButton,
          {
            backgroundColor: selected ? colors.cardBackground : colors.primary,
            borderColor: colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.actionButtonText,
            { color: selected ? colors.primary : "#FFFFFF" },
          ]}
        >
          {actionLabel || (selected ? "Added" : "Add")}
        </Text>
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: { fontSize: 18 },
  placeholderLabel: {
    fontSize: 7,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  info: { flex: 1 },
  type: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  name: { fontSize: 15, fontWeight: "700", marginTop: 5 },
  nutrition: { fontSize: 12, marginTop: 4 },
  actionButton: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 9,
    justifyContent: "center",
    marginLeft: 10,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionButtonText: { fontSize: 11, fontWeight: "800" },
});
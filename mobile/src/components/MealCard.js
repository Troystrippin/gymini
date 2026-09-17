import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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
  return (
    <Pressable
      onPress={() => onDetailsPress(meal)}
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
          {meal.type.toUpperCase()}
        </Text>
        <Text style={[styles.name, { color: colors.text }]}>{meal.name}</Text>
        <Text style={[styles.goal, { color: colors.textSecondary }]}>
          {meal.goal} · {meal.protein}
        </Text>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onPress();
        }}
        hitSlop={10}
        style={styles.rightColumn}
      >
        <Text style={[styles.selected, { color: colors.primary }]}>
          {actionLabel || (selected ? "Added" : "Add")}
        </Text>
        <Text style={[styles.calories, { color: colors.primary }]}>
          {meal.calories}
        </Text>
      </Pressable>
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
  placeholderIcon: {
    fontSize: 18,
  },
  placeholderLabel: {
    fontSize: 7,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  info: { flex: 1 },
  type: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  name: { fontSize: 15, fontWeight: "700", marginTop: 5 },
  goal: { fontSize: 12, marginTop: 4 },
  rightColumn: { alignItems: "flex-end", marginLeft: 10 },
  selected: { fontSize: 11, fontWeight: "800", marginBottom: 4 },
  calories: { fontSize: 12, fontWeight: "700", marginLeft: 10 },
});

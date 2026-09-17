import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SELECTED_MEALS_KEY } from "../data/mealPlans";
import { useTheme } from "../theme/theme";

const MEAL_TYPE_ICONS = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

export default function MealDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { meal } = route.params;

  const [selectedIds, setSelectedIds] = useState([]);
  const isAdded = selectedIds.includes(meal.id);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SELECTED_MEALS_KEY).then((storedIds) => {
        setSelectedIds(storedIds ? JSON.parse(storedIds) : []);
      });
    }, []),
  );

  const toggleMeal = async () => {
    try {
      const nextIds = isAdded
        ? selectedIds.filter((id) => id !== meal.id)
        : [...selectedIds, meal.id];
      await AsyncStorage.setItem(SELECTED_MEALS_KEY, JSON.stringify(nextIds));
      setSelectedIds(nextIds);
    } catch (error) {
      Alert.alert("Update failed", "Could not update your meal plan.");
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => navigation.goBack()}
      />

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
                {MEAL_TYPE_ICONS[meal.type] || "🍴"}
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
              onPress={toggleMeal}
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
    </View>
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

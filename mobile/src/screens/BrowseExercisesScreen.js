import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { usePlanDraft } from "../../context/PlanDraftContext";

// TODO: replace with GET /api/exercises once backend integration resumes.
// mediaUrl left null for now — falls back to gradient placeholder until
// the catalog actually serves images/video.
const MOCK_EXERCISES = [
  {
    _id: "1",
    name: "Barbell Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    mediaUrl: null,
    description:
      "Lie on a flat bench, lower the bar to mid-chest, press back up to full extension. Targets pecs, front delts, and triceps.",
  },
  {
    _id: "2",
    name: "Pull-Up",
    muscleGroup: "Back",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    mediaUrl: null,
    description:
      "Hang from a bar with an overhand grip, pull your chin above the bar, lower under control. Builds lats and biceps.",
  },
  {
    _id: "3",
    name: "Barbell Squat",
    muscleGroup: "Legs",
    equipment: "Barbell",
    difficulty: "Intermediate",
    mediaUrl: null,
    description:
      "Bar on upper back, squat until thighs are parallel to the floor, drive back up. Hits quads, glutes, and hamstrings.",
  },
  {
    _id: "4",
    name: "Dumbbell Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbell",
    difficulty: "Beginner",
    mediaUrl: null,
    description:
      "Press dumbbells overhead from shoulder height until arms are extended, lower with control. Targets delts and triceps.",
  },
  {
    _id: "5",
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    mediaUrl: null,
    description:
      "Hold a straight-body position on forearms and toes, keeping hips level. Builds core and shoulder stability.",
  },
  {
    _id: "6",
    name: "Deadlift",
    muscleGroup: "Back",
    equipment: "Barbell",
    difficulty: "Advanced",
    mediaUrl: null,
    description:
      "Hinge at the hips to lift a loaded bar from the floor to standing, keeping the back flat throughout. Full posterior chain.",
  },
];

const CATEGORIES = ["All", "Chest", "Back", "Legs", "Shoulders", "Core"];

export default function BrowseExercisesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addExercise, isInDraft } = usePlanDraft();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeExercise, setActiveExercise] = useState(null); // exercise shown in modal

  const filtered = useMemo(() => {
    return MOCK_EXERCISES.filter((ex) => {
      const matchesCategory = category === "All" || ex.muscleGroup === category;
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const handleAdd = (exercise) => {
    addExercise(exercise);
    setActiveExercise(null);
  };

  const renderExercise = ({ item }) => {
    const added = isInDraft(item._id);
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setActiveExercise(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {item.muscleGroup} · {item.equipment}
          </Text>
        </View>
        {added && (
          <View style={[styles.addedBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.addedBadgeText}>Added</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>
            Done
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add Exercises
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search exercises"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.searchInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.card,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#000" : colors.text },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises match your search.
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!activeExercise}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveExercise(null)}
          />
          {activeExercise && (
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[styles.modalHandle, { backgroundColor: colors.border }]}
              />

              {activeExercise.mediaUrl ? (
                <Image
                  source={{ uri: activeExercise.mediaUrl }}
                  style={styles.media}
                />
              ) : (
                <LinearGradient
                  colors={[colors.card, colors.background]}
                  style={styles.media}
                >
                  <Text
                    style={[
                      styles.mediaPlaceholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {activeExercise.muscleGroup}
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {activeExercise.name}
                </Text>
                <Text
                  style={[styles.modalMeta, { color: colors.textSecondary }]}
                >
                  {activeExercise.muscleGroup} · {activeExercise.equipment} ·{" "}
                  {activeExercise.difficulty}
                </Text>
                <Text style={[styles.modalDescription, { color: colors.text }]}>
                  {activeExercise.description}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.modalAddBtn,
                    {
                      backgroundColor: isInDraft(activeExercise._id)
                        ? colors.card
                        : colors.accent,
                      borderWidth: isInDraft(activeExercise._id) ? 1 : 0,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleAdd(activeExercise)}
                  disabled={isInDraft(activeExercise._id)}
                >
                  <Text
                    style={[
                      styles.modalAddBtnText,
                      {
                        color: isInDraft(activeExercise._id)
                          ? colors.textSecondary
                          : "#000",
                      },
                    ]}
                  >
                    {isInDraft(activeExercise._id)
                      ? "Already Added"
                      : "Add to Plan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBtn: { fontFamily: "SpaceGrotesk-Regular", fontSize: 15, width: 40 },
  headerTitle: { fontFamily: "SpaceGrotesk-Regular", fontSize: 17 },
  searchInput: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 15,
    marginBottom: 14,
  },
  chipRow: { flexGrow: 0, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: { fontFamily: "SpaceGrotesk-Regular", fontSize: 13 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: "SpaceGrotesk-Regular", fontSize: 15 },
  cardMeta: { fontFamily: "SpaceGrotesk-Regular", fontSize: 12, marginTop: 2 },
  addedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  addedBadgeText: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 11,
    color: "#000",
    fontWeight: "600",
  },
  emptyState: { paddingTop: 60, alignItems: "center", paddingHorizontal: 30 },
  emptyText: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 14,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  media: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPlaceholderText: { fontFamily: "SpaceGrotesk-Regular", fontSize: 14 },
  modalBody: { padding: 20 },
  modalTitle: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 20,
    marginBottom: 4,
  },
  modalMeta: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 13,
    marginBottom: 14,
  },
  modalDescription: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalAddBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  modalAddBtnText: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 15,
    fontWeight: "600",
  },
});

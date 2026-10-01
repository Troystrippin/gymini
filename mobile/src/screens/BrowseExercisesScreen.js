import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/theme";
import { usePlanDraft } from "../context/PlanDraftContext";
import api from "../api/api";
import FavoriteButton from "../components/FavoriteButton";

const CATEGORIES = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Core",
  "Arms",
  "Cardio",
  "Custom",
];

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Core",
  "Arms",
  "Full Body",
  "Cardio",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function BrowseExercisesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const accentTextColor = "#FFFFFF";
  const { addExercise, removeExercise, isInDraft, draftExercises } =
    usePlanDraft();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [activeExercise, setActiveExercise] = useState(null);

  const [customVisible, setCustomVisible] = useState(false);
  const [cName, setCName] = useState("");
  const [cGroup, setCGroup] = useState("Chest");
  const [cEquip, setCEquip] = useState("Bodyweight");
  const [cDiff, setCDiff] = useState("Beginner");
  const [cDesc, setCDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchExercises = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await api.get("/exercises");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.exercises)
          ? res.data.exercises
          : [];
      setExercises(list);
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message);
      setExercises([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExercises();
  };

  const filtered = useMemo(() => {
    const list = Array.isArray(exercises) ? exercises : [];
    return list.filter((ex) => {
      const matchesCategory =
        category === "All"
          ? true
          : category === "Custom"
            ? ex.isCustom
            : ex.muscleGroup === category;
      const matchesSearch = (ex.name || "")
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [exercises, search, category]);

  const toggleAdd = (exercise) => {
    if (isInDraft(exercise._id)) {
      removeExercise(exercise._id);
    } else {
      addExercise(exercise);
    }
  };

  const handleCreateCustom = async () => {
    if (!cName.trim()) {
      Alert.alert("Missing name", "Please enter an exercise name.");
      return;
    }
    try {
      setCreating(true);
      const res = await api.post("/exercises", {
        name: cName.trim(),
        muscleGroup: cGroup,
        equipment: cEquip.trim() || "Bodyweight",
        difficulty: cDiff,
        description: cDesc.trim(),
      });
      setExercises((prev) => [res.data, ...prev]);
      addExercise(res.data);
      setCustomVisible(false);
      setCName("");
      setCGroup("Chest");
      setCEquip("Bodyweight");
      setCDiff("Beginner");
      setCDesc("");
    } catch (err) {
      const data = err.response?.data;
      let msg;
      if (data?.errors && Array.isArray(data.errors)) {
        msg =
          `${data.message || "Could not create exercise"}:\n\n` +
          data.errors.map((e) => `- ${e.field}: ${e.message}`).join("\n");
      } else {
        msg = data?.message || err.message || "Something went wrong";
      }
      Alert.alert("Could not create exercise", msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDone = () => {
    navigation.goBack();
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
            {item.muscleGroup} - {item.equipment}
            {item.isCustom ? " - Custom" : ""}
          </Text>
        </View>
        <FavoriteButton exerciseId={item._id} size={20} />
        <TouchableOpacity
          onPress={() => toggleAdd(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.toggleBadge,
            {
              backgroundColor: added ? colors.accent : "transparent",
              borderColor: added ? colors.accent : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.toggleBadgeText,
              { color: added ? accentTextColor : colors.text },
            ]}
          >
            {added ? "Added" : "Add"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCategoryChip = ({ item: cat }) => {
    const active = category === cat;
    return (
      <TouchableOpacity
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
            { color: active ? accentTextColor : colors.text },
          ]}
        >
          {cat}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMuscleGroupChip = ({ item: g }) => {
    const active = cGroup === g;
    return (
      <TouchableOpacity
        onPress={() => setCGroup(g)}
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
            { color: active ? accentTextColor : colors.text },
          ]}
        >
          {g}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDifficultyChip = (d) => {
    const active = cDiff === d;
    return (
      <TouchableOpacity
        key={d}
        onPress={() => setCDiff(d)}
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
            { color: active ? accentTextColor : colors.text },
          ]}
        >
          {d}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone}>
          <Text style={[styles.headerBtn, { color: colors.textSecondary }]}>
            {draftExercises.length > 0
              ? `Done (${draftExercises.length})`
              : "Done"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add Exercises
        </Text>
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Favorites")}
            style={styles.favoritesHeaderBtn}
          >
            <Text style={styles.favoritesHeaderIcon}>{"\u2605"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCustomVisible(true)}>
            <Text
              style={[
                styles.headerBtn,
                { color: colors.accent, textAlign: "right" },
              ]}
            >
              + Custom
            </Text>
          </TouchableOpacity>
        </View>
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

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(cat) => cat}
        extraData={category}
        renderItem={renderCategoryChip}
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.loader}
        />
      ) : loadError ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {`Couldn't load exercises: ${loadError}`}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            onPress={fetchExercises}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderExercise}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                No exercises match your search.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={customVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCustomVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.border }]}
            />
            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Create Custom Exercise
              </Text>

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Name
              </Text>
              <TextInput
                value={cName}
                onChangeText={setCName}
                placeholder="e.g. Cable Fly"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Muscle Group
              </Text>
              <FlatList
                horizontal
                data={MUSCLE_GROUPS}
                keyExtractor={(g) => g}
                extraData={cGroup}
                renderItem={renderMuscleGroupChip}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.muscleGroupList}
              />

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Equipment
              </Text>
              <TextInput
                value={cEquip}
                onChangeText={setCEquip}
                placeholder="e.g. Dumbbell"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Difficulty
              </Text>
              <View style={styles.chipRowInline}>
                {DIFFICULTIES.map(renderDifficultyChip)}
              </View>

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Description (optional)
              </Text>
              <TextInput
                value={cDesc}
                onChangeText={setCDesc}
                placeholder="How to perform it..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.modalAddBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity: creating ? 0.6 : 1,
                  },
                ]}
                onPress={handleCreateCustom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={accentTextColor} />
                ) : (
                  <Text
                    style={[
                      styles.modalAddBtnText,
                      { color: accentTextColor },
                    ]}
                  >
                    Create & Add to Plan
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCustomVisible(false)}
                style={styles.cancelWrap}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
          {activeExercise ? (
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHandle,
                  { backgroundColor: colors.border },
                ]}
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
                <View style={styles.modalTitleRow}>
                  <Text
                    style={[
                      styles.modalTitle,
                      styles.modalTitleFlex,
                      { color: colors.text },
                    ]}
                  >
                    {activeExercise.name}
                  </Text>
                  <FavoriteButton
                    exerciseId={activeExercise._id}
                    size={28}
                  />
                </View>
                <Text
                  style={[styles.modalMeta, { color: colors.textSecondary }]}
                >
                  {activeExercise.muscleGroup} - {activeExercise.equipment} -{" "}
                  {activeExercise.difficulty}
                </Text>
                <Text
                  style={[styles.modalDescription, { color: colors.text }]}
                >
                  {activeExercise.description || "No description provided."}
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
                  onPress={() => {
                    toggleAdd(activeExercise);
                    setActiveExercise(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalAddBtnText,
                      {
                        color: isInDraft(activeExercise._id)
                          ? colors.textSecondary
                          : accentTextColor,
                      },
                    ]}
                  >
                    {isInDraft(activeExercise._id)
                      ? "Remove from Plan"
                      : "Add to Plan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
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
  headerBtn: {
    fontSize: 15,
    minWidth: 60,
  },
  headerTitle: { fontSize: 17 },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoritesHeaderBtn: { marginRight: 14 },
  favoritesHeaderIcon: { fontSize: 18, color: "#f5a623" },

  searchInput: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },

  chipRow: { flexGrow: 0, flexShrink: 0, marginBottom: 14 },
  chipRowContent: { paddingHorizontal: 20 },
  chipRowInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13 },

  listContainer: { flex: 1 },
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
  cardName: { fontSize: 15 },
  cardMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  toggleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  loader: { marginTop: 60 },

  emptyState: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryBtnText: { color: "#FFFFFF", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "90%",
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
  mediaPlaceholderText: {
    fontSize: 14,
  },
  modalBody: { padding: 20 },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalTitleFlex: { flex: 1 },
  modalMeta: {
    fontSize: 13,
    marginBottom: 14,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalAddBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  modalAddBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  cancelWrap: { marginTop: 12, alignItems: "center" },

  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  muscleGroupList: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 14,
  },
});
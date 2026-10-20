import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Image,
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/theme";
import { usePlanDraft } from "../context/PlanDraftContext";
import api from "../api/api";
import { exercisesApi } from "../api/exercises";
import FavoriteButton from "../components/FavoriteButton";
import ExerciseDetailModal from "../components/ExerciseDetailModal";

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

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function BrowseExercisesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const accentTextColor = "#FFFFFF";
  const { addExercise, removeExercise, isInDraft, draftExercises } =
    usePlanDraft();

  const [exercises, setExercises] = useState([]);
  const [favoritedExerciseIds, setFavoritedExerciseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState([]);
  const [equipmentFilter, setEquipmentFilter] = useState([]);

  const [draftCategory, setDraftCategory] = useState([]);
  const [draftEquipment, setDraftEquipment] = useState([]);

  const [muscleGroupModalVisible, setMuscleGroupModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);

  const [activeExercise, setActiveExercise] = useState(null);
  const [customVisible, setCustomVisible] = useState(false);
  const [cName, setCName] = useState("");
  const [cGroup, setCGroup] = useState("Chest");
  const [cEquip, setCEquip] = useState("Bodyweight");
  const [cDiff, setCDiff] = useState("Beginner");
  const [cDesc, setCDesc] = useState("");
  const [cImage, setCImage] = useState(null);
  const [creating, setCreating] = useState(false);

  const equipmentOptions = useMemo(
    () => [
      "All",
      ...new Set(
        exercises
          .map((exercise) => exercise.equipment)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
      ),
    ],
    [exercises],
  );

  const toggleDraftCategory = (option) => {
    setDraftCategory((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  };

  const toggleDraftEquipment = (option) => {
    if (option === "All") {
      setDraftEquipment([]);
      return;
    }

    setDraftEquipment((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  };

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
      setLoading(false);
      if (list.length === 0) {
        setFavoritedExerciseIds(new Set());
        return;
      }
      try {
        const favoriteData = await exercisesApi.favoriteStatuses(
          list.map((exercise) => exercise._id).filter(Boolean),
        );
        setFavoritedExerciseIds(
          new Set(favoriteData.favoritedExerciseIds || []),
        );
      } catch (favoriteError) {
        console.warn(
          "[favorite] batch status failed",
          favoriteError?.response?.status,
          favoriteError?.response?.data || favoriteError?.message,
        );
        setFavoritedExerciseIds(new Set());
      }
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
    const normalizedSearch = search.trim().toLowerCase();
    const selectedCategories = new Set(category);
    const selectedEquipment = new Set(equipmentFilter);

    return list.filter((ex) => {
      const matchesCategory =
        selectedCategories.size === 0 ||
        (selectedCategories.has("Custom") && ex.isCustom) ||
        selectedCategories.has(ex.muscleGroup);

      const matchesEquipment =
        selectedEquipment.size === 0 || selectedEquipment.has(ex.equipment);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        (ex.name || "").toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesEquipment && matchesSearch;
    });
  }, [exercises, search, category, equipmentFilter]);

  const toggleAdd = (exercise) => {
    if (isInDraft(exercise._id)) {
      removeExercise(exercise._id);
    } else {
      addExercise(exercise);
    }
  };

  const updateFavoriteStatus = (exerciseId, favorited) => {
    setFavoritedExerciseIds((current) => {
      const updated = new Set(current);
      if (favorited) updated.add(exerciseId);
      else updated.delete(exerciseId);
      return updated;
    });
  };

  const chooseExerciseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo access to add an exercise image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) setCImage(result.assets[0]);
  };

  const handleCreateCustom = async () => {
    if (!cName.trim()) {
      Alert.alert("Missing name", "Please enter an exercise name.");
      return;
    }
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append("name", cName.trim());
      formData.append("muscleGroup", cGroup);
      formData.append("equipment", cEquip.trim() || "Bodyweight");
      formData.append("difficulty", cDiff);
      formData.append("description", cDesc.trim());
      if (cImage) {
        formData.append("image", {
          uri: cImage.uri,
          name: cImage.fileName || "exercise.jpg",
          type: cImage.mimeType || "image/jpeg",
        });
      }
      const res = await api.post("/exercises", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setExercises((prev) => [res.data, ...prev]);
      addExercise(res.data);
      setCustomVisible(false);
      setCName("");
      setCGroup("Chest");
      setCEquip("Bodyweight");
      setCDiff("Beginner");
      setCDesc("");
      setCImage(null);
      Alert.alert(
        "Submitted for review",
        "Your custom exercise was created and is pending admin approval. It will be visible to other users once approved.",
      );
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
          <View style={styles.cardMetaRow}>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {item.muscleGroup} - {item.equipment}
            </Text>
            {item.isCustom && item.status === "pending" && (
              <Text style={styles.pendingPill}>⏳ PENDING</Text>
            )}
            {item.isCustom && item.status === "rejected" && (
              <Text style={styles.rejectedPill}>🚫 REJECTED</Text>
            )}
          </View>
        </View>
        <FavoriteButton
          exerciseId={item._id}
          size={20}
          initialFavorited={favoritedExerciseIds.has(item._id)}
          onFavoriteChange={(favorited) =>
            updateFavoriteStatus(item._id, favorited)
          }
        />
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
      edges={["top", "left", "right", "bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Browse Exercises
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {filtered.length} exercises
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Favorites")}
          activeOpacity={0.7}
          accessibilityLabel="Favorites"
          style={[
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={styles.favoritesHeaderIcon}>{"\u2605"}</Text>
        </TouchableOpacity>
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
      <View style={styles.filterButtonRow}>
        <TouchableOpacity
          onPress={() => {
            setDraftCategory(category);
            setMuscleGroupModalVisible(true);
          }}
          style={[
            styles.filterButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            Muscle Group
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setDraftEquipment(equipmentFilter);
            setEquipmentModalVisible(true);
          }}
          style={[
            styles.filterButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            Equipment
          </Text>
        </TouchableOpacity>
      </View>

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
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No exercises match your search.
              </Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCustomVisible(true)}
          style={[styles.customButton, { borderColor: colors.accent }]}
        >
          <Text style={[styles.customButtonText, { color: colors.accent }]}>
            + Custom
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleDone}
          style={[styles.doneButton, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.doneButtonText, { color: accentTextColor }]}>
            {draftExercises.length > 0
              ? `Done (${draftExercises.length})`
              : "Done"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={muscleGroupModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMuscleGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMuscleGroupModalVisible(false)}
          />

          <View
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.border }]}
            />

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter by muscle group
              </Text>

              <View style={styles.filterOptions}>
                {CATEGORIES.filter((option) => option !== "All").map(
                  (option) => {
                    const selected = draftCategory.includes(option);

                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => toggleDraftCategory(option)}
                        style={[
                          styles.filterOption,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : colors.card,
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            {
                              color: selected ? "#FFFFFF" : colors.text,
                              fontWeight: selected ? "700" : "400",
                            },
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>

              <View style={styles.filterModalActions}>
                <TouchableOpacity
                  onPress={() => setDraftCategory([])}
                  style={[styles.filterAction, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text }}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setCategory(draftCategory);
                    setMuscleGroupModalVisible(false);
                  }}
                  style={[
                    styles.filterAction,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={equipmentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEquipmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEquipmentModalVisible(false)}
          />

          <View
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.border }]}
            />

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter by equipment
              </Text>

              <View style={styles.filterOptions}>
                {equipmentOptions.map((option) => {
                  const selected =
                    option === "All"
                      ? draftEquipment.length === 0
                      : draftEquipment.includes(option);

                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => toggleDraftEquipment(option)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.card,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: selected ? "#FFFFFF" : colors.text,
                            fontWeight: selected ? "700" : "400",
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.filterModalActions}>
                <TouchableOpacity
                  onPress={() => setDraftEquipment([])}
                  style={[styles.filterAction, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text }}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEquipmentFilter(draftEquipment);
                    setEquipmentModalVisible(false);
                  }}
                  style={[
                    styles.filterAction,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                showsHorizontalScrollIndicator={false}
                data={CATEGORIES.filter((c) => c !== "All" && c !== "Custom")}
                keyExtractor={(item) => item}
                renderItem={renderMuscleGroupChip}
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

              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Exercise image (optional)
              </Text>
              <TouchableOpacity
                onPress={chooseExerciseImage}
                style={[
                  styles.input,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                {cImage ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Image
                      source={{ uri: cImage.uri }}
                      style={{ width: 48, height: 48, borderRadius: 6 }}
                    />
                    <Text style={{ color: colors.text }}>Change image</Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.textSecondary }}>
                    Choose image
                  </Text>
                )}
              </TouchableOpacity>

              <View style={[styles.infoNote, { borderColor: colors.border }]}>
                <Text
                  style={[styles.infoNoteText, { color: colors.textSecondary }]}
                >
                  Your custom exercise will be reviewed by an admin before it's
                  visible to other users.
                </Text>
              </View>

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
                    style={[styles.modalAddBtnText, { color: accentTextColor }]}
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

      <ExerciseDetailModal
        visible={!!activeExercise}
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
        favorited={favoritedExerciseIds.has(activeExercise?._id)}
        onFavoriteChange={(favorited) =>
          activeExercise && updateFavoriteStatus(activeExercise._id, favorited)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTextWrap: { flex: 1, marginRight: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  favoritesHeaderIcon: { fontSize: 20, color: "#f5a623" },

  searchInput: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },

  filterButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  filterButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  filterModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  filterAction: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },
  filterOption: {
    width: "48%",
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  filterOptionText: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    marginRight: 8,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
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
  list: { paddingHorizontal: 20, paddingBottom: 20 },
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
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
  },
  pendingPill: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FB8C00",
    backgroundColor: "rgba(251,140,0,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    letterSpacing: 0.5,
    overflow: "hidden",
  },
  rejectedPill: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E53935",
    backgroundColor: "rgba(229,57,53,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    letterSpacing: 0.5,
    overflow: "hidden",
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
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  customButton: {
    minHeight: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 12,
  },
  customButtonText: { fontSize: 13, fontWeight: "700" },
  doneButton: {
    minHeight: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  doneButtonText: { fontSize: 13, fontWeight: "800" },

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
  modalBody: { padding: 20 },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
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
  infoNote: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: "rgba(251,140,0,0.08)",
  },
  infoNoteText: {
    fontSize: 12,
    lineHeight: 16,
  },
});

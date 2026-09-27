import React, { useContext, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import ProgressStatCard from "../components/ProgressStatCard";
import LogWeightModal from "../components/LogWeightModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/theme";
import { analyticsApi } from "../api/analyticsApi";
import { weightApi } from "../api/weightApi";
import { mealApi } from "../api/mealApi";
import { useMealPlan } from "../context/MealPlanContext";

import WeightIcon from "../icons/weight-icon";
import BmiIcon from "../icons/BMI-icon";
import WorkoutIcon from "../icons/WorkOutIcon";
import BurnIcon from "../icons/BurnIcon";

const screenWidth = Dimensions.get("window").width - 68;

export default function ProgressScreen() {
  const { user, refreshUser } = useContext(AuthContext);
  const { colors, mode } = useTheme();
  const { totals } = useMealPlan();

  const [activeTab, setActiveTab] = useState("weight");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [mealStats, setMealStats] = useState(null);
  const [showLogWeight, setShowLogWeight] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [a, m] = await Promise.all([
        analyticsApi.progress().catch(() => null),
        mealApi.stats().catch(() => null),
      ]);
      setAnalytics(a);
      setMealStats(m);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const summary = analytics?.summary || {};
  const weight = summary.currentWeightKg ?? user?.details?.weightKg ?? null;
  const bmi = summary.latestBmi ?? null;
  const bmiRange = summary.bmiCategory || null;
  const weightChange30d = summary.weightChange30d;

  const colorIndicator = !bmi
    ? "#B0BEC5"
    : bmi < 18.5
      ? "#2196F3"
      : bmi < 25
        ? "#4CAF50"
        : bmi < 30
          ? "#FF9800"
          : bmi < 40
            ? "#F44336"
            : "#7B1FA2";

  const weightState = (() => {
    if (weightChange30d === null || weightChange30d === undefined) return "";
    if (Math.abs(weightChange30d) < 0.1) return "No changes (30d)";
    return weightChange30d < 0
      ? `Lost ${Math.abs(weightChange30d).toFixed(1)} kg (30d)`
      : `Gained ${weightChange30d.toFixed(1)} kg (30d)`;
  })();

  const weightSeries = analytics?.weightSeries || [];
  const weightLabels = weightSeries.map((p) => {
    const [, mm, dd] = p.date.split("-");
    return `${mm}/${dd}`;
  });
  const weightValues = weightSeries.map((p) => p.weightKg);

  const workoutsByMonth = analytics?.workoutsByMonth || [];
  const caloriesByMonth = analytics?.caloriesByMonth || [];

  const charts = {
    weight: {
      data: {
        labels: weightLabels.length ? weightLabels : ["—"],
        datasets: [{ data: weightValues.length ? weightValues : [0] }],
      },
      type: "line",
      color: "rgba(0, 255, 17, $o)",
      decimalPlaces: 1,
    },
    workouts: {
      data: {
        labels: workoutsByMonth.length
          ? workoutsByMonth.map((b) => b.label)
          : ["—"],
        datasets: [
          {
            data: workoutsByMonth.length
              ? workoutsByMonth.map((b) => b.value)
              : [0],
          },
        ],
      },
      type: "bar",
      color: "rgba(130, 151, 205, $o)",
      decimalPlaces: 0,
    },
    calories: {
      data: {
        labels: caloriesByMonth.length
          ? caloriesByMonth.map((b) => b.label)
          : ["—"],
        datasets: [
          {
            data: caloriesByMonth.length
              ? caloriesByMonth.map((b) => b.value)
              : [0],
          },
        ],
      },
      type: "bar",
      color: "rgba(254, 110, 0, $o)",
      decimalPlaces: 0,
    },
  };

  const activeChart = charts[activeTab];

  const chartConfig = {
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: activeChart.decimalPlaces,
    color: (opacity = 1) => activeChart.color.replace("$o", `${opacity}`),
    labelColor: (opacity = 1) =>
      `rgba(${mode === "dark" ? "255,255,255" : "0,0,0"}, ${opacity})`,
    propsForBackgroundLines: {
      stroke: `rgba(${mode === "dark" ? "255,255,255" : "0,0,0"}, 0.1)`,
      strokeDasharray: "",
    },
  };

  const tabs = [
    { key: "weight", label: "Weight" },
    { key: "workouts", label: "Workouts" },
    { key: "calories", label: "Calories" },
  ];

  const avgIntake = mealStats?.average?.calories ?? 0;
  const workoutsThisMonth = summary.workoutsThisMonth ?? 0;
  const caloriesThisMonth = summary.caloriesThisMonth ?? 0;

  const handleSaveWeight = async (kg) => {
    await weightApi.log(kg);
    await refreshUser?.();
    await load();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
          <Pressable
            onPress={() => setShowLogWeight(true)}
            style={[styles.logBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.logBtnText}>+ Log weight</Text>
          </Pressable>
        </View>

        <View
          style={[styles.statsRow, { backgroundColor: colors.cardBackground }]}
        >
          <ProgressStatCard
            label="CURRENT WEIGHT"
            value={weight ? `${weight} kg` : "N/A"}
            icon={WeightIcon}
            colors={colors}
            leftBorderColor="#00ff11"
            description={weightState || "No changes"}
          />
          <ProgressStatCard
            label="BMI"
            value={bmi ? bmi.toFixed(1) : "N/A"}
            icon={BmiIcon}
            colors={colors}
            leftBorderColor={colorIndicator}
            description={bmiRange || "N/A"}
          />
          <ProgressStatCard
            label="WORKOUTS DONE"
            value={`${workoutsThisMonth}`}
            icon={WorkoutIcon}
            colors={colors}
            leftBorderColor="#8297CD"
            description="This Month"
          />
          <ProgressStatCard
            label="CALORIES BURNED"
            value={caloriesThisMonth ? `${caloriesThisMonth} kcal` : "0"}
            icon={BurnIcon}
            colors={colors}
            leftBorderColor="#fe6e00"
            description="This Month"
          />
          <ProgressStatCard
            label="AVG INTAKE"
            value={avgIntake ? `${avgIntake} kcal` : "—"}
            icon={BurnIcon}
            colors={colors}
            leftBorderColor="#4CAF50"
            description="Last 30 days"
          />
        </View>

        <View
          style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}
        >
          <View style={styles.tabRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  activeTab === tab.key && {
                    backgroundColor: colors.selectedcard,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: colors.text,
                      fontWeight: activeTab === tab.key ? "700" : "400",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ height: 200 }} />
          ) : activeChart.type === "line" ? (
            <LineChart
              data={activeChart.data}
              width={screenWidth}
              height={200}
              chartConfig={chartConfig}
              bezier
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
            />
          ) : (
            <BarChart
              data={activeChart.data}
              width={screenWidth}
              height={200}
              chartConfig={chartConfig}
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
            />
          )}
        </View>

        <View
          style={[
            styles.activityCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Today's Meals
          </Text>
          <View
            style={[styles.workoutLogCard, { backgroundColor: colors.surface }]}
          >
            <View style={{ width: 24, height: 24 }}>
              <BurnIcon />
            </View>
            <Text
              style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}
            >
              {totals.calories} kcal planned
            </Text>
          </View>
        </View>
      </ScrollView>

      <LogWeightModal
        visible={showLogWeight}
        onClose={() => setShowLogWeight(false)}
        onSaved={handleSaveWeight}
        initialValue={weight || ""}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  title: { fontSize: 30, fontWeight: "800" },
  logBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  subtitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  statsRow: {
    borderRadius: 14,
    elevation: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 14,
  },
  chartCard: {
    borderRadius: 14,
    elevation: 4,
    padding: 14,
    marginTop: 16,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabText: { fontSize: 13 },
  chart: { borderRadius: 14 },
  activityCard: {
    flexDirection: "column",
    borderRadius: 14,
    elevation: 4,
    gap: 12,
    padding: 14,
    marginTop: 16,
  },
  workoutLogCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
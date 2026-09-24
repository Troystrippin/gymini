import React, { useContext, useState, useCallback } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/theme";
import api from "../api/api";
import { mealApi } from "../api/mealApi";

import WeightIcon from "../icons/weight-icon";
import BmiIcon from "../icons/BMI-icon";
import WorkoutIcon from "../icons/WorkOutIcon";
import BurnIcon from "../icons/BurnIcon";

const screenWidth = Dimensions.get("window").width - 68;

export default function ProgressScreen() {
  const { user } = useContext(AuthContext);
  const { colors, mode } = useTheme();
  const [activeTab, setActiveTab] = useState("weight");
  const [stats, setStats] = useState(null);
  const [mealStats, setMealStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [w, m] = await Promise.all([
            api.get("/workouts/stats").then((r) => r.data),
            mealApi.stats().catch(() => null),
          ]);
          if (!cancelled) {
            setStats(w);
            setMealStats(m);
          }
        } catch {
          /* leave nulls */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const workoutsDone = stats?.thisMonthSessions ?? stats?.totalSessions ?? 0;
  const caloriesBurned = stats?.thisMonthCalories ?? 0;
  const avgIntake = mealStats?.average?.calories ?? 0;

  const height = user?.heightCm;
  const weight = user?.weightKg;
  const previousWeight = user?.initialWeightKg;
  const bmi = weight && height ? weight / (height / 100) ** 2 : null;
  const bmiRange = !bmi
    ? null
    : bmi < 18.5
      ? "Underweight"
      : bmi < 25
        ? "Normal"
        : bmi < 30
          ? "Overweight"
          : bmi < 40
            ? "Obese"
            : "Morbidly Obese";
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
    if (!weight || !previousWeight) return "";
    const diff = weight - previousWeight;
    if (Math.abs(diff) < 0.1) return "No changes";
    return diff < 0
      ? `Lost ${Math.abs(diff).toFixed(1)} kg`
      : `Gained ${diff.toFixed(1)} kg`;
  })();

  const monthsWeight = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthWorkBurn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const charts = {
    weight: {
      title: "Weight (kg)",
      data: {
        labels: monthsWeight,
        datasets: [
          {
            data: [
              90, 89.5, 89.0, 88.2, 87.0, 86.5, 86.0, 85.3, 84.8, 84.0, 83.8,
              84.2,
            ],
          },
        ],
      },
      type: "line",
      color: "rgba(0, 255, 17, $o)",
      decimalPlaces: 1,
    },
    workouts: {
      title: "Workouts / Month",
      data: {
        labels: monthWorkBurn,
        datasets: [{ data: [4, 3, 5, 2, 6, 4] }],
      },
      type: "bar",
      color: "rgba(130, 151, 205, $o)",
      decimalPlaces: 0,
    },
    calories: {
      title: "Calories Burned / Month",
      data: {
        labels: monthWorkBurn,
        datasets: [
          {
            data: [1100, 950, 1400, 800, 1600, 1200],
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
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
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
            value={`${workoutsDone}`}
            icon={WorkoutIcon}
            colors={colors}
            leftBorderColor="#8297CD"
            description="This Month"
          />
          <ProgressStatCard
            label="CALORIES BURNED"
            value={caloriesBurned ? `${caloriesBurned} kcal` : "0"}
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

          {activeChart.type === "line" ? (
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
            Activity Log
          </Text>
          <View
            style={[styles.workoutLogCard, { backgroundColor: colors.surface }]}
          >
            <View style={{ width: 24, height: 24 }}>
              <WorkoutIcon />
            </View>
            <Text
              style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}
            >
              Leg day
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 28 },
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
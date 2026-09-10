import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

// ---- Sample workout data (we'll replace with real data later) ----
const WORKOUT = {
  title: 'Leg Day',
  emoji: '🦵',
  exercises: [
    { id: 1, name: 'Barbell Squat', muscle: 'Quads', sets: '4×8', done: true },
    { id: 2, name: 'Romanian Deadlift', muscle: 'Hamstrings', sets: '3×10', done: true },
    { id: 3, name: 'Leg Press', muscle: 'Quads', sets: '3×12', done: false },
    { id: 4, name: 'Walking Lunge', muscle: 'Glutes', sets: '3×20', done: false },
    { id: 5, name: 'Calf Raise', muscle: 'Calves', sets: '4×15', done: false },
  ],
};

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const firstName = user?.fullName?.split(' ')[0] || 'Pare';

  const completedCount = WORKOUT.exercises.filter((e) => e.done).length;
  const totalCount = WORKOUT.exercises.length;
  const progress = completedCount / totalCount;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- HEADER ---- */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{getTodayString()}</Text>
            <Text style={styles.greeting}>
              Good Morning,{'\n'}
              <Text style={styles.greetingName}>{firstName}</Text> 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ---- STATS ROW ---- */}
        <View style={styles.statsRow}>
          <StatCard
            label="CALORIES"
            value="1,000"
            emoji="🔥"
            progress={0.5}
          />
          <StatCard
            label="STREAK"
            value="4 days"
            emoji="⚡"
            progress={0.7}
          />
        </View>

        {/* ---- TODAY'S WORKOUT CARD ---- */}
        <View style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.workoutLabel}>TODAY'S WORKOUT</Text>
              <Text style={styles.workoutTitle}>
                {WORKOUT.title} <Text style={styles.workoutEmoji}>{WORKOUT.emoji}</Text>
              </Text>
            </View>
            <ProgressRing progress={progress} />
          </View>

          {/* Exercise list */}
          <View style={styles.exerciseList}>
            {WORKOUT.exercises.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} />
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Helpers ----

function getTodayString() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function StatCard({ label, value, emoji, progress }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statBarBg}>
        <View style={[styles.statBarFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

function ProgressRing({ progress }) {
  const size = 76;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          stroke={COLORS.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={COLORS.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

function ExerciseRow({ exercise }) {
  return (
    <View style={[styles.exerciseRow, exercise.done && styles.exerciseRowDone]}>
      <View style={[styles.checkCircle, exercise.done && styles.checkCircleDone]}>
        {exercise.done && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.exerciseName, exercise.done && styles.exerciseNameDone]}>
          {exercise.name}
        </Text>
        <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
      </View>
      <Text style={styles.exerciseSets}>{exercise.sets}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 10 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  date: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 },
  greeting: { color: COLORS.text, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  greetingName: { color: COLORS.primary },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsIcon: { fontSize: 22 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    padding: 16,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statEmoji: { fontSize: 18 },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginTop: 8, marginBottom: 14 },
  statBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  statBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  // Workout card
  workoutCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 18,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  workoutLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  workoutTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  workoutEmoji: { fontSize: 22 },
  progressText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },

  // Exercises
  exerciseList: { gap: 10 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E36',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseRowDone: {
    backgroundColor: '#2A2550',
    borderColor: COLORS.primary,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  exerciseName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  exerciseNameDone: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  exerciseMuscle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  exerciseSets: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
});
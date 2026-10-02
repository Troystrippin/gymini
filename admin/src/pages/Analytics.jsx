import React, { useEffect, useState } from "react";
import api from "../api";
import { COLORS, ROLE_COLORS } from "../theme";
import StatCard from "../components/StatCard";
import { Sparkline, BarChart } from "../components/Sparkline";
import useAdminPolling from "../hooks/useAdminPolling";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await api.get("/admin/analytics");
      setData(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useAdminPolling(load);

  if (loading) {
    return (
      <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "rgba(229, 57, 53, 0.15)",
          border: "1px solid rgba(229, 57, 53, 0.4)",
          color: COLORS.danger,
          padding: 20,
          borderRadius: 12,
        }}
      >
        {error}
      </div>
    );
  }

  const { growth, engagement, leaderboards, retention } = data;

  const newUserSeries = growth.newUsersByDay.map((d) => d.count);
  const activeUserSeries = growth.activeUsersByDay.map((d) => d.count);
  const newUserBars = growth.newUsersByDay.map((d) => ({
    label: d.date,
    value: d.count,
  }));

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Analytics
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          Growth, engagement, and retention metrics
        </p>
      </div>

      {/* ── Growth ──────────────────────────────────────────── */}
      <Section title="Growth — last 30 days">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          <ChartCard
            title="New users per day"
            value={`${newUserSeries.reduce((a, b) => a + b, 0)} total`}
          >
            <Sparkline data={newUserSeries} color={COLORS.primary} />
          </ChartCard>
          <ChartCard
            title="Active users per day"
            value={`${activeUserSeries.reduce((a, b) => a + b, 0)} sessions`}
          >
            <Sparkline data={activeUserSeries} color={COLORS.success} />
          </ChartCard>
        </div>
      </Section>

      {/* ── Engagement ─────────────────────────────────────── */}
      <Section title="Engagement">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <StatCard
            label="TOTAL WORKOUTS"
            value={engagement.totalWorkouts}
            emoji="💪"
            accent={COLORS.primary}
          />
          <StatCard
            label="THIS WEEK"
            value={engagement.workoutsThisWeek}
            emoji="📅"
            accent={COLORS.success}
          />
          <StatCard
            label="TODAY"
            value={engagement.workoutsToday}
            emoji="🔥"
            accent={COLORS.warning}
          />
          <StatCard
            label="AVG / USER"
            value={engagement.avgWorkoutsPerUser}
            emoji="📊"
            accent={COLORS.primary}
          />
          <StatCard
            label="WEIGHT LOGS"
            value={engagement.totalWeightLogs}
            emoji="⚖️"
            accent={ROLE_COLORS.moderator}
          />
          <StatCard
            label="MEAL PLANS"
            value={engagement.totalMealPlans}
            emoji="🍽️"
            accent={COLORS.success}
          />
        </div>
      </Section>

      {/* ── New Users Bar Chart ────────────────────────────── */}
      <Section title="Daily new users">
        <div
          style={{
            background: COLORS.cardBackground,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <BarChart
            data={newUserBars}
            width={800}
            height={100}
            color={COLORS.primary}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            <span>{growth.newUsersByDay[0]?.date}</span>
            <span>
              {growth.newUsersByDay[growth.newUsersByDay.length - 1]?.date}
            </span>
          </div>
        </div>
      </Section>

      {/* ── Leaderboards ───────────────────────────────────── */}
      <Section title="Top 10">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <LeaderboardCard
            title="Most Favorited Exercises"
            icon="★"
            rows={leaderboards.topFavorites.map((f) => ({
              primary: f.name,
              secondary: f.muscleGroup,
              value: f.count,
            }))}
          />
          <LeaderboardCard
            title="Most Used in Plans"
            icon="📋"
            rows={leaderboards.topPlanExercises.map((p) => ({
              primary: p.name,
              secondary: null,
              value: p.count,
            }))}
          />
          <LeaderboardCard
            title="Most Active Users"
            icon="🔥"
            rows={leaderboards.topUsers.map((u) => ({
              primary: u.name,
              secondary: u.email,
              value: u.workouts,
            }))}
          />
        </div>
      </Section>

      {/* ── Retention ─────────────────────────────────────── */}
      <Section title="Retention">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <StatCard
            label="ACTIVE (7D)"
            value={retention.activeLast7Days}
            emoji="⚡"
            accent={COLORS.success}
          />
          <StatCard
            label="ONBOARDED"
            value={retention.onboardingComplete}
            emoji="✅"
            accent={COLORS.primary}
          />
          <StatCard
            label="USERS WITH PLANS"
            value={retention.usersWithPlans}
            emoji="📋"
            accent={ROLE_COLORS.moderator}
          />
          <StatCard
            label="RETURNING USERS"
            value={retention.returningUsers}
            emoji="🔁"
            accent={COLORS.warning}
          />
        </div>
      </Section>
    </div>
  );
}

// ─── Layout sub-components ───────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 1.5,
          color: COLORS.textSecondary,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function ChartCard({ title, value, children }) {
  return (
    <div
      style={{
        background: COLORS.cardBackground,
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
            fontWeight: 700,
          }}
        >
          {value}
        </div>
      </div>
      {children}
    </div>
  );
}

function LeaderboardCard({ title, icon, rows }) {
  return (
    <div
      style={{
        background: COLORS.cardBackground,
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{icon}</span>
        {title}
      </div>
      {rows.length === 0 ? (
        <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>
          No data yet.
        </div>
      ) : (
        rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 0",
              borderBottom:
                i < rows.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}
          >
            <div
              style={{
                width: 20,
                fontSize: 11,
                fontWeight: 800,
                color: COLORS.textSecondary,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.primary}
              </div>
              {r.secondary && (
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.secondary}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: COLORS.primary,
                marginLeft: 8,
              }}
            >
              {r.value}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

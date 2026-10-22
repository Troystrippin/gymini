import React, { useEffect, useState } from "react";
import api from "../api";
import { COLORS, ROLE_COLORS } from "../theme";
import StatCard from "../components/StatCard";
import { Sparkline, BarChart } from "../components/Sparkline";
import useAdminPolling from "../hooks/useAdminPolling";
import MealsIcon from "../icons/MealsIcon";
import CalendarIcon from "../icons/CalendarIcon";
import FireIcon from "../icons/FireIcon";
import WeightIcon from "../icons/WeightIcon";
import ProgressIcon from "../icons/ProgressIcon";
import WorkoutIcon from "../icons/WorkoutIcon";
import LightningIcon from "../icons/LightningIcon";
import RetryIcon from "../icons/RetryIcon";
import CheckCircleIcon from "../icons/CheckCircleIcon";
import NewUserChart from "../components/NewUserChart";
import ActiveUserChart from "../components/ActiveUserChart";
import NewUserBar from "../components/NewUserBar";
import GoalPieChart from "../components/GoalPieChart";

const CARD_SHADOW = `
  inset 1px 1px 2px rgba(255, 255, 255, 0.9),
  inset -1px -1px 2px rgba(0, 0, 0, 0.12),
  -3px -3px 6px rgba(255, 255, 255, 0.9),
  1px 1px 3px rgba(0, 0, 0, 0.12),
  3px 3px 6px rgba(0, 0, 0, 0.14),
  6px 6px 12px rgba(0, 0, 0, 0.16)
`;

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return "–";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function summarize(points = []) {
  const values = points.map((p) => p.count);
  const total = sum(values);
  const avg = values.length ? total / values.length : 0;

  let peak = { count: 0, date: null };
  points.forEach((p) => {
    if (p.count > peak.count) peak = p;
  });

  const last7 = sum(values.slice(-7));
  const prev7 = sum(values.slice(-14, -7));
  const hasPrev = values.length >= 14;

  let change = null;
  if (hasPrev) {
    if (prev7 === 0) change = last7 === 0 ? 0 : null;
    else change = ((last7 - prev7) / prev7) * 100;
  }

  return {
    values,
    total,
    avg,
    peak,
    latest: points[points.length - 1],
    last7,
    prev7,
    hasPrev,
    change,
    startDate: points[0]?.date,
    endDate: points[points.length - 1]?.date,
  };
}

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

  const {
    growth,
    engagement,
    leaderboards,
    retention,
    userGoals = [],
  } = data;

  const newUsers = summarize(growth.newUsersByDay);
  const activeUsers = summarize(growth.activeUsersByDay);
  const newUserBars = growth.newUsersByDay.map((d) => ({
    label: fmtDate(d.date),
    value: d.count,
  }));

  const daysWithSignups = newUsers.values.filter((v) => v > 0).length;
  const usersWithGoal = sum(userGoals.map((goal) => goal.value));
  const mostPopularGoal = userGoals.reduce(
    (top, goal) => (!top || goal.value > top.value ? goal : top),
    null,
  );
  const topGoalShare = usersWithGoal
    ? Math.round((mostPopularGoal.value / usersWithGoal) * 100)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Analytics
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 16 }}>
          Growth, engagement, and retention metrics
        </p>
      </div>

      <Section
        title="Growth — last 30 days"
        subtitle={
          newUsers.startDate
            ? `${fmtDate(newUsers.startDate)} – ${fmtDate(newUsers.endDate)}`
            : null
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          <ChartCard
            title="New users per day"
            value={`${newUsers.total} total`}
            summary={newUsers}
            unit="signups"
            footer={`${fmtDate(newUsers.startDate)} → ${fmtDate(
              newUsers.endDate,
            )}`}
            stats={[
              { label: "AVG / DAY", value: fmtNumber(newUsers.avg) },
              {
                label: "PEAK",
                value: newUsers.peak.count,
                hint: fmtDate(newUsers.peak.date),
              },
              {
                label: "LATEST",
                value: newUsers.latest?.count ?? 0,
                hint: fmtDate(newUsers.latest?.date),
              },
            ]}
          >
            <NewUserChart
              data={newUsers.values.map((v, i) => ({
                user: v,
                date: growth.newUsersByDay[i]?.date,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Active users per day"
            value={`${activeUsers.total} sessions`}
            summary={activeUsers}
            unit="sessions"
            footer={`${fmtDate(activeUsers.startDate)} → ${fmtDate(
              activeUsers.endDate,
            )}`}
            stats={[
              { label: "AVG / DAY", value: fmtNumber(activeUsers.avg) },
              {
                label: "PEAK",
                value: activeUsers.peak.count,
                hint: fmtDate(activeUsers.peak.date),
              },
              {
                label: "LATEST",
                value: activeUsers.latest?.count ?? 0,
                hint: fmtDate(activeUsers.latest?.date),
              },
            ]}
          >
            <ActiveUserChart
              data={activeUsers.values.map((v, i) => ({
                user: v,
                date: growth.activeUsersByDay[i]?.date,
              }))}
            />
          </ChartCard>
        </div>
      </Section>

      <Section title="Engagement">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          <StatCard
            label="TOTAL WORKOUTS"
            value={engagement.totalWorkouts}
            emoji={<WorkoutIcon />}
            accent={COLORS.primary}
          />
          <StatCard
            label="THIS WEEK"
            value={engagement.workoutsThisWeek}
            emoji={<CalendarIcon />}
            accent={COLORS.success}
          />
          <StatCard
            label="TODAY"
            value={engagement.workoutsToday}
            emoji={<FireIcon />}
            accent={COLORS.warning}
          />
          <StatCard
            label="AVG / USER"
            value={engagement.avgWorkoutsPerUser}
            emoji={<ProgressIcon />}
            accent={COLORS.primary}
          />
          <StatCard
            label="WEIGHT LOGS"
            value={engagement.totalWeightLogs}
            emoji={<WeightIcon />}
            accent={ROLE_COLORS.moderator}
          />
          <StatCard
            label="MEAL PLANS"
            value={engagement.totalMealPlans}
            emoji={<MealsIcon />}
            accent={COLORS.success}
          />
        </div>
      </Section>

      <Section
        title="Daily new users & Goals Distribution"
        subtitle="Signup per day and distribution of user goals"
      >
        <div
          style={{
            display: "flex", // ← was "1"
            gap: 20,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 340,
              background: COLORS.cardBackground,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${COLORS.border}`,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div
              style={{
                display: "grid", // ← was "1"
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Metric label="TOTAL SIGNUPS" value={newUsers.total} />
              <Metric
                label="AVG / DAY"
                value={fmtNumber(newUsers.avg)}
                hint={`${daysWithSignups} of ${newUsers.values.length} days had signups`}
              />
              <Metric
                label="BEST DAY"
                value={newUsers.peak.count}
                hint={newUsers.peak.date ? fmtDate(newUsers.peak.date) : "–"}
              />
              <Metric
                label="LAST 7 DAYS"
                value={newUsers.last7}
                hint={
                  newUsers.hasPrev ? (
                    <Delta change={newUsers.change} prev={newUsers.prev7} />
                  ) : (
                    "Not enough data to compare"
                  )
                }
              />
            </div>

            {newUsers.total === 0 ? (
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  padding: "24px 0",
                  textAlign: "center",
                }}
              >
                No signups in this period yet.
              </div>
            ) : (
              <>
                <NewUserBar data={newUserBars} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                  }}
                >
                  <span>{fmtDate(growth.newUsersByDay[0]?.date)}</span>
                  <span>
                    {fmtDate(
                      growth.newUsersByDay[
                        Math.floor(growth.newUsersByDay.length / 2)
                      ]?.date,
                    )}
                  </span>
                  <span>
                    {fmtDate(
                      growth.newUsersByDay[growth.newUsersByDay.length - 1]
                        ?.date,
                    )}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                  }}
                >
                  Each bar is one day. Taller bars = more new signups.
                </div>
              </>
            )}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 340,
              background: COLORS.cardBackground,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${COLORS.border}`,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Metric
                label="USERS WITH A GOAL"
                value={usersWithGoal}
              />
              <Metric
                label="MOST POPULAR GOAL"
                value={mostPopularGoal?.value ?? 0}
                hint={mostPopularGoal?.name ?? "No selections yet"}
              />
              <Metric
                label="TOP GOAL SHARE"
                value={`${topGoalShare}%`}
                hint="of users with a selected goal"
              />
              <Metric
                label="GOAL TYPES IN USE"
                value={`${userGoals.length} / 5`}
                hint="available onboarding choices"
              />
            </div>

            {usersWithGoal === 0 ? (
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  padding: "24px 0",
                  textAlign: "center",
                }}
              >
                No users have selected an onboarding goal yet.
              </div>
            ) : (
              <>
                <GoalPieChart data={userGoals} />
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                  }}
                >
                  Each slice shows the share of users who selected that goal.
                </div>
              </>
            )}
          </div>
        </div>
      </Section>

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
            emoji={<LightningIcon />}
            accent={COLORS.success}
          />
          <StatCard
            label="ONBOARDED"
            value={retention.onboardingComplete}
            emoji={<CheckCircleIcon />}
            accent={COLORS.primary}
          />
          <StatCard
            label="USERS WITH PLANS"
            value={retention.usersWithPlans}
            emoji={<CalendarIcon />}
            accent={ROLE_COLORS.moderator}
          />
          <StatCard
            label="RETURNING USERS"
            value={retention.returningUsers}
            emoji={<RetryIcon />}
            accent={COLORS.warning}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: COLORS.textSecondary,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: COLORS.textSecondary,
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Delta({ change, prev }) {
  if (change === null) {
    return (
      <span style={{ color: COLORS.textSecondary }}>
        {prev === 0 ? "New activity vs. 0 prior week" : "–"}
      </span>
    );
  }
  const up = change > 0;
  const flat = Math.abs(change) < 0.5;
  const color = flat
    ? COLORS.textSecondary
    : up
      ? COLORS.success
      : COLORS.danger;
  const arrow = flat ? "→" : up ? "▲" : "▼";
  return (
    <span style={{ color, fontWeight: 700 }}>
      {arrow} {Math.abs(change).toFixed(0)}%{" "}
      <span style={{ color: COLORS.textSecondary, fontWeight: 500 }}>
        vs prev 7d
      </span>
    </span>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          color: COLORS.textSecondary,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
      {hint && (
        <div
          style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, value, summary, unit, stats, footer, children }) {
  const empty = summary && summary.total === 0;
  return (
    <div
      style={{
        background: COLORS.cardBackground,
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${COLORS.border}`,
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
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

      {summary && (
        <div style={{ fontSize: 12, marginBottom: 12 }}>
          {summary.hasPrev ? (
            <>
              <span style={{ fontWeight: 800 }}>
                {summary.last7} {unit}
              </span>{" "}
              <span style={{ color: COLORS.textSecondary }}>
                in the last 7 days ·{" "}
              </span>
              <Delta change={summary.change} prev={summary.prev7} />
            </>
          ) : (
            <span style={{ color: COLORS.textSecondary }}>
              Not enough data to show a trend yet
            </span>
          )}
        </div>
      )}

      {empty ? (
        <div
          style={{
            color: COLORS.textSecondary,
            fontSize: 13,
            padding: "24px 0",
            textAlign: "center",
          }}
        >
          No data in this period.
        </div>
      ) : (
        children
      )}

      {footer && (
        <div
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
            marginTop: 6,
          }}
        >
          {footer}
        </div>
      )}

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            gap: 12,
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: COLORS.textSecondary,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{s.value}</div>
              {s.hint && (
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
                  {s.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
        boxShadow: CARD_SHADOW,
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

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import StatCard from "../components/StatCard";
import { COLORS, ROLE_COLORS } from "../theme";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/users?limit=5")])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setRecentUsers(usersRes.data.users || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>
        Loading dashboard...
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

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Dashboard
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          Overview of your GYMINI platform
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <StatCard
          label="TOTAL USERS"
          value={stats.totalUsers}
          emoji="👥"
          accent={COLORS.primary}
        />
        <StatCard
          label="ADMINS"
          value={stats.totalAdmins}
          emoji="🛡️"
          accent={ROLE_COLORS.admin}
        />
        <StatCard
          label="MODERATORS"
          value={stats.totalModerators}
          emoji="⚙️"
          accent={ROLE_COLORS.moderator}
        />
        <StatCard
          label="WORKOUT PLANS"
          value={stats.totalPlans}
          emoji="💪"
          accent={COLORS.success}
        />
      </div>

      <div
        style={{
          background: COLORS.cardBackground,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Recent Users</h2>
          <Link
            to="/users"
            style={{ color: COLORS.primary, fontSize: 13, fontWeight: 700 }}
          >
            View all →
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>
            No users yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["NAME", "EMAIL", "ROLE"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr
                  key={u._id}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td style={{ padding: "14px 8px", fontSize: 14 }}>
                    {u.fullName}
                  </td>
                  <td
                    style={{
                      padding: "14px 8px",
                      fontSize: 13,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {u.email}
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 10,
                        background:
                          ROLE_COLORS[u.role] || COLORS.textSecondary,
                        color: "#FFF",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
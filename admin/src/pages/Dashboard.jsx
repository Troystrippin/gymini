import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import StatCard from "../components/StatCard";
import { COLORS, ROLE_COLORS } from "../theme";
import useAdminPolling from "../hooks/useAdminPolling";
import ProfileIcon from "../icons/ProfileIcon";
import ShieldCheckIcon from "../icons/ShieldCheckIcon";
import BicepsIcon from "../icons/BicepsIcon";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users?limit=5"),
      ]);
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users || []);
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
        <p style={{ color: COLORS.textSecondary, fontSize: 16 }}>
          Overview of GYMINI platform
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
          emoji={<ProfileIcon />}
          accent={COLORS.primary}
        />
        <StatCard
          label="ADMINS"
          value={stats.totalAdmins}
          emoji={<ShieldCheckIcon />}
          accent={ROLE_COLORS.primary}
        />
        <StatCard
          label="WORKOUT PLANS"
          value={stats.totalPlans}
          emoji={<BicepsIcon />}
          accent={COLORS.primary}
        />
      </div>

      <div
        style={{
          background: COLORS.cardBackground,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.border}`,
          boxShadow: `inset 1px 1px 2px rgba(255, 255, 255, 0.9),
          inset -1px -1px 2px rgba(0, 0, 0, 0.12),
          -4px -4px 10px rgba(255, 255, 255, 0.9),
          2px 2px 4px rgba(0, 0, 0, 0.12),
          6px 6px 12px rgba(0, 0, 0, 0.14),
          12px 12px 24px rgba(0, 0, 0, 0.16)
        `,
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
            style={{ color: COLORS.primary, fontSize: 14, fontWeight: 700 }}
          >
            View all
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div style={{ color: COLORS.textSecondary, fontSize: 16 }}>
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
                      fontSize: 14,
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
                      fontSize: 14,
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
                        background: ROLE_COLORS[u.role] || COLORS.textSecondary,
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

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { COLORS } from "../theme";
import StatCard from "../components/StatCard";

const STATUS_COLORS = {
  approved: "#43A047",
  pending: "#FB8C00",
  rejected: "#E53935",
};

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Full Body",
  "Cardio",
  "Other",
];

export function StatusBadge({ status }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        padding: "4px 10px",
        borderRadius: 10,
        background: STATUS_COLORS[status] || COLORS.textSecondary,
        color: "#FFF",
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

export default function Exercises() {
  const [stats, setStats] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchStats = () => {
    api
      .get("/admin/exercises/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
  };

  const fetchExercises = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (muscleFilter) params.set("muscleGroup", muscleFilter);
    params.set("page", page);
    params.set("limit", 30);

    api
      .get(`/admin/exercises?${params.toString()}`)
      .then((res) => {
        setExercises(res.data.exercises || []);
        setTotal(res.data.total || 0);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, muscleFilter]);

  useEffect(() => {
    fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter, muscleFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Exercises
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          Moderate custom exercises and manage the catalog
        </p>
      </div>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="TOTAL"
            value={stats.total}
            emoji="📚"
            accent={COLORS.primary}
          />
          <StatCard
            label="BUILT-IN"
            value={stats.builtin}
            emoji="🏋️"
            accent={COLORS.success}
          />
          <StatCard
            label="CUSTOM"
            value={stats.custom}
            emoji="✏️"
            accent="#4A9EFF"
          />
          <StatCard
            label="PENDING"
            value={stats.pending}
            emoji="⏳"
            accent={STATUS_COLORS.pending}
          />
          <StatCard
            label="REJECTED"
            value={stats.rejected}
            emoji="🚫"
            accent={STATUS_COLORS.rejected}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "11px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.cardBackground,
            color: COLORS.text,
            fontSize: 14,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All types</option>
          <option value="builtin">Built-in</option>
          <option value="custom">Custom</option>
        </select>
        <select
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(229, 57, 53, 0.15)",
            border: "1px solid rgba(229, 57, 53, 0.4)",
            color: COLORS.danger,
            padding: 14,
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: COLORS.cardBackground,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={emptyState}>Loading...</div>
        ) : exercises.length === 0 ? (
          <div style={emptyState}>No exercises found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["NAME", "MUSCLE", "TYPE", "CREATOR", "STATUS", "ACTIONS"].map(
                  (h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr
                  key={ex._id}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td style={tdStyle}>
                    <Link
                      to={`/exercises/${ex._id}`}
                      style={{ color: COLORS.text }}
                    >
                      {ex.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: COLORS.textSecondary,
                      fontSize: 13,
                    }}
                  >
                    {ex.muscleGroup}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 13 }}>
                    {ex.isCustom ? "Custom" : "Built-in"}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 13,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {ex.createdBy?.fullName || "—"}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={ex.status} />
                  </td>
                  <td style={tdStyle}>
                    <Link
                      to={`/exercises/${ex._id}`}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLORS.primary,
                      }}
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pagerBtn(page === 1)}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pagerBtn(page === totalPages)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: "11px 14px",
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.cardBackground,
  color: COLORS.text,
  fontSize: 14,
  minWidth: 150,
};

const thStyle = {
  textAlign: "left",
  padding: "14px 16px",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  color: COLORS.textSecondary,
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: 14,
  fontWeight: 600,
};

const emptyState = {
  padding: 40,
  textAlign: "center",
  color: COLORS.textSecondary,
};

const pagerBtn = (disabled) => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.cardBackground,
  color: COLORS.text,
  fontSize: 13,
  fontWeight: 700,
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
});
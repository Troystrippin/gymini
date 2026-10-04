import React, { useEffect, useState } from "react";
import api from "../api";
import { COLORS } from "../theme";
import useAdminPolling from "../hooks/useAdminPolling";

const ACTION_COLORS = {
  "exercise.create": "#43A047",
  "exercise.approve": "#43A047",
  "exercise.reject": "#E53935",
  "exercise.update": "#4A9EFF",
  "exercise.delete": "#E53935",
  "user.role_change": "#9C27B0",
  "user.delete": "#E53935",
  "meal.image_update": "#4A9EFF",
  "meal.delete": "#E53935",
};

const actionColor = (action) => ACTION_COLORS[action] || COLORS.textSecondary;

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValue = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    actions: [],
    targetTypes: [],
    admins: [],
  });

  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    api
      .get("/admin/logs/filters")
      .then((r) => setFilters(r.data))
      .catch(() => {});
  }, []);

  const fetchLogs = () => {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (targetFilter) params.set("targetType", targetFilter);
    if (search) params.set("search", search);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    params.set("page", page);
    params.set("limit", 50);

    return api
      .get(`/admin/logs?${params.toString()}`)
      .then((res) => {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [actionFilter, targetFilter, search, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, targetFilter, search, fromDate, toDate, page]);

  useAdminPolling(fetchLogs);

  const totalPages = Math.max(1, Math.ceil(total / 50));

  const clearFilters = () => {
    setActionFilter("");
    setTargetFilter("");
    setSearchInput("");
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    actionFilter || targetFilter || search || fromDate || toDate;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Activity Logs
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          Every admin action taken in this panel — auto-deleted after 90 days.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search admin, target, action..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "11px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.cardBackground,
            color: COLORS.text,
            fontSize: 14,
          }}
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All actions</option>
          {filters.actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">All targets</option>
          {filters.targetTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ ...selectStyle, minWidth: 150 }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ ...selectStyle, minWidth: 150 }}
        />

        {hasFilters && (
          <button onClick={clearFilters} style={btnSecondary}>
            Clear
          </button>
        )}
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
        ) : logs.length === 0 ? (
          <div style={emptyState}>No activity found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["WHEN", "ADMIN", "ACTION", "TARGET", "DETAILS"].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log._id}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(log.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 13 }}>
                    {log.adminId?.fullName || log.adminEmail}
                    {log.adminId?.email && (
                      <div
                        style={{
                          fontSize: 11,
                          color: COLORS.textSecondary,
                          fontWeight: 500,
                        }}
                      >
                        {log.adminId.email}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 10,
                        background: actionColor(log.action),
                        color: "#FFF",
                        letterSpacing: 0.5,
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 13 }}>
                    {log.targetLabel || "—"}
                    {log.targetType && (
                      <div
                        style={{
                          fontSize: 11,
                          color: COLORS.textSecondary,
                          fontWeight: 500,
                        }}
                      >
                        {log.targetType}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      maxWidth: 320,
                    }}
                  >
                    {log.metadata
                      ? Object.entries(log.metadata)
                          .map(([k, v]) => `${k}: ${formatValue(v)}`)
                          .join(" · ")
                      : "—"}
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
  minWidth: 160,
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
  verticalAlign: "top",
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

const btnSecondary = {
  padding: "11px 18px",
  borderRadius: 10,
  background: "transparent",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
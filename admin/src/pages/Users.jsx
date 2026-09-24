import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { COLORS, ROLE_COLORS } from "../theme";
import { useAuth } from "../AuthContext";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Debounce: only hit the API 500ms after the user stops typing.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    api
      .get(`/admin/users?${params.toString()}`)
      .then((res) => {
        setUsers(res.data.users || []);
        setError("");
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const changeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
          Users
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          Manage roles and permissions
        </p>
      </div>

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
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            minWidth: 240,
            padding: "11px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.cardBackground,
            color: COLORS.text,
            fontSize: 14,
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.cardBackground,
            color: COLORS.text,
            fontSize: 14,
            minWidth: 160,
          }}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
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
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: COLORS.textSecondary,
            }}
          >
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: COLORS.textSecondary,
            }}
          >
            No users found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["NAME", "EMAIL", "ROLE", "JOINED", "ACTIONS"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
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
              {users.map((u) => (
                <tr
                  key={u._id}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <Link to={`/users/${u._id}`} style={{ color: COLORS.text }}>
                      {u.fullName}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 13,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {u.email}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {currentUser.role === "admin" &&
                    u._id !== currentUser._id ? (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u._id, e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: `1px solid ${ROLE_COLORS[u.role] || COLORS.border}`,
                          background: COLORS.background,
                          color: COLORS.text,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "4px 10px",
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
                    )}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 13,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {currentUser.role === "admin" &&
                      u._id !== currentUser._id && (
                        <button
                          onClick={() => deleteUser(u._id, u.fullName)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "rgba(229, 57, 53, 0.15)",
                            border: "1px solid rgba(229, 57, 53, 0.4)",
                            color: COLORS.danger,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Delete
                        </button>
                      )}
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
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { COLORS, ROLE_COLORS } from "../theme";
import { useAuth } from "../AuthContext";
import useAdminPolling from "../hooks/useAdminPolling";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    return api
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
  }, [search, roleFilter]);
  useAdminPolling(fetchUsers);

  const deleteUser = async (userId, name, targetRole) => {
    if (targetRole === "admin") {
      alert("You cannot delete another administrator.");
      return;
    }
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`))
      return;
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
        <p style={{ color: COLORS.textSecondary, fontSize: 16 }}>
          View users and manage permissions
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
            fontSize: 16,
            boxShadow: `
              inset 1px 1px 2px rgba(255, 255, 255, 0.9),
              inset -1px -1px 2px rgba(0, 0, 0, 0.12),
              -3px -3px 6px rgba(255, 255, 255, 0.9),   
              1px 1px 3px rgba(0, 0, 0, 0.12),          
              3px 3px 6px rgba(0, 0, 0, 0.14),          
              6px 6px 12px rgba(0, 0, 0, 0.16)          
            `,
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            boxShadow: `
              inset 1px 1px 2px rgba(255, 255, 255, 0.9),
              inset -1px -1px 2px rgba(0, 0, 0, 0.12),
              -3px -3px 6px rgba(255, 255, 255, 0.9),   
              1px 1px 3px rgba(0, 0, 0, 0.12),          
              3px 3px 6px rgba(0, 0, 0, 0.14),          
              6px 6px 12px rgba(0, 0, 0, 0.16)          
            `,
            padding: "11px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.cardBackground,
            color: COLORS.text,
            fontSize: 16,
            minWidth: 160,
          }}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
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
            fontSize: 14,
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
          boxShadow: `inset 1px 1px 2px rgba(255, 255, 255, 0.9),
          inset -1px -1px 2px rgba(0, 0, 0, 0.12),
          -4px -4px 10px rgba(255, 255, 255, 0.9),
          2px 2px 4px rgba(0, 0, 0, 0.12),
          6px 6px 12px rgba(0, 0, 0, 0.14),
          12px 12px 24px rgba(0, 0, 0, 0.16)
        `,
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
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "4px 10px",
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
                      u._id !== currentUser._id &&
                      u.role !== "admin" && (
                        <button
                          onClick={() => deleteUser(u._id, u.fullName, u.role)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: COLORS.danger,
                            color: COLORS.buttonText,
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

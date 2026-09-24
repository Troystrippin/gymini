import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { COLORS, ROLE_COLORS } from "../theme";

export default function UserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/admin/users/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ color: COLORS.textSecondary }}>Loading user...</div>;
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

  const { user, planCount } = data;
  const d = user.details || {};

  return (
    <div>
      <Link
        to="/users"
        style={{
          color: COLORS.textSecondary,
          fontSize: 13,
          marginBottom: 16,
          display: "inline-block",
        }}
      >
        ← Back to users
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: COLORS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 900,
            color: COLORS.background,
          }}
        >
          {(user.fullName || "?")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
            {user.fullName}
          </h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            {user.email}
          </p>
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 10,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 10,
              background: ROLE_COLORS[user.role] || COLORS.textSecondary,
              color: "#FFF",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {user.role}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "MEMBER SINCE",
            value: new Date(user.createdAt).toLocaleDateString(),
          },
          { label: "PLANS CREATED", value: planCount },
          { label: "EMAIL VERIFIED", value: user.emailVerified ? "Yes" : "No" },
          {
            label: "ONBOARDING",
            value: user.onboardingCompleted ? "Complete" : "Incomplete",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: COLORS.cardBackground,
              borderRadius: 14,
              padding: 18,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1,
                color: COLORS.textSecondary,
                marginBottom: 6,
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {d && Object.keys(d).length > 0 && (
        <div
          style={{
            background: COLORS.cardBackground,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
            Profile Details
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {Object.entries(d).map(([key, value]) => (
                <tr
                  key={key}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      width: 180,
                    }}
                  >
                    {key}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 14 }}>
                    {value === null || value === undefined ? "—" : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
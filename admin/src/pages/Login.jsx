import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { COLORS } from "../theme";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockoutUntil) return undefined;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= lockoutUntil) setLockoutUntil(null);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const secondsRemaining = lockoutUntil
    ? Math.max(0, Math.ceil((lockoutUntil - now) / 1000))
    : 0;
  const lockoutLabel = `${Math.floor(secondsRemaining / 60)}:${String(
    secondsRemaining % 60,
  ).padStart(2, "0")}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLockoutUntil(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const serverLockout = Date.parse(err.response?.data?.lockoutUntil || "");
      if (Number.isFinite(serverLockout) && serverLockout > Date.now()) {
        setNow(Date.now());
        setLockoutUntil(serverLockout);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Login failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.background,
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 400,
          background: COLORS.cardBackground,
          padding: 32,
          borderRadius: 20,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 2,
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          ◆◆ GYMINI
        </div>

        {(error || secondsRemaining > 0) && (
          <div
            style={{
              background: "rgba(229, 57, 53, 0.15)",
              border: "1px solid rgba(229, 57, 53, 0.4)",
              color: COLORS.danger,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            {secondsRemaining > 0
              ? `Account locked. Try again in ${lockoutLabel}.`
              : error}
          </div>
        )}

        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
            color: COLORS.textSecondary,
            marginBottom: 6,
          }}
        >
          EMAIL
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.background,
            color: COLORS.text,
            fontSize: 14,
            marginBottom: 18,
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
            color: COLORS.textSecondary,
            marginBottom: 6,
          }}
        >
          PASSWORD
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.background,
            color: COLORS.text,
            fontSize: 14,
            marginBottom: 24,
          }}
        />

        <button
          type="submit"
          disabled={loading || secondsRemaining > 0}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            background: COLORS.primary,
            color: COLORS.text,
            fontSize: 15,
            fontWeight: 900,
            opacity: loading || secondsRemaining > 0 ? 0.6 : 1,
            cursor: loading || secondsRemaining > 0 ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Signing in..."
            : secondsRemaining > 0
              ? `Try again in ${lockoutLabel}`
              : "Sign In"}
        </button>
      </form>
    </div>
  );
}

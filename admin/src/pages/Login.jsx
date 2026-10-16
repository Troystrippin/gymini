import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Logo from "../components/Logo";
import { COLORS } from "../theme";

let googleIdentityScriptPromise;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => {
      googleIdentityScriptPromise = null;
      reject(new Error("Unable to load Google sign-in. Please try again."));
    };
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [now, setNow] = useState(Date.now());
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) {
      setError("Google sign-in is not configured for this deployment.");
      return undefined;
    }

    let active = true;
    loadGoogleIdentityScript()
      .then(() => {
        if (!active || !googleButtonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              setError("Google did not return an ID token. Please try again.");
              return;
            }

            setError("");
            setLoading(true);
            try {
              await googleLogin(credential);
              navigate("/dashboard");
            } catch (err) {
              setError(
                err.response?.data?.message ||
                  err.message ||
                  "Google sign-in failed. Please try again.",
              );
            } finally {
              setLoading(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 336,
        });
        setGoogleReady(true);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
      window.google?.accounts?.id?.cancel();
    };
  }, [googleClientId]);

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
          boxShadow: "0px 4px 10px rgba(60, 60, 60, 0.3)",
          background: COLORS.cardBackground,
          padding: 32,
          borderRadius: 20,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Logo
            color={COLORS.text}
            width={55}
            height={55}
            style={{ display: "block" }}
          />
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: 2,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            GYMINI
          </div>
        </div>

        {(error || secondsRemaining > 0) && (
          <div
            style={{
              background: "rgba(229, 56, 53, 0.28)",
              border: "1px solid rgba(229, 56, 53, 0.47)",
              color: COLORS.danger,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 14,
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
            fontSize: 16,
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
            fontSize: 16,
            marginBottom: 18,
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 16,
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
            fontSize: 16,
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
            color: COLORS.buttonText,
            fontSize: 16,
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "22px 0",
            color: COLORS.textSecondary,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span style={{ flex: 1, height: 1, background: COLORS.border }} />
          OR CONTINUE WITH
          <span style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>
        <div
          ref={googleButtonRef}
          style={{
            display: "flex",
            justifyContent: "center",
            minHeight: 40,
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
          aria-busy={!googleReady}
        />
      </form>
    </div>
  );
}

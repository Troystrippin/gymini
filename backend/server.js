const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { errorHandler, notFound } = require("./middleware/errorHandler");

// --- Validate required env vars at boot ---
const REQUIRED_ENV = [
  "MONGO_URI",
  "JWT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const app = express();

// ─────────────────────────────────────────────────────────────
// Trust proxy — Railway/Render/Heroku/Vercel sit behind a reverse
// proxy that adds X-Forwarded-For. Without this, express-rate-limit
// throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on every request.
// ─────────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ─────────────────────────────────────────────────────────────
// CORS — must run BEFORE helmet so its headers aren't stripped.
// ─────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/^["']|["']$/g, "")) // strip wrapping quotes
  .filter(Boolean);

console.log(`[cors] allowed origins: ${JSON.stringify(allowedOrigins)}`);
console.log(`[cors] NODE_ENV: ${process.env.NODE_ENV}`);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // In dev, allow everything if no allowlist configured
      if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 0) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[cors] blocked origin: ${origin}`);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

// ─────────────────────────────────────────────────────────────
// Helmet — configured for cross-origin API consumption.
// Default CORP (`same-origin`) silently blocks cross-origin fetches.
// ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    contentSecurityPolicy: false, // API only — no HTML to secure
  }),
);

// --- Body parser with size limit ---
app.use(express.json({ limit: "1mb" }));

// ─────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────

// Global light limiter — safety net for the entire API.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Strict limiter — brute-force-sensitive endpoints only.
const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Generous limiter — authenticated user actions.
const authGenerousLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// API limiter — protects plan/exercise/workout/admin routes.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// --- Routes ---
const authRoutes = require("./routes/authRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const planRoutes = require("./routes/planRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.get("/", (req, res) => res.send("GYMini API is running..."));

// Apply strict limiter FIRST to specific auth paths, then generous to the rest.
app.use("/api/auth/register", authStrictLimiter);
app.use("/api/auth/login", authStrictLimiter);
app.use("/api/auth/forgot-password", authStrictLimiter);
app.use("/api/auth/reset-password", authStrictLimiter);
app.use("/api/auth/resend-verification", authStrictLimiter);

app.use("/api/auth", authGenerousLimiter, authRoutes);

// Feature routes — protected by the general API limiter.
app.use("/api/workouts", apiLimiter, workoutRoutes);
app.use("/api/exercises", apiLimiter, exerciseRoutes);
app.use("/api/plans", apiLimiter, planRoutes);
app.use("/api/admin", apiLimiter, adminRoutes);

// --- 404 + centralized error handling ---
app.use(notFound);
app.use(errorHandler);

// --- Boot ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
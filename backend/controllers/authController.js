const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  signAccessToken,
  issueRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
} = require("../utils/tokens");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/mailer");
const {
  generate6DigitCode,
  hashCode,
  minutesFromNow,
} = require("../utils/emailCodes");

// Fields required before we mark onboarding as complete.
const REQUIRED_ONBOARDING_FIELDS = [
  "goal",
  "biologicalSex",
  "age",
  "heightCm",
  "weightKg",
  "workoutDaysPerWeek",
  "activityLevel",
];

// Strip sensitive/internal fields before sending user data to the client.
const serializeUser = (user) => ({
  _id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role || "user", // ← RBAC: surfaced to client
  createdAt: user.createdAt,
  onboardingCompleted: user.onboardingCompleted,
  emailVerified: user.emailVerified,
  activePlanId: user.activePlanId || null,
  profile:
    user.goal || user.details
      ? { goal: user.goal, details: user.details }
      : undefined,
});

const authResponse = (user, accessToken, refreshToken) => ({
  ...serializeUser(user),
  token: accessToken,
  refreshToken,
});

// Bcrypt hash of a random string. Used to make bcrypt.compare run
// even when the user doesn't exist (timing-attack mitigation).
const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8ZcT0ZK1q0VpXt/qvUX8nQ4TGwBq3K";

const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      // role defaults to "user" via schema
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid user data" });
    }

    const code = generate6DigitCode();
    user.emailVerificationCode = hashCode(code);
    user.emailVerificationExpires = minutesFromNow(
      Number(process.env.EMAIL_VERIFICATION_TTL_MIN) || 10,
    );
    await user.save();

    sendVerificationEmail(user, code).catch((err) => {
      console.error("[register] verification email failed:", err.message);
    });

    const accessToken = signAccessToken(user._id);
    const refreshToken = await issueRefreshToken({
      userId: user._id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.status(201).json(authResponse(user, accessToken, refreshToken));
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Timing-safe: always run bcrypt.compare.
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH,
    );

    // Lockout check first (existing users only).
    if (user && user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000,
      );
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
        lockoutUntil: user.lockoutUntil,
      });
    }

    if (!user || !passwordMatches) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        const maxAttempts = Number(process.env.LOGIN_MAX_ATTEMPTS) || 3;
        const lockoutMinutes = Number(process.env.LOGIN_LOCKOUT_MINUTES) || 15;

        if (user.failedLoginAttempts >= maxAttempts) {
          user.lockoutUntil = new Date(
            Date.now() + lockoutMinutes * 60 * 1000,
          );
          user.failedLoginAttempts = 0;
          await user.save();
          console.log(
            `[login] locked user=${user._id} for ${lockoutMinutes}m`,
          );
          return res.status(423).json({
            message: `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`,
            lockoutUntil: user.lockoutUntil,
          });
        }

        await user.save();
      }

      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = await issueRefreshToken({
      userId: user._id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.json(authResponse(user, accessToken, refreshToken));
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      console.log("[refresh] no refresh token provided");
      return res.status(400).json({ message: "Refresh token required" });
    }

    const stored = await findRefreshToken(refreshToken);
    if (!stored) {
      console.log("[refresh] invalid or expired refresh token");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      await revokeRefreshToken(refreshToken);
      console.log("[refresh] orphaned token (user missing)");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    await revokeRefreshToken(refreshToken);
    const newRefreshToken = await issueRefreshToken({
      userId: user._id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    const newAccessToken = signAccessToken(user._id);

    console.log(
      `[refresh] issued new tokens for user=${user._id} email=${user.email}`,
    );

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
      console.log("[logout] refresh token revoked");
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    await revokeAllForUser(req.user._id);
    console.log(`[logout-all] all sessions revoked for user=${req.user._id}`);
    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified) {
      return res.json({
        message: "Email already verified",
        emailVerified: true,
      });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res
        .status(400)
        .json({ message: "No verification code on file. Request a new one." });
    }

    if (user.emailVerificationExpires.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Code expired. Request a new one." });
    }

    if (user.emailVerificationCode !== hashCode(code)) {
      return res.status(400).json({ message: "Invalid code" });
    }

    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log(`[verify-email] verified user=${user._id}`);
    res.json({ message: "Email verified", emailVerified: true });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.emailVerified) {
      return res.json({
        message: "If that email needs verification, we sent a code.",
      });
    }

    const code = generate6DigitCode();
    user.emailVerificationCode = hashCode(code);
    user.emailVerificationExpires = minutesFromNow(
      Number(process.env.EMAIL_VERIFICATION_TTL_MIN) || 10,
    );
    await user.save();

    sendVerificationEmail(user, code).catch((err) => {
      console.error("[resend-verification] email failed:", err.message);
    });

    console.log(`[resend-verification] sent to user=${user._id}`);
    res.json({
      message: "If that email needs verification, we sent a code.",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "If that email exists, we sent a code." });
    }

    const code = generate6DigitCode();
    user.passwordResetCode = hashCode(code);
    user.passwordResetExpires = minutesFromNow(
      Number(process.env.PASSWORD_RESET_TTL_MIN) || 15,
    );
    await user.save();

    sendPasswordResetEmail(user, code).catch((err) => {
      console.error("[forgot-password] email failed:", err.message);
    });

    console.log(`[forgot-password] sent to user=${user._id}`);
    res.json({ message: "If that email exists, we sent a code." });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid code or email" });
    }

    if (!user.passwordResetCode || !user.passwordResetExpires) {
      return res.status(400).json({ message: "No reset code on file" });
    }

    if (user.passwordResetExpires.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Code expired. Request a new one." });
    }

    if (user.passwordResetCode !== hashCode(code)) {
      return res.status(400).json({ message: "Invalid code or email" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetCode = null;
    user.passwordResetExpires = null;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    await revokeAllForUser(user._id);

    console.log(`[reset-password] password reset for user=${user._id}`);
    res.json({ message: "Password updated. Please log in again." });
  } catch (error) {
    next(error);
  }
};

// ---------- Phase 2.1 additions ----------

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Revoke all sessions, then issue fresh tokens for the current device
    // so the user stays logged in here but is kicked out elsewhere.
    await revokeAllForUser(user._id);
    const refreshToken = await issueRefreshToken({
      userId: user._id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    const accessToken = signAccessToken(user._id);

    console.log(`[change-password] updated for user=${user._id}`);
    res.json({
      message: "Password updated",
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof req.body.fullName === "string" && req.body.fullName.trim()) {
      user.fullName = req.body.fullName.trim();
    }

    const updatedUser = await user.save();
    res.json(serializeUser(updatedUser));
  } catch (error) {
    next(error);
  }
};

// ---------- Existing onboarding (tightened) ----------

const updateOnboarding = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.goal !== undefined) {
      user.goal = req.body.goal;
    }

    const incomingDetails = req.body.details || {
      biologicalSex: req.body.biologicalSex,
      age: req.body.age,
      heightCm: req.body.height,
      weightKg: req.body.weight,
      workoutDaysPerWeek: req.body.workoutDaysPerWeek,
      activityLevel: req.body.activityLevel,
    };

    user.details = user.details || {};
    Object.entries(incomingDetails).forEach(([field, value]) => {
      if (value !== undefined) {
        user.details[field] = value;
      }
    });

    // Only flip onboardingCompleted to true when every required field is set.
    const merged = {
      goal: user.goal,
      biologicalSex: user.details.biologicalSex,
      age: user.details.age,
      heightCm: user.details.heightCm,
      weightKg: user.details.weightKg,
      workoutDaysPerWeek: user.details.workoutDaysPerWeek,
      activityLevel: user.details.activityLevel,
    };
    user.onboardingCompleted = REQUIRED_ONBOARDING_FIELDS.every(
      (field) => merged[field] !== null && merged[field] !== undefined,
    );

    const updatedUser = await user.save();
    res.json(serializeUser(updatedUser));
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.status(200).json(serializeUser(req.user));
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  updateOnboarding,
  updateProfile,
  changePassword,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
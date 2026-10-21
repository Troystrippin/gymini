const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

const hashRefreshToken = (raw) => {
  return crypto.createHash("sha256").update(raw).digest("hex");
};

const refreshTokenExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
};

const issueRefreshToken = async ({ userId, userAgent, ip }) => {
  const raw = generateRefreshToken();
  const tokenHash = hashRefreshToken(raw);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt: refreshTokenExpiry(),
    userAgent: userAgent || null,
    ip: ip || null,
  });

  return raw;
};

const findRefreshToken = async (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const tokenHash = hashRefreshToken(raw);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc) return null;
  if (doc.expiresAt.getTime() < Date.now()) {
    await RefreshToken.deleteOne({ _id: doc._id });
    return null;
  }
  return doc;
};

const revokeRefreshToken = async (raw) => {
  const tokenHash = hashRefreshToken(raw);
  await RefreshToken.deleteOne({ tokenHash });
};

const revokeAllForUser = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_DAYS,
};

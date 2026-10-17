// backend/utils/mailer.js
const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  "GYMini <no-reply@gymini.local>";

// If credentials are missing, fall back to console logging so local dev doesn't crash.
const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // STARTTLS on port 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`[mailer] provider=smtp host=${SMTP_HOST} from=${EMAIL_FROM}`);
} else {
  console.log(`[mailer] mode=console-only (no SMTP credentials configured)`);
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isConfigured) {
    console.log("\n📧 ─────────────────────────────────────────");
    console.log(`   to:      ${to}`);
    console.log(`   subject: ${subject}`);
    if (text) console.log(`   text:    ${text.replace(/\n/g, "\n            ")}`);
    console.log("─────────────────────────────────────────────\n");
    return { id: "console-stub" };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`[mailer] sent to=${to} id=${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[mailer] failed to send to ${to}:`, err.message);
    throw err;
  }
};

const sendVerificationEmail = async (user, code) => {
  const minutes = process.env.EMAIL_VERIFICATION_TTL_MIN || 10;
  return sendEmail({
    to: user.email,
    subject: "Verify your GYMINI email",
    text: `Welcome to GYMINI, ${user.fullName}!\n\nYour verification code is: ${code}\n\nThis code expires in ${minutes} minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2>Welcome to GYMINI</h2>
        <p>Hi ${user.fullName},</p>
        <p>Your email verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;background:#f3f3f3;padding:12px 20px;border-radius:8px;display:inline-block;">${code}</p>
        <p>This code expires in ${minutes} minutes.</p>
        <p style="color:#888;font-size:12px;">If you didn't create this account, ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (user, code) => {
  const minutes = process.env.PASSWORD_RESET_TTL_MIN || 15;
  return sendEmail({
    to: user.email,
    subject: "Reset your GYMINI password",
    text: `Hi ${user.fullName},\n\nYour password reset code is: ${code}\n\nThis code expires in ${minutes} minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2>Password reset</h2>
        <p>Hi ${user.fullName},</p>
        <p>Your password reset code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;background:#f3f3f3;padding:12px 20px;border-radius:8px;display:inline-block;">${code}</p>
        <p>This code expires in ${minutes} minutes.</p>
        <p style="color:#888;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
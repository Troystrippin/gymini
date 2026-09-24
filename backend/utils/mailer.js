const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 2525,
  secure: false, // true for 465, false for 2525/587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Timeouts so a blocked/hanging connection fails fast instead of
  // silently hanging forever (which is what Railway was doing).
  connectionTimeout: 10000, // 10s to establish TCP connection
  greetingTimeout: 10000,   // 10s for SMTP greeting
  socketTimeout: 15000,     // 15s of inactivity
  logger: false,
  debug: false,
});

// Log SMTP config at boot (password redacted)
console.log(
  `[mailer] config host=${process.env.SMTP_HOST} port=${process.env.SMTP_PORT} user=${process.env.SMTP_USER} from=${process.env.EMAIL_FROM || process.env.SMTP_FROM || "(fallback)"}`,
);

// Verify SMTP connection at boot so any misconfig shows up in Railway logs immediately
transporter.verify((err) => {
  if (err) {
    console.error(`[mailer] verify FAILED: ${err.message}`);
    if (err.code) console.error(`[mailer] verify err.code=${err.code}`);
    if (err.command) console.error(`[mailer] verify err.command=${err.command}`);
  } else {
    console.log(`[mailer] verify OK — SMTP connection ready`);
  }
});

// Support both env var names (Railway has SMTP_FROM, code used EMAIL_FROM)
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  "GYMini <no-reply@example.com>";

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[mailer] attempting to send to=${to} from=${EMAIL_FROM}`);
  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(
      `[mailer] SENT to=${to} id=${info.messageId} response=${info.response} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`,
    );
    return info;
  } catch (err) {
    console.error(`[mailer] FAILED to=${to} error=${err.message}`);
    if (err.code) console.error(`[mailer] FAILED err.code=${err.code}`);
    if (err.command) console.error(`[mailer] FAILED err.command=${err.command}`);
    if (err.response) console.error(`[mailer] FAILED err.response=${err.response}`);
    console.error(`[mailer] FAILED stack=${err.stack}`);
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
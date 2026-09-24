// backend/utils/mailer.js
// Mailer is disabled — no email provider configured yet.
// In dev, codes are printed to the terminal so you can test the flow.
// In production, sends are silently no-op'd (swap in Resend/SMTP when ready).

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  "GYMini <no-reply@gymini.local>";

console.log(`[mailer] provider=stub from=${EMAIL_FROM}`);
console.log(`[mailer] mode=console-only (no email provider configured)`);

const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.NODE_ENV === "production") {
    // Never log codes in production.
    console.warn(`[mailer] skipped "${subject}" → ${to} (no provider)`);
    return { id: "stub-skipped" };
  }

  console.log("\n📧 ─────────────────────────────────────────");
  console.log(`   to:      ${to}`);
  console.log(`   subject: ${subject}`);
  if (text) console.log(`   text:    ${text.replace(/\n/g, "\n            ")}`);
  console.log("─────────────────────────────────────────────\n");

  return { id: "stub-console" };
};

const sendVerificationEmail = async (user, code) => {
  const minutes = process.env.EMAIL_VERIFICATION_TTL_MIN || 10;
  return sendEmail({
    to: user.email,
    subject: "Verify your GYMINI email",
    text: `Welcome to GYMINI, ${user.fullName}!\n\nYour verification code is: ${code}\n\nThis code expires in ${minutes} minutes.`,
    html: `<!doctype html><html><body><h2>Welcome to GYMINI</h2><p>Hi ${user.fullName},</p><p>Your verification code is: <strong>${code}</strong></p><p>Expires in ${minutes} minutes.</p></body></html>`,
  });
};

const sendPasswordResetEmail = async (user, code) => {
  const minutes = process.env.PASSWORD_RESET_TTL_MIN || 15;
  return sendEmail({
    to: user.email,
    subject: "Reset your GYMINI password",
    text: `Hi ${user.fullName},\n\nYour password reset code is: ${code}\n\nThis code expires in ${minutes} minutes.`,
    html: `<!doctype html><html><body><h2>Password reset</h2><p>Hi ${user.fullName},</p><p>Your reset code is: <strong>${code}</strong></p><p>Expires in ${minutes} minutes.</p></body></html>`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
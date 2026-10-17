// backend/utils/mailer.js — Brevo HTTP API (Railway-compatible)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "GYMini <no-reply@gymini.local>";

const isConfigured = Boolean(BREVO_API_KEY);

if (isConfigured) {
  console.log(`[mailer] provider=brevo-api from=${EMAIL_FROM}`);
} else {
  console.log(`[mailer] mode=console-only (no BREVO_API_KEY configured)`);
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isConfigured) {
    console.log("\n📧 ─────────────────────────────────────────");
    console.log(`   to:      ${to}`);
    console.log(`   subject: ${subject}`);
    console.log(`   text:    ${text}`);
    console.log("─────────────────────────────────────────────\n");
    return { id: "console-stub" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "GYMINI", email: EMAIL_FROM.match(/<(.+)>/)?.[1] || EMAIL_FROM },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Brevo API error: ${res.status}`);
    }

    console.log(`[mailer] sent to=${to} id=${data.messageId}`);
    return data;
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
      </div>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
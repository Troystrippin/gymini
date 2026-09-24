const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_FROM || "GYMini <no-reply@example.com>";

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  if (info.messageId) {
    console.log(`[mailer] sent to=${to} id=${info.messageId}`);
  }
  return info;
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
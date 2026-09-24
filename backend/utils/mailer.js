const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  "GYMini <onboarding@resend.dev>";

console.log(`[mailer] provider=resend from=${EMAIL_FROM}`);
console.log(
  `[mailer] apiKey=${process.env.RESEND_API_KEY ? "set" : "MISSING!!!"}`,
);

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[mailer] attempting to send to=${to} from=${EMAIL_FROM}`);
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error(`[mailer] FAILED to=${to} error=${JSON.stringify(error)}`);
      throw new Error(error.message || "Resend send failed");
    }

    console.log(`[mailer] SENT to=${to} id=${data?.id}`);
    return data;
  } catch (err) {
    console.error(`[mailer] FAILED to=${to} error=${err.message}`);
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
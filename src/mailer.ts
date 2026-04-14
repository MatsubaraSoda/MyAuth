export type MailerEnv = {
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
};

const FROM = "MatsubaraSoda <noreply@matsubarasoda.com>";

export async function sendResetPasswordEmail(params: {
  env: MailerEnv;
  to: string;
  token: string;
}) {
  const { env, to, token } = params;
  const accountUrl = env.ACCOUNT_URL?.trim();

  if (!env.RESEND_API_KEY?.trim()) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!accountUrl) {
    throw new Error("ACCOUNT_URL is not configured");
  }

  const normalizedBaseUrl = accountUrl.replace(/\/+$/, "");
  const resetUrl = `${normalizedBaseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: "Reset your password",
      html: `
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>This mailbox is not monitored. Please do not reply.</p>
    `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
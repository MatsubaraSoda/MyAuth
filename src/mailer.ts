export type MailerEnv = {
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
  DEV_RESET_LINK?: string;
};

const FROM = "MatsubaraSoda <noreply@matsubarasoda.com>";
const LOCAL_PREVIEW_ORIGIN = "http://localhost:5173";

function isDevResetLinkEnabled(env: Pick<MailerEnv, "DEV_RESET_LINK">): boolean {
  const raw = env.DEV_RESET_LINK?.trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes";
}


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

  if (isDevResetLinkEnabled(env)) {
    const localPreviewUrl = `${LOCAL_PREVIEW_ORIGIN}/auth/reset-password?token=${encodeURIComponent(token)}`;
    console.log("[DEV_RESET_LINK]", localPreviewUrl, `(to: ${to})`);
  }

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
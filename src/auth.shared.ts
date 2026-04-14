import type { BetterAuthOptions } from "better-auth";
import { bearer } from "better-auth/plugins";

export const authBaseConfig = {
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
  plugins: [bearer()],
  trustedOrigins: [
    "http://localhost:5173",
    "https://account.matsubarasoda.com",
  ],
} satisfies Partial<BetterAuthOptions>;

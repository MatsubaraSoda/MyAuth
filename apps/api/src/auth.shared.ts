import type { BetterAuthOptions } from "better-auth";
import { bearer } from "better-auth/plugins";

export const authBaseConfig = {
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: false,
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
    "http://127.0.0.1:5173",
    "https://account.matsubarasoda.com",
  ],
} satisfies Partial<BetterAuthOptions>;

export type GithubOAuthEnv = {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

export function createGithubSocialProvidersConfig(env: GithubOAuthEnv) {
  return {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  } satisfies NonNullable<BetterAuthOptions["socialProviders"]>;
}

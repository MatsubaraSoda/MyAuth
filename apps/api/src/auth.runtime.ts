import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { sendResetPasswordEmail, sendVerificationEmail } from "./mailer";
import {
  authBaseConfig,
  createGithubSocialProvidersConfig,
  type GithubOAuthEnv,
} from "./auth.shared";

type RuntimeEnv = {
  DB: any;
  BETTER_AUTH_URL?: string;
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
  DEV_RESET_LINK?: string;
} & GithubOAuthEnv;

let cachedRuntimeAuth: ReturnType<typeof buildRuntimeAuth> | null = null;
let cachedRuntimeDb: unknown = null;
let cachedBaseURL: string | null = null;

function resolvePublicBaseURL(env: RuntimeEnv): string {
  const fromEnv = env.BETTER_AUTH_URL?.trim();
  if (fromEnv) return fromEnv;
  return env.ACCOUNT_URL?.trim() ?? "";
}

/**
 * 本地 http + localhost/127.0.0.1 下关闭 Secure / SameSite=None，避免会话 Cookie 无法写入浏览器。
 */
function resolveAdvancedForBaseURL(baseURL: string) {
  const isLocalHttp =
    baseURL.startsWith("http://localhost:") ||
    baseURL.startsWith("http://127.0.0.1:");
  if (isLocalHttp) {
    return {
      useSecureCookies: false,
      defaultCookieAttributes: {
        sameSite: "lax" as const,
        secure: false,
      },
    };
  }
  return authBaseConfig.advanced;
}

function buildRuntimeAuth(env: RuntimeEnv, baseURL: string) {
  return betterAuth({
    ...authBaseConfig,
    baseURL,
    advanced: resolveAdvancedForBaseURL(baseURL),
    socialProviders: createGithubSocialProvidersConfig(env),
    emailAndPassword: {
      ...authBaseConfig.emailAndPassword,
      // 正式策略：发送到用户请求重置时填写的邮箱
      sendResetPassword: async ({ user, token }) => {
        await sendResetPasswordEmail({
          env: {
            RESEND_API_KEY: env.RESEND_API_KEY,
            ACCOUNT_URL: env.ACCOUNT_URL,
            DEV_RESET_LINK: env.DEV_RESET_LINK,
          },
          to: user.email,
          token,
        });
      },
    },
    emailVerification: {
      ...(authBaseConfig.emailVerification || {}),
      sendVerificationEmail: async ({ user, url, token }) => {
        void token;
        await sendVerificationEmail({
          env: {
            RESEND_API_KEY: env.RESEND_API_KEY,
          },
          to: user.email,
          url,
        });
      },
    },
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema: schema,
    }),
  });
}

export function createAuth(env: RuntimeEnv) {
  const baseURL = resolvePublicBaseURL(env);
  if (!baseURL) {
    throw new Error(
      "Missing public URL: set BETTER_AUTH_URL or ACCOUNT_URL (e.g. http://localhost:5173 for local Vite).",
    );
  }

  // Worker isolate 级缓存：避免每个请求都重建 better-auth 与 drizzle adapter
  if (
    cachedRuntimeAuth &&
    cachedRuntimeDb === env.DB &&
    cachedBaseURL === baseURL
  ) {
    return cachedRuntimeAuth;
  }

  cachedRuntimeDb = env.DB;
  cachedBaseURL = baseURL;
  cachedRuntimeAuth = buildRuntimeAuth(env, baseURL);
  return cachedRuntimeAuth;
}

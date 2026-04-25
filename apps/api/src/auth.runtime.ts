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
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
  DEV_RESET_LINK?: string;
} & GithubOAuthEnv;

let cachedRuntimeAuth: ReturnType<typeof buildRuntimeAuth> | null = null;
let cachedRuntimeDb: unknown = null;

function buildRuntimeAuth(env: RuntimeEnv) {
  return betterAuth({
    ...authBaseConfig,
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
  // Worker isolate 级缓存：避免每个请求都重建 better-auth 与 drizzle adapter
  if (cachedRuntimeAuth && cachedRuntimeDb === env.DB) {
    return cachedRuntimeAuth;
  }

  cachedRuntimeDb = env.DB;
  cachedRuntimeAuth = buildRuntimeAuth(env);
  return cachedRuntimeAuth;
}

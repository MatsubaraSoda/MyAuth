import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { bearer } from "better-auth/plugins";

// 🌟 核心修改：将所有重复的配置提取到一个基础对象中
const baseConfig = {
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
  // 顺手加上跨域白名单，允许本地 Vue 项目访问！
  trustedOrigins: [
    "http://localhost:5173", 
    "https://myauthui.matsubarasoda.com",
  ],
} satisfies Partial<BetterAuthOptions>;

function buildAuthWithDatabase(database: ReturnType<typeof drizzleAdapter>) {
  return betterAuth({
    ...baseConfig,
    database,
  });
}

// 1. 【战时引擎】供 Hono / Cloudflare Worker 运行时调用的工厂函数
export function createAuth(env: { DB: any }) {
  return buildAuthWithDatabase(
    drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema: schema,
    })
  );
}

// 2. 【设计图纸】仅供 CLI 工具生成表结构使用的静态配置
export const auth = buildAuthWithDatabase(
  drizzleAdapter({} as any, {
    provider: "sqlite",
    schema: schema,
  })
);
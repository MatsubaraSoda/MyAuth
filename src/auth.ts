import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { bearer } from "better-auth/plugins";

// 1. 【战时引擎】供 Hono 运行时调用的工厂函数
// 每次有用户请求登录时，我们会把当前环境的 D1 数据库连接传进来
export function createAuth(env: { DB: any }) {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite", // Cloudflare D1 底层是 SQLite
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true, // 核心：开启邮箱和密码登录功能
    },
    plugins: [bearer()],
  });
}

// 2. 【设计图纸】仅供 CLI 工具生成表结构使用的静态配置
// CLI 在本地运行，连不上云端数据库，所以我们丢一个空对象骗过它，它只需读取上面的 provider 和插件配置即可
export const auth = betterAuth({
  database: drizzleAdapter({} as any, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
});
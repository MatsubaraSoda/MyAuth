import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./schema";
import { authBaseConfig } from "./auth.shared";

// 仅供 CLI/工具链使用（避免运行时请求路径加载该初始化逻辑）
export const auth = buildAuthWithDatabase(
  drizzleAdapter({} as any, {
    provider: "sqlite",
    schema: schema,
  })
);

function buildAuthWithDatabase(database: ReturnType<typeof drizzleAdapter>) {
  return betterAuth({
    ...authBaseConfig,
    database,
  });
}
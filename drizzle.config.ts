import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts', // 刚才通过 better-auth 生成的表结构文件路径
  out: './drizzle',          // 等会儿生成的 SQL 脚本存放的目录
  dialect: 'sqlite',         // Cloudflare D1 使用 SQLite 语法
  dbCredentials: {
    // 将数据库路径指派给 Drizzle
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/4c408efaefdfd07587d53e000390c688ea0e0f379b3bc67193d48b6b20a69754.sqlite', 
  },
});
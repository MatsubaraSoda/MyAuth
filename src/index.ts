import { Hono } from 'hono';
import { cors } from 'hono/cors'; // 👈 新增：引入 Hono 自带的 cors 中间件
import { createAuth } from './auth';

// 1. 定义 Cloudflare 的环境变量类型，享受完美的 TypeScript 提示
type Bindings = {
  DB: D1Database;
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
};

// 2. 实例化 Hono，并注入环境变量类型
const app = new Hono<{ Bindings: Bindings }>();

// 🌟 【核心修复 1】添加全局 CORS 中间件，必须放在具体路由的前面！
app.use('/api/auth/*', cors({
  origin: ['http://localhost:5173', 'https://account.matsubarasoda.com'], // 允许你的本地 Vue 跨域访问
  allowMethods: ['POST', 'GET', 'OPTIONS'], // 允许的方法
  allowHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
  credentials: true, // 关键：允许跨域携带 Cookie (Better Auth 必须)
}));

// 3. 健康检查路由：同源策略下统一走 /api/*
app.get('/api/health', (c) => {
  return c.json({ ok: true, service: 'auth', timestamp: Date.now() });
});

// 4. 【核心路由】将所有与认证相关的请求，全部拦截并交给 better-auth 处理
// 🌟 【核心修复 2】在数组里加上 'OPTIONS'，让 Better Auth 接管预检请求
app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/**', (c) => {
  // 唤醒我们在 auth.ts 中写好的引擎，并把数据库连接 (c.env) 喂给它
  const auth = createAuth(c.env);
  
  // Hono 非常轻量，c.req.raw 就是最标准的 Web Request 对象
  // better-auth 底层完全基于 Web 标准，所以可以直接无缝接管
  return auth.handler(c.req.raw);
});

export default app;
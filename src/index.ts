import { Hono } from 'hono';
import { cors } from 'hono/cors'; // 👈 新增：引入 Hono 自带的 cors 中间件
import { createAuth } from './auth.runtime';

// 1. 定义 Cloudflare 的环境变量类型，享受完美的 TypeScript 提示
type Bindings = {
  DB: D1Database;
  RESEND_API_KEY: string;
  ACCOUNT_URL: string;
  DEV_RESET_LINK?: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

// 2. 实例化 Hono，并注入环境变量类型
const app = new Hono<{ Bindings: Bindings }>();

const PROD_ORIGIN = 'https://account.matsubarasoda.com';
const LOCAL_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
let runtimeAuth: ReturnType<typeof createAuth> | null = null;

function getAuth(bindings: Bindings): ReturnType<typeof createAuth> {
  if (!runtimeAuth) {
    runtimeAuth = createAuth(bindings);
  }
  return runtimeAuth;
}

// 🌟 CORS：线上仅允许生产域名；本地 wrangler dev 允许 5173
app.use('/api/auth/*', cors({
  origin: (origin, c) => {
    const requestHost = new URL(c.req.url).hostname;
    const isLocalRuntime = requestHost === 'localhost' || requestHost === '127.0.0.1';

    if (origin === PROD_ORIGIN) return origin;
    if (isLocalRuntime && origin && LOCAL_ORIGINS.has(origin)) return origin;

    return '';
  },
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
  // 使用 isolate 级缓存，避免每个请求重复初始化认证引擎
  const auth = getAuth(c.env);
  
  // Hono 非常轻量，c.req.raw 就是最标准的 Web Request 对象
  // better-auth 底层完全基于 Web 标准，所以可以直接无缝接管
  return auth.handler(c.req.raw);
});

export default app;
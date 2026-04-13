import { Hono } from 'hono';
import { createAuth } from './auth';

// 1. 定义 Cloudflare 的环境变量类型，享受完美的 TypeScript 提示
type Bindings = {
  DB: D1Database;
};

// 2. 实例化 Hono，并注入环境变量类型
const app = new Hono<{ Bindings: Bindings }>();

// 3. 根目录测试路由：用于检测微服务是否存活
app.get('/', (c) => {
  return c.text('Hello Hono! Auth Microservice is running 🚀');
});

// 4. 【核心路由】将所有与认证相关的请求，全部拦截并交给 better-auth 处理
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  // 唤醒我们在 auth.ts 中写好的引擎，并把数据库连接 (c.env) 喂给它
  const auth = createAuth(c.env);
  
  // Hono 非常轻量，c.req.raw 就是最标准的 Web Request 对象
  // better-auth 底层完全基于 Web 标准，所以可以直接无缝接管
  return auth.handler(c.req.raw);
});

export default app;